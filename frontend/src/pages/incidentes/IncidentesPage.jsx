import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Button, Chip, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    CircularProgress, Stack, Paper, Table, TableBody, TableCell,
    TableHead, TableRow, TablePagination, IconButton, Tooltip, alpha,
    useTheme, MenuItem, InputAdornment, Divider, Collapse, Skeleton
} from '@mui/material';
import {
    Add as AddIcon,
    ReportProblem as IncidenteIcon,
    Search as SearchIcon,
    Visibility as ViewIcon,
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    CalendarMonth as CalendarIcon,
    Person as PersonIcon,
    Warning as WarnIcon,
    Comment as CommentIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import { useParams, useNavigate } from 'react-router-dom';
import { incidentesService } from '../../services/appServices';

// ─── Paleta CCO ───────────────────────────────────────────────────────────────
const CCO = { rojo: '#d32f2f', naranja: '#FF8C00', violeta: '#6A5ACD' };



// ─── CHIP de tipo de abuso ────────────────────────────────────────────────────
const TIPO_COLORS = {
    'Físico': { bg: '#ffebee', color: '#c62828' },
    'Verbal': { bg: '#fff8e1', color: '#f57f17' },
    'Emocional': { bg: '#e8eaf6', color: '#3949ab' },
    'Sexual': { bg: '#fce4ec', color: '#ad1457' },
    'Negligencia': { bg: '#e8f5e9', color: '#2e7d32' },
    'Otro': { bg: '#f3e5f5', color: '#6a1b9a' },
};

const TipoChip = ({ tipo }) => {
    const col = TIPO_COLORS[tipo] || { bg: '#eeeeee', color: '#333' };
    return (
        <Chip
            label={tipo}
            size="small"
            icon={<WarnIcon style={{ color: col.color, fontSize: 14 }} />}
            sx={{ bgcolor: col.bg, color: col.color, fontWeight: 600, fontSize: '0.72rem', border: `1px solid ${col.color}30` }}
        />
    );
};

// ─── CARD de reporte ──────────────────────────────────────────────────────────
const ReporteCard = ({ reporte, onView }) => {
    const theme = useTheme();
    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderColor: alpha(CCO.rojo, 0.25),
                '&:hover': { boxShadow: `0 4px 20px ${alpha(CCO.rojo, 0.15)}`, transform: 'translateY(-2px)', borderColor: alpha(CCO.rojo, 0.5) },
            }}
            onClick={() => onView(reporte)}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <TipoChip tipo={reporte.tipoAbuso} />
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                            {new Date(reporte.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Typography>
                    </Stack>
                </Stack>

                <Typography variant="body2" sx={{ mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                    {reporte.descripcion}
                </Typography>

                <Divider sx={{ mb: 1.5, opacity: 0.3 }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack spacing={0.25}>
                        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                            Infante(s) involucrado(s)
                        </Typography>
                        {reporte.infantes.map(inf => (
                            <Typography key={inf.id} variant="caption" sx={{ fontWeight: 500 }}>
                                {inf.persona.nombres} {inf.persona.apellidos} — {inf.codigo}
                            </Typography>
                        ))}
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">

                        <PersonIcon sx={{ fontSize: '12px !important' }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{reporte.reportadoPor?.username}</Typography>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};

// ─── DIALOG de detalle ────────────────────────────────────────────────────────
const DetalleDialog = ({ reporte, open, onClose, onSeguimientoAdd, canEdit }) => {
    const theme = useTheme();
    const [nuevoSeguimiento, setNuevoSeguimiento] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    if (!reporte) return null;

    const handleAgregarSeguimiento = async () => {
        if (!nuevoSeguimiento.trim()) return;
        setLoading(true);
        await onSeguimientoAdd(reporte.id, nuevoSeguimiento.trim());
        setNuevoSeguimiento('');
        setLoading(false);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ pb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar sx={{ bgcolor: alpha(CCO.rojo, 0.12), width: 40, height: 40 }}>
                        <IncidenteIcon sx={{ color: CCO.rojo, fontSize: 22 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            Reporte #{reporte.id} — {reporte.tipoAbuso}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {new Date(reporte.fecha).toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                        </Typography>
                    </Box>
                </Stack>
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2.5}>
                    {/* Infantes involucrados */}
                    <Grid item xs={12}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Infante(s) involucrado(s)</Typography>
                        <Stack direction="row" flexWrap="wrap" gap={1} mt={0.5}>
                            {reporte.infantes.map(inf => (
                                <Chip
                                    key={inf.id}
                                    avatar={<Avatar sx={{ bgcolor: CCO.violeta }}>{inf.persona.nombres[0]}</Avatar>}
                                    label={`${inf.persona.nombres} ${inf.persona.apellidos} (${inf.codigo})`}
                                    variant="outlined"
                                    size="small"
                                />
                            ))}
                        </Stack>
                    </Grid>

                    {/* Descripción */}
                    <Grid item xs={12}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Descripción del Incidente</Typography>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 0.5, bgcolor: alpha(CCO.rojo, 0.03) }}>
                            <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{reporte.descripcion}</Typography>
                        </Paper>
                    </Grid>

                    {/* Tipo */}
                    <Grid item xs={6}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Tipo de Agresión</Typography>
                        <Box mt={0.5}><TipoChip tipo={reporte.tipoAbuso} /></Box>
                    </Grid>

                    {/* Reportado por */}
                    <Grid item xs={6}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Reportado por</Typography>
                        <Stack direction="row" alignItems="center" spacing={0.75} mt={0.5}>
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="body2">{reporte.reportadoPor.username} ({reporte.reportadoPor.rol})</Typography>
                        </Stack>
                    </Grid>

                    {/* Acciones Tomadas / Seguimiento */}
                    <Grid item xs={12}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
                            Acciones Tomadas ({reporte.seguimientos?.length || 0})
                        </Typography>
                        <Stack spacing={2} mt={5} alignItems="center">
                            {(!reporte.seguimientos || reporte.seguimientos.length === 0) && (
                                <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                                    No se han registrado acciones aún.
                                </Typography>
                            )}
                            {reporte.seguimientos?.map((s, i) => (
                                <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.03), width: '100%', borderLeft: `1px solid ${theme.palette.success.main}` }}>
                                    <Stack direction="row" justifyContent="space-between" mb={1}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.success.main, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            {s.usuario?.username}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(s.fecha).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                    </Stack>
                                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{s.texto}</Typography>
                                </Paper>
                            ))}

                            {canEdit && (
                                <Box sx={{ mt: 5, p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.03), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, width: '100%' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block', color: theme.palette.primary.main }}>Nueva Acción</Typography>
                                    <TextField
                                        fullWidth
                                        placeholder="Describe la acción realizada de forma clara..."
                                        value={nuevoSeguimiento}
                                        onChange={e => setNuevoSeguimiento(e.target.value)}
                                        multiline
                                        rows={3}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                bgcolor: '#fff'
                                            },
                                            mb: 1.5
                                        }}
                                    />
                                    <Stack direction="row" justifyContent="flex-end">
                                        <Button
                                            variant="contained"
                                            onClick={handleAgregarSeguimiento}
                                            disabled={!nuevoSeguimiento.trim() || loading}
                                            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                                            sx={{
                                                borderRadius: 2,
                                                px: 4,
                                                bgcolor: theme.palette.success.main,
                                                '&:hover': { bgcolor: theme.palette.success.dark }
                                            }}
                                        >
                                            Registrar Acción
                                        </Button>
                                    </Stack>
                                </Box>
                            )}
                        </Stack>
                    </Grid>


                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
};

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
const TIPOS_ABUSO = ['Físico', 'Verbal', 'Emocional', 'Sexual', 'Negligencia', 'Otro'];

