import { ok, created, noContent, notFound, paginated } from '../../utils/response.js'
import { getPagination } from '../../utils/pagination.js'
import { getSchoolYearRange } from '../../utils/date.js'
import fs from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

export async function listar(request, reply) {
    const { page, limit, skip } = getPagination(request.query)
    const { infanteId, anio, fechaInicio, fechaFin, tutorId } = request.query
    const db = request.server.db

    const where = {}
    if (infanteId) where.infanteId = parseInt(infanteId)
    if (tutorId) where.tutorId = parseInt(tutorId)

    if (fechaInicio || fechaFin) {
        where.fecha = {}
        if (fechaInicio) where.fecha.gte = new Date(fechaInicio)
        if (fechaFin) where.fecha.lte = new Date(fechaFin)
    } else if (anio) {
        const yr = parseInt(anio)
        where.fecha = { gte: new Date(`${yr}-01-01`), lte: new Date(`${yr}-12-31`) }
    }

    const [total, visitas] = await Promise.all([
        db.visita.count({ where }),
        db.visita.findMany({
            where, skip, take: limit,
            include: {
                infante: { include: { persona: true } },
                tutor: { include: { persona: true } }
            },
            orderBy: { fecha: 'desc' }
        })
    ])

    // Mapear para el frontend
    const mappedVisitas = visitas.map(v => ({
        ...v,
        visitaExitosa: v.estado === 'Realizada' ? 'SI' : 'NO',
        razon: v.razonVisita === 'OtraCausa' ? 'Otra Causa' : v.razonVisita,
        situacion: v.decision === 'ContinuaMinisterio' ? 'Continuación en el Ministerio' : 
                   (v.decision === 'DarDeBaja' ? 'Dar de Baja' : v.decision),
    }));

    return paginated(reply, mappedVisitas, total, page, limit)
}

export async function obtener(request, reply) {
    const db = request.server.db
    const visita = await db.visita.findUnique({
        where: { id: parseInt(request.params.id) },
        include: {
            infante: { include: { persona: true } },
            tutor: { include: { persona: true } }
        }
    })
    if (!visita) return notFound(reply)
    return ok(reply, visita)
}

export async function crear(request, reply) {
    const db = request.server.db
    // Soporte para multipart (con archivo adjunto) o JSON simple
    let body
    let fotoVisita = null

    if (request.isMultipart()) {
        const parts = request.parts()
        const fields = {}
        for await (const part of parts) {
            if (part.file) {
                const dir = path.join(UPLOAD_DIR, 'visitas')
                await fs.mkdir(dir, { recursive: true })
                const filename = `visita-${Date.now()}-${part.filename}`
                await fs.writeFile(path.join(dir, filename), await part.toBuffer())
                fotoVisita = `/uploads/visitas/${filename}`
            } else {
                fields[part.fieldname] = part.value
            }
        }
        body = fields
    } else {
        body = request.body
    }

    // Mapeo de campos del frontend a Prisma enums
    const razonMap = {
        'Inasistencia': 'Inasistencia',
        'Enfermedad': 'Enfermedad',
        'Otra Causa': 'OtraCausa',
        'Seguimiento': 'Seguimiento'
    };

    const decisionMap = {
        'Continuación en el Ministerio': 'ContinuaMinisterio',
        'Dar de Baja': 'DarDeBaja',
        'Otra': 'Otra'
    };

    try {
        const visita = await db.visita.create({
            data: {
                fecha: new Date(body.fecha),
                estado: body.visitaExitosa === 'SI' ? 'Realizada' : 'NoRealizada',
                razonVisita: razonMap[body.razon] || 'Seguimiento',
                decision: decisionMap[body.situacion] || 'ContinuaMinisterio',
                resultados: body.resultados || null,
                observaciones: body.observaciones || null,
                fotoVisita,
                infanteId: parseInt(body.infanteId),
                tutorId: body.tutorId ? parseInt(body.tutorId) : null
            },
            include: { infante: { include: { persona: true } } }
        })
        return created(reply, visita)
    } catch (error) {
        request.server.log.error('Error al crear visita:', error)
        return reply.status(500).send({ error: 'Error al guardar la visita en la base de datos', details: error.message })
    }
}

export async function actualizar(request, reply) {
    const db = request.server.db
    const id = parseInt(request.params.id)
    
    let body
    let fotoVisita = undefined

    if (request.isMultipart()) {
        const parts = request.parts()
        const fields = {}
        for await (const part of parts) {
            if (part.file) {
                const dir = path.join(UPLOAD_DIR, 'visitas')
                await fs.mkdir(dir, { recursive: true })
                const filename = `visita-${Date.now()}-${part.filename}`
                await fs.writeFile(path.join(dir, filename), await part.toBuffer())
                fotoVisita = `/uploads/visitas/${filename}`
            } else {
                fields[part.fieldname] = part.value
            }
        }
        body = fields
    } else {
        body = request.body
    }

    const razonMap = {
        'Inasistencia': 'Inasistencia',
        'Enfermedad': 'Enfermedad',
        'Otra Causa': 'OtraCausa',
        'Seguimiento': 'Seguimiento'
    }

    const decisionMap = {
        'Continuación en el Ministerio': 'ContinuaMinisterio',
        'Dar de Baja': 'DarDeBaja',
        'Otra': 'Otra'
    }

    try {
        const dataToUpdate = {
            fecha: new Date(body.fecha),
            estado: body.visitaExitosa === 'SI' ? 'Realizada' : 'NoRealizada',
            razonVisita: razonMap[body.razon] || 'Seguimiento',
            decision: decisionMap[body.situacion] || 'ContinuaMinisterio',
            resultados: body.resultados || null,
            observaciones: body.observaciones || null,
            infanteId: parseInt(body.infanteId),
            tutorId: body.tutorId ? parseInt(body.tutorId) : null
        }

        if (fotoVisita !== undefined) {
            dataToUpdate.fotoVisita = fotoVisita
        }

        const visitaActualizada = await db.visita.update({
            where: { id },
            data: dataToUpdate,
            include: { infante: { include: { persona: true } }, tutor: { include: { persona: true } } }
        })
        return ok(reply, visitaActualizada)
    } catch (error) {
        request.server.log.error('Error al actualizar visita:', error)
        return notFound(reply, 'Error al actualizar la visita o no encontrada')
    }
}

export async function eliminar(request, reply) {
    const db = request.server.db
    try {
        await db.visita.delete({ where: { id: parseInt(request.params.id) } })
        return noContent(reply)
    } catch {
        return notFound(reply)
    }
}

// GET /visitas/pendientes?anio=2025
export async function listarPendientes(request, reply) {
    const { page, limit, skip } = getPagination(request.query)
    const { anio } = request.query
    const db = request.server.db

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

    const where = {
        visitas: {
            none: {
                fecha: { gte: start, lte: end },
                estado: 'Realizada' // Solo consideramos pendientes si no han tenido una visita EXITOSA
            }
        }
    };

    const [total, infantes] = await Promise.all([
        db.infante.count({ where }),
        db.infante.findMany({
            where, skip, take: limit,
            include: { persona: true },
            orderBy: { persona: { apellidos: 'asc' } }
        })
    ])

    return paginated(reply, infantes, total, page, limit)
}
