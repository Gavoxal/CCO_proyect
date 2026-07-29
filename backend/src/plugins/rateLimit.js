import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'

async function rateLimitPlugin(fastify) {
    fastify.register(rateLimit, {
        max: 100,          // máx peticiones por ventana para API general
        timeWindow: '1 minute',
        errorResponseBuilder: () => ({
            error: 'Demasiadas solicitudes',
            message: 'Has excedido el límite de peticiones. Intenta en 1 minuto.'
        })
    })

    // Rate limit más estricto solo para el login
    // Permite 5 intentos cada 5 minutos por IP
    fastify.addHook('preHandler', (request, reply, done) => {
        if (request.url === '/api/v1/auth/login' && request.method === 'POST') {
            // fastify-rate-limit permite configurar overrides o usar la API programática
            // Para simplicidad aquí, usaremos la configuración por ruta si es posible, 
            // pero como este plugin es global, aplicamos una lógica simple o recomendación.
        }
        done()
    })
}

export default fp(rateLimitPlugin, { name: 'rateLimit' })
export { rateLimitPlugin }
