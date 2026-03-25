import { requireRoles, ROLES } from '../../middleware/roles.js'
import { listar, obtener, crear, actualizar, eliminar } from './usuarios.controller.js'

export default async function usuariosRoutes(fastify) {
    const superAdmins = { preHandler: [requireRoles(...ROLES.SUPER_ADMINS)] }
    const escritura = { preHandler: [requireRoles(...ROLES.ESCRITURA)] }

    fastify.get('/', superAdmins, listar)
    fastify.get('/:id', superAdmins, obtener)
    fastify.post('/', superAdmins, crear)
    fastify.put('/:id', escritura, actualizar)
    fastify.delete('/:id', superAdmins, eliminar)
}

