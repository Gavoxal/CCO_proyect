import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Box, Typography, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Stack, IconButton, Tooltip, Avatar, Grid, Card, CardContent,
    CardActions, InputAdornment, Divider, Paper, Checkbox, FormControlLabel, Collapse,
    Skeleton, Table, TableBody, TableRow, TableCell, Alert, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon,
    Close as CloseIcon, House as HouseIcon, Person as PersonIcon, FilterList as FilterIcon,
    ClearAll as ClearIcon, Phone as PhoneIcon, LocationOn as LocationIcon,
    CalendarMonth as CalIcon, PhotoCamera as PhotoIcon, ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon, CheckCircle as CheckIcon, RadioButtonUnchecked as UncheckedIcon,
    Badge as BadgeIcon, AddCircle as AddRowIcon, RemoveCircle as RemoveRowIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import DataTable from '../../components/common/DataTable';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

// ─── Paleta CCO ──────────────────────────────────────────────
const CCO = { naranja: '#FF6B35', azul: '#004E89', crema: '#EFEFD0', violeta: '#6B2D5C', celeste: '#7BAE7F' };

// ─── Estados Casa de Paz ──────────────────────────────────────
const ESTADO_CASA = {
    EnProgreso:  { label: 'En Progreso',  color: CCO.naranja,  emoji: '🔄' },
    Completada:  { label: 'Completada',   color: '#4caf50',    emoji: '✅' },
    Cancelada:   { label: 'Cancelada',    color: '#f44336',    emoji: '❌' },
};

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// ─── MOCK DATA ────────────────────────────────────────────────
const STORAGE_KEY = 'cco_casas_paz';
let nextId = 4;

const EMPTY_INTEGRANTE = () => ({ nombre: '', edad: '', mcd: false, npt: false, lbs: false });

const MOCK_CASAS = [
    {
        id: 1,
        codigo: 'CCOMD8D-12',
        operacion: 'Operación Zaqueo',
        numeroTC: '',
        red: 'Damas',
        // Primera visita
        fechaPrimeraVisita: '2023-03-24',
        lider: 'Angélica Sarangao',
        nombreHijoDePaz: 'José Alvarado Chilogallo',
        familia: 'Alvarado y Hermano',
        direccion: 'Miguel (Sarasuro)',
        celular: '0839725300',
        diaVisita: 'Viernes',
        // Segunda visita
        integrantes: [
            { nombre: 'Josué Enrique Alvarado Chilogallo', edad: '27', mcd: true,  npt: true,  lbs: true  },
            { nombre: 'Gisella Alejandra Rivera González',  edad: '26', mcd: true,  npt: true,  lbs: false },
            { nombre: 'Estefany Sofía Rivera González',     edad: '5',  mcd: false, npt: false, lbs: false },
            { nombre: 'Elías José Alvarado Rivera',         edad: '1',  mcd: false, npt: false, lbs: false },
        ],
        // Tercera visita
        casaConsolidandose: false,
        // Estado general
        estado: 'Completada',
        observaciones: '',
        fotografia: null,
        createdAt: '2023-03-24',
    },
    {
        id: 2,
        codigo: 'CCOMS-08',
        operacion: 'Operación Zaqueo',
        numeroTC: '',
        red: 'Jóvenes',
        fechaPrimeraVisita: '2024-01-10',
        lider: 'Carlos Mendoza',
        nombreHijoDePaz: 'Patricia Soto',
        familia: 'Soto Martínez',
        direccion: 'Av. Mariana de Jesús N3-45',
        celular: '0991234567',
        diaVisita: 'Miércoles',
        integrantes: [
            { nombre: 'Patricia Soto',   edad: '34', mcd: false, npt: false, lbs: false },
            { nombre: 'Roberto Martínez', edad: '37', mcd: false, npt: false, lbs: false },
        ],
        casaConsolidandose: true,
        estado: 'EnProgreso',
        observaciones: 'Familia muy receptiva, asiste con regularidad.',
        fotografia: null,
        createdAt: '2024-01-10',
    },
];

const getCasas = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { return JSON.parse(saved); } catch { /**/ } }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_CASAS));
    return [...MOCK_CASAS];
};
const saveCasas = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

