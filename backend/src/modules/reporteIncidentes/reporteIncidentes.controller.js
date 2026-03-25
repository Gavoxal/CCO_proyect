import { ok, created, noContent, notFound, paginated } from '../../utils/response.js'
import { getPagination } from '../../utils/pagination.js'
import path from 'path'
import fs from 'fs/promises'

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

// POST /incidentes/:id/foto — Subida de evidencia fotográfica
export async function subirFoto(request, reply) {
    const db = request.server.db
    const id = parseInt(request.params.id)

    const reporte = await db.reporteIncidente.findUnique({ where: { id } })
    if (!reporte) return notFound(reply)

    const data = await request.file()
    if (!data) return reply.status(400).send({ error: 'No se envió ningún archivo' })

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({ error: 'Solo se permiten imágenes JPG, PNG o WebP' })
    }

    const dir = path.join(UPLOAD_DIR, 'incidentes')
    await fs.mkdir(dir, { recursive: true })
    const ext = data.filename.split('.').pop()
    const filename = `incidente-${id}-${Date.now()}.${ext}`
    const filepath = path.join(dir, filename)

    await fs.writeFile(filepath, await data.toBuffer())

    const rutaRelativa = `/uploads/incidentes/${filename}`
    const actualizado = await db.reporteIncidente.update({
        where: { id },
        data: { foto: rutaRelativa }
    })

    return ok(reply, { foto: actualizado.foto })
}
