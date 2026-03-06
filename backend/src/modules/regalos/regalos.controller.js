import { ok, created, noContent, notFound, paginated } from '../../utils/response.js'
import { getPagination } from '../../utils/pagination.js'

export async function listar(request, reply) {
    const { page, limit, skip } = getPagination(request.query)
    const { infanteId, tipo, estado, anio } = request.query
    const db = request.server.db

    const where = {}
    if (infanteId) where.infanteId = parseInt(infanteId)
    if (tipo) where.tipo = tipo
    if (estado) where.estado = estado
    if (anio) where.anio = parseInt(anio)

    const [total, regalos] = await Promise.all([
        db.regalo.count({ where }),
        db.regalo.findMany({
            where, skip, take: limit,
            include: { infante: { include: { persona: true } } },
            orderBy: [{ anio: 'desc' }, { tipo: 'asc' }]
        })
    ])
    return paginated(reply, regalos, total, page, limit)
}

// GET /regalos/pendientes?anio=2026&tipo=kit_escolar
export async function pendientes(request, reply) {
    const db = request.server.db
    const anio = parseInt(request.query.anio || new Date().getFullYear())
    const tipo = request.query.tipo

    const where = { anio, estado: 'pendiente' }
    if (tipo) where.tipo = tipo

    const regalos = await db.regalo.findMany({
        where,
        include: { infante: { include: { persona: true } } },
        orderBy: { infante: { persona: { apellidos: 'asc' } } }
    })
    return ok(reply, regalos, { anio, total: regalos.length })
}

export async function crear(request, reply) {
    const db = request.server.db
    const regalo = await db.regalo.create({
        data: {
            ...request.body,
            anio: request.body.anio || new Date().getFullYear()
        },
        include: { infante: { include: { persona: true } } }
    })
    return created(reply, regalo)
}

export async function actualizar(request, reply) {
    const db = request.server.db
    try {
        const regalo = await db.regalo.update({
            where: { id: parseInt(request.params.id) },
            data: request.body
        })
        return ok(reply, regalo)
    } catch { return notFound(reply) }
}

export async function eliminar(request, reply) {
    const db = request.server.db
    try {
        await db.regalo.delete({ where: { id: parseInt(request.params.id) } })
        return noContent(reply)
    } catch { return notFound(reply) }
}
