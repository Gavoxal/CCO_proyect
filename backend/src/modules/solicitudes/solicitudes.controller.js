import { ok, created, noContent, notFound, paginated } from '../../utils/response.js'
import { getPagination } from '../../utils/pagination.js'

export async function listar(request, reply) {
    const { page, limit, skip } = getPagination(request.query)
    const { estado, tutorId } = request.query
    const db = request.server.db

    const where = {}
    if (estado) where.estado = estado
    if (tutorId) where.tutorId = parseInt(tutorId)

    const [total, solicitudes] = await Promise.all([
        db.solicitudMaterial.count({ where }),
        db.solicitudMaterial.findMany({
            where, skip, take: limit,
            include: {
                tutor: { include: { persona: true } },
                material: true
            },
            orderBy: { fechaSolicitud: 'desc' }
        })
    ])
    return paginated(reply, solicitudes, total, page, limit)
}

export async function crear(request, reply) {
    const db = request.server.db
    const { tutorId, materialId, cantidadSolicitada, observacion } = request.body
    const solicitud = await db.solicitudMaterial.create({
        data: { tutorId: tutorId ? parseInt(tutorId) : null, materialId: parseInt(materialId), cantidadSolicitada, observacion },
        include: { material: true }
    })
    return created(reply, solicitud)
}

export async function actualizarEstado(request, reply) {
    const db = request.server.db
    const id = parseInt(request.params.id)
    const estado = request.body.estado

    const estadosValidos = ['Pendiente', 'Aprobada', 'Rechazada', 'Entregada']
    if (!estadosValidos.includes(estado)) {
        return reply.status(400).send({ error: `Estado inválido. Válidos: ${estadosValidos.join(', ')}` })
    }

    try {
        // Si se entrega, descontar del inventario
        if (estado === 'Entregada') {
            const sol = await db.solicitudMaterial.findUnique({
                where: { id }, include: { material: true }
            })
            if (sol && sol.material.cantidadDisponible < sol.cantidadSolicitada) {
                return reply.status(409).send({ error: 'Stock insuficiente para entregar', disponible: sol.material.cantidadDisponible })
            }
            await db.$transaction([
                db.solicitudMaterial.update({ where: { id }, data: { estado } }),
                db.inventarioMaterial.update({
                    where: { id: sol.materialId },
                    data: { cantidadDisponible: { decrement: sol.cantidadSolicitada }, fechaUltimaActualizacion: new Date() }
                })
            ])
            return ok(reply, { mensaje: 'Solicitud entregada y stock actualizado' })
        }

        const actualizada = await db.solicitudMaterial.update({ where: { id }, data: { estado } })
        return ok(reply, actualizada)
    } catch {
        return notFound(reply)
    }
}
