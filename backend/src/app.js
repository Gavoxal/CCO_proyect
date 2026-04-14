import Fastify from 'fastify'
// restart nodemon
import { prismaPlugin } from './plugins/prisma.js'
import { authPlugin } from './plugins/auth.js'
import { corsPlugin } from './plugins/cors.js'
import { rateLimitPlugin } from './plugins/rateLimit.js'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import helmet from '@fastify/helmet'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Rutas de módulos
import authRoutes from './modules/auth/auth.routes.js'
import usuariosRoutes from './modules/usuarios/usuarios.routes.js'
import infantesRoutes from './modules/infantes/infantes.routes.js'
import asistenciaRoutes from './modules/asistencia/asistencia.routes.js'
import visitasRoutes from './modules/visitas/visitas.routes.js'
import materialesRoutes from './modules/inventario/materiales/materiales.routes.js'
import incidentesRoutes from './modules/reporteIncidentes/reporteIncidentes.routes.js'
import regalosRoutes from './modules/regalos/regalos.routes.js'
import eventosRoutes from './modules/eventos/eventos.routes.js'
import notificacionesRoutes from './modules/notificaciones/notificaciones.routes.js'
import importRoutes from './modules/import/import.routes.js'
import dashboardRoutes from './modules/dashboard/dashboard.routes.js'

export async function buildApp() {
    const app = Fastify({
        logger: process.env.NODE_ENV === 'production'
            ? true
            : { transport: { target: 'pino-pretty', options: { colorize: true } } }
    })

    // ── Plugins globales ────────────────────────────────────
    await app.register(corsPlugin)
    await app.register(helmet, {
        contentSecurityPolicy: false, // Deshabilitar si causa problemas con Swagger, ajustar luego
        crossOriginEmbedderPolicy: false
    })
    await app.register(rateLimitPlugin)
    await app.register(prismaPlugin)
    await app.register(authPlugin)
    await app.register(multipart, {
        limits: {
            fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '5')) * 1024 * 1024
        }
    })

    // ── Servir archivos estáticos (uploads) — PROTEGIDO ────────
    // Solo permitir acceso a fotos si el usuario está autenticado.
    // Soporta tanto cabecera Authorization como parámetro ?token=.
    app.addHook('onRequest', async (request, reply) => {
        if (request.url.startsWith('/uploads/')) {
            try {
                // Intentar extraer token de query si no está en headers
                const authHeader = request.headers.authorization;
                const queryToken = request.query.token;

                if (!authHeader && queryToken) {
                    // Manual verification if only query token is present
                    await app.jwt.verify(queryToken);
                } else {
                    // Standard header verification
                    await request.jwtVerify();
                }
            } catch (err) {
                return reply.status(401).send({ error: 'Debe iniciar sesión para ver este archivo' })
            }
        }
    })

    await app.register(fastifyStatic, {
        root: path.join(process.cwd(), 'uploads'),
        prefix: '/uploads/',
    })

    // ── Documentación interactiva (Swagger) ─────────────────
    await app.register(swagger, {
        openapi: {
            info: {
                title: 'CCO KidScam API',
                description: 'Documentación interactiva de la API (estilo Postman)',
                version: '1.0.0'
            },
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            }
        }
    })

    await app.register(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: false
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
    app.register(incidentesRoutes, { prefix: `${API_PREFIX}/incidentes` })
    app.register(regalosRoutes, { prefix: `${API_PREFIX}/regalos` })

    app.register(eventosRoutes, { prefix: `${API_PREFIX}/eventos` })
    app.register(notificacionesRoutes, { prefix: `${API_PREFIX}/notificaciones` })
    app.register(importRoutes, { prefix: `${API_PREFIX}/import` })
    app.register(dashboardRoutes, { prefix: `${API_PREFIX}/dashboard` })

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
