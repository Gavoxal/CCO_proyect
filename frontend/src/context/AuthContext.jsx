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
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');
        if (savedUser && savedToken) {
            try { 
                setUser(JSON.parse(savedUser)); 
                setToken(savedToken);
            } catch { 
                localStorage.clear(); 
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const result = await authService.login(username, password);
        if (result.success) {
            const u = result.data.usuario;
            const t = result.data.token;
            setUser(u);
            setToken(t);
            localStorage.setItem('user', JSON.stringify(u));
            localStorage.setItem('token', t);
        }
        return result;
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        authService.logout();
    };

    const updateUser = (userData) => {
        const newUser = { ...user, ...userData };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    const hasRole = (...roles) => user && roles.includes(user.rol);

    const getImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path; // URL externa
        const separator = path.includes('?') ? '&' : '?';
        return `${path}${separator}token=${token}`;
    };

    const value = useMemo(() => ({
        user, token, loading, login, logout, updateUser, hasRole, getImageUrl,
        isAuthenticated: !!user,
        isAdmin: user?.rol === 'admin',
        isDirector: user?.rol === 'director',
        isSecretaria: user?.rol === 'secretaria',
        isTutor: ['tutor', 'tutor_especial'].includes(user?.rol),
    }), [user, token, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
