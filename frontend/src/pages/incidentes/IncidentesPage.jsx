import { useState, useMemo } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Button, Chip, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    CircularProgress, Stack, Paper, Table, TableBody, TableCell,
    TableHead, TableRow, TablePagination, IconButton, Tooltip, alpha,
    useTheme, MenuItem, InputAdornment, Divider, Collapse,
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
    PhotoCamera as PhotoIcon,
    Comment as CommentIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import { useParams, useNavigate } from 'react-router-dom';

// ─── Paleta CCO ───────────────────────────────────────────────────────────────
const CCO = { rojo: '#d32f2f', naranja: '#FF8C00', violeta: '#6A5ACD' };

// ─── Tipos de abuso (mock) ────────────────────────────────────────────────────
const TIPOS_ABUSO = ['Físico', 'Verbal', 'Emocional', 'Sexual', 'Negligencia', 'Otro'];

// ─── Mock Infantes ─────────────────────────────────────────────────────────────
const MOCK_INFANTES = [
    { id: 1, codigo: 'INF-001', persona: { nombres: 'María Gabriela', apellidos: 'López Mendoza' } },
    { id: 2, codigo: 'INF-002', persona: { nombres: 'José Andrés', apellidos: 'Pérez Villao' } },
    { id: 3, codigo: 'INF-003', persona: { nombres: 'Camila Sofía', apellidos: 'Torres Aragundi' } },
    { id: 4, codigo: 'INF-004', persona: { nombres: 'Sebastián', apellidos: 'Morales Intriago' } },
    { id: 5, codigo: 'INF-005', persona: { nombres: 'Valentina', apellidos: 'Cedeño Bravo' } },
];

// ─── Mock Reportes ─────────────────────────────────────────────────────────────
const MOCK_REPORTES = [
    {
        id: 1,
        fecha: '2026-03-20',
        tipoAbuso: 'Físico',
        descripcion: 'El infante presentó marcas en el brazo derecho. Reportó que ocurrió en el hogar durante el fin de semana.',
        foto: null,
        reportadoPor: { username: 'tutor1', rol: 'tutor' },
        infantes: [MOCK_INFANTES[0]],
        comentarios: [
            { autor: 'admin', texto: 'Se notificó a protección de menores. Seguimiento programado para el 25 de marzo.', fecha: '2026-03-21' }
        ],
    },
    {
        id: 2,
        fecha: '2026-03-15',
        tipoAbuso: 'Verbal',
        descripcion: 'Se reportó lenguaje inapropiado dirigido al infante por parte de un familiar el día de la actividad.',
        foto: null,
        reportadoPor: { username: 'tutor_especial1', rol: 'tutor_especial' },
        infantes: [MOCK_INFANTES[1], MOCK_INFANTES[2]],
        comentarios: [],
    },
    {
        id: 3,
        fecha: '2026-03-10',
        tipoAbuso: 'Negligencia',
        descripcion: 'Infante presentó signos de desnutrición y ropa inadecuada para el clima. No fue recogido a tiempo en dos ocasiones.',
        foto: null,
        reportadoPor: { username: 'secretaria1', rol: 'secretaria' },
        infantes: [MOCK_INFANTES[3]],
        comentarios: [
            { autor: 'director', texto: 'Se coordinó con trabajadora social para visita domiciliaria.', fecha: '2026-03-11' },
        ],
    },
];

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
                        {reporte.comentarios.length > 0 && (
                            <Chip size="small" icon={<CommentIcon sx={{ fontSize: '12px !important' }} />} label={reporte.comentarios.length} sx={{ height: 20, fontSize: '0.65rem' }} />
                        )}
                        <Chip size="small" icon={<PersonIcon sx={{ fontSize: '12px !important' }} />} label={reporte.reportadoPor.username} sx={{ height: 20, fontSize: '0.65rem' }} />
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};

