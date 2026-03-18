import { useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Grid, Card, CardContent, Avatar, Chip,
    Tab, Tabs, Button, IconButton, Tooltip, Table, TableBody,
    TableCell, TableHead, TableRow, Alert, alpha, useTheme,
    LinearProgress, Paper, Divider, Stack, CircularProgress, Badge,
} from '@mui/material';
import {
    Edit as EditIcon, CameraAlt as CameraIcon, ArrowBack as BackIcon,
    Cake as CakeIcon, Phone as PhoneIcon, Email as EmailIcon,
    Home as HomeIcon, Badge as BadgeIcon, LocalHospital as MedIcon,
    CalendarMonth as CalIcon, CheckCircle as CheckIcon,
    Cancel as CancelIcon, Warning as WarningIcon,
    PhotoCamera as PhotoIcon, Explore as MapIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

// ─── Paleta CCO ───────────────────────────────────────────────────────────────
const CCO = { amarillo: '#FFD700', naranja: '#FF8C00', violeta: '#6A5ACD', azul: '#4169E1' };
const AVATAR_COLORS = ['#7c4dff', '#00bcd4', '#ff5722', '#4caf50', '#ff9800', '#e91e63', '#3f51b5', '#009688'];
const ESTADO_COLOR = { Presente: 'success', Ausente: 'error', Justificado: 'warning' };
const ESTADO_ICON = {
    Presente: <CheckIcon sx={{ fontSize: 16 }} />,
    Ausente: <CancelIcon sx={{ fontSize: 16 }} />,
    Justificado: <WarningIcon sx={{ fontSize: 16 }} />,
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_INFANTES = {
    1: {
        id: 1, codigo: 'INF-001', tipoPrograma: 'Ministerio', esPatrocinado: true, fuentePatrocinio: 'Compassion',
        enfermedades: 'Ninguna conocida', alergias: 'Ninguna',
        persona: { nombres: 'María Gabriela', apellidos: 'López Mendoza', cedula: '0951234567', telefono1: '0987654321', telefono2: '042345678', email: 'contacto.maria@gmail.com', direccion: 'Av. 9 de Octubre y Malecón, Guayaquil', fechaNacimiento: '2018-03-12' },
        tutor: { persona: { nombres: 'Ana María', apellidos: 'Mendoza Cedeño' } },
        fotografia: '/mock-fotos/inf001.png', fechaActualizacionFoto: '2025-12-15',
        asistencias: [
            { id: 1, fecha: '2026-03-01', estado: 'Presente' },
            { id: 2, fecha: '2026-02-22', estado: 'Presente' },
            { id: 3, fecha: '2026-02-15', estado: 'Ausente' },
            { id: 4, fecha: '2026-02-08', estado: 'Presente' },
            { id: 5, fecha: '2026-02-01', estado: 'Justificado' },
            { id: 6, fecha: '2026-01-25', estado: 'Presente' },
            { id: 7, fecha: '2026-01-18', estado: 'Presente' },
            { id: 8, fecha: '2026-01-11', estado: 'Presente' },
        ],
        visitas: [
            { id: 1, fecha: '2026-01-20', observaciones: 'Familia estable, madre muy colaboradora. Hogar limpio y organizado. La niña está al día con tareas escolares.', archivoAdjunto: null },
            { id: 2, fecha: '2025-07-15', observaciones: 'Visita semestral. Todo en orden, la niña avanza bien en la escuela.', archivoAdjunto: null },
            { id: 3, fecha: '2025-01-10', observaciones: 'Primera visita del año. La familia reporta buena salud general.', archivoAdjunto: null },
        ],
        regalos: [
            { id: 1, anio: 2025, tipo: 'navidad', estado: 'entregado', fechaEntrega: '2025-12-20' },
            { id: 2, anio: 2025, tipo: 'kit_escolar', estado: 'entregado', fechaEntrega: '2025-03-15' },
            { id: 3, anio: 2026, tipo: 'kit_escolar', estado: 'entregado', fechaEntrega: '2026-03-01' },
            { id: 4, anio: 2026, tipo: 'navidad', estado: 'pendiente', fechaEntrega: null },
        ],
    },
    2: {
        id: 2, codigo: 'INF-002', tipoPrograma: 'Ministerio', esPatrocinado: true, fuentePatrocinio: 'Compassion',
        enfermedades: 'Asma leve', alergias: 'Polvo',
        persona: { nombres: 'José Andrés', apellidos: 'Pérez Villao', cedula: '0952345678', telefono1: '0998765432', telefono2: '042567890', email: '', direccion: 'Sauces 8, Mz 124 V5, Guayaquil', fechaNacimiento: '2020-07-18' },
        tutor: { persona: { nombres: 'Carmen Rosa', apellidos: 'Villao Suárez' } },
        fotografia: '/mock-fotos/inf002.png', fechaActualizacionFoto: '2026-01-20',
        asistencias: [
            { id: 10, fecha: '2026-03-01', estado: 'Presente' },
            { id: 11, fecha: '2026-02-22', estado: 'Presente' },
            { id: 12, fecha: '2026-02-15', estado: 'Presente' },
            { id: 13, fecha: '2026-02-08', estado: 'Ausente' },
            { id: 14, fecha: '2026-02-01', estado: 'Presente' },
        ],
        visitas: [
            { id: 10, fecha: '2026-02-10', observaciones: 'Se recomienda chequeo médico por asma. Niño activo y alegre.', archivoAdjunto: null },
        ],
        regalos: [
            { id: 10, anio: 2025, tipo: 'navidad', estado: 'entregado', fechaEntrega: '2025-12-20' },
            { id: 11, anio: 2026, tipo: 'kit_escolar', estado: 'pendiente', fechaEntrega: null },
        ],
    },
};

// Generar datos básicos para IDs sin detalle completo
const generateBasicDetail = (id) => ({
    id,
    codigo: `INF-${String(id).padStart(3, '0')}`,
    tipoPrograma: ['Ministerio', 'Comedor', 'Ambos'][id % 3],
    esPatrocinado: id % 2 === 0,
    fuentePatrocinio: id % 2 === 0 ? 'Compassion' : 'Ninguno',
    enfermedades: '', alergias: '',
    persona: {
        nombres: ['Camila Sofía', 'Sebastián', 'Valentina', 'Daniel', 'Isabella', 'Matías', 'Luciana', 'Nicolás', 'Emilia', 'Santiago'][id % 10],
        apellidos: ['Torres', 'Morales', 'Cedeño', 'Ramírez', 'Vélez', 'Suárez', 'Mera', 'Castro', 'Figueroa', 'Quishpe'][id % 10],
        cedula: `095${id}234567`, telefono1: `09${id}7654321`, telefono2: '', email: '', direccion: 'Guayaquil',
        fechaNacimiento: `201${7 + (id % 4)}-${String((id % 12) + 1).padStart(2, '0')}-${String((id % 28) + 1).padStart(2, '0')}`,
    },
    tutor: { persona: { nombres: 'Tutor', apellidos: `del Niño ${id}` } },
    fotografia: null,
    asistencias: Array.from({ length: 6 }, (_, i) => ({
        id: id * 100 + i, fecha: `2026-0${3 - Math.floor(i / 4)}-${String(Math.max(1, 28 - i * 7)).padStart(2, '0')}`,
        estado: ['Presente', 'Presente', 'Ausente', 'Presente', 'Justificado', 'Presente'][i],
    })),
    visitas: id % 3 === 0 ? [] : [
        { id: id * 10, fecha: '2026-01-15', observaciones: 'Visita de rutina. Todo en orden.', archivoAdjunto: null },
    ],
    regalos: [
        { id: id * 10, anio: 2025, tipo: 'navidad', estado: 'entregado', fechaEntrega: '2025-12-20' },
        { id: id * 10 + 1, anio: 2026, tipo: 'kit_escolar', estado: id % 2 === 0 ? 'entregado' : 'pendiente', fechaEntrega: id % 2 === 0 ? '2026-03-01' : null },
    ],
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const calcEdad = (fechaNac) => {
    const hoy = new Date();
    const nac = new Date(fechaNac);
    let edad = hoy.getFullYear() - nac.getFullYear();
    if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--;
    return edad;
};

const InfoRow = ({ icon, label, value }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
        <Box sx={{ mt: 0.3 }}>{icon}</Box>
        <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>{label}</Typography>
            <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography>
        </Box>
    </Box>
);

// ─── InfanteDetailPage ────────────────────────────────────────────────────────
const InfanteDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const fileRef = useRef(null);

    const [tabIndex, setTabIndex] = useState(0);
    const [uploadingFoto, setUploadingFoto] = useState(false);
    const [fotoPreview, setFotoPreview] = useState(null);
    const [fotoFecha, setFotoFecha] = useState(null);

    const canWrite = ['admin', 'director', 'secretaria', 'tutor_especial'].includes(user?.rol);

    // Cargar infante (local storage fallback)
    const infante = useMemo(() => {
        try {
            const s = localStorage.getItem('cco_infantes_v2');
            if (s) {
                const arr = JSON.parse(s);
                const found = arr.find(i => String(i.id) === String(id));
                if (found) return found;
            }
        } catch {}
        return MOCK_INFANTES[id] || generateBasicDetail(Number(id));
    }, [id]);

    const p = infante.persona || {};
    const edad = calcEdad(p.fechaNacimiento);
    const anio = new Date().getFullYear();

    // Foto actual (con preview si se subió una nueva)
    const currentFoto = fotoPreview || infante.fotografia;
    const currentFotoFecha = fotoFecha || infante.fechaActualizacionFoto;

    // Color de la fecha de foto
    const getFotoFreshness = (fecha) => {
        if (!fecha) return { color: '#ef5350', label: 'Sin foto', icon: '📷' };
        const d = new Date(fecha);
        const diffDays = Math.floor((new Date() - d) / 86400000);
        if (diffDays <= 90) return { color: '#4caf50', label: `Actualizada: ${d.toLocaleDateString('es-EC')}`, icon: '✅' };
        if (diffDays <= 365) return { color: '#ff9800', label: `Desactualizada: ${d.toLocaleDateString('es-EC')}`, icon: '⚠️' };
        return { color: '#ef5350', label: `Muy antigua: ${d.toLocaleDateString('es-EC')}`, icon: '🔴' };
    };

    const fotoInfo = getFotoFreshness(currentFotoFecha);

    // Subir foto (mock)
    const handleFotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingFoto(true);
        // Simular upload
        await new Promise(r => setTimeout(r, 800));
        const url = URL.createObjectURL(file);
        setFotoPreview(url);
        setFotoFecha(new Date().toISOString().split('T')[0]);
        setUploadingFoto(false);
        enqueueSnackbar('Foto actualizada correctamente', { variant: 'success' });
    };

    // Estadísticas de asistencia
    const asistStats = useMemo(() => {
        const total = infante.asistencias?.length || 0;
        const presentes = infante.asistencias?.filter(a => a.estado === 'Presente').length || 0;
        const ausentes = infante.asistencias?.filter(a => a.estado === 'Ausente').length || 0;
        const justificados = infante.asistencias?.filter(a => a.estado === 'Justificado').length || 0;
        return { total, presentes, ausentes, justificados, porcentaje: total > 0 ? Math.round((presentes / total) * 100) : 0 };
    }, [infante]);

    const visitadoEsteAnio = infante.visitas?.some(v => new Date(v.fecha).getFullYear() === anio);

    return (
        <MainLayout>
            <Box sx={{ p: { xs: 1.5, md: 0 } }}>
                {/* Hidden file input for photo upload */}
                <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={handleFotoChange} />

                {/* ── Back + Edit ──────────────────────────────────── */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Button startIcon={<BackIcon />} onClick={() => navigate('/infantes')} variant="outlined" size="small"
                        sx={{ borderRadius: 2 }}>
                        Volver
                    </Button>
                    {canWrite && (
                        <Button startIcon={<EditIcon />} onClick={() => navigate(`/infantes/${id}/editar`)} variant="contained" size="small"
                            sx={{ borderRadius: 2 }}>
                            Editar
                        </Button>
                    )}
                </Box>

                {/* ── Header Card ──────────────────────────────────── */}
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 4, mb: 3, overflow: 'hidden' }}>
                    {/* Gradient banner */}
                    <Box sx={{
                        height: 8,
                        background: `linear-gradient(90deg, ${CCO.naranja} 0%, ${CCO.violeta} 100%)`,
                    }} />
                    <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            {/* Avatar con foto */}
                            <Box sx={{ position: 'relative', textAlign: 'center' }}>
                                <Badge
                                    overlap="circular"
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    badgeContent={
                                        canWrite ? (
                                            <Tooltip title="Actualizar foto">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => fileRef.current?.click()}
                                                    disabled={uploadingFoto}
                                                    sx={{
                                                        bgcolor: 'background.paper', border: `2px solid ${fotoInfo.color}`,
                                                        width: 32, height: 32,
                                                        '&:hover': { bgcolor: alpha(fotoInfo.color, 0.1) },
                                                    }}
                                                >
                                                    {uploadingFoto ? <CircularProgress size={16} /> : <CameraIcon sx={{ fontSize: 16, color: fotoInfo.color }} />}
                                                </IconButton>
                                            </Tooltip>
                                        ) : null
                                    }
                                >
                                    <Avatar
                                        src={currentFoto || undefined}
                                        sx={{
                                            width: 110, height: 110, fontSize: '2.2rem', fontWeight: 800,
                                            bgcolor: AVATAR_COLORS[infante.id % AVATAR_COLORS.length],
                                            boxShadow: `0 4px 20px ${alpha(AVATAR_COLORS[infante.id % AVATAR_COLORS.length], 0.4)}`,
                                            border: `3px solid ${fotoInfo.color}`,
                                        }}
                                    >
                                        {p.nombres?.charAt(0)}{p.apellidos?.charAt(0)}
                                    </Avatar>
                                </Badge>
                                {/* Fecha de foto */}
                                <Chip
                                    label={currentFoto ? fotoInfo.label : 'Sin foto'}
                                    size="small"
                                    sx={{
                                        mt: 1, fontSize: '0.65rem', fontWeight: 600, height: 22,
                                        bgcolor: alpha(fotoInfo.color, 0.1), color: fotoInfo.color,
                                        border: `1px solid ${alpha(fotoInfo.color, 0.3)}`,
                                    }}
                                />
                            </Box>
                            {/* Info */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h4" fontWeight={800}>{p.nombres} {p.apellidos}</Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                                    <Chip label={`Código: ${infante.codigo}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                                    <Chip label={infante.tipoPrograma} size="small" color="primary" sx={{ fontWeight: 600 }} />
                                    <Chip
                                        label={infante.esPatrocinado ? `Patrocinado · ${infante.fuentePatrocinio}` : 'No patrocinado'}
                                        size="small"
                                        color={infante.esPatrocinado ? 'success' : 'default'}
                                        sx={{ fontWeight: 600 }}
                                    />
                                    <Chip icon={<CakeIcon sx={{ fontSize: 14 }} />} label={`${edad} años`} size="small"
                                        sx={{ fontWeight: 600, bgcolor: alpha(CCO.azul, 0.1), color: CCO.azul }} />
                                </Stack>
                                {infante.tutor && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                                        <b>Tutor:</b> {infante.tutor.persona?.nombres} {infante.tutor.persona?.apellidos}
                                    </Typography>
                                )}
                            </Box>
                            {/* Stats rápidas */}
                            <Stack spacing={1} sx={{ alignItems: 'flex-end', display: { xs: 'none', md: 'flex' } }}>
                                <Chip label={`Asistencia: ${asistStats.porcentaje}%`} size="small"
                                    color={asistStats.porcentaje >= 80 ? 'success' : asistStats.porcentaje >= 50 ? 'warning' : 'error'}
                                    sx={{ fontWeight: 700, fontSize: '0.78rem' }} />
                                <Chip
                                    label={visitadoEsteAnio ? `✅ Visitado ${anio}` : `⚠️ Sin visita ${anio}`}
                                    size="small"
                                    color={visitadoEsteAnio ? 'success' : 'warning'}
                                    variant="outlined"
                                    sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                                />
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>

                {/* ── Tabs ─────────────────────────────────────────── */}
                <Paper elevation={0} sx={{
                    border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden', mb: 3,
                    bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.01),
                }}>
                    <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="fullWidth"
                        sx={{
                            '& .MuiTabs-indicator': {
                                height: 3, borderRadius: '3px 3px 0 0',
                                background: `linear-gradient(90deg, ${CCO.naranja}, ${CCO.violeta})`,
                            },
                            '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', py: 1.8 },
                        }}>
                        <Tab label="Datos Personales" icon={<BadgeIcon />} iconPosition="start" />
                        <Tab label={`Asistencia (${asistStats.total})`} icon={<CalIcon />} iconPosition="start" />
                        <Tab label={`Visitas (${infante.visitas?.length || 0})`} icon={<HomeIcon />} iconPosition="start" />
                        <Tab label={`Regalos (${infante.regalos?.length || 0})`} icon={<CakeIcon />} iconPosition="start" />
                    </Tabs>
                </Paper>

                {/* ── Tab 0: Datos Personales ─────────────────────── */}
                {tabIndex === 0 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, height: '100%' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5 }}>Información Personal</Typography>
                                    <InfoRow icon={<BadgeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />} label="Cédula" value={p.cedula} />
                                    <InfoRow icon={<CakeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />} label="Fecha de Nacimiento"
                                        value={`${new Date(p.fechaNacimiento).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })} (${edad} años)`} />
                                    <InfoRow icon={<PhoneIcon sx={{ color: 'text.secondary', fontSize: 20 }} />} label="Teléfono 1" value={p.telefono1} />
                                    {p.telefono2 && <InfoRow icon={<PhoneIcon sx={{ color: 'text.secondary', fontSize: 20 }} />} label="Teléfono 2" value={p.telefono2} />}
                                    {p.email && <InfoRow icon={<EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />} label="Email" value={p.email} />}
                                    <InfoRow icon={<HomeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />} label="Dirección" value={p.direccion} />
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, height: '100%' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5 }}>Información Médica</Typography>
                                    <InfoRow icon={<MedIcon sx={{ color: '#ef5350', fontSize: 20 }} />} label="Enfermedades" value={infante.enfermedades || 'Ninguna reportada'} />
                                    <InfoRow icon={<MedIcon sx={{ color: '#ff9800', fontSize: 20 }} />} label="Alergias" value={infante.alergias || 'Ninguna reportada'} />
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Resumen Rápido</Typography>
                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                        {[
                                            { label: 'Asistencia', value: `${asistStats.porcentaje}%`, color: asistStats.porcentaje >= 80 ? '#4caf50' : '#ff9800' },
                                            { label: 'Visitas', value: infante.visitas?.length || 0, color: CCO.azul },
                                            { label: 'Regalos', value: infante.regalos?.length || 0, color: CCO.violeta },
                                        ].map(s => (
                                            <Box key={s.label} sx={{
                                                flex: 1, textAlign: 'center', p: 2, borderRadius: 2,
                                                bgcolor: alpha(s.color, 0.08), border: `1px solid ${alpha(s.color, 0.2)}`,
                                                minWidth: 80,
                                            }}>
                                                <Typography variant="h5" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>{s.label}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Mapa GPS en ancho completo */}
                        {p.ubicacionGps && (
                            <Grid item xs={12}>
                                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                            <MapIcon sx={{ color: CCO.azul, fontSize: 20 }} />
                                            <Typography variant="subtitle1" fontWeight={700}>Ubicación GPS (Google Maps)</Typography>
                                        </Box>
                                        <Box sx={{ width: '100%', height: 350, borderRadius: 3, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                                            <iframe
                                                width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen
                                                src={`https://maps.google.com/maps?q=${encodeURIComponent(p.ubicacionGps)}&hl=es&z=15&output=embed`}
                                                title="Ubicación GPS"
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}
                    </Grid>
                )}

                {/* ── Tab 1: Asistencia ───────────────────────────── */}
                {tabIndex === 1 && (
                    <Box>
                        {/* Barra de progreso */}
                        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, mb: 3 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="subtitle1" fontWeight={700}>Porcentaje de Asistencia</Typography>
                                    <Chip label={`${asistStats.porcentaje}%`} size="small"
                                        color={asistStats.porcentaje >= 80 ? 'success' : asistStats.porcentaje >= 50 ? 'warning' : 'error'}
                                        sx={{ fontWeight: 700 }} />
                                </Box>
                                <LinearProgress variant="determinate" value={asistStats.porcentaje}
                                    sx={{
                                        height: 10, borderRadius: 5, mb: 2,
                                        bgcolor: alpha('#000', 0.08),
                                        '& .MuiLinearProgress-bar': { borderRadius: 5, bgcolor: asistStats.porcentaje >= 80 ? '#4caf50' : asistStats.porcentaje >= 50 ? '#ff9800' : '#ef5350' },
                                    }} />
                                <Stack direction="row" spacing={3}>
                                    <Typography variant="body2" color="text.secondary">
                                        ✅ Presentes: <b>{asistStats.presentes}</b>
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        ❌ Ausentes: <b>{asistStats.ausentes}</b>
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        ⚠️ Justificados: <b>{asistStats.justificados}</b>
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>

                        <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Fecha</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Estado</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(!infante.asistencias || infante.asistencias.length === 0) ? (
                                        <TableRow><TableCell colSpan={2}><Alert severity="info" sx={{ borderRadius: 2 }}>Sin registros de asistencia</Alert></TableCell></TableRow>
                                    ) : infante.asistencias.map(a => (
                                        <TableRow key={a.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {new Date(a.fecha).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip icon={ESTADO_ICON[a.estado]} label={a.estado} size="small"
                                                    color={ESTADO_COLOR[a.estado]} variant="outlined" sx={{ fontWeight: 600 }} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                    </Box>
                )}

                {/* ── Tab 2: Visitas ──────────────────────────────── */}
                {tabIndex === 2 && (
                    <Box>
                        {visitadoEsteAnio
                            ? <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>✅ Este infante ha sido visitado en {anio}</Alert>
                            : <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>⚠️ Este infante aún no ha sido visitado en {anio}</Alert>
                        }
                        {(!infante.visitas || infante.visitas.length === 0) ? (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>No hay visitas registradas para este infante</Alert>
                        ) : (
                            <Stack spacing={2}>
                                {infante.visitas.map(v => (
                                    <Card key={v.id} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                                <CalIcon sx={{ color: CCO.azul, fontSize: 20 }} />
                                                <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                                                    {new Date(v.fecha).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                </Typography>
                                            </Box>
                                            <Box sx={{
                                                p: 2, borderRadius: 2,
                                                bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
                                                border: `1px solid ${theme.palette.divider}`,
                                            }}>
                                                <Typography variant="body2" color="text.secondary">{v.observaciones || 'Sin observaciones'}</Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        )}
                    </Box>
                )}

                {/* ── Tab 3: Regalos ──────────────────────────────── */}
                {tabIndex === 3 && (
                    <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Año</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Tipo</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Estado</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Fecha Entrega</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(!infante.regalos || infante.regalos.length === 0) ? (
                                    <TableRow><TableCell colSpan={4}><Alert severity="info" sx={{ borderRadius: 2 }}>Sin regalos registrados</Alert></TableCell></TableRow>
                                ) : infante.regalos.map(r => {
                                    const tipoLabel = { navidad: '🎄 Navidad', kit_escolar: '🎒 Kit Escolar', cumpleanos: '🎂 Cumpleaños' };
                                    return (
                                        <TableRow key={r.id} hover>
                                            <TableCell><Typography variant="body2" fontWeight={600}>{r.anio}</Typography></TableCell>
                                            <TableCell>
                                                <Chip label={tipoLabel[r.tipo] || r.tipo} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={r.estado === 'entregado' ? '✅ Entregado' : '⏳ Pendiente'}
                                                    size="small"
                                                    color={r.estado === 'entregado' ? 'success' : 'warning'}
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {r.fechaEntrega ? new Date(r.fechaEntrega).toLocaleDateString('es-EC') : '—'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </Paper>
                )}
            </Box>
        </MainLayout>
    );
};

export default InfanteDetailPage;
