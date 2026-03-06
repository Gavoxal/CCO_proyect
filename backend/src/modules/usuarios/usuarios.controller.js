import bcrypt from 'bcryptjs'
import { ok, created, noContent, notFound, paginated } from '../../utils/response.js'
import { getPagination } from '../../utils/pagination.js'
import { requireRoles, ROLES } from '../../middleware/roles.js'

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
                persona: { select: { nombres: true, apellidos: true, telefono1: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
    ])
    return paginated(reply, usuarios, total, page, limit)
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
    const { username, email, password, rol, persona } = request.body
    const db = request.server.db

    const existente = await db.usuario.findFirst({
        where: { OR: [{ username }, { email }] }
    })
    if (existente) {
        return reply.status(409).send({ error: 'Usuario o email ya existe' })
    }

    const hash = await bcrypt.hash(password, 12)

    const usuario = await db.usuario.create({
        data: {
            username, email,
            password: hash,
            rol: rol || 'tutor',
            persona: persona ? { create: persona } : undefined
        },
        select: { id: true, username: true, email: true, rol: true, activo: true }
    })

    return created(reply, usuario)
}

// PUT /usuarios/:id
export async function actualizar(request, reply) {
    const db = request.server.db
    const id = parseInt(request.params.id)
    const { email, rol, activo, persona, password } = request.body

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
            select: { id: true, username: true, email: true, rol: true, activo: true }
        })
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
