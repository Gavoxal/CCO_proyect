import { obtenerMisNotificaciones, marcarComoLeida, marcarTodasComoLeidas } from './notificaciones.controller.js'
// All authenticated users can access their own notifications, so no special role guard needed beyond basic auth
// We can use the TODOS group or just rely on the plugin which requires auth by default on module level.
import { requireRoles, ROLES } from '../../middleware/roles.js'

export default async function notificacionesRoutes(fastify) {
    // Only logged in users (any role)
    const options = { preHandler: [requireRoles(...ROLES.TODOS)] }

    fastify.get('/', options, obtenerMisNotificaciones)
    fastify.put('/:id/leida', options, marcarComoLeida)
    fastify.put('/leidas', options, marcarTodasComoLeidas)
}
