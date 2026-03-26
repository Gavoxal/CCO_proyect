import { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import {
    Box, Typography, Button, Chip, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, IconButton, alpha, useTheme,
    Tooltip, Avatar, Fade, Paper, Stack, useMediaQuery, FormControlLabel,
    Checkbox, CircularProgress,
} from '@mui/material';
import {
    Add as AddIcon,
    ChevronLeft as PrevIcon,
    ChevronRight as NextIcon,
    Today as TodayIcon,
    Church as ChurchIcon,
    VolunteerActivism as MinisterioIcon,
    Delete as DeleteIcon,
    AccessTime as TimeIcon,
    CalendarMonth as CalIcon,
    Close as CloseIcon,
    Event as EventIcon,
    Warning as EmergencyIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import { eventosService } from '../../services/appServices';
import { useSnackbar } from 'notistack';

// ─── Paleta CCO ───────────────────────────────────────────────────────────────
const CCO = { amarillo: '#FFD700', naranja: '#FF8C00', violeta: '#6A5ACD', azul: '#4169E1' };

// ─── Configuración de tipos (mapea al enum TipoEvento del backend) ────────────
const TIPO_CONFIG = {
    Iglesia: {
        label: 'Centro Cristiano de Obrapía',
        short: 'CCO',
        color: '#2e7d32',
        bg: '#43a047',
        icon: <ChurchIcon fontSize="small" />,
    },
    Ministerio: {
        label: 'Ministerio Vidas en Acción',
        short: 'Ministerio',
        color: CCO.violeta,
        bg: '#7e57c2',
        icon: <MinisterioIcon fontSize="small" />,
    },
    Emergencia: {
        label: 'Emergencia',
        short: 'Emergencia',
        color: '#d32f2f',
        bg: '#e53935',
        icon: <EmergencyIcon fontSize="small" />,
    },
};

// ─── Feriados Ecuador 2026 (solo locales, no van al backend) ──────────────────
const FERIADOS_ECUADOR = [
    { id: 'fer-1', title: '🇪🇨 Año Nuevo', start: new Date(2026, 0, 1), end: new Date(2026, 0, 1, 23, 59), tipo: '_Feriado', descripcion: 'Feriado nacional — Día de Año Nuevo.', allDay: true },
    { id: 'fer-2', title: '🎭 Carnaval (Lunes)', start: new Date(2026, 1, 16), end: new Date(2026, 1, 16, 23, 59), tipo: '_Feriado', descripcion: 'Feriado nacional — Lunes de Carnaval.', allDay: true },
    { id: 'fer-3', title: '🎭 Carnaval (Martes)', start: new Date(2026, 1, 17), end: new Date(2026, 1, 17, 23, 59), tipo: '_Feriado', descripcion: 'Feriado nacional — Martes de Carnaval.', allDay: true },
    { id: 'fer-4', title: '✝️ Viernes Santo', start: new Date(2026, 3, 3), end: new Date(2026, 3, 3, 23, 59), tipo: '_Feriado', descripcion: 'Feriado nacional — Viernes Santo.', allDay: true },
    { id: 'fer-5', title: '👷 Día del Trabajo', start: new Date(2026, 4, 1), end: new Date(2026, 4, 1, 23, 59), tipo: '_Feriado', descripcion: 'Feriado nacional — Día Internacional del Trabajo.', allDay: true },
    { id: 'fer-6', title: '⚔️ Batalla de Pichincha', start: new Date(2026, 4, 24), end: new Date(2026, 4, 24, 23, 59), tipo: '_Feriado', descripcion: 'Feriado nacional — Batalla de Pichincha (1822).', allDay: true },
    { id: 'fer-7', title: '🇪🇨 Primer Grito de Independencia', start: new Date(2026, 7, 10), end: new Date(2026, 7, 10, 23, 59), tipo: '_Feriado', descripcion: 'Feriado nacional — Primer Grito de Independencia de Quito (1809).', allDay: true },
    { id: 'fer-8', title: '🇪🇨 Independencia de Guayaquil', start: new Date(2026, 9, 9), end: new Date(2026, 9, 9, 23, 59), tipo: '_Feriado', descripcion: 'Feriado nacional — Independencia de Guayaquil (1820).', allDay: true },
    { id: 'fer-9', title: '💀 Día de los Difuntos', start: new Date(2026, 10, 2), end: new Date(2026, 10, 2, 23, 59), tipo: '_Feriado', descripcion: 'Feriado nacional — Día de los Difuntos.', allDay: true },
    { id: 'fer-10', title: '🇪🇨 Independencia de Cuenca', start: new Date(2026, 10, 3), end: new Date(2026, 10, 3, 23, 59), tipo: '_Feriado', descripcion: 'Feriado nacional — Independencia de Cuenca (1820).', allDay: true },
    { id: 'fer-11', title: '🎄 Navidad', start: new Date(2026, 11, 25), end: new Date(2026, 11, 25, 23, 59), tipo: '_Feriado', descripcion: 'Feriado nacional — Navidad.', allDay: true },
];

const FERIADO_CFG = {
    label: 'Feriado Nacional',
    short: 'Feriado',
    color: '#ff6f00',
    bg: '#ff8f00',
    icon: <EventIcon fontSize="small" />,
};

// ─── Localizer date-fns en español ────────────────────────────────────────────
const locales = { es };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
});

