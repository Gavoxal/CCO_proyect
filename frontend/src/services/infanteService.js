import api from './api';

/**
 * Servicio de Infantes
 * Conecta con el backend (/api/v1/infantes)
 */
const infanteService = {
    /**
     * Lista todos los infantes con filtros y paginación
     */
    listar: async (params = {}) => {
        const res = await api.get('/infantes', { params });
        return res.data;
    },

    /**
     * Obtiene un infante por ID
     */
    obtenerPorId: async (id) => {
        const res = await api.get(`/infantes/${id}`);
        return res.data;
    },

    /**
     * Crea un nuevo infante
     */
    crear: async (datos) => {
        const res = await api.post('/infantes', datos);
        return res.data;
    },

    /**
     * Actualiza un infante existente
     */
    actualizar: async (id, datos) => {
        const res = await api.put(`/infantes/${id}`, datos);
        return res.data;
    },

    /**
     * Elimina un infante
     */
    eliminar: async (id) => {
        const res = await api.delete(`/infantes/${id}`);
        return res.data;
    },

    /**
     * Sube fotografía del infante
     */
    subirFoto: async (id, file) => {
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.post(`/infantes/${id}/foto`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    }
};

export default infanteService;
