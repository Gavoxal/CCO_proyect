import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, TextField, Button, Typography, InputAdornment,
    IconButton, Alert, alpha, useTheme, CircularProgress,
} from '@mui/material';
import {
    Person as PersonIcon,
    Lock as LockIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

// Paleta CCO
const CCO = {
    amarillo: '#FFD700',
    naranja: '#FF8C00',
    violeta: '#6A5ACD',
    azul: '#4169E1',
};

const LoginPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const isDark = theme.palette.mode === 'dark';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!username || !password) { setError('Por favor completa todos los campos'); return; }
        setLoading(true);
        try {
            const result = await login(username, password);
            if (result.success) navigate('/');
            else setError(result.message || 'Credenciales incorrectas');
        } catch {
            setError('Error de conexión. Verifica que el servidor está activo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>

            {/* ── PANEL IZQUIERDO — formulario ────────────────────────────────── */}
            <Box
                sx={{
                    flex: '0 0 auto',
                    width: { xs: '100%', md: '45%', lg: '40%' },
                    height: '100dvh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    px: { xs: 3, sm: 5, md: 6 },
                    py: 2,
                    overflowY: 'auto',
                    boxSizing: 'border-box',
                    background: isDark
                        ? `linear-gradient(160deg, #0a0e1a 0%, #0f1629 100%)`
                        : `linear-gradient(160deg, #f5f7ff 0%, #ffffff 100%)`,
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                {/* Orb de fondo */}
                <Box sx={{
                    position: 'absolute', top: '-10%', left: '-20%',
                    width: 400, height: 400, borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha(CCO.naranja, 0.12)} 0%, transparent 65%)`,
                    filter: 'blur(50px)', pointerEvents: 'none',
                }} />
                <Box sx={{
                    position: 'absolute', bottom: '-5%', right: '-10%',
                    width: 300, height: 300, borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha(CCO.violeta, 0.12)} 0%, transparent 65%)`,
                    filter: 'blur(50px)', pointerEvents: 'none',
                }} />

                <Box sx={{ width: '100%', maxWidth: 380, position: 'relative' }}>

                    {/* Logo + nombre */}
                    <Box sx={{ mb: 3.5, textAlign: 'center' }}>
                        {/* Logo centrado */}
                        <Box sx={{
                            width: 80, height: 80, borderRadius: '20px',
                            background: `linear-gradient(135deg, ${CCO.naranja} 0%, ${CCO.violeta} 100%)`,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            mb: 2, boxShadow: `0 12px 32px ${alpha(CCO.naranja, 0.35)}`,
                            overflow: 'hidden',
                        }}>
                            <img
                                src="/OBRA PIA BLANCO.png"
                                alt="CCO Logo"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        </Box>

                        {/* Nombre en una línea: naranja + blanco */}
                        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.8, flexWrap: 'wrap', mb: 0.5 }}>
                            <Typography variant="h5" fontWeight={800} sx={{
                                background: `linear-gradient(90deg, ${CCO.naranja} 0%, #ffb347 100%)`,
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>
                                Centro Cristiano
                            </Typography>
                            <Typography variant="h5" fontWeight={800} color="text.primary">
                                Obrapía
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Sistema KidScam · Ministerio Vías en Acción
                        </Typography>
                    </Box>

                    {/* Título del form */}
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                        Iniciar sesión
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Ingresa tus credenciales para continuar
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            sx={{ mb: 2.5 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                            placeholder="ej. admin"
                            autoComplete="username"
                        />

                        <TextField
                            fullWidth
                            label="Contraseña"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            sx={{ mb: 3.5 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            endIcon={!loading && <ArrowIcon />}
                            sx={{
                                py: 1.6,
                                fontSize: '1rem',
                                fontWeight: 700,
                                borderRadius: '14px',
                                background: `linear-gradient(135deg, ${CCO.naranja} 0%, ${CCO.violeta} 100%)`,
                                boxShadow: `0 8px 24px ${alpha(CCO.naranja, 0.4)}`,
                                '&:hover': {
                                    background: `linear-gradient(135deg, #ffac40 0%, #8a7bd4 100%)`,
                                    boxShadow: `0 12px 32px ${alpha(CCO.naranja, 0.5)}`,
                                    transform: 'translateY(-2px)',
                                },
                                '&:disabled': { background: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.06) },
                            }}
                        >
                            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Iniciar Sesión'}
                        </Button>
                    </Box>

                    <Typography variant="caption" sx={{
                        display: 'block', textAlign: 'center', mt: 3.5,
                        color: 'text.disabled', opacity: 0.7,
                    }}>
                        ¿Problemas para acceder? Contacta al administrador
                    </Typography>
                </Box>
            </Box>

            {/* ── PANEL DERECHO — imagen ──────────────────────────────────────── */}
            <Box
                sx={{
                    flex: 1,
                    display: { xs: 'none', md: 'flex' },
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Imagen de fondo */}
                <Box
                    component="img"
                    src="/login_panel.png"
                    alt="Ministerio Vías en Acción"
                    sx={{
                        width: '100%', height: '100%',
                        objectFit: 'cover', objectPosition: 'center',
                    }}
                />

                {/* Overlay gradiente */}
                <Box sx={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(
            135deg,
            ${alpha(CCO.violeta, 0.55)} 0%,
            ${alpha(CCO.naranja, 0.35)} 50%,
            ${alpha(CCO.azul, 0.5)} 100%
          )`,
                }} />

                {/* Texto sobre la imagen */}
                <Box sx={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    p: 3,
                    background: `linear-gradient(to top, ${alpha('#000', 0.72)} 0%, transparent 100%)`,
                }}>
                    <Typography variant="h4" fontWeight={800} color="#fff" sx={{ mb: 1, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                        Transformando vidas
                    </Typography>
                    <Typography variant="body1" sx={{ color: alpha('#fff', 0.85), maxWidth: 420, lineHeight: 1.7 }}>
                        Ministerio Vías en Acción — Acompañando a niños, familias y comunidades hacia un futuro mejor.
                    </Typography>

                    {/* Indicadores decorativos */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 2.5 }}>
                        {[CCO.amarillo, CCO.naranja, CCO.violeta, CCO.azul].map((c, i) => (
                            <Box key={i} sx={{
                                height: 4, borderRadius: 2,
                                width: i === 0 ? 32 : 16,
                                bgcolor: i === 0 ? c : alpha(c, 0.6),
                                transition: 'all 0.3s ease',
                            }} />
                        ))}
                    </Box>
                </Box>

                {/* Badge de sistema */}
                <Box sx={{
                    position: 'absolute', top: 24, right: 24,
                    px: 2, py: 1, borderRadius: 3,
                    bgcolor: alpha('#000', 0.35),
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${alpha('#fff', 0.2)}`,
                }}>
                    <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, letterSpacing: 0.5 }}>
                        Sistema KidScam v1.0
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default LoginPage;
