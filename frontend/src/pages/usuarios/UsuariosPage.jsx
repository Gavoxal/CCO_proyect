import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Stack, IconButton, Tooltip, Avatar, Grid, Card, CardContent,
    CardActions, InputAdornment, Divider, Alert, Paper, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    ManageAccounts as UsuariosIcon,
    Badge as BadgeIcon,
    Lock as LockIcon,
    LockOpen as LockOpenIcon,
    VpnKey as ResetIcon,
    FilterList as FilterIcon,
    ClearAll as ClearIcon,
    Visibility as ShowIcon,
    VisibilityOff as HideIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import DataTable from '../../components/common/DataTable';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

// ─── Paleta CCO ──────────────────────────────────────────────
const CCO = { naranja: '#FF6B35', azul: '#004E89', crema: '#EFEFD0', violeta: '#6B2D5C', celeste: '#7BAE7F' };

// ─── Config de Roles ─────────────────────────────────────────
const ROLES = {
    admin:         { label: 'Administrador',  color: '#7c4dff', emoji: '👑' },
    director:      { label: 'Director',        color: '#00bcd4', emoji: '🎯' },
    secretaria:    { label: 'Secretaría',      color: '#4caf50', emoji: '📋' },
    tutor_especial:{ label: 'Tutor Especial',  color: '#ff9800', emoji: '⭐' },
    tutor:         { label: 'Tutor',           color: '#9e9e9e', emoji: '👤' },
};

// ─── MOCK DATA ────────────────────────────────────────────────
const STORAGE_KEY = 'cco_usuarios';

const MOCK_USUARIOS = [
    { id: 1, nombre: 'Andrea López',    username: 'andrea.lopez',  email: 'andrea@cco.org',  rol: 'admin',          activo: true,  createdAt: '2024-01-15' },
    { id: 2, nombre: 'Carlos Mendoza',  username: 'c.mendoza',     email: 'carlos@cco.org',  rol: 'director',       activo: true,  createdAt: '2024-02-01' },
    { id: 3, nombre: 'María García',    username: 'm.garcia',      email: 'maria@cco.org',   rol: 'secretaria',     activo: true,  createdAt: '2024-02-10' },
    { id: 4, nombre: 'José Ramírez',    username: 'jose.ramirez',  email: 'jose@cco.org',    rol: 'tutor_especial', activo: true,  createdAt: '2024-03-05' },
    { id: 5, nombre: 'Lucía Torres',    username: 'l.torres',      email: 'lucia@cco.org',   rol: 'tutor',          activo: true,  createdAt: '2024-03-12' },
    { id: 6, nombre: 'Pedro Salinas',   username: 'p.salinas',     email: 'pedro@cco.org',   rol: 'tutor',          activo: false, createdAt: '2024-04-01' },
    { id: 7, nombre: 'Ana Flores',      username: 'a.flores',      email: 'ana@cco.org',     rol: 'tutor',          activo: true,  createdAt: '2024-04-15' },
    { id: 8, nombre: 'Diego Herrera',   username: 'd.herrera',     email: 'diego@cco.org',   rol: 'tutor_especial', activo: true,  createdAt: '2024-05-01' },
];

let nextId = 9;

const getUsuarios = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { return JSON.parse(saved); } catch { /**/ } }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_USUARIOS));
    return [...MOCK_USUARIOS];
};
const saveUsuarios = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

// ─── Chip de Rol ─────────────────────────────────────────────
function RolChip({ rol, size = 'small' }) {
    const cfg = ROLES[rol] || { label: rol, color: '#777', emoji: '❓' };
    return (
        <Chip
            label={`${cfg.emoji} ${cfg.label}`}
            size={size}
            sx={{
                bgcolor: alpha(cfg.color, 0.12), color: cfg.color,
                fontWeight: 700, border: `1px solid ${alpha(cfg.color, 0.28)}`,
                fontSize: size === 'small' ? 10 : 12,
            }}
        />
    );
}

