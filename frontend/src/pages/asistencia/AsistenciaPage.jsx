import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Card, CardContent, Button, Chip, ToggleButton,
    ToggleButtonGroup, Grid, TextField, Stack, Avatar,
    Paper, Tooltip, alpha, useTheme, IconButton, InputAdornment,
    Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow,
    TablePagination, LinearProgress, Divider, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions,
    MenuItem,
} from '@mui/material';
import {
    Save as SaveIcon, ChecklistRtl as AsistenciaIcon,
    Search as SearchIcon, History as HistoryIcon,
    Today as TodayIcon, BarChart as ChartIcon,
    FileDownload as ExportIcon, Close as CloseIcon,
    Group as GroupIcon, CheckCircle as CheckIcon,
    Cancel as CancelIcon, WatchLater as PendingIcon,
    Payment as PaymentIcon, Edit as EditIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import MainLayout from '../../components/layout/MainLayout';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import infanteService from '../../services/infanteService';
import asistenciaService from '../../services/asistenciaService';
import { 
    getSchoolYearRange, formatDateToDDMMYYYY, 
    getISOWeekRange, getMonthRange, getQuarterRange 
} from '../../utils/dateUtils';

// ─── Paleta CCO ───────────────────────────────────────────────────────────────
const CCO = { amarillo: '#FFD700', naranja: '#FF8C00', violeta: '#6A5ACD', azul: '#4169E1' };
const AVATAR_COLORS = ['#7c4dff', '#00bcd4', '#ff5722', '#4caf50', '#ff9800', '#e91e63', '#3f51b5', '#009688'];
const ESTADO_LABELS = {
    Mes: 'MES',
    Semana: 'SEM',
    PagoDia: 'PAGO',
    Pendiente: 'P (DEBE)',
    Punto: 'S',
    Ausente: 'FALTA'
};
const EMOJI = { Mes: '💰', Semana: '📅', PagoDia: '💵', Pendiente: '🛑', Punto: '📋', Ausente: '❌' };
const ESTADO_COLORS = {
    Mes: 'success',
    Semana: 'primary',
    PagoDia: 'info',
    Pendiente: 'error',
    Punto: 'secondary',
    Ausente: 'default'
};
const ESTADO_DISPLAY = {
    Mes: 'Mes',
    Semana: 'Semana',
    PagoDia: 'Pago Diario',
    Pendiente: 'Deuda (P)',
    Punto: 'Seguimiento (S)',
    Ausente: 'Falta (F)'
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (inf) => `${inf.persona?.nombres?.charAt(0) || ''}${inf.persona?.apellidos?.charAt(0) || ''}`;

// ─── Helpers de exportación ───────────────────────────────────────────────────
const PERIODOS = [
    { value: 'semana', label: 'Esta semana' },
    { value: 'mes', label: 'Este mes' },
    { value: 'trimestre', label: 'Trimestre actual' },
    { value: 'semestre', label: 'Semestre actual' },
    { value: 'anual', label: 'Año completo' },
    { value: 'custom', label: 'Personalizado' },
];

const getFechaInicio = (periodo) => {
    const hoy = new Date();
    const schoolYear = getSchoolYearRange();
    switch (periodo) {
        case 'semana': {
            const day = hoy.getDay();
            const diff = hoy.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(hoy.setDate(diff)).toISOString().split('T')[0];
        }
        case 'mes': return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        case 'trimestre': return new Date(hoy.getFullYear(), Math.floor(hoy.getMonth() / 3) * 3, 1).toISOString().split('T')[0];
        case 'semestre': return new Date(hoy.getFullYear(), Math.floor(hoy.getMonth() / 6) * 6, 1).toISOString().split('T')[0];
        case 'anual': return schoolYear.start.toISOString().split('T')[0];
        default: return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    }
};

// ─── AsistenciaPage ───────────────────────────────────────────────────────────
const AsistenciaPage = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const theme = useTheme();
    const { getImageUrl } = useAuth();
    const isDark = theme.palette.mode === 'dark';

    const hoy = new Date().toISOString().split('T')[0];

    const [tabIndex, setTabIndex] = useState(0);
    const [fecha, setFecha] = useState(hoy);
    const [searchToma, setSearchToma] = useState('');
    const [totalHist, setTotalHist] = useState(0);
    const [histSummary, setHistSummary] = useState({ Mes: 0, Semana: 0, PagoDia: 0, Pendiente: 0, Punto: 0, Ausente: 0, totalInfantesAtendidos: 0 });
    const [searchHist, setSearchHist] = useState('');

    const [infantes, setInfantes] = useState([]);
    const [estados, setEstados] = useState({});
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [exportando, setExportando] = useState(false);
    const [exportModal, setExportModal] = useState(false);
    const [exportPeriodo, setExportPeriodo] = useState('mes');
    const [exportFechaInicio, setExportFechaInicio] = useState(getMonthRange().start);
    const [exportFechaFin, setExportFechaFin] = useState(hoy);

    // Historial - Filtros de rango
    const [histFechaInicio, setHistFechaInicio] = useState(getMonthRange().start);
    const [histFechaFin, setHistFechaFin] = useState(hoy);
    const [histFiltroPatrocinio, setHistFiltroPatrocinio] = useState('all');


    // Historial state
    const [histFiltroEstado, setHistFiltroEstado] = useState('');
    const [histPage, setHistPage] = useState(0);
    const [histRowsPerPage, setHistRowsPerPage] = useState(15);

    // Toma de asistencia pagination
    const [tomaPage, setTomaPage] = useState(0);
    const [tomaRowsPerPage, setTomaRowsPerPage] = useState(25);

    // Cargar Infantes dinámicamente según la fecha para actualizar badges de pago
    const cargarDatosInfantes = useCallback(async () => {
        setLoading(true);
        try {
            const res = await infanteService.listar({ limit: 1000, referencia: fecha });
            setInfantes(res.data || []);
        } catch (error) {
            enqueueSnackbar('Error al cargar infantes', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [fecha, enqueueSnackbar]);

    useEffect(() => {
        cargarDatosInfantes();
    }, [cargarDatosInfantes]);

    // Cargar asistencia de la fecha seleccionada
    const cargarTomaFecha = useCallback(async () => {
        if (!fecha) return;
        try {
            const res = await asistenciaService.listar({ fecha, limit: 1000 });
            const data = res.data || [];
            const mapping = {};
            // Inicializar todos con 'Ausente' por defecto si no tienen registro
            infantes.forEach(i => mapping[i.id] = 'Ausente');
            // Sobrescribir con los reales
            data.forEach(r => mapping[r.infanteId] = r.estado);
            setEstados(mapping);
        } catch (error) {
            console.error('Error cargando asistencia de fecha:', error);
        }
    }, [fecha, infantes]);

    useEffect(() => {
        if (infantes.length > 0) {
            cargarTomaFecha();
        }
    }, [infantes, cargarTomaFecha]);

    // Cargar Historial
    const cargarHistorial = useCallback(async () => {
        try {
            const res = await asistenciaService.listar({
                page: histPage + 1,
                limit: histRowsPerPage,
                estado: histFiltroEstado || undefined,
                esPatrocinado: histFiltroPatrocinio !== 'all' ? histFiltroPatrocinio : undefined,
                fechaInicio: histFechaInicio || undefined,
                fechaFin: histFechaFin || undefined,
                search: searchHist || undefined
            });
            setHistorial(res.data || []);
            setTotalHist(res.meta?.total || 0);
            setHistSummary(res.meta?.summary || { Mes: 0, Semana: 0, PagoDia: 0, Pendiente: 0, Punto: 0, Ausente: 0, totalInfantesAtendidos: 0 });
        } catch (error) {
            console.error('Error cargando historial:', error);
        }
    }, [histPage, histRowsPerPage, histFiltroEstado, histFiltroPatrocinio, histFechaInicio, histFechaFin, searchHist]);

    useEffect(() => {
        if (tabIndex === 1) cargarHistorial();
    }, [tabIndex, cargarHistorial]);

    // ── Toma de asistencia ────────────────────────────────────────────────────
    const filteredInfantes = useMemo(() => {
        if (!searchToma) return infantes;
        const s = searchToma.toLowerCase();
        return infantes.filter(i =>
            `${i.persona?.nombres} ${i.persona?.apellidos}`.toLowerCase().includes(s) ||
            i.codigo.toLowerCase().includes(s)
        );
    }, [searchToma, infantes]);

    const infantesPaginados = useMemo(() => {
        return filteredInfantes.slice(tomaPage * tomaRowsPerPage, tomaPage * tomaRowsPerPage + tomaRowsPerPage);
    }, [filteredInfantes, tomaPage, tomaRowsPerPage]);

    const conteo = useMemo(() =>
        Object.values(estados).reduce(
            (acc, e) => { acc[e] = (acc[e] || 0) + 1; return acc; },
            { Mes: 0, Semana: 0, PagoDia: 0, Pendiente: 0, Punto: 0, Ausente: 0 }
        ), [estados]
    );

    const totalInf = infantes.length;
    const presentesHoy = conteo.Mes + conteo.Semana + conteo.PagoDia + conteo.Pendiente + conteo.Punto;
    const porcentajeAsist = totalInf > 0 ? Math.round((presentesHoy / totalInf) * 100) : 0;

    const handleEstado = (infanteId, nuevoEstado) => {
        if (!nuevoEstado) return;
        setEstados(e => ({ ...e, [infanteId]: nuevoEstado }));
    };

    const marcarTodos = (estado) => {
        const updated = {};
        infantes.forEach(i => { updated[i.id] = estado; });
        setEstados(updated);
    };

    const guardar = async () => {
        setSaving(true);
        try {
            const payload = Object.entries(estados).map(([id, st]) => ({
                infanteId: parseInt(id),
                estado: st
            }));
            await asistenciaService.registrarBulk(fecha, payload);
            const fechaStr = new Date(fecha + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' });
            enqueueSnackbar(`Asistencia del ${fechaStr} guardada correctamente`, { variant: 'success' });
            cargarTomaFecha(); // Recargar toma actual
            if (tabIndex === 1) cargarHistorial();
        } catch (error) {
            enqueueSnackbar('Error al guardar asistencia', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // ── Historial ─────────────────────────────────────────────────────────────
    // El filtrado y paginación ahora se confía plenamente al backend
    const histPaginado = historial;

    // Estadísticas del historial global (basadas en el resumen del servidor)
    const histStats = useMemo(() => {
        const { Mes, Semana, PagoDia, Pendiente, Punto, Ausente, totalInfantesAtendidos } = histSummary;
        const p = Mes + Semana + PagoDia + Pendiente + Punto;
        const total = p + Ausente;
        const atendidos = totalInfantesAtendidos || 0;
        
        // Calcular población total según el filtro aplicado
        const totalPoblacion = infantes.filter(i => 
            histFiltroPatrocinio === 'all' || i.esPatrocinado === (histFiltroPatrocinio === 'true')
        ).length;

        return { 
            total, p, a: Ausente, 
            atendidos,
            pctCobertura: totalPoblacion > 0 ? Math.round((atendidos / totalPoblacion) * 100) : 0 
        };
    }, [histSummary, infantes, histFiltroPatrocinio]);

    // ── Estadísticas del Año Lectivo ─────────────────────────────────────────
    const statsDestesMes = useMemo(() => {
        const { start, end } = getSchoolYearRange();
        const registrosAño = historial.filter(r => {
            const f = new Date(r.fecha);
            return f >= start && f <= end;
        });
        const presenciasIds = ['Mes', 'Semana', 'PagoDia', 'Pendiente', 'Punto'];
        const totalPresencias = registrosAño.filter(r => presenciasIds.includes(r.estado)).length;
        const totalAusencias = registrosAño.filter(r => r.estado === 'Ausente').length;
        const infantesConAsistencia = new Set(
            registrosAño.filter(r => presenciasIds.includes(r.estado)).map(r => r.infanteId)
        );
        const diasUnicos = new Set(registrosAño.map(r => r.fecha.split('T')[0])).size;
        return {
            infantesAsistidos: infantesConAsistencia.size,
            totalInfantes: infantes.length,
            pct: infantes.length > 0 ? Math.round((infantesConAsistencia.size / infantes.length) * 100) : 0,
            dias: diasUnicos,
            presencias: totalPresencias,
            ausencias: totalAusencias
        };
    }, [historial, infantes]);

    // ── Exportar Excel (Formato Matriz Avanzada) ──────────────────────────────
    const handleExportar = async () => {
        setExportando(true);
        try {
            // 1. Obtener todos los registros del periodo
            const res = await asistenciaService.listar({
                fechaInicio: exportFechaInicio,
                fechaFin: exportFechaFin,
                limit: 10000 // Aumentar límite para reporte completo
            });
            const registros = res.data || [];

            // 2. Identificar fechas únicas y ordenarlas
            const fechasUnicas = [...new Set(registros.map(r => r.fecha.split('T')[0]))].sort();

            const asistenciaMap = {}; // { infanteId: { fecha: estado } }
            registros.forEach(r => {
                if (!asistenciaMap[r.infanteId]) asistenciaMap[r.infanteId] = {};
                asistenciaMap[r.infanteId][r.fecha.split('T')[0]] = r.estado;
            });

            // 4. Construir filas para Excel
            const headerRow = ['Código', 'Nombres', 'Apellidos'];
            fechasUnicas.forEach(f => {
                headerRow.push(formatDateToDDMMYYYY(f));
            });
            headerRow.push('Total Pres.', '% Asist.');

            const sheetData = [];

            // Filas de Datos
            infantes.forEach(inf => {
                const row = [inf.codigo, inf.persona?.nombres, inf.persona?.apellidos];
                let presencias = 0;
                let diasConRegistro = 0;

                fechasUnicas.forEach(f => {
                    const estado = asistenciaMap[inf.id]?.[f] || '-';
                    const presenciasIds = ['Mes', 'Semana', 'PagoDia', 'Pendiente', 'Punto'];
                    let label = '-';
                    if (estado === 'Mes') label = 'MES';
                    else if (estado === 'Semana') label = 'SEM';
                    else if (estado === 'PagoDia') label = inf.tarifaDiaria || '0.50';
                    else if (estado === 'Pendiente') label = 'P';
                    else if (estado === 'Punto') label = 'S';
                    else if (estado === 'Ausente') label = 'F';

                    row.push(label);
                    if (estado !== '-') diasConRegistro++;
                    if (presenciasIds.includes(estado)) presencias++;
                });

                const pct = diasConRegistro > 0 ? Math.round((presencias / diasConRegistro) * 100) : 0;
                row.push(presencias, `${pct}%`);
                sheetData.push(row);
            });

            // 5. Agregar Estadísticas Globales al inicio
            const statsRows = [
                ['REPORTE DE ASISTENCIA CCO'],
                [`Periodo: ${PERIODOS.find(p => p.value === exportPeriodo)?.label}`],
                [`Fecha de Generación: ${new Date().toLocaleString()}`],
                [],
                [`Total Infantes En el Sistema: ${infantes.length}`],
                [`Promedio Asistencia Grupal: ${statsDestesMes.pct}%`],
                [`Total Diferentes Infantes Atendidos: ${[...new Set(registros.filter(r => ['Mes', 'Semana', 'PagoDia', 'Pendiente', 'Punto'].includes(r.estado)).map(r => r.infanteId))].length}`],
                [],
                headerRow
            ];

            const finalData = [...statsRows, ...sheetData];
            const ws = XLSX.utils.aoa_to_sheet(finalData);

            // Ajustes de diseño básico
            ws['!cols'] = [
                { wch: 12 }, { wch: 25 }, { wch: 25 },
                ...fechasUnicas.map(() => ({ wch: 6 })),
                { wch: 10 }, { wch: 10 }
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Reporte Matriz');

            const periodoLabel = exportPeriodo === 'custom' 
                ? `${formatDateToDDMMYYYY(exportFechaInicio)} - ${formatDateToDDMMYYYY(exportFechaFin)}`
                : (PERIODOS.find(p => p.value === exportPeriodo)?.label || exportPeriodo);
            
            const nombreArchivo = `Reporte_Asistencia_${periodoLabel.replace(/[\/\s]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, nombreArchivo);
            enqueueSnackbar(`Reporte exportado correctamente`, { variant: 'success' });

        } catch (error) {
            console.error('Error export:', error);
            enqueueSnackbar('Error al generar el reporte detallado', { variant: 'error' });
        } finally {
            setExportando(false);
            setExportModal(false);
        }
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
                        <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Historial (${totalHist})`} />
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


                        {/* ── Conteo del día actual + Marcar todos ── */}
                        <Card elevation={0} sx={{ flex: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 3, mb: 3 }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" flexWrap="wrap">
                                    {Object.entries(conteo).map(([estado, cnt]) => (
                                        <Tooltip key={estado} title={`Marcar todos como ${estado}`}>
                                            <Chip
                                                label={`${cnt} ${ESTADO_LABELS[estado]}`}
                                                color={ESTADO_COLORS[estado]}
                                                variant="outlined"
                                                sx={{ fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}
                                                onClick={() => marcarTodos(estado)}
                                            />
                                        </Tooltip>
                                    ))}
                                    <Divider orientation="vertical" flexItem />
                                    <Chip
                                        label={`${porcentajeAsist || 0}% hoy`}
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
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', width: 100 }}>Estatus Pago</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', width: 80 }}>Deuda</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', minWidth: 400 }}>Estado / Pago</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5 }}><CircularProgress size={24} /></TableCell></TableRow>
                                    ) : infantesPaginados.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                                <Typography color="text.secondary">No se encontraron infantes</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : infantesPaginados.map((inf, idx) => {
                                        const estado = estados[inf.id] || 'Ausente';
                                        const actualIdx = (tomaPage * tomaRowsPerPage) + idx;
                                        const accentColor = estado === 'Presente' ? '#4caf50' : estado === 'Ausente' ? '#ef5350' : '#ff9800';
                                        return (
                                            <TableRow key={inf.id} sx={{
                                                borderLeft: `4px solid ${accentColor}`,
                                                transition: 'all 0.15s ease',
                                                bgcolor: alpha(accentColor, 0.03),
                                                '&:hover': { bgcolor: alpha(accentColor, 0.07) },
                                            }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600} color="text.secondary">{actualIdx + 1}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Avatar
                                                            src={inf.fotografia ? getImageUrl(inf.fotografia) : undefined}
                                                            sx={{
                                                                width: 36, height: 36, fontSize: '0.78rem', fontWeight: 700,
                                                                bgcolor: AVATAR_COLORS[inf.id % AVATAR_COLORS.length],
                                                            }}
                                                        >
                                                            {getInitials(inf)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                {inf.persona?.nombres} {inf.persona?.apellidos}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                                                    Cod: {inf.codigo} • Tarifa: ${inf.tarifaDiaria}
                                                                </Typography>
                                                                <Tooltip title="Editar datos/tarifa">
                                                                    <IconButton size="small" onClick={() => navigate(`/infantes/${inf.id}/editar`)} sx={{ p: 0.2 }}>
                                                                        <EditIcon sx={{ fontSize: 14 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={0.5}>
                                                        {inf.pagoMesActivo && <Chip label="MES" size="small" color="success" sx={{ fontSize: '0.65rem', fontWeight: 900, height: 20 }} />}
                                                        {inf.pagoSemanaActivo && <Chip label="SEM" size="small" color="primary" sx={{ fontSize: '0.65rem', fontWeight: 900, height: 20 }} />}
                                                        {!inf.pagoMesActivo && !inf.pagoSemanaActivo && <Typography variant="caption" color="text.disabled">Pendiente</Typography>}
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={800} color={inf.deudaTotal > 0 ? 'error.main' : 'success.main'}>
                                                        ${inf.deudaTotal?.toFixed(2) || '0.00'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <ToggleButtonGroup
                                                        value={estado} exclusive size="small"
                                                        onChange={(_, val) => handleEstado(inf.id, val)}
                                                        sx={{ '& .MuiToggleButton-root': { px: 1.2, py: 0.5, fontSize: '0.7rem', fontWeight: 800 } }}
                                                    >
                                                        <ToggleButton value="Mes" color="success">MES</ToggleButton>
                                                        <ToggleButton value="Semana" color="primary">SEM</ToggleButton>
                                                        <ToggleButton value="PagoDia" color="info">${inf.tarifaDiaria || '0.50'}</ToggleButton>
                                                        <ToggleButton value="Pendiente" color="error">P</ToggleButton>
                                                        <ToggleButton value="Punto" color="secondary">S</ToggleButton>
                                                        <ToggleButton value="Ausente">F</ToggleButton>
                                                    </ToggleButtonGroup>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            <TablePagination
                                component="div" count={filteredInfantes.length}
                                page={tomaPage} onPageChange={(_, p) => setTomaPage(p)}
                                rowsPerPage={tomaRowsPerPage}
                                onRowsPerPageChange={e => { setTomaRowsPerPage(parseInt(e.target.value, 10)); setTomaPage(0); }}
                                rowsPerPageOptions={[25, 50, 100]}
                                labelRowsPerPage="Mostrando:"
                                labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                                sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
                            />
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
                                { label: 'Infantes Atendidos', value: histStats.atendidos, icon: <span>🧒</span>, color: CCO.naranja },
                                { label: 'Presentes (Total)', value: histStats.p, icon: <span>🥗</span>, color: '#4caf50' },
                                { label: 'Ausentes (Total)', value: histStats.a, icon: <span>❌</span>, color: '#ef5350' },
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
                                    <Typography variant="subtitle2" fontWeight={700}>Cobertura de Atención (Infantes Atendidos / Total Población)</Typography>
                                    <Chip label={`${histStats.pctCobertura}%`} size="small"
                                        color={histStats.pctCobertura >= 80 ? 'success' : histStats.pctCobertura >= 40 ? 'warning' : 'info'}
                                        sx={{ fontWeight: 700 }} />
                                </Box>
                                <LinearProgress variant="determinate" value={histStats.pctCobertura}
                                    sx={{
                                        height: 10, borderRadius: 5,
                                        bgcolor: alpha('#000', 0.08),
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 5,
                                            bgcolor: histStats.pctCobertura >= 80 ? '#4caf50' : histStats.pctCobertura >= 40 ? '#ff9800' : '#4169E1',
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
                            <TextField
                                type="date" size="small" label="Desde" value={histFechaInicio}
                                onChange={e => { setHistFechaInicio(e.target.value); setHistPage(0); }}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                            <TextField
                                type="date" size="small" label="Hasta" value={histFechaFin}
                                onChange={e => { setHistFechaFin(e.target.value); setHistPage(0); }}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                            <TextField select size="small" label="Población" value={histFiltroPatrocinio}
                                onChange={e => { setHistFiltroPatrocinio(e.target.value); setHistPage(0); }}
                                sx={{ minWidth: 160 }}>
                                <MenuItem value="all">Todos los Niños</MenuItem>
                                <MenuItem value="true">Solo Patrocinados</MenuItem>
                                <MenuItem value="false">No Patrocinados</MenuItem>
                            </TextField>
                            <TextField select size="small" label="Estado" value={histFiltroEstado}
                                onChange={e => { setHistFiltroEstado(e.target.value); setHistPage(0); }}
                                sx={{ minWidth: 160 }}>
                                <MenuItem value="Mes">Mes (Pago completo)</MenuItem>
                                <MenuItem value="Semana">Semana</MenuItem>
                                <MenuItem value="PagoDia">Pago Diario</MenuItem>
                                <MenuItem value="Pendiente">Deuda (P)</MenuItem>
                                <MenuItem value="Punto">Seguimiento (S)</MenuItem>
                                <MenuItem value="Ausente">Falta (F)</MenuItem>
                            </TextField>
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
                                    {historial.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                                <Typography color="text.secondary">No se encontraron registros</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : historial.map(r => (
                                        <TableRow key={r.id} hover sx={{ cursor: 'pointer' }}
                                            onClick={() => navigate(`/infantes/${r.infanteId}`)}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                                                    {new Date(r.fecha.split('T')[0] + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Avatar
                                                    src={r.infante?.fotografia ? `http://localhost:3000${r.infante.fotografia}` : undefined}
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
                                                    {r.infante?.persona?.nombres} {r.infante?.persona?.apellidos}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={r.infante?.codigo} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={ESTADO_DISPLAY[r.estado] || r.estado}
                                                    size="small"
                                                    color={ESTADO_COLORS[r.estado]}
                                                    variant="outlined"
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <TablePagination
                                component="div" count={totalHist}
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
                        Selecciona el período o rango de fechas que deseas exportar.
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth type="date" size="small" label="Desde"
                                value={exportFechaInicio}
                                onChange={(e) => {
                                    setExportFechaInicio(e.target.value);
                                    setExportPeriodo('custom');
                                }}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth type="date" size="small" label="Hasta"
                                value={exportFechaFin}
                                onChange={(e) => {
                                    setExportFechaFin(e.target.value);
                                    setExportPeriodo('custom');
                                }}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Grid>
                    </Grid>

                    <Stack spacing={1} direction="row" flexWrap="wrap" sx={{ mb: 2 }}>
                        {PERIODOS.filter(p => p.value !== 'custom').map(p => (
                            <Chip
                                key={p.value}
                                label={p.label}
                                onClick={() => {
                                    setExportPeriodo(p.value);
                                    const now = new Date();
                                    const schoolYear = getSchoolYearRange();
                                    if (p.value === 'semana') {
                                        const range = getISOWeekRange(now);
                                        setExportFechaInicio(range.start);
                                        setExportFechaFin(range.end);
                                    } else if (p.value === 'mes') {
                                        const range = getMonthRange(now);
                                        setExportFechaInicio(range.start);
                                        setExportFechaFin(range.end);
                                    } else if (p.value === 'trimestre') {
                                        const range = getQuarterRange(now);
                                        setExportFechaInicio(range.start);
                                        setExportFechaFin(range.end);
                                    } else if (p.value === 'semestre') {
                                        const quarter = Math.floor(now.getMonth() / 6);
                                        const start = new Date(now.getFullYear(), quarter * 6, 1);
                                        const end = new Date(now.getFullYear(), (quarter + 1) * 6, 0);
                                        setExportFechaInicio(start.toISOString().split('T')[0]);
                                        setExportFechaFin(end.toISOString().split('T')[0]);
                                    } else if (p.value === 'anual') {
                                        setExportFechaInicio(schoolYear.start.toISOString().split('T')[0]);
                                        setExportFechaFin(schoolYear.end.toISOString().split('T')[0]);
                                    }
                                }}
                                color={exportPeriodo === p.value ? 'success' : 'default'}
                                variant={exportPeriodo === p.value ? 'filled' : 'outlined'}
                                sx={{ fontWeight: 600, mb: 1 }}
                            />
                        ))}
                    </Stack>
                    
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#2e7d32', 0.05) }}>
                        <Typography variant="caption" color="text.secondary">
                            📄 Se generará un reporte en formato <strong>Matriz</strong> (Días vs Infantes) para el rango seleccionado.
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
