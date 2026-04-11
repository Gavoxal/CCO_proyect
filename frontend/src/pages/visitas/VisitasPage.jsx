import { useState, useMemo, useEffect } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Button, Chip, Avatar,
    Alert, Divider, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, CircularProgress, Stack, Paper,
    Tabs, Tab, Table, TableBody, TableCell, TableHead, TableRow,
    TablePagination, IconButton, Tooltip, alpha, useTheme,
    FormControl, RadioGroup, FormControlLabel, Radio,
    Autocomplete, MenuItem, InputAdornment, Avatar as MuiAvatar,
    ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Add as AddIcon, HomeWork as VisitaIcon, History as HistoryIcon,
    Search as SearchIcon, FilterAlt as FilterIcon,
    CheckCircle as SuccessIcon, Cancel as ErrorIcon,
    Person as PersonIcon, CalendarMonth as CalendarIcon,
    Assignment as FormIcon, Download as DownloadIcon,
    FileDownload as ExcelIcon, PhotoCamera as PhotoIcon,
    Print as PrintIcon, Close as CloseIcon, Delete as DeleteIcon, Edit as EditIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import * as XLSX from 'xlsx';
import visitaService from '../../services/visitaService';
import infanteService from '../../services/infanteService';
import { getSchoolYearRange, formatLongDate } from '../../utils/dateUtils';

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

// Generar dinámicamente los años lectivos desde 2024 hasta el año actual + 2
const currentYearGlobal = new Date().getFullYear();
const ANIOS = Array.from(
    { length: Math.max(4, currentYearGlobal - 2024 + 2) },
    (_, i) => 2024 + i
);
const RAZONES = ['Inasistencia', 'Enfermedad', 'Otra Causa', 'Seguimiento'];
const SITUACIONES = ['Continuación en el Ministerio', 'Dar de Baja', 'Otra'];

