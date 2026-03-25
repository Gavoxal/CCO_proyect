import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Box, Typography, IconButton, Divider, Avatar, Tooltip, alpha, useTheme, Chip,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    PeopleAlt as InfantesIcon,
    ChecklistRtl as AsistenciaIcon,
    HomeWork as VisitasIcon,
    Inventory2 as MaterialesIcon,
    CardGiftcard as RegalosIcon,
    Church as MiembrosIcon,
    House as CasasPazIcon,
    CalendarMonth as CalendarioIcon,
    ManageAccounts as UsuariosIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Logout as LogoutIcon,
    ReportProblem as IncidentesIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 265;
const DRAWER_COLLAPSED = 72;

// Grupos del menú con control de roles
const menuGroups = [
    {
        label: 'Principal',
        items: [
            { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
            { text: 'Calendario', icon: <CalendarioIcon />, path: '/calendario' },
        ],
    },
    {
        label: 'Ministerio',
        items: [
            { text: 'Infantes', icon: <InfantesIcon />, path: '/infantes' },
            { text: 'Asistencia', icon: <AsistenciaIcon />, path: '/asistencia', roles: ['admin', 'director', 'proteccion', 'secretaria', 'tutor_especial'] },
            { text: 'Visitas', icon: <VisitasIcon />, path: '/visitas' },
            { text: 'Regalos y Kits', icon: <RegalosIcon />, path: '/regalos' },
        ],
    },
    {
        label: 'Inventario',
        items: [
            { text: 'Materiales', icon: <MaterialesIcon />, path: '/inventario/materiales' },
        ],
    },
    {
        label: 'Incidentes',
        items: [
            // Admin/Director/Proteccion/Secretaria ven la lista completa
            { text: 'Reportes de Incidentes', icon: <IncidentesIcon />, path: '/incidentes', roles: ['admin', 'director', 'proteccion', 'secretaria'] },
            // Tutores solo pueden reportar (formulario de creación)
            { text: 'Reportar Incidente', icon: <IncidentesIcon />, path: '/incidentes/nuevo', roles: ['tutor', 'tutor_especial'] },
        ],
    },
    {
        label: 'Iglesia CCO',
        roles: ['admin', 'director', 'proteccion'],
        items: [
            { text: 'Miembros', icon: <MiembrosIcon />, path: '/miembros' },
            { text: 'Casas de Paz', icon: <CasasPazIcon />, path: '/casas-de-paz' },
        ],
    },
    {
        label: 'Administración',
        roles: ['admin', 'director', 'proteccion'],
        items: [
            { text: 'Usuarios', icon: <UsuariosIcon />, path: '/usuarios' },
        ],
    },
];

const ROL_LABELS = {
    admin: { label: 'Admin', color: '#7c4dff' },
    director: { label: 'Director', color: '#00bcd4' },
    proteccion: { label: 'Protección', color: '#f44336' },
    secretaria: { label: 'Secretaría', color: '#4caf50' },
    tutor_especial: { label: 'Tutor Esp.', color: '#ff9800' },
    tutor: { label: 'Tutor', color: '#9e9e9e' },
};

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const theme = useTheme();
    const drawerWidth = collapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH;
    const rolInfo = ROL_LABELS[user?.rol] || ROL_LABELS.tutor;

    const canSeeGroup = (group) => {
        if (!group.roles) return true;
        return group.roles.includes(user?.rol);
    };

    const canSeeItem = (item) => {
        if (!item.roles) return true;
        return item.roles.includes(user?.rol);
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                transition: 'width 0.3s ease',
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    background: theme.palette.mode === 'dark'
                        ? `linear-gradient(180deg, ${alpha('#0d2137', 0.97)} 0%, ${alpha('#0a1929', 0.99)} 100%)`
                        : `linear-gradient(180deg, ${alpha('#ffffff', 0.97)} 0%, ${alpha('#f0f4ff', 0.98)} 100%)`,
                    backdropFilter: 'blur(20px)',
                    borderRight: `1px solid ${theme.palette.divider}`,
                    transition: 'width 0.3s ease',
                    overflowX: 'hidden',
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': { width: 4 },
                    '&::-webkit-scrollbar-thumb': { background: alpha(theme.palette.primary.main, 0.25), borderRadius: 4 },
                },
            }}
        >
            {/* ─── Logo ───────────────────────────────────────────────────── */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', minHeight: 64 }}>
                {!collapsed && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            width: 38, height: 38, borderRadius: '12px',
                            background: 'linear-gradient(135deg, #7c4dff 0%, #00bcd4 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <InfantesIcon sx={{ color: '#fff', fontSize: 22 }} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.3px' }}>
                                KidScam
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                CCO · Vías en Acción
                            </Typography>
                        </Box>
                    </Box>
                )}
                <IconButton
                    onClick={() => setCollapsed(!collapsed)}
                    size="small"
                    sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}
                >
                    {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
                </IconButton>
            </Box>

            <Divider sx={{ mx: 1, opacity: 0.4 }} />

            {/* ─── Menú por grupos ────────────────────────────────────────── */}
            <Box sx={{ px: 1, py: 1.5, flex: 1 }}>
                {menuGroups.filter(canSeeGroup).map((group) => (
                    <Box key={group.label} sx={{ mb: 0.5 }}>
                        {!collapsed && (
                            <Typography variant="caption" sx={{
                                px: 1.5, pt: 1.5, pb: 0.5, display: 'block',
                                color: 'text.disabled', fontWeight: 700,
                                fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                            }}>
                                {group.label}
                            </Typography>
                        )}
                        <List disablePadding>
                            {group.items.filter(canSeeItem).map((item) => {
                                const isActive = location.pathname === item.path ||
                                    (item.path !== '/' && location.pathname.startsWith(item.path));
                                return (
                                    <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
                                        <Tooltip title={collapsed ? item.text : ''} placement="right" arrow>
                                            <ListItemButton
                                                onClick={() => navigate(item.path)}
                                                sx={{
                                                    borderRadius: '10px', minHeight: 44,
                                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                                    px: collapsed ? 1.5 : 2, transition: 'all 0.2s ease',
                                                    ...(isActive && {
                                                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.18)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                                                        boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}`,
                                                    }),
                                                    '&:hover': { background: alpha(theme.palette.primary.main, 0.08) },
                                                }}
                                            >
                                                <ListItemIcon sx={{
                                                    minWidth: collapsed ? 0 : 38, mr: collapsed ? 0 : 1.5,
                                                    justifyContent: 'center',
                                                    color: isActive ? theme.palette.primary.main : 'text.secondary',
                                                }}>
                                                    {item.icon}
                                                </ListItemIcon>
                                                {!collapsed && (
                                                    <ListItemText
                                                        primary={item.text}
                                                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 400 }}
                                                    />
                                                )}
                                            </ListItemButton>
                                        </Tooltip>
                                    </ListItem>
                                );
                            })}
                        </List>
                    </Box>
                ))}
            </Box>

            <Divider sx={{ mx: 1, opacity: 0.4 }} />

            {/* ─── Usuario ────────────────────────────────────────────────── */}
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: collapsed ? 'center' : 'flex-start' }}>
                    <Avatar sx={{
                        width: 36, height: 36, fontWeight: 700, fontSize: '0.9rem',
                        background: `linear-gradient(135deg, ${rolInfo.color} 0%, ${alpha(rolInfo.color, 0.6)} 100%)`,
                    }}>
                        {(user?.nombre || user?.username || '?').charAt(0).toUpperCase()}
                    </Avatar>
                    {!collapsed && (
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
                                {user?.nombre || user?.username}
                            </Typography>
                            <Chip
                                label={rolInfo.label}
                                size="small"
                                sx={{
                                    height: 16, fontSize: '0.6rem', fontWeight: 600,
                                    bgcolor: alpha(rolInfo.color, 0.15), color: rolInfo.color,
                                    '& .MuiChip-label': { px: 0.75 },
                                }}
                            />
                        </Box>
                    )}
                    <Tooltip title="Cerrar sesión" arrow>
                        <IconButton onClick={() => { logout(); navigate('/login'); }} size="small"
                            sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1) } }}
                        >
                            <LogoutIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
        </Drawer>
    );
};

export default Sidebar;
