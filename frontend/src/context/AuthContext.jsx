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
        const initAuth = async () => {
            const savedUser = localStorage.getItem('user');
            const savedToken = localStorage.getItem('token');
            if (savedUser && savedToken) {
                try { 
                    // Establecer estado inicial rápido para que no haya parpadeo
                    setUser(JSON.parse(savedUser)); 
                    setToken(savedToken);
                    
                    // Obtener perfil completo en segundo plano
                    const fullUser = await authService.me();
                    setUser(fullUser);
                    localStorage.setItem('user', JSON.stringify(fullUser));
                } catch { 
                    localStorage.clear(); 
                    setUser(null);
                    setToken(null);
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (username, password) => {
        const result = await authService.login(username, password);
        if (result.success) {
            const t = result.data.token;
            setToken(t);
            localStorage.setItem('token', t);
            
            // Obtener perfil completo inmediatamente
            try {
                const fullUser = await authService.me();
                setUser(fullUser);
                localStorage.setItem('user', JSON.stringify(fullUser));
            } catch (e) {
                // Fallback al payload del login si falla
                const u = result.data.usuario;
                setUser(u);
                localStorage.setItem('user', JSON.stringify(u));
            }
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
