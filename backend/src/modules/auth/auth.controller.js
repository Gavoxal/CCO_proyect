import bcrypt from 'bcryptjs'
import { ok, badRequest } from '../../utils/response.js'

export async function login(request, reply) {
    const { username, password } = request.body
    const db = request.server.db

    const usuario = await db.usuario.findFirst({
        where: { OR: [{ username }, { email: username }], activo: true },
        include: { persona: true }
    })

    if (!usuario) {
        return badRequest(reply, 'Credenciales inválidas')
    }

    const passwordValido = await bcrypt.compare(password, usuario.password)
    if (!passwordValido) {
        return badRequest(reply, 'Credenciales inválidas')
    }

    // Actualizar último acceso
    await db.usuario.update({
        where: { id: usuario.id },
        data: { ultimoAcceso: new Date() }
    })

    const payload = {
        id: usuario.id,
        username: usuario.username,
        rol: usuario.rol,
        nombre: usuario.persona
            ? `${usuario.persona.nombres} ${usuario.persona.apellidos}`
            : usuario.username
    }

    const token = await reply.jwtSign(payload)

    return ok(reply, { token, usuario: payload })
}

export async function me(request, reply) {
    await request.jwtVerify()
    const db = request.server.db

    const usuario = await db.usuario.findUnique({
        where: { id: request.user.id },
        select: {
            id: true, username: true, email: true, rol: true,
            ultimoAcceso: true, activo: true,
            persona: {
                select: { nombres: true, apellidos: true, telefono1: true }
            }
        }
    })

    if (!usuario) return reply.status(404).send({ error: 'Usuario no encontrado' })
    return ok(reply, usuario)
}
