import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, Card, CardContent, Grid, Button, Chip, LinearProgress,
    MenuItem, TextField, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
    Divider, Avatar, IconButton, Tooltip, CircularProgress
} from '@mui/material';
import MainLayout from '../../components/layout/MainLayout';
import DataTable from '../../components/common/DataTable';
import { regalosService } from '../../services/appServices';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import { alpha, useTheme } from '@mui/material/styles';
import { utils, writeFile } from 'xlsx';

// Icons
import GiftIcon from '@mui/icons-material/CardGiftcard';
import BackpackIcon from '@mui/icons-material/Backpack';
import DownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/AddCircleOutline';
import SuccessIcon from '@mui/icons-material/CheckCircleOutline';
import PendingIcon from '@mui/icons-material/History';
import ViewIcon from '@mui/icons-material/Visibility';
import CheckIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import CalendarIcon from '@mui/icons-material/CalendarToday';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import StarIcon from '@mui/icons-material/Star';

const CCO = {
    naranja: '#FF6B35',
    azul: '#004E89',
    crema: '#EFEFD0',
    violeta: '#6B2D5C',
    celeste: '#7BAE7F'
};

// ─── Componentes ──────────────────────────────────────────────

function DetalleModal({ open, item, tipoLabel, onClose }) {
    if (!item) return null;
    const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace('/api/v1', '');

    const entregadoPorNombre = item.entregadoPor?.persona 
        ? `${item.entregadoPor.persona.nombres} ${item.entregadoPor.persona.apellidos}`
        : item.entregadoPor?.username || 'Sistema';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Typography variant="h6" fontWeight={800}>Detalle de Entrega</Typography>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 0 }}>
                <Box>
                    <Box sx={{ p: 3, display: 'flex', gap: 3, alignItems: 'center', bgcolor: alpha(CCO.azul, 0.03) }}>
                        <Avatar
                            src={item.infante?.fotografia ? `${baseURL}${item.infante.fotografia}` : ''}
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
                                sx={{ mt: 1, fontWeight: 800, bgcolor: alpha(CCO.naranja, 0.1), color: CCO.naranja, textTransform: 'uppercase', fontSize: 10 }}
                            />
                        </Box>
                    </Box>

                    <Box sx={{ p: 3 }}>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InfoIcon fontSize="small" color="primary" /> Estado del Proceso
                        </Typography>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary" display="block">Estado</Typography>
                                <Chip 
                                    label={item.estado === 'entregado' ? 'Entregado' : 'Pendiente'} 
                                    size="small"
                                    color={item.estado === 'entregado' ? 'success' : 'warning'}
                                    sx={{ fontWeight: 700 }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary" display="block">Año / Gestión</Typography>
                                <Typography variant="body2" fontWeight={700}>{item.anio}</Typography>
                            </Grid>
                        </Grid>

                        {item.estado === 'entregado' && (
                            <>
                                <Divider sx={{ mb: 3 }} />
                                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SuccessIcon fontSize="small" color="success" /> Detalles de Entrega
                                </Typography>
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary" display="block">Entregado por</Typography>
                                        <Typography variant="body2" fontWeight={700} color="primary">{entregadoPorNombre}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary" display="block">Fecha de Entrega</Typography>
                                        <Typography variant="body2" fontWeight={700}>
                                            {item.fechaEntrega ? new Date(item.fechaEntrega).toLocaleDateString() : 'N/A'}
                                        </Typography>
                                    </Grid>
                                </Grid>

                                {item.foto && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>Evidencia Fotográfica</Typography>
                                        <Box 
                                            component="img"
                                            src={`${baseURL}${item.foto}`}
                                            sx={{ width: '100%', borderRadius: 3, boxShadow: '0 8px 16px rgba(0,0,0,0.1)', border: '1px solid', borderColor: 'divider' }}
                                        />
                                    </Box>
                                )}
                            </>
                        )}

                        {item.estado !== 'entregado' && (
                            <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(CCO.naranja, 0.05), border: '1px dashed', borderColor: CCO.naranja }}>
                                <Typography variant="body2" color={CCO.naranja} fontWeight={600} align="center">
                                    Este regalo aún no ha sido entregado.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2, bgcolor: CCO.azul, textTransform: 'none', fontWeight: 800 }}>Cerrar</Button>
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
    const fileInputRef = useRef(null);
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const [anio, setAnio] = useState(new Date().getFullYear());
    const [tipo, setTipo] = useState('regalo_navidad');
    const [regalos, setRegalos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    
    // Quick Upload State
    const [activeRegaloId, setActiveRegaloId] = useState(null);
    const [generating, setGenerating] = useState(false);

    // Modales
    const [detalleItem, setDetalleItem] = useState(null);
    
    const canWrite = !user?.rol || ['admin', 'director', 'secretaria'].includes(user?.rol);

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const res = await regalosService.listar({ tipo, anio, limit: 1000 });
            setRegalos(res.data || []);
        } catch (err) {
            console.error(err);
            enqueueSnackbar('Error al cargar datos de la API', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [tipo, anio, enqueueSnackbar]);

    useEffect(() => { cargar(); }, [cargar]);

    const handleGenerarLote = async () => {
        setGenerating(true);
        try {
            const res = await regalosService.generarLote({ tipo, anio: parseInt(anio) });
            // La respuesta viene como { success: true, data: { message, ... } }
            const msg = res.data?.message || res.message || 'Temporada preparada con éxito';
            enqueueSnackbar(msg, { variant: 'success' });
            cargar();
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || 'Error al conectar con el servidor. Por favor, refresca la página.';
            enqueueSnackbar(errorMsg, { variant: 'error' });
        } finally {
            setGenerating(false);
        }
    };

    const handleQuickDeliveryClick = (regaloId) => {
        setActiveRegaloId(regaloId);
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleManualDelivery = async (regaloId) => {
        if (!window.confirm('¿Confirmar entrega sin fotografía?')) return;
        try {
            await regalosService.actualizar(regaloId, { 
                estado: 'entregado', 
                fechaEntrega: new Date() 
            });
            enqueueSnackbar('Entrega confirmada', { variant: 'success' });
            cargar();
        } catch (err) {
            enqueueSnackbar('Error al confirmar entrega', { variant: 'error' });
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeRegaloId) return;

        setUploading(true);
        try {
            await regalosService.subirFoto(activeRegaloId, file);
            enqueueSnackbar('Entrega confirmada con foto exitosamente', { variant: 'success' });
            cargar();
        } catch (error) {
            console.error(error);
            enqueueSnackbar('Error al subir la evidencia de entrega', { variant: 'error' });
        } finally {
            setUploading(false);
            setActiveRegaloId(null);
            e.target.value = '';
        }
    };
    const handleImportExcel = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            await importService.importarRegalos(file, { tipo, anio });
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

    const stats = {
        total: regalos.length,
        entregados: regalos.filter(r => r.estado === 'entregado').length,
        pendientes: regalos.filter(r => r.estado !== 'entregado').length,
    };
    const porcentaje = stats.total > 0 ? Math.round((stats.entregados / stats.total) * 100) : 0;
    
    const tipoLabel = {
        'regalo_navidad': 'Navidad',
        'kit_escolar': 'Kit Escolar',
        'atencion_especial': 'Atención Especial'
    }[tipo] || tipo;

    const columns = [
        {
            field: 'infante',
            headerName: 'Infante',
            renderCell: r => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                        src={r.infante?.fotografia ? `${baseURL}${r.infante.fotografia}` : ''}
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
            field: 'foto',
            headerName: 'Evidencia',
            renderCell: r => (
                r.foto ? (
                    <Box 
                        component="img"
                        src={`${baseURL}${r.foto}`}
                        sx={{ width: 44, height: 34, borderRadius: 1.5, objectFit: 'cover', cursor: 'pointer', border: '1px solid', borderColor: 'divider' }}
                        onClick={() => setDetalleItem(r)}
                    />
                ) : (
                    <Typography variant="caption" color="text.disabled">Sin foto</Typography>
                )
            )
        },
        {
            field: 'estado',
            headerName: 'Estado',
            renderCell: r => (
                <Chip
                    label={r.estado === 'entregado' ? 'Entregado' : 'Pendiente'}
                    size="small"
                    icon={r.estado === 'entregado' ? <SuccessIcon sx={{ fontSize: '14px !important' }} /> : <PendingIcon sx={{ fontSize: '14px !important' }} />}
                    sx={{
                        fontWeight: 700, fontSize: 11,
                        bgcolor: r.estado === 'entregado' ? alpha('#4caf50', 0.1) : alpha(CCO.naranja, 0.1),
                        color: r.estado === 'entregado' ? '#2e7d32' : CCO.naranja,
                        border: `1px solid ${alpha(r.estado === 'entregado' ? '#4caf50' : CCO.naranja, 0.25)}`
                    }}
                />
            )
        },
        {
            field: 'acciones',
            headerName: 'Acciones Rápidas',
            align: 'right',
            renderCell: r => (
                <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
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

                    {canWrite && r.estado !== 'entregado' && (
                        <>
                            <Tooltip title="Confirmar con Foto (Fácil)" arrow>
                                <IconButton
                                    size="small"
                                    onClick={() => handleQuickDeliveryClick(r.id)}
                                    disabled={uploading && activeRegaloId === r.id}
                                    sx={{
                                        color: CCO.azul,
                                        bgcolor: alpha(CCO.azul, 0.1),
                                        borderRadius: 2,
                                        '&:hover': { bgcolor: alpha(CCO.azul, 0.2) }
                                    }}
                                >
                                    {uploading && activeRegaloId === r.id ? <CircularProgress size={18} /> : <PhotoCameraIcon fontSize="small" />}
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Confirmar sin Foto" arrow>
                                <IconButton
                                    size="small"
                                    onClick={() => handleManualDelivery(r.id)}
                                    sx={{
                                        color: '#2e7d32',
                                        bgcolor: alpha('#4caf50', 0.1),
                                        borderRadius: 2,
                                        '&:hover': { bgcolor: alpha('#4caf50', 0.2) }
                                    }}
                                >
                                    <CheckIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </Stack>
            )
        },
    ];

    return (
        <MainLayout>
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
                
                {/* Inputs ocultos */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                    onChange={handleFileChange} 
                />

                {/* ── Header ── */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={900} sx={{
                            background: `linear-gradient(45deg, ${CCO.azul}, ${CCO.naranja})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 0.5
                        }}>
                            Gestión de Entregas
                        </Typography>
                        <Typography variant="body1" color="text.secondary" fontWeight={500}>
                            Control ágil de suministros y regalos anuales
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1.5} flexWrap="wrap">
                        {canWrite && (
                            <Button
                                variant="outlined"
                                startIcon={generating ? <CircularProgress size={16} /> : <StarIcon />}
                                disabled={generating}
                                onClick={handleGenerarLote}
                                sx={{
                                    borderRadius: 3, px: 2.5, py: 1.2, fontWeight: 700,
                                    textTransform: 'none', borderColor: CCO.naranja, color: CCO.naranja,
                                    '&:hover': { bgcolor: alpha(CCO.naranja, 0.08), borderColor: CCO.naranja }
                                }}
                            >
                                Preparar Temporada {anio}
                            </Button>
                        )}

                        {canWrite && (
                            <Button
                                variant="contained"
                                startIcon={<DownloadIcon />}
                                onClick={() => {
                                    const dataToExport = regalos.map(r => ({
                                        'Código': r.infante?.codigo,
                                        'Infante': `${r.infante?.persona?.nombres} ${r.infante?.persona?.apellidos}`,
                                        'Tipo': tipoLabel,
                                        'Año': r.anio,
                                        'Estado': r.estado === 'entregado' ? 'Entregado' : 'Pendiente',
                                        'Fecha Entrega': r.fechaEntrega ? new Date(r.fechaEntrega).toLocaleDateString() : 'N/A',
                                        'Responsable': r.entregadoPor ? `${r.entregadoPor.persona?.nombres} ${r.entregadoPor.persona?.apellidos}` : 'N/A'
                                    }));

                                    const ws = utils.json_to_sheet(dataToExport);
                                    const wb = utils.book_new();
                                    utils.book_append_sheet(wb, ws, "Regalos");
                                    writeFile(wb, `Reporte_Regalos_${tipo}_${anio}.xlsx`);
                                    enqueueSnackbar('Reporte generado con éxito', { variant: 'info' });
                                }}
                                sx={{
                                    borderRadius: 3, px: 2.5, py: 1.2, fontWeight: 700,
                                    textTransform: 'none', bgcolor: '#2e7d32',
                                    '&:hover': { bgcolor: '#1b5e20' }
                                }}
                            >
                                Exportar Listado
                            </Button>
                        )}
                    </Stack>
                </Box>

                {/* ── KPIs y Filtros ── */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={8}>
                        <Card elevation={0} sx={{
                            borderRadius: 4,
                            bgcolor: isDark ? alpha('#fff', 0.03) : '#fff',
                            border: '1px solid', borderColor: 'divider',
                            overflow: 'hidden', height: '100%'
                        }}>
                            <CardContent sx={{ p: 4 }}>
                                <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            select size="small" label="Tipo de Proceso" value={tipo}
                                            onChange={e => setTipo(e.target.value)}
                                            fullWidth
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, fontWeight: 700 } }}
                                        >
                                            <MenuItem value="regalo_navidad">Regalo de Navidad</MenuItem>
                                            <MenuItem value="kit_escolar">Kit Escolar</MenuItem>
                                            <MenuItem value="atencion_especial">Atención Especial</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            select size="small" label="Año" value={anio}
                                            onChange={e => setAnio(parseInt(e.target.value))}
                                            fullWidth
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, fontWeight: 700 } }}
                                        >
                                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                                                <MenuItem key={y} value={y}>{y}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                </Grid>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2 }}>
                                    <Typography variant="h3" fontWeight={900} color="primary" sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                        {stats.entregados}
                                        <Typography variant="h6" component="span" color="text.secondary" fontWeight={500}>
                                            / {stats.total} completados
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

                    <Grid item xs={12} md={4}>
                        <Stack spacing={2} height="100%">
                            <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', p: 3, flex: 1, display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: alpha('#4caf50', 0.1), color: '#4caf50' }}>
                                        <SuccessIcon />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Confirmados</Typography>
                                        <Typography variant="h6" fontWeight={800}>{stats.entregados} Niños</Typography>
                                    </Box>
                                </Box>
                            </Card>
                            <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', p: 3, flex: 1, display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: alpha(CCO.naranja, 0.1), color: CCO.naranja }}>
                                        <PendingIcon />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Pendientes</Typography>
                                        <Typography variant="h6" fontWeight={800}>{stats.pendientes} Niños</Typography>
                                    </Box>
                                </Box>
                            </Card>
                        </Stack>
                    </Grid>
                </Grid>

                {/* ── Tabla Principal ── */}
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" fontWeight={800}>
                        Listado de Seguimiento
                    </Typography>
                </Box>

                <DataTable
                    columns={columns}
                    rows={regalos}
                    loading={loading}
                    searchPlaceholder="Buscar infante..."
                    actions={false}
                />

                <DetalleModal
                    open={Boolean(detalleItem)}
                    item={detalleItem}
                    tipoLabel={tipoLabel}
                    anio={anio}
                    onClose={() => setDetalleItem(null)}
                />
            </Box>
        </MainLayout>
    );
}
