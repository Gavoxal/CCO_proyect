import { ok, created, noContent, notFound, paginated, badRequest } from '../../utils/response.js'
import { getPagination } from '../../utils/pagination.js'
import path from 'path'
import fs from 'fs/promises'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

// GET /infantes  — con filtros: esPatrocinado, tipoPrograma, tutorId
export async function listar(request, reply) {
    const { page, limit, skip } = getPagination(request.query)
    const { esPatrocinado, tipoPrograma, tutorId, buscar } = request.query
    const db = request.server.db

    const where = {}
    if (esPatrocinado !== undefined) where.esPatrocinado = esPatrocinado === 'true'
    if (tipoPrograma) where.tipoPrograma = tipoPrograma
    if (tutorId) where.tutorId = parseInt(tutorId)
    if (buscar) {
        where.persona = {
            OR: [
                { nombres: { contains: buscar } },
                { apellidos: { contains: buscar } },
                { cedula: { contains: buscar } }
            ]
        }
    }

    try {
        const [total, infantes] = await Promise.all([
            db.infante.count({ where }),
            db.infante.findMany({
                where, skip, take: limit,
                include: {
                    persona: true,
                    tutor: { include: { persona: true } },
                    visitas: { take: 1, orderBy: { fecha: 'desc' } }
                },
                orderBy: [{ persona: { apellidos: 'asc' } }]
            })
        ])

        return paginated(reply, infantes, total, page, limit)
    } catch (error) {
        request.server.log.error('Error al listar infantes:', error)
        return reply.status(500).send({
            success: false,
            error: 'Error interno al listar infantes',
            message: error.message
        })
    }
}

// GET /infantes/:id
export async function obtener(request, reply) {
    const db = request.server.db
    const infante = await db.infante.findUnique({
        where: { id: parseInt(request.params.id) },
        include: {
            persona: true,
            tutor: { include: { persona: true } },
            visitas: { orderBy: { fecha: 'desc' }, take: 5 },
            regalos: { orderBy: { anio: 'desc' }, take: 10 },
            asistencias: { orderBy: { fecha: 'desc' }, take: 30 }
        }
    })
    if (!infante) return notFound(reply)
    return ok(reply, infante)
}

// POST /infantes
export async function crear(request, reply) {
    const { persona, tutorId, ...infanteData } = request.body
    const db = request.server.db

    try {
        const infante = await db.infante.create({
            data: {
                ...infanteData,
                persona: { create: persona },
                tutor: tutorId ? { connect: { id: tutorId } } : undefined
            },
            include: { persona: true }
        })

        return created(reply, infante)
    } catch (error) {
        // Manejar errores de unicidad (código o cédula duplicados)
        if (error.code === 'P2002') {
            const campo = error.meta?.target?.join(', ') || 'campo único'
            return badRequest(reply, `Ya existe un registro con ese valor de ${campo}`)
        }
        request.server.log.error('Error al crear infante:', error)
        return reply.status(500).send({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        })
    }
}

// PUT /infantes/:id
export async function actualizar(request, reply) {
    const db = request.server.db
    const id = parseInt(request.params.id)
    const { persona, tutorId, ...infanteData } = request.body

    const data = { ...infanteData }
    if (persona) data.persona = { update: persona }
    if (tutorId !== undefined) {
        data.tutor = tutorId ? { connect: { id: tutorId } } : { disconnect: true }
    }

    try {
        const infante = await db.infante.update({
            where: { id },
            data,
            include: { persona: true }
        })
        return ok(reply, infante)
    } catch {
        return notFound(reply)
    }
}

// DELETE /infantes/:id  (solo admin/director)
export async function eliminar(request, reply) {
    const db = request.server.db
    try {
        await db.infante.delete({ where: { id: parseInt(request.params.id) } })
        return noContent(reply)
    } catch {
        return notFound(reply)
    }
}

// POST /infantes/:id/foto — subida de foto del niño
export async function subirFoto(request, reply) {
    const db = request.server.db
    const id = parseInt(request.params.id)

    const infante = await db.infante.findUnique({ where: { id } })
    if (!infante) return notFound(reply)

    const data = await request.file()
    if (!data) return reply.status(400).send({ error: 'No se envió ningún archivo' })

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({ error: 'Solo se permiten imágenes JPG, PNG o WebP' })
    }

    // Guardar archivo en uploads/infantes/
    const dir = path.join(UPLOAD_DIR, 'infantes')
    await fs.mkdir(dir, { recursive: true })
    const ext = data.filename.split('.').pop()
    const filename = `infante-${id}-${Date.now()}.${ext}`
    const filepath = path.join(dir, filename)

    await fs.writeFile(filepath, await data.toBuffer())

    const rutaRelativa = `/uploads/infantes/${filename}`
    const actualizado = await db.infante.update({
        where: { id },
        data: {
            fotografia: rutaRelativa,
            fechaActualizacionFoto: new Date()
        }
    })

    return ok(reply, {
        fotografia: actualizado.fotografia,
        fechaActualizacionFoto: actualizado.fechaActualizacionFoto
    })
}

// GET /infantes/sin-visita-anio — infantes sin visita en el año actual
export async function sinVisitaAnio(request, reply) {
    const db = request.server.db
    const anio = new Date().getFullYear()
    const inicio = new Date(`${anio}-01-01`)
    const fin = new Date(`${anio}-12-31`)

    const infantesConVisita = await db.visita.findMany({
        where: { fecha: { gte: inicio, lte: fin } },
        select: { infanteId: true },
        distinct: ['infanteId']
    })
    const idsConVisita = infantesConVisita.map(v => v.infanteId)

    const infantes = await db.infante.findMany({
        where: { id: { notIn: idsConVisita.length ? idsConVisita : [0] } },
        include: { persona: true, tutor: { include: { persona: true } } },
        orderBy: { persona: { apellidos: 'asc' } }
    })

    return ok(reply, infantes, { anio, total: infantes.length })
}

// PATCH /infantes/:id/ubicacion
export async function actualizarUbicacion(request, reply) {
    const db = request.server.db
    const id = parseInt(request.params.id)
    const { ubicacionGps } = request.body

    try {
        const infante = await db.infante.update({
            where: { id },
            data: {
                persona: {
                    update: { ubicacionGps }
                }
            },
            include: { persona: true }
        })
        return ok(reply, infante)
    } catch {
        return notFound(reply)
    }
}
