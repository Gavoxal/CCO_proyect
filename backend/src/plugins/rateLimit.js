import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'

async function rateLimitPlugin(fastify) {
    fastify.register(rateLimit, {
        max: 100,          // máx peticiones por ventana
        timeWindow: '1 minute',
        errorResponseBuilder: () => ({
            error: 'Demasiadas solicitudes',
            message: 'Has excedido el límite de peticiones. Intenta en 1 minuto.'
        })
    })
}

export default fp(rateLimitPlugin, { name: 'rateLimit' })
export { rateLimitPlugin }
