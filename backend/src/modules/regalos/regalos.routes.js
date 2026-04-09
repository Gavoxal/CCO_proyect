import { requireRoles, ROLES } from '../../middleware/roles.js'
import { listar, crear, actualizar, eliminar, pendientes, subirFoto, generarLote } from './regalos.controller.js'

export default async function regalosRoutes(fastify) {
    const todos = { preHandler: [requireRoles(...ROLES.TODOS)] }
    const escritura = { preHandler: [requireRoles(...ROLES.ESCRITURA)] }
    const superAdmins = { preHandler: [requireRoles(...ROLES.SUPER_ADMINS)] }

    fastify.get('/', todos, listar)
    fastify.get('/pendientes', todos, pendientes)
    fastify.post('/', escritura, crear)
    fastify.put('/:id', todos, actualizar)
    fastify.post('/:id/foto', todos, subirFoto)
    fastify.post('/generar-lote', escritura, generarLote)
    fastify.delete('/:id', superAdmins, eliminar)
}

