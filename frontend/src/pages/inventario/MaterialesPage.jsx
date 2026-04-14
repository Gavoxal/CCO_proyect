import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Box, Typography, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Stack, IconButton, Tooltip, Avatar, Grid, Card, CardContent,
    CardActions, LinearProgress, Badge, InputAdornment, ToggleButtonGroup,
    ToggleButton, Divider, Skeleton, Alert, Paper, TableContainer, TablePagination,
    CircularProgress
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
    Add as AddIcon,
    SystemUpdateAlt as IngresarIcon,
    CallMade as DespacharIcon,
    Warning as WarningIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    ViewModule as GridViewIcon,
    ViewList as ListViewIcon,
    Close as CloseIcon,
    FilterList as FilterIcon,
    Inventory2 as InventoryIcon,
    PhotoCamera as PhotoIcon,
    CheckCircle as OkIcon,
    ErrorOutline as AlertIcon,
    ClearAll as ClearIcon,
    School as SchoolIcon,
    CleaningServices as CleanIcon,
    Checkroom as ClothesIcon,
    AccessibilityNew as FootwearIcon,
    Toys as ToysIcon,
    Devices as TechIcon,
    Chair as FurnitureIcon,
    MedicalServices as HealthIcon,
    Description as PaperIcon,
    Build as ToolsIcon,
    Church as ChurchIcon,
    MusicNote as MinistryIcon,
    Sync as FungibleIcon,
    Lock as NonFungibleIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import DataTable from '../../components/common/DataTable';
import { materialesService } from '../../services/appServices';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import * as XLSX from 'xlsx';

// ─── Paleta CCO ──────────────────────────────────────────────
const CCO = { naranja: '#FF6B35', azul: '#004E89', crema: '#EFEFD0', violeta: '#6B2D5C', celeste: '#7BAE7F' };

// ─── Icono por categoría ──────────────────────────────────────
const CATEGORIA_ICON = {
    'Útiles escolares': <SchoolIcon />,
    'Limpieza': <CleanIcon />,
    'Ropa': <ClothesIcon />,
    'Calzado': <FootwearIcon />,
    'Juguetes': <ToysIcon />,
    'Tecnología': <TechIcon />,
    'Mobiliario': <FurnitureIcon />,
    'Botiquín': <HealthIcon />,
    'Papelería': <PaperIcon />,
    'Herramientas': <ToolsIcon />,
};

const DEFAULT_ICON = <InventoryIcon />;

