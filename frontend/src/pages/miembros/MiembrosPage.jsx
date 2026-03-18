import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Box, Typography, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Stack, IconButton, Tooltip, Avatar, Grid, Card, CardContent,
    CardActions, InputAdornment, Divider, Paper, ToggleButtonGroup, ToggleButton,
    Skeleton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    Church as ChurchIcon,
    Person as PersonIcon,
    Badge as BadgeIcon,
    FilterList as FilterIcon,
    ClearAll as ClearIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    LocationOn as LocationIcon,
    CalendarMonth as CalIcon,
    PhotoCamera as PhotoIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import DataTable from '../../components/common/DataTable';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

// ─── Paleta CCO ──────────────────────────────────────────────
const CCO = { naranja: '#FF6B35', azul: '#004E89', crema: '#EFEFD0', violeta: '#6B2D5C', celeste: '#7BAE7F' };

// ─── Config membresías ───────────────────────────────────────
const TIPO_MEMBRESIA = {
    Activo:  { label: 'Activo',   color: '#4caf50', emoji: '✅' },
    Regular: { label: 'Regular',  color: '#2196f3', emoji: '🔵' },
    Lider:   { label: 'Líder',    color: CCO.violeta, emoji: '⭐' },
    Diacono: { label: 'Diácono',  color: CCO.naranja, emoji: '🤝' },
};

// ─── MOCK DATA ────────────────────────────────────────────────
const STORAGE_KEY = 'cco_miembros';
let nextId = 11;

const MOCK_MIEMBROS = [
    { id: 1, nombres: 'Andrea', apellidos: 'López Mora',   cedula: '1723456789', telefono1: '0991234567', email: 'andrea@cco.org', direccion: 'Av. Morán Valverde N5-12', tipoMembresia: 'Lider',   fechaIngreso: '2020-01-15', fotografia: null },
    { id: 2, nombres: 'Carlos', apellidos: 'Mendoza Ruiz', cedula: '1734567890', telefono1: '0987654321', email: 'carlos@cco.org', direccion: 'Calle Quito 456',          tipoMembresia: 'Activo',  fechaIngreso: '2019-03-20', fotografia: null },
    { id: 3, nombres: 'María',  apellidos: 'García Paz',   cedula: '1745678901', telefono1: '0976543210', email: 'maria@cco.org',  direccion: 'Jr. Las Flores 789',       tipoMembresia: 'Regular', fechaIngreso: '2021-06-10', fotografia: null },
    { id: 4, nombres: 'José',   apellidos: 'Ramírez Vega', cedula: '1756789012', telefono1: '0965432109', email: 'jose@cco.org',   direccion: 'Av. Naciones Unidas 101',  tipoMembresia: 'Diacono', fechaIngreso: '2018-11-05', fotografia: null },
    { id: 5, nombres: 'Lucía',  apellidos: 'Torres Alba',  cedula: '1767890123', telefono1: '0954321098', email: 'lucia@cco.org',  direccion: 'Calle Sucre 202',          tipoMembresia: 'Activo',  fechaIngreso: '2022-02-14', fotografia: null },
    { id: 6, nombres: 'Pedro',  apellidos: 'Salinas Cruz', cedula: '1778901234', telefono1: '0943210987', email: 'pedro@cco.org',  direccion: 'Calle Bolívar 303',        tipoMembresia: 'Regular', fechaIngreso: '2023-04-01', fotografia: null },
    { id: 7, nombres: 'Ana',    apellidos: 'Flores Díaz',  cedula: '1789012345', telefono1: '0932109876', email: 'ana@cco.org',    direccion: 'Pasaje Luna 404',          tipoMembresia: 'Activo',  fechaIngreso: '2023-07-22', fotografia: null },
    { id: 8, nombres: 'Diego',  apellidos: 'Herrera Soto', cedula: '1790123456', telefono1: '0921098765', email: 'diego@cco.org',  direccion: 'Av. El Inca 505',          tipoMembresia: 'Lider',   fechaIngreso: '2017-09-30', fotografia: null },
];

const getMiembros = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { return JSON.parse(saved); } catch { /**/ } }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_MIEMBROS));
    return [...MOCK_MIEMBROS];
};
const saveMiembros = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

