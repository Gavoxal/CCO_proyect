import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { ThemeContextProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import RolGuard from './components/common/RolGuard';

// Páginas existentes
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

// Páginas nuevas
import InfantesPage from './pages/infantes/InfantesPage';
import InfanteDetailPage from './pages/infantes/InfanteDetailPage';
import InfanteFormPage from './pages/infantes/InfanteFormPage';
import AsistenciaPage from './pages/asistencia/AsistenciaPage';
import AsistenciaHistorialPage from './pages/asistencia/AsistenciaHistorialPage';
import VisitasPage from './pages/visitas/VisitasPage';
import MaterialesPage from './pages/inventario/MaterialesPage';
import AlimentosPage from './pages/inventario/AlimentosPage';
import SolicitudesPage from './pages/solicitudes/SolicitudesPage';
import RegalosPage from './pages/regalos/RegalosPage';
import MiembrosPage from './pages/miembros/MiembrosPage';
import CasasDePazPage from './pages/casasDePaz/CasasDePazPage';
import CalendarioPage from './pages/calendario/CalendarioPage';
import UsuariosPage from './pages/usuarios/UsuariosPage';

// ─── Guards ─────────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

// Roles para uso frecuente
const ESCRITURA = ['admin', 'director', 'secretaria', 'tutor_especial'];
const SOLO_ADMINS = ['admin', 'director'];

function App() {
  return (
    <ThemeContextProvider>
      <SnackbarProvider maxSnack={3} autoHideDuration={3000} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <AuthProvider>
          <Router>
            <Routes>

              {/* ── Público ─────────────────────────────────────────────── */}
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

              {/* ── Todos los roles autenticados ─────────────────────────── */}
              <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/calendario" element={<ProtectedRoute><CalendarioPage /></ProtectedRoute>} />
              <Route path="/asistencia/historial" element={<ProtectedRoute><AsistenciaHistorialPage /></ProtectedRoute>} />
              <Route path="/infantes" element={<ProtectedRoute><InfantesPage /></ProtectedRoute>} />
              <Route path="/infantes/:id" element={<ProtectedRoute><InfanteDetailPage /></ProtectedRoute>} />
              <Route path="/visitas" element={<ProtectedRoute><VisitasPage /></ProtectedRoute>} />
              <Route path="/inventario/materiales" element={<ProtectedRoute><MaterialesPage /></ProtectedRoute>} />
              <Route path="/solicitudes" element={<ProtectedRoute><SolicitudesPage /></ProtectedRoute>} />
              <Route path="/regalos" element={<ProtectedRoute><RegalosPage /></ProtectedRoute>} />

              {/* ── Escritura (secretaria+) ──────────────────────────────── */}
              <Route path="/asistencia" element={
                <ProtectedRoute><RolGuard roles={ESCRITURA}><AsistenciaPage /></RolGuard></ProtectedRoute>
              } />
              <Route path="/infantes/nuevo" element={
                <ProtectedRoute><RolGuard roles={ESCRITURA}><InfanteFormPage /></RolGuard></ProtectedRoute>
              } />
              <Route path="/infantes/:id/editar" element={
                <ProtectedRoute><RolGuard roles={ESCRITURA}><InfanteFormPage /></RolGuard></ProtectedRoute>
              } />
              <Route path="/inventario/alimentos" element={
                <ProtectedRoute><RolGuard roles={ESCRITURA}><AlimentosPage /></RolGuard></ProtectedRoute>
              } />

              {/* ── Solo Admin / Director ────────────────────────────────── */}
              <Route path="/miembros" element={
                <ProtectedRoute><RolGuard roles={SOLO_ADMINS}><MiembrosPage /></RolGuard></ProtectedRoute>
              } />
              <Route path="/casas-de-paz" element={
                <ProtectedRoute><RolGuard roles={SOLO_ADMINS}><CasasDePazPage /></RolGuard></ProtectedRoute>
              } />
              <Route path="/usuarios" element={
                <ProtectedRoute><RolGuard roles={['admin']}><UsuariosPage /></RolGuard></ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeContextProvider>
  );
}

export default App;
