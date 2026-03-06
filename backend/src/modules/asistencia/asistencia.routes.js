import { requireRoles, ROLES } from '../../middleware/roles.js'
import { listar, registrarBulk, resumen } from './asistencia.controller.js'

export default async function asistenciaRoutes(fastify) {
    const todos = { preHandler: [requireRoles(...ROLES.TODOS)] }
    const escritura = { preHandler: [requireRoles(...ROLES.ESCRITURA)] }

    fastify.get('/', todos, listar)
    fastify.get('/resumen', todos, resumen)
    fastify.post('/bulk', escritura, registrarBulk)
}
