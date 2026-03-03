import { mockUsers } from './mockData';

const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
    login: async (email, password) => {
        await delay(800);
        const user = mockUsers.find(u => u.email === email && u.password === password);
        if (user) {
            const { password: _, ...safeUser } = user;
            return {
                success: true,
                user: safeUser,
                token: `mock-jwt-token-${Date.now()}`,
                message: 'Login exitoso',
            };
        }
        return {
            success: false,
            user: null,
            token: null,
            message: 'Email o contraseña incorrectos',
        };
    },

    logout: async () => {
        await delay(300);
        return { success: true };
    },

    getCurrentUser: async () => {
        await delay(300);
        const saved = localStorage.getItem('user');
        if (saved) {
            return { success: true, user: JSON.parse(saved) };
        }
        return { success: false, user: null };
    },
};
