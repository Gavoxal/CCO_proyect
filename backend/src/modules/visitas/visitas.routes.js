import { requireRoles, ROLES } from '../../middleware/roles.js'
import { listar, obtener, crear, eliminar } from './visitas.controller.js'

export default async function visitasRoutes(fastify) {
    const todos = { preHandler: [requireRoles(...ROLES.TODOS)] }
    const escritura = { preHandler: [requireRoles(...ROLES.ESCRITURA)] }
    const soloAdmins = { preHandler: [requireRoles(...ROLES.SOLO_ADMINS)] }

    fastify.get('/', todos, listar)
    fastify.get('/:id', todos, obtener)
    fastify.post('/', escritura, crear)
    fastify.delete('/:id', soloAdmins, eliminar)
}
