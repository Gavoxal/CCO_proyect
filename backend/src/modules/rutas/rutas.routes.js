import { obtenerBolsa, toggleInfante, completarVisitas } from './rutas.controller.js'
import { requireRoles, ROLES } from '../../middleware/roles.js'

export default async function (fastify, opts) {
    const todos = { preHandler: [requireRoles(...ROLES.TODOS)] }

    fastify.get('/bolsa', todos, obtenerBolsa)
    
    fastify.post('/bolsa/toggle', {
        ...todos,
        schema: {
            body: {
                type: 'object',
                required: ['infanteId'],
                properties: {
                    infanteId: { type: 'integer', minimum: 1 }
                }
            }
        }
    }, toggleInfante)

    fastify.post('/bolsa/completar', {
        ...todos,
        schema: {
            body: {
                type: 'object',
                required: ['infantesIds'],
                properties: {
                    infantesIds: {
                        type: 'array',
                        items: { type: 'integer', minimum: 1 },
                        minItems: 1
                    }
                }
            }
        }
    }, completarVisitas)
}
