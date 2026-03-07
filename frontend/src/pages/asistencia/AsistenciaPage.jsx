import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Card, CardContent, Button, Chip, ToggleButton,
    ToggleButtonGroup, Grid, TextField, CircularProgress, Alert, Stack,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import { infantesService, asistenciaService } from '../../services/appServices';
import { useSnackbar } from 'notistack';

const ESTADO_COLORS = { Presente: 'success', Ausente: 'error', Justificado: 'warning' };
const EMOJI = { Presente: '✅', Ausente: '❌', Justificado: '📋' };

const AsistenciaPage = () => {
    const { enqueueSnackbar } = useSnackbar();
    // Fecha como string YYYY-MM-DD para el input nativo
    const hoy = new Date().toISOString().split('T')[0];
    const [fecha, setFecha] = useState(hoy);
    const [infantes, setInfantes] = useState([]);
    const [estados, setEstados] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const res = await infantesService.listar({ limit: 100 });
            const lista = res.data || [];
            setInfantes(lista);
            const initial = {};
            lista.forEach(i => { initial[i.id] = 'Presente'; });
            setEstados(initial);
        } catch { enqueueSnackbar('Error cargando infantes', { variant: 'error' }); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const handleEstado = (infanteId, nuevoEstado) => {
        if (!nuevoEstado) return;
        setEstados(e => ({ ...e, [infanteId]: nuevoEstado }));
    };

    const guardar = async () => {
        setSaving(true);
        try {
            const registros = Object.entries(estados).map(([infanteId, estado]) => ({
                infanteId: parseInt(infanteId), estado,
            }));
            await asistenciaService.registrarBulk(fecha, registros);
            enqueueSnackbar(`Asistencia del ${new Date(fecha + 'T12:00:00').toLocaleDateString()} guardada`, { variant: 'success' });
        } catch { enqueueSnackbar('Error guardando asistencia', { variant: 'error' }); }
        finally { setSaving(false); }
    };

    const conteo = Object.values(estados).reduce(
        (acc, e) => { acc[e] = (acc[e] || 0) + 1; return acc; },
        { Presente: 0, Ausente: 0, Justificado: 0 }
    );

    return (
        <MainLayout>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={800}>Toma de Asistencia</Typography>
                        <Typography color="text.secondary">Registra la asistencia de los infantes</Typography>
                    </Box>
                    <Button variant="contained"
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                        onClick={guardar} disabled={saving || loading}
                        sx={{ fontWeight: 700, borderRadius: 2 }}>
                        {saving ? 'Guardando...' : 'Guardar Asistencia'}
                    </Button>
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <TextField
                        type="date" size="small" label="Fecha"
                        value={fecha} onChange={e => setFecha(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 180 }}
                    />
                    <Stack direction="row" spacing={1}>
                        {Object.entries(conteo).map(([estado, cnt]) => (
                            <Chip key={estado} label={`${EMOJI[estado]} ${cnt} ${estado}`}
                                color={ESTADO_COLORS[estado]} variant="outlined" />
                        ))}
                    </Stack>
                </Stack>

                {loading ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
                ) : infantes.length === 0 ? (
                    <Alert severity="info">No hay infantes registrados</Alert>
                ) : (
                    <Grid container spacing={1.5}>
                        {infantes.map(inf => (
                            <Grid item xs={12} sm={6} md={4} key={inf.id}>
                                <Card elevation={0} sx={{
                                    border: 2,
                                    borderColor: estados[inf.id] === 'Presente' ? 'success.main'
                                        : estados[inf.id] === 'Ausente' ? 'error.main' : 'warning.main',
                                    borderRadius: 2, transition: 'border-color 0.2s ease',
                                }}>
                                    <CardContent sx={{ p: 1.5, pb: '12px !important' }}>
                                        <Typography variant="body2" fontWeight={700} noWrap>
                                            {inf.persona?.nombres} {inf.persona?.apellidos}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">{inf.codigo}</Typography>
                                        <ToggleButtonGroup value={estados[inf.id]} exclusive size="small" fullWidth sx={{ mt: 1 }}
                                            onChange={(_, val) => handleEstado(inf.id, val)}>
                                            <ToggleButton value="Presente" color="success" sx={{ fontSize: '0.7rem' }}>✅ Pte</ToggleButton>
                                            <ToggleButton value="Ausente" color="error" sx={{ fontSize: '0.7rem' }}>❌ Aus</ToggleButton>
                                            <ToggleButton value="Justificado" color="warning" sx={{ fontSize: '0.7rem' }}>📋 Jus</ToggleButton>
                                        </ToggleButtonGroup>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>
        </MainLayout>
    );
};

export default AsistenciaPage;
