import { requireRoles, ROLES } from '../../middleware/roles.js'
import { listar, obtener, crear, actualizar, eliminar, listarPendientes } from './visitas.controller.js'

export default async function visitasRoutes(fastify) {
    const todos = { preHandler: [requireRoles(...ROLES.TODOS)] }
    const eliminarVisita = { preHandler: [requireRoles('admin', 'director', 'secretaria', 'proteccion')] }

    fastify.get('/', todos, listar)
    fastify.get('/pendientes', todos, listarPendientes)
    fastify.get('/:id', todos, obtener)
    // Tutores y tutores especiales pueden registrar visitas
    fastify.post('/', todos, crear)
    fastify.put('/:id', todos, actualizar)
    fastify.delete('/:id', eliminarVisita, eliminar)
}

