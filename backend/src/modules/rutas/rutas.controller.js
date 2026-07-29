import { ok, created } from '../../utils/response.js'

export async function obtenerBolsa(request, reply) {
    const db = request.server.db
    const usuarioId = request.user.id
    
    const usuario = await db.usuario.findUnique({
        where: { id: usuarioId },
        include: { persona: { include: { tutor: true } } }
    })
    
    if (!usuario?.persona?.tutor) {
        return ok(reply, [])
    }
    
    const tutorId = usuario.persona.tutor.id
    
    const bolsa = await db.bolsaVisita.findMany({
        where: { tutorId },
        select: { infanteId: true }
    })
    
    return ok(reply, bolsa.map(b => b.infanteId))
}

export async function toggleInfante(request, reply) {
    const db = request.server.db
    const usuarioId = request.user.id
    const { infanteId } = request.body
    
    const usuario = await db.usuario.findUnique({
        where: { id: usuarioId },
        include: { persona: { include: { tutor: true } } }
    })
    
    if (!usuario?.persona?.tutor) {
        return reply.status(403).send({ error: 'Usuario no es tutor' })
    }
    
    const tutorId = usuario.persona.tutor.id
    
    const existe = await db.bolsaVisita.findUnique({
        where: { tutorId_infanteId: { tutorId, infanteId } }
    })
    
    if (existe) {
        await db.bolsaVisita.delete({ where: { tutorId_infanteId: { tutorId, infanteId } } })
        return ok(reply, { action: 'removed', infanteId })
    } else {
        await db.bolsaVisita.create({ data: { tutorId, infanteId } })
        return created(reply, { action: 'added', infanteId })
    }
}

export async function completarVisitas(request, reply) {
    const db = request.server.db
    const usuarioId = request.user.id
    const { infantesIds } = request.body
    
    if (!infantesIds || !Array.isArray(infantesIds) || infantesIds.length === 0) {
        return ok(reply, { message: 'No se enviaron infantes' })
    }

    const usuario = await db.usuario.findUnique({
        where: { id: usuarioId },
        include: { persona: { include: { tutor: true } } }
    })
    
    if (!usuario?.persona?.tutor) {
        return reply.status(403).send({ error: 'Usuario no es tutor' })
    }
    
    const tutorId = usuario.persona.tutor.id
    
    // Eliminar de la bolsa
    await db.bolsaVisita.deleteMany({
        where: {
            tutorId,
            infanteId: { in: infantesIds }
        }
    })
    
    // Crear la visita como 'Realizada'
    const visitas = infantesIds.map(infanteId => ({
        fecha: new Date(),
        estado: 'Realizada',
        razonVisita: 'Seguimiento',
        decision: 'ContinuaMinisterio',
        infanteId,
        tutorId
    }))

    await db.visita.createMany({
        data: visitas
    })

    return ok(reply, { message: 'Visitas registradas y removidas de la bolsa exitosamente' })
}
