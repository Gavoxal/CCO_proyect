import { ok, created, noContent, notFound, badRequest, paginated } from '../../utils/response.js'
import { getPagination } from '../../utils/pagination.js'
import { getSchoolYearRange } from '../../utils/date.js'

// GET /asistencia?infanteId=1&fecha=2026-03-01&tutorId=2
export async function listar(request, reply) {
    const { page, limit, skip } = getPagination(request.query)
    const { infanteId, fecha, fechaInicio, fechaFin, estado, tutorId, esPatrocinado } = request.query
    const db = request.server.db

    const where = {}
    if (infanteId) where.infanteId = parseInt(infanteId)
    if (estado) where.estado = estado
    
    // Filtro por patrocinio
    if (esPatrocinado !== undefined && esPatrocinado !== 'all') {
        where.infante = { ...where.infante, esPatrocinado: esPatrocinado === 'true' }
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

    // Añadir totales agrupados para compatibilidad con dashboards simples
    summary.totalPresentes = summary.Mes + summary.Semana + summary.PagoDia + summary.Pendiente + summary.Punto
    summary.totalInfantesAtendidos = totalInfantesDiferentes

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
        select: { id: true }
    })

    // 2. Crear un mapa de los registros enviados por el frontend
    const registrosMap = new Map(registros.map(r => [r.infanteId, r.estado]))

    // 3. Crear operaciones upsert para CADA infante
    const ops = todosLosInfantes.map(infante => {
        const estado = registrosMap.get(infante.id) || 'Ausente'
        return db.asistencia.upsert({
            where: {
                infanteId_fecha: { infanteId: infante.id, fecha: fechaDate }
            },
            update: { estado },
            create: { infanteId: infante.id, fecha: fechaDate, estado }
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

    return ok(reply, { label: `${start.getFullYear()}-${end.getFullYear()}`, total, presentes, ausentes, justificados })
}
