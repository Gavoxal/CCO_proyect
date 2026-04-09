import { requireRoles, ROLES } from '../../middleware/roles.js'
import { crear, listar, obtener, eliminar, agregarSeguimiento } from './reporteIncidentes.controller.js'

export default async function reporteIncidentesRoutes(fastify) {
    // Todos los usuarios autenticados pueden CREAR un reporte
    const puedeCerar = { preHandler: [requireRoles(...ROLES.INCIDENTES_CREAR)] }

    // Solo admin, director, proteccion y secretaria pueden VER reportes
    const puedeVer = { preHandler: [requireRoles(...ROLES.INCIDENTES_VER)] }

    // Solo super admins pueden eliminar
    const soloSuperAdmins = { preHandler: [requireRoles(...ROLES.SUPER_ADMINS)] }

    // POST /incidentes  — cualquier usuario autenticado puede reportar
    fastify.post('/', puedeCerar, crear)

    // POST /incidentes/:id/seguimiento — Personal autorizado registra acciones
    fastify.post('/:id/seguimiento', puedeVer, agregarSeguimiento)

    // GET /incidentes  — solo admin/director/proteccion/secretaria ven los reportes
    fastify.get('/', puedeVer, listar)

    // GET /incidentes/:id
    fastify.get('/:id', puedeVer, obtener)

    // DELETE /incidentes/:id — solo super admins
    fastify.delete('/:id', soloSuperAdmins, eliminar)
}
