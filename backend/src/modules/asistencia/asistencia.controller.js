import { ok, created, noContent, notFound, badRequest, paginated } from '../../utils/response.js'
import { getPagination } from '../../utils/pagination.js'
import { getSchoolYearRange } from '../../utils/date.js'

// GET /asistencia?infanteId=1&fecha=2026-03-01&tutorId=2
export async function listar(request, reply) {
    const { page, limit, skip } = getPagination(request.query)
    const { infanteId, fecha, fechaInicio, fechaFin, estado, tutorId, esPatrocinado, tipoPrograma } = request.query
    const db = request.server.db

    const where = {}
    if (infanteId) where.infanteId = parseInt(infanteId)
    if (estado) where.estado = estado
    
    // Filtro por patrocinio
    if (esPatrocinado !== undefined && esPatrocinado !== 'all') {
        where.infante = { ...where.infante, esPatrocinado: esPatrocinado === 'true' }
    }

    // Filtro por tipo de programa del infante
    if (tipoPrograma) {
        const tpFilter = tipoPrograma === 'Comedor'
            ? { in: ['Comedor', 'Ambos'] }
            : tipoPrograma;
        where.infante = { ...where.infante, tipoPrograma: tpFilter }
    }
    
    if (fecha) {
        // Normalizar a UTC 00:00:00 para coincidir con el tipo @db.Date de Prisma/MySQL
        where.fecha = new Date(fecha + 'T00:00:00.000Z')
    } else if (fechaInicio || fechaFin) {
        where.fecha = {}
        if (fechaInicio) where.fecha.gte = new Date(fechaInicio + 'T00:00:00.000Z')
        if (fechaFin) where.fecha.lte = new Date(fechaFin + 'T00:00:00.000Z')
    }

    if (tutorId) {
        where.infante = { tutorId: parseInt(tutorId) }
    }

    const [total, registros, summaryRaw, uniqueInfantesRaw] = await Promise.all([
        db.asistencia.count({ where }),
        db.asistencia.findMany({
            where, skip, take: limit,
            include: {
                infante: { include: { persona: true } }
            },
            orderBy: [{ fecha: 'desc' }, { infante: { persona: { apellidos: 'asc' } } }]
        }),
        db.asistencia.groupBy({
            by: ['estado'],
            where,
            _count: { estado: true }
        }),
        db.asistencia.groupBy({
            by: ['infanteId'],
            where: { 
                ...where,
                estado: { in: ['Mes', 'Semana', 'PagoDia', 'Pendiente', 'Punto'] }
            }
        })
    ])

    const totalInfantesDiferentes = uniqueInfantesRaw.length

    const summary = { Mes: 0, Semana: 0, PagoDia: 0, Pendiente: 0, Punto: 0, Ausente: 0 }
    summaryRaw.forEach(item => {
        summary[item.estado] = item._count.estado
    })

    // Totales agrupados y financieros para la vista diaria / rango
    summary.totalPresentes = summary.Mes + summary.Semana + summary.PagoDia + summary.Pendiente + summary.Punto
    summary.totalInfantesAtendidos = totalInfantesDiferentes

    let totalRecaudado = 0
    let totalDebiendo = 0
    registros.forEach(r => {
        const pagado = parseFloat(r.montoPagado !== null && r.montoPagado !== undefined ? r.montoPagado : (r.estado === 'PagoDia' ? (r.infante?.tarifaDiaria || 0.60) : 0))
        const tarifa = parseFloat(r.infante?.tarifaDiaria || 0.60)
        totalRecaudado += pagado
        if (r.estado === 'Pendiente') {
            totalDebiendo += Math.max(0, tarifa - pagado)
        }
    })
    summary.totalRecaudado = Math.round(totalRecaudado * 100) / 100
    summary.totalDebiendo = Math.round(totalDebiendo * 100) / 100

    return paginated(reply, registros, total, page, limit, summary)
}