// ─── Avatar inicial ───────────────────────────────────────────
function UserAvatar({ nombre, rol, size = 40 }) {
    const cfg = ROLES[rol] || { color: '#777' };
    return (
        <Avatar sx={{
            width: size, height: size, fontSize: size * 0.4, fontWeight: 800,
            background: `linear-gradient(135deg, ${cfg.color} 0%, ${alpha(cfg.color, 0.6)} 100%)`,
        }}>
            {(nombre || '?').charAt(0).toUpperCase()}
        </Avatar>
    );
}

// ─── MODAL: FORMULARIO ───────────────────────────────────────
const EMPTY_FORM = {
    nombre: '', username: '', email: '', rol: 'tutor',
    password: '', confirmarPassword: '', activo: true,
};

function UsuarioFormModal({ open, tipo, item, onClose, onConfirm }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) {
            if (item) {
                setForm({ ...EMPTY_FORM, ...item, password: '', confirmarPassword: '' });
            } else {
                setForm(EMPTY_FORM);
            }
            setErrors({});
        }
    }, [open]); // eslint-disable-line

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const validate = () => {
        const errs = {};
        if (!form.nombre.trim()) errs.nombre = 'Campo requerido';
        if (!form.username.trim()) errs.username = 'Campo requerido';
        if (!form.email.trim()) errs.email = 'Campo requerido';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email inválido';
        if (tipo === 'crear') {
            if (!form.password) errs.password = 'La contraseña es requerida';
            else if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres';
            if (form.password !== form.confirmarPassword) errs.confirmarPassword = 'Las contraseñas no coinciden';
        } else if (form.password) {
            if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres';
            if (form.password !== form.confirmarPassword) errs.confirmarPassword = 'Las contraseñas no coinciden';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        await onConfirm(form);
        setSaving(false);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {tipo === 'crear' ? <AddIcon sx={{ color: CCO.azul }} /> : <EditIcon sx={{ color: CCO.azul }} />}
                    <Typography fontWeight={800}>{tipo === 'crear' ? 'Nuevo Usuario' : 'Editar Usuario'}</Typography>
                </Box>
                <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1.5 }}>
                    {/* Nombre completo */}
                    <TextField
                        label="Nombre completo *" value={form.nombre}
                        onChange={e => set('nombre', e.target.value)}
                        error={!!errors.nombre} helperText={errors.nombre}
                        size="small" fullWidth
                        InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    {/* Username + Email */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Usuario *" value={form.username}
                            onChange={e => set('username', e.target.value.toLowerCase().replace(/\s/g, '.'))}
                            error={!!errors.username} helperText={errors.username}
                            size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <TextField
                            label="Email *" value={form.email}
                            onChange={e => set('email', e.target.value)}
                            error={!!errors.email} helperText={errors.email}
                            size="small" sx={{ flex: 1.3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                    </Box>

                    {/* Rol */}
                    <TextField select label="Rol" value={form.rol} onChange={e => set('rol', e.target.value)}
                        size="small" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                        {Object.entries(ROLES).map(([k, v]) => (
                            <MenuItem key={k} value={k}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: v.color }} />
                                    {v.emoji} {v.label}
                                </Box>
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Estado Activo */}
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.75, display: 'block' }}>
                            Estado de cuenta
                        </Typography>
                        <ToggleButtonGroup
                            exclusive value={form.activo ? 'activo' : 'inactivo'}
                            onChange={(_, v) => v && set('activo', v === 'activo')}
                            size="small" fullWidth
                        >
                            <ToggleButton value="activo" sx={{
                                flex: 1, borderRadius: '8px 0 0 8px', fontWeight: 700, fontSize: 12,
                                '&.Mui-selected': { bgcolor: alpha('#4caf50', 0.15), color: '#4caf50', borderColor: alpha('#4caf50', 0.4) }
                            }}>
                                <LockOpenIcon sx={{ fontSize: 15, mr: 0.5 }} /> Activo
                            </ToggleButton>
                            <ToggleButton value="inactivo" sx={{
                                flex: 1, borderRadius: '0 8px 8px 0', fontWeight: 700, fontSize: 12,
                                '&.Mui-selected': { bgcolor: alpha('#f44336', 0.12), color: '#f44336', borderColor: alpha('#f44336', 0.3) }
                            }}>
                                <LockIcon sx={{ fontSize: 15, mr: 0.5 }} /> Inactivo
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    <Divider />

                    {/* Contraseña */}
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {tipo === 'crear' ? 'Contraseña *' : 'Nueva contraseña (dejar vacío para no cambiar)'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label={tipo === 'crear' ? 'Contraseña *' : 'Nueva contraseña'}
                            type={showPass ? 'text' : 'password'}
                            value={form.password} onChange={e => set('password', e.target.value)}
                            error={!!errors.password} helperText={errors.password}
                            size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setShowPass(s => !s)}>
                                            {showPass ? <HideIcon fontSize="small" /> : <ShowIcon fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <TextField
                            label="Confirmar contraseña"
                            type={showPass ? 'text' : 'password'}
                            value={form.confirmarPassword} onChange={e => set('confirmarPassword', e.target.value)}
                            error={!!errors.confirmarPassword} helperText={errors.confirmarPassword}
                            size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                    </Box>
                </Stack>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2, fontWeight: 700 }}>Cancelar</Button>
                <Button
                    variant="contained" onClick={handleSubmit}
                    disabled={saving}
                    sx={{ borderRadius: 3, px: 3, fontWeight: 800, textTransform: 'none', bgcolor: CCO.azul }}
                >
                    {saving ? 'Guardando...' : tipo === 'crear' ? 'Crear Usuario' : 'Guardar Cambios'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ─── CARD DE USUARIO ─────────────────────────────────────────
function UsuarioCard({ item, canEdit, onEditar, onEliminar, onToggleActivo }) {
    const theme = useTheme();
    const cfg = ROLES[item.rol] || { label: item.rol, color: '#777', emoji: '❓' };
    return (
        <Card elevation={0} sx={{
            borderRadius: 3, border: '1.5px solid',
            borderColor: item.activo ? 'divider' : alpha('#f44336', 0.3),
            transition: 'all 0.2s ease', height: '100%', display: 'flex', flexDirection: 'column',
            opacity: item.activo ? 1 : 0.75,
            '&:hover': {
                borderColor: item.activo ? CCO.azul : '#f44336',
                boxShadow: `0 6px 20px ${alpha(item.activo ? CCO.azul : '#f44336', 0.1)}`,
                transform: 'translateY(-2px)',
            }
        }}>
            <CardContent sx={{ flex: 1, pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                    <UserAvatar nombre={item.nombre} rol={item.rol} size={44} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={800} noWrap title={item.nombre}>
                            {item.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                            @{item.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: 10 }}>
                            {item.email}
                        </Typography>
                    </Box>
                    {!item.activo && (
                        <Chip label="Inactivo" size="small" sx={{
                            bgcolor: alpha('#f44336', 0.1), color: '#f44336',
                            fontWeight: 700, fontSize: 9, border: `1px solid ${alpha('#f44336', 0.3)}`
                        }} />
                    )}
                </Box>
                <RolChip rol={item.rol} />
                <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block', fontSize: 10 }}>
                    Creado: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </Typography>
            </CardContent>
            {canEdit && (
                <CardActions sx={{ px: 1.5, pb: 1.5, pt: 0, gap: 0.5 }}>
                    <Tooltip title={item.activo ? 'Desactivar cuenta' : 'Activar cuenta'} arrow>
                        <IconButton size="small"
                            sx={{
                                bgcolor: alpha(item.activo ? '#f44336' : '#4caf50', 0.08),
                                borderRadius: 1.5,
                                '&:hover': { bgcolor: alpha(item.activo ? '#f44336' : '#4caf50', 0.18) }
                            }}
                            onClick={() => onToggleActivo(item)}>
                            {item.activo ? <LockIcon fontSize="small" sx={{ color: '#f44336' }} /> : <LockOpenIcon fontSize="small" sx={{ color: '#4caf50' }} />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar" arrow>
                        <IconButton size="small" onClick={() => onEditar(item)}
                            sx={{ bgcolor: alpha(CCO.azul, 0.08), borderRadius: 1.5, '&:hover': { bgcolor: alpha(CCO.azul, 0.18) } }}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar usuario" arrow>
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
export default function UsuariosPage() {
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const canEdit = ['admin'].includes(user?.rol);

    // ── Estado ────────────────────────────────────────────────
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [buscar, setBuscar] = useState('');
    const [filtroRol, setFiltroRol] = useState('');
    const [filtroActivo, setFiltroActivo] = useState('');

    // Vista
    const [vistaMode, setVistaMode] = useState('cards');

    // Modal
    const [formModal, setFormModal] = useState({ open: false, tipo: null, item: null });

    // ── Carga ─────────────────────────────────────────────────
    const cargar = useCallback(() => {
        setLoading(true);
        setTimeout(() => {
            setRows(getUsuarios());
            setLoading(false);
        }, 200);
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    // ── Filtrado ──────────────────────────────────────────────
    const filtered = useMemo(() => {
        return rows.filter(r => {
            const txt = `${r.nombre} ${r.username} ${r.email}`.toLowerCase();
            if (buscar && !txt.includes(buscar.toLowerCase())) return false;
            if (filtroRol && r.rol !== filtroRol) return false;
            if (filtroActivo === 'activo' && !r.activo) return false;
            if (filtroActivo === 'inactivo' && r.activo) return false;
            return true;
        });
    }, [rows, buscar, filtroRol, filtroActivo]);

    const hayFiltros = buscar || filtroRol || filtroActivo;
    const limpiarFiltros = () => { setBuscar(''); setFiltroRol(''); setFiltroActivo(''); };

    // ── Handlers ──────────────────────────────────────────────
    const handleConfirm = (form) => {
        const usuarios = getUsuarios();
        if (formModal.tipo === 'crear') {
            const nuevo = {
                ...form,
                id: nextId++,
                createdAt: new Date().toISOString().split('T')[0],
            };
            delete nuevo.confirmarPassword;
            usuarios.push(nuevo);
            saveUsuarios(usuarios);
            enqueueSnackbar('Usuario creado correctamente', { variant: 'success' });
        } else {
            const idx = usuarios.findIndex(u => u.id === formModal.item.id);
            if (idx >= 0) {
                const updated = { ...usuarios[idx], ...form };
                if (!updated.password) delete updated.password;
                delete updated.confirmarPassword;
                usuarios[idx] = updated;
                saveUsuarios(usuarios);
                enqueueSnackbar('Usuario actualizado', { variant: 'success' });
            }
        }
        setFormModal(m => ({ ...m, open: false }));
        cargar();
    };

    const handleEliminar = (id) => {
        if (!window.confirm('¿Eliminar este usuario permanentemente?')) return;
        const usuarios = getUsuarios().filter(u => u.id !== id);
        saveUsuarios(usuarios);
        enqueueSnackbar('Usuario eliminado', { variant: 'success' });
        cargar();
    };

    const handleToggleActivo = (item) => {
        const usuarios = getUsuarios();
        const idx = usuarios.findIndex(u => u.id === item.id);
        if (idx >= 0) {
            usuarios[idx] = { ...usuarios[idx], activo: !usuarios[idx].activo };
            saveUsuarios(usuarios);
            enqueueSnackbar(
                `Cuenta ${usuarios[idx].activo ? 'activada' : 'desactivada'}`,
                { variant: usuarios[idx].activo ? 'success' : 'warning' }
            );
            cargar();
        }
    };

    // ── Estadísticas ──────────────────────────────────────────
    const stats = useMemo(() => ({
        total: rows.length,
        activos: rows.filter(r => r.activo).length,
        tutores: rows.filter(r => ['tutor', 'tutor_especial'].includes(r.rol)).length,
    }), [rows]);

    // ── Columnas tabla ────────────────────────────────────────
    const columns = [
        {
            field: 'nombre', headerName: 'Usuario',
            renderCell: r => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <UserAvatar nombre={r.nombre} rol={r.rol} size={34} />
                    <Box>
                        <Typography variant="body2" fontWeight={700}>{r.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">@{r.username} · {r.email}</Typography>
                    </Box>
                </Box>
            )
        },
        { field: 'rol', headerName: 'Rol', renderCell: r => <RolChip rol={r.rol} /> },
        {
            field: 'activo', headerName: 'Estado',
            renderCell: r => (
                <Chip
                    label={r.activo ? 'Activo' : 'Inactivo'}
                    size="small"
                    sx={{
                        fontWeight: 700,
                        bgcolor: r.activo ? alpha('#4caf50', 0.1) : alpha('#f44336', 0.1),
                        color: r.activo ? '#4caf50' : '#f44336',
                        border: `1px solid ${alpha(r.activo ? '#4caf50' : '#f44336', 0.3)}`,
                    }}
                />
            )
        },
        {
            field: 'createdAt', headerName: 'Creado',
            renderCell: r => (
                <Typography variant="caption" color="text.secondary">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </Typography>
            )
        },
        {
            field: 'acciones', headerName: 'Acciones', align: 'right',
            renderCell: r => canEdit && (
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title={r.activo ? 'Desactivar' : 'Activar'} arrow>
                        <IconButton size="small"
                            sx={{ bgcolor: alpha(r.activo ? '#f44336' : '#4caf50', 0.08), borderRadius: 1.5 }}
                            onClick={() => handleToggleActivo(r)}>
                            {r.activo
                                ? <LockIcon fontSize="small" sx={{ color: '#f44336' }} />
                                : <LockOpenIcon fontSize="small" sx={{ color: '#4caf50' }} />
                            }
                        </IconButton>
                    </Tooltip>
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

                {/* ── Header ── */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={900} sx={{
                            background: `linear-gradient(45deg, ${CCO.azul}, ${CCO.violeta})`,
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            Gestión de Usuarios
                        </Typography>
                        <Typography color="text.secondary" fontWeight={500}>
                            {stats.total} usuarios registrados · {stats.activos} activos · {stats.tutores} tutores
                        </Typography>
                    </Box>
                    {canEdit && (
                        <Button variant="contained" startIcon={<AddIcon />}
                            onClick={() => setFormModal({ open: true, tipo: 'crear', item: null })}
                            sx={{
                                borderRadius: 3, px: 3, py: 1.2, fontWeight: 800,
                                textTransform: 'none', bgcolor: CCO.azul,
                                boxShadow: `0 4px 14px ${alpha(CCO.azul, 0.3)}`,
                                '&:hover': { bgcolor: '#003d6b' }
                            }}>
                            Nuevo Usuario
                        </Button>
                    )}
                </Box>

                {/* ── KPIs ── */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[
                        { label: 'Total Usuarios', value: stats.total, icon: <UsuariosIcon />, color: CCO.azul },
                        { label: 'Cuentas Activas', value: stats.activos, icon: <LockOpenIcon />, color: '#4caf50' },
                        { label: 'Tutores', value: stats.tutores, icon: <BadgeIcon />, color: CCO.naranja },
                        { label: 'Mostrando', value: filtered.length, icon: <FilterIcon />, color: CCO.violeta },
                    ].map(kpi => (
                        <Grid item xs={6} sm={3} key={kpi.label}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(kpi.color, 0.1), color: kpi.color }}>
                                        {kpi.icon}
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" fontWeight={900}>{kpi.value}</Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{kpi.label}</Typography>
                                    </Box>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* ── Barra de filtros ── */}
                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <TextField
                            size="small" placeholder="Buscar por nombre, usuario o email..."
                            value={buscar} onChange={e => setBuscar(e.target.value)}
                            sx={{ flex: 1, minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                                endAdornment: buscar && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setBuscar('')}><CloseIcon fontSize="small" /></IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <TextField select size="small" label="Rol" value={filtroRol} onChange={e => setFiltroRol(e.target.value)}
                            sx={{ minWidth: 170, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}>
                            <MenuItem value="">Todos los roles</MenuItem>
                            {Object.entries(ROLES).map(([k, v]) => (
                                <MenuItem key={k} value={k}>{v.emoji} {v.label}</MenuItem>
                            ))}
                        </TextField>
                        <TextField select size="small" label="Estado" value={filtroActivo} onChange={e => setFiltroActivo(e.target.value)}
                            sx={{ minWidth: 130, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}>
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="activo">✅ Activos</MenuItem>
                            <MenuItem value="inactivo">🔒 Inactivos</MenuItem>
                        </TextField>
                        {hayFiltros && (
                            <Tooltip title="Limpiar filtros" arrow>
                                <IconButton onClick={limpiarFiltros}
                                    sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                                    <ClearIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Box sx={{ ml: 'auto' }}>
                            <ToggleButtonGroup value={vistaMode} exclusive onChange={(_, v) => v && setVistaMode(v)} size="small">
                                <ToggleButton value="cards" sx={{ borderRadius: '8px 0 0 8px', px: 1.5 }}>
                                    <Tooltip title="Vista tarjetas" arrow><BadgeIcon fontSize="small" /></Tooltip>
                                </ToggleButton>
                                <ToggleButton value="tabla" sx={{ borderRadius: '0 8px 8px 0', px: 1.5 }}>
                                    <Tooltip title="Vista tabla" arrow><FilterIcon fontSize="small" /></Tooltip>
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    </Box>
                    {hayFiltros && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Filtros:</Typography>
                            {filtroRol && <Chip label={`${ROLES[filtroRol]?.emoji} ${ROLES[filtroRol]?.label}`} size="small" onDelete={() => setFiltroRol('')} sx={{ fontWeight: 700 }} />}
                            {filtroActivo && <Chip label={filtroActivo === 'activo' ? '✅ Activos' : '🔒 Inactivos'} size="small" onDelete={() => setFiltroActivo('')} sx={{ fontWeight: 700 }} />}
                            <Chip label={`${filtered.length} resultados`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                        </Box>
                    )}
                </Paper>

                {!canEdit && (
                    <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
                        Solo los administradores pueden crear, editar o eliminar usuarios.
                    </Alert>
                )}

                {/* ── Vista Cards ── */}
                {vistaMode === 'cards' && (
                    filtered.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography fontSize={48}>🔍</Typography>
                            <Typography variant="h6" fontWeight={700} color="text.secondary">No se encontraron usuarios</Typography>
                            <Typography variant="body2" color="text.secondary">Prueba con otros términos o limpia los filtros</Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2} alignItems="stretch">
                            {filtered.map(item => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id} sx={{ display: 'flex' }}>
                                    <UsuarioCard
                                        item={item} canEdit={canEdit}
                                        onEditar={(r) => setFormModal({ open: true, tipo: 'editar', item: r })}
                                        onEliminar={handleEliminar}
                                        onToggleActivo={handleToggleActivo}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    )
                )}

                {/* ── Vista Tabla ── */}
                {vistaMode === 'tabla' && (
                    <DataTable
                        columns={columns}
                        rows={filtered}
                        loading={loading}
                        searchPlaceholder="Buscar usuario..."
                        actions={false}
                    />
                )}
            </Box>

            {/* ── Modal ── */}
            <UsuarioFormModal
                open={formModal.open}
                tipo={formModal.tipo}
                item={formModal.item}
                onClose={() => setFormModal(m => ({ ...m, open: false }))}
                onConfirm={handleConfirm}
            />
        </MainLayout>
    );
}
