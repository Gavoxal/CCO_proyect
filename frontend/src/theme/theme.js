import { createTheme, alpha } from '@mui/material/styles';

// ─── Paleta de la Organización CCO ───────────────────────────────────────────
const CCO = {
    amarillo: '#FFD700',
    naranja: '#FF8C00',
    violeta: '#6A5ACD',
    azul: '#4169E1',
};

const getDesignTokens = (mode) => ({
    palette: {
        mode,
        ...(mode === 'dark'
            ? {
                primary: { main: CCO.naranja, light: '#ffac40', dark: '#c45f00' },
                secondary: { main: CCO.violeta, light: '#9d8fe0', dark: '#4b3e99' },
                background: { default: '#0a0e1a', paper: '#0f1629' },
                success: { main: '#00e676' },
                warning: { main: CCO.amarillo },
                error: { main: '#ff5252' },
                info: { main: CCO.azul },
                text: { primary: '#f0f4ff', secondary: '#8fa3c0' },
                divider: alpha('#8fa3c0', 0.12),
            }
            : {
                primary: { main: CCO.azul, light: '#738eea', dark: '#2b4db0' },
                secondary: { main: CCO.violeta, light: '#9d8fe0', dark: '#4b3e99' },
                background: { default: '#f5f7ff', paper: '#ffffff' },
                success: { main: '#2e7d32' },
                warning: { main: CCO.naranja },
                error: { main: '#d32f2f' },
                info: { main: CCO.azul },
                text: { primary: '#1a2040', secondary: '#5b6b8a' },
                divider: alpha('#919eab', 0.2),
            }),
    },
    typography: {
        fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
        h1: { fontWeight: 800, fontSize: '2.5rem', letterSpacing: '-0.02em' },
        h2: { fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.01em' },
        h3: { fontWeight: 600, fontSize: '1.5rem' },
        h4: { fontWeight: 700, fontSize: '1.25rem' },
        h5: { fontWeight: 600, fontSize: '1.1rem' },
        h6: { fontWeight: 600, fontSize: '1rem' },
        subtitle1: { fontWeight: 500, fontSize: '0.95rem' },
        subtitle2: { fontWeight: 500, fontSize: '0.85rem' },
        button: { fontWeight: 700, textTransform: 'none' },
    },
    shape: { borderRadius: 12 },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    padding: '8px 20px',
                    fontSize: '0.875rem',
                    boxShadow: 'none',
                    transition: 'all 0.25s ease-in-out',
                    '&:hover': {
                        boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                        transform: 'translateY(-1px)',
                    },
                },
                contained: {
                    background: mode === 'dark'
                        ? `linear-gradient(135deg, ${CCO.naranja} 0%, ${CCO.violeta} 100%)`
                        : `linear-gradient(135deg, ${CCO.azul} 0%, ${CCO.violeta} 100%)`,
                    color: '#fff',
                    '&:hover': {
                        background: mode === 'dark'
                            ? `linear-gradient(135deg, #ffac40 0%, #9d8fe0 100%)`
                            : `linear-gradient(135deg, #5578e8 0%, #9d8fe0 100%)`,
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: mode === 'dark'
                        ? '0 4px 24px rgba(0,0,0,0.5)'
                        : '0 2px 14px rgba(0,0,0,0.08)',
                    backdropFilter: 'blur(20px)',
                    background: mode === 'dark'
                        ? alpha('#0f1629', 0.85)
                        : alpha('#ffffff', 0.92),
                    border: `1px solid ${mode === 'dark' ? alpha('#8fa3c0', 0.1) : alpha('#919eab', 0.14)}`,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: mode === 'dark'
                            ? '0 8px 32px rgba(0,0,0,0.55)'
                            : '0 4px 22px rgba(0,0,0,0.12)',
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
                                ? `0 0 0 2px ${alpha(CCO.naranja, 0.25)}`
                                : `0 0 0 2px ${alpha(CCO.azul, 0.2)}`,
                        },
                        '&.Mui-focused': {
                            boxShadow: mode === 'dark'
                                ? `0 0 0 3px ${alpha(CCO.naranja, 0.35)}`
                                : `0 0 0 3px ${alpha(CCO.azul, 0.25)}`,
                        },
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: { root: { borderRadius: 16, backgroundImage: 'none' } },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: 'none',
                    boxShadow: mode === 'dark'
                        ? '4px 0 24px rgba(0,0,0,0.35)'
                        : '2px 0 12px rgba(0,0,0,0.07)',
                },
            },
        },
        MuiChip: {
            styleOverrides: { root: { borderRadius: 8, fontWeight: 600 } },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: '0.72rem',
                    letterSpacing: '0.06em',
                    color: mode === 'dark' ? '#8fa3c0' : '#5b6b8a',
                },
            },
        },
        MuiDialog: {
            styleOverrides: { paper: { borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } },
        },
        MuiTooltip: {
            styleOverrides: { tooltip: { borderRadius: 8, fontSize: '0.75rem' } },
        },
    },
});

export const createAppTheme = (mode) => createTheme(getDesignTokens(mode));

export default createAppTheme;