// ─── CARD DE MATERIAL ─────────────────────────────────────────
function MaterialCard({ item, canWrite, canDelete, onIngresar, onDespachar, onEditar, onEliminar, onVerFoto }) {
    const { getImageUrl } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const porcentaje = item.stockMinimo > 0 ? Math.min(100, Math.round((item.cantidadDisponible / (item.stockMinimo * 3)) * 100)) : 100;
    const icono = CATEGORIA_ICON[item.categoria] || DEFAULT_ICON;

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 3,
                border: `1.5px solid`,
                borderColor: item.stockBajo ? alpha('#f44336', 0.4) : 'divider',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'visible',
                // ── layout flex para altura uniforme ──
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: '100%',
                '&:hover': {
                    borderColor: item.stockBajo ? '#f44336' : CCO.azul,
                    boxShadow: `0 8px 24px ${alpha(item.stockBajo ? '#f44336' : CCO.azul, 0.12)}`,
                    transform: 'translateY(-2px)',
                }
            }}
        >
            {/* Badge stock bajo — posición absoluta, no afecta el layout */}
            {item.stockBajo && (
                <Box sx={{
                    position: 'absolute', top: -9, right: 12,
                    bgcolor: '#f44336', color: '#fff', borderRadius: 10,
                    px: 1, py: 0.25, fontSize: 10, fontWeight: 800, zIndex: 1,
                    letterSpacing: '0.04em',
                }}>
                    STOCK BAJO
                </Box>
            )}

            {/* ── Contenido principal ocupa el espacio disponible ── */}
            <CardContent sx={{ pb: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Foto / Icono + Info */}
                <Box sx={{ display: 'flex', gap: 1.5, mb: 'auto' }}>
                    <Box
                        onClick={() => onVerFoto && onVerFoto(item)}
                        sx={{
                            width: 52, height: 52, borderRadius: 2, flexShrink: 0,
                            bgcolor: isDark ? alpha('#fff', 0.05) : alpha(CCO.azul, 0.06),
                            border: `1.5px dashed ${alpha(CCO.azul, 0.25)}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', position: 'relative', overflow: 'hidden',
                            '&:hover .photo-overlay': { opacity: 1 },
                        }}
                    >
                        {item.fotografia ? (
                            <Box component="img" src={getImageUrl(item.fotografia)} sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 2 }} />
                        ) : (
                            <Box sx={{ color: alpha(CCO.azul, 0.5) }}>{icono}</Box>
                        )}
                        {canWrite && (
                            <Box className="photo-overlay" sx={{
                                position: 'absolute', inset: 0, bgcolor: alpha('#000', 0.55),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: 0, transition: 'opacity 0.2s', borderRadius: 2,
                            }}>
                                <PhotoIcon sx={{ color: '#fff', fontSize: 16 }} />
                            </Box>
                        )}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Nombre — máx 2 líneas con altura fija */}
                        <Typography
                            variant="body2" fontWeight={700}
                            title={item.nombreMaterial}
                            sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.3,
                                minHeight: '2.6em', // reserva siempre 2 líneas
                                mb: 0.25,
                            }}
                        >
                            {item.nombreMaterial}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                            {item.codigo} · {item.categoria}
                        </Typography>
                        {/* Status Chips */}
                        <Box sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                            {item.fungible && (
                                <Chip
                                    icon={item.fungible === 'Fungible' ? <FungibleIcon sx={{ fontSize: '12px !important' }} /> : <NonFungibleIcon sx={{ fontSize: '12px !important' }} />}
                                    label={item.fungible}
                                    size="small"
                                    sx={{
                                        fontSize: 9, fontWeight: 700,
                                        bgcolor: item.fungible === 'Fungible' ? alpha(CCO.naranja, 0.12) : alpha(CCO.azul, 0.12),
                                        color: item.fungible === 'Fungible' ? CCO.naranja : CCO.azul,
                                        border: `1px solid ${alpha(item.fungible === 'Fungible' ? CCO.naranja : CCO.azul, 0.3)}`,
                                    }}
                                />
                            )}
                            {item.pertenece && (
                                <Chip
                                    icon={item.pertenece === 'Iglesia' ? <ChurchIcon sx={{ fontSize: '12px !important' }} /> : <MinistryIcon sx={{ fontSize: '12px !important' }} />}
                                    label={item.pertenece}
                                    size="small"
                                    sx={{
                                        fontSize: 9, fontWeight: 700,
                                        bgcolor: item.pertenece === 'Iglesia' ? alpha(CCO.celeste, 0.15) : alpha(CCO.violeta, 0.12),
                                        color: item.pertenece === 'Iglesia' ? '#2e7d32' : CCO.violeta,
                                        border: `1px solid ${alpha(item.pertenece === 'Iglesia' ? CCO.celeste : CCO.violeta, 0.35)}`,
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* Stock meter — siempre al fondo del contenido */}
                <Box sx={{ mt: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Stock disponible</Typography>
                        <Typography variant="caption" fontWeight={800} color={item.stockBajo ? 'error.main' : 'success.main'}>
                            {item.cantidadDisponible} / mín {item.stockMinimo}
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={porcentaje}
                        sx={{
                            height: 6, borderRadius: 3,
                            bgcolor: alpha(item.stockBajo ? '#f44336' : '#4caf50', 0.15),
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                bgcolor: item.stockBajo ? '#f44336' : '#4caf50',
                            }
                        }}
                    />
                </Box>
            </CardContent>

            {canWrite && (
                <CardActions sx={{ px: 1.5, pt: 0, pb: 1.5, gap: 0.5 }}>
                    <Tooltip title="Ingresar stock" arrow>
                        <IconButton size="small" color="success" onClick={() => onIngresar(item)}
                            sx={{ bgcolor: alpha('#4caf50', 0.08), borderRadius: 1.5, '&:hover': { bgcolor: alpha('#4caf50', 0.18) } }}>
                            <IngresarIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Despachar" arrow>
                        <IconButton size="small" color="warning" onClick={() => onDespachar(item)}
                            sx={{ bgcolor: alpha('#ff9800', 0.08), borderRadius: 1.5, '&:hover': { bgcolor: alpha('#ff9800', 0.18) } }}>
                            <DespacharIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar" arrow>
                        <IconButton size="small" onClick={() => onEditar(item)}
                            sx={{ bgcolor: alpha(CCO.azul, 0.08), borderRadius: 1.5, '&:hover': { bgcolor: alpha(CCO.azul, 0.18) } }}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {canDelete && (
                        <Tooltip title="Eliminar" arrow>
                            <IconButton size="small" color="error" onClick={() => onEliminar(item.id)}
                                sx={{ bgcolor: alpha('#f44336', 0.08), borderRadius: 1.5, '&:hover': { bgcolor: alpha('#f44336', 0.18) }, ml: 'auto' }}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </CardActions>
            )}
        </Card>
    );
}

// ─── MODAL: FORMULARIO MATERIAL ───────────────────────────────
function MaterialFormModal({ open, tipo, item, onClose, onConfirm }) {
    const EMPTY = { codigo: '', nombreMaterial: '', categoria: '', area: '', marca: '', numeroSerie: '', stockMinimo: 5, fungible: 'Fungible', pertenece: 'Iglesia' };
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) setForm(item ? { ...item } : EMPTY);
    }, [open]); // eslint-disable-line

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async () => {
        setSaving(true);
        await onConfirm(form);
        setSaving(false);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Typography fontWeight={800}>{tipo === 'crear' ? 'Nuevo Material' : 'Editar Material'}</Typography>
                <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="Código / SKU *" value={form.codigo} onChange={e => set('codigo', e.target.value)} size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField label="Stock mínimo" type="number" value={form.stockMinimo} onChange={e => set('stockMinimo', parseInt(e.target.value) || 0)} size="small" sx={{ width: 130, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Box>
                    <TextField label="Nombre del material *" value={form.nombreMaterial} onChange={e => set('nombreMaterial', e.target.value)} size="small" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="Categoría" value={form.categoria} onChange={e => set('categoria', e.target.value)} size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField label="Área" value={form.area || ''} onChange={e => set('area', e.target.value)} size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Box>

                    {/* ── Tipo: Fungible / No Fungible ── */}
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.75, display: 'block' }}>Tipo de material</Typography>
                        <ToggleButtonGroup
                            exclusive
                            value={form.fungible}
                            onChange={(_, v) => v && set('fungible', v)}
                            size="small"
                            fullWidth
                        >
                            <ToggleButton value="Fungible" sx={{ flex: 1, borderRadius: '8px 0 0 8px', fontWeight: 700, fontSize: 12,
                                '&.Mui-selected': { bgcolor: alpha(CCO.naranja, 0.15), color: CCO.naranja, borderColor: alpha(CCO.naranja, 0.4) } }}>
                                Fungible
                            </ToggleButton>
                            <ToggleButton value="No Fungible" sx={{ flex: 1, borderRadius: '0 8px 8px 0', fontWeight: 700, fontSize: 12,
                                '&.Mui-selected': { bgcolor: alpha(CCO.azul, 0.15), color: CCO.azul, borderColor: alpha(CCO.azul, 0.4) } }}>
                                No Fungible
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {/* ── Pertenece: Iglesia / Ministerio ── */}
                    <TextField select label="Pertenece a" value={form.pertenece || 'Iglesia'} onChange={e => set('pertenece', e.target.value)} size="small" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                        <MenuItem value="Iglesia">Iglesia</MenuItem>
                        <MenuItem value="Ministerio">Ministerio</MenuItem>
                    </TextField>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="Marca" value={form.marca || ''} onChange={e => set('marca', e.target.value)} size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField label="N° Serie / Código de Barras" value={form.numeroSerie || ''} onChange={e => set('numeroSerie', e.target.value)} size="small" sx={{ flex: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Box>
                    <Alert severity="info" sx={{ borderRadius: 2, fontSize: 12 }}>
                        La foto del material se puede subir desde la vista de tarjetas después de crear el item.
                    </Alert>
                </Stack>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2, fontWeight: 700 }}>Cancelar</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={saving || !form.codigo || !form.nombreMaterial}
                    sx={{ borderRadius: 3, px: 3, fontWeight: 800, textTransform: 'none', bgcolor: CCO.azul }}>
                    {saving ? 'Guardando...' : tipo === 'crear' ? 'Crear Material' : 'Guardar Cambios'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ─── MODAL: STOCK ─────────────────────────────────────────────
function StockModal({ open, tipo, item, onClose, onConfirm }) {
    const [cantidad, setCantidad] = useState(1);
    const [nota, setNota] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { if (open) { setCantidad(1); setNota(''); } }, [open]);

    const handleSubmit = async () => {
        setSaving(true);
        await onConfirm(item?.id, cantidad, nota);
        setSaving(false);
        onClose();
    };

    const esIngreso = tipo === 'ingresar';
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Typography fontWeight={800}>{esIngreso ? 'Ingresar Stock' : 'Despachar Stock'}</Typography>
                <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent>
                {item && (
                    <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: alpha(CCO.azul, 0.05), display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Box sx={{ color: CCO.azul }}>{CATEGORIA_ICON[item.categoria] || DEFAULT_ICON}</Box>
                        <Box>
                            <Typography fontWeight={700} fontSize={14}>{item.nombreMaterial}</Typography>
                            <Typography variant="caption" color="text.secondary">Stock actual: <strong>{item.cantidadDisponible}</strong></Typography>
                        </Box>
                    </Box>
                )}
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField
                        label={`Cantidad a ${esIngreso ? 'ingresar' : 'despachar'}`}
                        type="number" value={cantidad}
                        onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                        size="small" fullWidth
                        inputProps={{ min: 1, max: esIngreso ? 9999 : item?.cantidadDisponible }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <TextField
                        label="Nota / Motivo (opcional)" value={nota}
                        onChange={e => setNota(e.target.value)}
                        size="small" fullWidth multiline rows={2}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    {!esIngreso && item && cantidad > item.cantidadDisponible && (
                        <Alert severity="error" sx={{ borderRadius: 2, py: 0.5 }}>No hay suficiente stock disponible</Alert>
                    )}
                </Stack>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2, fontWeight: 700 }}>Cancelar</Button>
                <Button
                    variant="contained" color={esIngreso ? 'success' : 'warning'} onClick={handleSubmit}
                    disabled={saving || cantidad < 1 || (!esIngreso && item && cantidad > item.cantidadDisponible)}
                    sx={{ borderRadius: 3, px: 3, fontWeight: 800, textTransform: 'none' }}
                >
                    {saving ? 'Procesando...' : esIngreso ? 'Confirmar Ingreso' : 'Confirmar Despacho'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ─── MODAL: FOTO ──────────────────────────────────────────────
function FotoModal({ open, item, onClose, onSubirFoto }) {
    const { getImageUrl } = useAuth();
    const fileRef = useRef();
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => { if (open) setPreview(item?.fotografia || null); }, [open, item]);

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreview(url);
    };

    const handleUpload = async () => {
        const file = fileRef.current?.files[0];
        if (!file) return;
        setUploading(true);
        await onSubirFoto(item.id, file);
        setUploading(false);
        onClose();
    };

    if (!item) return null;
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Typography fontWeight={800}>Foto del Material</Typography>
                <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent>
                <Typography variant="body2" fontWeight={700} sx={{ mb: 2 }}>{item.nombreMaterial}</Typography>
                <Box
                    onClick={() => fileRef.current?.click()}
                    sx={{
                        width: '100%', aspectRatio: '4/3', borderRadius: 3,
                        border: `2px dashed ${alpha(CCO.azul, 0.4)}`,
                        bgcolor: alpha(CCO.azul, 0.03),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', overflow: 'hidden',
                        '&:hover': { borderColor: CCO.azul, bgcolor: alpha(CCO.azul, 0.06) }
                    }}
                >
                    {preview ? (
                        <Box component="img" src={preview.startsWith('blob:') ? preview : getImageUrl(preview)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <Stack alignItems="center" spacing={1}>
                            <PhotoIcon sx={{ fontSize: 48, color: alpha(CCO.azul, 0.4) }} />
                            <Typography variant="caption" color="text.secondary">Haz clic para subir una foto</Typography>
                        </Stack>
                    )}
                </Box>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                    Máximo 5MB · Formatos: JPG, PNG, WebP
                </Typography>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2, fontWeight: 700 }}>Cancelar</Button>
                <Button onClick={() => fileRef.current?.click()} color="inherit" sx={{ borderRadius: 2, fontWeight: 700 }}>Cambiar foto</Button>
                <Button variant="contained" onClick={handleUpload} disabled={uploading || !preview}
                    sx={{ borderRadius: 3, px: 3, fontWeight: 800, textTransform: 'none', bgcolor: CCO.azul }}>
                    {uploading ? 'Subiendo...' : 'Guardar Foto'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ═══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function MaterialesPage() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { user, getImageUrl } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const canWrite = !user?.rol || ['admin', 'director', 'secretaria', 'tutor_especial'].includes(user?.rol);
    const canDelete = !user?.rol || ['admin', 'director'].includes(user?.rol);

    // ── Estado ────────────────────────────────────────────────
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [alertas, setAlertas] = useState({ stockBajo: [], desactualizados: [] });

    // Paginación
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(24);

    // Filtros
    const [buscar, setBuscar] = useState('');
    const [debouncedBuscar, setDebouncedBuscar] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroStock, setFiltroStock] = useState(''); // 'bajo' | 'ok' | ''
    const [filtroFungible, setFiltroFungible] = useState(''); // 'Fungible' | 'No Fungible' | ''
    const [filtroPertenece, setFiltroPertenece] = useState(''); // 'Iglesia' | 'Ministerio' | ''

    // Debounce búsqueda
    useEffect(() => {
        const t = setTimeout(() => setDebouncedBuscar(buscar), 400);
        return () => clearTimeout(t);
    }, [buscar]);

    // Vista
    const [vistaMode, setVistaMode] = useState('cards'); // 'cards' | 'tabla'

    // Modales
    const [formModal, setFormModal] = useState({ open: false, tipo: null, item: null });
    const [stockModal, setStockModal] = useState({ open: false, tipo: null, item: null });
    const [fotoModal, setFotoModal] = useState({ open: false, item: null });

    // Importación Excel
    const importRef = useRef(null);
    const [importing, setImporting] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [importData, setImportData] = useState([]);
    const [importColumns, setImportColumns] = useState([]);
    const [importFileName, setImportFileName] = useState('');
    const [lastSelectedFile, setLastSelectedFile] = useState(null);
    const [exportando, setExportando] = useState(false);

    // ── Carga ─────────────────────────────────────────────────
    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: page + 1,
                limit: rowsPerPage,
                buscar: debouncedBuscar,
                categoria: filtroCategoria,
                stockBajo: filtroStock === 'bajo' ? 'true' : undefined,
                fungible: filtroFungible,
                pertenece: filtroPertenece
            };

            const [res, alertRes] = await Promise.all([
                materialesService.listar(params),
                materialesService.alertas(),
            ]);
            
            setRows(res.data || []);
            setTotal(res.meta?.total || 0);
            setAlertas(alertRes.data || { stockBajoCount: 0, desactualizados: [] });
        } catch (err) {
            enqueueSnackbar('Error al cargar datos del inventario', { variant: 'error' });
            setRows([]);
            setTotal(0);
            setAlertas({ stockBajoCount: 0, desactualizados: [] });
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar, page, rowsPerPage, debouncedBuscar, filtroCategoria, filtroStock, filtroFungible, filtroPertenece]);

    useEffect(() => { cargar(); }, [cargar]);

    useEffect(() => {
        // Reset page on filter change
        setPage(0);
    }, [debouncedBuscar, filtroCategoria, filtroStock, filtroFungible, filtroPertenece]);

    // Categorías únicas (En un sistema con paginación, idealmente esto vendría de un endpoint de maestros, 
    // pero por ahora lo sacamos de los rows actuales o una lista estática si es necesario)
    const categorias = useMemo(() => [...new Set(rows.map(r => r.categoria).filter(Boolean))].sort(), [rows]);

    const hayFiltros = buscar || filtroCategoria || filtroStock || filtroFungible || filtroPertenece;

    // ── Handlers ──────────────────────────────────────────────
    const handleAccionForm = async (form) => {
        try {
            if (formModal.tipo === 'crear') await materialesService.crear({ ...form, cantidadDisponible: 0 });
            if (formModal.tipo === 'editar') await materialesService.actualizar(formModal.item.id, form);
            enqueueSnackbar('Operación exitosa', { variant: 'success' });
            setFormModal(m => ({ ...m, open: false }));
            cargar();
        } catch (err) {
            enqueueSnackbar(err?.response?.data?.error || 'Error al guardar', { variant: 'error' });
        }
    };

    const handleStock = async (id, cantidad) => {
        try {
            if (stockModal.tipo === 'ingresar') await materialesService.ingresar(id, cantidad);
            else await materialesService.despachar(id, cantidad);
            enqueueSnackbar(stockModal.tipo === 'ingresar' ? 'Stock ingresado' : 'Stock despachado', { variant: 'success' });
            cargar();
        } catch (err) {
            enqueueSnackbar(err?.response?.data?.error || 'Error de stock', { variant: 'error' });
        }
    };

    const handleEliminar = async (id) => {
        if (!window.confirm('¿Eliminar este material del inventario?')) return;
        try { await materialesService.eliminar(id); enqueueSnackbar('Material eliminado', { variant: 'success' }); cargar(); }
        catch { enqueueSnackbar('Error al eliminar', { variant: 'error' }); }
    };

    const handleExportarExcel = async () => {
        setExportando(true);
        try {
            const params = {
                page: 1,
                limit: 1000, // Límite máximo soportado por el backend para asegurar que se descarguen TODOS
                // Eliminamos los filtros para que exporte el inventario total como solicitó el usuario
            };

            const res = await materialesService.listar(params);
            const data = res.data || [];

            if (data.length === 0) {
                enqueueSnackbar('No hay datos para exportar', { variant: 'info' });
                return;
            }

            const excelData = data.map(item => ({
                'Código': item.codigo,
                'Nombre del Material': item.nombreMaterial,
                'Categoría': item.categoria,
                'Stock Actual': item.cantidadDisponible,
                'Stock Mínimo': item.stockMinimo,
                'Estado Stock': item.stockBajo ? 'BAJO' : 'OK',
                'Tipo': item.fungible || 'N/A',
                'Pertenece a': item.pertenece || 'N/A',
                'Costo Unidad ($)': item.costoUnidad || 0,
                'Valor Inventario ($)': (item.cantidadDisponible * (item.costoUnidad || 0)).toFixed(2),
                'Descripción': item.descripcion || '',
                'Última Actualización': item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('es-EC') : 'N/A'
            }));

            const ws = XLSX.utils.json_to_sheet(excelData);
            
            // Estilo básico de columnas
            ws['!cols'] = [
                { wch: 15 }, { wch: 35 }, { wch: 20 }, { wch: 12 }, { wch: 12 },
                { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 18 },
                { wch: 40 }, { wch: 18 }
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
            XLSX.writeFile(wb, `Inventario_Materiales_${new Date().toISOString().split('T')[0]}.xlsx`);
            enqueueSnackbar('Exportación completada', { variant: 'success' });
        } catch (err) {
            console.error("Export error:", err);
            enqueueSnackbar('Error al exportar a Excel', { variant: 'error' });
        } finally {
            setExportando(false);
        }
    };

    const handleSubirFoto = async (id, file) => {
        // Validación de tamaño: 5MB
        if (file.size > 5 * 1024 * 1024) {
            enqueueSnackbar('La imagen es demasiado grande. El límite es 5MB.', { variant: 'warning' });
            return;
        }

        try {
            await materialesService.subirFoto(id, file);
            enqueueSnackbar('Foto actualizada correctamente', { variant: 'success' });
            cargar();
        } catch (err) {
            enqueueSnackbar(err?.response?.data?.error || 'Error al subir foto', { variant: 'error' });
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportFileName(file.name);
        setLastSelectedFile(file);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

                if (data.length === 0) {
                    enqueueSnackbar('El archivo no contiene datos', { variant: 'warning' });
                    return;
                }

                setImportColumns(Object.keys(data[0]));
                setImportData(data);
                setImportOpen(true);
            } catch (err) {
                enqueueSnackbar('Error al leer el archivo Excel', { variant: 'error' });
            }
        };
        reader.readAsBinaryString(file);
        if (importRef.current) importRef.current.value = '';
    };

    const handleImportConfirm = async () => {
        if (!lastSelectedFile) return;
        setImporting(true);
        try {
            const res = await materialesService.importarExcel(lastSelectedFile);
            enqueueSnackbar(res.message || 'Inventario importado correctamente', { variant: 'success' });
            cargar();
        } catch (err) {
            enqueueSnackbar(err.response?.data?.error || 'Error al importar datos', { variant: 'error' });
        } finally {
            setImporting(false);
            setImportOpen(false);
            setImportData([]);
            setLastSelectedFile(null);
        }
    };

    // ── Columnas para tabla ───────────────────────────────────
    const columns = [
        {
            field: 'nombre', headerName: 'Material',
            renderCell: r => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 36, height: 36, borderRadius: 1.5, flexShrink: 0,
                        bgcolor: alpha(CCO.azul, 0.08),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px dashed ${alpha(CCO.azul, 0.2)}`,
                        overflow: 'hidden'
                    }}>
                        {r.fotografia
                            ? <Box component="img" src={getImageUrl(r.fotografia)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <Typography fontSize={18}>{CATEGORIA_ICON[r.categoria] || '📦'}</Typography>
                        }
                    </Box>
                    <Box>
                        <Typography variant="body2" fontWeight={700}>{r.nombreMaterial}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.codigo} · {r.categoria}</Typography>
                    </Box>
                </Box>
            )
        },
        {
            field: 'stock', headerName: 'Stock',
            renderCell: r => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={r.cantidadDisponible}
                        size="small"
                        color={r.stockBajo ? 'error' : 'success'}
                        icon={r.stockBajo ? <AlertIcon sx={{ fontSize: '14px !important' }} /> : <OkIcon sx={{ fontSize: '14px !important' }} />}
                        sx={{ fontWeight: 800 }}
                    />
                    <Typography variant="caption" color="text.secondary">mín {r.stockMinimo}</Typography>
                </Box>
            )
        },
        { field: 'area', headerName: 'Área', renderCell: r => <Typography variant="caption">{r.area || '—'}</Typography> },
        {
            field: 'fungible', headerName: 'Tipo',
            renderCell: r => r.fungible ? (
                <Chip
                    icon={r.fungible === 'Fungible' ? <FungibleIcon sx={{ fontSize: '12px !important' }} /> : <NonFungibleIcon sx={{ fontSize: '12px !important' }} />}
                    label={r.fungible}
                    size="small"
                    sx={{
                        fontSize: 10, fontWeight: 700,
                        bgcolor: r.fungible === 'Fungible' ? alpha(CCO.naranja, 0.12) : alpha(CCO.azul, 0.12),
                        color: r.fungible === 'Fungible' ? CCO.naranja : CCO.azul,
                        border: `1px solid ${alpha(r.fungible === 'Fungible' ? CCO.naranja : CCO.azul, 0.3)}`,
                    }}
                />
            ) : <Typography variant="caption" color="text.secondary">—</Typography>
        },
        {
            field: 'pertenece', headerName: 'Pertenece',
            renderCell: r => r.pertenece ? (
                <Chip
                    icon={r.pertenece === 'Iglesia' ? <ChurchIcon sx={{ fontSize: '12px !important' }} /> : <MinistryIcon sx={{ fontSize: '12px !important' }} />}
                    label={r.pertenece}
                    size="small"
                    sx={{
                        fontSize: 10, fontWeight: 700,
                        bgcolor: r.pertenece === 'Iglesia' ? alpha(CCO.celeste, 0.15) : alpha(CCO.violeta, 0.12),
                        color: r.pertenece === 'Iglesia' ? '#2e7d32' : CCO.violeta,
                        border: `1px solid ${alpha(r.pertenece === 'Iglesia' ? CCO.celeste : CCO.violeta, 0.35)}`,
                    }}
                />
            ) : <Typography variant="caption" color="text.secondary">—</Typography>
        },
        {
            field: 'fechaUltimaActualizacion', headerName: 'Actualizado',
            renderCell: r => (
                <Typography variant="caption" color="text.secondary">
                    {r.fechaUltimaActualizacion ? new Date(r.fechaUltimaActualizacion).toLocaleDateString() : '—'}
                </Typography>
            )
        },
        {
            field: 'acciones', headerName: 'Acciones', align: 'right',
            renderCell: r => canWrite && (
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title="Ingresar stock" arrow>
                        <IconButton size="small" color="success" onClick={() => setStockModal({ open: true, tipo: 'ingresar', item: r })}
                            sx={{ bgcolor: alpha('#4caf50', 0.08), borderRadius: 1.5 }}>
                            <IngresarIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Despachar" arrow>
                        <IconButton size="small" color="warning" onClick={() => setStockModal({ open: true, tipo: 'despachar', item: r })}
                            sx={{ bgcolor: alpha('#ff9800', 0.08), borderRadius: 1.5 }}>
                            <DespacharIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Foto" arrow>
                        <IconButton size="small" onClick={() => setFotoModal({ open: true, item: r })}
                            sx={{ bgcolor: alpha(CCO.azul, 0.08), borderRadius: 1.5 }}>
                            <PhotoIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar" arrow>
                        <IconButton size="small" onClick={() => setFormModal({ open: true, tipo: 'editar', item: r })}
                            sx={{ bgcolor: alpha(CCO.azul, 0.08), borderRadius: 1.5 }}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {canDelete && (
                        <Tooltip title="Eliminar" arrow>
                            <IconButton size="small" color="error" onClick={() => handleEliminar(r.id)}
                                sx={{ bgcolor: alpha('#f44336', 0.08), borderRadius: 1.5 }}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>
            )
        },
    ];

    const stockBajoCount = alertas.stockBajoCount || 0;

    return (
        <MainLayout>
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1600, mx: 'auto' }}>

                {/* ── Header ── */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={900} sx={{
                            background: `linear-gradient(45deg, ${CCO.azul}, ${CCO.celeste})`,
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            Inventario · Materiales
                        </Typography>
                        <Typography color="text.secondary" fontWeight={500}>
                            {total} items registrados
                            {stockBajoCount > 0 && <> · <Box component="span" sx={{ color: 'error.main', fontWeight: 700 }}>{stockBajoCount} con stock bajo</Box></>}
                        </Typography>
                    </Box>

                    {canWrite && (
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            <Button variant="outlined"
                                disabled={importing}
                                onClick={() => importRef.current?.click()}
                                sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 800, textTransform: 'none', borderColor: CCO.azul, color: CCO.azul, '&:hover': { bgcolor: alpha(CCO.azul, 0.05) } }}
                            >
                                {importing ? 'Importando...' : ' Importar'}
                            </Button>
                            
                            <Button variant="outlined"
                                disabled={exportando}
                                onClick={handleExportarExcel}
                                startIcon={exportando ? <CircularProgress size={16} color="inherit" /> : <GridViewIcon />}
                                sx={{ 
                                    borderRadius: 3, px: 3, py: 1.2, fontWeight: 800, textTransform: 'none', 
                                    borderColor: '#2e7d32', color: '#2e7d32', 
                                    '&:hover': { bgcolor: alpha('#2e7d32', 0.05), borderColor: '#1b5e20' } 
                                }}
                            >
                                {exportando ? 'Exportando...' : ' Exportar Excel'}
                            </Button>
                            <input type="file" ref={importRef} accept=".xlsx, .xls" hidden onChange={handleFileSelect} />

                            <Button variant="contained" startIcon={<AddIcon />}
                                onClick={() => setFormModal({ open: true, tipo: 'crear', item: null })}
                                sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 800, textTransform: 'none', bgcolor: CCO.azul, boxShadow: '0 4px 14px rgba(0,48,103,0.3)', '&:hover': { bgcolor: '#003d6b' } }}>
                                Nuevo Material
                            </Button>
                        </Box>
                    )}
                </Box>

                {/* ── KPI Chips ── */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[
                        { label: 'Total Items', value: total, icon: <InventoryIcon />, color: CCO.azul },
                        { label: 'Stock Crítico', value: stockBajoCount, icon: <WarningIcon />, color: '#f44336' },
                        { label: 'Categorías', value: categorias.length, icon: <FilterIcon />, color: CCO.celeste },
                        { label: 'Mostrando', value: rows.length, icon: <OkIcon />, color: '#4caf50' },
                    ].map(kpi => (
                        <Grid item xs={6} sm={3} key={kpi.label}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(kpi.color, 0.1), color: kpi.color }}>
                                        {kpi.icon}
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" fontWeight={900} color={kpi.color === '#f44336' && kpi.value > 0 ? 'error.main' : 'text.primary'}>
                                            {kpi.value}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{kpi.label}</Typography>
                                    </Box>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* KPI Adicional: Stale Info */}
                {alertas.desactualizados?.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
                        Hay {alertas.desactualizados.length} materiales que no se han actualizado en más de 30 días.
                    </Alert>
                )}

                {/* ── Barra de filtros ── */}
                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Búsqueda */}
                        <TextField
                            size="small" placeholder="Buscar por nombre, código, categoría..."
                            value={buscar} onChange={e => setBuscar(e.target.value)}
                            sx={{ flex: 1, minWidth: 240, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                                endAdornment: buscar && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setBuscar('')}><CloseIcon fontSize="small" /></IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        {/* Filtro categoría */}
                        <TextField select size="small" label="Categoría" value={filtroCategoria}
                            onChange={e => setFiltroCategoria(e.target.value)}
                            sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}>
                            <MenuItem value="">Todas</MenuItem>
                            {categorias.map(c => <MenuItem key={c} value={c}>{CATEGORIA_ICON[c]} {c}</MenuItem>)}
                        </TextField>


                        {/* Filtro stock */}
                        <TextField select size="small" label="Stock" value={filtroStock}
                            onChange={e => setFiltroStock(e.target.value)}
                            sx={{ minWidth: 130, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}>
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="bajo">Stock bajo</MenuItem>
                            <MenuItem value="ok">Stock OK</MenuItem>
                        </TextField>

                        {/* Filtro Fungible */}
                        <TextField select size="small" label="Tipo" value={filtroFungible}
                            onChange={e => setFiltroFungible(e.target.value)}
                            sx={{ minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}>
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="Fungible">Fungible</MenuItem>
                            <MenuItem value="No Fungible">No Fungible</MenuItem>
                        </TextField>

                        {/* Filtro Pertenece */}
                        <TextField select size="small" label="Pertenece" value={filtroPertenece}
                            onChange={e => setFiltroPertenece(e.target.value)}
                            sx={{ minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}>
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="Iglesia">Iglesia</MenuItem>
                            <MenuItem value="Ministerio">Ministerio</MenuItem>
                        </TextField>

                        {/* Limpiar filtros */}
                        {hayFiltros && (
                            <Tooltip title="Limpiar filtros" arrow>
                                <IconButton onClick={() => { setBuscar(''); setFiltroCategoria(''); setFiltroStock(''); setFiltroFungible(''); setFiltroPertenece(''); }}
                                    sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                                    <ClearIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        <Box sx={{ ml: 'auto' }}>
                            <ToggleButtonGroup value={vistaMode} exclusive onChange={(_, v) => v && setVistaMode(v)} size="small">
                                <ToggleButton value="cards" sx={{ borderRadius: '8px 0 0 8px', px: 1.5 }}>
                                    <Tooltip title="Vista tarjetas" arrow><GridViewIcon fontSize="small" /></Tooltip>
                                </ToggleButton>
                                <ToggleButton value="tabla" sx={{ borderRadius: '0 8px 8px 0', px: 1.5 }}>
                                    <Tooltip title="Vista tabla" arrow><ListViewIcon fontSize="small" /></Tooltip>
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    </Box>

                    {/* Chips de filtros activos */}
                    {hayFiltros && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Filtros:</Typography>
                            {filtroCategoria && <Chip label={filtroCategoria} size="small" onDelete={() => setFiltroCategoria('')} sx={{ fontWeight: 700 }} />}
                            {filtroStock && <Chip label={filtroStock === 'bajo' ? 'Stock bajo' : 'Stock OK'} size="small" onDelete={() => setFiltroStock('')} sx={{ fontWeight: 700 }} />}
                            {filtroFungible && <Chip label={filtroFungible === 'Fungible' ? 'Fungible' : 'No Fungible'} size="small" onDelete={() => setFiltroFungible('')} sx={{ fontWeight: 700 }} />}
                            {filtroPertenece && <Chip label={filtroPertenece === 'Iglesia' ? 'Iglesia' : 'Ministerio'} size="small" onDelete={() => setFiltroPertenece('')} sx={{ fontWeight: 700 }} />}
                            <Chip label={`${total} resultados`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                        </Box>
                    )}
                </Paper>

                {/* ── Vista Cards ── */}
                {vistaMode === 'cards' && (
                    loading ? (
                        <Grid container spacing={2}>
                            {Array.from({ length: 12 }).map((_, i) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                                    <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />
                                </Grid>
                            ))}
                        </Grid>
                    ) : rows.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" fontWeight={700} color="text.secondary">No se encontraron materiales</Typography>
                            <Typography variant="body2" color="text.secondary">Prueba con otros términos de búsqueda o limpia los filtros</Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2} alignItems="stretch">
                            {rows.map(item => (
                                <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={item.id} sx={{ display: 'flex' }}>
                                    <MaterialCard
                                        item={item}
                                        canWrite={canWrite}
                                        canDelete={canDelete}
                                        onIngresar={(r) => setStockModal({ open: true, tipo: 'ingresar', item: r })}
                                        onDespachar={(r) => setStockModal({ open: true, tipo: 'despachar', item: r })}
                                        onEditar={(r) => setFormModal({ open: true, tipo: 'editar', item: r })}
                                        onEliminar={handleEliminar}
                                        onVerFoto={(r) => setFotoModal({ open: true, item: r })}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    )
                )}

                {/* ── Vista Tabla ── */}
                {vistaMode === 'tabla' && (
                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle2" fontWeight={800}>Lista de Materiales</Typography>
                        </Box>
                        <DataTable
                            columns={columns}
                            rows={rows}
                            loading={loading}
                            searchPlaceholder="Buscar en resultados..."
                            actions={false}
                        />
                    </TableContainer>
                )}

                {/* ── Paginación Común ── */}
                <TablePagination
                    component="div"
                    count={total}
                    page={page}
                    onPageChange={(_, p) => setPage(p)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    rowsPerPageOptions={[12, 24, 48, 96]}
                    labelRowsPerPage="Items por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                    sx={{ mt: 2, borderTop: '1px solid', borderColor: 'divider' }}
                />
            </Box>

            {/* ── Modales ── */}
            <MaterialFormModal
                open={formModal.open} tipo={formModal.tipo} item={formModal.item}
                onClose={() => setFormModal(m => ({ ...m, open: false }))}
                onConfirm={handleAccionForm}
            />
            <StockModal
                open={stockModal.open} tipo={stockModal.tipo} item={stockModal.item}
                onClose={() => setStockModal(m => ({ ...m, open: false }))}
                onConfirm={handleStock}
            />
            <FotoModal
                open={fotoModal.open} item={fotoModal.item}
                onClose={() => setFotoModal({ open: false, item: null })}
                onSubirFoto={handleSubirFoto}
            />

            {/* ═══════════════════════════════════════════════════════════════
                DIALOG: Importar desde Excel
                ═══════════════════════════════════════════════════════════════ */}
            <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="lg" fullWidth
                PaperProps={{ sx: { borderRadius: 4, maxHeight: '85vh' } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <IngresarIcon sx={{ color: CCO.azul }} />
                        <Box>
                            <Typography variant="h6" fontWeight={700}>Importar Materiales desde Excel</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Archivo: <b>{importFileName}</b> · {importData.length} registro{importData.length !== 1 ? 's' : ''}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={() => setImportOpen(false)} size="small"><CloseIcon /></IconButton>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ p: 0 }}>
                    <Alert severity="info" sx={{ mx: 3, mt: 2, borderRadius: 2 }}>
                        <Typography variant="body2">
                            <b>Columnas detectadas:</b> {importColumns.join(', ')}
                        </Typography>
                    </Alert>

                    <TableContainer sx={{ maxHeight: 400, mt: 2 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '8px 16px', borderBottom: '1px solid #ddd', backgroundColor: isDark ? '#1a1f36' : '#f5f5f5' }}>#</th>
                                    {importColumns.map(col => (
                                        <th key={col} style={{ padding: '8px 16px', borderBottom: '1px solid #ddd', backgroundColor: isDark ? '#1a1f36' : '#f5f5f5', whiteSpace: 'nowrap', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {importData.slice(0, 50).map((row, idx) => (
                                    <tr key={idx}>
                                        <td style={{ padding: '8px 16px', borderBottom: '1px solid #eee' }}><Typography variant="caption" fontWeight={600}>{idx + 1}</Typography></td>
                                        {importColumns.map(col => (
                                            <td key={col} style={{ padding: '8px 16px', borderBottom: '1px solid #eee' }}>
                                                <Typography variant="body2" fontSize="0.78rem" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {row[col] != null ? String(row[col]) : ''}
                                                </Typography>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {importData.length > 50 && (
                                    <tr>
                                        <td colSpan={importColumns.length + 1} style={{ textAlign: 'center', padding: '16px' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                ... y {importData.length - 50} registro{importData.length - 50 !== 1 ? 's' : ''} más
                                            </Typography>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </TableContainer>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2.5, gap: 1 }}>
                    <Button onClick={() => setImportOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>
                        Cancelar
                    </Button>
                    <Button variant="contained" startIcon={<OkIcon />}
                        onClick={handleImportConfirm}
                        disabled={importing}
                        sx={{ borderRadius: 3, px: 3, fontWeight: 700, bgcolor: CCO.azul }}>
                        {importing ? 'Importando...' : `Importar ${importData.length} Material${importData.length !== 1 ? 'es' : ''}`}
                    </Button>
                </DialogActions>
            </Dialog>
        </MainLayout>
    );
}
