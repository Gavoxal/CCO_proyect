import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { authService } from '../services/appServices';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');
        if (savedUser && savedToken) {
            try { setUser(JSON.parse(savedUser)); } catch { localStorage.clear(); }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const result = await authService.login(username, password);
        if (result.success) {
            const u = result.data.usuario;
            setUser(u);
            localStorage.setItem('user', JSON.stringify(u));
            localStorage.setItem('token', result.data.token);
        }
        return result;
    };

    const logout = () => {
        setUser(null);
        authService.logout();
    };

    const updateUser = (userData) => {
        const newUser = { ...user, ...userData };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    const hasRole = (...roles) => user && roles.includes(user.rol);

    const value = useMemo(() => ({
        user, loading, login, logout, updateUser, hasRole,
        isAuthenticated: !!user,
        isAdmin: user?.rol === 'admin',
        isDirector: user?.rol === 'director',
        isSecretaria: user?.rol === 'secretaria',
        isTutor: ['tutor', 'tutor_especial'].includes(user?.rol),
    }), [user, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