// POST /asistencia — registrar asistencia bulk por fecha
export async function registrarBulk(request, reply) {
    const { fecha, registros } = request.body
    const db = request.server.db

    if (!fecha || !Array.isArray(registros) || registros.length === 0) {
        return badRequest(reply, 'Se require fecha y un arreglo de registros')
    }

    const fechaDate = new Date(fecha + 'T00:00:00.000Z')

    // 1. Obtener todos los infantes para asegurar que todos tengan registro (inasistencia por defecto)
    const todosLosInfantes = await db.infante.findMany({
        select: { id: true, tarifaDiaria: true }
    })

    // 2. Crear un mapa de los registros enviados por el frontend (admite tanto objeto como string simple)
    const registrosMap = new Map(registros.map(r => [r.infanteId, r]))

    // 3. Crear operaciones upsert para CADA infante
    const ops = todosLosInfantes.map(infante => {
        const reg = registrosMap.get(infante.id)
        const estado = (typeof reg === 'object' && reg !== null ? reg.estado : reg) || 'Ausente'
        
        let montoPagado = 0.00
        if (typeof reg === 'object' && reg !== null && reg.montoPagado !== undefined && reg.montoPagado !== null) {
            montoPagado = parseFloat(reg.montoPagado) || 0.00
        } else if (estado === 'PagoDia') {
            montoPagado = parseFloat(infante.tarifaDiaria || 0.60)
        }

        return db.asistencia.upsert({
            where: {
                infanteId_fecha: { infanteId: infante.id, fecha: fechaDate }
            },
            update: { estado, montoPagado },
            create: { infanteId: infante.id, fecha: fechaDate, estado, montoPagado }
        })
    })

    const resultado = await db.$transaction(ops)
    return created(reply, { registrados: resultado.length, fecha })
}

// GET /asistencia/resumen?infanteId=1&anio=2025
export async function resumen(request, reply) {
    const { infanteId, anio } = request.query
    const db = request.server.db
    
    // Si se pasa anio=2025, calculamos para el Año Lectivo que empieza en 2025-07-01
    // Si no se pasa, usamos el Año Lectivo actual
    let range;
    if (anio) {
        const startYear = parseInt(anio);
        range = {
            start: new Date(startYear, 6, 1),
            end: new Date(startYear + 1, 5, 30, 23, 59, 59)
        };
    } else {
        range = getSchoolYearRange();
    }

    const { start, end } = range;

    const [total, presentesC, ausentes] = await Promise.all([
        db.asistencia.count({ where: { infanteId: parseInt(infanteId), fecha: { gte: start, lte: end } } }),
        db.asistencia.count({ 
            where: { 
                infanteId: parseInt(infanteId), 
                fecha: { gte: start, lte: end }, 
                estado: { in: ['Mes', 'Semana', 'PagoDia', 'Pendiente', 'Punto'] } 
            } 
        }),
        db.asistencia.count({ where: { infanteId: parseInt(infanteId), fecha: { gte: start, lte: end }, estado: 'Ausente' } })
    ])

    return ok(reply, { label: `${start.getFullYear()}-${end.getFullYear()}`, total, presentes: presentesC, ausentes, justificados: 0 })
}

