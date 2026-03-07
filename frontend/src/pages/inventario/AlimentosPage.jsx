// Páginas placeholder con estructura base — se completan en siguiente iteración
// Cada una tiene la estructura MainLayout + DataTable lista para conectar al servicio

import MainLayout from '../../components/layout/MainLayout';
import { Box, Typography, Alert } from '@mui/material';

export default function AlimentosPage() {
    return (
        <MainLayout>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" fontWeight={800} sx={{ mb: 2 }}>Inventario · Alimentos</Typography>
                <Alert severity="info">Módulo en construcción — misma estructura que Materiales con ingresar/despachar</Alert>
            </Box>
        </MainLayout>
    );
}
