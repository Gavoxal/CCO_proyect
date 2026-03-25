import { requireRoles, ROLES } from '../../middleware/roles.js'
import { listarMiembros, crearMiembro, actualizarMiembro, eliminarMiembro } from '../shared.controller.js'

export default async function miembrosRoutes(fastify) {
    const superAdmins = { preHandler: [requireRoles(...ROLES.SUPER_ADMINS)] }
    const escritura = { preHandler: [requireRoles(...ROLES.ESCRITURA)] }

    fastify.get('/', superAdmins, listarMiembros)
    fastify.post('/', escritura, crearMiembro)
    fastify.put('/:id', escritura, actualizarMiembro)
    fastify.delete('/:id', superAdmins, eliminarMiembro)
}

