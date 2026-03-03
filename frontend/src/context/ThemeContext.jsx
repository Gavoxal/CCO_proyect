import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '../theme/theme';

const ThemeContext = createContext();

export const useThemeMode = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useThemeMode must be used within ThemeContextProvider');
    return context;
};

export const ThemeContextProvider = ({ children }) => {
    const [mode, setMode] = useState(() => {
        const saved = localStorage.getItem('themeMode');
        return saved || 'dark';
    });

    useEffect(() => {
        localStorage.setItem('themeMode', mode);
    }, [mode]);

    const toggleTheme = () => {
        setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const theme = useMemo(() => createAppTheme(mode), [mode]);

    const value = useMemo(() => ({ mode, toggleTheme }), [mode]);

    return (
        <ThemeContext.Provider value={value}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
