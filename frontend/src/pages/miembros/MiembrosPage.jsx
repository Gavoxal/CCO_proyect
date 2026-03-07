import MainLayout from '../../components/layout/MainLayout';
import { Box, Typography, Alert } from '@mui/material';
export default function MiembrosPage() {
    return <MainLayout><Box sx={{ p: 3 }}><Typography variant="h4" fontWeight={800} sx={{ mb: 2 }}>Miembros de la Iglesia</Typography><Alert severity="info">Módulo en construcción</Alert></Box></MainLayout>;
}