export default function IncidentesPage() {
    const theme = useTheme();
    const { user, hasRole } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    const [reportes, setReportes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [buscar, setBuscar] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('all');
    const [selected, setSelected] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(6);

    const canEdit = hasRole('admin', 'director', 'proteccion');

    const fetchReportes = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: page + 1,
                limit: rowsPerPage,
                tipoAbuso: filtroTipo === 'all' ? undefined : filtroTipo,
                // Puedes añadir búsqueda por texto aquí si el backend lo soporta
            };
            const res = await incidentesService.listar(params);
            setReportes(res.data);
            setTotal(res.total);
        } catch (err) {
            enqueueSnackbar('Error al cargar reportes', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, filtroTipo, enqueueSnackbar]);

    useEffect(() => {
        fetchReportes();
    }, [fetchReportes]);

    const filtered = useMemo(() => {
        if (!buscar) return reportes;
        return reportes.filter(r => {
            const matchBuscar = [
                r.descripcion,
                r.tipoAbuso,
                r.reportadoPor?.username,
                ...r.infantes.map(i => `${i.persona?.nombres} ${i.persona?.apellidos}`)
            ].some(s => s?.toLowerCase().includes(buscar.toLowerCase()));
            return matchBuscar;
        });
    }, [reportes, buscar]);

    const handleSeguimientoAdd = async (id, texto) => {
        try {
            const res = await incidentesService.agregarSeguimiento(id, texto);
            // El backend devuelve { success: true, data: { ...seguimiento } }
            const nuevo = res.data;

            setReportes(prev => prev.map(r => r.id === id ? {
                ...r,
                seguimientos: [...(r.seguimientos || []), nuevo]
            } : r));

            if (selected?.id === id) {
                setSelected(prev => ({
                    ...prev,
                    seguimientos: [...(prev.seguimientos || []), nuevo]
                }));
            }

            enqueueSnackbar('Acción registrada exitosamente', { variant: 'success' });
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al registrar la acción';
            enqueueSnackbar(msg, { variant: 'error' });
        }
    };

    const stats = {
        total: total,
        fisico: reportes.filter(r => r.tipoAbuso === 'Físico').length,
        verbal: reportes.filter(r => r.tipoAbuso === 'Verbal').length,
    };

    return (
        <MainLayout>
            <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>

                {/* ─── Header ─────────────────────────────────────────────────── */}
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={3} spacing={2}>
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
                            <Avatar sx={{ bgcolor: alpha(CCO.rojo, 0.12), width: 44, height: 44 }}>
                                <IncidenteIcon sx={{ color: CCO.rojo, fontSize: 24 }} />
                            </Avatar>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>Reportes de Incidentes</Typography>
                                <Typography variant="body2" color="text.secondary">Panel de seguimiento y gestión de incidentes</Typography>
                            </Box>
                        </Stack>
                    </Box>
                </Stack>

                {/* ─── Estadísticas ────────────────────────────────────────────── */}
                <Grid container spacing={2} mb={3}>
                    {[
                        { label: 'Total Reportes', value: stats.total, color: CCO.rojo },
                        { label: 'Agresión Física', value: stats.fisico, color: '#c62828' },
                        { label: 'Agresión Verbal', value: stats.verbal, color: '#f57f17' },
                    ].map(({ label, value, color }) => (
                        <Grid item xs={6} sm={3} key={label}>
                            <Card variant="outlined" sx={{ borderRadius: 3, borderColor: alpha(color, 0.3), textAlign: 'center', p: 2 }}>
                                <Typography variant="h4" sx={{ fontWeight: 800, color }}>{value}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* ─── Filtros ─────────────────────────────────────────────────── */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={3}>
                    <TextField
                        placeholder="Buscar por infante, tipo o descripción..."
                        value={buscar}
                        onChange={e => setBuscar(e.target.value)}
                        size="small"
                        sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment> }}
                    />
                    <TextField
                        select
                        size="small"
                        value={filtroTipo}
                        onChange={e => { setFiltroTipo(e.target.value); setPage(0); }}
                        sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        label="Tipo de agresión"
                    >
                        <MenuItem value="all">Todos los tipos</MenuItem>
                        {TIPOS_ABUSO.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </TextField>
                </Stack>

                {/* ─── Lista de reportes ───────────────────────────────────────── */}
                {loading ? (
                    <Grid container spacing={2}>
                        {[1, 2, 3].map(i => (
                            <Grid item xs={12} sm={6} md={4} key={i}>
                                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
                            </Grid>
                        ))}
                    </Grid>
                ) : filtered.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                        <IncidenteIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">No se encontraron reportes</Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={2}>
                        {filtered.map(r => (
                            <Grid item xs={12} sm={6} md={4} key={r.id}>
                                <ReporteCard reporte={r} onView={rep => setSelected(rep)} />
                            </Grid>
                        ))}
                    </Grid>
                )}

                {total > rowsPerPage && (
                    <Box display="flex" justifyContent="center" mt={3}>
                        <TablePagination
                            component="div"
                            count={total}
                            page={page}
                            rowsPerPage={rowsPerPage}
                            onPageChange={(_, p) => setPage(p)}
                            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
                            rowsPerPageOptions={[6, 12, 24]}
                            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                            labelRowsPerPage="Filas por página"
                        />
                    </Box>
                )}
            </Box>

            {/* ─── Dialog de detalle ────────────────────────────────────────────── */}
            <DetalleDialog
                reporte={selected}
                open={!!selected}
                onClose={() => setSelected(null)}
                onSeguimientoAdd={handleSeguimientoAdd}
                canEdit={canEdit}
            />
        </MainLayout>
    );
}
