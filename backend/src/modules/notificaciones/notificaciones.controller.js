import { notificationService } from '../../services/notification.service.js'
import { ok } from '../../utils/response.js'

export async function obtenerMisNotificaciones(request, reply) {
    const { soloNoLeidas } = request.query
    // user.id comes from Fastify JWT auth decoration
    const notificaciones = await notificationService.obtenerMisNotificaciones(
        request.user.id,
        soloNoLeidas === 'true'
    )
    return ok(reply, notificaciones)
}

export async function marcarComoLeida(request, reply) {
    const { id } = request.params
    await notificationService.marcarComoLeida(id, request.user.id)
    return ok(reply, { success: true })
}

export async function marcarTodasComoLeidas(request, reply) {
    await notificationService.marcarTodasComoLeidas(request.user.id)
    return ok(reply, { success: true })
}
