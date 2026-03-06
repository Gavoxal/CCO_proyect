import { requireRoles, ROLES } from '../../middleware/roles.js'
import { listar, crear, actualizar, eliminar, pendientes } from './regalos.controller.js'

export default async function regalosRoutes(fastify) {
    const todos = { preHandler: [requireRoles(...ROLES.TODOS)] }
    const escritura = { preHandler: [requireRoles(...ROLES.ESCRITURA)] }
    const soloAdmins = { preHandler: [requireRoles(...ROLES.SOLO_ADMINS)] }

    fastify.get('/', todos, listar)
    fastify.get('/pendientes', todos, pendientes)
    fastify.post('/', escritura, crear)
    fastify.put('/:id', escritura, actualizar)
    fastify.delete('/:id', soloAdmins, eliminar)
}
