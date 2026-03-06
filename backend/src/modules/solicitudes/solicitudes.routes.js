import { requireRoles, ROLES } from '../../middleware/roles.js'
import { listar, crear, actualizarEstado } from './solicitudes.controller.js'

export default async function solicitudesRoutes(fastify) {
    const todos = { preHandler: [requireRoles(...ROLES.TODOS)] }
    const escritura = { preHandler: [requireRoles(...ROLES.ESCRITURA)] }
    const tutores = { preHandler: [requireRoles('tutor', 'tutor_especial', ...ROLES.ESCRITURA)] }

    fastify.get('/', todos, listar)
    fastify.post('/', tutores, crear)
    fastify.patch('/:id/estado', escritura, actualizarEstado)
}
