import { ok, created, noContent, notFound, paginated } from '../../utils/response.js'
import { getPagination } from '../../utils/pagination.js'
import path from 'path'
import fs from 'fs/promises'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

export async function listar(request, reply) {
    const { page, limit, skip } = getPagination(request.query)
    const { infanteId, tipo, estado, anio } = request.query
    const db = request.server.db

    const where = {}
    if (infanteId) where.infanteId = parseInt(infanteId)
    if (tipo) where.tipo = tipo
    if (estado) where.estado = estado
    if (anio) where.anio = parseInt(anio)

    const [total, regalos] = await Promise.all([
        db.regalo.count({ where }),
        db.regalo.findMany({
            where, skip, take: limit,
            include: { 
                infante: { include: { persona: true } },
                entregadoPor: { include: { persona: true } }
            },
            orderBy: [{ anio: 'desc' }, { tipo: 'asc' }]
        })
    ])
    return paginated(reply, regalos, total, page, limit)
}

// GET /regalos/pendientes?anio=2026&tipo=kit_escolar
export async function pendientes(request, reply) {
    const db = request.server.db
    const anio = parseInt(request.query.anio || new Date().getFullYear())
    const tipo = request.query.tipo

    const where = { anio, estado: 'pendiente' }
    if (tipo) where.tipo = tipo

    const regalos = await db.regalo.findMany({
        where,
        include: { 
            infante: { include: { persona: true } },
            entregadoPor: { include: { persona: true } }
        },
        orderBy: { infante: { persona: { apellidos: 'asc' } } }
    })
    return ok(reply, regalos, { anio, total: regalos.length })
}

export async function crear(request, reply) {
    const db = request.server.db
    const regalo = await db.regalo.create({
        data: {
            ...request.body,
            anio: request.body.anio || new Date().getFullYear()
        },
        include: { infante: { include: { persona: true } } }
    })
    return created(reply, regalo)
}

export async function actualizar(request, reply) {
    const db = request.server.db
    try {
        const regalo = await db.regalo.update({
            where: { id: parseInt(request.params.id) },
            data: {
                ...request.body,
                entregadoPorId: request.body.estado === 'entregado' ? request.user.id : undefined
            }
        })
        return ok(reply, regalo)
    } catch { return notFound(reply) }
}

export async function eliminar(request, reply) {
    const db = request.server.db
    try {
        await db.regalo.delete({ where: { id: parseInt(request.params.id) } })
        return noContent(reply)
    } catch { return notFound(reply) }
}

// POST /regalos/:id/foto
export async function subirFoto(request, reply) {
    const db = request.server.db
    const id = parseInt(request.params.id)

    // 1. Buscar el regalo y el infante asociado para obtener el código
    const regalo = await db.regalo.findUnique({
        where: { id },
        include: { infante: true }
    })
    if (!regalo) return notFound(reply)

    const data = await request.file()
    if (!data) return reply.status(400).send({ error: 'No se envió ningún archivo' })

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({ error: 'Solo se permiten imágenes JPG, PNG o WebP' })
    }

    // 2. Preparar directorio y nombre de archivo: regalo-[codigo]-[tipo]-[anio].[ext]
    const dir = path.join(UPLOAD_DIR, 'regalos')
    await fs.mkdir(dir, { recursive: true })
    
    const ext = data.filename.split('.').pop()
    const codigoInfante = regalo.infante.codigo.replace(/[^a-zA-Z0-9]/g, '-') // Limpiar caracteres raros
    const filename = `regalo-${codigoInfante}-${regalo.tipo}-${regalo.anio}.${ext}`
    const filepath = path.join(dir, filename)

    // Guardar archivo
    await fs.writeFile(filepath, await data.toBuffer())

    // 3. Actualizar registro: Marcar como ENTREGADO automáticamente
    const rutaRelativa = `/uploads/regalos/${filename}`
    const actualizado = await db.regalo.update({
        where: { id },
        data: {
            foto: rutaRelativa,
            estado: 'entregado',
            fechaEntrega: regalo.fechaEntrega || new Date(),
            entregadoPorId: request.user.id
        }
    })

    return ok(reply, actualizado)
}

// POST /regalos/generar-lote
export async function generarLote(request, reply) {
    const db = request.server.db
    const { tipo, anio } = request.body

    if (!tipo || !anio) {
        return reply.status(400).send({ error: 'Se requiere tipo y anio' })
    }

    try {
        // 1. Obtener todos los infantes
        const infantes = await db.infante.findMany({
            select: { id: true }
        })

        // 2. Obtener los que ya tienen registro para este tipo/anio
        const existentes = await db.regalo.findMany({
            where: { tipo, anio: parseInt(anio) },
            select: { infanteId: true }
        })
        const idsExistentes = new Set(existentes.map(e => e.infanteId))

        // 3. Filtrar los que faltan
        const faltantes = infantes.filter(i => !idsExistentes.has(i.id))

        if (faltantes.length === 0) {
            return ok(reply, { count: 0, message: 'Todos los infantes ya tienen registro para este periodo' })
        }

        // 4. Crear en lote
        const dataACrear = faltantes.map(i => ({
            infanteId: i.id,
            tipo,
            anio: parseInt(anio),
            estado: 'pendiente'
        }))

        const resultado = await db.regalo.createMany({
            data: dataACrear
        })

        return ok(reply, { count: resultado.count, message: `Se generaron ${resultado.count} registros nuevos` })
    } catch (error) {
        request.log.error(error)
        return reply.status(500).send({ error: 'Error interno al generar el listado' })
    }
}