// PATCH /asistencia/pagar-deuda/:infanteId
export async function pagarDeuda(request, reply) {
    const db = request.server.db
    const infanteId = parseInt(request.params.infanteId)
    const { monto } = request.body || {}

    if (isNaN(infanteId)) {
        return badRequest(reply, 'ID de infante inválido')
    }

    try {
        const infante = await db.infante.findUnique({
            where: { id: infanteId },
            select: { id: true, tarifaDiaria: true, persona: true }
        })

        if (!infante) return notFound(reply, 'Infante no encontrado')

        const tarifa = parseFloat(infante.tarifaDiaria || 0.60)

        // Si no se pasa monto o monto <= 0: se paga la deuda completa
        if (!monto || parseFloat(monto) <= 0) {
            const resultado = await db.asistencia.updateMany({
                where: {
                    infanteId,
                    estado: 'Pendiente'
                },
                data: {
                    estado: 'PagoDia',
                    montoPagado: tarifa
                }
            })

            return ok(reply, {
                mensaje: `Se han pagado totalmente ${resultado.count} registros de asistencia`,
                actualizados: resultado.count,
                pagadoTotal: true
            })
        }

        // Si se pasa un abono parcial: aplicar con algoritmo FIFO (deudas más antiguas primero)
        let rem = Math.round(parseFloat(monto) * 100) / 100

        const asistenciasPendientes = await db.asistencia.findMany({
            where: {
                infanteId,
                estado: 'Pendiente'
            },
            orderBy: { fecha: 'asc' }
        })

        if (asistenciasPendientes.length === 0) {
            return ok(reply, {
                mensaje: 'El infante no tiene deudas pendientes',
                actualizados: 0
            })
        }

        const ops = []
        let diasCancelados = 0
        let diasAbonados = 0

        for (const a of asistenciasPendientes) {
            if (rem <= 0) break

            const pagadoAct = parseFloat(a.montoPagado || 0)
            const deudaDia = Math.max(0, tarifa - pagadoAct)

            if (deudaDia <= 0) {
                ops.push(db.asistencia.update({
                    where: { id: a.id },
                    data: { estado: 'PagoDia', montoPagado: tarifa }
                }))
                diasCancelados++
                continue
            }

            if (rem >= deudaDia) {
                ops.push(db.asistencia.update({
                    where: { id: a.id },
                    data: { estado: 'PagoDia', montoPagado: tarifa }
                }))
                rem = Math.round((rem - deudaDia) * 100) / 100
                diasCancelados++
            } else {
                const nuevoPagado = Math.round((pagadoAct + rem) * 100) / 100
                ops.push(db.asistencia.update({
                    where: { id: a.id },
                    data: { montoPagado: nuevoPagado }
                }))
                rem = 0
                diasAbonados++
            }
        }

        if (ops.length > 0) {
            await db.$transaction(ops)
        }

        // Obtener saldo remanente para respuesta
        const pendientesActualizados = await db.asistencia.findMany({
            where: { infanteId, estado: 'Pendiente' },
            select: { montoPagado: true }
        })
        const saldoRestante = pendientesActualizados.reduce((acc, a) => {
            return acc + Math.max(0, tarifa - parseFloat(a.montoPagado || 0))
        }, 0)

        return ok(reply, {
            mensaje: `Abono de $${parseFloat(monto).toFixed(2)} registrado con éxito. Días saldados: ${diasCancelados}${diasAbonados > 0 ? `, Días abonados: ${diasAbonados}` : ''}`,
            diasCancelados,
            diasAbonados,
            saldoRestante: Math.round(saldoRestante * 100) / 100
        })
    } catch (error) {
        request.server.log.error('Error al pagar deuda de asistencia:', error)
        return reply.status(500).send({
            success: false,
            error: 'Error interno al procesar el pago'
        })
    }
}

// DELETE /asistencia/fecha/:fecha — elimina TODOS los registros de una fecha
export async function eliminarFecha(request, reply) {
    const { fecha } = request.params
    const db = request.server.db

    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return badRequest(reply, 'Fecha inválida. Formato esperado: YYYY-MM-DD')
    }

    const fechaDate = new Date(fecha + 'T00:00:00.000Z')

    const resultado = await db.asistencia.deleteMany({
        where: { fecha: fechaDate }
    })

    return ok(reply, {
        mensaje: `Se eliminaron ${resultado.count} registros del ${fecha}`,
        eliminados: resultado.count,
        fecha
    })
}

// PATCH /asistencia/:infanteId/:fecha — actualiza o crea un registro individual
export async function actualizarRegistro(request, reply) {
    const { infanteId, fecha } = request.params
    const { estado, montoPagado } = request.body
    const db = request.server.db

    const id = parseInt(infanteId)
    if (isNaN(id)) return badRequest(reply, 'infanteId inválido')
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return badRequest(reply, 'Fecha inválida')
    const estadosValidos = ['Mes', 'Semana', 'PagoDia', 'Pendiente', 'Punto', 'Ausente']
    if (!estadosValidos.includes(estado)) return badRequest(reply, 'Estado inválido')

    const infante = await db.infante.findUnique({
        where: { id },
        select: { tarifaDiaria: true }
    })

    let monto = 0.00
    if (montoPagado !== undefined && montoPagado !== null) {
        monto = parseFloat(montoPagado) || 0.00
    } else if (estado === 'PagoDia') {
        monto = parseFloat(infante?.tarifaDiaria || 0.60)
    }

    const fechaDate = new Date(fecha + 'T00:00:00.000Z')

    const registro = await db.asistencia.upsert({
        where: { infanteId_fecha: { infanteId: id, fecha: fechaDate } },
        update: { estado, montoPagado: monto },
        create: { infanteId: id, fecha: fechaDate, estado, montoPagado: monto }
    })

    return ok(reply, registro)
}