// ─── DIALOG de detalle ────────────────────────────────────────────────────────
const DetalleDialog = ({ reporte, open, onClose, onComentarioAdd, canEdit }) => {
    const [nuevoComentario, setNuevoComentario] = useState('');
    const { user } = useAuth();

    if (!reporte) return null;

    const handleAgregarComentario = () => {
        if (!nuevoComentario.trim()) return;
        onComentarioAdd(reporte.id, nuevoComentario.trim());
        setNuevoComentario('');
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
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

                    {/* Foto */}
                    {reporte.foto && (
                        <Grid item xs={12}>
                            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Evidencia Fotográfica</Typography>
                            <Box component="img" src={reporte.foto} alt="Evidencia" sx={{ mt: 0.5, maxWidth: '100%', maxHeight: 260, borderRadius: 2, objectFit: 'cover' }} />
                        </Grid>
                    )}

                    {/* Comentarios / Seguimiento */}
                    <Grid item xs={12}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
                            Comentarios de Seguimiento ({reporte.comentarios.length})
                        </Typography>
                        <Stack spacing={1.5} mt={1}>
                            {reporte.comentarios.length === 0 && (
                                <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                    Sin comentarios aún.
                                </Typography>
                            )}
                            {reporte.comentarios.map((c, i) => (
                                <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{c.autor}</Typography>
                                        <Typography variant="caption" color="text.secondary">{c.fecha}</Typography>
                                    </Stack>
                                    <Typography variant="body2">{c.texto}</Typography>
                                </Paper>
                            ))}

                            {canEdit && (
                                <Stack direction="row" spacing={1} mt={0.5}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Agregar comentario de seguimiento..."
                                        value={nuevoComentario}
                                        onChange={e => setNuevoComentario(e.target.value)}
                                        multiline
                                        rows={2}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={handleAgregarComentario}
                                        disabled={!nuevoComentario.trim()}
                                        sx={{ alignSelf: 'flex-end', borderRadius: 2, minWidth: 90 }}
                                    >
                                        Agregar
                                    </Button>
                                </Stack>
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
export default function IncidentesPage() {
    const theme = useTheme();
    const { user, hasRole } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    const [reportes, setReportes] = useState(MOCK_REPORTES);
    const [buscar, setBuscar] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('all');
    const [selected, setSelected] = useState(null);
    const [page, setPage] = useState(0);
    const rowsPerPage = 6;

    const canEdit = hasRole('admin', 'director', 'proteccion');

    const filtered = useMemo(() => {
        return reportes.filter(r => {
            const matchTipo = filtroTipo === 'all' || r.tipoAbuso === filtroTipo;
            const matchBuscar = !buscar || [
                r.descripcion,
                r.tipoAbuso,
                r.reportadoPor.username,
                ...r.infantes.map(i => `${i.persona.nombres} ${i.persona.apellidos}`)
            ].some(s => s?.toLowerCase().includes(buscar.toLowerCase()));
            return matchTipo && matchBuscar;
        });
    }, [reportes, buscar, filtroTipo]);

    const handleComentarioAdd = (reporteId, texto) => {
        setReportes(prev => prev.map(r =>
            r.id === reporteId
                ? { ...r, comentarios: [...r.comentarios, { autor: user.username, texto, fecha: new Date().toISOString().split('T')[0] }] }
                : r
        ));
        enqueueSnackbar('Comentario agregado', { variant: 'success' });
    };

    const stats = {
        total: reportes.length,
        fisico: reportes.filter(r => r.tipoAbuso === 'Físico').length,
        verbal: reportes.filter(r => r.tipoAbuso === 'Verbal').length,
        pending: reportes.filter(r => r.comentarios.length === 0).length,
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
                        { label: 'Sin Seguimiento', value: stats.pending, color: '#e65100' },
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
                {filtered.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                        <IncidenteIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">No se encontraron reportes</Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={2}>
                        {filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map(r => (
                            <Grid item xs={12} sm={6} md={4} key={r.id}>
                                <ReporteCard reporte={r} onView={rep => setSelected(rep)} />
                            </Grid>
                        ))}
                    </Grid>
                )}

                {filtered.length > rowsPerPage && (
                    <Box display="flex" justifyContent="center" mt={3}>
                        <TablePagination
                            component="div"
                            count={filtered.length}
                            page={page}
                            rowsPerPage={rowsPerPage}
                            onPageChange={(_, p) => setPage(p)}
                            rowsPerPageOptions={[]}
                            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                        />
                    </Box>
                )}
            </Box>

            {/* ─── Dialog de detalle ────────────────────────────────────────────── */}
            <DetalleDialog
                reporte={selected}
                open={!!selected}
                onClose={() => setSelected(null)}
                onComentarioAdd={handleComentarioAdd}
                canEdit={canEdit}
            />
        </MainLayout>
    );
}
