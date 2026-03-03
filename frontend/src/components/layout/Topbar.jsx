import {
    AppBar, Toolbar, Typography, IconButton, Box, alpha, useTheme, Tooltip, Chip,
} from '@mui/material';
import {
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useThemeMode } from '../../context/ThemeContext';

const Topbar = ({ title }) => {
    const theme = useTheme();
    const { mode, toggleTheme } = useThemeMode();

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

                    <Tooltip title="Notificaciones" arrow>
                        <IconButton
                            sx={{
                                color: 'text.secondary',
                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                            }}
                        >
                            <NotificationsIcon />
                        </IconButton>
                    </Tooltip>

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
