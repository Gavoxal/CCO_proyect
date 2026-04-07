import api from './api';

const visitaService = {
    listar: async (params) => {
        const { data } = await api.get('/visitas', { params });
        return data;
    },
    
    listarPendientes: async (params) => {
        const { data } = await api.get('/visitas/pendientes', { params });
        return data;
    },

    listarTutores: async () => {
        const { data } = await api.get('/usuarios/tutores');
        return data;
    },
    
    obtener: async (id) => {
        const { data } = await api.get(`/visitas/${id}`);
        return data;
    },
    
    crear: async (payload) => {
        // Soporta tanto FormData como JSON
        const isFormData = payload instanceof FormData;
        const { data } = await api.post('/visitas', payload, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
        });
        return data;
    },
    
    eliminar: async (id) => {
        await api.delete(`/visitas/${id}`);
        return true;
    }
};

export default visitaService;
