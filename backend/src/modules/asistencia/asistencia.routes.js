import { requireRoles, ROLES } from '../../middleware/roles.js'
import { listar, registrarBulk, resumen, pagarDeuda, eliminarFecha, actualizarRegistro } from './asistencia.controller.js'

export default async function asistenciaRoutes(fastify) {
    const todos = { preHandler: [requireRoles(...ROLES.TODOS)] }
    // La toma de asistencia debe estar disponible para todo usuario autenticado.
    const registrarAsistencia = { preHandler: [requireRoles(...ROLES.TODOS)] }

    fastify.get('/', todos, listar)
    fastify.get('/resumen', todos, resumen)
    fastify.post('/bulk', registrarAsistencia, registrarBulk)
    fastify.patch('/pagar-deuda/:infanteId', registrarAsistencia, pagarDeuda)

    const gestion = { preHandler: [requireRoles('admin', 'director', 'tutor_especial')] }
    fastify.delete('/fecha/:fecha', gestion, eliminarFecha)
    fastify.patch('/:infanteId/:fecha', gestion, actualizarRegistro)
}
