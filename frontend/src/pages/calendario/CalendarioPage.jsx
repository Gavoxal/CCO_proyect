import { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import {
    Box, Typography, Button, Chip, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, IconButton, alpha, useTheme,
    Tooltip, Avatar, Fade, Paper, Stack, useMediaQuery,
} from '@mui/material';
import {
    Add as AddIcon,
    ChevronLeft as PrevIcon,
    ChevronRight as NextIcon,
    Today as TodayIcon,
    Church as ChurchIcon,
    VolunteerActivism as MinisterioIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    AccessTime as TimeIcon,
    CalendarMonth as CalIcon,
    Close as CloseIcon,
    Event as EventIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';

// ─── Paleta CCO ───────────────────────────────────────────────────────────────
const CCO = { amarillo: '#FFD700', naranja: '#FF8C00', violeta: '#6A5ACD', azul: '#4169E1' };

const TIPO_CONFIG = {
    CCO: {
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
    Feriado: {
        label: 'Feriado Nacional',
        short: 'Feriado',
        color: '#d32f2f',
        bg: '#e53935',
        icon: <EventIcon fontSize="small" />,
    },
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

// ─── Datos mock de eventos ────────────────────────────────────────────────────
const INITIAL_EVENTS = [
    // CCO — Iglesia
    { id: 1, title: 'Culto Dominical', start: new Date(2026, 2, 1, 10, 0), end: new Date(2026, 2, 1, 12, 0), tipo: 'CCO', descripcion: 'Servicio dominical general para toda la congregación.' },
    { id: 2, title: 'Estudio Bíblico', start: new Date(2026, 2, 4, 19, 0), end: new Date(2026, 2, 4, 20, 30), tipo: 'CCO', descripcion: 'Estudio bíblico semanal — Libro de Romanos cap. 8.' },
    { id: 3, title: 'Culto Dominical', start: new Date(2026, 2, 8, 10, 0), end: new Date(2026, 2, 8, 12, 0), tipo: 'CCO', descripcion: 'Servicio dominical general.' },
    { id: 4, title: 'Reunión de Líderes', start: new Date(2026, 2, 10, 18, 0), end: new Date(2026, 2, 10, 20, 0), tipo: 'CCO', descripcion: 'Reunión mensual de líderes de casas de paz y ministerios.' },
    { id: 5, title: 'Culto Dominical', start: new Date(2026, 2, 15, 10, 0), end: new Date(2026, 2, 15, 12, 0), tipo: 'CCO', descripcion: 'Servicio dominical general.' },
    { id: 6, title: 'Noche de Oración', start: new Date(2026, 2, 13, 20, 0), end: new Date(2026, 2, 13, 22, 0), tipo: 'CCO', descripcion: 'Noche de oración y adoración abierta a toda la iglesia.' },
    { id: 7, title: 'Culto Dominical', start: new Date(2026, 2, 22, 10, 0), end: new Date(2026, 2, 22, 12, 0), tipo: 'CCO', descripcion: 'Servicio dominical general.' },
    { id: 8, title: 'Culto Dominical', start: new Date(2026, 2, 29, 10, 0), end: new Date(2026, 2, 29, 12, 0), tipo: 'CCO', descripcion: 'Servicio dominical general.' },
    { id: 9, title: 'Ensayo de Alabanza', start: new Date(2026, 2, 7, 17, 0), end: new Date(2026, 2, 7, 19, 0), tipo: 'CCO', descripcion: 'Ensayo del equipo de alabanza y adoración.' },
    // Ministerio — Vidas en Acción
    { id: 10, title: 'Visitas Domiciliarias', start: new Date(2026, 2, 5, 8, 0), end: new Date(2026, 2, 5, 12, 0), tipo: 'Ministerio', descripcion: 'Visitas programadas a familias de infantes del programa.' },
    { id: 11, title: 'Taller de Manualidades', start: new Date(2026, 2, 6, 14, 0), end: new Date(2026, 2, 6, 16, 0), tipo: 'Ministerio', descripcion: 'Taller creativo para niños del ministerio.' },
    { id: 12, title: 'Entrega de Kits Escolares', start: new Date(2026, 2, 14, 9, 0), end: new Date(2026, 2, 14, 13, 0), tipo: 'Ministerio', descripcion: 'Entrega masiva de kits escolares a todos los infantes registrados.' },
    { id: 13, title: 'Reunión de Tutores', start: new Date(2026, 2, 18, 17, 0), end: new Date(2026, 2, 18, 19, 0), tipo: 'Ministerio', descripcion: 'Reunión mensual de tutores del programa de apadrinamiento.' },
    { id: 14, title: 'Jornada de Salud', start: new Date(2026, 2, 21, 8, 0), end: new Date(2026, 2, 21, 14, 0), tipo: 'Ministerio', descripcion: 'Jornada de controles médicos y odontológicos para infantes.' },
    { id: 15, title: 'Clase de Refuerzo Escolar', start: new Date(2026, 2, 26, 14, 0), end: new Date(2026, 2, 26, 16, 0), tipo: 'Ministerio', descripcion: 'Clases de refuerzo en matemáticas y lenguaje.' },
    { id: 16, title: 'Celebración del Día del Niño', start: new Date(2026, 2, 28, 9, 0), end: new Date(2026, 2, 28, 15, 0), tipo: 'Ministerio', descripcion: 'Fiesta especial con juegos, refrigerio y regalos.' },
    // ── Feriados Ecuador 2026 ─────────────────────────────────────────────────
    { id: 100, title: '🇪🇨 Año Nuevo', start: new Date(2026, 0, 1, 0, 0), end: new Date(2026, 0, 1, 23, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Día de Año Nuevo.', allDay: true },
    { id: 101, title: '🎭 Carnaval (Lunes)', start: new Date(2026, 1, 16, 0, 0), end: new Date(2026, 1, 16, 23, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Lunes de Carnaval.', allDay: true },
    { id: 102, title: '🎭 Carnaval (Martes)', start: new Date(2026, 1, 17, 0, 0), end: new Date(2026, 1, 17, 23, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Martes de Carnaval.', allDay: true },
    { id: 103, title: '✝️ Viernes Santo', start: new Date(2026, 3, 3, 0, 0), end: new Date(2026, 3, 3, 23, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Viernes Santo.', allDay: true },
    { id: 104, title: '👷 Día del Trabajo', start: new Date(2026, 4, 1, 0, 0), end: new Date(2026, 4, 1, 23, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Día Internacional del Trabajo.', allDay: true },
    { id: 105, title: '⚔️ Batalla de Pichincha', start: new Date(2026, 4, 24, 0, 0), end: new Date(2026, 4, 24, 23, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Batalla de Pichincha (1822).', allDay: true },
    { id: 106, title: '🇪🇨 Primer Grito de Independencia', start: new Date(2026, 7, 10, 0, 0), end: new Date(2026, 7, 10, 23, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Primer Grito de Independencia de Quito (1809).', allDay: true },
    { id: 107, title: '🇪🇨 Independencia de Guayaquil', start: new Date(2026, 9, 9, 0, 0), end: new Date(2026, 9, 9, 23, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Independencia de Guayaquil (1820).', allDay: true },
    { id: 108, title: '💀 Día de los Difuntos', start: new Date(2026, 10, 2, 0, 0), end: new Date(2026, 10, 2, 23, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Día de los Difuntos.', allDay: true },
    { id: 109, title: '🇪🇨 Independencia de Cuenca', start: new Date(2026, 10, 3, 0, 0), end: new Date(2026, 10, 3, 23, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Independencia de Cuenca (1820).', allDay: true },
    { id: 110, title: '🎄 Navidad', start: new Date(2026, 11, 25, 0, 0), end: new Date(2026, 11, 25, 23, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Navidad.', allDay: true },
];

// ─── Form inicial ─────────────────────────────────────────────────────────────
const emptyForm = { title: '', descripcion: '', start: '', end: '', tipo: 'CCO' };

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

    const [events, setEvents] = useState(INITIAL_EVENTS);
    const [filtro, setFiltro] = useState('all'); // 'all' | 'CCO' | 'Ministerio' | 'Feriado'
    const [date, setDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [openCreate, setOpenCreate] = useState(false);
    const [form, setForm] = useState(emptyForm);

    // Eventos filtrados
    const filteredEvents = useMemo(
        () => filtro === 'all' ? events : events.filter(e => e.tipo === filtro),
        [events, filtro],
    );

    // Estilo por evento
    const eventStyleGetter = useCallback((event) => {
        const cfg = TIPO_CONFIG[event.tipo] || TIPO_CONFIG.CCO;
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

    // ── Handlers ──
    const handleSelectEvent = useCallback((event) => setSelectedEvent(event), []);

    const handleCreateOpen = () => {
        setForm(emptyForm);
        setOpenCreate(true);
    };

    const handleCreateClose = () => setOpenCreate(false);

    const handleFormChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleCreateSubmit = () => {
        if (!form.title || !form.start || !form.end) return;
        const newEvent = {
            id: Date.now(),
            title: form.title,
            descripcion: form.descripcion,
            start: new Date(form.start),
            end: new Date(form.end),
            tipo: form.tipo,
        };
        setEvents(prev => [...prev, newEvent]);
        setOpenCreate(false);
    };

    const handleDeleteEvent = (id) => {
        setEvents(prev => prev.filter(e => e.id !== id));
        setSelectedEvent(null);
    };

    // ── Formato de hora ──
    const formatTime = (date) => format(date, "hh:mm a", { locale: es });
    const formatDate = (date) => format(date, "EEEE d 'de' MMMM, yyyy", { locale: es });

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
                        onClick={handleCreateOpen}
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
                    ...calendarSx,
                }}>
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
                        const cfg = TIPO_CONFIG[selectedEvent.tipo] || TIPO_CONFIG.CCO;
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
                                        <Typography variant="h6" fontWeight={800}>{selectedEvent.title}</Typography>
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
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <TimeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                            <Typography variant="body2">
                                                {formatTime(selectedEvent.start)} — {formatTime(selectedEvent.end)}
                                            </Typography>
                                        </Box>
                                        {selectedEvent.descripcion && (
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
                                    <Button
                                        startIcon={<DeleteIcon />}
                                        color="error"
                                        onClick={() => handleDeleteEvent(selectedEvent.id)}
                                        sx={{ mr: 'auto' }}
                                    >
                                        Eliminar
                                    </Button>
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
                            <AddIcon sx={{ color: isDark ? CCO.naranja : CCO.azul }} />
                            Crear Nuevo Evento
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <TextField
                                label="Título del evento"
                                value={form.title}
                                onChange={handleFormChange('title')}
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
                                    value={form.start}
                                    onChange={handleFormChange('start')}
                                    fullWidth required
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                                <TextField
                                    label="Fecha y hora fin"
                                    type="datetime-local"
                                    value={form.end}
                                    onChange={handleFormChange('end')}
                                    fullWidth required
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Box>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button onClick={handleCreateClose} color="inherit">Cancelar</Button>
                        <Button
                            variant="contained"
                            onClick={handleCreateSubmit}
                            disabled={!form.title || !form.start || !form.end}
                            sx={{ borderRadius: 2.5, px: 3 }}
                        >
                            Crear Evento
                        </Button>
                    </DialogActions>
                </Dialog>

            </Box>
        </MainLayout>
    );
}
