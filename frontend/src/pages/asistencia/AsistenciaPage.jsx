import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Card, CardContent, Button, Chip, ToggleButton,
    ToggleButtonGroup, Grid, TextField, Stack, Avatar,
    Paper, Tooltip, alpha, useTheme, IconButton, InputAdornment,
    Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow,
    TablePagination, LinearProgress, Divider, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions,
    MenuItem, Popover, TableContainer,
} from '@mui/material';
import {
    Save as SaveIcon, ChecklistRtl as AsistenciaIcon,
    Search as SearchIcon, History as HistoryIcon,
    Today as TodayIcon, BarChart as ChartIcon,
    FileDownload as ExportIcon, Close as CloseIcon,
    Group as GroupIcon, CheckCircle as CheckIcon,
    Cancel as CancelIcon, WatchLater as PendingIcon,
    Payment as PaymentIcon, Edit as EditIcon,
    DeleteForever as DeleteFechaIcon,
} from '@mui/icons-material';
import ConfirmDialog from '../../components/common/ConfirmDialog';
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
    const { user, getImageUrl } = useAuth();
    const isDark = theme.palette.mode === 'dark';
    // Roles que pueden editar/eliminar registros en el historial
    const canGestionar = ['admin', 'director', 'tutor_especial'].includes(user?.rol);

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

    // Edición inline en pivot
    const [editPopover, setEditPopover] = useState({ open: false, anchorEl: null, infanteId: null, fecha: null, estadoActual: null });
    const [savingCell, setSavingCell] = useState(false);

    // Eliminar fecha completa
    const [confirmFecha, setConfirmFecha] = useState({ open: false, fecha: null, count: 0 });
    
    // Pago de deuda state
    const [pagoInfante, setPagoInfante] = useState(null);
    const [openPagoDialog, setOpenPagoDialog] = useState(false);
    const [procesandoPago, setProcesandoPago] = useState(false);

    // Historial - Filtros de rango
    const [histFechaInicio, setHistFechaInicio] = useState(getMonthRange().start);
    const [histFechaFin, setHistFechaFin] = useState(hoy);
    const [histFiltroPatrocinio, setHistFiltroPatrocinio] = useState('all');


    // Historial state
    const [histFiltroEstado, setHistFiltroEstado] = useState('');

    // Toma de asistencia pagination
    const [tomaPage, setTomaPage] = useState(0);
    const [tomaRowsPerPage, setTomaRowsPerPage] = useState(25);

    // Cargar Infantes dinámicamente según la fecha para actualizar badges de pago
    const cargarDatosInfantes = useCallback(async () => {
        setLoading(true);
        try {
            const res = await infanteService.listar({ limit: 1000, referencia: fecha, tipoPrograma: 'Comedor' });
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
                limit: 5000,
                estado: histFiltroEstado || undefined,
                esPatrocinado: histFiltroPatrocinio !== 'all' ? histFiltroPatrocinio : undefined,
                fechaInicio: histFechaInicio || undefined,
                fechaFin: histFechaFin || undefined,
                tipoPrograma: 'Comedor',
            });
            setHistorial(res.data || []);
            setTotalHist(res.meta?.total || 0);
            setHistSummary(res.meta?.summary || { Mes: 0, Semana: 0, PagoDia: 0, Pendiente: 0, Punto: 0, Ausente: 0, totalInfantesAtendidos: 0 });
        } catch (error) {
            console.error('Error cargando historial:', error);
        }
    }, [histFiltroEstado, histFiltroPatrocinio, histFechaInicio, histFechaFin]);

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

    const handleConfirmarPago = async () => {
        if (!pagoInfante) return;
        setProcesandoPago(true);
        try {
            await asistenciaService.pagarDeuda(pagoInfante.id);
            enqueueSnackbar(`Pago de deuda de ${pagoInfante.persona?.nombres} realizado con éxito`, { variant: 'success' });
            cargarDatosInfantes(); // Recargar para ver deuda en $0
            if (tabIndex === 1) cargarHistorial();
        } catch (error) {
            enqueueSnackbar('Error al procesar el pago', { variant: 'error' });
        } finally {
            setProcesandoPago(false);
            setOpenPagoDialog(false);
            setPagoInfante(null);
        }
    };

    // ── Eliminar fecha completa ────────────────────────────────────────────────
    const handleEliminarFecha = async () => {
        const fecha = confirmFecha.fecha;
        setConfirmFecha({ open: false, fecha: null, count: 0 });
        try {
            const res = await asistenciaService.eliminarFecha(fecha);
            enqueueSnackbar(res.data?.mensaje || `Registros del ${fecha} eliminados`, { variant: 'success' });
            cargarHistorial();
        } catch {
            enqueueSnackbar('Error al eliminar los registros de esa fecha', { variant: 'error' });
        }
    };

    // ── Edición inline de celda pivot ─────────────────────────────────────────
    const handleEditCell = async (nuevoEstado) => {
        const { infanteId, fecha, estadoActual } = editPopover;
        if (nuevoEstado === estadoActual) { setEditPopover(p => ({ ...p, open: false })); return; }
        setEditPopover(p => ({ ...p, open: false }));
        setSavingCell(true);
        // Actualización optimista
        setHistorial(prev => prev.map(r =>
            r.infanteId === infanteId && r.fecha.split('T')[0] === fecha
                ? { ...r, estado: nuevoEstado }
                : r
        ));
        try {
            await asistenciaService.actualizarRegistro(infanteId, fecha, nuevoEstado);
            enqueueSnackbar('Registro actualizado', { variant: 'success', autoHideDuration: 1500 });
        } catch {
            enqueueSnackbar('Error al actualizar el registro', { variant: 'error' });
            cargarHistorial(); // Revertir
        } finally {
            setSavingCell(false);
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
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'space-between', 
                    alignItems: { xs: 'stretch', md: 'flex-start' }, 
                    mb: 4, 
                    gap: 2 
                }}>
                    <Box>
                        <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
                            <AsistenciaIcon sx={{ fontSize: { xs: 28, md: 32 }, color: isDark ? CCO.naranja : CCO.violeta }} />
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
                            borderRadius: 3, px: 2.5, py: 1.2, fontWeight: 700,
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
                    mt: { xs: 1, md: 2.5 }, mb: 3, bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.01),
                }}>
                    <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="fullWidth"
                        sx={{
                            '& .MuiTabs-indicator': {
                                height: 3, borderRadius: '3px 3px 0 0',
                                background: `linear-gradient(90deg, ${CCO.naranja}, ${CCO.violeta})`,
                            },
                            '& .MuiTab-root': { 
                                fontWeight: 700, 
                                textTransform: 'none', 
                                py: 1.8,
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                minWidth: { xs: 80, sm: 160 }
                            },
                        }}>
                        <Tab icon={<TodayIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Toma" />
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
                            <TableContainer sx={{ maxHeight: 600 }}>
                            <Table size="small" stickyHeader>
                                <TableHead sx={{ display: { xs: 'none', md: 'table-header-group' } }}>
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
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <Typography variant="body2" fontWeight={800} color={inf.deudaTotal > 0 ? 'error.main' : 'success.main'}>
                                                            ${inf.deudaTotal?.toFixed(2) || '0.00'}
                                                        </Typography>
                                                        {inf.deudaTotal > 0 && (
                                                            <Tooltip title="Pagar deuda total">
                                                                <IconButton 
                                                                    size="small" 
                                                                    color="primary" 
                                                                    onClick={() => { setPagoInfante(inf); setOpenPagoDialog(true); }}
                                                                    sx={{ p: 0.5, bgcolor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}
                                                                >
                                                                    <PaymentIcon sx={{ fontSize: 16 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Stack>
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
                            </TableContainer>
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
                {tabIndex === 1 && (() => {
                    // ── Construir pivot en frontend ──────────────────────────────
                    // 1. Fechas únicas ordenadas (columnas)
                    const fechasUnicas = [...new Set(historial.map(r => r.fecha.split('T')[0]))].sort();

                    // 2. Mapa: infanteId → { info, map: { fecha→estado } }
                    const infanteMap = {};
                    historial.forEach(r => {
                        const id = r.infanteId;
                        if (!infanteMap[id]) {
                            infanteMap[id] = { id, info: r.infante, registros: {} };
                        }
                        infanteMap[id].registros[r.fecha.split('T')[0]] = r.estado;
                    });

                    // 3. Lista de infantes filtrada por búsqueda
                    const PRESENCIAS = ['Mes', 'Semana', 'PagoDia', 'Pendiente', 'Punto'];
                    const busqLow = searchHist.toLowerCase();
                    let filas = Object.values(infanteMap);
                    if (busqLow) {
                        filas = filas.filter(f => {
                            const nombre = `${f.info?.persona?.nombres || ''} ${f.info?.persona?.apellidos || ''}`.toLowerCase();
                            const codigo = (f.info?.codigo || '').toLowerCase();
                            return nombre.includes(busqLow) || codigo.includes(busqLow);
                        });
                    }
                    if (histFiltroEstado) {
                        filas = filas.filter(f => Object.values(f.registros).includes(histFiltroEstado));
                    }
                    filas.sort((a, b) => {
                        const na = `${a.info?.persona?.apellidos || ''} ${a.info?.persona?.nombres || ''}`;
                        const nb = `${b.info?.persona?.apellidos || ''} ${b.info?.persona?.nombres || ''}`;
                        return na.localeCompare(nb);
                    });

                    // Colores de celda por estado
                    const CELL_COLORS = {
                        Mes:      { bg: '#e8f5e9', color: '#2e7d32', label: 'MES' },
                        Semana:   { bg: '#e3f2fd', color: '#1565c0', label: 'SEM' },
                        PagoDia:  { bg: '#e1f5fe', color: '#0277bd', label: '$' },
                        Pendiente:{ bg: '#fce4ec', color: '#c62828', label: 'P' },
                        Punto:    { bg: '#f3e5f5', color: '#6a1b9a', label: 'S' },
                        Ausente:  { bg: '#f5f5f5', color: '#9e9e9e', label: 'F' },
                    };

                    const fmtCol = (dateStr) => {
                        const d = new Date(dateStr + 'T12:00:00');
                        return {
                            dia: d.toLocaleDateString('es-EC', { day: '2-digit' }),
                            mes: d.toLocaleDateString('es-EC', { month: 'short' }),
                            dow: d.toLocaleDateString('es-EC', { weekday: 'short' }),
                        };
                    };

                    return (
                        <Box>
                            {/* Stats cards */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                {[
                                    { label: 'Días con registro', value: fechasUnicas.length, color: CCO.azul },
                                    { label: 'Infantes atendidos', value: filas.length, color: CCO.naranja },
                                    { label: 'Presentes (total)', value: histStats.p, color: '#4caf50' },
                                    { label: 'Ausentes (total)', value: histStats.a, color: '#ef5350' },
                                ].map(stat => (
                                    <Grid item xs={6} md={3} key={stat.label}>
                                        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, bgcolor: alpha(stat.color, 0.04) }}>
                                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, textAlign: 'center' }}>
                                                <Typography variant="h4" fontWeight={800} sx={{ color: stat.color }}>{stat.value}</Typography>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>{stat.label}</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>

                            {/* Barra de cobertura */}
                            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, mb: 3 }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="subtitle2" fontWeight={700}>Cobertura de Atención</Typography>
                                        <Chip label={`${histStats.pctCobertura}%`} size="small"
                                            color={histStats.pctCobertura >= 80 ? 'success' : histStats.pctCobertura >= 40 ? 'warning' : 'info'}
                                            sx={{ fontWeight: 700 }} />
                                    </Box>
                                    <LinearProgress variant="determinate" value={histStats.pctCobertura}
                                        sx={{ height: 10, borderRadius: 5, bgcolor: alpha('#000', 0.08),
                                            '& .MuiLinearProgress-bar': { borderRadius: 5,
                                                bgcolor: histStats.pctCobertura >= 80 ? '#4caf50' : histStats.pctCobertura >= 40 ? '#ff9800' : '#4169E1' } }} />
                                </CardContent>
                            </Card>

                            {/* Leyenda */}
                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                                {Object.entries(CELL_COLORS).map(([k, v]) => (
                                    <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box sx={{ width: 18, height: 18, borderRadius: 1, bgcolor: v.bg, border: `1px solid ${v.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 900, color: v.color }}>{v.label}</Typography>
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">{ESTADO_DISPLAY[k]}</Typography>
                                    </Box>
                                ))}
                            </Stack>

                            {/* Filtros */}
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                                <TextField
                                    size="small" placeholder="Buscar infante por nombre o código..."
                                    value={searchHist} onChange={e => setSearchHist(e.target.value)}
                                    sx={{ flex: 1, minWidth: 200 }}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                                />
                                <TextField type="date" size="small" label="Desde" value={histFechaInicio}
                                    onChange={e => setHistFechaInicio(e.target.value)}
                                    slotProps={{ inputLabel: { shrink: true } }} />
                                <TextField type="date" size="small" label="Hasta" value={histFechaFin}
                                    onChange={e => setHistFechaFin(e.target.value)}
                                    slotProps={{ inputLabel: { shrink: true } }} />
                                <TextField select size="small" label="Población" value={histFiltroPatrocinio}
                                    onChange={e => setHistFiltroPatrocinio(e.target.value)} sx={{ minWidth: 160 }}>
                                    <MenuItem value="all">Todos los Niños</MenuItem>
                                    <MenuItem value="true">Solo Patrocinados</MenuItem>
                                    <MenuItem value="false">No Patrocinados</MenuItem>
                                </TextField>
                                <TextField select size="small" label="Estado" value={histFiltroEstado}
                                    onChange={e => setHistFiltroEstado(e.target.value)} sx={{ minWidth: 145 }}>
                                    <MenuItem value="">Todos</MenuItem>
                                    <MenuItem value="Mes">Mes</MenuItem>
                                    <MenuItem value="Semana">Semana</MenuItem>
                                    <MenuItem value="PagoDia">Pago Diario</MenuItem>
                                    <MenuItem value="Pendiente">Deuda (P)</MenuItem>
                                    <MenuItem value="Punto">Seguimiento (S)</MenuItem>
                                    <MenuItem value="Ausente">Falta (F)</MenuItem>
                                </TextField>
                            </Stack>

                            {/* ── TABLA PIVOT ─────────────────────────────── */}
                            <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
                                {fechasUnicas.length === 0 ? (
                                    <Box sx={{ py: 6, textAlign: 'center' }}>
                                        <Typography color="text.secondary">No hay registros en el rango seleccionado</Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ overflowX: 'auto' }}>
                                        <Table size="small" sx={{ tableLayout: 'fixed', minWidth: 300 + fechasUnicas.length * 56 }}>
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.03) }}>
                                                    {/* Columna fija: infante */}
                                                    <TableCell sx={{
                                                        fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase',
                                                        width: 200, minWidth: 200, position: 'sticky', left: 0, zIndex: 3,
                                                        bgcolor: isDark ? '#1a1f36' : '#fafafa',
                                                        borderRight: `2px solid ${theme.palette.divider}`,
                                                    }}>Infante</TableCell>
                                                    <TableCell sx={{
                                                        fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase',
                                                        width: 80, minWidth: 80, position: 'sticky', left: 200, zIndex: 3,
                                                        bgcolor: isDark ? '#1a1f36' : '#fafafa',
                                                        borderRight: `2px solid ${theme.palette.divider}`,
                                                    }}>Código</TableCell>
                                                    {/* Columnas de fechas */}
                                                    {fechasUnicas.map(f => {
                                                        const { dia, mes, dow } = fmtCol(f);
                                                        // Contar registros de esa fecha para el confirm
                                                        const cntFecha = historial.filter(r => r.fecha.split('T')[0] === f).length;
                                                        return (
                                                            <TableCell key={f} align="center" sx={{
                                                                width: 56, minWidth: 56, p: '4px 2px',
                                                                fontWeight: 700, fontSize: '0.65rem',
                                                                borderRight: `1px solid ${theme.palette.divider}`,
                                                                '&:hover .del-btn': canGestionar ? { opacity: 1 } : {},
                                                            }}>
                                                                <Box sx={{ textTransform: 'capitalize', color: 'text.secondary', lineHeight: 1.2 }}>
                                                                    <span style={{ display: 'block', fontSize: '0.6rem' }}>{dow}</span>
                                                                    <span style={{ display: 'block', fontWeight: 900, fontSize: '0.85rem', color: theme.palette.text.primary }}>{dia}</span>
                                                                    <span style={{ display: 'block', fontSize: '0.6rem' }}>{mes}</span>
                                                                </Box>
                                                                {canGestionar && (
                                                                    <Tooltip title={`Eliminar todos los registros del ${dia}/${mes}`} arrow>
                                                                        <IconButton
                                                                            className="del-btn"
                                                                            size="small"
                                                                            onClick={e => { e.stopPropagation(); setConfirmFecha({ open: true, fecha: f, count: cntFecha }); }}
                                                                            sx={{ p: 0.2, opacity: 0, transition: 'opacity 0.2s', color: 'error.main', '&:hover': { bgcolor: alpha('#ef5350', 0.1) } }}
                                                                        >
                                                                            <DeleteFechaIcon sx={{ fontSize: 13 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}
                                                            </TableCell>
                                                        );
                                                    })}
                                                    {/* Totales */}
                                                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', width: 60, minWidth: 60, borderLeft: `2px solid ${theme.palette.divider}` }}>Pres.</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', width: 55, minWidth: 55 }}>%</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filas.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={fechasUnicas.length + 4} align="center" sx={{ py: 4 }}>
                                                            <Typography color="text.secondary">No se encontraron infantes</Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : filas.map((fila, rowIdx) => {
                                                    const nombre = `${fila.info?.persona?.nombres || ''} ${fila.info?.persona?.apellidos || ''}`;
                                                    let presencias = 0;
                                                    let totalDias = fechasUnicas.length;
                                                    fechasUnicas.forEach(f => {
                                                        const est = fila.registros[f];
                                                        if (PRESENCIAS.includes(est)) presencias++;
                                                    });
                                                    const pct = totalDias > 0 ? Math.round((presencias / totalDias) * 100) : 0;
                                                    const rowBg = rowIdx % 2 === 0
                                                        ? 'transparent'
                                                        : isDark ? alpha('#fff', 0.02) : alpha('#000', 0.015);
                                                    return (
                                                        <TableRow key={fila.id} hover
                                                            onClick={() => !canGestionar && navigate(`/infantes/${fila.id}`)}
                                                            sx={{ cursor: canGestionar ? 'default' : 'pointer', bgcolor: rowBg, '&:hover': { bgcolor: alpha(CCO.azul, 0.04) } }}>
                                                            {/* Nombre - sticky (siempre navega al perfil) */}
                                                            <TableCell
                                                                onClick={() => navigate(`/infantes/${fila.id}`)}
                                                                sx={{
                                                                    position: 'sticky', left: 0, zIndex: 2,
                                                                    bgcolor: isDark ? '#12172a' : '#fff',
                                                                    borderRight: `2px solid ${theme.palette.divider}`,
                                                                    py: 0.8, cursor: 'pointer',
                                                                }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Avatar
                                                                        src={fila.info?.fotografia ? getImageUrl(fila.info.fotografia) : undefined}
                                                                        sx={{ width: 28, height: 28, fontSize: '0.65rem', fontWeight: 700, bgcolor: AVATAR_COLORS[fila.id % AVATAR_COLORS.length] }}
                                                                    >
                                                                        {`${fila.info?.persona?.nombres?.charAt(0) || ''}${fila.info?.persona?.apellidos?.charAt(0) || ''}`}
                                                                    </Avatar>
                                                                    <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.8rem', maxWidth: 155 }}>
                                                                        {nombre}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                            {/* Código - sticky */}
                                                            <TableCell sx={{
                                                                position: 'sticky', left: 200, zIndex: 2,
                                                                bgcolor: isDark ? '#12172a' : '#fff',
                                                                borderRight: `2px solid ${theme.palette.divider}`,
                                                                py: 0.8,
                                                            }}>
                                                                <Chip label={fila.info?.codigo || '—'} size="small"
                                                                    variant="outlined" sx={{ fontWeight: 600, fontSize: '0.68rem', height: 20 }} />
                                                            </TableCell>
                                                            {/* Celdas de estado por fecha — clickeables si canGestionar */}
                                                            {fechasUnicas.map(f => {
                                                                const est = fila.registros[f];
                                                                const cfg = est ? CELL_COLORS[est] : null;
                                                                return (
                                                                    <TableCell key={f} align="center"
                                                                        onClick={canGestionar ? (e) => {
                                                                            e.stopPropagation();
                                                                            setEditPopover({ open: true, anchorEl: e.currentTarget, infanteId: fila.id, fecha: f, estadoActual: est || null });
                                                                        } : undefined}
                                                                        sx={{
                                                                            p: '3px 2px',
                                                                            borderRight: `1px solid ${theme.palette.divider}`,
                                                                            bgcolor: cfg ? alpha(cfg.bg, 0.9) : 'transparent',
                                                                            cursor: canGestionar ? 'pointer' : 'default',
                                                                            '&:hover': canGestionar ? { filter: 'brightness(0.9)', outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: '-2px' } : {},
                                                                        }}>
                                                                        {cfg ? (
                                                                            <Tooltip title={canGestionar ? `Editar: ${ESTADO_DISPLAY[est]}` : (ESTADO_DISPLAY[est] || est)} arrow>
                                                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 900, color: cfg.color, lineHeight: 1 }}>
                                                                                    {cfg.label === '$' ? `$${fila.info?.tarifaDiaria || ''}` : cfg.label}
                                                                                </Typography>
                                                                            </Tooltip>
                                                                        ) : (
                                                                            <Typography sx={{ fontSize: '0.65rem', color: canGestionar ? alpha(theme.palette.primary.main, 0.5) : 'text.disabled' }}>
                                                                                {canGestionar ? '+' : '—'}
                                                                            </Typography>
                                                                        )}
                                                                    </TableCell>
                                                                );
                                                            })}
                                                            {/* Total presencias */}
                                                            <TableCell align="center" sx={{ borderLeft: `2px solid ${theme.palette.divider}`, py: 0.8 }}>
                                                                <Typography variant="body2" fontWeight={800} sx={{ color: presencias > 0 ? '#2e7d32' : 'text.disabled' }}>
                                                                    {presencias}
                                                                </Typography>
                                                            </TableCell>
                                                            {/* % asistencia */}
                                                            <TableCell align="center" sx={{ py: 0.8 }}>
                                                                <Chip
                                                                    label={`${pct}%`}
                                                                    size="small"
                                                                    sx={{
                                                                        height: 20, fontSize: '0.65rem', fontWeight: 800,
                                                                        bgcolor: alpha(pct >= 70 ? '#4caf50' : pct >= 40 ? '#ff9800' : '#ef5350', 0.12),
                                                                        color: pct >= 70 ? '#2e7d32' : pct >= 40 ? '#e65100' : '#c62828',
                                                                    }}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </Box>
                                )}
                                {/* Footer con total de infantes */}
                                <Box sx={{ px: 2, py: 1, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {filas.length} infante{filas.length !== 1 ? 's' : ''} · {fechasUnicas.length} día{fechasUnicas.length !== 1 ? 's' : ''} con registro
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {canGestionar ? 'Clic en celda para editar · hover en fecha para eliminar' : 'Clic en nombre para ver perfil'}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Box>
                    );
                })()}
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

            {/* ── Modal de Confirmación de Pago ── */}
            <Dialog open={openPagoDialog} onClose={() => !procesandoPago && setOpenPagoDialog(false)} PaperProps={{ sx: { borderRadius: 4, maxWidth: 400 } }}>
                <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Confirmar Pago de Deuda</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        ¿Confirmas que el infante <strong>{pagoInfante?.persona?.nombres} {pagoInfante?.persona?.apellidos}</strong> ha cancelado el total de su deuda pendiente?
                    </Typography>
                    <Box sx={{ p: 2, bgcolor: alpha(theme.palette.error.main, 0.05), borderRadius: 3, border: `1px dashed ${theme.palette.error.main}`, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>MONTO TOTAL A CANCELAR</Typography>
                        <Typography variant="h4" fontWeight={900} color="error.main">
                            ${pagoInfante?.deudaTotal?.toFixed(2)}
                        </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, fontStyle: 'italic' }}>
                        Esta acción marcará todas sus asistencias pendientes como "Pagado".
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0 }}>
                    <Button onClick={() => setOpenPagoDialog(false)} disabled={procesandoPago} sx={{ fontWeight: 700, textTransform: 'none' }}>Cancelar</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleConfirmarPago} 
                        disabled={procesandoPago}
                        startIcon={procesandoPago ? <CircularProgress size={18} color="inherit" /> : <CheckIcon />}
                        sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none', px: 3 }}
                    >
                        Confirmar Pago
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Popover de edición inline ──────────────────────────── */}
            <Popover
                open={editPopover.open}
                anchorEl={editPopover.anchorEl}
                onClose={() => setEditPopover(p => ({ ...p, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{ sx: { borderRadius: 3, p: 1.5, boxShadow: 6, minWidth: 220 } }}
            >
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 1, px: 0.5 }}>
                    Cambiar estado
                </Typography>
                <Stack direction="row" flexWrap="wrap" spacing={0.8} sx={{ maxWidth: 230 }}>
                    {[
                        { key: 'Mes', label: 'MES', color: '#2e7d32', bg: '#e8f5e9' },
                        { key: 'Semana', label: 'SEM', color: '#1565c0', bg: '#e3f2fd' },
                        { key: 'PagoDia', label: 'PAGO', color: '#0277bd', bg: '#e1f5fe' },
                        { key: 'Pendiente', label: 'DEUDA', color: '#c62828', bg: '#fce4ec' },
                        { key: 'Punto', label: 'SEGUIM.', color: '#6a1b9a', bg: '#f3e5f5' },
                        { key: 'Ausente', label: 'FALTA', color: '#616161', bg: '#f5f5f5' },
                    ].map(opt => (
                        <Button
                            key={opt.key}
                            size="small"
                            disabled={savingCell}
                            onClick={() => handleEditCell(opt.key)}
                            sx={{
                                minWidth: 0, px: 1.2, py: 0.5, fontSize: '0.72rem', fontWeight: 900,
                                bgcolor: editPopover.estadoActual === opt.key ? opt.bg : 'transparent',
                                color: opt.color,
                                border: `2px solid ${editPopover.estadoActual === opt.key ? opt.color : 'transparent'}`,
                                borderRadius: 2,
                                '&:hover': { bgcolor: opt.bg, border: `2px solid ${opt.color}` },
                                mb: 0.5,
                            }}
                        >
                            {opt.label}
                        </Button>
                    ))}
                </Stack>
                {savingCell && <LinearProgress sx={{ mt: 1, borderRadius: 2 }} />}
            </Popover>

            {/* ── ConfirmDialog eliminar fecha ───────────────────────── */}
            <ConfirmDialog
                open={confirmFecha.open}
                onClose={() => setConfirmFecha({ open: false, fecha: null, count: 0 })}
                onConfirm={handleEliminarFecha}
                title="Eliminar registros de fecha"
                message={`¿Estás seguro de que deseas eliminar todos los registros del ${confirmFecha.fecha ? new Date(confirmFecha.fecha + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}? Se eliminarán ${confirmFecha.count} registro(s). Esta acción no se puede deshacer.`}
                confirmLabel="Sí, eliminar todo"
                severity="error"
            />
        </MainLayout>
    );
};

export default AsistenciaPage;
