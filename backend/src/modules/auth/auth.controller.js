import bcrypt from 'bcryptjs'
import { ok, badRequest } from '../../utils/response.js'
import { sendEmail } from '../../services/email.service.js'

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
            : usuario.username,
        passwordExpired: (new Date() - new Date(usuario.passwordUpdatedAt)) / (1000 * 60 * 60 * 24) >= 90
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

export async function recuperarPassword(request, reply) {
    const { email } = request.body
    const db = request.server.db

    const usuario = await db.usuario.findUnique({ where: { email } })
    
    const SUCCESS_MSG = 'Si el correo electrónico está registrado, recibirás una contraseña temporal en breve.'

    if (!usuario) {
        // Log interno para monitoreo, pero respuesta genérica para seguridad
        request.server.log.info(`Intento de recuperación de contraseña para correo no registrado: ${email}`)
        return ok(reply, { message: SUCCESS_MSG })
    }

    // Generar contraseña temporal robusta
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
    const spec = "@#$%&*"
    let tempPassword = ""
    for (let i = 0; i < 6; i++) tempPassword += chars.charAt(Math.floor(Math.random() * chars.length))
    tempPassword += "A1" + spec.charAt(Math.floor(Math.random() * spec.length)) + (Math.floor(Math.random() * 9))
    
    const hash = await bcrypt.hash(tempPassword, 12)

    await db.usuario.update({
        where: { id: usuario.id },
        data: { 
            password: hash,
            passwordUpdatedAt: new Date('2000-01-01') // Forzar cambio inmediato
        }
    })

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="color: #004E89; margin: 0;">Restablecer Contraseña</h2>
                <p style="color: #666;">Sistema de Gestión CCO</p>
            </div>
            <p>Hola,</p>
            <p>Se ha generado una nueva contraseña temporal para que puedas acceder a tu cuenta:</p>
            <div style="background: #f8f9fa; border: 1px dashed #004E89; padding: 20px; border-radius: 12px; text-align: center; margin: 25px 0;">
                <span style="font-family: monospace; font-size: 24px; font-weight: bold; color: #004E89; letter-spacing: 3px;">
                    ${tempPassword}
                </span>
            </div>
            <p style="background: #fff3cd; color: #856404; padding: 10px; border-radius: 8px; font-size: 13px; text-align: center;">
                <strong>Importante:</strong> Por seguridad, el sistema te pedirá cambiar esta contraseña inmediatamente al iniciar sesión.
            </p>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
                Si no solicitaste este cambio, por favor ignora este correo o contacta a soporte.
            </p>
        </div>
    `

    await sendEmail(email, 'Nueva contraseña temporal - CCO', html)

    return ok(reply, { message: 'Se ha enviado una contraseña temporal a tu correo electrónico.' })
}
