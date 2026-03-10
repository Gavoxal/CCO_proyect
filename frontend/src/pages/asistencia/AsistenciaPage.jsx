import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Card, CardContent, Button, Chip, ToggleButton,
    ToggleButtonGroup, Grid, TextField, Alert, Stack, Avatar,
    Paper, Tooltip, alpha, useTheme, IconButton, InputAdornment,
    Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow,
    TablePagination, Badge, LinearProgress, Divider,
} from '@mui/material';
import {
    Save as SaveIcon, ChecklistRtl as AsistenciaIcon,
    Search as SearchIcon, History as HistoryIcon,
    PhotoCamera as PhotoIcon, Today as TodayIcon,
    BarChart as ChartIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import { useSnackbar } from 'notistack';

// ─── Paleta CCO ───────────────────────────────────────────────────────────────
const CCO = { amarillo: '#FFD700', naranja: '#FF8C00', violeta: '#6A5ACD', azul: '#4169E1' };
const AVATAR_COLORS = ['#7c4dff', '#00bcd4', '#ff5722', '#4caf50', '#ff9800', '#e91e63', '#3f51b5', '#009688'];
const ESTADO_COLORS = { Presente: 'success', Ausente: 'error', Justificado: 'warning' };
const EMOJI = { Presente: '✅', Ausente: '❌', Justificado: '⚠️' };

// ─── Mock Infantes ────────────────────────────────────────────────────────────
const MOCK_INFANTES = [
    { id: 1, codigo: 'INF-001', fotografia: '/mock-fotos/inf001.png', persona: { nombres: 'María Gabriela', apellidos: 'López Mendoza' } },
    { id: 2, codigo: 'INF-002', fotografia: '/mock-fotos/inf002.png', persona: { nombres: 'José Andrés', apellidos: 'Pérez Villao' } },
    { id: 3, codigo: 'INF-003', fotografia: '/mock-fotos/inf003.png', persona: { nombres: 'Camila Sofía', apellidos: 'Torres Aragundi' } },
    { id: 4, codigo: 'INF-004', fotografia: '/mock-fotos/inf004.png', persona: { nombres: 'Sebastián', apellidos: 'Morales Intriago' } },
    { id: 5, codigo: 'INF-005', fotografia: null, persona: { nombres: 'Valentina', apellidos: 'Cedeño Bravo' } },
    { id: 6, codigo: 'INF-006', fotografia: null, persona: { nombres: 'Daniel Alejandro', apellidos: 'Ramírez Loor' } },
    { id: 7, codigo: 'INF-007', fotografia: null, persona: { nombres: 'Isabella', apellidos: 'Vélez Zambrano' } },
    { id: 8, codigo: 'INF-008', fotografia: null, persona: { nombres: 'Matías', apellidos: 'Suárez Pincay' } },
    { id: 9, codigo: 'INF-009', fotografia: null, persona: { nombres: 'Luciana', apellidos: 'Mera Chávez' } },
    { id: 10, codigo: 'INF-010', fotografia: null, persona: { nombres: 'Nicolás Emilio', apellidos: 'Castro Bone' } },
    { id: 11, codigo: 'INF-011', fotografia: null, persona: { nombres: 'Emilia', apellidos: 'Figueroa Palacios' } },
    { id: 12, codigo: 'INF-012', fotografia: null, persona: { nombres: 'Santiago', apellidos: 'Quishpe Yagual' } },
];

// ─── Mock Historial ───────────────────────────────────────────────────────────
const generateHistorial = () => {
    const records = [];
    const fechas = [
        '2026-03-08', '2026-03-01', '2026-02-22', '2026-02-15',
        '2026-02-08', '2026-02-01', '2026-01-25', '2026-01-18',
    ];
    const estados = ['Presente', 'Presente', 'Presente', 'Ausente', 'Presente', 'Justificado', 'Presente', 'Presente'];
    let rid = 1;
    fechas.forEach((fecha, fi) => {
        MOCK_INFANTES.forEach((inf, ii) => {
            // Vary attendance patterns per infante
            const eIdx = (fi + ii) % estados.length;
            records.push({ id: rid++, fecha, infanteId: inf.id, infante: inf, estado: estados[eIdx] });
        });
    });
    return records;
};
const MOCK_HISTORIAL = generateHistorial();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (inf) => `${inf.persona?.nombres?.charAt(0) || ''}${inf.persona?.apellidos?.charAt(0) || ''}`;

// ─── AsistenciaPage ───────────────────────────────────────────────────────────
const AsistenciaPage = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const hoy = new Date().toISOString().split('T')[0];

    const [tabIndex, setTabIndex] = useState(0);  // 0 = Toma, 1 = Historial
    const [fecha, setFecha] = useState(hoy);
    const [searchToma, setSearchToma] = useState('');
    const [searchHist, setSearchHist] = useState('');
    const [estados, setEstados] = useState(() => {
        const init = {};
        MOCK_INFANTES.forEach(i => { init[i.id] = 'Ausente'; });
        return init;
    });
    const [saving, setSaving] = useState(false);

    // Historial state
    const [histFiltroEstado, setHistFiltroEstado] = useState('');
    const [histFiltroFecha, setHistFiltroFecha] = useState('');
    const [histPage, setHistPage] = useState(0);
    const [histRowsPerPage, setHistRowsPerPage] = useState(15);

    // ── Toma de asistencia ────────────────────────────────────────────────────
    const filteredInfantes = useMemo(() => {
        if (!searchToma) return MOCK_INFANTES;
        const s = searchToma.toLowerCase();
        return MOCK_INFANTES.filter(i =>
            `${i.persona.nombres} ${i.persona.apellidos}`.toLowerCase().includes(s) ||
            i.codigo.toLowerCase().includes(s)
        );
    }, [searchToma]);

    const conteo = useMemo(() =>
        Object.values(estados).reduce(
            (acc, e) => { acc[e] = (acc[e] || 0) + 1; return acc; },
            { Presente: 0, Ausente: 0, Justificado: 0 }
        ), [estados]
    );

    const totalInf = MOCK_INFANTES.length;
    const porcentajeAsist = Math.round((conteo.Presente / totalInf) * 100);

    const handleEstado = (infanteId, nuevoEstado) => {
        if (!nuevoEstado) return;
        setEstados(e => ({ ...e, [infanteId]: nuevoEstado }));
    };

    const marcarTodos = (estado) => {
        const updated = {};
        MOCK_INFANTES.forEach(i => { updated[i.id] = estado; });
        setEstados(updated);
    };

    const guardar = async () => {
        setSaving(true);
        await new Promise(r => setTimeout(r, 700));
        setSaving(false);
        const fechaStr = new Date(fecha + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' });
        enqueueSnackbar(`Asistencia del ${fechaStr} guardada correctamente`, { variant: 'success' });
    };

    // ── Historial ─────────────────────────────────────────────────────────────
    const filteredHistorial = useMemo(() => {
        let res = MOCK_HISTORIAL;
        if (histFiltroEstado) res = res.filter(r => r.estado === histFiltroEstado);
        if (histFiltroFecha) res = res.filter(r => r.fecha === histFiltroFecha);
        if (searchHist) {
            const s = searchHist.toLowerCase();
            res = res.filter(r =>
                `${r.infante.persona.nombres} ${r.infante.persona.apellidos}`.toLowerCase().includes(s) ||
                r.infante.codigo.toLowerCase().includes(s)
            );
        }
        return res;
    }, [histFiltroEstado, histFiltroFecha, searchHist]);

    const histPaginado = filteredHistorial.slice(histPage * histRowsPerPage, histPage * histRowsPerPage + histRowsPerPage);

    // Estadísticas del historial global
    const histStats = useMemo(() => {
        const total = MOCK_HISTORIAL.length;
        const p = MOCK_HISTORIAL.filter(r => r.estado === 'Presente').length;
        const a = MOCK_HISTORIAL.filter(r => r.estado === 'Ausente').length;
        const j = MOCK_HISTORIAL.filter(r => r.estado === 'Justificado').length;
        return { total, p, a, j, pct: Math.round((p / total) * 100) };
    }, []);

    return (
        <MainLayout>
            <Box sx={{ p: { xs: 1.5, md: 0 } }}>

                {/* ── Header ──────────────────────────────────────── */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AsistenciaIcon sx={{ fontSize: 32, color: isDark ? CCO.naranja : CCO.violeta }} />
                            Asistencia
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Registra y consulta la asistencia de todos los infantes
                        </Typography>
                    </Box>
                </Box>

                {/* ── Tabs ─────────────────────────────────────────── */}
                <Paper elevation={0} sx={{
                    border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden',
                    mt: 2.5, mb: 3, bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.01),
                }}>
                    <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="fullWidth"
                        sx={{
                            '& .MuiTabs-indicator': {
                                height: 3, borderRadius: '3px 3px 0 0',
                                background: `linear-gradient(90deg, ${CCO.naranja}, ${CCO.violeta})`,
                            },
                            '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', py: 1.8 },
                        }}>
                        <Tab icon={<TodayIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Toma de Asistencia" />
                        <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Historial (${MOCK_HISTORIAL.length})`} />
                    </Tabs>
                </Paper>

                {/* ═══════════════════════════════════════════════════════════════
                    TAB 0: TOMA DE ASISTENCIA
                    ═══════════════════════════════════════════════════════════════ */}
                {tabIndex === 0 && (
                    <Box>
                        {/* Controles superiores */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mb: 3 }}>
                            <TextField
                                type="date" size="small" label="Fecha" value={fecha}
                                onChange={e => setFecha(e.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }}
                                sx={{ minWidth: 180 }}
                            />
                            <TextField
                                size="small" placeholder="Buscar infante..."
                                value={searchToma} onChange={e => setSearchToma(e.target.value)}
                                sx={{ flex: 1, minWidth: 200 }}
                                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                            />
                            <Button variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={guardar} disabled={saving}
                                sx={{ borderRadius: 3, px: 3, py: 1.1, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {saving ? 'Guardando...' : 'Guardar Asistencia'}
                            </Button>
                        </Stack>

                        {/* Resumen / Conteo */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                            <Card elevation={0} sx={{ flex: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
                                        {Object.entries(conteo).map(([estado, cnt]) => (
                                            <Tooltip key={estado} title={`Marcar todos como ${estado}`}>
                                                <Chip
                                                    label={`${EMOJI[estado]} ${cnt} ${estado}`}
                                                    color={ESTADO_COLORS[estado]}
                                                    variant="outlined"
                                                    sx={{ fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}
                                                    onClick={() => marcarTodos(estado)}
                                                />
                                            </Tooltip>
                                        ))}
                                        <Divider orientation="vertical" flexItem />
                                        <Chip
                                            label={`${porcentajeAsist}% asistencia`}
                                            sx={{
                                                fontWeight: 700, fontSize: '0.82rem',
                                                bgcolor: alpha(porcentajeAsist >= 80 ? '#4caf50' : porcentajeAsist >= 50 ? '#ff9800' : '#ef5350', 0.1),
                                                color: porcentajeAsist >= 80 ? '#4caf50' : porcentajeAsist >= 50 ? '#ff9800' : '#ef5350',
                                                border: `1px solid ${alpha(porcentajeAsist >= 80 ? '#4caf50' : porcentajeAsist >= 50 ? '#ff9800' : '#ef5350', 0.3)}`,
                                            }}
                                        />
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Stack>

                        {/* Tabla de asistencia */}
                        <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', width: 40 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Infante</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', width: 100 }}>Código</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', width: 240 }}>Estado</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredInfantes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                                <Typography color="text.secondary">No se encontraron infantes</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredInfantes.map((inf, idx) => {
                                        const estado = estados[inf.id];
                                        const accentColor = estado === 'Presente' ? '#4caf50' : estado === 'Ausente' ? '#ef5350' : '#ff9800';
                                        return (
                                            <TableRow key={inf.id} sx={{
                                                borderLeft: `4px solid ${accentColor}`,
                                                transition: 'all 0.15s ease',
                                                bgcolor: alpha(accentColor, 0.03),
                                                '&:hover': { bgcolor: alpha(accentColor, 0.07) },
                                            }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600} color="text.secondary">{idx + 1}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Avatar
                                                            src={inf.fotografia || undefined}
                                                            sx={{
                                                                width: 36, height: 36, fontSize: '0.78rem', fontWeight: 700,
                                                                bgcolor: AVATAR_COLORS[inf.id % AVATAR_COLORS.length],
                                                            }}
                                                        >
                                                            {getInitials(inf)}
                                                        </Avatar>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {inf.persona?.nombres} {inf.persona?.apellidos}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={inf.codigo} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <ToggleButtonGroup
                                                        value={estado} exclusive size="small"
                                                        onChange={(_, val) => handleEstado(inf.id, val)}
                                                        sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.4, fontSize: '0.72rem', fontWeight: 700 } }}
                                                    >
                                                        <ToggleButton value="Presente" color="success">✅ Presente</ToggleButton>
                                                        <ToggleButton value="Ausente" color="error">❌ Ausente</ToggleButton>
                                                        <ToggleButton value="Justificado" color="warning">⚠️ Justif.</ToggleButton>
                                                    </ToggleButtonGroup>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Paper>
                    </Box>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    TAB 1: HISTORIAL DE ASISTENCIA
                    ═══════════════════════════════════════════════════════════════ */}
                {tabIndex === 1 && (
                    <Box>
                        {/* Stats cards */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            {[
                                { label: 'Total Registros', value: histStats.total, icon: <ChartIcon />, color: CCO.azul },
                                { label: 'Presentes', value: histStats.p, icon: <>{EMOJI.Presente}</>, color: '#4caf50' },
                                { label: 'Ausentes', value: histStats.a, icon: <>{EMOJI.Ausente}</>, color: '#ef5350' },
                                { label: 'Justificados', value: histStats.j, icon: <>{EMOJI.Justificado}</>, color: '#ff9800' },
                            ].map(stat => (
                                <Grid item xs={6} md={3} key={stat.label}>
                                    <Card elevation={0} sx={{
                                        border: `1px solid ${theme.palette.divider}`, borderRadius: 3,
                                        bgcolor: alpha(stat.color, 0.04),
                                    }}>
                                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, textAlign: 'center' }}>
                                            <Typography variant="h4" fontWeight={800} sx={{ color: stat.color }}>{stat.value}</Typography>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>{stat.label}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

                        {/* Barra de asistencia general */}
                        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, mb: 3 }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="subtitle2" fontWeight={700}>Porcentaje General de Asistencia</Typography>
                                    <Chip label={`${histStats.pct}%`} size="small"
                                        color={histStats.pct >= 80 ? 'success' : histStats.pct >= 50 ? 'warning' : 'error'}
                                        sx={{ fontWeight: 700 }} />
                                </Box>
                                <LinearProgress variant="determinate" value={histStats.pct}
                                    sx={{
                                        height: 10, borderRadius: 5,
                                        bgcolor: alpha('#000', 0.08),
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 5,
                                            bgcolor: histStats.pct >= 80 ? '#4caf50' : histStats.pct >= 50 ? '#ff9800' : '#ef5350',
                                        },
                                    }} />
                            </CardContent>
                        </Card>

                        {/* Filtros */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                            <TextField
                                size="small" placeholder="Buscar infante..."
                                value={searchHist} onChange={e => { setSearchHist(e.target.value); setHistPage(0); }}
                                sx={{ flex: 1, minWidth: 200 }}
                                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                            />
                            <TextField select size="small" label="Estado" value={histFiltroEstado}
                                onChange={e => { setHistFiltroEstado(e.target.value); setHistPage(0); }}
                                sx={{ minWidth: 160 }}>
                                <option value="">Todos</option>
                                <option value="Presente">Presente</option>
                                <option value="Ausente">Ausente</option>
                                <option value="Justificado">Justificado</option>
                            </TextField>
                            <TextField
                                type="date" size="small" label="Filtrar fecha"
                                value={histFiltroFecha}
                                onChange={e => { setHistFiltroFecha(e.target.value); setHistPage(0); }}
                                slotProps={{ inputLabel: { shrink: true } }}
                                sx={{ minWidth: 180 }}
                            />
                        </Stack>

                        {/* Tabla historial */}
                        <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Fecha</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Foto</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Infante</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Código</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Estado</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {histPaginado.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                                <Typography color="text.secondary">No se encontraron registros</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : histPaginado.map(r => (
                                        <TableRow key={r.id} hover sx={{ cursor: 'pointer' }}
                                            onClick={() => navigate(`/infantes/${r.infanteId}`)}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                                                    {new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Avatar
                                                    src={r.infante.fotografia || undefined}
                                                    sx={{
                                                        width: 32, height: 32, fontSize: '0.72rem', fontWeight: 700,
                                                        bgcolor: AVATAR_COLORS[r.infanteId % AVATAR_COLORS.length],
                                                    }}
                                                >
                                                    {getInitials(r.infante)}
                                                </Avatar>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {r.infante.persona.nombres} {r.infante.persona.apellidos}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={r.infante.codigo} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={`${EMOJI[r.estado]} ${r.estado}`} size="small"
                                                    color={ESTADO_COLORS[r.estado]} variant="outlined"
                                                    sx={{ fontWeight: 600 }} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <TablePagination
                                component="div" count={filteredHistorial.length}
                                page={histPage} onPageChange={(_, p) => setHistPage(p)}
                                rowsPerPage={histRowsPerPage}
                                onRowsPerPageChange={e => { setHistRowsPerPage(parseInt(e.target.value, 10)); setHistPage(0); }}
                                rowsPerPageOptions={[10, 15, 25, 50]}
                                labelRowsPerPage="Filas por página:"
                                labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                                sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
                            />
                        </Paper>
                    </Box>
                )}
            </Box>
        </MainLayout>
    );
};

export default AsistenciaPage;