// ─── Chip Estado ─────────────────────────────────────────────
function EstadoChip({ estado, size = 'small' }) {
    const cfg = ESTADO_CASA[estado] || { label: estado, color: '#777', emoji: '❓' };
    return (
        <Chip label={`${cfg.emoji} ${cfg.label}`} size={size}
            sx={{ bgcolor: alpha(cfg.color, 0.13), color: cfg.color, fontWeight: 700,
                border: `1px solid ${alpha(cfg.color, 0.28)}`, fontSize: size === 'small' ? 10 : 12 }} />
    );
}

// ─── Indicador MCD/NPT/LBS ────────────────────────────────────
function Indicador({ label, checked, color = '#4caf50' }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
            <Typography sx={{ fontSize: 8, fontWeight: 800, color: checked ? color : 'text.disabled', letterSpacing: '0.05em' }}>
                {label}
            </Typography>
            {checked
                ? <CheckIcon sx={{ fontSize: 14, color }} />
                : <UncheckedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            }
        </Box>
    );
}

// ─── MODAL FORMULARIO ────────────────────────────────────────
const EMPTY_FORM = {
    codigo: '', operacion: 'Operación Zaqueo', numeroTC: '', red: '',
    fechaPrimeraVisita: '', lider: '', nombreHijoDePaz: '', familia: '',
    direccion: '', celular: '', diaVisita: 'Viernes',
    integrantes: [EMPTY_INTEGRANTE()],
    casaConsolidandose: false, estado: 'EnProgreso',
    observaciones: '', fotografia: null,
};

