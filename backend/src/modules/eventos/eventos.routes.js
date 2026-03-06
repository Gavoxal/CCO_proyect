import { requireRoles, ROLES } from '../../middleware/roles.js'
import { listarEventos, crearEvento, actualizarEvento, eliminarEvento } from '../shared.controller.js'

export default async function eventosRoutes(fastify) {
    const todos = { preHandler: [requireRoles(...ROLES.TODOS)] }
    const escritura = { preHandler: [requireRoles(...ROLES.ESCRITURA)] }
    const soloAdmins = { preHandler: [requireRoles(...ROLES.SOLO_ADMINS)] }

    fastify.get('/', todos, listarEventos)
    fastify.post('/', escritura, crearEvento)
    fastify.put('/:id', escritura, actualizarEvento)
    fastify.delete('/:id', soloAdmins, eliminarEvento)
}
