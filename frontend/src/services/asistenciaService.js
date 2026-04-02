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
    }
};

export default asistenciaService;
