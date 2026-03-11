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
    Assignment as FormIcon, Download as DownloadIcon,
    FileDownload as ExcelIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import * as XLSX from 'xlsx';

// ─── Paleta CCO ───────────────────────────────────────────────────────────────
const CCO = { naranja: '#FF8C00', violeta: '#6A5ACD', azul: '#4169E1' };
const AVATAR_COLORS = ['#7c4dff', '#00bcd4', '#ff5722', '#4caf50', '#ff9800', '#e91e63', '#3f51b5', '#009688'];

// ─── Constants ───────────────────────────────────────────────────────────────
const MESES = [
    { value: 'all', label: 'Todo el año' },
    { value: '0', label: 'Enero' }, { value: '1', label: 'Febrero' },
    { value: '2', label: 'Marzo' }, { value: '3', label: 'Abril' },
    { value: '4', label: 'Mayo' }, { value: '5', label: 'Junio' },
    { value: '6', label: 'Julio' }, { value: '7', label: 'Agosto' },
    { value: '8', label: 'Septiembre' }, { value: '9', label: 'Octubre' },
    { value: '10', label: 'Noviembre' }, { value: '11', label: 'Diciembre' }
];

const ANIOS = [2024, 2025, 2026, 2027];

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
    const randomMonth = Math.floor(Math.random() * 3) + 1; // Ene a Mar
    MOCK_VISITAS.push({
        id: i,
        infanteId: randomInf.id,
        infante: randomInf,
        tutor: i % 3 === 0 ? 'Juan Pérez' : (i % 3 === 1 ? 'Ana García' : 'Carlos Ruiz'),
        tutorId: i % 3 === 0 ? 'tutor_1' : (i % 3 === 1 ? 'tutor_2' : 'tutor_3'),
        fecha: `2026-0${randomMonth}-${Math.floor(Math.random() * 28) + 1}`.replace('-1-', '-01-').replace('-2-', '-02-').replace('-3-', '-03-'),
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
    const [filtroMes, setFiltroMes] = useState(new Date().getMonth().toString());
    const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear());
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
        let res = [...MOCK_VISITAS];

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

        if (filtroMes !== 'all') {
            res = res.filter(v => {
                const d = new Date(v.fecha + 'T12:00:00');
                return d.getMonth().toString() === filtroMes && d.getFullYear() === filtroAnio;
            });
        } else {
            res = res.filter(v => {
                const d = new Date(v.fecha + 'T12:00:00');
                return d.getFullYear() === filtroAnio;
            });
        }

        return res.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }, [searchHist, filtroTutor, filtroMes, filtroAnio]);

    const tutoresMeta = useMemo(() => {
        const set = new Set(MOCK_VISITAS.map(v => v.tutor));
        return Array.from(set);
    }, []);

    const handleExportExcel = () => {
        try {
            // Agrupar datos por tutor para el reporte
            const dataToExport = filteredVisitas.map(v => ({
                Fecha: new Date(v.fecha + 'T12:00:00').toLocaleDateString('es-EC'),
                Código: v.infante.codigo,
                Infante: `${v.infante.persona.nombres} ${v.infante.persona.apellidos}`,
                Tutor: v.tutor,
                Razón: v.razon,
                Realizada: v.visitaExitosa,
                Situación: v.situacion,
                Resultados: v.resultados,
                Observaciones: v.observaciones
            }));

            if (dataToExport.length === 0) {
                enqueueSnackbar('No hay datos para exportar con los filtros actuales', { variant: 'info' });
                return;
            }

            const wb = XLSX.utils.book_new();

            // Si es admin, podemos separar por hojas por tutor
            if (isAdmin && !filtroTutor) {
                const tutores = [...new Set(dataToExport.map(d => d.Tutor))];
                tutores.forEach(tutor => {
                    const tutorData = dataToExport.filter(d => d.Tutor === tutor);
                    const ws = XLSX.utils.json_to_sheet(tutorData);
                    XLSX.utils.book_append_sheet(wb, ws, tutor.substring(0, 31)); // Max 31 chars for sheet name
                });

                // También una hoja general
                const wsGeneral = XLSX.utils.json_to_sheet(dataToExport);
                XLSX.utils.book_append_sheet(wb, wsGeneral, "General");
            } else {
                const ws = XLSX.utils.json_to_sheet(dataToExport);
                XLSX.utils.book_append_sheet(wb, ws, "Visitas");
            }

            const fileName = `Reporte_Visitas_${filtroAnio}_${filtroMes !== 'all' ? MESES.find(m => m.value === filtroMes).label : 'Completo'}.xlsx`;
            XLSX.writeFile(wb, fileName);
            enqueueSnackbar('Excel exportado correctamente', { variant: 'success' });
        } catch (error) {
            console.error("Error exporting excel:", error);
            enqueueSnackbar('Error al exportar el archivo Excel', { variant: 'error' });
        }
    };

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
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <VisitaIcon sx={{ fontSize: 35, color: theme.palette.primary.main }} />
                            Visitas Domiciliarias
                        </Typography>
                        <Typography color="text.secondary">
                            Gestión y control de visitas a los hogares de los infantes
                        </Typography>
                    </Box>

                    {tabIndex === 0 && (
                        <Button
                            variant="outlined"
                            startIcon={<ExcelIcon />}
                            onClick={handleExportExcel}
                            sx={{
                                borderRadius: 2,
                                borderColor: alpha(CCO.violeta, 0.4),
                                color: isDark ? '#fff' : CCO.violeta,
                                '&:hover': {
                                    borderColor: CCO.violeta,
                                    bgcolor: alpha(CCO.violeta, 0.05)
                                }
                            }}
                        >
                            Exportar Excel
                        </Button>
                    )}
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
                                <Grid container spacing={2.5} sx={{ mb: 4 }} alignItems="center">
                                    <Grid item xs={12} md={6} lg={4}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            placeholder="Buscar por infante o código..."
                                            value={searchHist}
                                            onChange={e => setSearchHist(e.target.value)}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <SearchIcon fontSize="small" />
                                                    </InputAdornment>
                                                ),
                                                sx: { borderRadius: 2 }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={6} md={3} lg={1.5}>
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            label="Mes"
                                            value={filtroMes}
                                            onChange={e => setFiltroMes(e.target.value)}
                                            InputProps={{ sx: { borderRadius: 2, minWidth: 100 } }}
                                        >
                                            {MESES.map(m => (
                                                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={6} md={3} lg={1.5}>
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            label="Año"
                                            value={filtroAnio}
                                            onChange={e => setFiltroAnio(e.target.value)}
                                            InputProps={{ sx: { borderRadius: 2, minWidth: 80 } }}
                                        >
                                            {ANIOS.map(a => (
                                                <MenuItem key={a} value={a}>{a}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    {isAdmin && (
                                        <Grid item xs={12} md={12} lg={5}>
                                            <TextField
                                                select
                                                fullWidth
                                                size="small"
                                                label="Tutor"
                                                value={filtroTutor}
                                                onChange={e => setFiltroTutor(e.target.value)}
                                                InputProps={{ sx: { borderRadius: 2, minWidth: 180 } }}
                                            >
                                                <MenuItem value="">Todos los tutores</MenuItem>
                                                {tutoresMeta.map(t => (
                                                    <MenuItem key={t} value={t}>{t}</MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>
                                    )}
                                </Grid>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                                    <Chip
                                        icon={<SuccessIcon sx={{ fontSize: '1rem !important' }} />}
                                        label={`${filteredVisitas.length} Registros encontrados`}
                                        variant="low"
                                        sx={{ bgcolor: alpha(CCO.azul, 0.1), color: isDark ? '#90caf9' : CCO.azul, fontWeight: 700 }}
                                    />
                                </Box>

                                <Box sx={{ overflowX: 'auto' }}>
                                    <Table size="medium">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02) }}>
                                                <TableCell sx={{ fontWeight: 800, color: CCO.violeta }}>Fecha</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: CCO.violeta }}>Infante</TableCell>
                                                {isAdmin && <TableCell sx={{ fontWeight: 800, color: CCO.violeta }}>Tutor</TableCell>}
                                                <TableCell sx={{ fontWeight: 800, color: CCO.violeta }}>Razón</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: CCO.violeta }} align="center">Realizada</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: CCO.violeta }}>Estado</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredVisitas.slice(histPage * histRowsPerPage, histPage * histRowsPerPage + histRowsPerPage).map((v) => (
                                                <TableRow key={v.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                    <TableCell sx={{ fontWeight: 500 }}>
                                                        {new Date(v.fecha + 'T12:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <Avatar sx={{
                                                                width: 32, height: 32, fontSize: '0.8rem', fontWeight: 700,
                                                                bgcolor: AVATAR_COLORS[v.infanteId % AVATAR_COLORS.length],
                                                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                                            }}>
                                                                {v.infante.persona.nombres.charAt(0)}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="body2" fontWeight={700}>{v.infante.persona.nombres} {v.infante.persona.apellidos}</Typography>
                                                                <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>{v.infante.codigo}</Typography>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    {isAdmin && <TableCell variant="body2">{v.tutor}</TableCell>}
                                                    <TableCell>
                                                        <Chip
                                                            label={v.razon}
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 700,
                                                                fontSize: '0.65rem',
                                                                textTransform: 'uppercase',
                                                                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                                                color: theme.palette.secondary.main
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {v.visitaExitosa === 'SI' ? (
                                                            <Tooltip title="Visita Exitosa">
                                                                <SuccessIcon color="success" sx={{ filter: 'drop-shadow(0 2px 4px rgba(76,175,80,0.3))' }} />
                                                            </Tooltip>
                                                        ) : (
                                                            <Tooltip title="No se pudo realizar">
                                                                <ErrorIcon color="error" sx={{ filter: 'drop-shadow(0 2px 4px rgba(244,67,54,0.3))' }} />
                                                            </Tooltip>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="caption" fontWeight={600} sx={{
                                                            color: v.situacion.includes('Baja') ? 'error.main' : 'text.primary',
                                                            bgcolor: alpha(v.situacion.includes('Baja') ? theme.palette.error.main : theme.palette.divider, 0.1),
                                                            px: 1, py: 0.5, borderRadius: 1
                                                        }}>
                                                            {v.situacion}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredVisitas.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                                        <Box sx={{ opacity: 0.5 }}>
                                                            <HistoryIcon sx={{ fontSize: 40, mb: 1 }} />
                                                            <Typography variant="body1">No se encontraron visitas para este periodo.</Typography>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </Box>

                                <TablePagination
                                    component="div"
                                    count={filteredVisitas.length}
                                    page={histPage}
                                    onPageChange={(_, p) => setHistPage(p)}
                                    rowsPerPage={histRowsPerPage}
                                    onRowsPerPageChange={e => { setHistRowsPerPage(parseInt(e.target.value, 10)); setHistPage(0); }}
                                    labelRowsPerPage="Filas por página:"
                                />
                            </Box>
                        ) : (
                            /* ─── REGISTRO ──────────────────────────────────── */
                            <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                                <Box sx={{ textAlign: 'center', mb: 5 }}>
                                    <Typography variant="h5" fontWeight={800} sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                                        <FormIcon sx={{ color: CCO.naranja }} />
                                        Nueva Hoja de Visita
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Complete la información detallada de la visita realizada al hogar del infante.
                                    </Typography>
                                    <Divider sx={{ mt: 3, width: 60, mx: 'auto', borderWidth: 2, borderColor: CCO.naranja, borderRadius: 1 }} />
                                </Box>

                                <Grid container spacing={4}>
                                    <Grid item xs={12} md={6}>
                                        <Card variant="outlined" sx={{ borderRadius: 3, borderStyle: 'dashed', bgcolor: isDark ? alpha(CCO.azul, 0.05) : alpha(CCO.azul, 0.02) }}>
                                            <CardContent>
                                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: CCO.azul, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <PersonIcon fontSize="small" /> Datos del Infante y Fecha
                                                </Typography>
                                                <Stack spacing={3}>
                                                    <Autocomplete
                                                        options={MOCK_INFANTES}
                                                        getOptionLabel={(option) => `${option.codigo} - ${option.persona.nombres} ${option.persona.apellidos}`}
                                                        value={MOCK_INFANTES.find(i => i.id === form.infanteId) || null}
                                                        onChange={(_, newValue) => setForm(f => ({ ...f, infanteId: newValue?.id || null }))}
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                label="Seleccionar Infante"
                                                                size="medium"
                                                                required
                                                                placeholder="Ingrese nombre o código"
                                                                InputProps={{
                                                                    ...params.InputProps,
                                                                    sx: { borderRadius: 2 }
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                    <TextField
                                                        label="Fecha de la Visita"
                                                        type="date"
                                                        fullWidth
                                                        value={form.fecha}
                                                        onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                                                        InputLabelProps={{ shrink: true }}
                                                        required
                                                        InputProps={{ sx: { borderRadius: 2 } }}
                                                    />
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Card variant="outlined" sx={{ borderRadius: 3, borderStyle: 'dashed', bgcolor: isDark ? alpha(CCO.violeta, 0.05) : alpha(CCO.violeta, 0.02) }}>
                                            <CardContent>
                                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: CCO.violeta, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CalendarIcon fontSize="small" /> Estado y Motivo
                                                </Typography>
                                                <Stack spacing={3}>
                                                    <Box>
                                                        <Typography variant="body2" gutterBottom fontWeight={700} color="text.secondary">¿Se realizó la visita al hogar?</Typography>
                                                        <RadioGroup
                                                            row
                                                            value={form.visitaExitosa}
                                                            onChange={e => setForm(f => ({ ...f, visitaExitosa: e.target.value }))}
                                                            sx={{ mt: 1 }}
                                                        >
                                                            <FormControlLabel
                                                                value="SI"
                                                                control={<Radio sx={{ color: 'success.main', '&.Mui-checked': { color: 'success.main' } }} />}
                                                                label={<Typography fontWeight={700} color="success.main">SÍ, EXITOSA</Typography>}
                                                            />
                                                            <FormControlLabel
                                                                value="NO"
                                                                control={<Radio sx={{ color: 'error.main', '&.Mui-checked': { color: 'error.main' } }} />}
                                                                label={<Typography fontWeight={700} color="error.main">NO REALIZADA</Typography>}
                                                            />
                                                        </RadioGroup>
                                                    </Box>
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        label="Razón de Visita"
                                                        value={form.razon}
                                                        onChange={e => setForm(f => ({ ...f, razon: e.target.value }))}
                                                        required
                                                        InputProps={{ sx: { borderRadius: 2 } }}
                                                    >
                                                        {RAZONES.map(r => (
                                                            <MenuItem key={r} value={r}>{r}</MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Resultados Detallados"
                                            multiline
                                            rows={4}
                                            value={form.resultados}
                                            onChange={e => setForm(f => ({ ...f, resultados: e.target.value }))}
                                            placeholder="Describa la situación familiar, salud, estudios y cualquier novedad relevante observada..."
                                            InputProps={{ sx: { borderRadius: 3 } }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={5}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Decisión / Situación Post-Visita"
                                            value={form.situacion}
                                            onChange={e => setForm(f => ({ ...f, situacion: e.target.value }))}
                                            InputProps={{ sx: { borderRadius: 2 } }}
                                        >
                                            {SITUACIONES.map(s => (
                                                <MenuItem key={s} value={s}>{s}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    <Grid item xs={12} md={7}>
                                        <TextField
                                            fullWidth
                                            label="Observaciones y Recomendaciones"
                                            multiline
                                            rows={2}
                                            value={form.observaciones}
                                            onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                                            placeholder="Tareas pendientes o compromisos adquiridos..."
                                            InputProps={{ sx: { borderRadius: 2 } }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 4, mb: 2 }}>
                                        <Button
                                            variant="text"
                                            onClick={() => setTabIndex(0)}
                                            disabled={saving}
                                            sx={{ px: 4, fontWeight: 700, color: 'text.secondary' }}
                                        >
                                            Descartar
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={guardar}
                                            disabled={saving}
                                            sx={{
                                                px: 6,
                                                py: 1.5,
                                                borderRadius: 3,
                                                fontWeight: 800,
                                                fontSize: '1rem',
                                                background: `linear-gradient(135deg, ${CCO.naranja} 0%, ${CCO.violeta} 100%)`,
                                                boxShadow: `0 4px 15px ${alpha(CCO.violeta, 0.4)}`,
                                                '&:hover': {
                                                    boxShadow: `0 6px 20px ${alpha(CCO.violeta, 0.6)}`,
                                                    opacity: 0.9
                                                }
                                            }}
                                            startIcon={saving ? <CircularProgress size={24} color="inherit" /> : <SuccessIcon />}
                                        >
                                            {saving ? 'Procesando...' : 'Finalizar y Guardar'}
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
