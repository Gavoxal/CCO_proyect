import { requireRoles, ROLES } from '../../../middleware/roles.js'
import { listar, obtener, crear, actualizar, eliminar, despachar, ingresar } from './alimentos.controller.js'

export default async function alimentosRoutes(fastify) {
    const todos = { preHandler: [requireRoles(...ROLES.TODOS)] }
    const escritura = { preHandler: [requireRoles(...ROLES.ESCRITURA)] }
    const soloAdmins = { preHandler: [requireRoles(...ROLES.SOLO_ADMINS)] }

    fastify.get('/', todos, listar)
    fastify.get('/:id', todos, obtener)
    fastify.post('/', escritura, crear)
    fastify.put('/:id', escritura, actualizar)
    fastify.patch('/:id/despachar', escritura, despachar)
    fastify.patch('/:id/ingresar', escritura, ingresar)
    fastify.delete('/:id', soloAdmins, eliminar)
}
