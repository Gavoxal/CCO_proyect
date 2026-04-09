import { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, Button, Chip, Avatar,
    TextField, CircularProgress, Stack, Paper, Grid, Divider,
    alpha, useTheme, Autocomplete, Alert, MenuItem,
} from '@mui/material';
import {
    ReportProblem as IncidenteIcon,
    Send as SendIcon,
    CheckCircle as SuccessIcon,
    Warning as WarnIcon,
    Clear as ClearIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { incidentesService, infantesService } from '../../services/appServices';

// ─── Paleta CCO ───────────────────────────────────────────────────────────────
const CCO = { rojo: '#d32f2f', naranja: '#FF8C00' };

// ─── Tipos de abuso ───────────────────────────────────────────────────────────
const TIPOS_ABUSO = ['Físico', 'Verbal', 'Emocional', 'Sexual', 'Negligencia', 'Otro'];



const INITIAL_FORM = {
    fecha: new Date().toISOString().split('T')[0],
    tipoAbuso: '',
    descripcion: '',
    infantesIds: [],
};

export default function ReportarIncidentePage() {
    const theme = useTheme();
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    const [form, setForm] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState({});
    const [infantes, setInfantes] = useState([]);
    const [fetchingInfantes, setFetchingInfantes] = useState(true);

    useEffect(() => {
        const loadInfantes = async () => {
            try {
                const res = await infantesService.listar({ limit: 1000 });
                setInfantes(res.data);
            } catch (err) {
                enqueueSnackbar('Error al cargar lista de infantes', { variant: 'error' });
            } finally {
                setFetchingInfantes(false);
            }
        };
        loadInfantes();
    }, [enqueueSnackbar]);

    const handleInfantesChange = (_, newValue) => {
        setForm(p => ({ ...p, infantesIds: newValue }));
        if (errors.infantesIds) setErrors(p => ({ ...p, infantesIds: null }));
    };

    const validate = () => {
        const e = {};
        if (!form.tipoAbuso) e.tipoAbuso = 'Selecciona el tipo de agresión';
        if (!form.descripcion || form.descripcion.trim().length < 20)
            e.descripcion = 'La descripción debe tener al menos 20 caracteres';
        if (!form.infantesIds.length) e.infantesIds = 'Selecciona al menos un infante involucrado';
        if (!form.fecha) e.fecha = 'La fecha es obligatoria';
        return e;
    };

    const handleSubmit = async () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }

        setLoading(true);
        try {
            const payload = {
                ...form,
                infantesIds: form.infantesIds.map(i => i.id)
            };
            await incidentesService.crear(payload);
            setSubmitted(true);
            enqueueSnackbar('Reporte enviado exitosamente. El equipo de protección ha sido notificado.', { variant: 'success', autoHideDuration: 5000 });
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Error al enviar el reporte', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setForm(INITIAL_FORM);
        setErrors({});
        setSubmitted(false);
    };

    // ─── Pantalla de confirmación ──────────────────────────────────────────────
    if (submitted) {
        return (
            <MainLayout>
                <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 600, mx: 'auto', mt: 4 }}>
                    <Card variant="outlined" sx={{ borderRadius: 4, p: 1, textAlign: 'center', borderColor: alpha('#2e7d32', 0.4) }}>
                        <CardContent sx={{ py: 5 }}>
                            <SuccessIcon sx={{ fontSize: 72, color: '#2e7d32', mb: 2 }} />
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Reporte Enviado</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                                Tu reporte ha sido recibido de forma confidencial. El equipo de protección revisará el caso y tomará las medidas necesarias.
                                <br /><br />
                                <strong>Recuerda:</strong> No compartas este reporte con otras personas ajenas al proceso.
                            </Typography>
                            <Alert severity="info" sx={{ textAlign: 'left', borderRadius: 2, mb: 3 }}>
                                Por razones de confidencialidad, los tutores no pueden ver el historial de reportes. Si necesitas hacer seguimiento, comunícate con el director o el equipo de protección.
                            </Alert>
                            <Stack direction="row" spacing={2} justifyContent="center">
                                <Button variant="outlined" startIcon={<IncidenteIcon />} onClick={handleReset} sx={{ borderRadius: 2 }}>
                                    Reportar otro incidente
                                </Button>
                                <Button variant="contained" onClick={() => navigate('/')} sx={{ borderRadius: 2 }}>
                                    Ir al Inicio
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 720, mx: 'auto' }}>

                {/* ─── Header ─────────────────────────────────────────────────── */}
                <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                    <Avatar sx={{ bgcolor: alpha(CCO.rojo, 0.12), width: 48, height: 48 }}>
                        <IncidenteIcon sx={{ color: CCO.rojo, fontSize: 26 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>Reportar Incidente</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Formulario de reporte confidencial de agresión o incidente
                        </Typography>
                    </Box>
                </Stack>

                {/* ─── Aviso de confidencialidad ───────────────────────────────── */}
                <Alert
                    severity="warning"
                    icon={<WarnIcon />}
                    sx={{ mb: 3, borderRadius: 2.5 }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Formulario Confidencial</Typography>
                    <Typography variant="caption">
                        Este reporte es de carácter confidencial. Solo el equipo de protección, directores y administradores pueden ver los reportes enviados.
                        Tu identidad quedará registrada como reportante.
                    </Typography>
                </Alert>

                {/* ─── Formulario ──────────────────────────────────────────────── */}
                <Card variant="outlined" sx={{ borderRadius: 3, borderColor: alpha(CCO.rojo, 0.2) }}>
                    <CardContent sx={{ p: 3 }}>
                        <Stack spacing={2.5}>

                            {/* Fila 1: Fecha + Tipo de Agresión */}
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                                <TextField
                                    label="Fecha del Incidente *"
                                    type="date"
                                    size="small"
                                    value={form.fecha}
                                    onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
                                    error={!!errors.fecha}
                                    helperText={errors.fecha || ' '}
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{ max: new Date().toISOString().split('T')[0] }}
                                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                                <TextField
                                    select
                                    label="Tipo de Agresión *"
                                    size="small"
                                    value={form.tipoAbuso}
                                    onChange={e => { setForm(p => ({ ...p, tipoAbuso: e.target.value })); setErrors(p => ({ ...p, tipoAbuso: null })); }}
                                    error={!!errors.tipoAbuso}
                                    helperText={errors.tipoAbuso || ' '}
                                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                >
                                    <MenuItem value="" disabled><em>Seleccionar tipo...</em></MenuItem>
                                    {TIPOS_ABUSO.map(t => (
                                        <MenuItem key={t} value={t}>{t}</MenuItem>
                                    ))}
                                </TextField>
                            </Stack>

                            {/* Infantes involucrados */}
                            <Autocomplete
                                multiple
                                size="small"
                                options={infantes}
                                loading={fetchingInfantes}
                                value={form.infantesIds}
                                onChange={handleInfantesChange}
                                getOptionLabel={i => `${i.persona?.nombres} ${i.persona?.apellidos} (${i.codigo})`}
                                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                                sx={{ width: '100%' }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Infante(s) Involucrado(s) *"
                                        placeholder={form.infantesIds.length === 0 ? 'Buscar y seleccionar infante(s)...' : ''}
                                        error={!!errors.infantesIds}
                                        helperText={errors.infantesIds || ' '}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {fetchingInfantes ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            key={option.id}
                                            label={`${option.persona?.nombres} ${option.persona?.apellidos}`}
                                            size="small"
                                            {...getTagProps({ index })}
                                            sx={{ borderRadius: 1 }}
                                        />
                                    ))
                                }
                            />

                            {/* Descripción */}
                            <TextField
                                label="Descripción Detallada del Incidente *"
                                fullWidth
                                multiline
                                rows={5}
                                size="small"
                                value={form.descripcion}
                                onChange={e => { setForm(p => ({ ...p, descripcion: e.target.value })); setErrors(p => ({ ...p, descripcion: null })); }}
                                error={!!errors.descripcion}
                                helperText={errors.descripcion || `${form.descripcion.length} caracteres (mínimo 20)`}
                                placeholder="Describe detalladamente lo que ocurrió: qué pasó, dónde, quién estuvo involucrado, cómo se encontró al infante..."
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />


                        </Stack>


                        <Divider sx={{ my: 2.5, opacity: 0.3 }} />

                        {/* Botones */}
                        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                            <Button
                                variant="outlined"
                                startIcon={<ClearIcon />}
                                onClick={handleReset}
                                disabled={loading}
                                sx={{ borderRadius: 2 }}
                            >
                                Limpiar
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                                onClick={handleSubmit}
                                disabled={loading}
                                sx={{
                                    borderRadius: 2,
                                    bgcolor: CCO.rojo,
                                    '&:hover': { bgcolor: '#b71c1c' },
                                    px: 3,
                                }}
                            >
                                {loading ? 'Enviando...' : 'Enviar Reporte'}
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        </MainLayout>
    );
}
