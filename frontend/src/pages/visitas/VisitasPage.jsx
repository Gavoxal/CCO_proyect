import { useState, useMemo } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Button, Chip, Avatar,
    Alert, Divider, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, CircularProgress, Stack, Paper,
    Tabs, Tab, Table, TableBody, TableCell, TableHead, TableRow,
    TablePagination, IconButton, Tooltip, alpha, useTheme,
    FormControl, RadioGroup, FormControlLabel, Radio,
    Autocomplete, MenuItem, InputAdornment,
} from '@mui/material';
import {
    Add as AddIcon, HomeWork as VisitaIcon, History as HistoryIcon,
    Search as SearchIcon, FilterAlt as FilterIcon,
    CheckCircle as SuccessIcon, Cancel as ErrorIcon,
    Person as PersonIcon, CalendarMonth as CalendarIcon,
    Assignment as FormIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

// ─── Paleta CCO ───────────────────────────────────────────────────────────────
const CCO = { naranja: '#FF8C00', violeta: '#6A5ACD', azul: '#4169E1' };
const AVATAR_COLORS = ['#7c4dff', '#00bcd4', '#ff5722', '#4caf50', '#ff9800', '#e91e63', '#3f51b5', '#009688'];

// ─── Mock Infantes ────────────────────────────────────────────────────────────
const MOCK_INFANTES = [
    { id: 1, codigo: 'INF-001', persona: { nombres: 'María Gabriela', apellidos: 'López Mendoza' } },
    { id: 2, codigo: 'INF-002', persona: { nombres: 'José Andrés', apellidos: 'Pérez Villao' } },
    { id: 3, codigo: 'INF-003', persona: { nombres: 'Camila Sofía', apellidos: 'Torres Aragundi' } },
    { id: 4, codigo: 'INF-004', persona: { nombres: 'Sebastián', apellidos: 'Morales Intriago' } },
    { id: 5, codigo: 'INF-005', persona: { nombres: 'Valentina', apellidos: 'Cedeño Bravo' } },
    { id: 6, codigo: 'INF-006', persona: { nombres: 'Daniel Alejandro', apellidos: 'Ramírez Loor' } },
    { id: 7, codigo: 'INF-007', persona: { nombres: 'Isabella', apellidos: 'Vélez Zambrano' } },
    { id: 8, codigo: 'INF-008', persona: { nombres: 'Matías', apellidos: 'Suárez Pincay' } },
    { id: 9, codigo: 'INF-009', persona: { nombres: 'Luciana', apellidos: 'Mera Chávez' } },
    { id: 10, codigo: 'INF-010', persona: { nombres: 'Nicolás Emilio', apellidos: 'Castro Bone' } },
    { id: 11, codigo: 'INF-011', persona: { nombres: 'Emilia', apellidos: 'Figueroa Palacios' } },
    { id: 12, codigo: 'INF-012', persona: { nombres: 'Santiago', apellidos: 'Quishpe Yagual' } },
];

// ─── Mock Visitas ─────────────────────────────────────────────────────────────
const MOCK_VISITAS = [
    {
        id: 1,
        infanteId: 1,
        infante: MOCK_INFANTES[0],
        tutor: 'Juan Pérez',
        tutorId: 'tutor_1',
        fecha: '2026-03-05',
        visitaExitosa: 'SI',
        razon: 'Seguimiento',
        resultados: 'Familia comprometida con el programa. La niña muestra avances en sus estudios.',
        situacion: 'Continuación en el Ministerio',
        observaciones: 'Se recomienda apoyo en refuerzo escolar de matemáticas.',
    },
    {
        id: 2,
        infanteId: 2,
        infante: MOCK_INFANTES[1],
        tutor: 'Ana García',
        tutorId: 'tutor_2',
        fecha: '2026-03-02',
        visitaExitosa: 'SI',
        razon: 'Inasistencia',
        resultados: 'El niño faltó por enfermedad estacional.',
        situacion: 'Continuación en el Ministerio',
        observaciones: 'Ya se encuentra recuperado.',
    },
    {
        id: 3,
        infanteId: 3,
        infante: MOCK_INFANTES[2],
        tutor: 'Juan Pérez',
        tutorId: 'tutor_1',
        fecha: '2026-02-25',
        visitaExitosa: 'SI',
        razon: 'Enfermedad',
        resultados: 'Madre informa sobre tratamiento médico actual.',
        situacion: 'Continuación en el Ministerio',
        observaciones: 'Se visitará nuevamente en 15 días.',
    },
    {
        id: 4,
        infanteId: 4,
        infante: MOCK_INFANTES[3],
        tutor: 'Carlos Ruiz',
        tutorId: 'tutor_3',
        fecha: '2026-02-20',
        visitaExitosa: 'NO',
        razon: 'Otra Causa',
        resultados: 'No se encontró a nadie en el domicilio.',
        situacion: 'Otra',
        observaciones: 'Se intentará contacto telefónico.',
    },
];

// Generar más datos mock para el historial
for (let i = 5; i <= 30; i++) {
    const randomInf = MOCK_INFANTES[i % MOCK_INFANTES.length];
    MOCK_VISITAS.push({
        id: i,
        infanteId: randomInf.id,
        infante: randomInf,
        tutor: i % 2 === 0 ? 'Juan Pérez' : 'Ana García',
        tutorId: i % 2 === 0 ? 'tutor_1' : 'tutor_2',
        fecha: `2026-0${Math.floor(Math.random() * 2) + 1}-${Math.floor(Math.random() * 28) + 1}`.replace('-1-', '-01-').replace('-2-', '-02-'),
        visitaExitosa: Math.random() > 0.1 ? 'SI' : 'NO',
        razon: ['Inasistencia', 'Enfermedad', 'Otra Causa', 'Seguimiento'][Math.floor(Math.random() * 4)],
        resultados: 'Proceso de seguimiento estándar realizado con éxito.',
        situacion: 'Continuación en el Ministerio',
        observaciones: 'Sin observaciones adicionales.',
    });
}

const RAZONES = ['Inasistencia', 'Enfermedad', 'Otra Causa', 'Seguimiento'];
const SITUACIONES = ['Continuación en el Ministerio', 'Dar de Baja', 'Otra'];

export default function VisitasPage() {
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const isAdmin = ['admin', 'director', 'pastor'].includes(user?.rol);
    const canWrite = ['admin', 'director', 'secretaria', 'tutor_especial', 'tutor'].includes(user?.rol);

    const [tabIndex, setTabIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Filtros Historial
    const [searchHist, setSearchHist] = useState('');
    const [filtroTutor, setFiltroTutor] = useState('');
    const [histPage, setHistPage] = useState(0);
    const [histRowsPerPage, setHistRowsPerPage] = useState(10);

    // Formulario Registro
    const [form, setForm] = useState({
        infanteId: null,
        fecha: new Date().toISOString().split('T')[0],
        visitaExitosa: 'SI',
        razon: '',
        resultados: '',
        situacion: 'Continuación en el Ministerio',
        observaciones: '',
    });

    const filteredVisitas = useMemo(() => {
        let res = MOCK_VISITAS;
        if (!isAdmin) {
            // Si es tutor, solo ve las suyas (en este mock simulamos por tutorId)
            // res = res.filter(v => v.tutorId === user.id); 
            // Para el demo dejamos que vean algunas si no son admins
        }
        if (searchHist) {
            const s = searchHist.toLowerCase();
            res = res.filter(v =>
                `${v.infante.persona.nombres} ${v.infante.persona.apellidos}`.toLowerCase().includes(s) ||
                v.infante.codigo.toLowerCase().includes(s)
            );
        }
        if (filtroTutor) {
            res = res.filter(v => v.tutor === filtroTutor);
        }
        return res.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }, [searchHist, filtroTutor, isAdmin]);

    const tutoresMeta = useMemo(() => {
        const set = new Set(MOCK_VISITAS.map(v => v.tutor));
        return Array.from(set);
    }, []);

    const guardar = async () => {
        if (!form.infanteId || !form.fecha || !form.razon) {
            enqueueSnackbar('Por favor complete todos los campos obligatorios', { variant: 'warning' });
            return;
        }
        setSaving(true);
        await new Promise(r => setTimeout(r, 1000));

        const nuevoId = MOCK_VISITAS.length + 1;
        const infante = MOCK_INFANTES.find(i => i.id === form.infanteId);

        MOCK_VISITAS.unshift({
            ...form,
            id: nuevoId,
            infante,
            tutor: user?.nombre || 'Tutor Actual',
            tutorId: user?.id || 'current_user'
        });

        enqueueSnackbar('Visita registrada correctamente', { variant: 'success' });
        setSaving(false);
        setTabIndex(0); // Volver al historial
        setForm({
            infanteId: null,
            fecha: new Date().toISOString().split('T')[0],
            visitaExitosa: 'SI',
            razon: '',
            resultados: '',
            situacion: 'Continuación en el Ministerio',
            observaciones: '',
        });
    };

    return (
        <MainLayout>
            <Box sx={{ p: { xs: 1.5, md: 0 } }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <VisitaIcon sx={{ fontSize: 35, color: theme.palette.primary.main }} />
                        Visitas Domiciliarias
                    </Typography>
                    <Typography color="text.secondary">
                        Gestión y control de visitas a los hogares de los infantes
                    </Typography>
                </Box>

                <Paper elevation={0} sx={{
                    borderRadius: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    overflow: 'hidden',
                    mb: 3
                }}>
                    <Tabs
                        value={tabIndex}
                        onChange={(_, v) => setTabIndex(v)}
                        variant="fullWidth"
                        sx={{
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.01),
                            '& .MuiTabs-indicator': {
                                height: 3,
                                background: `linear-gradient(90deg, ${CCO.naranja}, ${CCO.violeta})`,
                            }
                        }}
                    >
                        <Tab icon={<HistoryIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Historial de Visitas" />
                        <Tab icon={<AddIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Registrar Nueva Visita" />
                    </Tabs>

                    <Box sx={{ p: 3 }}>
                        {tabIndex === 0 ? (
                            /* ─── HISTORIAL ─────────────────────────────────── */
                            <Box>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
                                    <TextField
                                        size="small"
                                        placeholder="Buscar por infante o código..."
                                        value={searchHist}
                                        onChange={e => setSearchHist(e.target.value)}
                                        sx={{ flex: 1 }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon fontSize="small" />
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                    {isAdmin && (
                                        <TextField
                                            select
                                            size="small"
                                            label="Filtrar por Tutor"
                                            value={filtroTutor}
                                            onChange={e => setFiltroTutor(e.target.value)}
                                            sx={{ minWidth: 200 }}
                                        >
                                            <MenuItem value="">Todos los tutores</MenuItem>
                                            {tutoresMeta.map(t => (
                                                <MenuItem key={t} value={t}>{t}</MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                </Stack>

                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02) }}>
                                            <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Infante</TableCell>
                                            {isAdmin && <TableCell sx={{ fontWeight: 700 }}>Visitador (Tutor)</TableCell>}
                                            <TableCell sx={{ fontWeight: 700 }}>Razón</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="center">Realizada</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Situación</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredVisitas.slice(histPage * histRowsPerPage, histPage * histRowsPerPage + histRowsPerPage).map((v) => (
                                            <TableRow key={v.id} hover>
                                                <TableCell>{new Date(v.fecha + 'T12:00:00').toLocaleDateString('es-EC')}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: AVATAR_COLORS[v.infanteId % AVATAR_COLORS.length] }}>
                                                            {v.infante.persona.nombres.charAt(0)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600}>{v.infante.persona.nombres} {v.infante.persona.apellidos}</Typography>
                                                            <Typography variant="caption" color="text.secondary">{v.infante.codigo}</Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                {isAdmin && <TableCell>{v.tutor}</TableCell>}
                                                <TableCell>
                                                    <Chip label={v.razon} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                                                </TableCell>
                                                <TableCell align="center">
                                                    {v.visitaExitosa === 'SI' ? (
                                                        <SuccessIcon color="success" fontSize="small" />
                                                    ) : (
                                                        <ErrorIcon color="error" fontSize="small" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption">{v.situacion}</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <TablePagination
                                    component="div"
                                    count={filteredVisitas.length}
                                    page={histPage}
                                    onPageChange={(_, p) => setHistPage(p)}
                                    rowsPerPage={histRowsPerPage}
                                    onRowsPerPageChange={e => { setHistRowsPerPage(parseInt(e.target.value, 10)); setHistPage(0); }}
                                    labelRowsPerPage="Filas:"
                                />
                            </Box>
                        ) : (
                            /* ─── REGISTRO ──────────────────────────────────── */
                            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                                <Typography variant="h6" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FormIcon color="primary" />
                                    Nueva Hoja de Visita
                                </Typography>

                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Autocomplete
                                            options={MOCK_INFANTES}
                                            getOptionLabel={(option) => `${option.codigo} - ${option.persona.nombres} ${option.persona.apellidos}`}
                                            value={MOCK_INFANTES.find(i => i.id === form.infanteId) || null}
                                            onChange={(_, newValue) => setForm(f => ({ ...f, infanteId: newValue?.id || null }))}
                                            renderInput={(params) => <TextField {...params} label="Seleccionar Infante *" size="small" required />}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Fecha de Visita *"
                                            type="date"
                                            fullWidth
                                            size="small"
                                            value={form.fecha}
                                            onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                                            InputLabelProps={{ shrink: true }}
                                            required
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" gutterBottom fontWeight={600}>¿Se realizó la visita al hogar?</Typography>
                                        <RadioGroup
                                            row
                                            value={form.visitaExitosa}
                                            onChange={e => setForm(f => ({ ...f, visitaExitosa: e.target.value }))}
                                        >
                                            <FormControlLabel value="SI" control={<Radio size="small" />} label="SI" />
                                            <FormControlLabel value="NO" control={<Radio size="small" />} label="NO" />
                                        </RadioGroup>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            label="Razón de Visita *"
                                            value={form.razon}
                                            onChange={e => setForm(f => ({ ...f, razon: e.target.value }))}
                                            required
                                        >
                                            {RAZONES.map(r => (
                                                <MenuItem key={r} value={r}>{r}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Resultados de la Visita"
                                            multiline
                                            rows={3}
                                            value={form.resultados}
                                            onChange={e => setForm(f => ({ ...f, resultados: e.target.value }))}
                                            placeholder="Describa lo observado durante la visita..."
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            label="Situación luego de la visita"
                                            value={form.situacion}
                                            onChange={e => setForm(f => ({ ...f, situacion: e.target.value }))}
                                        >
                                            {SITUACIONES.map(s => (
                                                <MenuItem key={s} value={s}>{s}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Observación de quien hizo la visita"
                                            multiline
                                            rows={3}
                                            value={form.observaciones}
                                            onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                                            placeholder="Detalle recomendaciones o acciones a seguir..."
                                        />
                                    </Grid>

                                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => setTabIndex(0)}
                                            disabled={saving}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={guardar}
                                            disabled={saving}
                                            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SuccessIcon />}
                                            sx={{
                                                px: 4,
                                                background: `linear-gradient(45deg, ${CCO.naranja}, ${CCO.violeta})`,
                                                '&:hover': { opacity: 0.9 }
                                            }}
                                        >
                                            {saving ? 'Guardando...' : 'Guardar Visita'}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                    </Box>
                </Paper>
            </Box>
        </MainLayout>
    );
}
