import { ok, created, noContent, notFound, paginated, forbidden } from '../../utils/response.js'
import { getPagination } from '../../utils/pagination.js'
import path from 'path'
import fs from 'fs/promises'
import { notificationService } from '../../services/notification.service.js'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

// POST /incidentes — Crea un nuevo reporte (CUALQUIER usuario autenticado)
// Los tutores pueden crear pero NO VER los reportes existentes
export async function crear(request, reply) {
    const db = request.server.db
    const { fecha, descripcion, tipoAbuso, infantesIds = [] } = request.body
    const reportadoPorId = request.user.id

    if (!infantesIds.length) {
        return reply.status(400).send({
            error: 'Solicitud inválida',
            message: 'Debe incluir al menos un infante en el reporte'
        })
    }

    // Verificar que los infantes existen
    const infantes = await db.infante.findMany({
        where: { id: { in: infantesIds.map(Number) } },
        select: { id: true }
    })

    if (infantes.length !== infantesIds.length) {
        return reply.status(400).send({
            error: 'Infante no encontrado',
            message: 'Uno o más infantes indicados no existen en el sistema'
        })
    }

    const reporte = await db.reporteIncidente.create({
        data: {
            fecha: new Date(fecha),
            descripcion,
            tipoAbuso,
            reportadoPorId,
            infantes: {
                connect: infantesIds.map(id => ({ id: Number(id) }))
            }
        },
        include: {
            reportadoPor: { select: { id: true, username: true, rol: true } },
            infantes: {
                include: { persona: { select: { nombres: true, apellidos: true } } }
            }
        }
    })

    // Notificar a Admin, Director y Protección
    const destinatarios = await db.usuario.findMany({
        where: { rol: { in: ['admin', 'director', 'proteccion'] }, activo: true },
        select: { id: true }
    })

    if (destinatarios.length > 0) {
        const ids = destinatarios.map(u => u.id)
        const titulo = 'Nuevo Incidente Reportado'
        const mensaje = `El usuario ${reporte.reportadoPor.username} ha reportado un incidente de tipo ${tipoAbuso}.`
        await notificationService.crearNotificacionMasiva(ids, titulo, mensaje, 'ALERTA', reporte.id)
    }

    return created(reply, reporte)
}

// GET /incidentes — Lista todos los reportes (solo admin/director/proteccion/secretaria)
export async function listar(request, reply) {
    const db = request.server.db
    const { page, limit, skip } = getPagination(request.query)
    const { desde, hasta, tipoAbuso, infanteId } = request.query

    const where = {}

    if (desde || hasta) {
        where.fecha = {}
        if (desde) where.fecha.gte = new Date(desde)
        if (hasta) where.fecha.lte = new Date(hasta)
    }

    if (tipoAbuso) where.tipoAbuso = { contains: tipoAbuso }

    if (infanteId) {
        where.infantes = { some: { id: parseInt(infanteId) } }
    }

    const [total, reportes] = await Promise.all([
        db.reporteIncidente.count({ where }),
        db.reporteIncidente.findMany({
            where,
            skip,
            take: limit,
            orderBy: { fecha: 'desc' },
            include: {
                reportadoPor: { select: { id: true, username: true, rol: true } },
                infantes: {
                    include: {
                        persona: { select: { nombres: true, apellidos: true } }
                    }
                },
                seguimientos: {
                    include: { usuario: { select: { username: true } } },
                    orderBy: { fecha: 'asc' }
                }
            }
        })
    ])

    return paginated(reply, reportes, total, page, limit)
}

// GET /incidentes/:id — Detalle de un reporte (solo admin/director/proteccion/secretaria)
export async function obtener(request, reply) {
    const db = request.server.db
    const reporte = await db.reporteIncidente.findUnique({
        where: { id: parseInt(request.params.id) },
        include: {
            reportadoPor: { select: { id: true, username: true, rol: true } },
            infantes: {
                include: { persona: true }
            },
            seguimientos: {
                include: { usuario: { select: { username: true } } },
                orderBy: { fecha: 'asc' }
            }
        }
    })

    if (!reporte) return notFound(reply)
    return ok(reply, reporte)
}

// DELETE /incidentes/:id — Solo super admins
export async function eliminar(request, reply) {
    const db = request.server.db
    try {
        await db.reporteIncidente.delete({
            where: { id: parseInt(request.params.id) }
        })
        return noContent(reply)
    } catch {
        return notFound(reply)
    }
}

// POST /incidentes/:id/seguimiento — Agrega acciones tomadas (solo admin/director/proteccion)
export async function agregarSeguimiento(request, reply) {
    const db = request.server.db
    const incidenteId = parseInt(request.params.id)
    const { texto } = request.body
    const usuarioId = request.user.id

    if (!texto || texto.trim().length < 5) {
        return reply.status(400).send({
            error: 'Solicitud inválida',
            message: 'El texto del seguimiento debe tener al menos 5 caracteres'
        })
    }

    const reporte = await db.reporteIncidente.findUnique({ where: { id: incidenteId } })
    if (!reporte) return notFound(reply)

    const seguimiento = await db.seguimientoIncidente.create({
        data: {
            texto,
            incidenteId,
            usuarioId
        },
        include: {
            usuario: { select: { username: true } }
        }
    })

    return created(reply, seguimiento)
}