// ─── Form inicial ─────────────────────────────────────────────────────────────
const emptyForm = { titulo: '', descripcion: '', fechaInicio: '', fechaFin: '', tipo: 'Iglesia', notificar: true };

// ─── Custom Toolbar ───────────────────────────────────────────────────────────
function CustomToolbar({ label, onNavigate }) {
    const theme = useTheme();
    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            mb: 2, flexWrap: 'wrap', gap: 1,
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Mes anterior">
                    <IconButton onClick={() => onNavigate('PREV')} size="small"
                        sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) } }}>
                        <PrevIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Hoy">
                    <IconButton onClick={() => onNavigate('TODAY')} size="small"
                        sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) } }}>
                        <TodayIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Mes siguiente">
                    <IconButton onClick={() => onNavigate('NEXT')} size="small"
                        sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) } }}>
                        <NextIcon />
                    </IconButton>
                </Tooltip>
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ textTransform: 'capitalize', letterSpacing: '-0.02em' }}>
                {label}
            </Typography>
            <Box sx={{ width: { xs: 0, sm: 100 } }} /> {/* spacer for centering */}
        </Box>
    );
}

// ─── CalendarioPage ───────────────────────────────────────────────────────────
export default function CalendarioPage() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { enqueueSnackbar } = useSnackbar();

    const [backendEvents, setBackendEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('all');
    const [date, setDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [openCreate, setOpenCreate] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // ── Cargar eventos del backend ────────────────────────────────────────────
    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const res = await eventosService.listar({ limit: 500 });
            const mapped = (res.data || []).map(ev => ({
                ...ev,
                title: ev.titulo,
                start: new Date(ev.fechaInicio),
                end: ev.fechaFin ? new Date(ev.fechaFin) : new Date(ev.fechaInicio),
                tipo: ev.tipo,
            }));
            setBackendEvents(mapped);
        } catch (err) {
            enqueueSnackbar('Error cargando eventos', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => { cargar(); }, [cargar]);

    // ── Combinar backend + feriados locales ───────────────────────────────────
    const allEvents = useMemo(() => [...backendEvents, ...FERIADOS_ECUADOR], [backendEvents]);

    // ── Filtro ────────────────────────────────────────────────────────────────
    const filteredEvents = useMemo(() => {
        if (filtro === 'all') return allEvents;
        if (filtro === '_Feriado') return allEvents.filter(e => e.tipo === '_Feriado');
        return allEvents.filter(e => e.tipo === filtro);
    }, [allEvents, filtro]);

    // ── Estilo por evento ─────────────────────────────────────────────────────
    const eventStyleGetter = useCallback((event) => {
        const cfg = event.tipo === '_Feriado' ? FERIADO_CFG : (TIPO_CONFIG[event.tipo] || TIPO_CONFIG.Iglesia);
        return {
            style: {
                backgroundColor: cfg.bg,
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '2px 6px',
                boxShadow: `0 2px 8px ${alpha(cfg.bg, 0.35)}`,
            },
        };
    }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleSelectEvent = useCallback((event) => setSelectedEvent(event), []);

    const handleOpenForm = (eventToEdit = null) => {
        if (eventToEdit && !eventToEdit.id?.toString().startsWith('fer-')) {
            const pad = (n) => n.toString().padStart(2, '0');
            const formatLocal = (d) => {
                const date = new Date(d);
                return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
            };

            setForm({
                id: eventToEdit.id,
                titulo: eventToEdit.titulo || eventToEdit.title,
                descripcion: eventToEdit.descripcion || '',
                fechaInicio: formatLocal(eventToEdit.start),
                fechaFin: formatLocal(eventToEdit.end),
                tipo: eventToEdit.tipo,
                notificar: false, // Default to false when editing to avoid spam
            });
            setIsEditing(true);
            setSelectedEvent(null);
        } else {
            setForm(emptyForm);
            setIsEditing(false);
        }
        setOpenCreate(true);
    };

    const handleCreateClose = () => setOpenCreate(false);

    const handleFormChange = (field) => (e) => {
        const value = field === 'notificar' ? e.target.checked : e.target.value;
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleFormSubmit = async () => {
        if (!form.titulo || !form.fechaInicio || !form.fechaFin) return;
        setSaving(true);
        try {
            const payload = {
                titulo: form.titulo,
                descripcion: form.descripcion,
                fechaInicio: new Date(form.fechaInicio).toISOString(),
                fechaFin: new Date(form.fechaFin).toISOString(),
                tipo: form.tipo,
                notificar: form.notificar,
            };

            if (isEditing && form.id) {
                await eventosService.actualizar(form.id, payload);
                enqueueSnackbar(
                    form.notificar
                        ? '✅ Evento actualizado y notificaciones enviadas'
                        : '✅ Evento actualizado exitosamente',
                    { variant: 'success' }
                );
            } else {
                await eventosService.crear(payload);
                enqueueSnackbar(
                    form.notificar
                        ? '✅ Evento creado y notificaciones enviadas por correo'
                        : '✅ Evento creado exitosamente',
                    { variant: 'success' }
                );
            }
            setOpenCreate(false);
            cargar();
        } catch (err) {
            enqueueSnackbar(err.response?.data?.error || (isEditing ? 'Error al actualizar evento' : 'Error al crear evento'), { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEvent = async (id) => {
        if (typeof id === 'string' && id.startsWith('fer-')) return; // No eliminar feriados locales
        if (!window.confirm('¿Eliminar este evento permanentemente?')) return;
        try {
            await eventosService.eliminar(id);
            enqueueSnackbar('Evento eliminado', { variant: 'success' });
            setSelectedEvent(null);
            cargar();
        } catch {
            enqueueSnackbar('Error al eliminar evento', { variant: 'error' });
        }
    };

    // ── Formato de hora ──────────────────────────────────────────────────────
    const formatTime = (d) => format(d, "hh:mm a", { locale: es });
    const formatDate = (d) => format(d, "EEEE d 'de' MMMM, yyyy", { locale: es });

    // ─── Estilos del calendario ───────────────────────────────────────────────
    const calendarSx = {
        '.rbc-calendar': { fontFamily: theme.typography.fontFamily },
        '.rbc-header': {
            py: 1.2, fontWeight: 700, fontSize: '0.8rem', textTransform: 'capitalize',
            color: theme.palette.text.secondary,
            borderBottom: `2px solid ${theme.palette.divider}`,
            bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02),
        },
        '.rbc-month-view': {
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3, overflow: 'hidden',
        },
        '.rbc-month-row + .rbc-month-row': { borderTop: `1px solid ${theme.palette.divider}` },
        '.rbc-day-bg': {
            transition: 'background .15s ease',
            '&:hover': { bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02) },
        },
        '.rbc-day-bg + .rbc-day-bg': { borderLeft: `1px solid ${theme.palette.divider}` },
        '.rbc-off-range-bg': { bgcolor: isDark ? alpha('#000', 0.2) : alpha('#f0f0f0', 0.6) },
        '.rbc-today': {
            bgcolor: isDark ? alpha(CCO.naranja, 0.08) : alpha(CCO.azul, 0.06),
        },
        '.rbc-date-cell': {
            padding: '6px 8px', fontSize: '0.82rem', fontWeight: 600,
            color: theme.palette.text.primary,
            textAlign: 'right',
        },
        '.rbc-date-cell.rbc-off-range': { color: theme.palette.text.disabled },
        '.rbc-date-cell.rbc-now > a': {
            bgcolor: isDark ? CCO.naranja : CCO.azul,
            color: '#fff !important',
            borderRadius: '50%', width: 28, height: 28,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, textDecoration: 'none',
        },
        '.rbc-event': { cursor: 'pointer', transition: 'transform .15s ease, box-shadow .15s ease', '&:hover': { transform: 'scale(1.03)' } },
        '.rbc-event-content': { fontSize: '0.72rem', lineHeight: 1.3 },
        '.rbc-show-more': {
            fontSize: '0.7rem', fontWeight: 700, color: theme.palette.primary.main,
            mt: 0.5,
        },
        '.rbc-row-segment': { padding: '1px 4px' },
    };

    return (
        <MainLayout>
            <Box sx={{ p: { xs: 1.5, md: 0 } }}>

                {/* ── Header ──────────────────────────────────────── */}
                <Box sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    mb: 3, flexWrap: 'wrap', gap: 2,
                }}>
                    <Box>
                        <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalIcon sx={{ fontSize: 32, color: isDark ? CCO.naranja : CCO.azul }} />
                            Calendario de Eventos
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Eventos de Centro Cristiano de Obrapía y Ministerio Vidas en Acción
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenForm()}
                        sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 700, fontSize: '0.85rem' }}
                    >
                        Crear Evento
                    </Button>
                </Box>

                {/* ── Filtros / Leyenda ────────────────────────────── */}
                <Stack direction="row" spacing={1} sx={{ mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                        label="Todos"
                        icon={<EventIcon sx={{ fontSize: 18 }} />}
                        onClick={() => setFiltro('all')}
                        variant={filtro === 'all' ? 'filled' : 'outlined'}
                        sx={{
                            fontWeight: 700,
                            ...(filtro === 'all' && {
                                bgcolor: isDark ? alpha('#fff', 0.12) : alpha('#000', 0.08),
                                color: theme.palette.text.primary,
                            }),
                        }}
                    />
                    {Object.entries(TIPO_CONFIG).map(([key, cfg]) => (
                        <Chip
                            key={key}
                            label={isMobile ? cfg.short : cfg.label}
                            icon={cfg.icon}
                            onClick={() => setFiltro(filtro === key ? 'all' : key)}
                            variant={filtro === key ? 'filled' : 'outlined'}
                            sx={{
                                fontWeight: 700,
                                borderColor: cfg.color,
                                color: filtro === key ? '#fff' : cfg.color,
                                ...(filtro === key && { bgcolor: cfg.bg, '&:hover': { bgcolor: cfg.color } }),
                                ...(filtro !== key && { '&:hover': { bgcolor: alpha(cfg.color, 0.08) } }),
                            }}
                        />
                    ))}
                    <Chip
                        label={isMobile ? 'Feriados' : 'Feriados Nacionales'}
                        icon={FERIADO_CFG.icon}
                        onClick={() => setFiltro(filtro === '_Feriado' ? 'all' : '_Feriado')}
                        variant={filtro === '_Feriado' ? 'filled' : 'outlined'}
                        sx={{
                            fontWeight: 700,
                            borderColor: FERIADO_CFG.color,
                            color: filtro === '_Feriado' ? '#fff' : FERIADO_CFG.color,
                            ...(filtro === '_Feriado' && { bgcolor: FERIADO_CFG.bg, '&:hover': { bgcolor: FERIADO_CFG.color } }),
                            ...(filtro !== '_Feriado' && { '&:hover': { bgcolor: alpha(FERIADO_CFG.color, 0.08) } }),
                        }}
                    />
                    <Box sx={{ flex: 1 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                        {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''}
                    </Typography>
                </Stack>

                {/* ── Calendario ───────────────────────────────────── */}
                <Paper elevation={0} sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 4, overflow: 'hidden', p: { xs: 1, md: 2.5 },
                    bgcolor: isDark ? alpha('#0f1629', 0.5) : alpha('#fff', 0.8),
                    position: 'relative',
                    ...calendarSx,
                }}>
                    {loading && (
                        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
                            <CircularProgress size={24} />
                        </Box>
                    )}
                    <Calendar
                        localizer={localizer}
                        events={filteredEvents}
                        date={date}
                        onNavigate={(newDate) => setDate(newDate)}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: isMobile ? 500 : 650 }}
                        views={['month']}
                        defaultView="month"
                        culture="es"
                        messages={{
                            today: 'Hoy',
                            previous: 'Anterior',
                            next: 'Siguiente',
                            month: 'Mes',
                            week: 'Semana',
                            day: 'Día',
                            showMore: (n) => `+${n} más`,
                            noEventsInRange: 'No hay eventos en este rango.',
                        }}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={handleSelectEvent}
                        components={{ toolbar: CustomToolbar }}
                        popup
                        popupOffset={{ x: 10, y: 10 }}
                    />
                </Paper>

                {/* ── Dialog: Detalle del Evento ──────────────────── */}
                <Dialog
                    open={!!selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    maxWidth="sm" fullWidth
                    TransitionComponent={Fade}
                    PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
                >
                    {selectedEvent && (() => {
                        const cfg = selectedEvent.tipo === '_Feriado' ? FERIADO_CFG : (TIPO_CONFIG[selectedEvent.tipo] || TIPO_CONFIG.Iglesia);
                        const isFeriado = selectedEvent.tipo === '_Feriado';
                        return (
                            <>
                                {/* Banner de color */}
                                <Box sx={{
                                    height: 6,
                                    background: `linear-gradient(90deg, ${cfg.bg} 0%, ${alpha(cfg.bg, 0.5)} 100%)`,
                                }} />
                                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pr: 6, pt: 2.5 }}>
                                    <Avatar sx={{ bgcolor: alpha(cfg.bg, 0.15), color: cfg.bg, width: 44, height: 44 }}>
                                        {cfg.icon}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" fontWeight={800}>{selectedEvent.title || selectedEvent.titulo}</Typography>
                                        <Chip label={cfg.label} size="small"
                                            sx={{ mt: 0.5, bgcolor: alpha(cfg.bg, 0.12), color: cfg.bg, fontSize: '0.7rem', fontWeight: 700 }} />
                                    </Box>
                                    <IconButton onClick={() => setSelectedEvent(null)}
                                        sx={{ position: 'absolute', right: 12, top: 16 }}>
                                        <CloseIcon />
                                    </IconButton>
                                </DialogTitle>
                                <DialogContent sx={{ pt: 1 }}>
                                    <Stack spacing={2} sx={{ mt: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <CalIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                {formatDate(selectedEvent.start)}
                                            </Typography>
                                        </Box>
                                        {!selectedEvent.allDay && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <TimeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                                <Typography variant="body2">
                                                    {formatTime(selectedEvent.start)} — {formatTime(selectedEvent.end)}
                                                </Typography>
                                            </Box>
                                        )}
                                        {(selectedEvent.descripcion) && (
                                            <Box sx={{
                                                p: 2, borderRadius: 2,
                                                bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.03),
                                                border: `1px solid ${theme.palette.divider}`,
                                            }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {selectedEvent.descripcion}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Stack>
                                </DialogContent>
                                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                                    {!isFeriado && (
                                        <Box sx={{ display: 'flex', gap: 1, mr: 'auto' }}>
                                            <Button
                                                startIcon={<EditIcon />}
                                                color="primary"
                                                onClick={() => handleOpenForm(selectedEvent)}
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                startIcon={<DeleteIcon />}
                                                color="error"
                                                onClick={() => handleDeleteEvent(selectedEvent.id)}
                                            >
                                                Eliminar
                                            </Button>
                                        </Box>
                                    )}
                                    <Button variant="outlined" onClick={() => setSelectedEvent(null)}>
                                        Cerrar
                                    </Button>
                                </DialogActions>
                            </>
                        );
                    })()}
                </Dialog>

                {/* ── Dialog: Crear Evento ─────────────────────────── */}
                <Dialog
                    open={openCreate}
                    onClose={handleCreateClose}
                    maxWidth="sm" fullWidth
                    TransitionComponent={Fade}
                    PaperProps={{ sx: { borderRadius: 4 } }}
                >
                    <Box sx={{
                        height: 6,
                        background: `linear-gradient(90deg, ${CCO.naranja} 0%, ${CCO.violeta} 100%)`,
                    }} />
                    <DialogTitle sx={{ fontWeight: 800, pt: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {isEditing ? <EditIcon sx={{ color: isDark ? CCO.naranja : CCO.azul }} /> : <AddIcon sx={{ color: isDark ? CCO.naranja : CCO.azul }} />}
                            {isEditing ? 'Editar Evento' : 'Crear Nuevo Evento'}
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <TextField
                                label="Título del evento"
                                value={form.titulo}
                                onChange={handleFormChange('titulo')}
                                fullWidth required
                                placeholder="Ej: Culto Dominical"
                            />
                            <TextField
                                label="Descripción"
                                value={form.descripcion}
                                onChange={handleFormChange('descripcion')}
                                fullWidth multiline rows={2}
                                placeholder="Detalles del evento..."
                            />
                            <TextField
                                label="Tipo de evento"
                                value={form.tipo}
                                onChange={handleFormChange('tipo')}
                                select fullWidth required
                            >
                                {Object.entries(TIPO_CONFIG).map(([key, cfg]) => (
                                    <MenuItem key={key} value={key}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{
                                                width: 12, height: 12, borderRadius: '50%',
                                                bgcolor: cfg.bg,
                                            }} />
                                            {cfg.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </TextField>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Fecha y hora inicio"
                                    type="datetime-local"
                                    value={form.fechaInicio}
                                    onChange={handleFormChange('fechaInicio')}
                                    fullWidth required
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                                <TextField
                                    label="Fecha y hora fin"
                                    type="datetime-local"
                                    value={form.fechaFin}
                                    onChange={handleFormChange('fechaFin')}
                                    fullWidth required
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Box>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={form.notificar}
                                        onChange={handleFormChange('notificar')}
                                        color="primary"
                                    />
                                }
                                label={
                                    <Typography variant="body2" color="text.secondary">
                                        📧 Notificar a todos los usuarios (in-app y correo electrónico)
                                    </Typography>
                                }
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button onClick={handleCreateClose} color="inherit">Cancelar</Button>
                        <Button
                            variant="contained"
                            onClick={handleFormSubmit}
                            disabled={!form.titulo || !form.fechaInicio || !form.fechaFin || saving}
                            sx={{ borderRadius: 2.5, px: 3 }}
                        >
                            {saving ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : (isEditing ? 'Actualizar Evento' : 'Crear Evento')}
                        </Button>
                    </DialogActions>
                </Dialog>

            </Box>
        </MainLayout>
    );
}
