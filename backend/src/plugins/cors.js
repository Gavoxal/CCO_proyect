import fp from 'fastify-plugin'
import cors from '@fastify/cors'

async function corsPlugin(fastify) {
    fastify.register(cors, {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    })
}

export default fp(corsPlugin, { name: 'cors' })
export { corsPlugin }
