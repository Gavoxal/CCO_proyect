// Servicio de autenticación — conecta al backend real
import api from './api';

// ─── Usuarios mock (solo para desarrollo sin backend) ────────────────────────
const MOCK_USERS = [
    { id: 1, username: 'admin', password: 'Admin2026!', rol: 'admin', nombre: 'Administrador CCO', email: 'admin@cco.com' },
    { id: 2, username: 'secretaria', password: 'Secretaria2026!', rol: 'secretaria', nombre: 'Secretaria CCO', email: 'secretaria@cco.com' },
    { id: 3, username: 'tutor1', password: 'Tutor2026!', rol: 'tutor', nombre: 'Tutor del Ministerio', email: 'tutor1@cco.com' },
];

export const authService = {
    login: async (username, password) => {
        try {
            // Intenta con el backend real
            const { data } = await api.post('/auth/login', { username, password });
            return data; // { success, data: { token, usuario } }
        } catch (err) {
            // Si no hay backend (red caída), usa modo mock
            const isNetworkError = !err.response;
            if (!isNetworkError) throw err; // error real del servidor (401, 500, etc.) → propagar

            const found = MOCK_USERS.find(
                u => (u.username === username || u.email === username) && u.password === password
            );
            if (!found) {
                return { success: false, message: 'Usuario o contraseña incorrectos (modo demo)' };
            }
            const { password: _, ...usuario } = found;
            return {
                success: true,
                data: {
                    token: `mock-token-${Date.now()}`,
                    usuario: { ...usuario },
                },
            };
        }
    },

    me: async () => {
        const { data } = await api.get('/auth/me');
        return data.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
};


export const infantesService = {
    listar: (params) => api.get('/infantes', { params }).then(r => r.data),
    obtener: (id) => api.get(`/infantes/${id}`).then(r => r.data),
    crear: (body) => api.post('/infantes', body).then(r => r.data),
    actualizar: (id, body) => api.put(`/infantes/${id}`, body).then(r => r.data),
    eliminar: (id) => api.delete(`/infantes/${id}`).then(r => r.data),
    subirFoto: (id, file) => {
        const fd = new FormData();
        fd.append('file', file);
        return api.post(`/infantes/${id}/foto`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data);
    },
    sinVisitaAnio: () => api.get('/infantes/sin-visita-anio').then(r => r.data),
};

export const asistenciaService = {
    listar: (params) => api.get('/asistencia', { params }).then(r => r.data),
    registrarBulk: (fecha, registros) => api.post('/asistencia/bulk', { fecha, registros }).then(r => r.data),
    resumen: (infanteId, anio) => api.get('/asistencia/resumen', { params: { infanteId, anio } }).then(r => r.data),
};

export const visitasService = {
    listar: (params) => api.get('/visitas', { params }).then(r => r.data),
    crear: (formData) => api.post('/visitas', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
    eliminar: (id) => api.delete(`/visitas/${id}`).then(r => r.data),
};

export const materialesService = {
    listar: (params) => api.get('/inventario/materiales', { params }).then(r => r.data),
    obtener: (id) => api.get(`/inventario/materiales/${id}`).then(r => r.data),
    crear: (body) => api.post('/inventario/materiales', body).then(r => r.data),
    actualizar: (id, body) => api.put(`/inventario/materiales/${id}`, body).then(r => r.data),
    eliminar: (id) => api.delete(`/inventario/materiales/${id}`).then(r => r.data),
    despachar: (id, cantidad) => api.patch(`/inventario/materiales/${id}/despachar`, { cantidad }).then(r => r.data),
    ingresar: (id, cantidad) => api.patch(`/inventario/materiales/${id}/ingresar`, { cantidad }).then(r => r.data),
    alertas: () => api.get('/inventario/materiales/alertas').then(r => r.data),
    subirFoto: (id, file) => {
        const fd = new FormData();
        fd.append('file', file);
        return api.post(`/inventario/materiales/${id}/foto`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data);
    },
};

export const incidentesService = {
    listar: (params) => api.get('/incidentes', { params }).then(r => r.data),
    obtener: (id) => api.get(`/incidentes/${id}`).then(r => r.data),
    crear: (body) => api.post('/incidentes', body).then(r => r.data),
    eliminar: (id) => api.delete(`/incidentes/${id}`).then(r => r.data),
    subirFoto: (id, file) => {
        const fd = new FormData();
        fd.append('file', file);
        return api.post(`/incidentes/${id}/foto`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data);
    },
};


export const regalosService = {
    listar: (params) => api.get('/regalos', { params }).then(r => r.data),
    pendientes: (params) => api.get('/regalos/pendientes', { params }).then(r => r.data),
    crear: (body) => api.post('/regalos', body).then(r => r.data),
    actualizar: (id, body) => api.put(`/regalos/${id}`, body).then(r => r.data),
    eliminar: (id) => api.delete(`/regalos/${id}`).then(r => r.data),
};

export const miembrosService = {
    listar: (params) => api.get('/miembros', { params }).then(r => r.data),
    crear: (body) => api.post('/miembros', body).then(r => r.data),
    actualizar: (id, body) => api.put(`/miembros/${id}`, body).then(r => r.data),
    eliminar: (id) => api.delete(`/miembros/${id}`).then(r => r.data),
};

export const casasPazService = {
    listar: (params) => api.get('/casas-de-paz', { params }).then(r => r.data),
    crear: (body) => api.post('/casas-de-paz', body).then(r => r.data),
    actualizar: (id, body) => api.put(`/casas-de-paz/${id}`, body).then(r => r.data),
    eliminar: (id) => api.delete(`/casas-de-paz/${id}`).then(r => r.data),
};

export const eventosService = {
    listar: (params) => api.get('/eventos', { params }).then(r => r.data),
    crear: (body) => api.post('/eventos', body).then(r => r.data),
    actualizar: (id, body) => api.put(`/eventos/${id}`, body).then(r => r.data),
    eliminar: (id) => api.delete(`/eventos/${id}`).then(r => r.data),
};

export const usuariosService = {
    listar: (params) => api.get('/usuarios', { params }).then(r => r.data),
    crear: (body) => api.post('/usuarios', body).then(r => r.data),
    actualizar: (id, body) => api.put(`/usuarios/${id}`, body).then(r => r.data),
    eliminar: (id) => api.delete(`/usuarios/${id}`).then(r => r.data),
};

export const importService = {
    importarInfantes: (file) => {
        const fd = new FormData();
        fd.append('file', file);
        return api.post('/import/infantes', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
    },
    importarRegalos: (file) => {
        const fd = new FormData();
        fd.append('file', file);
        return api.post('/import/regalos', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
    },
};
