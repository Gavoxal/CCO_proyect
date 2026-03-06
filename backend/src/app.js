import Fastify from 'fastify'
import { prismaPlugin } from './plugins/prisma.js'
import { authPlugin } from './plugins/auth.js'
import { corsPlugin } from './plugins/cors.js'
import { rateLimitPlugin } from './plugins/rateLimit.js'
import multipart from '@fastify/multipart'

// Rutas de módulos
import authRoutes from './modules/auth/auth.routes.js'
import usuariosRoutes from './modules/usuarios/usuarios.routes.js'
import infantesRoutes from './modules/infantes/infantes.routes.js'
import asistenciaRoutes from './modules/asistencia/asistencia.routes.js'
import visitasRoutes from './modules/visitas/visitas.routes.js'
import materialesRoutes from './modules/inventario/materiales/materiales.routes.js'
import alimentosRoutes from './modules/inventario/alimentos/alimentos.routes.js'
import solicitudesRoutes from './modules/solicitudes/solicitudes.routes.js'
import regalosRoutes from './modules/regalos/regalos.routes.js'
import miembrosRoutes from './modules/miembros/miembros.routes.js'
import casasPazRoutes from './modules/casasDePaz/casasDePaz.routes.js'
import eventosRoutes from './modules/eventos/eventos.routes.js'
import importRoutes from './modules/import/import.routes.js'

export async function buildApp() {
    const app = Fastify({
        logger: process.env.NODE_ENV === 'production'
            ? true
            : { transport: { target: 'pino-pretty', options: { colorize: true } } }
    })

    // ── Plugins globales ────────────────────────────────────
    await app.register(corsPlugin)
    await app.register(rateLimitPlugin)
    await app.register(prismaPlugin)
    await app.register(authPlugin)
    await app.register(multipart, {
        limits: {
            fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '5')) * 1024 * 1024
        }
    })

    // ── Health check (público) ──────────────────────────────
    app.get('/health', async () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    }))

    // ── Rutas API v1 ────────────────────────────────────────
    const API_PREFIX = '/api/v1'

    app.register(authRoutes, { prefix: `${API_PREFIX}/auth` })
    app.register(usuariosRoutes, { prefix: `${API_PREFIX}/usuarios` })
    app.register(infantesRoutes, { prefix: `${API_PREFIX}/infantes` })
    app.register(asistenciaRoutes, { prefix: `${API_PREFIX}/asistencia` })
    app.register(visitasRoutes, { prefix: `${API_PREFIX}/visitas` })
    app.register(materialesRoutes, { prefix: `${API_PREFIX}/inventario/materiales` })
    app.register(alimentosRoutes, { prefix: `${API_PREFIX}/inventario/alimentos` })
    app.register(solicitudesRoutes, { prefix: `${API_PREFIX}/solicitudes` })
    app.register(regalosRoutes, { prefix: `${API_PREFIX}/regalos` })
    app.register(miembrosRoutes, { prefix: `${API_PREFIX}/miembros` })
    app.register(casasPazRoutes, { prefix: `${API_PREFIX}/casas-de-paz` })
    app.register(eventosRoutes, { prefix: `${API_PREFIX}/eventos` })
    app.register(importRoutes, { prefix: `${API_PREFIX}/import` })

    // ── Manejador de errores global ─────────────────────────
    app.setErrorHandler((error, request, reply) => {
        const statusCode = error.statusCode || 500
        app.log.error(error)

        // Errores de validación de Zod / Fastify
        if (statusCode === 400) {
            return reply.status(400).send({
                error: 'Solicitud inválida',
                message: error.message,
                details: error.validation || null
            })
        }

        if (statusCode === 401) {
            return reply.status(401).send({ error: 'No autorizado', message: error.message })
        }

        if (statusCode === 403) {
            return reply.status(403).send({ error: 'Acceso denegado', message: error.message })
        }

        if (statusCode === 404) {
            return reply.status(404).send({ error: 'No encontrado', message: error.message })
        }

        return reply.status(500).send({ error: 'Error interno del servidor' })
    })

    // ── 404 para rutas no encontradas ──────────────────────
    app.setNotFoundHandler((request, reply) => {
        reply.status(404).send({ error: 'Ruta no encontrada', path: request.url })
    })

    return app
}
