import { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Button, Chip, Avatar,
    Alert, Divider, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, CircularProgress, Stack,
} from '@mui/material';
import { Add as AddIcon, HomeWork as VisitaIcon } from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import { infantesService, visitasService } from '../../services/appServices';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

export default function VisitasPage() {
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const canWrite = ['admin', 'director', 'secretaria', 'tutor_especial'].includes(user?.rol);

    const [sinVisita, setSinVisita] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ infanteId: '', fecha: '', observaciones: '' });

    const cargar = async () => {
        setLoading(true);
        try {
            const res = await infantesService.sinVisitaAnio();
            setSinVisita(res.data || []);
        } catch { enqueueSnackbar('Error cargando visitas', { variant: 'error' }); }
        finally { setLoading(false); }
    };

    useEffect(() => { cargar(); }, []);

    const handleRegistrar = (infanteId) => { setForm(f => ({ ...f, infanteId })); setOpen(true); };

    const guardar = async () => {
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('infanteId', form.infanteId);
            fd.append('fecha', form.fecha);
            if (form.observaciones) fd.append('observaciones', form.observaciones);
            await visitasService.crear(fd);
            enqueueSnackbar('Visita registrada', { variant: 'success' });
            setOpen(false);
            cargar();
        } catch { enqueueSnackbar('Error guardando visita', { variant: 'error' }); }
        finally { setSaving(false); }
    };

    return (
        <MainLayout>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>Visitas Domiciliarias</Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Año {new Date().getFullYear()} — Se espera al menos una visita por infante
                </Typography>

                {loading ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
                ) : sinVisita.length === 0 ? (
                    <Alert severity="success" variant="outlined">
                        ✅ ¡Todos los infantes han sido visitados este año!
                    </Alert>
                ) : (
                    <>
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            ⚠️ {sinVisita.length} infante(s) aún no han sido visitados este año
                        </Alert>
                        <Grid container spacing={2}>
                            {sinVisita.map(inf => (
                                <Grid item xs={12} sm={6} md={4} key={inf.id}>
                                    <Card elevation={0} sx={{ border: 2, borderColor: 'warning.main', borderRadius: 3 }}>
                                        <CardContent sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
                                                <Avatar sx={{ bgcolor: '#ff9800', fontWeight: 700 }}>
                                                    {inf.persona?.nombres?.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {inf.persona?.nombres} {inf.persona?.apellidos}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">{inf.codigo}</Typography>
                                                </Box>
                                            </Box>
                                            {inf.tutor && (
                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                                    Tutor: {inf.tutor.persona?.nombres} {inf.tutor.persona?.apellidos}
                                                </Typography>
                                            )}
                                            {canWrite && (
                                                <Button fullWidth size="small" variant="contained" color="warning"
                                                    startIcon={<AddIcon />} onClick={() => handleRegistrar(inf.id)}>
                                                    Registrar Visita
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}

                {/* Modal registrar visita */}
                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle fontWeight={700}>Registrar Visita</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <TextField label="Fecha *" type="date" value={form.fecha}
                                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                                InputLabelProps={{ shrink: true }} fullWidth size="small" required />
                            <TextField label="Observaciones" value={form.observaciones}
                                onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                                multiline rows={3} fullWidth size="small" />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button variant="contained" onClick={guardar} disabled={!form.fecha || saving}>
                            {saving ? <CircularProgress size={18} /> : 'Guardar'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </MainLayout>
    );
}
