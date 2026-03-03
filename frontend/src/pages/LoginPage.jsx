import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Card, CardContent, TextField, Button, Typography, InputAdornment,
    IconButton, Alert, alpha, useTheme, CircularProgress,
} from '@mui/material';
import {
    Email as EmailIcon,
    Lock as LockIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Inventory2 as InventoryIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Por favor completa todos los campos');
            return;
        }

        setLoading(true);
        try {
            const result = await login(email, password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.message);
            }
        } catch {
            setError('Error de conexión. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme.palette.mode === 'dark'
                    ? `
            radial-gradient(ellipse at 20% 50%, ${alpha('#00bcd4', 0.15)} 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, ${alpha('#7c4dff', 0.12)} 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, ${alpha('#00bcd4', 0.08)} 0%, transparent 50%),
            linear-gradient(180deg, #0a1929 0%, #071320 100%)
          `
                    : `
            radial-gradient(ellipse at 20% 50%, ${alpha('#0288d1', 0.1)} 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, ${alpha('#7c4dff', 0.08)} 0%, transparent 50%),
            linear-gradient(180deg, #f5f7fa 0%, #e8ecf1 100%)
          `,
                p: 2,
            }}
        >
            {/* Floating orbs */}
            <Box
                sx={{
                    position: 'fixed',
                    top: '15%',
                    left: '10%',
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha('#00bcd4', 0.08)} 0%, transparent 70%)`,
                    filter: 'blur(40px)',
                    animation: 'float 6s ease-in-out infinite',
                    '@keyframes float': {
                        '0%, 100%': { transform: 'translateY(0)' },
                        '50%': { transform: 'translateY(-20px)' },
                    },
                }}
            />
            <Box
                sx={{
                    position: 'fixed',
                    bottom: '20%',
                    right: '15%',
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha('#7c4dff', 0.08)} 0%, transparent 70%)`,
                    filter: 'blur(40px)',
                    animation: 'float 8s ease-in-out infinite reverse',
                }}
            />

            <Card
                sx={{
                    width: '100%',
                    maxWidth: 420,
                    borderRadius: 4,
                    boxShadow: theme.palette.mode === 'dark'
                        ? '0 20px 60px rgba(0,0,0,0.5)'
                        : '0 10px 40px rgba(0,0,0,0.1)',
                    background: theme.palette.mode === 'dark'
                        ? alpha('#0d2137', 0.85)
                        : alpha('#ffffff', 0.9),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${theme.palette.divider}`,
                }}
            >
                <CardContent sx={{ p: 4 }}>
                    {/* Logo */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: '18px',
                                background: 'linear-gradient(135deg, #00bcd4 0%, #7c4dff 100%)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2,
                                boxShadow: '0 8px 24px rgba(0, 188, 212, 0.3)',
                            }}
                        >
                            <InventoryIcon sx={{ color: '#fff', fontSize: 32 }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                            Inventario CCO
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Inicia sesión para continuar
                        </Typography>
                    </Box>

                    {error && (
                        <Alert
                            severity="error"
                            sx={{ mb: 2, borderRadius: 2 }}
                            onClose={() => setError('')}
                        >
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Correo electrónico"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            sx={{ mb: 2.5 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                            placeholder="admin@cco.com"
                        />

                        <TextField
                            fullWidth
                            label="Contraseña"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            sx={{ mb: 3 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            placeholder="••••••••"
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{
                                py: 1.5,
                                fontSize: '1rem',
                                borderRadius: '12px',
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </Button>
                    </form>

                    <Typography
                        variant="caption"
                        sx={{
                            display: 'block',
                            textAlign: 'center',
                            mt: 3,
                            color: 'text.secondary',
                            opacity: 0.7,
                        }}
                    >
                        Demo: admin@cco.com / admin123
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

export default LoginPage;
