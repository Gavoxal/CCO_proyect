/**
 * Helpers de respuesta HTTP estandarizados
 */

export const ok = (reply, data, meta = null) => {
    const response = { success: true, data }
    if (meta) response.meta = meta
    return reply.status(200).send(response)
}

export const created = (reply, data) =>
    reply.status(201).send({ success: true, data })

export const noContent = (reply) =>
    reply.status(204).send()

export const notFound = (reply, message = 'Recurso no encontrado') =>
    reply.status(404).send({ success: false, error: message })

export const badRequest = (reply, message) =>
    reply.status(400).send({ success: false, error: message })

export const paginated = (reply, data, total, page, limit) =>
    reply.status(200).send({
        success: true,
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    })
