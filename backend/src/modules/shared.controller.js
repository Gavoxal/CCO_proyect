import { ok, created, noContent, notFound, paginated } from '../utils/response.js'
import { getPagination } from '../utils/pagination.js'
import { notificationService } from '../services/notification.service.js'
import { sendEmail } from '../services/email.service.js'

async function notificarEvento(db, evento, esActualizacion = false) {
    if (!evento.notificar) return;

    const usuarios = await db.usuario.findMany({
        where: { activo: true },
        select: { id: true, email: true }
    });
    if (usuarios.length === 0) return;

    const titulo = esActualizacion ? `Evento Actualizado: ${evento.titulo}` : `Nuevo Evento: ${evento.titulo}`;
    const fecha = new Date(evento.fechaInicio);
    // Simple base string for fallback timezone
    const fechaFormateada = `${fecha.toLocaleDateString('es-EC')} ${fecha.toLocaleTimeString('es-EC')}`;

    const mensaje = `${evento.descripcion || 'Sin descripción'}\nFecha: ${fechaFormateada}`;
    const htmlCorreo = `
        <div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #d32f2f;">${titulo}</h2>
            <p><strong>Fecha y Hora:</strong> ${fechaFormateada}</p>
            <p><strong>Descripción:</strong><br/>${evento.descripcion || 'Sin descripción detallada'}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 11px; color: #999;">Este es un mensaje automático del sistema CCO KidScam.</p>
        </div>
    `;

    const ids = usuarios.map(u => u.id);
    const emails = usuarios.map(u => u.email).filter(Boolean);

    // Crear notificaciones en BD (no bloqueante estricto, pero esperamos)
    try {
        await notificationService.crearNotificacionMasiva(ids, titulo, mensaje, 'EVENTO', evento.id);
        if (emails.length > 0) {
            await sendEmail(emails, titulo, htmlCorreo);
        }
    } catch (e) {
        console.error('Error al notificar evento:', e);
    }
}

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
    await notificarEvento(db, evento, false)
    return created(reply, evento)
}

export async function actualizarEvento(request, reply) {
    const db = request.server.db
    try {
        const e = await db.evento.update({ where: { id: parseInt(request.params.id) }, data: request.body })
        await notificarEvento(db, e, true)
        return ok(reply, e)
    } catch { return notFound(reply) }
}

export async function eliminarEvento(request, reply) {
    const db = request.server.db
    try { await db.evento.delete({ where: { id: parseInt(request.params.id) } }); return noContent(reply) }
    catch { return notFound(reply) }
}
