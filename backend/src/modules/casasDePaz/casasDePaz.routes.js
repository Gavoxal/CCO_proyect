import { requireRoles, ROLES } from '../../middleware/roles.js'
import { listarCasas, crearCasa, actualizarCasa, eliminarCasa } from '../shared.controller.js'

export default async function casasDePazRoutes(fastify) {
    const soloAdmins = { preHandler: [requireRoles(...ROLES.SOLO_ADMINS)] }
    const escritura = { preHandler: [requireRoles(...ROLES.ESCRITURA)] }

    fastify.get('/', soloAdmins, listarCasas)
    fastify.post('/', escritura, crearCasa)
    fastify.put('/:id', escritura, actualizarCasa)
    fastify.delete('/:id', soloAdmins, eliminarCasa)
}
