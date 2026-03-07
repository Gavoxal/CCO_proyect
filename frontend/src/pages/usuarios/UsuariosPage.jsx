import MainLayout from '../../components/layout/MainLayout';
import { Box, Typography, Alert } from '@mui/material';
export default function UsuariosPage() {
    return <MainLayout><Box sx={{ p: 3 }}><Typography variant="h4" fontWeight={800} sx={{ mb: 2 }}>Gestión de Usuarios</Typography><Alert severity="info">Módulo en construcción — solo visible para Administrador</Alert></Box></MainLayout>;
}
