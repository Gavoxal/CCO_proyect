import { ok, created, noContent, notFound, paginated } from '../utils/response.js'
import { getPagination } from '../utils/pagination.js'
import { notificationService } from '../services/notification.service.js'
import { sendEmail } from '../services/email.service.js'

// ─── Plantilla de correo con diseño CCO ───────────────────────────────────────
export function generarHTMLCorreo({ titulo, subtitulo, fechaFormateada, descripcion, tipoEvento, esRecordatorio = false }) {
    const iconoTipo = { Iglesia: '⛪', Ministerio: '🤝', Emergencia: '🚨' };
    const icono = iconoTipo[tipoEvento] || '📅';
    const badgeColor = esRecordatorio ? '#FF8C00' : '#6A5ACD';
    const badgeText = esRecordatorio ? '⏰ RECORDATORIO' : (subtitulo || '📢 NUEVO EVENTO');

    return `
    <div style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:32px 0;">
        <tr><td align="center">
          <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

            <!-- Header con gradiente CCO -->
            <tr>
              <td style="background:linear-gradient(135deg,#FF8C00 0%,#6A5ACD 100%);padding:32px 40px;text-align:center;">
                <div style="font-size:28px;margin-bottom:8px;">⛪</div>
                <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.3px;">
                  Centro Cristiano Obrapía
                </h1>
                <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;font-weight:500;">
                  Sistema KidScam · Ministerio Vías en Acción
                </p>
              </td>
            </tr>

            <!-- Badge de tipo -->
            <tr>
              <td style="padding:24px 40px 0;text-align:center;">
                <span style="display:inline-block;background:${badgeColor};color:#fff;font-size:11px;font-weight:700;padding:6px 16px;border-radius:20px;letter-spacing:0.5px;">
                  ${badgeText}
                </span>
              </td>
            </tr>

            <!-- Título del evento -->
            <tr>
              <td style="padding:20px 40px 8px;text-align:center;">
                <h2 style="margin:0;color:#1a1a2e;font-size:22px;font-weight:800;">
                  ${icono} ${titulo}
                </h2>
              </td>
            </tr>

            <!-- Tarjeta de información -->
            <tr>
              <td style="padding:8px 40px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7ff;border-radius:12px;border:1px solid #e8e6f0;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom:12px;">
                            <span style="color:#6A5ACD;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">📅 Fecha y Hora</span>
                            <p style="margin:4px 0 0;color:#333;font-size:15px;font-weight:600;">${fechaFormateada}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="border-top:1px solid #e8e6f0;padding-top:12px;">
                            <span style="color:#6A5ACD;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">📝 Descripción</span>
                            <p style="margin:4px 0 0;color:#555;font-size:14px;line-height:1.6;">${descripcion || 'Sin descripción detallada'}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f8f7ff;padding:20px 40px;text-align:center;border-top:1px solid #e8e6f0;">
                <p style="margin:0;color:#999;font-size:11px;line-height:1.5;">
                  Este es un mensaje automático del sistema <strong style="color:#6A5ACD;">CCO KidScam</strong>.<br/>
                  Centro Cristiano Obrapía · Ministerio Vías en Acción
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </div>
    `;
}

async function notificarEvento(db, evento, esActualizacion = false) {
    if (!evento.notificar) return;

    const usuarios = await db.usuario.findMany({
        where: { activo: true },
        select: { id: true, email: true }
    });
    if (usuarios.length === 0) return;

    const titulo = esActualizacion ? `Evento Actualizado: ${evento.titulo}` : `Nuevo Evento: ${evento.titulo}`;
    const fecha = new Date(evento.fechaInicio);
    const fechaFormateada = `${fecha.toLocaleDateString('es-EC')} ${fecha.toLocaleTimeString('es-EC')}`;

    const mensaje = `${evento.descripcion || 'Sin descripción'}\nFecha: ${fechaFormateada}`;

    const htmlCorreo = generarHTMLCorreo({
        titulo: evento.titulo,
        subtitulo: esActualizacion ? '✏️ EVENTO ACTUALIZADO' : '📢 NUEVO EVENTO',
        fechaFormateada,
        descripcion: evento.descripcion,
        tipoEvento: evento.tipo,
    });

    const ids = usuarios.map(u => u.id);
    const emails = usuarios.map(u => u.email).filter(Boolean);

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
