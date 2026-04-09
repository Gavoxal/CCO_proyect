import { requireRoles, ROLES } from '../../middleware/roles.js'
import { getStats } from './dashboard.controller.js'

export default async function dashboardRoutes(fastify) {
    const todos = { preHandler: [requireRoles(...ROLES.TODOS)] }

    fastify.get('/stats', todos, getStats)
}
