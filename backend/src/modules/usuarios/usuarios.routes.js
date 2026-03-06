import { requireRoles, ROLES } from '../../middleware/roles.js'
import { listar, obtener, crear, actualizar, eliminar } from './usuarios.controller.js'

export default async function usuariosRoutes(fastify) {
    const soloAdmins = { preHandler: [requireRoles(...ROLES.SOLO_ADMINS)] }
    const escritura = { preHandler: [requireRoles(...ROLES.ESCRITURA)] }

    fastify.get('/', soloAdmins, listar)
    fastify.get('/:id', soloAdmins, obtener)
    fastify.post('/', soloAdmins, crear)
    fastify.put('/:id', escritura, actualizar)
    fastify.delete('/:id', soloAdmins, eliminar)
}
