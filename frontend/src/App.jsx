import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import RegalosPage from './pages/regalos/RegalosPage';
import CalendarioPage from './pages/calendario/CalendarioPage';
import UsuariosPage from './pages/usuarios/UsuariosPage';
import ProfilePage from './pages/usuarios/ProfilePage';
import IncidentesPage from './pages/incidentes/IncidentesPage';
import ReportarIncidentePage from './pages/incidentes/ReportarIncidentePage';

// ─── Guards ─────────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.passwordExpired && location.pathname !== '/perfil') {
    return <Navigate to="/perfil" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

// Roles para uso frecuente
const ESCRITURA = ['admin', 'director', 'proteccion', 'secretaria', 'tutor_especial'];
const SOLO_ADMINS = ['admin', 'director', 'proteccion'];
const INCIDENTES_VER = ['admin', 'director', 'proteccion', 'secretaria'];
const INCIDENTES_CREAR = ['admin', 'director', 'proteccion', 'secretaria', 'tutor_especial', 'tutor'];

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
              <Route path="/regalos" element={<ProtectedRoute><RegalosPage /></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

              {/* ── Reportar incidente (tutores y superiores) */}
              <Route path="/incidentes/nuevo" element={
                <ProtectedRoute><RolGuard roles={INCIDENTES_CREAR}><ReportarIncidentePage /></RolGuard></ProtectedRoute>
              } />

              {/* ── Ver incidentes (solo admin/director/proteccion/secretaria) */}
              <Route path="/incidentes" element={
                <ProtectedRoute><RolGuard roles={INCIDENTES_VER}><IncidentesPage /></RolGuard></ProtectedRoute>
              } />
              <Route path="/incidentes/:id" element={
                <ProtectedRoute><RolGuard roles={INCIDENTES_VER}><IncidentesPage /></RolGuard></ProtectedRoute>
              } />

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


              <Route path="/usuarios" element={
                <ProtectedRoute><RolGuard roles={SOLO_ADMINS}><UsuariosPage /></RolGuard></ProtectedRoute>
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
