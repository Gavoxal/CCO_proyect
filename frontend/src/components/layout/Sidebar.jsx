import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Box, Typography, IconButton, Divider, Avatar, Tooltip, alpha, useTheme,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Inventory2 as InventoryIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED = 72;

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Inventario', icon: <InventoryIcon />, path: '/inventory' },
];

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const theme = useTheme();

    const drawerWidth = collapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH;

    const handleLogout = () => {
        logout();
        navigate('/login');
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
                        ? `linear-gradient(180deg, ${alpha('#0d2137', 0.95)} 0%, ${alpha('#0a1929', 0.98)} 100%)`
                        : `linear-gradient(180deg, ${alpha('#ffffff', 0.95)} 0%, ${alpha('#f5f7fa', 0.98)} 100%)`,
                    backdropFilter: 'blur(20px)',
                    borderRight: `1px solid ${theme.palette.divider}`,
                    transition: 'width 0.3s ease',
                    overflowX: 'hidden',
                },
            }}
        >
            {/* Logo Section */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', minHeight: 64 }}>
                {!collapsed && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 36, height: 36, borderRadius: '10px',
                                background: 'linear-gradient(135deg, #00bcd4 0%, #7c4dff 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <InventoryIcon sx={{ color: '#fff', fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                Inventario
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                Sistema CCO
                            </Typography>
                        </Box>
                    </Box>
                )}
                <IconButton
                    onClick={() => setCollapsed(!collapsed)}
                    size="small"
                    sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                    }}
                >
                    {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
                </IconButton>
            </Box>

            <Divider sx={{ mx: 1, opacity: 0.5 }} />

            {/* Menu Items */}
            <List sx={{ px: 1, py: 2, flex: 1 }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <Tooltip title={collapsed ? item.text : ''} placement="right" arrow>
                                <ListItemButton
                                    onClick={() => navigate(item.path)}
                                    sx={{
                                        borderRadius: '10px',
                                        minHeight: 48,
                                        justifyContent: collapsed ? 'center' : 'flex-start',
                                        px: collapsed ? 1.5 : 2,
                                        transition: 'all 0.2s ease',
                                        ...(isActive && {
                                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                                            '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
                                            '& .MuiListItemText-primary': { color: theme.palette.primary.main, fontWeight: 600 },
                                            boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
                                        }),
                                        '&:hover': {
                                            background: alpha(theme.palette.primary.main, 0.08),
                                        },
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: collapsed ? 0 : 40,
                                            mr: collapsed ? 0 : 1.5,
                                            justifyContent: 'center',
                                            color: isActive ? theme.palette.primary.main : 'text.secondary',
                                            transition: 'color 0.2s ease',
                                        }}
                                    >
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

            <Divider sx={{ mx: 1, opacity: 0.5 }} />

            {/* User Section */}
            <Box sx={{ p: 2 }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                    }}
                >
                    <Avatar
                        sx={{
                            width: 36, height: 36,
                            background: 'linear-gradient(135deg, #00bcd4 0%, #7c4dff 100%)',
                            fontSize: '0.85rem', fontWeight: 600,
                        }}
                    >
                        {user?.name?.charAt(0) || 'U'}
                    </Avatar>
                    {!collapsed && (
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
                                {user?.name || 'Usuario'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                                {user?.role || 'admin'}
                            </Typography>
                        </Box>
                    )}
                    <Tooltip title="Cerrar sesión" arrow>
                        <IconButton
                            onClick={handleLogout}
                            size="small"
                            sx={{
                                color: 'text.secondary',
                                '&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1) },
                            }}
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
