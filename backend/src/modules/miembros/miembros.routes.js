import { requireRoles, ROLES } from '../../middleware/roles.js'
import { listarMiembros, crearMiembro, actualizarMiembro, eliminarMiembro } from '../shared.controller.js'

export default async function miembrosRoutes(fastify) {
    const todos = { preHandler: [requireRoles(...ROLES.TODOS)] }
    const escritura = { preHandler: [requireRoles(...ROLES.ESCRITURA)] }
    const soloAdmins = { preHandler: [requireRoles(...ROLES.SOLO_ADMINS)] }

    fastify.get('/', soloAdmins, listarMiembros)
    fastify.post('/', escritura, crearMiembro)
    fastify.put('/:id', escritura, actualizarMiembro)
    fastify.delete('/:id', soloAdmins, eliminarMiembro)
}
