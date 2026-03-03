import { createTheme, alpha } from '@mui/material/styles';

const getDesignTokens = (mode) => ({
    palette: {
        mode,
        ...(mode === 'dark'
            ? {
                primary: { main: '#00bcd4', light: '#4dd0e1', dark: '#0097a7' },
                secondary: { main: '#7c4dff', light: '#b47cff', dark: '#3f1dcb' },
                background: {
                    default: '#0a1929',
                    paper: '#0d2137',
                },
                success: { main: '#00e676' },
                warning: { main: '#ffab40' },
                error: { main: '#ff5252' },
                info: { main: '#40c4ff' },
                text: {
                    primary: '#e3f2fd',
                    secondary: '#90a4ae',
                },
                divider: alpha('#90caf9', 0.12),
            }
            : {
                primary: { main: '#0288d1', light: '#03a9f4', dark: '#01579b' },
                secondary: { main: '#7c4dff', light: '#b47cff', dark: '#3f1dcb' },
                background: {
                    default: '#f5f7fa',
                    paper: '#ffffff',
                },
                success: { main: '#2e7d32' },
                warning: { main: '#ed6c02' },
                error: { main: '#d32f2f' },
                info: { main: '#0288d1' },
                text: {
                    primary: '#1a2027',
                    secondary: '#637381',
                },
                divider: alpha('#919eab', 0.2),
            }),
    },
    typography: {
        fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
        h1: { fontWeight: 700, fontSize: '2.5rem', letterSpacing: '-0.02em' },
        h2: { fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.01em' },
        h3: { fontWeight: 600, fontSize: '1.5rem' },
        h4: { fontWeight: 600, fontSize: '1.25rem' },
        h5: { fontWeight: 600, fontSize: '1.1rem' },
        h6: { fontWeight: 600, fontSize: '1rem' },
        subtitle1: { fontWeight: 500, fontSize: '0.95rem' },
        subtitle2: { fontWeight: 500, fontSize: '0.85rem' },
        button: { fontWeight: 600, textTransform: 'none' },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    padding: '8px 20px',
                    fontSize: '0.875rem',
                    boxShadow: 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        transform: 'translateY(-1px)',
                    },
                },
                contained: {
                    background: mode === 'dark'
                        ? 'linear-gradient(135deg, #00bcd4 0%, #7c4dff 100%)'
                        : 'linear-gradient(135deg, #0288d1 0%, #7c4dff 100%)',
                    color: '#fff',
                    '&:hover': {
                        background: mode === 'dark'
                            ? 'linear-gradient(135deg, #4dd0e1 0%, #b47cff 100%)'
                            : 'linear-gradient(135deg, #03a9f4 0%, #b47cff 100%)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: mode === 'dark'
                        ? '0 4px 20px rgba(0,0,0,0.4)'
                        : '0 2px 12px rgba(0,0,0,0.08)',
                    backdropFilter: 'blur(20px)',
                    background: mode === 'dark'
                        ? alpha('#0d2137', 0.8)
                        : alpha('#ffffff', 0.9),
                    border: `1px solid ${mode === 'dark' ? alpha('#90caf9', 0.08) : alpha('#919eab', 0.12)}`,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: mode === 'dark'
                            ? '0 8px 30px rgba(0,0,0,0.5)'
                            : '0 4px 20px rgba(0,0,0,0.12)',
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 10,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            boxShadow: mode === 'dark'
                                ? '0 0 0 2px rgba(0,188,212,0.2)'
                                : '0 0 0 2px rgba(2,136,209,0.15)',
                        },
                        '&.Mui-focused': {
                            boxShadow: mode === 'dark'
                                ? '0 0 0 3px rgba(0,188,212,0.3)'
                                : '0 0 0 3px rgba(2,136,209,0.2)',
                        },
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    backgroundImage: 'none',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: 'none',
                    boxShadow: mode === 'dark'
                        ? '4px 0 20px rgba(0,0,0,0.3)'
                        : '2px 0 12px rgba(0,0,0,0.06)',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontWeight: 500,
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    color: mode === 'dark' ? '#90a4ae' : '#637381',
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 20,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    borderRadius: 8,
                    fontSize: '0.75rem',
                },
            },
        },
    },
});

export const createAppTheme = (mode) => createTheme(getDesignTokens(mode));

export default createAppTheme;
