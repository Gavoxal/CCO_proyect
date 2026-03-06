import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'

async function authPlugin(fastify) {
    fastify.register(jwt, {
        secret: process.env.JWT_SECRET || 'default-secret-cambia-esto',
        sign: {
            expiresIn: process.env.JWT_EXPIRES_IN || '8h'
        }
    })

    // Decorator reutilizable para proteger rutas
    fastify.decorate('authenticate', async function (request, reply) {
        try {
            await request.jwtVerify()
        } catch (err) {
            reply.status(401).send({ error: 'Token inválido o expirado' })
        }
    })
}

export default fp(authPlugin, { name: 'auth' })
export { authPlugin }
