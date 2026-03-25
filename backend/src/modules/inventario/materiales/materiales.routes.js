import { requireRoles, ROLES } from '../../../middleware/roles.js'
import {
    listar, obtener, crear, actualizar, eliminar,
    despachar, ingresar, alertas
} from './materiales.controller.js'

export default async function materialesRoutes(fastify) {
    const todos = { preHandler: [requireRoles(...ROLES.TODOS)] }
    const inventario = { preHandler: [requireRoles(...ROLES.INVENTARIO)] }
    const superAdmins = { preHandler: [requireRoles(...ROLES.SUPER_ADMINS)] }

    fastify.get('/', todos, listar)
    fastify.get('/alertas', todos, alertas)
    fastify.get('/:id', todos, obtener)
    fastify.post('/', inventario, crear)
    fastify.put('/:id', inventario, actualizar)
    fastify.patch('/:id/despachar', inventario, despachar)
    fastify.patch('/:id/ingresar', inventario, ingresar)
    fastify.delete('/:id', superAdmins, eliminar)
}

