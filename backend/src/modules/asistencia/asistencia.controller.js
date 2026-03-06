import { ok, created, noContent, notFound, badRequest, paginated } from '../../utils/response.js'
import { getPagination } from '../../utils/pagination.js'

// GET /asistencia?infanteId=1&fecha=2026-03-01&tutorId=2
export async function listar(request, reply) {
    const { page, limit, skip } = getPagination(request.query)
    const { infanteId, fecha, estado, tutorId } = request.query
    const db = request.server.db

    const where = {}
    if (infanteId) where.infanteId = parseInt(infanteId)
    if (estado) where.estado = estado
    if (fecha) where.fecha = new Date(fecha)
    if (tutorId) {
        where.infante = { tutorId: parseInt(tutorId) }
    }

    const [total, registros] = await Promise.all([
        db.asistencia.count({ where }),
        db.asistencia.findMany({
            where, skip, take: limit,
            include: {
                infante: { include: { persona: true } }
            },
            orderBy: [{ fecha: 'desc' }, { infante: { persona: { apellidos: 'asc' } } }]
        })
    ])

    return paginated(reply, registros, total, page, limit)
}

// POST /asistencia — registrar asistencia bulk por fecha
export async function registrarBulk(request, reply) {
    const { fecha, registros } = request.body
    const db = request.server.db

    if (!fecha || !Array.isArray(registros) || registros.length === 0) {
        return badRequest(reply, 'Se require fecha y un arreglo de registros')
    }

    const fechaDate = new Date(fecha)

    const ops = registros.map(r =>
        db.asistencia.upsert({
            where: {
                infanteId_fecha: { infanteId: r.infanteId, fecha: fechaDate }
            },
            update: { estado: r.estado },
            create: { infanteId: r.infanteId, fecha: fechaDate, estado: r.estado }
        })
    )

    const resultado = await db.$transaction(ops)
    return created(reply, { registrados: resultado.length, fecha })
}

// GET /asistencia/resumen?infanteId=1&anio=2026
export async function resumen(request, reply) {
    const { infanteId, anio } = request.query
    const db = request.server.db
    const yr = parseInt(anio || new Date().getFullYear())

    const inicio = new Date(`${yr}-01-01`)
    const fin = new Date(`${yr}-12-31`)

    const [total, presentes, ausentes, justificados] = await Promise.all([
        db.asistencia.count({ where: { infanteId: parseInt(infanteId), fecha: { gte: inicio, lte: fin } } }),
        db.asistencia.count({ where: { infanteId: parseInt(infanteId), fecha: { gte: inicio, lte: fin }, estado: 'Presente' } }),
        db.asistencia.count({ where: { infanteId: parseInt(infanteId), fecha: { gte: inicio, lte: fin }, estado: 'Ausente' } }),
        db.asistencia.count({ where: { infanteId: parseInt(infanteId), fecha: { gte: inicio, lte: fin }, estado: 'Justificado' } })
    ])

    return ok(reply, { anio: yr, total, presentes, ausentes, justificados })
}
