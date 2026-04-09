import { requireRoles, ROLES } from '../../middleware/roles.js'
import {
    listar, obtener, crear, actualizar, eliminar,
    subirFoto, sinVisitaAnio, actualizarUbicacion
} from './infantes.controller.js'

export default async function infantesRoutes(fastify) {
    const todos = { preHandler: [requireRoles(...ROLES.TODOS)] }
    const escritura = { preHandler: [requireRoles(...ROLES.ESCRITURA)] }
    const superAdmins = { preHandler: [requireRoles(...ROLES.SUPER_ADMINS)] }

    fastify.get('/', todos, listar)
    fastify.get('/sin-visita-anio', todos, sinVisitaAnio)
    fastify.get('/:id', todos, obtener)
    fastify.post('/', escritura, crear)
    fastify.put('/:id', escritura, actualizar)
    fastify.delete('/:id', superAdmins, eliminar)

    // Subida de foto — multipart
    fastify.post('/:id/foto', escritura, subirFoto)

    // Ubicación GPS — accesible por todos (especialmente tutores en el campo)
    fastify.patch('/:id/ubicacion', todos, actualizarUbicacion)
}

