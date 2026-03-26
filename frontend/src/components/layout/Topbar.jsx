import { useState, useEffect, useCallback } from 'react';
import {
    AppBar, Toolbar, Typography, IconButton, Box, alpha, useTheme, Tooltip, Chip,
    Badge, Popover, List, ListItem, ListItemText, ListItemIcon, Divider, Button,
    CircularProgress,
} from '@mui/material';
import {
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    Notifications as NotificationsIcon,
    Event as EventIcon,
    Info as InfoIcon,
    Warning as WarningIcon,
    DoneAll as DoneAllIcon,
    Circle as CircleIcon,
} from '@mui/icons-material';
import { useThemeMode } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { notificacionesService } from '../../services/appServices';

const TIPO_ICON = {
    EVENTO: <EventIcon fontSize="small" sx={{ color: '#7e57c2' }} />,
    INFO: <InfoIcon fontSize="small" sx={{ color: '#2196f3' }} />,
    ALERTA: <WarningIcon fontSize="small" sx={{ color: '#ff9800' }} />,
};

const Topbar = ({ title }) => {
    const theme = useTheme();
    const { mode, toggleTheme } = useThemeMode();
    const { isAuthenticated } = useAuth();

    // ── Notificaciones ────────────────────────────────────────
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(false);
    const open = Boolean(anchorEl);

    const noLeidas = notifs.filter(n => !n.leida).length;

    const cargarNotificaciones = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const res = await notificacionesService.listar();
            setNotifs(res.data || []);
        } catch {
            // Silent fail — backend might not be available
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Polling cada 30s
    useEffect(() => {
        cargarNotificaciones();
        const interval = setInterval(cargarNotificaciones, 30000);
        return () => clearInterval(interval);
    }, [cargarNotificaciones]);

    const handleOpen = (e) => {
        setAnchorEl(e.currentTarget);
        cargarNotificaciones();
    };
    const handleClose = () => setAnchorEl(null);

    const handleMarcarLeida = async (id) => {
        try {
            await notificacionesService.marcarLeida(id);
            setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
        } catch { /* ignore */ }
    };

    const handleMarcarTodas = async () => {
        try {
            await notificacionesService.marcarTodasLeidas();
            setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
        } catch { /* ignore */ }
    };

    const formatFecha = (fecha) => {
        const d = new Date(fecha);
        const ahora = new Date();
        const diff = Math.floor((ahora - d) / 60000);
        if (diff < 1) return 'Ahora mismo';
        if (diff < 60) return `Hace ${diff} min`;
        if (diff < 1440) return `Hace ${Math.floor(diff / 60)} h`;
        return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
    };

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                background: theme.palette.mode === 'dark'
                    ? alpha('#0a1929', 0.8)
                    : alpha('#ffffff', 0.8),
                backdropFilter: 'blur(20px)',
                borderBottom: `1px solid ${theme.palette.divider}`,
                color: theme.palette.text.primary,
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {title}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                        size="small"
                        sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontWeight: 500,
                            display: { xs: 'none', md: 'flex' },
                            textTransform: 'capitalize',
                        }}
                    />

                    {/* ── Campanita de Notificaciones ── */}
                    <Tooltip title="Notificaciones" arrow>
                        <IconButton
                            onClick={handleOpen}
                            sx={{
                                color: 'text.secondary',
                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                            }}
                        >
                            <Badge badgeContent={noLeidas} color="error"
                                sx={{
                                    '& .MuiBadge-badge': {
                                        fontSize: 10, minWidth: 18, height: 18,
                                        animation: noLeidas > 0 ? 'pulse 2s infinite' : 'none',
                                        '@keyframes pulse': {
                                            '0%': { boxShadow: '0 0 0 0 rgba(244,67,54,0.4)' },
                                            '70%': { boxShadow: '0 0 0 6px rgba(244,67,54,0)' },
                                            '100%': { boxShadow: '0 0 0 0 rgba(244,67,54,0)' },
                                        },
                                    },
                                }}
                            >
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    {/* ── Popover de Notificaciones ── */}
                    <Popover
                        open={open}
                        anchorEl={anchorEl}
                        onClose={handleClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        PaperProps={{
                            sx: {
                                width: 380, maxHeight: 460, borderRadius: 3,
                                border: `1px solid ${theme.palette.divider}`,
                                boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                            },
                        }}
                    >
                        {/* Header */}
                        <Box sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            px: 2.5, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}`,
                        }}>
                            <Typography variant="subtitle1" fontWeight={700}>
                                Notificaciones
                                {noLeidas > 0 && (
                                    <Chip label={noLeidas} size="small" color="error"
                                        sx={{ ml: 1, height: 20, fontSize: 11, fontWeight: 700 }} />
                                )}
                            </Typography>
                            {noLeidas > 0 && (
                                <Button size="small" startIcon={<DoneAllIcon sx={{ fontSize: 16 }} />}
                                    onClick={handleMarcarTodas}
                                    sx={{ textTransform: 'none', fontSize: 12, fontWeight: 600 }}>
                                    Marcar todas
                                </Button>
                            )}
                        </Box>

                        {/* Body */}
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress size={28} />
                            </Box>
                        ) : notifs.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 5, px: 3 }}>
                                <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                    No tienes notificaciones
                                </Typography>
                            </Box>
                        ) : (
                            <List sx={{ py: 0, maxHeight: 360, overflowY: 'auto' }}>
                                {notifs.slice(0, 20).map((n, i) => (
                                    <Box key={n.id}>
                                        <ListItem
                                            onClick={() => !n.leida && handleMarcarLeida(n.id)}
                                            sx={{
                                                px: 2.5, py: 1.5, cursor: n.leida ? 'default' : 'pointer',
                                                bgcolor: n.leida ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
                                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                                                transition: 'background 0.2s',
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                {TIPO_ICON[n.tipo] || TIPO_ICON.INFO}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        {!n.leida && <CircleIcon sx={{ fontSize: 8, color: 'primary.main' }} />}
                                                        <Typography variant="body2" fontWeight={n.leida ? 400 : 700} noWrap>
                                                            {n.titulo}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" sx={{
                                                            display: '-webkit-box', WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                                        }}>
                                                            {n.mensaje}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.3, fontSize: 10 }}>
                                                            {formatFecha(n.fechaCreacion)}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                        {i < notifs.length - 1 && <Divider />}
                                    </Box>
                                ))}
                            </List>
                        )}
                    </Popover>

                    <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'} arrow>
                        <IconButton
                            onClick={toggleTheme}
                            sx={{
                                color: 'text.secondary',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                    transform: 'rotate(180deg)',
                                },
                            }}
                        >
                            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                        </IconButton>
                    </Tooltip>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Topbar;
