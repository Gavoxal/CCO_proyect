import api from './api';

/**
 * Servicio de Asistencia
 * Conecta con el backend (/api/v1/asistencia)
 */
const asistenciaService = {
    /**
     * Lista registros de asistencia con filtros
     */
    listar: async (params = {}) => {
        const res = await api.get('/asistencia', { params });
        return res.data;
    },

    /**
     * Registra asistencia masiva (Bulk)
     * @param {string} fecha - Formato ISO 'YYYY-MM-DD'
     * @param {Array} registros - [{ infanteId, estado }]
     */
    registrarBulk: async (fecha, registros) => {
        const res = await api.post('/asistencia/bulk', { fecha, registros });
        return res.data;
    },

    /**
     * Obtiene el resumen de asistencia de un infante en un año
     */
    obtenerResumen: async (infanteId, anio) => {
        const res = await api.get('/asistencia/resumen', { params: { infanteId, anio } });
        return res.data;
    },

    /**
     * Paga toda la deuda pendiente de un infante
     */
    pagarDeuda: async (infanteId) => {
        const res = await api.patch(`/asistencia/pagar-deuda/${infanteId}`);
        return res.data;
    },

    /**
     * Elimina todos los registros de asistencia de una fecha
     * @param {string} fecha - Formato 'YYYY-MM-DD'
     */
    eliminarFecha: async (fecha) => {
        const res = await api.delete(`/asistencia/fecha/${fecha}`);
        return res.data;
    },

    /**
     * Actualiza (o crea) el registro de un infante en una fecha
     * @param {number} infanteId
     * @param {string} fecha - Formato 'YYYY-MM-DD'
     * @param {string} estado - Mes|Semana|PagoDia|Pendiente|Punto|Ausente
     */
    actualizarRegistro: async (infanteId, fecha, estado) => {
        const res = await api.patch(`/asistencia/${infanteId}/${fecha}`, { estado });
        return res.data;
    }
};

export default asistenciaService;
