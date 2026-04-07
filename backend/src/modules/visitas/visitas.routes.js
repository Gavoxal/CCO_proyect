import { requireRoles, ROLES } from '../../middleware/roles.js'
import { listar, obtener, crear, actualizar, eliminar, listarPendientes } from './visitas.controller.js'

export default async function visitasRoutes(fastify) {
    const todos = { preHandler: [requireRoles(...ROLES.TODOS)] }
    const superAdmins = { preHandler: [requireRoles(...ROLES.SUPER_ADMINS)] }

    fastify.get('/', todos, listar)
    fastify.get('/pendientes', todos, listarPendientes)
    fastify.get('/:id', todos, obtener)
    // Tutores y tutores especiales pueden registrar visitas
    fastify.post('/', todos, crear)
    fastify.put('/:id', todos, actualizar)
    fastify.delete('/:id', todos, eliminar)
}

