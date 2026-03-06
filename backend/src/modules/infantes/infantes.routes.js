import { requireRoles, ROLES } from '../../middleware/roles.js'
import {
    listar, obtener, crear, actualizar, eliminar,
    subirFoto, sinVisitaAnio
} from './infantes.controller.js'

export default async function infantesRoutes(fastify) {
    const todos = { preHandler: [requireRoles(...ROLES.TODOS)] }
    const escritura = { preHandler: [requireRoles(...ROLES.ESCRITURA)] }
    const soloAdmins = { preHandler: [requireRoles(...ROLES.SOLO_ADMINS)] }

    fastify.get('/', todos, listar)
    fastify.get('/sin-visita-anio', todos, sinVisitaAnio)
    fastify.get('/:id', todos, obtener)
    fastify.post('/', escritura, crear)
    fastify.put('/:id', escritura, actualizar)
    fastify.delete('/:id', soloAdmins, eliminar)

    // Subida de foto — multipart
    fastify.post('/:id/foto', escritura, subirFoto)
}