// ─── Chip membresía ───────────────────────────────────────────
function TipoChip({ tipo, size = 'small' }) {
    const cfg = TIPO_MEMBRESIA[tipo] || { label: tipo, color: '#777', emoji: '❓' };
    return (
        <Chip label={`${cfg.emoji} ${cfg.label}`} size={size}
            sx={{ bgcolor: alpha(cfg.color, 0.13), color: cfg.color, fontWeight: 700,
                border: `1px solid ${alpha(cfg.color, 0.28)}`, fontSize: size === 'small' ? 10 : 12 }} />
    );
}

// ─── Avatar ───────────────────────────────────────────────────
function MemberAvatar({ item, size = 44 }) {
    const cfg = TIPO_MEMBRESIA[item.tipoMembresia] || { color: '#777' };
    return item.fotografia ? (
        <Box component="img" src={item.fotografia}
            sx={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${alpha(cfg.color, 0.4)}` }} />
    ) : (
        <Avatar sx={{ width: size, height: size, fontSize: size * 0.38, fontWeight: 800,
            background: `linear-gradient(135deg, ${cfg.color} 0%, ${alpha(cfg.color, 0.55)} 100%)` }}>
            {`${(item.nombres || '?').charAt(0)}${(item.apellidos || '?').charAt(0)}`.toUpperCase()}
        </Avatar>
    );
}

// ─── MODAL FORMULARIO ────────────────────────────────────────
const EMPTY_FORM = {
    nombres: '', apellidos: '', cedula: '', telefono1: '', telefono2: '',
    email: '', direccion: '', tipoMembresia: 'Regular', fechaIngreso: '', fotografia: null,
};

function MiembroFormModal({ open, tipo, item, onClose, onConfirm }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState(null);
    const fileRef = useRef();

    useEffect(() => {
        if (open) {
            setForm(item ? { ...EMPTY_FORM, ...item } : EMPTY_FORM);
            setPreview(item?.fotografia || null);
        }
    }, [open]); // eslint-disable-line

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreview(url);
        set('fotografia', url);
    };

    const handleSubmit = async () => {
        if (!form.nombres.trim() || !form.apellidos.trim()) return;
        setSaving(true);
        await onConfirm({ ...form, fotografia: preview });
        setSaving(false);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ChurchIcon sx={{ color: CCO.azul }} />
                    <Typography fontWeight={800}>{tipo === 'crear' ? 'Nuevo Miembro' : 'Editar Miembro'}</Typography>
                </Box>
                <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1.5 }}>

                    {/* Foto del miembro */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 3,
                        border: `1.5px dashed ${alpha(CCO.azul, 0.3)}`, bgcolor: alpha(CCO.azul, 0.03) }}>
                        <Box onClick={() => fileRef.current?.click()} sx={{ cursor: 'pointer', position: 'relative' }}>
                            {preview ? (
                                <Box component="img" src={preview}
                                    sx={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover',
                                        border: `2px solid ${alpha(CCO.azul, 0.4)}` }} />
                            ) : (
                                <Avatar sx={{ width: 72, height: 72, bgcolor: alpha(CCO.azul, 0.1) }}>
                                    <PhotoIcon sx={{ color: CCO.azul, fontSize: 28 }} />
                                </Avatar>
                            )}
                        </Box>
                        <Box>
                            <Typography variant="body2" fontWeight={700}>Foto del miembro</Typography>
                            <Typography variant="caption" color="text.secondary">Haz clic para subir una foto</Typography>
                            <Box>
                                <Button size="small" onClick={() => fileRef.current?.click()}
                                    sx={{ mt: 0.5, fontSize: 11, textTransform: 'none', color: CCO.azul }}>
                                    {preview ? 'Cambiar foto' : 'Subir foto'}
                                </Button>
                                {preview && (
                                    <Button size="small" color="error" sx={{ mt: 0.5, fontSize: 11, textTransform: 'none' }}
                                        onClick={() => { setPreview(null); set('fotografia', null); }}>
                                        Quitar
                                    </Button>
                                )}
                            </Box>
                        </Box>
                        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="Nombres *" value={form.nombres} onChange={e => set('nombres', e.target.value)}
                            size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField label="Apellidos *" value={form.apellidos} onChange={e => set('apellidos', e.target.value)}
                            size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="Cédula" value={form.cedula} onChange={e => set('cedula', e.target.value)}
                            size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField label="Fecha de ingreso" type="date" value={form.fechaIngreso || ''}
                            onChange={e => set('fechaIngreso', e.target.value)} size="small"
                            InputLabelProps={{ shrink: true }}
                            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="Teléfono principal" value={form.telefono1} onChange={e => set('telefono1', e.target.value)}
                            size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField label="Teléfono secundario" value={form.telefono2 || ''} onChange={e => set('telefono2', e.target.value)}
                            size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Box>
                    <TextField label="Email" value={form.email || ''} onChange={e => set('email', e.target.value)}
                        size="small" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    <TextField label="Dirección" value={form.direccion || ''} onChange={e => set('direccion', e.target.value)}
                        size="small" fullWidth multiline rows={2}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    <TextField select label="Tipo de Membresía" value={form.tipoMembresia}
                        onChange={e => set('tipoMembresia', e.target.value)} size="small" fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                        {Object.entries(TIPO_MEMBRESIA).map(([k, v]) => (
                            <MenuItem key={k} value={k}>{v.emoji} {v.label}</MenuItem>
                        ))}
                    </TextField>
                </Stack>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2, fontWeight: 700 }}>Cancelar</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={saving || !form.nombres.trim() || !form.apellidos.trim()}
                    sx={{ borderRadius: 3, px: 3, fontWeight: 800, textTransform: 'none', bgcolor: CCO.azul }}>
                    {saving ? 'Guardando...' : tipo === 'crear' ? 'Agregar Miembro' : 'Guardar Cambios'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ─── CARD DE MIEMBRO ─────────────────────────────────────────
function MiembroCard({ item, canEdit, onEditar, onEliminar }) {
    return (
        <Card elevation={0} sx={{
            borderRadius: 3, border: '1.5px solid', borderColor: 'divider',
            transition: 'all 0.2s ease', height: '100%', display: 'flex', flexDirection: 'column',
            '&:hover': { borderColor: CCO.azul, boxShadow: `0 6px 20px ${alpha(CCO.azul, 0.1)}`, transform: 'translateY(-2px)' }
        }}>
            <CardContent sx={{ flex: 1, pb: 1 }}>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                    <MemberAvatar item={item} size={48} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={800} noWrap>
                            {item.nombres} {item.apellidos}
                        </Typography>
                        {item.cedula && (
                            <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                CI: {item.cedula}
                            </Typography>
                        )}
                        <Box sx={{ mt: 0.5 }}><TipoChip tipo={item.tipoMembresia} /></Box>
                    </Box>
                </Box>
                <Stack spacing={0.4}>
                    {item.telefono1 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <PhoneIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.secondary">{item.telefono1}</Typography>
                        </Box>
                    )}
                    {item.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <EmailIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.secondary" noWrap>{item.email}</Typography>
                        </Box>
                    )}
                    {item.direccion && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                            <LocationIcon sx={{ fontSize: 12, color: 'text.disabled', mt: 0.1 }} />
                            <Typography variant="caption" color="text.secondary" sx={{
                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                            }}>{item.direccion}</Typography>
                        </Box>
                    )}
                    {item.fechaIngreso && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <CalIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.disabled">
                                Desde {new Date(item.fechaIngreso).toLocaleDateString('es-EC', { month: 'short', year: 'numeric' })}
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </CardContent>
            {canEdit && (
                <CardActions sx={{ px: 1.5, pb: 1.5, pt: 0, gap: 0.5 }}>
                    <Tooltip title="Editar" arrow>
                        <IconButton size="small" onClick={() => onEditar(item)}
                            sx={{ bgcolor: alpha(CCO.azul, 0.08), borderRadius: 1.5, '&:hover': { bgcolor: alpha(CCO.azul, 0.18) } }}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar" arrow>
                        <IconButton size="small" color="error" onClick={() => onEliminar(item.id)}
                            sx={{ bgcolor: alpha('#f44336', 0.08), borderRadius: 1.5, '&:hover': { bgcolor: alpha('#f44336', 0.18) }, ml: 'auto' }}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </CardActions>
            )}
        </Card>
    );
}

// ═══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function MiembrosPage() {
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const canEdit = ['admin', 'director'].includes(user?.rol);

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [buscar, setBuscar] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [vistaMode, setVistaMode] = useState('cards');
    const [formModal, setFormModal] = useState({ open: false, tipo: null, item: null });

    const cargar = useCallback(() => {
        setLoading(true);
        setTimeout(() => { setRows(getMiembros()); setLoading(false); }, 200);
    }, []);
    useEffect(() => { cargar(); }, [cargar]);

    const filtered = useMemo(() => rows.filter(r => {
        const txt = `${r.nombres} ${r.apellidos} ${r.cedula} ${r.email}`.toLowerCase();
        if (buscar && !txt.includes(buscar.toLowerCase())) return false;
        if (filtroTipo && r.tipoMembresia !== filtroTipo) return false;
        return true;
    }), [rows, buscar, filtroTipo]);

    const hayFiltros = buscar || filtroTipo;

    const handleConfirm = (form) => {
        const miembros = getMiembros();
        if (formModal.tipo === 'crear') {
            miembros.push({ ...form, id: nextId++, createdAt: new Date().toISOString() });
            enqueueSnackbar('Miembro agregado', { variant: 'success' });
        } else {
            const idx = miembros.findIndex(m => m.id === formModal.item.id);
            if (idx >= 0) miembros[idx] = { ...miembros[idx], ...form };
            enqueueSnackbar('Miembro actualizado', { variant: 'success' });
        }
        saveMiembros(miembros);
        setFormModal(m => ({ ...m, open: false }));
        cargar();
    };

    const handleEliminar = (id) => {
        if (!window.confirm('¿Eliminar este miembro?')) return;
        saveMiembros(getMiembros().filter(m => m.id !== id));
        enqueueSnackbar('Miembro eliminado', { variant: 'success' });
        cargar();
    };

    const stats = useMemo(() => ({
        total: rows.length,
        lideres: rows.filter(r => r.tipoMembresia === 'Lider').length,
        diaconos: rows.filter(r => r.tipoMembresia === 'Diacono').length,
    }), [rows]);

    const columns = [
        {
            field: 'nombre', headerName: 'Miembro',
            renderCell: r => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <MemberAvatar item={r} size={34} />
                    <Box>
                        <Typography variant="body2" fontWeight={700}>{r.nombres} {r.apellidos}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.cedula || '—'} · {r.telefono1}</Typography>
                    </Box>
                </Box>
            )
        },
        { field: 'tipoMembresia', headerName: 'Membresía', renderCell: r => <TipoChip tipo={r.tipoMembresia} /> },
        { field: 'email', headerName: 'Email', renderCell: r => <Typography variant="caption">{r.email || '—'}</Typography> },
        { field: 'direccion', headerName: 'Dirección', renderCell: r => <Typography variant="caption" noWrap sx={{ maxWidth: 180 }}>{r.direccion || '—'}</Typography> },
        {
            field: 'fechaIngreso', headerName: 'Ingreso',
            renderCell: r => <Typography variant="caption" color="text.secondary">
                {r.fechaIngreso ? new Date(r.fechaIngreso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </Typography>
        },
        {
            field: 'acciones', headerName: 'Acciones', align: 'right',
            renderCell: r => canEdit && (
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title="Editar" arrow>
                        <IconButton size="small" onClick={() => setFormModal({ open: true, tipo: 'editar', item: r })}
                            sx={{ bgcolor: alpha(CCO.azul, 0.08), borderRadius: 1.5 }}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar" arrow>
                        <IconButton size="small" color="error" onClick={() => handleEliminar(r.id)}
                            sx={{ bgcolor: alpha('#f44336', 0.08), borderRadius: 1.5 }}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            )
        },
    ];

    return (
        <MainLayout>
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>

                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={900} sx={{
                            background: `linear-gradient(45deg, ${CCO.azul}, ${CCO.violeta})`,
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>Miembros · CCO</Typography>
                        <Typography color="text.secondary" fontWeight={500}>
                            {stats.total} miembros · {stats.lideres} líderes · {stats.diaconos} diáconos
                        </Typography>
                    </Box>
                    {canEdit && (
                        <Button variant="contained" startIcon={<AddIcon />}
                            onClick={() => setFormModal({ open: true, tipo: 'crear', item: null })}
                            sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 800, textTransform: 'none', bgcolor: CCO.azul,
                                boxShadow: `0 4px 14px ${alpha(CCO.azul, 0.3)}`, '&:hover': { bgcolor: '#003d6b' } }}>
                            Nuevo Miembro
                        </Button>
                    )}
                </Box>

                {/* KPIs */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[
                        { label: 'Total', value: stats.total, color: CCO.azul, icon: <ChurchIcon /> },
                        { label: 'Activos', value: rows.filter(r => r.tipoMembresia === 'Activo').length, color: '#4caf50', icon: <PersonIcon /> },
                        { label: 'Líderes', value: stats.lideres, color: CCO.violeta, icon: <BadgeIcon /> },
                        { label: 'Mostrando', value: filtered.length, color: CCO.naranja, icon: <FilterIcon /> },
                    ].map(kpi => (
                        <Grid item xs={6} sm={3} key={kpi.label}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(kpi.color, 0.1), color: kpi.color }}>{kpi.icon}</Box>
                                    <Box>
                                        <Typography variant="h5" fontWeight={900}>{kpi.value}</Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{kpi.label}</Typography>
                                    </Box>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Filtros */}
                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <TextField size="small" placeholder="Buscar por nombre, cédula, email..."
                            value={buscar} onChange={e => setBuscar(e.target.value)}
                            sx={{ flex: 1, minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                                endAdornment: buscar && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setBuscar('')}><CloseIcon fontSize="small" /></IconButton>
                                    </InputAdornment>
                                )
                            }} />
                        <TextField select size="small" label="Membresía" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
                            sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}>
                            <MenuItem value="">Todas</MenuItem>
                            {Object.entries(TIPO_MEMBRESIA).map(([k, v]) => (
                                <MenuItem key={k} value={k}>{v.emoji} {v.label}</MenuItem>
                            ))}
                        </TextField>
                        {hayFiltros && (
                            <Tooltip title="Limpiar filtros" arrow>
                                <IconButton onClick={() => { setBuscar(''); setFiltroTipo(''); }}
                                    sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                                    <ClearIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Box sx={{ ml: 'auto' }}>
                            <ToggleButtonGroup value={vistaMode} exclusive onChange={(_, v) => v && setVistaMode(v)} size="small">
                                <ToggleButton value="cards" sx={{ borderRadius: '8px 0 0 8px', px: 1.5 }}>
                                    <Tooltip title="Tarjetas" arrow><BadgeIcon fontSize="small" /></Tooltip>
                                </ToggleButton>
                                <ToggleButton value="tabla" sx={{ borderRadius: '0 8px 8px 0', px: 1.5 }}>
                                    <Tooltip title="Tabla" arrow><FilterIcon fontSize="small" /></Tooltip>
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    </Box>
                    {hayFiltros && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Filtros:</Typography>
                            {filtroTipo && <Chip label={`${TIPO_MEMBRESIA[filtroTipo]?.emoji} ${TIPO_MEMBRESIA[filtroTipo]?.label}`} size="small" onDelete={() => setFiltroTipo('')} sx={{ fontWeight: 700 }} />}
                            <Chip label={`${filtered.length} resultados`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                        </Box>
                    )}
                </Paper>

                {/* Cards */}
                {vistaMode === 'cards' && (
                    loading ? (
                        <Grid container spacing={2}>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                                    <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
                                </Grid>
                            ))}
                        </Grid>
                    ) : filtered.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography fontSize={48}>🔍</Typography>
                            <Typography variant="h6" fontWeight={700} color="text.secondary">No se encontraron miembros</Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2} alignItems="stretch">
                            {filtered.map(item => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id} sx={{ display: 'flex' }}>
                                    <MiembroCard item={item} canEdit={canEdit}
                                        onEditar={() => setFormModal({ open: true, tipo: 'editar', item })}
                                        onEliminar={handleEliminar} />
                                </Grid>
                            ))}
                        </Grid>
                    )
                )}

                {/* Tabla */}
                {vistaMode === 'tabla' && (
                    <DataTable columns={columns} rows={filtered} loading={loading} searchPlaceholder="Buscar miembro..." actions={false} />
                )}
            </Box>

            <MiembroFormModal
                open={formModal.open} tipo={formModal.tipo} item={formModal.item}
                onClose={() => setFormModal(m => ({ ...m, open: false }))}
                onConfirm={handleConfirm}
            />
        </MainLayout>
    );
}
