import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Card, CardContent, Grid, Button, Chip, LinearProgress,
    MenuItem, TextField, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
    Divider, Avatar, IconButton, Tooltip
} from '@mui/material';
import MainLayout from '../../components/layout/MainLayout';
import DataTable from '../../components/common/DataTable';
import { regalosService, importService } from '../../services/appServices';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import { alpha, useTheme } from '@mui/material/styles';

// Icons
import GiftIcon from '@mui/icons-material/CardGiftcard';
import BackpackIcon from '@mui/icons-material/Backpack';
import UploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/AddCircleOutline';
import SuccessIcon from '@mui/icons-material/CheckCircleOutline';
import PendingIcon from '@mui/icons-material/History';
import ViewIcon from '@mui/icons-material/Visibility';
import CheckIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import CalendarIcon from '@mui/icons-material/CalendarToday';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

const CCO = {
    naranja: '#FF6B35',
    azul: '#004E89',
    crema: '#EFEFD0',
    violeta: '#6B2D5C',
    celeste: '#7BAE7F'
};

// ─── MOCK DATA ────────────────────────────────────────────────
const MOCK_LIST = [
    { id: 101, infanteId: 1, infante: { codigo: 'INF-001', fotografia: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200', persona: { nombres: 'Juan Carlos', apellidos: 'Peralta', fechaNacimiento: '2018-05-10', direccion: 'Barrio Central, Calle 5' } }, fechaEntrega: '2026-03-05', observaciones: 'Entregado sin novedad' },
    { id: 102, infanteId: 2, infante: { codigo: 'INF-002', fotografia: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200', persona: { nombres: 'María Elena', apellidos: 'Santana', fechaNacimiento: '2019-08-22', direccion: 'Av. Las Palmas #123' } }, fechaEntrega: null, observaciones: '' },
    { id: 103, infanteId: 3, infante: { codigo: 'INF-003', fotografia: null, persona: { nombres: 'Luis Alberto', apellidos: 'Gómez', fechaNacimiento: '2017-12-15', direccion: 'Cooperativa 15 de Agosto' } }, fechaEntrega: '2026-02-20', observaciones: '' },
    { id: 104, infanteId: 4, infante: { codigo: 'INF-004', fotografia: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200', persona: { nombres: 'Ana Sofía', apellidos: 'Mendoza', fechaNacimiento: '2020-01-05', direccion: 'Frente al Parque Infantil' } }, fechaEntrega: null, observaciones: '' },
    { id: 105, infanteId: 5, infante: { codigo: 'INF-005', fotografia: null, persona: { nombres: 'Diego Jose', apellidos: 'Torres', fechaNacimiento: '2018-11-20', direccion: 'Calle Principal S/N' } }, fechaEntrega: '2026-03-01', observaciones: 'Recibió representante' },
    { id: 106, infanteId: 6, infante: { codigo: 'INF-006', fotografia: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', persona: { nombres: 'Carmen Lucia', apellidos: 'Vargas', fechaNacimiento: '2019-03-14', direccion: 'Lomas de Urdesa, Mz 4' } }, fechaEntrega: null, observaciones: '' },
    { id: 107, infanteId: 7, infante: { codigo: 'INF-007', fotografia: null, persona: { nombres: 'Roberto Carlos', apellidos: 'Mejía', fechaNacimiento: '2017-06-30', direccion: 'Atrás de la Iglesia' } }, fechaEntrega: '2026-01-15', observaciones: '' },
    { id: 108, infanteId: 8, infante: { codigo: 'INF-008', fotografia: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', persona: { nombres: 'Isabella Rosa', apellidos: 'Castillo', fechaNacimiento: '2020-09-02', direccion: 'Esq. Juan Tanca Marengo' } }, fechaEntrega: null, observaciones: '' },
];

// ─── MODAL: VER DETALLE ───────────────────────────────────────
function DetalleModal({ open, item, tipoLabel, anio, canWrite, onClose, onMarcarEntregado }) {
    if (!item) return null;
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Typography variant="h6" fontWeight={800}>Detalle de Entrega</Typography>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 0 }}>
                <Box>
                    {/* Header con avatar */}
                    <Box sx={{ p: 3, display: 'flex', gap: 3, alignItems: 'center', bgcolor: alpha(CCO.azul, 0.03) }}>
                        <Avatar
                            src={item.infante?.fotografia}
                            sx={{ width: 90, height: 90, borderRadius: 3, border: `3px solid ${CCO.azul}`, boxShadow: '0 8px 16px rgba(0,0,0,0.1)', fontSize: 36 }}
                        >
                            {item.infante?.persona?.nombres?.charAt(0)}
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight={900} color="primary">
                                {item.infante?.persona?.nombres} {item.infante?.persona?.apellidos}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={700}>
                                Código: {item.infante?.codigo}
                            </Typography>
                            <Chip
                                label={tipoLabel}
                                size="small"
                                sx={{ mt: 1, fontWeight: 800, bgcolor: alpha(CCO.naranja, 0.1), color: CCO.naranja }}
                            />
                        </Box>
                    </Box>

                    <Box sx={{ p: 3 }}>
                        {/* Info General */}
                        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InfoIcon fontSize="small" color="primary" /> Información General
                        </Typography>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary" display="block">Fecha de Nacimiento</Typography>
                                <Typography variant="body2" fontWeight={600}>{item.infante?.persona?.fechaNacimiento || 'No registrada'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary" display="block">Dirección</Typography>
                                <Typography variant="body2" fontWeight={600}>{item.infante?.persona?.direccion || 'No registrada'}</Typography>
                            </Grid>
                        </Grid>

                        <Divider sx={{ mb: 3 }} />

                        {/* Estado de entrega */}
                        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon fontSize="small" color="primary" /> Estado de Entrega {anio}
                        </Typography>
                        <Box sx={{ p: 2, borderRadius: 3, bgcolor: item.fechaEntrega ? alpha('#4caf50', 0.1) : alpha(CCO.naranja, 0.1) }}>
                            <Typography variant="body2" fontWeight={700} color={item.fechaEntrega ? '#2e7d32' : CCO.naranja}>
                                {item.fechaEntrega
                                    ? `✅ Entregado el: ${item.fechaEntrega}`
                                    : `⏳ Pendiente de entrega: ${tipoLabel}`}
                            </Typography>
                            {item.observaciones && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                    Obs: {item.observaciones}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2, fontWeight: 700 }}>Cerrar</Button>
                {!item.fechaEntrega && canWrite && (
                    <Button
                        variant="contained" color="success"
                        startIcon={<CheckIcon />}
                        onClick={() => { onMarcarEntregado(item.infanteId); onClose(); }}
                        sx={{ borderRadius: 3, px: 3, fontWeight: 800, textTransform: 'none' }}
                    >
                        Marcar como Entregado
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

// ─── MODAL: REGISTRAR ENTREGA ─────────────────────────────────
function RegistrarEntregaModal({ open, item, tipo, anio, onClose, onConfirm }) {
    const today = new Date().toISOString().split('T')[0];
    const [fecha, setFecha] = useState(today);
    const [observaciones, setObservaciones] = useState('');
    const [saving, setSaving] = useState(false);

    // Reset cuando abre el modal
    useEffect(() => {
        if (open) { setFecha(today); setObservaciones(''); }
    }, [open]); // eslint-disable-line

    const handleConfirm = async () => {
        setSaving(true);
        await onConfirm({ infanteId: item?.infanteId, tipo, anio, fechaEntrega: fecha, observaciones, estado: 'entregado' });
        setSaving(false);
        onClose();
    };

    if (!item) return null;
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShippingIcon color="success" />
                    <Typography variant="h6" fontWeight={800}>Registrar Entrega</Typography>
                </Box>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent>
                {/* Resumen del infante */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 3, bgcolor: alpha(CCO.azul, 0.05), mb: 3 }}>
                    <Avatar
                        src={item.infante?.fotografia}
                        sx={{ width: 56, height: 56, borderRadius: 2, border: `2px solid ${CCO.azul}` }}
                    >
                        {item.infante?.persona?.nombres?.charAt(0)}
                    </Avatar>
                    <Box>
                        <Typography fontWeight={800}>
                            {item.infante?.persona?.nombres} {item.infante?.persona?.apellidos}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{item.infante?.codigo}</Typography>
                    </Box>
                </Box>

                <Stack spacing={2.5}>
                    <TextField
                        label="Tipo de Entrega"
                        value={tipo === 'regalo_navidad' ? '🎁 Regalo de Navidad' : '🎒 Kit Escolar'}
                        InputProps={{ readOnly: true }}
                        size="small"
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <TextField
                        label="Fecha de Entrega"
                        type="date"
                        value={fecha}
                        onChange={e => setFecha(e.target.value)}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ max: today }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <TextField
                        label="Observaciones (opcional)"
                        value={observaciones}
                        onChange={e => setObservaciones(e.target.value)}
                        size="small"
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Ej: Recibió la mamá, estado del kit, etc."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                </Stack>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2, fontWeight: 700 }}>Cancelar</Button>
                <Button
                    variant="contained" color="success"
                    startIcon={<CheckIcon />}
                    onClick={handleConfirm}
                    disabled={saving || !fecha}
                    sx={{ borderRadius: 3, px: 3, fontWeight: 800, textTransform: 'none' }}
                >
                    {saving ? 'Guardando...' : 'Confirmar Entrega'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────
export default function RegalosPage() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const anio = new Date().getFullYear();
    // En modo demo (sin sesión activa), se muestran los controles de escritura igualmente
    const canWrite = !user?.rol || ['admin', 'director', 'secretaria'].includes(user?.rol);

    const [tipo, setTipo] = useState('regalo_navidad');
    const [pendientes, setPendientes] = useState([]);
    const [total, setTotal] = useState(0);
    const [entregados, setEntregados] = useState(0);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);


    // Modales
    const [detalleItem, setDetalleItem] = useState(null);
    const [entregaItem, setEntregaItem] = useState(null);

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const [allRes, pendRes] = await Promise.all([
                regalosService.listar({ tipo, anio, limit: 1000 }),
                regalosService.pendientes({ tipo, anio }),
            ]);

            const hasData = allRes.data?.length > 0 || pendRes.data?.length > 0;

            if (hasData) {
                const t = allRes.meta?.total || allRes.data?.length || 0;
                const p = pendRes.data?.length || 0;
                setTotal(t);
                setEntregados(t - p);
                setPendientes(pendRes.data || []);
            } else {
                setTotal(45);
                setEntregados(28);
                setPendientes(MOCK_LIST.filter(i => !i.fechaEntrega));
            }
        } catch (err) {
            console.error(err);
            enqueueSnackbar('Cargando en modo demo', { variant: 'info' });
            setTotal(45);
            setEntregados(28);
            setPendientes(MOCK_LIST.filter(i => !i.fechaEntrega));
        } finally {
            setLoading(false);
        }
    }, [tipo, anio, enqueueSnackbar]);

    useEffect(() => { cargar(); }, [cargar]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            await importService.importarRegalos(file);
            enqueueSnackbar('Importación exitosa', { variant: 'success' });
            cargar();
        } catch (err) {
            console.error(err);
            enqueueSnackbar('Error al importar archivo', { variant: 'error' });
        } finally {
            setUploading(false);
            event.target.value = null;
        }
    };

    const marcarEntregado = async ({ infanteId, tipo: t, anio: a, fechaEntrega, observaciones, estado }) => {
        try {
            await regalosService.crear({ tipo: t || tipo, anio: a || anio, infanteId, estado: estado || 'entregado', fechaEntrega: fechaEntrega || new Date().toISOString().split('T')[0], observaciones });
            enqueueSnackbar('Entrega registrada correctamente', { variant: 'success' });
            cargar();
        } catch {
            enqueueSnackbar('Error al registrar entrega', { variant: 'error' });
        }
    };

    const porcentaje = total > 0 ? Math.round((entregados / total) * 100) : 0;
    const tipoLabel = tipo === 'regalo_navidad' ? '🎁 Navidad' : '🎒 Kit Escolar';


    // ── Columnas de la tabla ──────────────────────────────────
    const columns = [
        {
            field: 'infante',
            headerName: 'Infante',
            renderCell: r => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                        src={r.infante?.fotografia}
                        sx={{
                            width: 38, height: 38, borderRadius: '10px',
                            bgcolor: alpha(CCO.azul, 0.15), color: CCO.azul,
                            fontWeight: 800, fontSize: 16
                        }}
                    >
                        {r.infante?.persona?.nombres?.charAt(0)}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight={700}>
                            {r.infante?.persona?.nombres} {r.infante?.persona?.apellidos}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {r.infante?.codigo}
                        </Typography>
                    </Box>
                </Box>
            )
        },
        {
            field: 'estado',
            headerName: 'Estado',
            renderCell: () => (
                <Chip
                    label="Pendiente"
                    size="small"
                    icon={<PendingIcon sx={{ fontSize: '14px !important' }} />}
                    sx={{
                        fontWeight: 700, fontSize: 11,
                        bgcolor: alpha(CCO.naranja, 0.1), color: CCO.naranja,
                        border: `1px solid ${alpha(CCO.naranja, 0.25)}`
                    }}
                />
            )
        },
        {
            field: 'acciones',
            headerName: 'Acciones',
            align: 'right',
            renderCell: r => (
                <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                    {/* Ver detalle */}
                    <Tooltip title="Ver detalle" arrow>
                        <IconButton
                            size="small"
                            onClick={() => setDetalleItem(r)}
                            sx={{
                                color: theme.palette.info.main,
                                bgcolor: alpha(theme.palette.info.main, 0.08),
                                borderRadius: 2,
                                '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.18) }
                            }}
                        >
                            <ViewIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    {/* Registrar entrega */}
                    {canWrite && (
                        <Tooltip title="Registrar entrega" arrow>
                            <IconButton
                                size="small"
                                onClick={() => setEntregaItem(r)}
                                sx={{
                                    color: '#2e7d32',
                                    bgcolor: alpha('#4caf50', 0.1),
                                    borderRadius: 2,
                                    '&:hover': { bgcolor: alpha('#4caf50', 0.2) }
                                }}
                            >
                                <LocalShippingIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>
            )
        },
    ];

    return (
        <MainLayout>
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>

                {/* ── Header ── */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={900} sx={{
                            background: `linear-gradient(45deg, ${CCO.azul}, ${CCO.naranja})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 0.5
                        }}>
                            Gestión de Regalos {anio}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" fontWeight={500}>
                            Control y seguimiento de entregas anuales
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1.5} flexWrap="wrap">
                        {/* Botón: Registrar entrega manual (sin infante específico) */}
                        {canWrite && (
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => setEntregaItem({ infanteId: null, infante: { codigo: '', persona: { nombres: 'Seleccionar', apellidos: 'Infante' } } })}
                                sx={{
                                    borderRadius: 3, px: 2.5, py: 1.2, fontWeight: 700,
                                    textTransform: 'none', borderColor: CCO.celeste, color: CCO.celeste,
                                    '&:hover': { bgcolor: alpha(CCO.celeste, 0.08), borderColor: CCO.celeste }
                                }}
                            >
                                Nueva Entrega
                            </Button>
                        )}

                        {/* Botón: Importar Excel */}
                        {canWrite && (
                            <>
                                <input
                                    accept=".xlsx, .xls, .csv"
                                    style={{ display: 'none' }}
                                    id="excel-upload"
                                    type="file"
                                    onChange={handleFileUpload}
                                />
                                <label htmlFor="excel-upload">
                                    <Button
                                        variant="contained"
                                        component="span"
                                        startIcon={uploading ? null : <UploadIcon />}
                                        disabled={uploading}
                                        sx={{
                                            borderRadius: 3, px: 3, py: 1.2, fontWeight: 800,
                                            bgcolor: CCO.azul, textTransform: 'none',
                                            boxShadow: '0 4px 14px rgba(0,78,137,0.3)',
                                            '&:hover': { bgcolor: '#003d6b' }
                                        }}
                                    >
                                        {uploading ? 'Procesando...' : 'Importar Excel'}
                                    </Button>
                                </label>
                            </>
                        )}
                    </Stack>
                </Box>

                {/* ── KPIs ── */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {/* Progreso */}
                    <Grid item xs={12} md={7}>
                        <Card elevation={0} sx={{
                            borderRadius: 4,
                            bgcolor: isDark ? alpha('#fff', 0.03) : '#fff',
                            border: '1px solid', borderColor: 'divider',
                            overflow: 'hidden', position: 'relative', height: '100%'
                        }}>
                            <Box sx={{ position: 'absolute', top: 0, right: 0, p: 2, opacity: 0.08, transform: 'rotate(15deg) scale(1.5)' }}>
                                {tipo === 'regalo_navidad' ? <GiftIcon sx={{ fontSize: 100 }} /> : <BackpackIcon sx={{ fontSize: 100 }} />}
                            </Box>
                            <CardContent sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <TextField
                                        select size="small" label="Tipo de Entrega" value={tipo}
                                        onChange={e => setTipo(e.target.value)}
                                        sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 3, fontWeight: 700 } }}
                                    >
                                        <MenuItem value="regalo_navidad">🎁 Regalo de Navidad</MenuItem>
                                        <MenuItem value="kit_escolar">🎒 Kit Escolar</MenuItem>
                                    </TextField>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2 }}>
                                    <Typography variant="h3" fontWeight={900} color="primary" sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                        {entregados}
                                        <Typography variant="h6" component="span" color="text.secondary" fontWeight={500}>
                                            / {total} entregados
                                        </Typography>
                                    </Typography>
                                    <Chip label={`${porcentaje}%`} color="primary" sx={{ fontWeight: 900, borderRadius: 2, height: 32 }} />
                                </Box>

                                <LinearProgress
                                    variant="determinate" value={porcentaje}
                                    sx={{
                                        height: 14, borderRadius: 7, bgcolor: alpha(CCO.azul, 0.1),
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 7,
                                            background: `linear-gradient(90deg, ${CCO.azul}, #4facfe)`
                                        }
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Stats */}
                    <Grid item xs={12} md={5}>
                        <Stack spacing={2} height="100%">
                            <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', p: 2.5, flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: alpha('#4caf50', 0.1), color: '#4caf50' }}>
                                        <SuccessIcon />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Completados</Typography>
                                        <Typography variant="h6" fontWeight={800}>{entregados} Niños</Typography>
                                    </Box>
                                </Box>
                            </Card>
                            <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', p: 2.5, flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: alpha(CCO.naranja, 0.1), color: CCO.naranja }}>
                                        <PendingIcon />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Pendientes</Typography>
                                        <Typography variant="h6" fontWeight={800}>{pendientes.length} Niños</Typography>
                                    </Box>
                                </Box>
                            </Card>
                        </Stack>
                    </Grid>
                </Grid>

                {/* ── Tabla de pendientes ── */}
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        ⏳ Lista de Pendientes
                        <Chip label={pendientes.length} size="small" sx={{ fontWeight: 800, bgcolor: alpha(CCO.azul, 0.1), color: CCO.azul }} />
                    </Typography>
                </Box>

                <DataTable
                    columns={columns}
                    rows={pendientes}
                    loading={loading}
                    searchPlaceholder="Buscar infante por nombre o código..."
                    actions={false}
                />

                {/* ── Modales ── */}
                <DetalleModal
                    open={Boolean(detalleItem)}
                    item={detalleItem}
                    tipoLabel={tipoLabel}
                    anio={anio}
                    canWrite={canWrite}
                    onClose={() => setDetalleItem(null)}
                    onMarcarEntregado={(infanteId) => marcarEntregado({ infanteId, tipo, anio, fechaEntrega: new Date().toISOString().split('T')[0] })}
                />

                <RegistrarEntregaModal
                    open={Boolean(entregaItem)}
                    item={entregaItem}
                    tipo={tipo}
                    anio={anio}
                    onClose={() => setEntregaItem(null)}
                    onConfirm={marcarEntregado}
                />
            </Box>
        </MainLayout>
    );
}
