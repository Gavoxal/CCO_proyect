import { ok, created, noContent, notFound, paginated } from '../../../utils/response.js'
import { getPagination } from '../../../utils/pagination.js'

export async function listar(request, reply) {
    const { page, limit, skip } = getPagination(request.query)
    const { buscar } = request.query
    const db = request.server.db

    const where = buscar ? { nombreAlimento: { contains: buscar } } : {}
    const [total, items] = await Promise.all([
        db.inventarioAlimento.count({ where }),
        db.inventarioAlimento.findMany({ where, skip, take: limit, orderBy: { nombreAlimento: 'asc' } })
    ])

    const itemsMarcados = items.map(i => ({ ...i, stockBajo: i.cantidadDisponible <= i.stockMinimo }))
    return paginated(reply, itemsMarcados, total, page, limit)
}

export async function obtener(request, reply) {
    const db = request.server.db
    const item = await db.inventarioAlimento.findUnique({ where: { id: parseInt(request.params.id) } })
    if (!item) return notFound(reply)
    return ok(reply, item)
}

export async function crear(request, reply) {
    const db = request.server.db
    const item = await db.inventarioAlimento.create({
        data: { ...request.body, fechaUltimaActualizacion: new Date() }
    })
    return created(reply, item)
}

export async function actualizar(request, reply) {
    const db = request.server.db
    try {
        const item = await db.inventarioAlimento.update({
            where: { id: parseInt(request.params.id) },
            data: { ...request.body, fechaUltimaActualizacion: new Date() }
        })
        return ok(reply, item)
    } catch { return notFound(reply) }
}

export async function despachar(request, reply) {
    const db = request.server.db
    const id = parseInt(request.params.id)
    const cantidad = parseInt(request.body.cantidad)

    const item = await db.inventarioAlimento.findUnique({ where: { id } })
    if (!item) return notFound(reply)
    if (item.cantidadDisponible < cantidad) {
        return reply.status(409).send({ error: 'Stock insuficiente', disponible: item.cantidadDisponible })
    }

    const actualizado = await db.inventarioAlimento.update({
        where: { id },
        data: { cantidadDisponible: { decrement: cantidad }, fechaUltimaActualizacion: new Date() }
    })
    return ok(reply, actualizado)
}

export async function ingresar(request, reply) {
    const db = request.server.db
    try {
        const actualizado = await db.inventarioAlimento.update({
            where: { id: parseInt(request.params.id) },
            data: { cantidadDisponible: { increment: parseInt(request.body.cantidad) }, fechaUltimaActualizacion: new Date() }
        })
        return ok(reply, actualizado)
    } catch { return notFound(reply) }
}

export async function eliminar(request, reply) {
    const db = request.server.db
    try {
        await db.inventarioAlimento.delete({ where: { id: parseInt(request.params.id) } })
        return noContent(reply)
    } catch { return notFound(reply) }
}
