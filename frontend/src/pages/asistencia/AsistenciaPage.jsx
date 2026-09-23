import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Card, CardContent, Button, Chip, ToggleButton,
    ToggleButtonGroup, Grid, TextField, Stack, Avatar,
    Paper, Tooltip, alpha, useTheme, IconButton, InputAdornment,
    Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow,
    TablePagination, LinearProgress, Divider, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions,
    MenuItem, Popover, TableContainer, Radio, RadioGroup, FormControlLabel,
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
    AccountBalanceWallet as WalletIcon,
    AttachMoney as MoneyIcon,
    PriceCheck as PriceCheckIcon,
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
    const [montosPagados, setMontosPagados] = useState({});
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [exportando, setExportando] = useState(false);
    const [exportModal, setExportModal] = useState(false);
    const [exportPeriodo, setExportPeriodo] = useState('mes');
    const [exportFechaInicio, setExportFechaInicio] = useState(getMonthRange().start);
    const [exportFechaFin, setExportFechaFin] = useState(hoy);

    // Filtro de programa en toma de asistencia ('all' por defecto para incluir al 100% de infantes)
    const [filtroProgramaToma, setFiltroProgramaToma] = useState('all');

    // Modal de Abono / Pago Parcial Diario
    const [abonoDialog, setAbonoDialog] = useState({ open: false, infante: null, monto: '0.25' });

    // Edición inline en pivot
    const [editPopover, setEditPopover] = useState({ open: false, anchorEl: null, infanteId: null, fecha: null, estadoActual: null });
    const [savingCell, setSavingCell] = useState(false);

    // Eliminar fecha completa
    const [confirmFecha, setConfirmFecha] = useState({ open: false, fecha: null, count: 0 });
    
    // Pago de deuda state (soporta pago total y abono parcial)
    const [pagoInfante, setPagoInfante] = useState(null);
    const [openPagoDialog, setOpenPagoDialog] = useState(false);
    const [procesandoPago, setProcesandoPago] = useState(false);
    const [tipoPagoDeuda, setTipoPagoDeuda] = useState('total'); // 'total' | 'parcial'
    const [montoAbonoDeuda, setMontoAbonoDeuda] = useState('');

    // Historial - Filtros de rango
    const [histFechaInicio, setHistFechaInicio] = useState(getMonthRange().start);
    const [histFechaFin, setHistFechaFin] = useState(hoy);
    const [histFiltroPatrocinio, setHistFiltroPatrocinio] = useState('all');

    // Historial state
    const [histFiltroEstado, setHistFiltroEstado] = useState('');

    // Toma de asistencia pagination
    const [tomaPage, setTomaPage] = useState(0);
    const [tomaRowsPerPage, setTomaRowsPerPage] = useState(25);

    // Cargar Infantes dinámicamente según la fecha para actualizar badges de pago (Total de infantes por defecto)
    const cargarDatosInfantes = useCallback(async () => {
        setLoading(true);
        try {
            const params = { limit: 1000, referencia: fecha };
            if (filtroProgramaToma !== 'all') {
                params.tipoPrograma = filtroProgramaToma;
            }
            const res = await infanteService.listar(params);
            setInfantes(res.data || []);
        } catch (error) {
            enqueueSnackbar('Error al cargar infantes', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [fecha, filtroProgramaToma, enqueueSnackbar]);

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
            const montos = {};
            // Inicializar todos con 'Ausente' y monto 0
            infantes.forEach(i => {
                mapping[i.id] = 'Ausente';
                montos[i.id] = 0;
            });
            // Sobrescribir con los registros reales
            data.forEach(r => {
                mapping[r.infanteId] = r.estado;
                const tarifa = parseFloat(r.infante?.tarifaDiaria || 0.60);
                const pagado = r.montoPagado !== null && r.montoPagado !== undefined 
                    ? parseFloat(r.montoPagado) 
                    : (r.estado === 'PagoDia' ? tarifa : 0);
                montos[r.infanteId] = pagado;
            });
            setEstados(mapping);
            setMontosPagados(montos);
        } catch (error) {
            console.error('Error cargando asistencia de fecha:', error);
        }
    }, [fecha, infantes]);

    useEffect(() => {
        if (infantes.length > 0) {
            cargarTomaFecha();
        }
    }, [infantes, cargarTomaFecha]);

    // Cargar Historial (con todos los niños registrados)
    const cargarHistorial = useCallback(async () => {
        try {
            const res = await asistenciaService.listar({
                limit: 5000,
                estado: histFiltroEstado || undefined,
                esPatrocinado: histFiltroPatrocinio !== 'all' ? histFiltroPatrocinio : undefined,
                fechaInicio: histFechaInicio || undefined,
                fechaFin: histFechaFin || undefined,
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

    // Métricas financieras del día en tiempo real
    const metricasDia = useMemo(() => {
        let recaudado = 0;
        let debiendo = 0;
        let pagaronCount = 0;
        let debenCount = 0;
        let deudaTotalSistema = 0;
        let infantesConDeudaCount = 0;

        infantes.forEach(inf => {
            const tarifa = parseFloat(inf.tarifaDiaria || 0.60);
            const st = estados[inf.id] || 'Ausente';
            const pagado = montosPagados[inf.id] !== undefined 
                ? montosPagados[inf.id] 
                : 0; // Se asume 0 si es undefined, ya que se calcula en el setMontosPagados

            if (st === 'PagoDia') {
                recaudado += tarifa;
                pagaronCount++;
            } else if (st === 'Mes') {
                recaudado += tarifa * 10;
                pagaronCount++;
            } else if (st === 'Semana') {
                recaudado += tarifa * 3;
                pagaronCount++;
            } else if (st === 'Pendiente') {
                if (pagado > 0) {
                    recaudado += pagado;
                    pagaronCount++;
                }
                const deudaHoy = Math.max(0, tarifa - pagado);
                debiendo += deudaHoy;
                if (deudaHoy > 0) debenCount++;
            }

            if (inf.deudaTotal > 0) {
                deudaTotalSistema += inf.deudaTotal;
                infantesConDeudaCount++;
            }
        });

        return {
            totalRecaudado: Math.round(recaudado * 100) / 100,
            totalDebiendo: Math.round(debiendo * 100) / 100,
            pagaronCount,
            debenCount,
            deudaTotalSistema: Math.round(deudaTotalSistema * 100) / 100,
            infantesConDeudaCount
        };
    }, [infantes, estados, montosPagados]);

    const handleEstado = (infanteId, nuevoEstado) => {
        if (!nuevoEstado) return;
        const inf = infantes.find(i => i.id === infanteId);
        const tarifa = parseFloat(inf?.tarifaDiaria || 0.60);
        setEstados(e => ({ ...e, [infanteId]: nuevoEstado }));
        setMontosPagados(m => {
            if (nuevoEstado === 'PagoDia') {
                return { ...m, [infanteId]: tarifa };
            } else if (nuevoEstado === 'Mes') {
                return { ...m, [infanteId]: tarifa * 10 };
            } else if (nuevoEstado === 'Semana') {
                return { ...m, [infanteId]: tarifa * 3 };
            } else if (nuevoEstado === 'Pendiente') {
                // Si tenía abono previo menor a tarifa, conservarlo; si no, 0
                const prev = m[infanteId] || 0;
                return { ...m, [infanteId]: prev > 0 && prev < tarifa ? prev : 0 };
            } else {
                return { ...m, [infanteId]: 0 };
            }
        });
    };

    const handleConfirmarAbono = () => {
        if (!abonoDialog.infante) return;
        const id = abonoDialog.infante.id;
        const val = parseFloat(abonoDialog.monto) || 0;
        const tarifa = parseFloat(abonoDialog.infante.tarifaDiaria || 0.60);
        const valorFinal = Math.min(tarifa, Math.max(0, val));
        setEstados(e => ({ ...e, [id]: 'Pendiente' }));
        setMontosPagados(m => ({ ...m, [id]: valorFinal }));
        setAbonoDialog({ open: false, infante: null, monto: '0.25' });
    };

    const marcarTodos = (estado) => {
        const updated = {};
        const updatedMontos = {};
        infantes.forEach(i => {
            updated[i.id] = estado;
            const tarifa = parseFloat(i.tarifaDiaria || 0.60);
            if (estado === 'PagoDia') updatedMontos[i.id] = tarifa;
            else if (estado === 'Mes') updatedMontos[i.id] = tarifa * 10;
            else if (estado === 'Semana') updatedMontos[i.id] = tarifa * 3;
            else updatedMontos[i.id] = 0;
        });
        setEstados(updated);
        setMontosPagados(updatedMontos);
    };

    const guardar = async () => {
        setSaving(true);
        try {
            const payload = Object.entries(estados).map(([id, st]) => {
                const infId = parseInt(id);
                const inf = infantes.find(i => i.id === infId);
                const tarifa = parseFloat(inf?.tarifaDiaria || 0.60);
                let monto = montosPagados[infId] || 0;
                
                if (st === 'PagoDia' && (!monto || monto === 0)) {
                    monto = tarifa;
                } else if (st === 'Mes') {
                    monto = tarifa * 10;
                } else if (st === 'Semana') {
                    monto = tarifa * 3;
                } else if (st !== 'PagoDia' && st !== 'Pendiente') {
                    monto = 0;
                }
                
                return {
                    infanteId: infId,
                    estado: st,
                    montoPagado: monto
                };
            });
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
            const monto = tipoPagoDeuda === 'parcial' ? parseFloat(montoAbonoDeuda) : null;
            const res = await asistenciaService.pagarDeuda(pagoInfante.id, monto);
            enqueueSnackbar(res.mensaje || `Pago de deuda de ${pagoInfante.persona?.nombres} realizado con éxito`, { variant: 'success' });
            cargarDatosInfantes(); // Recargar para ver deuda actualizada
            if (tabIndex === 1) cargarHistorial();
        } catch (error) {
            enqueueSnackbar('Error al procesar el pago', { variant: 'error' });
        } finally {
            setProcesandoPago(false);
            setOpenPagoDialog(false);
            setPagoInfante(null);
            setMontoAbonoDeuda('');
            setTipoPagoDeuda('total');
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

            const asistenciaMap = {}; // { infanteId: { fecha: { estado, montoPagado } } }
            registros.forEach(r => {
                if (!asistenciaMap[r.infanteId]) asistenciaMap[r.infanteId] = {};
                asistenciaMap[r.infanteId][r.fecha.split('T')[0]] = {
                    estado: r.estado,
                    montoPagado: r.montoPagado
                };
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
                    const reg = asistenciaMap[inf.id]?.[f];
                    const estado = reg?.estado || '-';
                    const pagado = reg?.montoPagado ? parseFloat(reg.montoPagado) : 0;
                    const presenciasIds = ['Mes', 'Semana', 'PagoDia', 'Pendiente', 'Punto'];
                    let label = '-';
                    if (estado === 'Mes') label = 'MES';
                    else if (estado === 'Semana') label = 'SEM';
                    else if (estado === 'PagoDia') label = `$${inf.tarifaDiaria || '0.60'}`;
                    else if (estado === 'Pendiente') label = pagado > 0 ? `P ($${pagado.toFixed(2)})` : 'P';
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
                                sx={{ minWidth: 160 }}
                            />
                            <TextField
                                size="small" placeholder="Buscar infante..."
                                value={searchToma} onChange={e => setSearchToma(e.target.value)}
                                sx={{ flex: 1, minWidth: 180 }}
                                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                            />
                            <TextField
                                select size="small" label="Población / Programa" value={filtroProgramaToma}
                                onChange={e => setFiltroProgramaToma(e.target.value)}
                                sx={{ minWidth: 170 }}
                            >
                                <MenuItem value="all">Todos los Niños ({infantes.length})</MenuItem>
                                <MenuItem value="Comedor">Solo Comedor</MenuItem>
                                <MenuItem value="Ministerio">Solo Ministerio</MenuItem>
                                <MenuItem value="Ambos">Ambos Programas</MenuItem>
                            </TextField>
                            <Button variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={guardar} disabled={saving}
                                sx={{ borderRadius: 3, px: 3, py: 1.1, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {saving ? 'Guardando...' : 'Guardar Asistencia'}
                            </Button>
                        </Stack>

                        {/* ── Métricas Financieras y de Asistencia del Día ── */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card elevation={0} sx={{
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 3,
                                    bgcolor: isDark ? alpha('#10b981', 0.08) : alpha('#10b981', 0.05),
                                    boxShadow: '0 4px 12px rgba(16,185,129,0.06)'
                                }}>
                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box>
                                                <Typography variant="caption" fontWeight={700} sx={{ color: '#059669', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                    Recaudado Hoy
                                                </Typography>
                                                <Typography variant="h4" fontWeight={900} sx={{ color: '#059669', mt: 0.5 }}>
                                                    ${metricasDia.totalRecaudado.toFixed(2)}
                                                </Typography>
                                            </Box>
                                            <Avatar sx={{ bgcolor: alpha('#10b981', 0.15), color: '#059669', width: 44, height: 44 }}>
                                                <WalletIcon />
                                            </Avatar>
                                        </Stack>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontWeight: 600 }}>
                                            {metricasDia.pagaronCount} infante{metricasDia.pagaronCount !== 1 ? 's' : ''} con cobro efectuado hoy
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Card elevation={0} sx={{
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 3,
                                    bgcolor: isDark ? alpha('#ef4444', 0.08) : alpha('#ef4444', 0.05),
                                    boxShadow: '0 4px 12px rgba(239,68,68,0.06)'
                                }}>
                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box>
                                                <Typography variant="caption" fontWeight={700} sx={{ color: '#dc2626', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                    Quedan Debiendo Hoy
                                                </Typography>
                                                <Typography variant="h4" fontWeight={900} sx={{ color: '#dc2626', mt: 0.5 }}>
                                                    ${metricasDia.totalDebiendo.toFixed(2)}
                                                </Typography>
                                            </Box>
                                            <Avatar sx={{ bgcolor: alpha('#ef4444', 0.15), color: '#dc2626', width: 44, height: 44 }}>
                                                <PendingIcon />
                                            </Avatar>
                                        </Stack>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontWeight: 600 }}>
                                            {metricasDia.debenCount} infante{metricasDia.debenCount !== 1 ? 's' : ''} con saldo pendiente hoy
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Card elevation={0} sx={{
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 3,
                                    bgcolor: isDark ? alpha(CCO.azul, 0.08) : alpha(CCO.azul, 0.05),
                                    boxShadow: '0 4px 12px rgba(65,105,225,0.06)'
                                }}>
                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box>
                                                <Typography variant="caption" fontWeight={700} sx={{ color: CCO.azul, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                    Asistencia Hoy
                                                </Typography>
                                                <Typography variant="h4" fontWeight={900} sx={{ color: CCO.azul, mt: 0.5 }}>
                                                    {presentesHoy} <Typography component="span" variant="body1" fontWeight={700} color="text.secondary">/ {totalInf}</Typography>
                                                </Typography>
                                            </Box>
                                            <Avatar sx={{ bgcolor: alpha(CCO.azul, 0.15), color: CCO.azul, width: 44, height: 44 }}>
                                                <GroupIcon />
                                            </Avatar>
                                        </Stack>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontWeight: 600 }}>
                                            {porcentajeAsist}% sobre el total de niños ({totalInf})
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Card elevation={0} sx={{
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 3,
                                    bgcolor: isDark ? alpha(CCO.violeta, 0.08) : alpha(CCO.violeta, 0.05),
                                    boxShadow: '0 4px 12px rgba(106,90,205,0.06)'
                                }}>
                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box>
                                                <Typography variant="caption" fontWeight={700} sx={{ color: CCO.violeta, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                    Deuda Total Sistema
                                                </Typography>
                                                <Typography variant="h4" fontWeight={900} sx={{ color: CCO.violeta, mt: 0.5 }}>
                                                    ${metricasDia.deudaTotalSistema.toFixed(2)}
                                                </Typography>
                                            </Box>
                                            <Avatar sx={{ bgcolor: alpha(CCO.violeta, 0.15), color: CCO.violeta, width: 44, height: 44 }}>
                                                <PaymentIcon />
                                            </Avatar>
                                        </Stack>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontWeight: 600 }}>
                                            {metricasDia.infantesConDeudaCount} infante{metricasDia.infantesConDeudaCount !== 1 ? 's' : ''} con deuda pendiente
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>


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
                                        label={`${porcentajeAsist || 0}% asistencia`}
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
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', width: 90 }}>Programa</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', width: 140 }}>Estatus Hoy</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', width: 90 }}>Deuda</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', minWidth: 460 }}>Estado / Pago</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress size={24} /></TableCell></TableRow>
                                    ) : infantesPaginados.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                                <Typography color="text.secondary">No se encontraron infantes</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : infantesPaginados.map((inf, idx) => {
                                        const estado = estados[inf.id] || 'Ausente';
                                        const tarifa = parseFloat(inf.tarifaDiaria || 0.60);
                                        const pagadoHoy = montosPagados[inf.id] !== undefined ? montosPagados[inf.id] : (estado === 'PagoDia' ? tarifa : 0);
                                        const actualIdx = (tomaPage * tomaRowsPerPage) + idx;
                                        const accentColor = estado === 'PagoDia' ? '#4caf50' : estado === 'Ausente' ? '#ef5350' : '#ff9800';
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
                                                                    Cod: {inf.codigo} • Tarifa: ${tarifa.toFixed(2)}
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
                                                    <Chip
                                                        label={inf.tipoPrograma || 'Ministerio'}
                                                        size="small"
                                                        variant="outlined"
                                                        color={inf.tipoPrograma === 'Comedor' ? 'warning' : inf.tipoPrograma === 'Ambos' ? 'secondary' : 'default'}
                                                        sx={{ fontSize: '0.65rem', fontWeight: 700, height: 20 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                        {inf.pagoMesActivo && <Chip label="MES" size="small" color="success" sx={{ fontSize: '0.65rem', fontWeight: 900, height: 20 }} />}
                                                        {inf.pagoSemanaActivo && <Chip label="SEM" size="small" color="primary" sx={{ fontSize: '0.65rem', fontWeight: 900, height: 20 }} />}
                                                        {estado === 'PagoDia' && (
                                                            <Chip label={`PAGÓ $${tarifa.toFixed(2)}`} size="small" color="success" sx={{ fontSize: '0.65rem', fontWeight: 900, height: 20 }} />
                                                        )}
                                                        {estado === 'Pendiente' && pagadoHoy > 0 && (
                                                            <Tooltip title={`Abonó $${pagadoHoy.toFixed(2)} - Queda debiendo $${Math.max(0, tarifa - pagadoHoy).toFixed(2)}`}>
                                                                <Chip label={`ABONÓ $${pagadoHoy.toFixed(2)}`} size="small" color="warning" sx={{ fontSize: '0.65rem', fontWeight: 900, height: 20 }} />
                                                            </Tooltip>
                                                        )}
                                                        {estado === 'Pendiente' && pagadoHoy === 0 && (
                                                            <Chip label={`DEBE $${tarifa.toFixed(2)}`} size="small" color="error" sx={{ fontSize: '0.65rem', fontWeight: 900, height: 20 }} />
                                                        )}
                                                        {estado === 'Punto' && (
                                                            <Chip label="SEGUIM." size="small" color="secondary" sx={{ fontSize: '0.65rem', fontWeight: 900, height: 20 }} />
                                                        )}
                                                        {estado === 'Ausente' && !inf.pagoMesActivo && !inf.pagoSemanaActivo && (
                                                            <Typography variant="caption" color="text.disabled">Falta</Typography>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <Typography variant="body2" fontWeight={800} color={inf.deudaTotal > 0 ? 'error.main' : 'success.main'}>
                                                            ${inf.deudaTotal?.toFixed(2) || '0.00'}
                                                        </Typography>
                                                        {inf.deudaTotal > 0 && (
                                                            <Tooltip title="Cobrar / Abonar deuda">
                                                                <IconButton 
                                                                    size="small" 
                                                                    color="primary" 
                                                                    onClick={() => { 
                                                                        setPagoInfante(inf); 
                                                                        setTipoPagoDeuda('total');
                                                                        setMontoAbonoDeuda(inf.tarifaDiaria ? inf.tarifaDiaria.toString() : '0.60');
                                                                        setOpenPagoDialog(true); 
                                                                    }}
                                                                    sx={{ p: 0.5, bgcolor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}
                                                                >
                                                                    <PaymentIcon sx={{ fontSize: 16 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                                        <ToggleButtonGroup
                                                            value={estado} exclusive size="small"
                                                            onChange={(_, val) => handleEstado(inf.id, val)}
                                                            sx={{ '& .MuiToggleButton-root': { px: 1.1, py: 0.5, fontSize: '0.7rem', fontWeight: 800 } }}
                                                        >
                                                            <ToggleButton value="Mes" color="success">MES</ToggleButton>
                                                            <ToggleButton value="Semana" color="primary">SEM</ToggleButton>
                                                            <ToggleButton value="PagoDia" color="info">${tarifa.toFixed(2)}</ToggleButton>
                                                            <ToggleButton value="Pendiente" color="error">P</ToggleButton>
                                                            <ToggleButton value="Punto" color="secondary">S</ToggleButton>
                                                            <ToggleButton value="Ausente">F</ToggleButton>
                                                        </ToggleButtonGroup>

                                                        {/* Botón de Abono / Pago Parcial */}
                                                        <Tooltip title={estado === 'Pendiente' && pagadoHoy > 0 ? `Abono de $${pagadoHoy.toFixed(2)} (Clic para modificar)` : 'Registrar Pago Parcial (ej. $0.25)'}>
                                                            <Button
                                                                size="small"
                                                                variant={estado === 'Pendiente' && pagadoHoy > 0 ? 'contained' : 'outlined'}
                                                                color="warning"
                                                                onClick={() => setAbonoDialog({ 
                                                                    open: true, 
                                                                    infante: inf, 
                                                                    monto: pagadoHoy > 0 ? pagadoHoy.toString() : '0.25' 
                                                                })}
                                                                sx={{ 
                                                                    fontSize: '0.68rem', 
                                                                    fontWeight: 800, 
                                                                    textTransform: 'none', 
                                                                    px: 1, 
                                                                    py: 0.4, 
                                                                    borderRadius: 2,
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                            >
                                                                {estado === 'Pendiente' && pagadoHoy > 0 ? `½ $${pagadoHoy.toFixed(2)}` : '½ Abono'}
                                                            </Button>
                                                        </Tooltip>
                                                    </Stack>
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

            {/* ── Modal de Confirmación y Abono de Deuda ── */}
            <Dialog open={openPagoDialog} onClose={() => !procesandoPago && setOpenPagoDialog(false)} PaperProps={{ sx: { borderRadius: 4, maxWidth: 440, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PaymentIcon sx={{ color: 'primary.main' }} />
                    Cobro de Deuda Pendiente
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Infante: <strong>{pagoInfante?.persona?.nombres} {pagoInfante?.persona?.apellidos}</strong> (Cód: {pagoInfante?.codigo})
                    </Typography>

                    <Box sx={{ p: 2, bgcolor: alpha(theme.palette.error.main, 0.05), borderRadius: 3, border: `1px dashed ${theme.palette.error.main}`, textAlign: 'center', mb: 2.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>DEUDA TOTAL PENDIENTE</Typography>
                        <Typography variant="h4" fontWeight={900} color="error.main">
                            ${pagoInfante?.deudaTotal?.toFixed(2) || '0.00'}
                        </Typography>
                    </Box>

                    <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Modalidad de Pago:
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
                        <Button
                            variant={tipoPagoDeuda === 'total' ? 'contained' : 'outlined'}
                            color="primary"
                            onClick={() => setTipoPagoDeuda('total')}
                            sx={{ flex: 1, borderRadius: 2.5, fontWeight: 800, textTransform: 'none' }}
                        >
                            Pagar Total (${pagoInfante?.deudaTotal?.toFixed(2)})
                        </Button>
                        <Button
                            variant={tipoPagoDeuda === 'parcial' ? 'contained' : 'outlined'}
                            color="warning"
                            onClick={() => {
                                setTipoPagoDeuda('parcial');
                                if (!montoAbonoDeuda) setMontoAbonoDeuda('0.60');
                            }}
                            sx={{ flex: 1, borderRadius: 2.5, fontWeight: 800, textTransform: 'none' }}
                        >
                            Abono Parcial
                        </Button>
                    </Stack>

                    {tipoPagoDeuda === 'parcial' && (
                        <Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), borderRadius: 3, border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`, mb: 1 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                Atajos rápidos:
                            </Typography>
                            <Stack direction="row" spacing={0.8} sx={{ mb: 1.5 }} flexWrap="wrap">
                                {['0.25', '0.50', '0.60', '1.00', '1.20'].map(val => (
                                    <Chip
                                        key={val}
                                        label={`$${val}`}
                                        clickable
                                        size="small"
                                        color={montoAbonoDeuda === val ? 'warning' : 'default'}
                                        variant={montoAbonoDeuda === val ? 'filled' : 'outlined'}
                                        onClick={() => setMontoAbonoDeuda(val)}
                                        sx={{ fontWeight: 800, mb: 0.5 }}
                                    />
                                ))}
                            </Stack>
                            <TextField
                                fullWidth
                                size="small"
                                label="Monto a Abonar ($)"
                                type="number"
                                inputProps={{ step: '0.05', min: '0.01', max: pagoInfante?.deudaTotal || 999 }}
                                value={montoAbonoDeuda}
                                onChange={e => setMontoAbonoDeuda(e.target.value)}
                                sx={{ mb: 1 }}
                            />
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="caption" color="text.secondary">Saldo restante estimado:</Typography>
                                <Typography variant="subtitle2" fontWeight={900} color={Math.max(0, (pagoInfante?.deudaTotal || 0) - (parseFloat(montoAbonoDeuda) || 0)) > 0 ? 'error.main' : 'success.main'}>
                                    ${Math.max(0, (pagoInfante?.deudaTotal || 0) - (parseFloat(montoAbonoDeuda) || 0)).toFixed(2)}
                                </Typography>
                            </Stack>
                        </Box>
                    )}

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                        {tipoPagoDeuda === 'total' 
                            ? 'Esta acción marcará todas sus asistencias pendientes como "Pagado".' 
                            : 'El abono se aplicará a las fechas pendientes más antiguas en orden cronológico (FIFO).'}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0 }}>
                    <Button onClick={() => setOpenPagoDialog(false)} disabled={procesandoPago} sx={{ fontWeight: 700, textTransform: 'none' }}>Cancelar</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleConfirmarPago} 
                        disabled={procesandoPago || (tipoPagoDeuda === 'parcial' && (!montoAbonoDeuda || parseFloat(montoAbonoDeuda) <= 0))}
                        startIcon={procesandoPago ? <CircularProgress size={18} color="inherit" /> : <CheckIcon />}
                        sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none', px: 3 }}
                    >
                        {tipoPagoDeuda === 'total' ? 'Confirmar Pago Total' : 'Registrar Abono'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Modal de Registro de Abono / Pago Parcial Diario ── */}
            <Dialog 
                open={abonoDialog.open} 
                onClose={() => setAbonoDialog({ open: false, infante: null, monto: '0.25' })}
                PaperProps={{ sx: { borderRadius: 4, maxWidth: 420, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PaymentIcon sx={{ color: 'warning.main' }} />
                    Registrar Pago Parcial (Abono)
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Registra el pago parcial de <strong>{abonoDialog.infante?.persona?.nombres} {abonoDialog.infante?.persona?.apellidos}</strong> para el día seleccionado.
                    </Typography>

                    <Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.06), borderRadius: 3, border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`, mb: 2.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>Tarifa del Día:</Typography>
                            <Typography variant="subtitle2" fontWeight={800}>${parseFloat(abonoDialog.infante?.tarifaDiaria || 0.60).toFixed(2)}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>Monto que paga hoy:</Typography>
                            <Typography variant="subtitle1" fontWeight={900} color="warning.main">${(parseFloat(abonoDialog.monto) || 0).toFixed(2)}</Typography>
                        </Stack>
                        <Divider sx={{ my: 1 }} />
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" fontWeight={800} color="error.main">Quedará debiendo hoy:</Typography>
                            <Typography variant="h6" fontWeight={900} color="error.main">
                                ${Math.max(0, parseFloat(abonoDialog.infante?.tarifaDiaria || 0.60) - (parseFloat(abonoDialog.monto) || 0)).toFixed(2)}
                            </Typography>
                        </Stack>
                    </Box>

                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Montos rápidos:
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        {['0.10', '0.20', '0.25', '0.30', '0.50'].map(val => (
                            <Chip
                                key={val}
                                label={`$${val}`}
                                clickable
                                color={abonoDialog.monto === val ? 'warning' : 'default'}
                                variant={abonoDialog.monto === val ? 'filled' : 'outlined'}
                                onClick={() => setAbonoDialog(prev => ({ ...prev, monto: val }))}
                                sx={{ fontWeight: 800 }}
                            />
                        ))}
                    </Stack>

                    <TextField
                        fullWidth
                        size="small"
                        label="Otro Monto a Pagar ($)"
                        type="number"
                        inputProps={{ step: '0.05', min: '0', max: parseFloat(abonoDialog.infante?.tarifaDiaria || 0.60) }}
                        value={abonoDialog.monto}
                        onChange={e => setAbonoDialog(prev => ({ ...prev, monto: e.target.value }))}
                        helperText={`Valor entre $0.01 y $${parseFloat(abonoDialog.infante?.tarifaDiaria || 0.60).toFixed(2)}`}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={() => setAbonoDialog({ open: false, infante: null, monto: '0.25' })} color="inherit" sx={{ fontWeight: 700 }}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={handleConfirmarAbono}
                        sx={{ fontWeight: 800, borderRadius: 2.5, px: 3 }}
                    >
                        Aplicar Pago Parcial
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
