import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Card, CardContent, Button, Chip, ToggleButton,
    ToggleButtonGroup, Grid, TextField, Alert, Stack, Avatar,
    Paper, Tooltip, alpha, useTheme, IconButton, InputAdornment,
    Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow,
    TablePagination, LinearProgress, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
} from '@mui/material';
import {
    Save as SaveIcon, ChecklistRtl as AsistenciaIcon,
    Search as SearchIcon, History as HistoryIcon,
    Today as TodayIcon, BarChart as ChartIcon,
    FileDownload as ExportIcon, Close as CloseIcon,
    Group as GroupIcon, CheckCircle as CheckIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
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

// ─── Helpers de exportación ───────────────────────────────────────────────────
const PERIODOS = [
    { value: 'mes', label: 'Este mes' },
    { value: 'trimestre', label: 'Trimestre actual' },
    { value: 'semestre', label: 'Semestre actual' },
    { value: 'anual', label: 'Año completo' },
];

const getFechaInicio = (periodo) => {
    const hoy = new Date();
    switch (periodo) {
        case 'mes': return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        case 'trimestre': return new Date(hoy.getFullYear(), Math.floor(hoy.getMonth() / 3) * 3, 1).toISOString().split('T')[0];
        case 'semestre': return new Date(hoy.getFullYear(), Math.floor(hoy.getMonth() / 6) * 6, 1).toISOString().split('T')[0];
        case 'anual': return new Date(hoy.getFullYear(), 0, 1).toISOString().split('T')[0];
        default: return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    }
};

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

    // Exportar Excel
    const [exportModal, setExportModal] = useState(false);
    const [exportPeriodo, setExportPeriodo] = useState('mes');
    const [exportando, setExportando] = useState(false);

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

    // ── Estadísticas del mes actual ───────────────────────────────────────────
    const mesActual = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    const statsDestesMes = useMemo(() => {
        const registrosMes = MOCK_HISTORIAL.filter(r => r.fecha.startsWith(mesActual));
        const infantesConAsistencia = new Set(
            registrosMes.filter(r => r.estado === 'Presente').map(r => r.infanteId)
        );
        const diasUnicos = new Set(registrosMes.map(r => r.fecha)).size;
        const totalPresencias = registrosMes.filter(r => r.estado === 'Presente').length;
        const totalAusencias = registrosMes.filter(r => r.estado === 'Ausente').length;
        const totalJustificados = registrosMes.filter(r => r.estado === 'Justificado').length;
        return {
            infantesAsistidos: infantesConAsistencia.size,
            totalInfantes: MOCK_INFANTES.length,
            pct: MOCK_INFANTES.length > 0 ? Math.round((infantesConAsistencia.size / MOCK_INFANTES.length) * 100) : 0,
            dias: diasUnicos,
            presencias: totalPresencias,
            ausencias: totalAusencias,
            justificados: totalJustificados,
        };
    }, [mesActual]);

    // ── Exportar Excel ────────────────────────────────────────────────────────
    const handleExportar = async () => {
        setExportando(true);
        await new Promise(r => setTimeout(r, 400)); // small delay for UX

        const fechaInicio = getFechaInicio(exportPeriodo);
        const datos = MOCK_HISTORIAL
            .filter(r => r.fecha >= fechaInicio)
            .sort((a, b) => a.fecha.localeCompare(b.fecha))
            .map(r => ({
                'Fecha': new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
                'Código': r.infante.codigo,
                'Nombres': r.infante.persona.nombres,
                'Apellidos': r.infante.persona.apellidos,
                'Estado': r.estado,
            }));

        const ws = XLSX.utils.json_to_sheet(datos);

        // Ancho de columnas
        ws['!cols'] = [{ wch: 35 }, { wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 14 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');

        const periodoLabel = PERIODOS.find(p => p.value === exportPeriodo)?.label || exportPeriodo;
        const nombreArchivo = `Asistencia_${periodoLabel.replace(/ /g, '_')}_${new Date().toLocaleDateString('es-EC').replace(/\//g, '-')}.xlsx`;
        XLSX.writeFile(wb, nombreArchivo);

        setExportando(false);
        setExportModal(false);
        enqueueSnackbar(`Excel exportado: ${nombreArchivo}`, { variant: 'success' });
    };

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
                    {/* Botón exportar Excel */}
                    <Button
                        variant="outlined"
                        startIcon={<ExportIcon />}
                        onClick={() => setExportModal(true)}
                        sx={{
                            borderRadius: 3, px: 2.5, py: 1.1, fontWeight: 700,
                            textTransform: 'none', borderColor: '#2e7d32', color: '#2e7d32',
                            '&:hover': { bgcolor: alpha('#2e7d32', 0.06), borderColor: '#1b5e20' }
                        }}
                    >
                        Exportar Excel
                    </Button>
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

                        {/* ── Estadísticas del mes actual ── */}
                        <Card elevation={0} sx={{
                            border: `1px solid ${theme.palette.divider}`, borderRadius: 3, mb: 3,
                            background: isDark
                                ? `linear-gradient(135deg, ${alpha(CCO.azul, 0.12)}, ${alpha(CCO.violeta, 0.08)})`
                                : `linear-gradient(135deg, ${alpha(CCO.azul, 0.04)}, ${alpha(CCO.violeta, 0.03)})`,
                        }}>
                            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <GroupIcon fontSize="small" sx={{ color: CCO.azul }} />
                                    Asistencia del mes · {new Date().toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
                                </Typography>
                                <Grid container spacing={2} alignItems="center">
                                    {/* Barra principal infantes */}
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                            <Typography variant="body2" color="text.secondary">Infantes con asistencia este mes</Typography>
                                            <Typography variant="body2" fontWeight={800} color={statsDestesMes.pct >= 80 ? 'success.main' : statsDestesMes.pct >= 50 ? 'warning.main' : 'error.main'}>
                                                {statsDestesMes.infantesAsistidos} / {statsDestesMes.totalInfantes}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate" value={statsDestesMes.pct}
                                            sx={{
                                                height: 12, borderRadius: 6,
                                                bgcolor: alpha(statsDestesMes.pct >= 80 ? '#4caf50' : statsDestesMes.pct >= 50 ? '#ff9800' : '#ef5350', 0.15),
                                                '& .MuiLinearProgress-bar': {
                                                    borderRadius: 6,
                                                    background: statsDestesMes.pct >= 80
                                                        ? 'linear-gradient(90deg, #4caf50, #81c784)'
                                                        : statsDestesMes.pct >= 50
                                                            ? 'linear-gradient(90deg, #ff9800, #ffb74d)'
                                                            : 'linear-gradient(90deg, #ef5350, #e57373)',
                                                }
                                            }}
                                        />
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                            {statsDestesMes.pct}% de participación · {statsDestesMes.dias} día(s) registrado(s)
                                        </Typography>
                                    </Grid>
                                    {/* Mini KPIs del mes */}
                                    <Grid item xs={12} md={6}>
                                        <Stack direction="row" spacing={1.5} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                                            {[
                                                { label: 'Presencias', value: statsDestesMes.presencias, color: '#4caf50', emoji: '✅' },
                                                { label: 'Ausencias', value: statsDestesMes.ausencias, color: '#ef5350', emoji: '❌' },
                                                { label: 'Justificados', value: statsDestesMes.justificados, color: '#ff9800', emoji: '⚠️' },
                                            ].map(k => (
                                                <Box key={k.label} sx={{
                                                    textAlign: 'center', p: 1.5, borderRadius: 2,
                                                    bgcolor: alpha(k.color, 0.08), minWidth: 80,
                                                    border: `1px solid ${alpha(k.color, 0.2)}`
                                                }}>
                                                    <Typography fontSize={18}>{k.emoji}</Typography>
                                                    <Typography fontWeight={900} fontSize={20} color={k.color}>{k.value}</Typography>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{k.label}</Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* ── Conteo del día actual + Marcar todos ── */}
                        <Card elevation={0} sx={{ flex: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 3, mb: 3 }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" flexWrap="wrap">
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
                                        label={`${porcentajeAsist}% hoy`}
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

            {/* ── Modal de Exportación Excel ── */}
            <Dialog open={exportModal} onClose={() => setExportModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ExportIcon sx={{ color: '#2e7d32' }} />
                        <Typography fontWeight={800}>Exportar Asistencia</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setExportModal(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                <Divider />
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, mt: 1 }}>
                        Selecciona el período de asistencia que deseas exportar al archivo Excel.
                    </Typography>
                    <Stack spacing={1.5}>
                        {PERIODOS.map(p => {
                            const fechaInicio = getFechaInicio(p.value);
                            const registros = MOCK_HISTORIAL.filter(r => r.fecha >= fechaInicio).length;
                            return (
                                <Box
                                    key={p.value}
                                    onClick={() => setExportPeriodo(p.value)}
                                    sx={{
                                        p: 1.75, borderRadius: 2.5, cursor: 'pointer',
                                        border: `2px solid`,
                                        borderColor: exportPeriodo === p.value ? '#2e7d32' : 'divider',
                                        bgcolor: exportPeriodo === p.value ? alpha('#2e7d32', 0.06) : 'transparent',
                                        transition: 'all 0.15s ease',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        '&:hover': { borderColor: '#2e7d32', bgcolor: alpha('#2e7d32', 0.04) }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {exportPeriodo === p.value
                                            ? <CheckIcon sx={{ color: '#2e7d32', fontSize: 20 }} />
                                            : <Box sx={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid', borderColor: 'divider' }} />
                                        }
                                        <Typography fontWeight={700} fontSize={14}>{p.label}</Typography>
                                    </Box>
                                    <Chip label={`${registros} registros`} size="small"
                                        sx={{ fontWeight: 700, fontSize: 11, bgcolor: alpha('#2e7d32', 0.08), color: '#2e7d32' }} />
                                </Box>
                            );
                        })}
                    </Stack>
                    <Box sx={{ mt: 2.5, p: 1.5, borderRadius: 2, bgcolor: alpha('#2e7d32', 0.05) }}>
                        <Typography variant="caption" color="text.secondary">
                            📄 Se generará un archivo <strong>.xlsx</strong> con fecha, código, nombre, apellidos y estado de asistencia.
                        </Typography>
                    </Box>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setExportModal(false)} color="inherit" sx={{ borderRadius: 2, fontWeight: 700 }}>Cancelar</Button>
                    <Button
                        variant="contained" startIcon={<ExportIcon />}
                        onClick={handleExportar} disabled={exportando}
                        sx={{
                            borderRadius: 3, px: 3, fontWeight: 800, textTransform: 'none',
                            bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' }
                        }}
                    >
                        {exportando ? 'Generando...' : 'Descargar Excel'}
                    </Button>
                </DialogActions>
            </Dialog>
        </MainLayout>
    );
};

export default AsistenciaPage;
