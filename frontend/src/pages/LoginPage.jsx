import { useState, useEffect, useCallback } from 'react';
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
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

// Paleta CCO
const CCO = {
    amarillo: '#FFD700',
    naranja: '#FF8C00',
    violeta: '#6A5ACD',
    azul: '#4169E1',
};

// ─── Mock de usuarios para demo (sin backend) ───────────────────────────────
const MOCK_USERS = [
    { username: 'admin', password: 'Admin2026!', rol: 'admin', nombre: 'Administrador CCO' },
    { username: 'secretaria', password: 'Secretaria2026!', rol: 'secretaria', nombre: 'Secretaria CCO' },
    { username: 'tutor1', password: 'Tutor2026!', rol: 'tutor', nombre: 'Tutor del Ministerio' },
];

// ─── Slides del carrusel ─────────────────────────────────────────────────────
const SLIDES = [
    {
        src: '/login1.jpg',
        titulo: 'Transformando vidas',
        desc: 'Ministerio Vías en Acción — Acompañando a niños, familias y comunidades hacia un futuro mejor.',
        color: CCO.naranja,
    },
    {
        src: '/login2.jpg',
        titulo: 'Formando el futuro',
        desc: 'Cada niño importa — educamos con amor, fe y propósito para construir communidades más fuertes.',
        color: CCO.violeta,
    },
    {
        src: '/login3.jpeg',
        titulo: 'Sirviendo con amor',
        desc: 'Kits escolares, regalos de navidad y mucho más — porque cada sonrisa vale el esfuerzo.',
        color: CCO.azul,
    },
];

const LoginPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { login } = useAuth();
    const isDark = theme.palette.mode === 'dark';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // ── Carrusel ────────────────────────────────────────────────────────────
    const [slide, setSlide] = useState(0);
    const [paused, setPaused] = useState(false);
    const [animDir, setAnimDir] = useState('next'); // 'next' | 'prev'

    const goTo = useCallback((idx, dir = 'next') => {
        setAnimDir(dir);
        setSlide(idx);
    }, []);

    const next = useCallback(() => goTo((slide + 1) % SLIDES.length, 'next'), [slide, goTo]);
    const prev = useCallback(() => goTo((slide - 1 + SLIDES.length) % SLIDES.length, 'prev'), [slide, goTo]);

    useEffect(() => {
        if (paused) return;
        const t = setInterval(next, 5000);
        return () => clearInterval(t);
    }, [paused, next]);

    // ── Login (usa AuthContext → authService con fallback mock) ────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!username || !password) { setError('Por favor completa todos los campos'); return; }
        setLoading(true);
        try {
            const result = await login(username, password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.message || 'Credenciales incorrectas');
            }
        } catch {
            setError('Error inesperado. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const currentSlide = SLIDES[slide];

    return (
        <Box sx={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>

            {/* ── PANEL IZQUIERDO — formulario ───────────────────────────── */}
            <Box sx={{
                flex: '0 0 auto',
                width: { xs: '100%', md: '45%', lg: '40%' },
                height: '100dvh',
                display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center',
                px: { xs: 3, sm: 5, md: 6 }, py: 2,
                overflowY: 'auto', boxSizing: 'border-box',
                background: isDark
                    ? 'linear-gradient(160deg, #0a0e1a 0%, #0f1629 100%)'
                    : 'linear-gradient(160deg, #f5f7ff 0%, #ffffff 100%)',
                position: 'relative', zIndex: 1,
            }}>
                {/* Orbs de fondo */}
                <Box sx={{ position: 'absolute', top: '-10%', left: '-20%', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(CCO.naranja, 0.12)} 0%, transparent 65%)`, filter: 'blur(50px)', pointerEvents: 'none' }} />
                <Box sx={{ position: 'absolute', bottom: '-5%', right: '-10%', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(CCO.violeta, 0.12)} 0%, transparent 65%)`, filter: 'blur(50px)', pointerEvents: 'none' }} />

                <Box sx={{ width: '100%', maxWidth: 380, position: 'relative' }}>
                    {/* Logo + nombre */}
                    <Box sx={{ mb: 3.5, textAlign: 'center' }}>
                        <Box sx={{
                            width: 80, height: 80, borderRadius: '20px',
                            background: `linear-gradient(135deg, ${CCO.naranja} 0%, ${CCO.violeta} 100%)`,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            mb: 2, boxShadow: `0 12px 32px ${alpha(CCO.naranja, 0.35)}`, overflow: 'hidden',
                        }}>
                            <img src="/OBRA PIA BLANCO.png" alt="CCO Logo"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={e => { e.target.style.display = 'none'; }} />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.8, flexWrap: 'wrap', mb: 0.5 }}>
                            <Typography variant="h5" fontWeight={800} sx={{
                                background: `linear-gradient(90deg, ${CCO.naranja} 0%, #ffb347 100%)`,
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>Centro Cristiano</Typography>
                            <Typography variant="h5" fontWeight={800} color="text.primary">Obrapía</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Sistema KidScam · Ministerio Vías en Acción
                        </Typography>
                    </Box>

                    {/* Título del form */}
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Iniciar sesión</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Ingresa tus credenciales para continuar
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField fullWidth label="Usuario" value={username}
                            onChange={e => setUsername(e.target.value)} sx={{ mb: 2.5 }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> }}
                            placeholder="ej. admin" autoComplete="username" />

                        <TextField fullWidth label="Contraseña"
                            type={showPassword ? 'text' : 'password'}
                            value={password} onChange={e => setPassword(e.target.value)} sx={{ mb: 3.5 }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                                endAdornment: <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>,
                            }}
                            placeholder="••••••••" autoComplete="current-password" />

                        <Button type="submit" fullWidth variant="contained" size="large"
                            disabled={loading} endIcon={!loading && <ArrowIcon />}
                            sx={{
                                py: 1.6, fontSize: '1rem', fontWeight: 700, borderRadius: '14px',
                                background: `linear-gradient(135deg, ${CCO.naranja} 0%, ${CCO.violeta} 100%)`,
                                boxShadow: `0 8px 24px ${alpha(CCO.naranja, 0.4)}`,
                                '&:hover': { background: `linear-gradient(135deg, #ffac40 0%, #8a7bd4 100%)`, boxShadow: `0 12px 32px ${alpha(CCO.naranja, 0.5)}`, transform: 'translateY(-2px)' },
                                '&:disabled': { background: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.06) },
                            }}>
                            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Iniciar Sesión'}
                        </Button>
                    </Box>

                    {/* Credenciales de demo */}
                    <Box sx={{ mt: 3, p: 1.5, borderRadius: 2, bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.03), border: `1px dashed ${alpha(CCO.naranja, 0.3)}` }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mb: 0.5, fontWeight: 600 }}>
                            Credenciales demo
                        </Typography>
                        {MOCK_USERS.map(u => (
                            <Typography key={u.username} variant="caption" sx={{ color: 'text.disabled', display: 'block', textAlign: 'center' }}>
                                <strong style={{ color: isDark ? '#ccc' : '#555' }}>{u.username}</strong> / {u.password}
                            </Typography>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* ── PANEL DERECHO — carrusel ────────────────────────────────── */}
            <Box
                sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, position: 'relative', overflow: 'hidden' }}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
            >
                {/* Slides */}
                {SLIDES.map((s, i) => (
                    <Box key={i} sx={{
                        position: 'absolute', inset: 0,
                        transition: 'opacity 0.8s ease, transform 0.8s ease',
                        opacity: i === slide ? 1 : 0,
                        transform: i === slide ? 'scale(1)' : 'scale(1.04)',
                        pointerEvents: i === slide ? 'auto' : 'none',
                    }}>
                        <Box component="img" src={s.src} alt={s.titulo}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                        {/* Overlay degradado del slide */}
                        <Box sx={{
                            position: 'absolute', inset: 0,
                            background: `linear-gradient(160deg, ${alpha(CCO.violeta, 0.5)} 0%, ${alpha(s.color, 0.35)} 50%, ${alpha('#000', 0.4)} 100%)`,
                        }} />
                    </Box>
                ))}

                {/* Badge sistema */}
                <Box sx={{
                    position: 'absolute', top: 24, right: 24, zIndex: 10,
                    px: 2, py: 1, borderRadius: 3,
                    bgcolor: alpha('#000', 0.35), backdropFilter: 'blur(12px)',
                    border: `1px solid ${alpha('#fff', 0.2)}`,
                }}>
                    <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, letterSpacing: 0.5 }}>
                        Sistema KidScam v1.0
                    </Typography>
                </Box>

                {/* Flechas de navegación */}
                <IconButton onClick={prev} sx={{
                    position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                    bgcolor: alpha('#000', 0.3), backdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha('#fff', 0.2)}`, color: '#fff',
                    '&:hover': { bgcolor: alpha(CCO.naranja, 0.5) },
                    transition: 'all 0.25s ease',
                }}>
                    <ChevronLeftIcon />
                </IconButton>
                <IconButton onClick={next} sx={{
                    position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                    bgcolor: alpha('#000', 0.3), backdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha('#fff', 0.2)}`, color: '#fff',
                    '&:hover': { bgcolor: alpha(CCO.naranja, 0.5) },
                    transition: 'all 0.25s ease',
                }}>
                    <ChevronRightIcon />
                </IconButton>

                {/* Texto + indicadores (fixed abajo) */}
                <Box sx={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, p: 3,
                    background: `linear-gradient(to top, ${alpha('#000', 0.78)} 0%, transparent 100%)`,
                }}>
                    {/* Animación del texto con key = slide para re-montar */}
                    <Box key={slide} sx={{
                        animation: 'slideUp 0.6s ease forwards',
                        '@keyframes slideUp': {
                            from: { opacity: 0, transform: 'translateY(16px)' },
                            to: { opacity: 1, transform: 'translateY(0)' },
                        },
                    }}>
                        <Typography variant="h4" fontWeight={800} color="#fff"
                            sx={{ mb: 0.5, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                            {currentSlide.titulo}
                        </Typography>
                        <Typography variant="body1"
                            sx={{ color: alpha('#fff', 0.85), maxWidth: 420, lineHeight: 1.7, mb: 2 }}>
                            {currentSlide.desc}
                        </Typography>
                    </Box>

                    {/* Indicadores de slide (clicables) */}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {SLIDES.map((s, i) => (
                            <Box key={i} onClick={() => goTo(i, i > slide ? 'next' : 'prev')}
                                sx={{
                                    height: 4, borderRadius: 2, cursor: 'pointer',
                                    width: i === slide ? 32 : 14,
                                    bgcolor: i === slide ? s.color : alpha('#fff', 0.45),
                                    boxShadow: i === slide ? `0 0 8px ${s.color}` : 'none',
                                    transition: 'all 0.4s ease',
                                    '&:hover': { bgcolor: i === slide ? s.color : alpha('#fff', 0.7) },
                                }} />
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default LoginPage;