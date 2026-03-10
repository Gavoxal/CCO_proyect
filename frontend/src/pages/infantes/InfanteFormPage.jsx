import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box, Typography, TextField, Button, Grid, MenuItem,
    FormControlLabel, Switch, Card, CardContent, alpha, useTheme, Stack,
} from '@mui/material';
import { ArrowBack as BackIcon, Save as SaveIcon, PersonAdd as AddPersonIcon } from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import { useSnackbar } from 'notistack';

// ─── Paleta CCO ───────────────────────────────────────────────────────────────
const CCO = { amarillo: '#FFD700', naranja: '#FF8C00', violeta: '#6A5ACD', azul: '#4169E1' };

const EMPTY_FORM = {
    codigo: '', esPatrocinado: false, tipoPrograma: 'Ministerio',
    fuentePatrocinio: 'Ninguno', enfermedades: '', alergias: '',
    persona: { nombres: '', apellidos: '', cedula: '', telefono1: '', telefono2: '', email: '', direccion: '', fechaNacimiento: '' },
};

// Mock data para edición
const MOCK_INFANTES = {
    1: {
        codigo: 'INF-001', esPatrocinado: true, tipoPrograma: 'Ministerio', fuentePatrocinio: 'Compassion',
        enfermedades: 'Ninguna conocida', alergias: 'Ninguna',
        persona: { nombres: 'María Gabriela', apellidos: 'López Mendoza', cedula: '0951234567', telefono1: '0987654321', telefono2: '042345678', email: 'contacto.maria@gmail.com', direccion: 'Av. 9 de Octubre y Malecón, Guayaquil', fechaNacimiento: '2018-03-12' },
    },
    2: {
        codigo: 'INF-002', esPatrocinado: true, tipoPrograma: 'Ministerio', fuentePatrocinio: 'Compassion',
        enfermedades: 'Asma leve', alergias: 'Polvo',
        persona: { nombres: 'José Andrés', apellidos: 'Pérez Villao', cedula: '0952345678', telefono1: '0998765432', telefono2: '042567890', email: '', direccion: 'Sauces 8, Mz 124 V5, Guayaquil', fechaNacimiento: '2020-07-18' },
    },
};

const InfanteFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { enqueueSnackbar } = useSnackbar();
    const isEditing = !!id;

    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isEditing) return;
        // Cargar datos mock para edición
        const data = MOCK_INFANTES[id];
        if (data) {
            setForm(data);
        } else {
            // Generar datos para cualquier ID
            setForm({
                codigo: `INF-${String(id).padStart(3, '0')}`,
                esPatrocinado: Number(id) % 2 === 0,
                tipoPrograma: ['Ministerio', 'Comedor', 'Ambos'][Number(id) % 3],
                fuentePatrocinio: Number(id) % 2 === 0 ? 'Compassion' : 'Ninguno',
                enfermedades: '', alergias: '',
                persona: {
                    nombres: ['Camila', 'Sebastián', 'Valentina', 'Daniel', 'Isabella'][Number(id) % 5],
                    apellidos: ['Torres', 'Morales', 'Cedeño', 'Ramírez', 'Vélez'][Number(id) % 5],
                    cedula: `095${id}234567`, telefono1: `09${id}7654321`, telefono2: '', email: '',
                    direccion: 'Guayaquil', fechaNacimiento: '2018-06-15',
                },
            });
        }
    }, [id, isEditing]);

    const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
    const setP = (field, val) => setForm(f => ({ ...f, persona: { ...f.persona, [field]: val } }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        // Simular guardado
        await new Promise(r => setTimeout(r, 600));
        setSaving(false);
        if (isEditing) {
            enqueueSnackbar('Infante actualizado correctamente', { variant: 'success' });
            navigate(`/infantes/${id}`);
        } else {
            enqueueSnackbar('Infante creado correctamente', { variant: 'success' });
            navigate('/infantes');
        }
    };

    return (
        <MainLayout>
            <Box component="form" onSubmit={handleSubmit} sx={{ p: { xs: 1.5, md: 0 }, maxWidth: 900, mx: 'auto' }}>

                {/* ── Header ──────────────────────────────────────── */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} variant="outlined" size="small"
                            sx={{ borderRadius: 2, mb: 1 }}>
                            Volver
                        </Button>
                        <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AddPersonIcon sx={{ fontSize: 32, color: isDark ? CCO.naranja : CCO.violeta }} />
                            {isEditing ? 'Editar Infante' : 'Nuevo Infante'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {isEditing ? `Editando registro ${form.codigo}` : 'Completa los datos del nuevo infante'}
                        </Typography>
                    </Box>
                    <Button type="submit" variant="contained" startIcon={<SaveIcon />}
                        disabled={saving}
                        sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 700 }}>
                        {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                </Box>

                {/* ── Sección 1: Datos del Infante ────────────────── */}
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 4, mb: 3, overflow: 'hidden' }}>
                    <Box sx={{ height: 5, background: `linear-gradient(90deg, ${CCO.azul}, ${CCO.violeta})` }} />
                    <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5 }}>📋 Datos del Infante</Typography>
                        <Grid container spacing={2.5}>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Código *" value={form.codigo} onChange={e => set('codigo', e.target.value)}
                                    required size="small" placeholder="INF-XXX" />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField select fullWidth label="Tipo Programa *" value={form.tipoPrograma}
                                    onChange={e => set('tipoPrograma', e.target.value)} size="small">
                                    {['Ministerio', 'Comedor', 'Ambos'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Box sx={{
                                    border: `1px solid ${theme.palette.divider}`, borderRadius: 2.5, px: 2, py: 0.8,
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    bgcolor: form.esPatrocinado ? alpha('#4caf50', 0.06) : 'transparent',
                                    transition: 'all .2s ease',
                                }}>
                                    <Typography variant="body2" fontWeight={600} color={form.esPatrocinado ? 'success.main' : 'text.secondary'}>
                                        {form.esPatrocinado ? '✅ Patrocinado' : 'No patrocinado'}
                                    </Typography>
                                    <Switch checked={form.esPatrocinado} onChange={e => set('esPatrocinado', e.target.checked)}
                                        color="success" />
                                </Box>
                            </Grid>
                            {form.esPatrocinado && (
                                <Grid item xs={12} sm={4}>
                                    <TextField select fullWidth label="Fuente de Patrocinio" value={form.fuentePatrocinio}
                                        onChange={e => set('fuentePatrocinio', e.target.value)} size="small">
                                        {['Compassion', 'Plan', 'Otro', 'Ninguno'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                                    </TextField>
                                </Grid>
                            )}
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Enfermedades" value={form.enfermedades}
                                    onChange={e => set('enfermedades', e.target.value)} size="small" multiline rows={2}
                                    placeholder="Ninguna conocida..." />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Alergias" value={form.alergias}
                                    onChange={e => set('alergias', e.target.value)} size="small" multiline rows={2}
                                    placeholder="Ninguna conocida..." />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* ── Sección 2: Datos del Representante / Niño ─── */}
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ height: 5, background: `linear-gradient(90deg, ${CCO.naranja}, ${CCO.amarillo})` }} />
                    <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5 }}>👤 Datos Personales</Typography>
                        <Grid container spacing={2.5}>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Nombres *" value={form.persona.nombres}
                                    onChange={e => setP('nombres', e.target.value)} required size="small" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Apellidos *" value={form.persona.apellidos}
                                    onChange={e => setP('apellidos', e.target.value)} required size="small" />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Cédula" value={form.persona.cedula}
                                    onChange={e => setP('cedula', e.target.value)} size="small"
                                    placeholder="0900000000" />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Teléfono 1 *" value={form.persona.telefono1}
                                    onChange={e => setP('telefono1', e.target.value)} required size="small"
                                    placeholder="0987654321" />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Teléfono 2" value={form.persona.telefono2}
                                    onChange={e => setP('telefono2', e.target.value)} size="small" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Email" value={form.persona.email}
                                    onChange={e => setP('email', e.target.value)} type="email" size="small" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Fecha de Nacimiento" type="date" value={form.persona.fechaNacimiento}
                                    onChange={e => setP('fechaNacimiento', e.target.value)} size="small"
                                    slotProps={{ inputLabel: { shrink: true } }} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Dirección" value={form.persona.direccion}
                                    onChange={e => setP('direccion', e.target.value)} size="small"
                                    placeholder="Sector, calle, manzana..." />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* ── Botón final ─────────────────────────────────── */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={() => navigate(-1)} color="inherit" sx={{ borderRadius: 2 }}>Cancelar</Button>
                    <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving}
                        sx={{ borderRadius: 3, px: 4, py: 1.2, fontWeight: 700 }}>
                        {saving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Infante'}
                    </Button>
                </Box>
            </Box>
        </MainLayout>
    );
};

export default InfanteFormPage;
