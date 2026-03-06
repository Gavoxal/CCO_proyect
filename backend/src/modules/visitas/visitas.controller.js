import { ok, created, noContent, notFound, paginated } from '../../utils/response.js'
import { getPagination } from '../../utils/pagination.js'
import fs from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

export async function listar(request, reply) {
    const { page, limit, skip } = getPagination(request.query)
    const { infanteId, anio } = request.query
    const db = request.server.db

    const where = {}
    if (infanteId) where.infanteId = parseInt(infanteId)
    if (anio) {
        const yr = parseInt(anio)
        where.fecha = { gte: new Date(`${yr}-01-01`), lte: new Date(`${yr}-12-31`) }
    }

    const [total, visitas] = await Promise.all([
        db.visita.count({ where }),
        db.visita.findMany({
            where, skip, take: limit,
            include: {
                infante: { include: { persona: true } },
                tutor: { include: { persona: true } }
            },
            orderBy: { fecha: 'desc' }
        })
    ])
    return paginated(reply, visitas, total, page, limit)
}

export async function obtener(request, reply) {
    const db = request.server.db
    const visita = await db.visita.findUnique({
        where: { id: parseInt(request.params.id) },
        include: {
            infante: { include: { persona: true } },
            tutor: { include: { persona: true } }
        }
    })
    if (!visita) return notFound(reply)
    return ok(reply, visita)
}

export async function crear(request, reply) {
    const db = request.server.db
    // Soporte para multipart (con archivo adjunto) o JSON simple
    let body
    let archivoAdjunto = null

    if (request.isMultipart()) {
        const parts = request.parts()
        const fields = {}
        for await (const part of parts) {
            if (part.file) {
                const dir = path.join(UPLOAD_DIR, 'visitas')
                await fs.mkdir(dir, { recursive: true })
                const filename = `visita-${Date.now()}-${part.filename}`
                await fs.writeFile(path.join(dir, filename), await part.toBuffer())
                archivoAdjunto = `/uploads/visitas/${filename}`
            } else {
                fields[part.fieldname] = part.value
            }
        }
        body = fields
    } else {
        body = request.body
    }

    const visita = await db.visita.create({
        data: {
            fecha: new Date(body.fecha),
            observaciones: body.observaciones || null,
            archivoAdjunto,
            infanteId: parseInt(body.infanteId),
            tutorId: body.tutorId ? parseInt(body.tutorId) : null
        },
        include: { infante: { include: { persona: true } } }
    })
    return created(reply, visita)
}

export async function eliminar(request, reply) {
    const db = request.server.db
    try {
        await db.visita.delete({ where: { id: parseInt(request.params.id) } })
        return noContent(reply)
    } catch {
        return notFound(reply)
    }
}
