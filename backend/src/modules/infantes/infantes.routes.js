import { requireRoles, ROLES } from '../../middleware/roles.js'
import {
    listar, obtener, crear, actualizar, eliminar,
    subirFoto, sinVisitaAnio, actualizarUbicacion
} from './infantes.controller.js'

export default async function infantesRoutes(fastify) {
    const todos = { preHandler: [requireRoles(...ROLES.TODOS)] }
    // Edición completa de infantes: solo administración y coordinación académica.
    const gestionCompletaInfantes = { preHandler: [requireRoles('admin', 'director', 'secretaria')] }

    fastify.get('/', todos, listar)
    fastify.get('/sin-visita-anio', todos, sinVisitaAnio)
    fastify.get('/:id', todos, obtener)
    fastify.post('/', gestionCompletaInfantes, crear)
    fastify.put('/:id', gestionCompletaInfantes, actualizar)
    fastify.delete('/:id', gestionCompletaInfantes, eliminar)

    // Subida de foto — multipart
    fastify.post('/:id/foto', gestionCompletaInfantes, subirFoto)

    // Ubicación GPS — accesible por todos (especialmente tutores en el campo)
    fastify.patch('/:id/ubicacion', todos, actualizarUbicacion)
}

