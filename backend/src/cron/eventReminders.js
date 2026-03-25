import cron from 'node-cron';
import prisma from '../plugins/prisma.js';
import { notificationService } from '../services/notification.service.js';
import { sendEmail } from '../services/email.service.js';

export const startEventRemindersCron = () => {
    // Run every day at 8:00 AM server time
    cron.schedule('0 8 * * *', async () => {
        try {
            console.log('⏰ Ejecutando cron de recordatorios de eventos...');

            // Buscar eventos que ocurran exactamente en 2 días (y tengan notificar=true)
            const hoy = new Date();
            const dosDiasDespuesInicio = new Date(hoy);
            dosDiasDespuesInicio.setDate(hoy.getDate() + 2);
            dosDiasDespuesInicio.setHours(0, 0, 0, 0);

            const dosDiasDespuesFin = new Date(dosDiasDespuesInicio);
            dosDiasDespuesFin.setHours(23, 59, 59, 999);

            const eventos = await prisma.evento.findMany({
                where: {
                    notificar: true,
                    fechaInicio: {
                        gte: dosDiasDespuesInicio,
                        lte: dosDiasDespuesFin
                    }
                }
            });

            if (eventos.length === 0) {
                console.log('No hay eventos en 2 días para recordar hoy.');
                return;
            }

            // Get all active users to notify
            const usuarios = await prisma.usuario.findMany({
                where: { activo: true },
                select: { id: true, email: true }
            });

            if (usuarios.length === 0) return;

            const ids = usuarios.map(u => u.id);
            const emails = usuarios.map(u => u.email).filter(Boolean);

            for (const evento of eventos) {
                const titulo = `Recordatorio de Evento: ${evento.titulo}`;
                const fecha = new Date(evento.fechaInicio);
                const fechaFormateada = `${fecha.toLocaleDateString('es-EC')} ${fecha.toLocaleTimeString('es-EC')}`;

                const mensaje = `Este evento es en 2 días.\n\n${evento.descripcion || 'Sin descripción'}\nFecha: ${fechaFormateada}`;
                const htmlCorreo = `
                    <div style="font-family: sans-serif; color: #333;">
                        <h2 style="color: #FF8C00;">⏰ ${titulo}</h2>
                        <p><strong>Faltan 2 días para este evento.</strong></p>
                        <p><strong>Fecha y Hora:</strong> ${fechaFormateada}</p>
                        <p><strong>Descripción:</strong><br/>${evento.descripcion || 'Sin descripción detallada'}</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 11px; color: #999;">Este es un mensaje automático del sistema CCO KidScam.</p>
                    </div>
                `;

                // Notificar masivamente en BD
                await notificationService.crearNotificacionMasiva(ids, titulo, mensaje, 'ALERTA', evento.id);

                // Enviar correos
                if (emails.length > 0) {
                    await sendEmail(emails, titulo, htmlCorreo);
                }
            }

            console.log(`✅ Se enviaron recordatorios para ${eventos.length} evento(s).`);
        } catch (error) {
            console.error('❌ Error ejecutando cron de recordatorios:', error);
        }
    });
};
