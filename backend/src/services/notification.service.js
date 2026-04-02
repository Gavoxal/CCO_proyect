import { prisma } from '../plugins/prisma.js';

export const notificationService = {
    /**
     * Create a single notification.
     */
    crearNotificacion: async (data) => {
        return await prisma.notificacion.create({ data });
    },

    /**
     * Create multiple notifications for a list of users.
     * @param {number[]} usuariosIds Array of user IDs
     * @param {string} titulo Notification title
     * @param {string} mensaje Notification message
     * @param {string} tipo TipoNotificacion enum (INFO, ALERTA, EVENTO)
     * @param {number|null} referenciaId Optional ID of the referenced entity (like Event ID)
     */
    crearNotificacionMasiva: async (usuariosIds, titulo, mensaje, tipo = 'INFO', referenciaId = null) => {
        const notificaciones = usuariosIds.map(id => ({
            usuarioId: parseInt(id),
            titulo,
            mensaje,
            tipo,
            referenciaId
        }));

        if (notificaciones.length === 0) return { count: 0 };

        return await prisma.notificacion.createMany({
            data: notificaciones
        });
    },

    /**
     * Get recent notifications for a specific user.
     */
    obtenerMisNotificaciones: async (usuarioId, soloNoLeidas = false) => {
        const id = parseInt(usuarioId);
        if (isNaN(id)) return []; // Si no hay ID válido, no hay notificaciones

        const where = { usuarioId: id };
        if (soloNoLeidas) where.leida = false;

        return await prisma.notificacion.findMany({
            where,
            orderBy: { fechaCreacion: 'desc' },
            take: 50 // Limit to last 50
        });
    },

    /**
     * Mark a specific notification as read.
     */
    marcarComoLeida: async (id, usuarioId) => {
        return await prisma.notificacion.updateMany({
            where: { id: parseInt(id), usuarioId: parseInt(usuarioId) },
            data: { leida: true }
        });
    },

    /**
     * Mark all unread notifications as read for a specific user.
     */
    marcarTodasComoLeidas: async (usuarioId) => {
        return await prisma.notificacion.updateMany({
            where: { usuarioId: parseInt(usuarioId), leida: false },
            data: { leida: true }
        });
    }
};
