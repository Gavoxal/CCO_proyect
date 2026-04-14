import { ok } from '../../utils/response.js';

export async function getStats(request, reply) {
    const db = request.server.db;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    try {
        // 1. Infantes
        const [totalInfantes, patrocinados] = await Promise.all([
            db.infante.count(),
            db.infante.count({ where: { esPatrocinado: true } })
        ]);

        // 2. Visitas este año (basado en el año lectivo o simplemente año calendario para dashboard rápido)
        const startOfYear = new Date(currentYear, 0, 1);
        const visitasRealizadas = await db.visita.count({
            where: {
                fecha: { gte: startOfYear },
                estado: 'Realizada'
            }
        });

        // 3. Asistencia este mes
        // Regla: porcentaje = (infantes que asistieron al menos 1 vez en el mes actual / total infantes) * 100
        // Se consideran asistencias válidas todos los estados distintos de "Ausente".
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
        const asistenciaValidaEstados = ['Mes', 'Semana', 'PagoDia', 'Pendiente', 'Punto'];
        const infantesAsistieronMes = await db.asistencia.groupBy({
            by: ['infanteId'],
            where: {
                fecha: { gte: startOfMonth, lte: endOfMonth },
                estado: { in: asistenciaValidaEstados }
            }
        });
        const asistentesUnicosMes = infantesAsistieronMes.length;
        const pctAsistencia = totalInfantes > 0 ? Math.round((asistentesUnicosMes / totalInfantes) * 100) : 0;

        // 4. Regalos y Kits (este año)
        const regalosRaw = await db.regalo.groupBy({
            by: ['tipo', 'estado'],
            where: { anio: currentYear },
            _count: { estado: true }
        });

        const gifts = {
            navidad: { entregados: 0, total: totalInfantes },
            kits: { entregados: 0, total: totalInfantes }
        };

        regalosRaw.forEach(r => {
            if (r.tipo === 'regalo_navidad' && r.estado === 'entregado') gifts.navidad.entregados += r._count.estado;
            if (r.tipo === 'kit_escolar' && r.estado === 'entregado') gifts.kits.entregados += r._count.estado;
        });

        // 5. Cumpleaños del mes
        // Prisma no tiene filtro nativo por mes, traemos infantes con fechaNac y filtramos
        const infantesConCumple = await db.infante.findMany({
            where: { persona: { fechaNacimiento: { not: null } } },
            select: {
                id: true,
                persona: {
                    select: { nombres: true, apellidos: true, fechaNacimiento: true }
                }
            }
        });

        const cumplesMes = infantesConCumple
            .filter(i => new Date(i.persona.fechaNacimiento).getMonth() === currentMonth)
            .map(i => ({
                id: i.id,
                nombre: `${i.persona.nombres} ${i.persona.apellidos}`,
                fecha: new Date(i.persona.fechaNacimiento).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' }),
                edad: currentYear - new Date(i.persona.fechaNacimiento).getFullYear()
            }))
            .sort((a,b) => new Date(a.fecha).getDate() - new Date(b.fecha).getDate())
            .slice(0, 5);

        // 6. Inventario (Materiales con stock bajo)
        const materiales = await db.inventarioMaterial.findMany();
        const stockBajo = materiales
            .filter(m => m.cantidadDisponible < m.stockMinimo)
            .map(m => ({
                id: m.id,
                nombre: m.nombreMaterial,
                cantidad: m.cantidadDisponible,
                min: m.stockMinimo
            }))
            .slice(0, 6);

        // 7. Próximos Eventos
        const eventos = await db.evento.findMany({
            where: { fechaInicio: { gte: now } },
            orderBy: { fechaInicio: 'asc' },
            take: 4
        });

        // 8. Usuarios
        const [usrActivos, tutores] = await Promise.all([
            db.usuario.count({ where: { activo: true } }),
            db.usuario.count({ where: { rol: { in: ['tutor', 'tutor_especial', 'proteccion'] }, activo: true } })
        ]);

        return ok(reply, {
            infantes: {
                total: totalInfantes,
                patrocinados,
                noPatrocinados: totalInfantes - patrocinados
            },
            asistencia: {
                pct: pctAsistencia,
                asistentesMes: asistentesUnicosMes
            },
            visitas: {
                realizadas: visitasRealizadas,
                sinVisita: Math.max(0, totalInfantes - visitasRealizadas)
            },
            regalos: gifts,
            cumplesMes,
            inventario: {
                matTotal: materiales.length,
                stockBajo,
                alertaCount: stockBajo.length
            },
            eventos: eventos.map(e => ({
                id: e.id,
                titulo: e.titulo,
                fecha: e.fechaInicio,
                desc: e.descripcion
            })),
            usuarios: {
                activos: usrActivos,
                tutores
            }
        });
    } catch (error) {
        request.server.log.error('Error en dashboard stats:', error);
        return reply.status(500).send({ success: false, error: 'Error al generar estadísticas' });
    }
}
