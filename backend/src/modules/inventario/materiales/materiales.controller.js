import { ok, created, noContent, notFound, paginated } from '../../../utils/response.js'
import { getPagination } from '../../../utils/pagination.js'

// GET /inventario/materiales
export async function listar(request, reply) {
    const { page, limit, skip } = getPagination(request.query)
    const { buscar, fuenteRecurso, stockBajo } = request.query
    const db = request.server.db

    const where = {}
    if (buscar) where.nombreMaterial = { contains: buscar }
    if (fuenteRecurso) where.fuenteRecurso = fuenteRecurso
    if (stockBajo === 'true') {
        where.cantidadDisponible = { lte: db.inventarioMaterial.fields.stockMinimo }
    }

    const [total, items] = await Promise.all([
        db.inventarioMaterial.count({ where }),
        db.inventarioMaterial.findMany({ where, skip, take: limit, orderBy: { nombreMaterial: 'asc' } })
    ])

    // Marcar items con stock bajo
    const itemsMarcados = items.map(item => ({
        ...item,
        stockBajo: item.cantidadDisponible <= item.stockMinimo
    }))

    return paginated(reply, itemsMarcados, total, page, limit)
}

export async function obtener(request, reply) {
    const db = request.server.db
    const item = await db.inventarioMaterial.findUnique({ where: { id: parseInt(request.params.id) } })
    if (!item) return notFound(reply)
    return ok(reply, item)
}

export async function crear(request, reply) {
    const db = request.server.db
    const data = { ...request.body, fechaUltimaActualizacion: new Date() }
    const item = await db.inventarioMaterial.create({ data })
    return created(reply, item)
}

export async function actualizar(request, reply) {
    const db = request.server.db
    const id = parseInt(request.params.id)
    try {
        const item = await db.inventarioMaterial.update({
            where: { id },
            data: { ...request.body, fechaUltimaActualizacion: new Date() }
        })
        return ok(reply, item)
    } catch {
        return notFound(reply)
    }
}

// PATCH /materiales/:id/despachar  — reduce stock
export async function despachar(request, reply) {
    const db = request.server.db
    const id = parseInt(request.params.id)
    const cantidad = parseInt(request.body.cantidad)

    const item = await db.inventarioMaterial.findUnique({ where: { id } })
    if (!item) return notFound(reply)

    if (item.cantidadDisponible < cantidad) {
        return reply.status(409).send({
            error: 'Stock insuficiente',
            disponible: item.cantidadDisponible
        })
    }

    const actualizado = await db.inventarioMaterial.update({
        where: { id },
        data: {
            cantidadDisponible: { decrement: cantidad },
            fechaUltimaActualizacion: new Date()
        }
    })
    return ok(reply, actualizado)
}

// PATCH /materiales/:id/ingresar  — aumenta stock
export async function ingresar(request, reply) {
    const db = request.server.db
    const id = parseInt(request.params.id)
    const cantidad = parseInt(request.body.cantidad)

    try {
        const actualizado = await db.inventarioMaterial.update({
            where: { id },
            data: {
                cantidadDisponible: { increment: cantidad },
                fechaUltimaActualizacion: new Date()
            }
        })
        return ok(reply, actualizado)
    } catch {
        return notFound(reply)
    }
}

// GET /materiales/alertas  — stock bajo o sin actualizar > 30 días
export async function alertas(request, reply) {
    const db = request.server.db
    const diasUmbral = parseInt(process.env.INVENTORY_STALE_DAYS || '30')
    const fechaLimite = new Date()
    fechaLimite.setDate(fechaLimite.getDate() - diasUmbral)

    const [stockBajo, desactualizados] = await Promise.all([
        db.inventarioMaterial.findMany({
            where: { cantidadDisponible: { lte: 5 } }  // fallback simple
        }),
        db.inventarioMaterial.findMany({
            where: { fechaUltimaActualizacion: { lt: fechaLimite } }
        })
    ])

    return ok(reply, {
        stockBajo: stockBajo.map(i => ({ ...i, razon: 'Stock bajo' })),
        desactualizados: desactualizados.map(i => ({ ...i, razon: `Sin actualizar hace +${diasUmbral} días` }))
    })
}

export async function eliminar(request, reply) {
    const db = request.server.db
    try {
        await db.inventarioMaterial.delete({ where: { id: parseInt(request.params.id) } })
        return noContent(reply)
    } catch {
        return notFound(reply)
    }
}
