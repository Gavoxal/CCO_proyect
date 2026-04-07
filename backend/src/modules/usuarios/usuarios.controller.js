import fs from 'fs/promises'
import path from 'path'
import bcrypt from 'bcryptjs'
import { ok, created, noContent, notFound, paginated } from '../../utils/response.js'
import { getPagination } from '../../utils/pagination.js'
import { requireRoles, ROLES } from '../../middleware/roles.js'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')

// GET /usuarios
export async function listar(request, reply) {
    const { page, limit, skip } = getPagination(request.query)
    const db = request.server.db
    const [total, usuarios] = await Promise.all([
        db.usuario.count(),
        db.usuario.findMany({
            skip, take: limit,
            select: {
                id: true, username: true, email: true,
                rol: true, activo: true, ultimoAcceso: true,
                persona: { select: { nombres: true, apellidos: true, telefono1: true, tutor: { select: { id: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        })
    ])
    return paginated(reply, usuarios, total, page, limit)
}

// GET /usuarios/tutores — Lista simple de tutores para combos
export async function listarTutores(request, reply) {
    const db = request.server.db
    const tutores = await db.tutor.findMany({
        select: {
            id: true,
            persona: { select: { nombres: true, apellidos: true } }
        },
        orderBy: { persona: { apellidos: 'asc' } }
    })
    return ok(reply, tutores)
}

// GET /usuarios/:id
export async function obtener(request, reply) {
    const db = request.server.db
    const usuario = await db.usuario.findUnique({
        where: { id: parseInt(request.params.id) },
        select: {
            id: true, username: true, email: true,
            rol: true, activo: true, ultimoAcceso: true, createdAt: true,
            persona: true
        }
    })
    if (!usuario) return notFound(reply)
    return ok(reply, usuario)
}

// POST /usuarios
export async function crear(request, reply) {
    const { username, email, password, rol, persona, profesion, fotografia } = request.body
    const db = request.server.db

    const existente = await db.usuario.findFirst({
        where: { OR: [{ username }, { email }] }
    })
    if (existente) {
        return reply.status(409).send({ error: 'Usuario o email ya existe' })
    }

    const hash = await bcrypt.hash(password, 12)
    const isTutor = rol === 'tutor' || rol === 'tutor_especial'

    const dataObj = {
        username, email,
        password: hash,
        rol: rol || 'tutor',
        persona: persona ? {
            create: {
                ...persona,
                tutor: isTutor ? {
                    create: {
                        codigo: `TUT-${Date.now().toString().slice(-6)}`,
                        profesion: profesion || null,
                        fotografia: fotografia || null
                    }
                } : undefined
            }
        } : undefined
    }

    const usuario = await db.usuario.create({
        data: dataObj,
        select: { id: true, username: true, email: true, rol: true, activo: true }
    })

    return created(reply, usuario)
}

// PUT /usuarios/:id
export async function actualizar(request, reply) {
    const db = request.server.db
    const id = parseInt(request.params.id)
    const { email, rol, activo, persona, password, profesion, fotografia } = request.body

    const data = {}
    if (email) data.email = email
    if (rol) data.rol = rol
    if (activo !== undefined) data.activo = activo
    if (password) data.password = await bcrypt.hash(password, 12)
    if (persona) data.persona = { update: persona }

    try {
        const usuario = await db.usuario.update({
            where: { id },
            data,
            select: { id: true, username: true, email: true, rol: true, activo: true, personaId: true }
        })

        // Si es tutor y mandan profesion/fotografia, actualizar o crear el perfil Tutor
        const isTutor = usuario.rol === 'tutor' || usuario.rol === 'tutor_especial';
        if (isTutor && usuario.personaId && (profesion !== undefined || fotografia !== undefined)) {
            const tutorData = {};
            if (profesion !== undefined) tutorData.profesion = profesion;
            if (fotografia !== undefined) tutorData.fotografia = fotografia;

            await db.tutor.upsert({
                where: { personaId: usuario.personaId },
                update: tutorData,
                create: {
                    personaId: usuario.personaId,
                    codigo: `TUT-${Date.now().toString().slice(-6)}`,
                    ...tutorData
                }
            });
        }

        return ok(reply, usuario)
    } catch {
        return notFound(reply)
    }
}

// DELETE /usuarios/:id (solo admin)
export async function eliminar(request, reply) {
    const db = request.server.db
    try {
        await db.usuario.delete({ where: { id: parseInt(request.params.id) } })
        return noContent(reply)
    } catch {
        return notFound(reply)
    }
}

// POST /usuarios/:id/foto
export async function subirFoto(request, reply) {
    const db = request.server.db
    const id = parseInt(request.params.id)

    // Buscar si es un usuario válido
    const usuario = await db.usuario.findUnique({
        where: { id },
        include: { persona: { include: { tutor: true } } }
    })
    if (!usuario || !usuario.persona || !usuario.persona.tutor) {
        return reply.status(400).send({ error: 'Usuario no tiene perfil de Tutor o no fue encontrado.' })
    }

    const data = await request.file()
    if (!data) return reply.status(400).send({ error: 'No se envió ningún archivo' })

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({ error: 'Solo se permiten imágenes JPG, PNG o WebP' })
    }

    const dir = path.join(UPLOAD_DIR, 'tutores')
    await fs.mkdir(dir, { recursive: true })
    const ext = data.filename.split('.').pop()
    const filename = `tutor-${id}-${Date.now()}.${ext}`
    const filepath = path.join(dir, filename)

    await fs.writeFile(filepath, await data.toBuffer())

    const rutaRelativa = `/uploads/tutores/${filename}`

    // Guardar ruta de la foto en el Tutor
    const actualizado = await db.tutor.update({
        where: { id: usuario.persona.tutor.id },
        data: {
            fotografia: rutaRelativa,
            fechaActualizacionFoto: new Date()
        }
    })

    return ok(reply, { message: 'Foto de tutor guardada correctamente', fotografia: rutaRelativa, tutor: actualizado })
}
