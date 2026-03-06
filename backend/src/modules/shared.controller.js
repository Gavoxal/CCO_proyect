import { ok, created, noContent, notFound, paginated } from '../../utils/response.js'
import { getPagination } from '../../utils/pagination.js'

// CRUD genérico reusable para Miembros, Casas de Paz y Eventos

// === MIEMBROS ===
export async function listarMiembros(request, reply) {
    const { page, limit, skip } = getPagination(request.query)
    const { tipoMembresia, buscar } = request.query
    const db = request.server.db
    const where = {}
    if (tipoMembresia) where.tipoMembresia = tipoMembresia
    if (buscar) where.persona = { OR: [{ nombres: { contains: buscar } }, { apellidos: { contains: buscar } }] }

    const [total, miembros] = await Promise.all([
        db.miembro.count({ where }),
        db.miembro.findMany({ where, skip, take: limit, include: { persona: true }, orderBy: { persona: { apellidos: 'asc' } } })
    ])
    return paginated(reply, miembros, total, page, limit)
}

export async function crearMiembro(request, reply) {
    const { persona, ...miembroData } = request.body
    const db = request.server.db
    const miembro = await db.miembro.create({
        data: { ...miembroData, persona: { create: persona } },
        include: { persona: true }
    })
    return created(reply, miembro)
}

export async function actualizarMiembro(request, reply) {
    const db = request.server.db
    const { persona, ...data } = request.body
    if (persona) data.persona = { update: persona }
    try {
        const m = await db.miembro.update({ where: { id: parseInt(request.params.id) }, data, include: { persona: true } })
        return ok(reply, m)
    } catch { return notFound(reply) }
}

export async function eliminarMiembro(request, reply) {
    const db = request.server.db
    try { await db.miembro.delete({ where: { id: parseInt(request.params.id) } }); return noContent(reply) }
    catch { return notFound(reply) }
}

// === CASAS DE PAZ ===
export async function listarCasas(request, reply) {
    const { page, limit, skip } = getPagination(request.query)
    const { estado } = request.query
    const db = request.server.db
    const where = estado ? { estado } : {}
    const [total, casas] = await Promise.all([
        db.casaDePaz.count({ where }),
        db.casaDePaz.findMany({ where, skip, take: limit, include: { lider: { include: { persona: true } }, personaAsistida: { include: { persona: true } } }, orderBy: { fechaInicio: 'desc' } })
    ])
    return paginated(reply, casas, total, page, limit)
}

export async function crearCasa(request, reply) {
    const db = request.server.db
    const casa = await db.casaDePaz.create({ data: request.body })
    return created(reply, casa)
}

export async function actualizarCasa(request, reply) {
    const db = request.server.db
    try {
        const casa = await db.casaDePaz.update({ where: { id: parseInt(request.params.id) }, data: request.body })
        return ok(reply, casa)
    } catch { return notFound(reply) }
}

export async function eliminarCasa(request, reply) {
    const db = request.server.db
    try { await db.casaDePaz.delete({ where: { id: parseInt(request.params.id) } }); return noContent(reply) }
    catch { return notFound(reply) }
}

// === EVENTOS ===
export async function listarEventos(request, reply) {
    const { page, limit, skip } = getPagination(request.query)
    const { tipo, desde, hasta } = request.query
    const db = request.server.db
    const where = {}
    if (tipo) where.tipo = tipo
    if (desde) where.fechaInicio = { gte: new Date(desde) }
    if (hasta) where.fechaInicio = { ...where.fechaInicio, lte: new Date(hasta) }

    const [total, eventos] = await Promise.all([
        db.evento.count({ where }),
        db.evento.findMany({ where, skip, take: limit, orderBy: { fechaInicio: 'asc' } })
    ])
    return paginated(reply, eventos, total, page, limit)
}

export async function crearEvento(request, reply) {
    const db = request.server.db
    const evento = await db.evento.create({ data: request.body })
    return created(reply, evento)
}

export async function actualizarEvento(request, reply) {
    const db = request.server.db
    try {
        const e = await db.evento.update({ where: { id: parseInt(request.params.id) }, data: request.body })
        return ok(reply, e)
    } catch { return notFound(reply) }
}

export async function eliminarEvento(request, reply) {
    const db = request.server.db
    try { await db.evento.delete({ where: { id: parseInt(request.params.id) } }); return noContent(reply) }
    catch { return notFound(reply) }
}
