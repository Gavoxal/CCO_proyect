import { login, me } from './auth.controller.js'

export default async function authRoutes(fastify) {
    // POST /api/v1/auth/login
    fastify.post('/login', {
        schema: {
            body: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                    username: { type: 'string', minLength: 1 },
                    password: { type: 'string', minLength: 1 }
                }
            }
        }
    }, login)

    // GET /api/v1/auth/me  (requiere token)
    fastify.get('/me', { preHandler: [fastify.authenticate] }, me)
}
