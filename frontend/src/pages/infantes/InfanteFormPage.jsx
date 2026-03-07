import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box, Typography, TextField, Button, Grid, MenuItem,
    FormControlLabel, Switch, Card, CardContent, CircularProgress, Alert,
} from '@mui/material';
import { ArrowBack as BackIcon, Save as SaveIcon } from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import { infantesService } from '../../services/appServices';
import { useSnackbar } from 'notistack';

const EMPTY_FORM = {
    codigo: '', esPatrocinado: false, tipoPrograma: 'Ministerio',
    fuentePatrocinio: 'Ninguno', enfermedades: '', alergias: '',
    persona: { nombres: '', apellidos: '', cedula: '', telefono1: '', telefono2: '', email: '', direccion: '', fechaNacimiento: '' },
};

const InfanteFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const isEditing = !!id;

    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isEditing) return;
        infantesService.obtener(id)
            .then(res => {
                const d = res.data;
                setForm({
                    codigo: d.codigo, esPatrocinado: d.esPatrocinado,
                    tipoPrograma: d.tipoPrograma, fuentePatrocinio: d.fuentePatrocinio,
                    enfermedades: d.enfermedades || '', alergias: d.alergias || '',
                    persona: {
                        nombres: d.persona?.nombres || '', apellidos: d.persona?.apellidos || '',
                        cedula: d.persona?.cedula || '', telefono1: d.persona?.telefono1 || '',
                        telefono2: d.persona?.telefono2 || '', email: d.persona?.email || '',
                        direccion: d.persona?.direccion || '',
                        fechaNacimiento: d.persona?.fechaNacimiento ? d.persona.fechaNacimiento.split('T')[0] : '',
                    },
                });
            })
            .catch(() => enqueueSnackbar('Error cargando datos', { variant: 'error' }))
            .finally(() => setLoading(false));
    }, [id]);

    const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
    const setP = (field, val) => setForm(f => ({ ...f, persona: { ...f.persona, [field]: val } }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEditing) {
                await infantesService.actualizar(id, form);
                enqueueSnackbar('Infante actualizado', { variant: 'success' });
                navigate(`/infantes/${id}`);
            } else {
                const res = await infantesService.crear(form);
                enqueueSnackbar('Infante creado', { variant: 'success' });
                navigate(`/infantes/${res.data.id}`);
            }
        } catch (err) {
            enqueueSnackbar(err?.response?.data?.error || 'Error guardando', { variant: 'error' });
        } finally { setSaving(false); }
    };

    if (loading) return <MainLayout><Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box></MainLayout>;

    return (
        <MainLayout>
            <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, maxWidth: 860, mx: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} variant="outlined" size="small" sx={{ mb: 1 }}>
                            Volver
                        </Button>
                        <Typography variant="h4" fontWeight={800}>{isEditing ? 'Editar Infante' : 'Nuevo Infante'}</Typography>
                    </Box>
                    <Button type="submit" variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                        disabled={saving} sx={{ borderRadius: 2, fontWeight: 700 }}>
                        {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                </Box>

                {/* Sección 1: Datos del Infante */}
                <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Datos del Infante</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Código *" value={form.codigo} onChange={e => set('codigo', e.target.value)} required size="small" />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField select fullWidth label="Tipo Programa *" value={form.tipoPrograma} onChange={e => set('tipoPrograma', e.target.value)} size="small">
                                    {['Ministerio', 'Comedor', 'Ambos'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControlLabel
                                    control={<Switch checked={form.esPatrocinado} onChange={e => set('esPatrocinado', e.target.checked)} />}
                                    label="Patrocinado"
                                />
                            </Grid>
                            {form.esPatrocinado && (
                                <Grid item xs={12} sm={4}>
                                    <TextField select fullWidth label="Fuente Patrocinio" value={form.fuentePatrocinio} onChange={e => set('fuentePatrocinio', e.target.value)} size="small">
                                        {['Compassion', 'Plan', 'Ninguno'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                                    </TextField>
                                </Grid>
                            )}
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Enfermedades" value={form.enfermedades} onChange={e => set('enfermedades', e.target.value)} size="small" multiline rows={2} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Alergias" value={form.alergias} onChange={e => set('alergias', e.target.value)} size="small" multiline rows={2} />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Sección 2: Datos del Representante */}
                <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Datos del Representante / Niño</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Nombres *" value={form.persona.nombres} onChange={e => setP('nombres', e.target.value)} required size="small" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Apellidos *" value={form.persona.apellidos} onChange={e => setP('apellidos', e.target.value)} required size="small" />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Cédula" value={form.persona.cedula} onChange={e => setP('cedula', e.target.value)} size="small" />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Teléfono 1 *" value={form.persona.telefono1} onChange={e => setP('telefono1', e.target.value)} required size="small" />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Teléfono 2" value={form.persona.telefono2} onChange={e => setP('telefono2', e.target.value)} size="small" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Email" value={form.persona.email} onChange={e => setP('email', e.target.value)} type="email" size="small" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Fecha de Nacimiento" type="date" value={form.persona.fechaNacimiento}
                                    onChange={e => setP('fechaNacimiento', e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Dirección" value={form.persona.direccion} onChange={e => setP('direccion', e.target.value)} size="small" />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Box>
        </MainLayout>
    );
};

export default InfanteFormPage;
