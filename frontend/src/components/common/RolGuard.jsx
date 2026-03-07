import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * RolGuard — Protege una ruta para que solo accedan roles específicos.
 * Si el usuario no tiene el rol requerido, lo redirige al dashboard.
 */
const RolGuard = ({ children, roles = [], redirect = '/' }) => {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    if (roles.length === 0) return children;
    if (!roles.includes(user.rol)) return <Navigate to={redirect} replace />;

    return children;
};

export default RolGuard;
