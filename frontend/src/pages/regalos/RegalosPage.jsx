import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Chip, LinearProgress, MenuItem, TextField, Stack } from '@mui/material';
import MainLayout from '../../components/layout/MainLayout';
import DataTable from '../../components/common/DataTable';
import { regalosService, infantesService } from '../../services/appServices';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

export default function RegalosPage() {
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const anio = new Date().getFullYear();
    const canWrite = ['admin', 'director', 'secretaria'].includes(user?.rol);

    const [tipo, setTipo] = useState('regalo_navidad');
    const [pendientes, setPendientes] = useState([]);
    const [total, setTotal] = useState(0);
    const [entregados, setEntregados] = useState(0);
    const [loading, setLoading] = useState(true);

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const [allRes, pendRes] = await Promise.all([
                regalosService.listar({ tipo, anio, limit: 1 }),
                regalosService.pendientes({ tipo, anio }),
            ]);
            const t = allRes.meta?.total || 0;
            const p = pendRes.data?.length || 0;
            setTotal(t);
            setEntregados(t - p);
            setPendientes(pendRes.data || []);
        } catch { enqueueSnackbar('Error cargando regalos', { variant: 'error' }); }
        finally { setLoading(false); }
    }, [tipo]);

    useEffect(() => { cargar(); }, [cargar]);

    const marcarEntregado = async (infanteId) => {
        try {
            await regalosService.crear({ tipo, anio, infanteId, estado: 'entregado', fechaEntrega: new Date().toISOString().split('T')[0] });
            enqueueSnackbar('Marcado como entregado', { variant: 'success' });
            cargar();
        } catch { enqueueSnackbar('Error al actualizar', { variant: 'error' }); }
    };

    const porcentaje = total > 0 ? Math.round((entregados / total) * 100) : 0;
    const tipoLabel = tipo === 'regalo_navidad' ? '🎁 Navidad' : '🎒 Kit Escolar';

    const columns = [
        { id: 'nombre', label: 'Infante', render: r => `${r.infante?.persona?.nombres} ${r.infante?.persona?.apellidos}` },
        { id: 'codigo', label: 'Código', render: r => r.infante?.codigo },
        {
            id: 'acciones', label: '', render: r => canWrite && (
                <Button size="small" variant="contained" color="success" onClick={() => marcarEntregado(r.infanteId)}>
                    ✅ Marcar Entregado
                </Button>
            )
        },
    ];

    return (
        <MainLayout>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>Regalos y Kits Escolares {anio}</Typography>

                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <TextField select size="small" label="Tipo" value={tipo}
                        onChange={e => setTipo(e.target.value)} sx={{ minWidth: 180 }}>
                        <MenuItem value="regalo_navidad">🎁 Regalo de Navidad</MenuItem>
                        <MenuItem value="kit_escolar">🎒 Kit Escolar</MenuItem>
                    </TextField>
                </Stack>

                <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                    <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="h6" fontWeight={700}>{tipoLabel}</Typography>
                            <Typography variant="h6" fontWeight={800} color="primary">{entregados}/{total}</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={porcentaje}
                            sx={{ height: 12, borderRadius: 6, '& .MuiLinearProgress-bar': { borderRadius: 6 } }} />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {porcentaje}% completado · {pendientes.length} pendientes
                        </Typography>
                    </CardContent>
                </Card>

                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                    ⏳ Pendientes ({pendientes.length})
                </Typography>
                <DataTable columns={columns} rows={pendientes} loading={loading} totalCount={pendientes.length} />
            </Box>
        </MainLayout>
    );
}