export default function VisitasPage() {
    const { user, getImageUrl } = useAuth();
    const location = useLocation();
    const { enqueueSnackbar } = useSnackbar();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const isAdmin = ['admin', 'director', 'pastor'].includes(user?.rol);
    const canWrite = ['admin', 'director', 'secretaria', 'tutor_especial', 'tutor'].includes(user?.rol);

    const [tabIndex, setTabIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [visitas, setVisitas] = useState([]);
    const [pendientes, setPendientes] = useState([]);
    const [editId, setEditId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
    const [infantes, setInfantes] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPendientes, setTotalPendientes] = useState(0);
    const [tutoresLista, setTutoresLista] = useState([]);

    // Filtros Historial
    const currentYear = new Date().getFullYear();
    const [searchHist, setSearchHist] = useState('');
    const [filtroTutor, setFiltroTutor] = useState('');
    const [filtroAnio, setFiltroAnio] = useState(currentYear.toString());
    const [histPage, setHistPage] = useState(0);
    const [histRowsPerPage, setHistRowsPerPage] = useState(10);
    const [pendPage, setPendPage] = useState(0);
    const [pendRowsPerPage, setPendRowsPerPage] = useState(10);
    const [searchPend, setSearchPend] = useState('');
    const [filtroTutorPend, setFiltroTutorPend] = useState('');

    const schoolYear = useMemo(() => getSchoolYearRange(filtroAnio), [filtroAnio]);

    const cargarVisitas = async () => {
        setLoading(true);
        try {
            const res = await visitaService.listar({
                fechaInicio: schoolYear.start.toISOString(),
                fechaFin: schoolYear.end.toISOString(),
                search: searchHist,
                tutorId: filtroTutor,
                page: histPage + 1,
                limit: histRowsPerPage
            });
            setVisitas(res.data);
            setTotal(res.total);
        } catch (error) {
            enqueueSnackbar('Error al cargar visitas', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const cargarPendientes = async () => {
        setLoading(true);
        try {
            const res = await visitaService.listarPendientes({
                anio: filtroAnio,
                search: searchPend,
                tutorId: filtroTutorPend,
                page: pendPage + 1,
                limit: pendRowsPerPage
            });
            setPendientes(res.data);
            setTotalPendientes(res.total);
        } catch (error) {
            enqueueSnackbar('Error al cargar pendientes', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const cargarInfantes = async () => {
        try {
            const res = await infanteService.listar({ limit: 1000 });
            setInfantes(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const cargarTutores = async () => {
        try {
            const res = await visitaService.listarTutores();
            // Secure array extraction
            const extracted = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
            setTutoresLista(extracted);
        } catch (error) {
            console.error('Error al cargar tutores:', error);
            setTutoresLista([]);
        }
    };


    useEffect(() => {
        cargarInfantes();
        cargarTutores();
        // Revisar si venimos desde el detalle de un infante
        if (location.state?.registrarVisitaPara) {
            setForm(f => ({ ...f, infanteId: location.state.registrarVisitaPara }));
            setTabIndex(2); // Ir a la pestaña de registro
        }
    }, [location.state]);

    useEffect(() => {
        if (tabIndex === 0) cargarVisitas();
        if (tabIndex === 1) cargarPendientes();
        if (tabIndex === 0 && editId !== null) {
            // Cancelar edición al cambiar de pestaña
            setEditId(null);
            resetForm();
        }
    }, [tabIndex, filtroAnio, searchHist, filtroTutor, histPage, histRowsPerPage, pendPage, pendRowsPerPage, searchPend, filtroTutorPend]);

    const handleExportExcel = () => {
        try {
            const dataToExport = visitas.map(v => ({
                Fecha: new Date(v.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                Código: v.infante.codigo,
                Infante: `${v.infante.persona.nombres} ${v.infante.persona.apellidos}`,
                Tutor: v.tutor?.nombre || (v.infante.tutor ? `${v.infante.tutor.persona.nombres} ${v.infante.tutor.persona.apellidos}` : 'N/A'),
                Razón: v.razon,
                Realizada: v.visitaExitosa,
                Situación: v.situacion,
                Resultados: v.resultados,
                Observaciones: v.observaciones
            }));

            if (dataToExport.length === 0) {
                enqueueSnackbar('No hay datos para exportar', { variant: 'info' });
                return;
            }

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Visitas");
            XLSX.writeFile(wb, `Reporte_Visitas_${filtroAnio}.xlsx`);
            enqueueSnackbar('Excel exportado correctamente', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Error al exportar Excel', { variant: 'error' });
        }
    };

    const [form, setForm] = useState({
        infanteId: null,
        tutorId: null,
        fecha: new Date().toISOString().split('T')[0],
        visitaExitosa: 'SI',
        razon: '',
        resultados: '',
        situacion: 'Continuación en el Ministerio',
        observaciones: '',
    });
    const [fotoVisita, setFotoVisita] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(null);
    const resetForm = () => {
        setForm({
            infanteId: null,
            tutorId: null,
            fecha: new Date().toISOString().split('T')[0],
            visitaExitosa: 'SI',
            razon: '',
            resultados: '',
            situacion: 'Continuación en el Ministerio',
            observaciones: '',
        });
        setFotoVisita(null);
        setFotoPreview(null);
    };

    const handleEditAction = (v) => {
        setForm({
            infanteId: v.infanteId,
            tutorId: v.tutorId,
            fecha: new Date(v.fecha).toISOString().split('T')[0],
            visitaExitosa: v.visitaExitosa,
            // Revert frontend mapped reasons if needed, but the backend maps it back.
            razon: v.razon,
            resultados: v.resultados || '',
            situacion: v.situacion || 'Continuación en el Ministerio',
            observaciones: v.observaciones || '',
        });
        setEditId(v.id);
        setTabIndex(2);
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        try {
            await visitaService.eliminar(deleteModal.id);
            enqueueSnackbar('Visita eliminada correctamente', { variant: 'success' });
            setDeleteModal({ open: false, id: null });
            cargarVisitas();
        } catch (error) {
            enqueueSnackbar('Error al eliminar visita', { variant: 'error' });
        }
    };

    const guardar = async () => {
        if (!form.infanteId || !form.fecha || !form.razon || !form.tutorId) {
            enqueueSnackbar('Complete los campos obligatorios (Infante, Tutor, Fecha, Razón)', { variant: 'warning' });
            return;
        }
        setSaving(true);
        try {
            const formData = new FormData();
            Object.keys(form).forEach(key => {
                if (form[key] !== null) formData.append(key, form[key]);
            });
            if (fotoVisita) {
                formData.append('archivo', fotoVisita);
            }

            if (editId) {
                await visitaService.actualizar(editId, formData);
                enqueueSnackbar('Visita actualizada correctamente', { variant: 'success' });
            } else {
                await visitaService.crear(formData);
                enqueueSnackbar('Visita registrada correctamente', { variant: 'success' });
            }
            
            setTabIndex(0);
            cargarVisitas();
            resetForm();
            setEditId(null);
        } catch (error) {
            enqueueSnackbar(`Error al ${editId ? 'actualizar' : 'guardar'} visita`, { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const generarPDF = async (v) => {
        const doc = new jsPDF();
        const primaryColor = [65, 105, 225]; // CCO Azul

        // Membrete/Título
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('HOJA DE VISITA DOMICILIARIA', 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text('CENTRO CRISTIANO DE OBRAPIA (CCO)', 105, 30, { align: 'center' });

        // Información General
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMACIÓN DEL INFANTE', 20, 55);
        doc.setLineWidth(0.5);
        doc.line(20, 57, 190, 57);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nombre: ${v.infante.persona.nombres} ${v.infante.persona.apellidos}`, 20, 65);
        doc.text(`Código: ${v.infante.codigo}`, 20, 72);
        doc.text(`Fecha de Visita: ${new Date(v.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}`, 120, 65);
        
        const tutorNombre = v.tutor?.nombre || (v.infante.tutor ? `${v.infante.tutor.persona.nombres} ${v.infante.tutor.persona.apellidos}` : 'N/A');
        doc.text(`Tutor Responsable: ${tutorNombre}`, 120, 72);

        // Detalles de la Visita
        doc.setFont('helvetica', 'bold');
        doc.text('DETALLES DE LA VISITA', 20, 85);
        doc.setLineWidth(0.5);
        doc.line(20, 87, 190, 87);

        autoTable(doc, {
            startY: 90,
            head: [['Campo', 'Descripción']],
            body: [
                ['Razón de Visita', v.razon],
                ['Visita Exitosa', v.visitaExitosa],
                ['Situación Post-Visita', v.situacion],
                ['Observaciones', v.observaciones || 'Sin observaciones adicionales']
            ],
            theme: 'striped',
            headStyles: { fillColor: primaryColor }
        });

        const finalY = doc.lastAutoTable.finalY + 10;

        // Resultados
        doc.setFont('helvetica', 'bold');
        doc.text('RESULTADOS Y NOVEDADES:', 20, finalY);
        doc.setFont('helvetica', 'normal');
        const splitResultados = doc.splitTextToSize(v.resultados || 'No se registraron resultados específicos.', 170);
        doc.text(splitResultados, 20, finalY + 7);

        let currentY = finalY + (splitResultados.length * 5) + 15;

        // Foto (si existe)
        if (v.fotoVisita) {
            try {
                // El fotoVisita es una URL relativa, necesitamos la absoluta para jsPDF
                const imgUrl = getImageUrl(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${v.fotoVisita}`);

                // Cargar imagen
                const img = await new Promise((resolve, reject) => {
                    const i = new Image();
                    i.crossOrigin = 'Anonymous';
                    i.onload = () => resolve(i);
                    i.onerror = reject;
                    i.src = imgUrl;
                });

                // Calcular dimensiones para que quepa (max 100x60)
                const ratio = img.width / img.height;
                let imgW = 100;
                let imgH = imgW / ratio;
                if (imgH > 60) {
                    imgH = 60;
                    imgW = imgH * ratio;
                }

                // Ajustar currentY si está muy abajo para que quepa en la misma página
                if (currentY + imgH > 260) {
                    currentY = 260 - imgH - 10; 
                }

                doc.setFont('helvetica', 'bold');
                doc.text('EVIDENCIA FOTOGRÁFICA:', 20, currentY);
                doc.addImage(img, 'JPEG', 55, currentY + 5, imgW, imgH);
            } catch (e) {
                console.error("Error cargando imagen para PDF", e);
            }
        }

        // Espacio estático para firmas en la misma página
        currentY = 270;

        doc.setLineWidth(0.5);
        doc.line(30, currentY, 90, currentY);
        doc.line(120, currentY, 180, currentY);
        doc.setFontSize(9);
        doc.text('Firma del Director/a', 60, currentY + 5, { align: 'center' });
        doc.text('Firma del Tutor/Familia', 150, currentY + 5, { align: 'center' });

        doc.save(`Visita_${v.infante.codigo}_${new Date(v.fecha).toISOString().split('T')[0]}.pdf`);
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
                        <Tab icon={<ErrorIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Pendientes de Visita" />
                        <Tab icon={<AddIcon sx={{ fontSize: 20 }} />} iconPosition="start" label={editId ? "Editar Visita" : "Registrar Nueva Visita"} />
                    </Tabs>

                    <Box sx={{ p: 3 }}>
                        {tabIndex === 0 ? (
                            /* ─── HISTORIAL ─────────────────────────────────── */
                            <Box>
                                <Grid container spacing={2.5} sx={{ mb: 4 }} alignItems="center">
                                    <Grid item xs={12} md={6}>
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
                                    <Grid item xs={6} md={3}>
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            label="Año Lectivo"
                                            value={filtroAnio}
                                            onChange={e => setFiltroAnio(e.target.value)}
                                            InputProps={{ sx: { borderRadius: 2 } }}
                                        >
                                            {ANIOS.map(a => (
                                                <MenuItem key={a} value={a}>{a} - {a + 1}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Rango: {formatLongDate(schoolYear.start)} - {formatLongDate(schoolYear.end)}
                                        </Typography>
                                    </Grid>
                                </Grid>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                                    <Chip
                                        icon={<SuccessIcon sx={{ fontSize: '1rem !important' }} />}
                                        label={`${total} Registros encontrados`}
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
                                                <TableCell sx={{ fontWeight: 800, color: CCO.violeta }} align="center">Acciones</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {visitas.map((v) => (
                                                <TableRow key={v.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                    <TableCell sx={{ fontWeight: 500 }}>
                                                        {new Date(v.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </TableCell>
                                                    <TableCell sx={{ minWidth: 200 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', fontWeight: 800, bgcolor: alpha(CCO.violeta, 0.1), color: CCO.violeta }}>
                                                                {v.infante.persona.nombres.charAt(0)}
                                                            </Avatar>
                                                            {v.infante.fotografia && (
                                                                <Avatar 
                                                                    src={getImageUrl(v.infante.fotografia)} 
                                                                    sx={{ width: 32, height: 32, position: 'absolute' }} 
                                                                />
                                                            )}
                                                            <Box>
                                                                <Typography variant="body2" fontWeight={700}>{v.infante.persona.nombres} {v.infante.persona.apellidos}</Typography>
                                                                <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>{v.infante.codigo}</Typography>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    {isAdmin && (
                                                        <TableCell variant="body2">
                                                            {v.tutor?.nombre || (v.infante.tutor ? `${v.infante.tutor.persona.nombres.split(' ')[0]} ${v.infante.tutor.persona.apellidos.split(' ')[0]}` : 'S/T')}
                                                        </TableCell>
                                                    )}
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
                                                            color: v.situacion?.includes('Baja') ? 'error.main' : 'text.primary',
                                                            bgcolor: alpha(v.situacion?.includes('Baja') ? theme.palette.error.main : theme.palette.divider, 0.1),
                                                            px: 1, py: 0.5, borderRadius: 1
                                                        }}>
                                                            {v.situacion}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                            <Tooltip title="Descargar Reporte PDF">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => generarPDF(v)}
                                                                    sx={{ color: CCO.azul, '&:hover': { bgcolor: alpha(CCO.azul, 0.1) } }}
                                                                >
                                                                    <PrintIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            {canWrite && (
                                                                <Tooltip title="Editar Visita">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleEditAction(v)}
                                                                        sx={{ color: CCO.naranja, '&:hover': { bgcolor: alpha(CCO.naranja, 0.1) } }}
                                                                    >
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                            {canWrite && (
                                                                <Tooltip title="Eliminar Visita">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => setDeleteModal({ open: true, id: v.id })}
                                                                        sx={{ color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {visitas.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                                        <Box sx={{ opacity: 0.5 }}>
                                                            <HistoryIcon sx={{ fontSize: 40, mb: 1 }} />
                                                            <Typography variant="body1">No hay visitas registradas en este periodo.</Typography>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </Box>

                                <TablePagination
                                    component="div"
                                    count={total}
                                    page={histPage}
                                    onPageChange={(_, p) => setHistPage(p)}
                                    rowsPerPage={histRowsPerPage}
                                    onRowsPerPageChange={e => { setHistRowsPerPage(parseInt(e.target.value, 10)); setHistPage(0); }}
                                    labelRowsPerPage="Filas por página:"
                                />
                            </Box>
                        ) : tabIndex === 1 ? (
                            /* ─── PENDIENTES ───────────────────────────────── */
                            <Box>
                                <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
                                    Listado de infantes que aún <strong>no han recibido una visita exitosa</strong> en el año lectivo seleccionado ({filtroAnio} - {filtroAnio + 1}).
                                </Alert>

                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={12} md={7}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            placeholder="Buscar niño por nombre o código..."
                                            value={searchPend}
                                            onChange={e => { setSearchPend(e.target.value); setPendPage(0); }}
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
                                    <Grid item xs={12} md={5}>
                                        <Autocomplete
                                            size="small"
                                            options={tutoresLista}
                                            getOptionLabel={(option) => `${option.persona?.nombres} ${option.persona?.apellidos}`}
                                            value={tutoresLista.find(t => t.id === filtroTutorPend) || null}
                                            onChange={(_, newValue) => { setFiltroTutorPend(newValue?.id || ''); setPendPage(0); }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Filtrar por Tutor"
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        sx: { borderRadius: 2 }
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>

                                <Box sx={{ overflowX: 'auto' }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800 }}>Infante</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>Código</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }} align="right">Acción</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {pendientes.map((inf) => (
                                                <TableRow key={inf.id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {inf.persona.apellidos} {inf.persona.nombres}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>{inf.codigo}</TableCell>
                                                    <TableCell align="right">
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            startIcon={<AddIcon />}
                                                            onClick={() => {
                                                                setForm(f => ({ ...f, infanteId: inf.id }));
                                                                setTabIndex(2);
                                                            }}
                                                            sx={{ borderRadius: 2, bgcolor: CCO.naranja }}
                                                        >
                                                            Visitar
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {pendientes.length === 0 && !loading && (
                                                <TableRow>
                                                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                                                        ¡Todos los infantes han sido visitados! 🎉
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </Box>
                                <TablePagination
                                    component="div"
                                    count={totalPendientes}
                                    page={pendPage}
                                    onPageChange={(_, p) => setPendPage(p)}
                                    rowsPerPage={pendRowsPerPage}
                                    onRowsPerPageChange={e => { setPendRowsPerPage(parseInt(e.target.value, 10)); setPendPage(0); }}
                                    labelRowsPerPage="Filas:"
                                />
                            </Box>
                        ) : (
                            /* ─── REGISTRO REDISEÑADO ───────────────────────── */
                            <Box sx={{ maxWidth: 900, mx: 'auto', pb: 4 }}>
                                <Box sx={{ textAlign: 'center', mb: 5 }}>
                                    <Typography variant="h4" fontWeight={900} sx={{
                                        mb: 1,
                                        background: `linear-gradient(135deg, ${CCO.naranja} 0%, ${CCO.violeta} 100%)`,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 2
                                    }}>
                                        <FormIcon sx={{ fontSize: 45, color: CCO.naranja, WebkitTextFillColor: 'initial' }} />
                                        Registro de Visita Domiciliaria
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
                                        Documente los detalles de la visita realizada para mantener el seguimiento integral del infante.
                                    </Typography>
                                    <Divider sx={{ mt: 3, width: 100, mx: 'auto', borderWidth: 2, borderColor: CCO.naranja, borderRadius: 1, opacity: 0.5 }} />
                                </Box>

                                <Grid container spacing={2.5} justifyContent="center" sx={{ width: '100%' }}>
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="h6" fontWeight={800} sx={{ color: CCO.azul, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <VisitaIcon /> {editId ? 'Editar Visita Domiciliaria' : 'Nueva Visita Domiciliaria'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                            {editId ? 'Modifique los detalles de la visita' : 'Complete el formulario a continuación para registrar la visita al hogar del infante.'}
                                        </Typography>
                                        <Card elevation={0} sx={{ borderRadius: 5, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'divider', bgcolor: isDark ? alpha('#fff', 0.02) : '#fff' }}>
                                            <CardContent sx={{ p: 2.5 }}>
                                                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 3, color: CCO.azul, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <PersonIcon /> 1. Datos Generales de la Visita
                                                </Typography>
                                                <Grid container spacing={2.5}>
                                                    <Grid size={{ xs: 12 }}>
                                                        <Autocomplete
                                                            options={infantes}
                                                            getOptionLabel={(option) => `${option.codigo} - ${option.persona?.apellidos} ${option.persona?.nombres}`}
                                                            value={infantes.find(i => i.id === form.infanteId) || null}
                                                            onChange={(_, newValue) => {
                                                                setForm(f => ({ 
                                                                    ...f, 
                                                                    infanteId: newValue?.id || null,
                                                                    // Auto-seleccionar el tutor si el infante tiene uno asignado
                                                                    tutorId: newValue?.tutorId || f.tutorId 
                                                                }));
                                                            }}
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    label="Infante a visitar"
                                                                    required
                                                                    placeholder="Busque por código o nombre"
                                                                    InputProps={{
                                                                        ...params.InputProps,
                                                                        startAdornment: (
                                                                            <InputAdornment position="start">
                                                                                <SearchIcon color="primary" />
                                                                            </InputAdornment>
                                                                        ),
                                                                    }}
                                                                />
                                                            )}
                                                        />
                                                    </Grid>

                                                    <Grid size={{ xs: 12, md: 8 }}>
                                                        <Autocomplete
                                                            options={Array.isArray(tutoresLista) ? tutoresLista : []}
                                                            getOptionLabel={(option) => `${option.persona?.apellidos} ${option.persona?.nombres}`}
                                                            value={Array.isArray(tutoresLista) ? tutoresLista.find(t => t.id === form.tutorId) || null : null}
                                                            onChange={(_, newValue) => setForm(f => ({ ...f, tutorId: newValue?.id || null }))}
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    label="Tutor responsable"
                                                                    required
                                                                    placeholder="Seleccione el tutor que realiza la visita"
                                                                    InputProps={{
                                                                        ...params.InputProps,
                                                                        startAdornment: (
                                                                            <InputAdornment position="start">
                                                                                <PersonIcon color="primary" />
                                                                            </InputAdornment>
                                                                        ),
                                                                    }}
                                                                />
                                                            )}
                                                        />
                                                    </Grid>

                                                    <Grid size={{ xs: 12, md: 4 }}>
                                                        <TextField
                                                            fullWidth
                                                            label="Fecha de la Visita"
                                                            type="date"
                                                            required
                                                            value={form.fecha}
                                                            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <InputAdornment position="start">
                                                                        <CalendarIcon color="primary" />
                                                                    </InputAdornment>
                                                                ),
                                                                sx: { borderRadius: 3 }
                                                            }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    {/* SECCIÓN 2: ESTADO Y RAZÓN */}
                                    <Grid size={{ xs: 12 }}>
                                        <Card elevation={0} sx={{ borderRadius: 5, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'divider', bgcolor: isDark ? alpha(CCO.azul, 0.05) : alpha(CCO.azul, 0.02) }}>
                                            <CardContent sx={{ p: 2.5 }}>
                                                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 3, color: CCO.azul, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <VisitaIcon /> 2. Resultado y Motivo
                                                </Typography>
                                                <Grid container spacing={2.5} alignItems="center">
                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                        <Typography variant="body1" fontWeight={700} gutterBottom sx={{ mb: 1.5, color: 'text.secondary' }}>
                                                            ¿Se logró realizar la visita exitosamente?
                                                        </Typography>
                                                        <ToggleButtonGroup
                                                            value={form.visitaExitosa}
                                                            exclusive
                                                            onChange={(_, val) => val && setForm(f => ({ ...f, visitaExitosa: val }))}
                                                            fullWidth
                                                            sx={{ height: 56 }}
                                                        >
                                                            <ToggleButton value="SI" sx={{
                                                                borderRadius: '12px !important',
                                                                border: '2px solid transparent',
                                                                '&.Mui-selected': {
                                                                    bgcolor: alpha(theme.palette.success.main, 0.15),
                                                                    color: 'success.main',
                                                                    fontWeight: 800,
                                                                    borderColor: 'success.main'
                                                                }
                                                            }}>
                                                                <SuccessIcon sx={{ mr: 1 }} /> SÍ, REALIZADA
                                                            </ToggleButton>
                                                            <ToggleButton value="NO" sx={{
                                                                borderRadius: '12px !important',
                                                                border: '2px solid transparent',
                                                                '&.Mui-selected': {
                                                                    bgcolor: alpha(theme.palette.error.main, 0.15),
                                                                    color: 'error.main',
                                                                    fontWeight: 800,
                                                                    borderColor: 'error.main'
                                                                }
                                                            }}>
                                                                <ErrorIcon sx={{ mr: 1 }} /> NO REALIZADA
                                                            </ToggleButton>
                                                        </ToggleButtonGroup>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                        <TextField
                                                            select
                                                            fullWidth
                                                            label="Razón o Motivo de la visita"
                                                            value={form.razon}
                                                            onChange={(e) => setForm(f => ({ ...f, razon: e.target.value }))}
                                                            required
                                                            sx={{ mt: { xs: 0, md: 3.2 } }}
                                                        >
                                                            {RAZONES.map(r => (
                                                                <MenuItem key={r} value={r}>{r}</MenuItem>
                                                            ))}
                                                        </TextField>
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    {/* SECCIÓN 3: NOVEDADES Y FOTO */}
                                    <Grid size={{ xs: 12 }}>
                                        <Card elevation={0} sx={{ borderRadius: 5, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'divider', bgcolor: isDark ? alpha('#fff', 0.02) : '#fff' }}>
                                            <CardContent sx={{ p: 2.5 }}>
                                                <Grid container spacing={2.5}>
                                                    <Grid size={{ xs: 12, md: 8 }}>
                                                        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2, color: CCO.azul, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <FormIcon /> 3. Hallazgos y Resultados
                                                        </Typography>
                                                        <TextField
                                                            fullWidth
                                                            label="Descripción detallada de la visita"
                                                            multiline
                                                            rows={8}
                                                            value={form.resultados}
                                                            onChange={(e) => setForm(f => ({ ...f, resultados: e.target.value }))}
                                                            placeholder="Describa la situación del infante, entorno familiar, salud, estudios..."
                                                            variant="filled"
                                                            sx={{
                                                                '& .MuiFilledInput-root': {
                                                                    borderRadius: 4,
                                                                    bgcolor: isDark ? alpha('#000', 0.2) : alpha(theme.palette.divider, 0.05),
                                                                    border: '1px solid transparent',
                                                                    '&:hover': { bgcolor: isDark ? alpha('#000', 0.3) : alpha(theme.palette.divider, 0.08) },
                                                                    '&.Mui-focused': { borderColor: CCO.azul, bgcolor: isDark ? alpha('#000', 0.4) : '#fff' }
                                                                }
                                                            }}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 4 }}>
                                                        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2, color: CCO.naranja, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <PhotoIcon /> Evidencia Visual
                                                        </Typography>
                                                        <Box
                                                            sx={{
                                                                border: '2px dashed',
                                                                borderColor: fotoPreview ? CCO.naranja : isDark ? 'rgba(255,255,255,0.1)' : 'divider',
                                                                borderRadius: 5,
                                                                height: 236,
                                                                px: 2,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                bgcolor: isDark ? alpha(CCO.naranja, 0.05) : alpha(CCO.naranja, 0.02),
                                                                position: 'relative',
                                                                overflow: 'hidden',
                                                                transition: 'all 0.3s'
                                                            }}
                                                        >
                                                            {fotoPreview ? (
                                                                <>
                                                                    <img
                                                                        src={fotoPreview.startsWith('blob:') ? fotoPreview : getImageUrl(fotoPreview)}
                                                                        alt="Vista previa"
                                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                    />
                                                                    <IconButton
                                                                        onClick={() => { setFotoVisita(null); setFotoPreview(null); }}
                                                                        sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'error.main', color: 'white', boxShadow: 3, '&:hover': { bgcolor: 'error.dark' } }}
                                                                        size="medium"
                                                                    >
                                                                        <CloseIcon />
                                                                    </IconButton>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <IconButton color="primary" component="label" sx={{ bgcolor: alpha(CCO.naranja, 0.15), mb: 2, p: 2 }}>
                                                                        <PhotoIcon fontSize="large" sx={{ color: CCO.naranja }} />
                                                                        <input type="file" hidden accept="image/*" onChange={(e) => {
                                                                            const file = e.target.files[0];
                                                                            if (file) {
                                                                                setFotoVisita(file);
                                                                                setFotoPreview(URL.createObjectURL(file));
                                                                            }
                                                                        }} />
                                                                    </IconButton>
                                                                    <Typography variant="body2" color="text.secondary" fontWeight={700} textAlign="center">
                                                                        Subir Fotografía de Respaldo
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 0.5 }}>
                                                                        (Opcional)
                                                                    </Typography>
                                                                </>
                                                            )}
                                                        </Box>
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    {/* SECCIÓN 4: CIERRE */}
                                    <Grid size={{ xs: 12 }}>
                                        <Card elevation={0} sx={{ borderRadius: 5, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'divider', bgcolor: isDark ? alpha(theme.palette.warning.main, 0.05) : alpha(theme.palette.warning.main, 0.02) }}>
                                            <CardContent sx={{ p: 2.5 }}>
                                                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 3, color: CCO.azul, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <HistoryIcon /> 4. Conclusión y Seguimiento
                                                </Typography>
                                                <Grid container spacing={2.5}>
                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                        <TextField
                                                            select
                                                            fullWidth
                                                            label="Estado Final del Infante"
                                                            value={form.situacion}
                                                            onChange={(e) => setForm(f => ({ ...f, situacion: e.target.value }))}
                                                        >
                                                            {SITUACIONES.map(s => (
                                                                <MenuItem key={s} value={s}>{s}</MenuItem>
                                                            ))}
                                                        </TextField>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                        <TextField
                                                            fullWidth
                                                            label="Observaciones Técnicas Finales"
                                                            value={form.observaciones}
                                                            onChange={(e) => setForm(f => ({ ...f, observaciones: e.target.value }))}
                                                            placeholder="Notas finales o compromisos adquiridos..."
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    {/* BOTONES DE ACCIÓN */}
                                    <Grid size={{ xs: 12 }} sx={{ mt: 5, display: 'flex', justifyContent: 'center', gap: 4 }}>
                                        <Button
                                            variant="outlined"
                                            size="large"
                                            onClick={() => { setTabIndex(0); setEditId(null); }}
                                            disabled={saving}
                                            sx={{
                                                px: 4,
                                                py: 1.5,
                                                borderRadius: 3,
                                                fontWeight: 700,
                                                fontSize: '1rem',
                                                border: '2px solid',
                                                '&:hover': { border: '2px solid', bgcolor: alpha(theme.palette.action.hover, 0.1) }
                                            }}
                                        >
                                            Cancelar Registro
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            onClick={guardar}
                                            disabled={saving}
                                            startIcon={saving ? <CircularProgress size={24} color="inherit" /> : <SuccessIcon />}
                                            sx={{
                                                px: 6,
                                                py: 1.5,
                                                borderRadius: 3,
                                                fontWeight: 700,
                                                fontSize: '1.05rem',
                                                background: `linear-gradient(135deg, ${CCO.naranja} 0%, ${CCO.violeta} 100%)`,
                                                boxShadow: `0 8px 20px ${alpha(CCO.naranja, 0.3)}`,
                                                transition: 'all 0.3s',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: `0 12px 25px ${alpha(CCO.naranja, 0.5)}`,
                                                    opacity: 0.95
                                                },
                                                '&:active': {
                                                    transform: 'translateY(0)'
                                                }
                                            }}
                                        >
                                            {saving ? 'Guardando...' : 'GUARDAR HOJA DE VISITA'}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                    </Box>
                </Paper>
            </Box>

            {/* Dialogo Confirmar Eliminación */}
            <Dialog open={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null })}>
                <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>Eliminar Visita</DialogTitle>
                <DialogContent>
                    <Typography>¿Está seguro de eliminar esta visita? Esta acción no se puede deshacer.</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteModal({ open: false, id: null })} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancelar</Button>
                    <Button onClick={confirmDelete} variant="contained" color="error" sx={{ fontWeight: 700, px: 3 }}>Eliminar</Button>
                </DialogActions>
            </Dialog>
        </MainLayout>
    );
}