function CasaFormModal({ open, tipo, item, onClose, onConfirm }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState(null);
    const [tab, setTab] = useState(0);
    const fileRef = useRef();

    useEffect(() => {
        if (open) {
            setForm(item ? { ...EMPTY_FORM, ...item, integrantes: item.integrantes?.length ? item.integrantes : [EMPTY_INTEGRANTE()] } : { ...EMPTY_FORM });
            setPreview(item?.fotografia || null);
            setTab(0);
        }
    }, [open]); // eslint-disable-line

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPreview(URL.createObjectURL(file));
        set('fotografia', URL.createObjectURL(file));
    };

    const setIntegrante = (i, k, v) => {
        const updated = [...form.integrantes];
        updated[i] = { ...updated[i], [k]: v };
        set('integrantes', updated);
    };

    const addIntegrante = () => set('integrantes', [...form.integrantes, EMPTY_INTEGRANTE()]);
    const removeIntegrante = (i) => {
        if (form.integrantes.length <= 1) return;
        set('integrantes', form.integrantes.filter((_, idx) => idx !== i));
    };

    const handleSubmit = async () => {
        if (!form.nombreHijoDePaz.trim() || !form.lider.trim()) return;
        setSaving(true);
        await onConfirm({ ...form, fotografia: preview });
        setSaving(false);
    };

    const TABS = ['1ª Visita', '2ª Visita', 'Foto y Estado'];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HouseIcon sx={{ color: CCO.naranja }} />
                    <Typography fontWeight={800}>{tipo === 'crear' ? 'Nueva Casa de Paz' : 'Editar Casa de Paz'}</Typography>
                </Box>
                <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
            </DialogTitle>
            <Divider />

            {/* Tabs */}
            <Box sx={{ display: 'flex', px: 3, pt: 1.5, gap: 1 }}>
                {TABS.map((t, i) => (
                    <Button key={t} size="small" onClick={() => setTab(i)}
                        variant={tab === i ? 'contained' : 'outlined'}
                        sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', fontSize: 12,
                            ...(tab === i ? { bgcolor: CCO.azul, boxShadow: 'none' } : { borderColor: 'divider', color: 'text.secondary' }) }}>
                        {t}
                    </Button>
                ))}
            </Box>

            <DialogContent>
                {/* ── Tab 0: Primera Visita ── */}
                {tab === 0 && (
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="Código *" value={form.codigo} onChange={e => set('codigo', e.target.value)}
                                size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                placeholder="CCOMD8D-12" />
                            <TextField label="Operación" value={form.operacion} onChange={e => set('operacion', e.target.value)}
                                size="small" sx={{ flex: 1.3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="Fecha 1ª Visita *" type="date" value={form.fechaPrimeraVisita}
                                onChange={e => set('fechaPrimeraVisita', e.target.value)} size="small"
                                InputLabelProps={{ shrink: true }} sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            <TextField label="Red" value={form.red} onChange={e => set('red', e.target.value)}
                                size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                placeholder="Damas, Jóvenes..." />
                        </Box>
                        <TextField label="Líder *" value={form.lider} onChange={e => set('lider', e.target.value)}
                            size="small" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField label="Nombre del Hijo de Paz *" value={form.nombreHijoDePaz} onChange={e => set('nombreHijoDePaz', e.target.value)}
                            size="small" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField label="Familia" value={form.familia} onChange={e => set('familia', e.target.value)}
                            size="small" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="Dirección" value={form.direccion} onChange={e => set('direccion', e.target.value)}
                                size="small" sx={{ flex: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            <TextField label="Celular" value={form.celular} onChange={e => set('celular', e.target.value)}
                                size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        </Box>
                        <TextField select label="Día de visita" value={form.diaVisita} onChange={e => set('diaVisita', e.target.value)}
                            size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                            {DIAS_SEMANA.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                        </TextField>
                    </Stack>
                )}

                {/* ── Tab 1: Segunda Visita – Integrantes ── */}
                {tab === 1 && (
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Alert severity="info" sx={{ borderRadius: 2, fontSize: 12 }}>
                            Registra los integrantes de la casa y marca su avance: <strong>MCD</strong> (Miembro con Decreto) · <strong>NPT</strong> (Nuevo en la Palabra) · <strong>LBS</strong> (Líder Bautizado y Servicio)
                        </Alert>
                        {form.integrantes.map((ing, i) => (
                            <Box key={i} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', position: 'relative' }}>
                                <Box sx={{ display: 'flex', gap: 2, mb: 1.5, alignItems: 'flex-end' }}>
                                    <TextField label={`Nombre integrante ${i + 1}`} value={ing.nombre}
                                        onChange={e => setIntegrante(i, 'nombre', e.target.value)}
                                        size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                    <TextField label="Edad" value={ing.edad}
                                        onChange={e => setIntegrante(i, 'edad', e.target.value)}
                                        size="small" type="number" sx={{ width: 80, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                    <IconButton size="small" color="error" onClick={() => removeIntegrante(i)}
                                        disabled={form.integrantes.length <= 1}
                                        sx={{ mb: 0.5 }}>
                                        <RemoveRowIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 3, pl: 0.5 }}>
                                    <FormControlLabel
                                        control={<Checkbox size="small" checked={ing.mcd} onChange={e => setIntegrante(i, 'mcd', e.target.checked)}
                                            sx={{ '&.Mui-checked': { color: CCO.azul } }} />}
                                        label={<Typography variant="caption" fontWeight={700}>MCD</Typography>}
                                    />
                                    <FormControlLabel
                                        control={<Checkbox size="small" checked={ing.npt} onChange={e => setIntegrante(i, 'npt', e.target.checked)}
                                            sx={{ '&.Mui-checked': { color: CCO.celeste } }} />}
                                        label={<Typography variant="caption" fontWeight={700}>NPT</Typography>}
                                    />
                                    <FormControlLabel
                                        control={<Checkbox size="small" checked={ing.lbs} onChange={e => setIntegrante(i, 'lbs', e.target.checked)}
                                            sx={{ '&.Mui-checked': { color: CCO.naranja } }} />}
                                        label={<Typography variant="caption" fontWeight={700}>LBS</Typography>}
                                    />
                                </Box>
                            </Box>
                        ))}
                        <Button startIcon={<AddRowIcon />} onClick={addIntegrante} variant="outlined"
                            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', borderColor: CCO.azul, color: CCO.azul }}>
                            Agregar integrante
                        </Button>
                    </Stack>
                )}

                {/* ── Tab 2: Foto y Estado ── */}
                {tab === 2 && (
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {/* Foto de la tarjeta */}
                        <Box>
                            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>📸 Foto de la Tarjeta</Typography>
                            <Box onClick={() => fileRef.current?.click()} sx={{
                                width: '100%', aspectRatio: '4/3', borderRadius: 3,
                                border: `2px dashed ${alpha(CCO.naranja, 0.4)}`,
                                bgcolor: alpha(CCO.naranja, 0.03),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', overflow: 'hidden',
                                '&:hover': { borderColor: CCO.naranja, bgcolor: alpha(CCO.naranja, 0.06) }
                            }}>
                                {preview ? (
                                    <Box component="img" src={preview}
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <Stack alignItems="center" spacing={1}>
                                        <PhotoIcon sx={{ fontSize: 52, color: alpha(CCO.naranja, 0.5) }} />
                                        <Typography variant="caption" color="text.secondary">
                                            Haz clic para subir la foto de la tarjeta "Casa Conectada"
                                        </Typography>
                                    </Stack>
                                )}
                            </Box>
                            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
                            {preview && (
                                <Button size="small" color="error" sx={{ mt: 0.5, fontSize: 11, textTransform: 'none' }}
                                    onClick={() => { setPreview(null); set('fotografia', null); }}>
                                    Quitar foto
                                </Button>
                            )}
                        </Box>

                        <TextField select label="Estado" value={form.estado} onChange={e => set('estado', e.target.value)}
                            size="small" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                            {Object.entries(ESTADO_CASA).map(([k, v]) => (
                                <MenuItem key={k} value={k}>{v.emoji} {v.label}</MenuItem>
                            ))}
                        </TextField>

                        <FormControlLabel
                            control={<Checkbox checked={form.casaConsolidandose}
                                onChange={e => set('casaConsolidandose', e.target.checked)}
                                sx={{ '&.Mui-checked': { color: CCO.celeste } }} />}
                            label={<Typography variant="body2" fontWeight={700}>🏠 Casa Consolidándose</Typography>}
                        />

                        <TextField label="Observaciones / Testimonio" value={form.observaciones}
                            onChange={e => set('observaciones', e.target.value)}
                            size="small" fullWidth multiline rows={4}
                            placeholder="Describa si existió algún impedimento para seguir el proceso o si culminó detalle a que hogar de bendición los destinó..."
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Stack>
                )}
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2, gap: 1, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {tab > 0 && (
                        <Button onClick={() => setTab(t => t - 1)} variant="outlined" color="inherit"
                            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
                            ← Anterior
                        </Button>
                    )}
                    {tab < 2 && (
                        <Button onClick={() => setTab(t => t + 1)} variant="outlined"
                            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', borderColor: CCO.azul, color: CCO.azul }}>
                            Siguiente →
                        </Button>
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2, fontWeight: 700 }}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSubmit}
                        disabled={saving || !form.nombreHijoDePaz?.trim() || !form.lider?.trim()}
                        sx={{ borderRadius: 3, px: 3, fontWeight: 800, textTransform: 'none', bgcolor: CCO.naranja, '&:hover': { bgcolor: '#e55a24' } }}>
                        {saving ? 'Guardando...' : tipo === 'crear' ? 'Registrar Casa' : 'Guardar Cambios'}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
}

// ─── MODAL DETALLE (ver) ──────────────────────────────────────
function CasaDetalleModal({ open, item, onClose, onEditar }) {
    if (!item) return null;
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HouseIcon sx={{ color: CCO.naranja }} />
                    <Box>
                        <Typography fontWeight={900} fontSize={16}>{item.nombreHijoDePaz}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.codigo} · {item.operacion}</Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" startIcon={<EditIcon />} onClick={onEditar}
                        sx={{ textTransform: 'none', fontWeight: 700, color: CCO.azul }}>Editar</Button>
                    <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
                </Box>
            </DialogTitle>
            <Divider />
            <DialogContent>
                <Grid container spacing={3}>
                    {/* Columna izquierda: foto */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: alpha(CCO.naranja, 0.05),
                            border: `1.5px solid ${alpha(CCO.naranja, 0.2)}`, aspectRatio: '4/3',
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.fotografia ? (
                                <Box component="img" src={item.fotografia}
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <Stack alignItems="center" spacing={1} sx={{ p: 3 }}>
                                    <PhotoIcon sx={{ fontSize: 40, color: alpha(CCO.naranja, 0.4) }} />
                                    <Typography variant="caption" color="text.secondary" textAlign="center">
                                        Sin foto de tarjeta
                                    </Typography>
                                </Stack>
                            )}
                        </Box>
                        <Box sx={{ mt: 2 }}>
                            <EstadoChip estado={item.estado} size="medium" />
                            {item.casaConsolidandose && (
                                <Chip label="🏠 Consolidándose" size="small" sx={{ mt: 1, fontWeight: 700,
                                    bgcolor: alpha(CCO.celeste, 0.15), color: CCO.celeste,
                                    border: `1px solid ${alpha(CCO.celeste, 0.3)}` }} />
                            )}
                        </Box>
                    </Grid>

                    {/* Columna derecha: datos */}
                    <Grid item xs={12} md={8}>
                        {/* 1ª Visita */}
                        <Box sx={{ mb: 2, p: 2, borderRadius: 3, bgcolor: alpha(CCO.azul, 0.04),
                            border: `1px solid ${alpha(CCO.azul, 0.1)}` }}>
                            <Typography variant="caption" fontWeight={900} color="primary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1, display: 'block' }}>
                                Primera Visita
                            </Typography>
                            <Stack spacing={0.6}>
                                {[
                                    ['Fecha', item.fechaPrimeraVisita ? new Date(item.fechaPrimeraVisita).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'],
                                    ['Líder', item.lider],
                                    ['Red', item.red || '—'],
                                    ['Familia', item.familia || '—'],
                                    ['Dirección', item.direccion || '—'],
                                    ['Celular', item.celular || '—'],
                                    ['Día de visita', item.diaVisita || '—'],
                                ].map(([label, val]) => (
                                    <Box key={label} sx={{ display: 'flex', gap: 1 }}>
                                        <Typography variant="caption" fontWeight={700} sx={{ width: 90, flexShrink: 0, color: 'text.secondary' }}>
                                            {label}:
                                        </Typography>
                                        <Typography variant="caption">{val}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>

                        {/* 2ª Visita – Integrantes */}
                        {item.integrantes?.length > 0 && (
                            <Box sx={{ mb: 2, p: 2, borderRadius: 3, bgcolor: alpha(CCO.celeste, 0.05),
                                border: `1px solid ${alpha(CCO.celeste, 0.2)}` }}>
                                <Typography variant="caption" fontWeight={900} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5, display: 'block', color: CCO.celeste }}>
                                    Segunda Visita — Integrantes
                                </Typography>
                                <Box sx={{ overflowX: 'auto' }}>
                                    <Table size="small">
                                        <TableBody>
                                            <TableRow sx={{ '& td': { fontWeight: 800, fontSize: 10, pb: 0.75 } }}>
                                                <TableCell>Nombre</TableCell>
                                                <TableCell align="center">Edad</TableCell>
                                                <TableCell align="center">MCD</TableCell>
                                                <TableCell align="center">NPT</TableCell>
                                                <TableCell align="center">LBS</TableCell>
                                            </TableRow>
                                            {item.integrantes.map((ing, i) => (
                                                <TableRow key={i} sx={{ '& td': { py: 0.5 } }}>
                                                    <TableCell sx={{ fontSize: 12 }}>{ing.nombre}</TableCell>
                                                    <TableCell align="center" sx={{ fontSize: 12 }}>{ing.edad}</TableCell>
                                                    <TableCell align="center"><Indicador label="" checked={ing.mcd} color={CCO.azul} /></TableCell>
                                                    <TableCell align="center"><Indicador label="" checked={ing.npt} color={CCO.celeste} /></TableCell>
                                                    <TableCell align="center"><Indicador label="" checked={ing.lbs} color={CCO.naranja} /></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </Box>
                        )}

                        {/* Observaciones */}
                        {item.observaciones && (
                            <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(CCO.violeta, 0.05),
                                border: `1px solid ${alpha(CCO.violeta, 0.15)}` }}>
                                <Typography variant="caption" fontWeight={900} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5, display: 'block', color: CCO.violeta }}>
                                    Observaciones
                                </Typography>
                                <Typography variant="caption">{item.observaciones}</Typography>
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
}

// ─── CARD CASA DE PAZ ────────────────────────────────────────
function CasaCard({ item, canEdit, onVer, onEditar, onEliminar }) {
    const cfg = ESTADO_CASA[item.estado] || { color: '#777' };
    return (
        <Card elevation={0} sx={{
            borderRadius: 3, border: '1.5px solid',
            borderColor: alpha(cfg.color, 0.25),
            transition: 'all 0.2s ease', height: '100%', display: 'flex', flexDirection: 'column',
            '&:hover': {
                borderColor: cfg.color,
                boxShadow: `0 6px 20px ${alpha(cfg.color, 0.12)}`,
                transform: 'translateY(-2px)',
            }
        }}>
            {/* Foto miniatura si existe */}
            {item.fotografia && (
                <Box sx={{ height: 100, overflow: 'hidden', borderRadius: '12px 12px 0 0', cursor: 'pointer' }}
                    onClick={() => onVer(item)}>
                    <Box component="img" src={item.fotografia}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
            )}
            <CardContent sx={{ flex: 1, pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
                        <Typography variant="body2" fontWeight={800} noWrap title={item.nombreHijoDePaz}>
                            {item.nombreHijoDePaz}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" noWrap>
                            {item.codigo} · Líder: {item.lider}
                        </Typography>
                    </Box>
                    <EstadoChip estado={item.estado} />
                </Box>

                <Stack spacing={0.5} sx={{ mb: 1 }}>
                    {item.red && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <BadgeIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.secondary">Red: {item.red}</Typography>
                        </Box>
                    )}
                    {item.direccion && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <LocationIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.secondary" noWrap>{item.direccion}</Typography>
                        </Box>
                    )}
                    {item.diaVisita && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <CalIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.secondary">Visita: {item.diaVisita}</Typography>
                        </Box>
                    )}
                </Stack>

                {item.integrantes?.length > 0 && (
                    <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.disabled" fontWeight={600}>
                            👥 {item.integrantes.length} integrante{item.integrantes.length !== 1 ? 's' : ''}
                        </Typography>
                        {item.casaConsolidandose && (
                            <Chip label="🏠 Consolidándose" size="small" sx={{ ml: 1, fontSize: 9, fontWeight: 700,
                                bgcolor: alpha(CCO.celeste, 0.12), color: CCO.celeste }} />
                        )}
                    </Box>
                )}
            </CardContent>

            <CardActions sx={{ px: 1.5, pb: 1.5, pt: 0, gap: 0.5 }}>
                <Button size="small" onClick={() => onVer(item)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: 11,
                        color: CCO.azul, bgcolor: alpha(CCO.azul, 0.07), '&:hover': { bgcolor: alpha(CCO.azul, 0.14) } }}>
                    Ver detalle
                </Button>
                {canEdit && (
                    <>
                        <Tooltip title="Editar" arrow>
                            <IconButton size="small" onClick={() => onEditar(item)}
                                sx={{ bgcolor: alpha(CCO.naranja, 0.08), borderRadius: 1.5 }}>
                                <EditIcon fontSize="small" sx={{ color: CCO.naranja }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar" arrow>
                            <IconButton size="small" color="error" onClick={() => onEliminar(item.id)}
                                sx={{ bgcolor: alpha('#f44336', 0.08), borderRadius: 1.5, ml: 'auto' }}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </>
                )}
            </CardActions>
        </Card>
    );
}

// ═══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function CasasDePazPage() {
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const canEdit = ['admin', 'director'].includes(user?.rol);

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [buscar, setBuscar] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [vistaMode, setVistaMode] = useState('cards');
    const [formModal, setFormModal] = useState({ open: false, tipo: null, item: null });
    const [detalleModal, setDetalleModal] = useState({ open: false, item: null });

    const cargar = useCallback(() => {
        setLoading(true);
        setTimeout(() => { setRows(getCasas()); setLoading(false); }, 200);
    }, []);
    useEffect(() => { cargar(); }, [cargar]);

    const filtered = useMemo(() => rows.filter(r => {
        const txt = `${r.nombreHijoDePaz} ${r.lider} ${r.codigo} ${r.red} ${r.operacion}`.toLowerCase();
        if (buscar && !txt.includes(buscar.toLowerCase())) return false;
        if (filtroEstado && r.estado !== filtroEstado) return false;
        return true;
    }), [rows, buscar, filtroEstado]);

    const hayFiltros = buscar || filtroEstado;

    const handleConfirm = (form) => {
        const casas = getCasas();
        if (formModal.tipo === 'crear') {
            casas.push({ ...form, id: nextId++, createdAt: new Date().toISOString().split('T')[0] });
            enqueueSnackbar('Casa de Paz registrada', { variant: 'success' });
        } else {
            const idx = casas.findIndex(c => c.id === formModal.item.id);
            if (idx >= 0) casas[idx] = { ...casas[idx], ...form };
            enqueueSnackbar('Casa de Paz actualizada', { variant: 'success' });
        }
        saveCasas(casas);
        setFormModal(m => ({ ...m, open: false }));
        cargar();
    };

    const handleEliminar = (id) => {
        if (!window.confirm('¿Eliminar esta Casa de Paz?')) return;
        saveCasas(getCasas().filter(c => c.id !== id));
        enqueueSnackbar('Casa de Paz eliminada', { variant: 'success' });
        cargar();
    };

    const stats = useMemo(() => ({
        total: rows.length,
        enProgreso: rows.filter(r => r.estado === 'EnProgreso').length,
        completadas: rows.filter(r => r.estado === 'Completada').length,
    }), [rows]);

    const columns = [
        {
            field: 'casa', headerName: 'Casa de Paz',
            renderCell: r => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, overflow: 'hidden', flexShrink: 0,
                        bgcolor: alpha(CCO.naranja, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px dashed ${alpha(CCO.naranja, 0.3)}` }}>
                        {r.fotografia
                            ? <Box component="img" src={r.fotografia} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <HouseIcon sx={{ color: alpha(CCO.naranja, 0.6), fontSize: 20 }} />
                        }
                    </Box>
                    <Box>
                        <Typography variant="body2" fontWeight={700}>{r.nombreHijoDePaz}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.codigo} · Líder: {r.lider}</Typography>
                    </Box>
                </Box>
            )
        },
        { field: 'estado', headerName: 'Estado', renderCell: r => <EstadoChip estado={r.estado} /> },
        { field: 'red', headerName: 'Red', renderCell: r => <Typography variant="caption">{r.red || '—'}</Typography> },
        { field: 'diaVisita', headerName: 'Día', renderCell: r => <Typography variant="caption">{r.diaVisita || '—'}</Typography> },
        {
            field: 'integrantes', headerName: 'Integrantes',
            renderCell: r => <Chip label={`👥 ${r.integrantes?.length || 0}`} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: 10 }} />
        },
        {
            field: 'fechaPrimeraVisita', headerName: '1ª Visita',
            renderCell: r => <Typography variant="caption" color="text.secondary">
                {r.fechaPrimeraVisita ? new Date(r.fechaPrimeraVisita).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </Typography>
        },
        {
            field: 'acciones', headerName: 'Acciones', align: 'right',
            renderCell: r => (
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title="Ver detalle" arrow>
                        <IconButton size="small" onClick={() => setDetalleModal({ open: true, item: r })}
                            sx={{ bgcolor: alpha(CCO.azul, 0.08), borderRadius: 1.5 }}>
                            <PersonIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {canEdit && (
                        <>
                            <Tooltip title="Editar" arrow>
                                <IconButton size="small" onClick={() => setFormModal({ open: true, tipo: 'editar', item: r })}
                                    sx={{ bgcolor: alpha(CCO.naranja, 0.08), borderRadius: 1.5 }}>
                                    <EditIcon fontSize="small" sx={{ color: CCO.naranja }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar" arrow>
                                <IconButton size="small" color="error" onClick={() => handleEliminar(r.id)}
                                    sx={{ bgcolor: alpha('#f44336', 0.08), borderRadius: 1.5 }}>
                                    <DeleteIcon fontSize="small" />
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
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1500, mx: 'auto' }}>

                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={900} sx={{
                            background: `linear-gradient(45deg, ${CCO.naranja}, ${CCO.violeta})`,
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>Casas de Paz</Typography>
                        <Typography color="text.secondary" fontWeight={500}>
                            {stats.total} registradas · {stats.enProgreso} en progreso · {stats.completadas} completadas
                        </Typography>
                    </Box>
                    {canEdit && (
                        <Button variant="contained" startIcon={<AddIcon />}
                            onClick={() => setFormModal({ open: true, tipo: 'crear', item: null })}
                            sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 800, textTransform: 'none',
                                bgcolor: CCO.naranja, boxShadow: `0 4px 14px ${alpha(CCO.naranja, 0.35)}`,
                                '&:hover': { bgcolor: '#e55a24' } }}>
                            Nueva Casa de Paz
                        </Button>
                    )}
                </Box>

                {/* KPIs */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[
                        { label: 'Total', value: stats.total, color: CCO.azul, icon: <HouseIcon /> },
                        { label: 'En Progreso', value: stats.enProgreso, color: CCO.naranja, icon: <CalIcon /> },
                        { label: 'Completadas', value: stats.completadas, color: '#4caf50', icon: <PersonIcon /> },
                        { label: 'Mostrando', value: filtered.length, color: CCO.violeta, icon: <FilterIcon /> },
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
                        <TextField size="small" placeholder="Buscar por nombre, líder, código, red..."
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
                        <TextField select size="small" label="Estado" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                            sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}>
                            <MenuItem value="">Todos</MenuItem>
                            {Object.entries(ESTADO_CASA).map(([k, v]) => (
                                <MenuItem key={k} value={k}>{v.emoji} {v.label}</MenuItem>
                            ))}
                        </TextField>
                        {hayFiltros && (
                            <Tooltip title="Limpiar" arrow>
                                <IconButton onClick={() => { setBuscar(''); setFiltroEstado(''); }}
                                    sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                                    <ClearIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Box sx={{ ml: 'auto' }}>
                            <ToggleButtonGroup value={vistaMode} exclusive onChange={(_, v) => v && setVistaMode(v)} size="small">
                                <ToggleButton value="cards" sx={{ borderRadius: '8px 0 0 8px', px: 1.5 }}>
                                    <Tooltip title="Tarjetas" arrow><HouseIcon fontSize="small" /></Tooltip>
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
                            {filtroEstado && <Chip label={`${ESTADO_CASA[filtroEstado]?.emoji} ${ESTADO_CASA[filtroEstado]?.label}`} size="small" onDelete={() => setFiltroEstado('')} sx={{ fontWeight: 700 }} />}
                            <Chip label={`${filtered.length} resultados`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                        </Box>
                    )}
                </Paper>

                {/* Cards */}
                {vistaMode === 'cards' && (
                    loading ? (
                        <Grid container spacing={2}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                                    <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} />
                                </Grid>
                            ))}
                        </Grid>
                    ) : filtered.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography fontSize={48}>🏠</Typography>
                            <Typography variant="h6" fontWeight={700} color="text.secondary">No se encontraron Casas de Paz</Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2} alignItems="stretch">
                            {filtered.map(item => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id} sx={{ display: 'flex' }}>
                                    <CasaCard item={item} canEdit={canEdit}
                                        onVer={(r) => setDetalleModal({ open: true, item: r })}
                                        onEditar={(r) => setFormModal({ open: true, tipo: 'editar', item: r })}
                                        onEliminar={handleEliminar} />
                                </Grid>
                            ))}
                        </Grid>
                    )
                )}

                {/* Tabla */}
                {vistaMode === 'tabla' && (
                    <DataTable columns={columns} rows={filtered} loading={loading} searchPlaceholder="Buscar..." actions={false} />
                )}
            </Box>

            {/* Modales */}
            <CasaFormModal
                open={formModal.open} tipo={formModal.tipo} item={formModal.item}
                onClose={() => setFormModal(m => ({ ...m, open: false }))}
                onConfirm={handleConfirm}
            />
            <CasaDetalleModal
                open={detalleModal.open} item={detalleModal.item}
                onClose={() => setDetalleModal({ open: false, item: null })}
                onEditar={() => {
                    const it = detalleModal.item;
                    setDetalleModal({ open: false, item: null });
                    setFormModal({ open: true, tipo: 'editar', item: it });
                }}
            />
        </MainLayout>
    );
}
