import { useState, useEffect } from 'react';
import {
    Box, Grid, Typography, Card, CardContent, LinearProgress,
    Alert, Chip, Avatar, List, ListItem, ListItemText, ListItemAvatar,
    Divider, Tab, Tabs, Button, Stack, CircularProgress,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Badge } from '@mui/material';
import {
    PeopleAlt as InfantesIcon,
    Inventory2 as InvIcon,
    CardGiftcard as GiftIcon,
    HomeWork as VisitaIcon,
    CheckCircle as CheckIcon,
    WarningAmber as WarningIcon,
    CalendarMonth as CalIcon,
    ManageAccounts as UsuariosIcon,
    AssignmentTurnedIn as AsistenciaIcon,
    Cake as CakeIcon,
    Event as EventIcon,
} from '@mui/icons-material';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/appServices';

// ─── Paleta CCO ───────────────────────────────────────────────
const CCO = {
    naranja: '#FF6B35',
    azul: '#004E89',
    violeta: '#6B2D5C',
    celeste: '#7BAE7F',
    amarillo: '#F4C430',
};

// removed localStorage mock functions


// ─── Componentes ──────────────────────────────────────────────
const StatCard = ({ icon, title, value, subtitle, color, chip, onClick }) => {
    const theme = useTheme();
    return (
        <Card elevation={0} onClick={onClick} sx={{
            border: '1.5px solid', borderColor: 'divider', borderRadius: 3, height: '100%',
            cursor: onClick ? 'pointer' : 'default', transition: 'all .2s ease',
            '&:hover': onClick ? {
                transform: 'translateY(-3px)',
                boxShadow: `0 8px 24px ${alpha(color, 0.18)}`,
                borderColor: alpha(color, 0.45),
            } : {},
        }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}
                            textTransform="uppercase" letterSpacing={0.7} sx={{ fontSize: '0.65rem' }}>
                            {title}
                        </Typography>
                        <Typography variant="h3" fontWeight={900} lineHeight={1.1} sx={{ mt: 0.5, color }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {subtitle}
                            </Typography>
                        )}
                        {chip && <Box sx={{ mt: 1.5 }}>{chip}</Box>}
                    </Box>
                    <Box sx={{
                        width: 52, height: 52, borderRadius: '14px',
                        bgcolor: alpha(color, 0.12),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, ml: 1.5,
                        border: `1px solid ${alpha(color, 0.2)}`,
                    }}>
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

// Barra de progreso limpia — sin textos aplastados
const ProgressBar = ({ label, value, total, color }) => {
    const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
    return (
        <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>{label}</Typography>
                <Typography variant="body2" fontWeight={800} sx={{ color }}>{pct}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={pct}
                sx={{
                    height: 9, borderRadius: 5, bgcolor: alpha(color, 0.12),
                    '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 5 }
                }} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {value} entregados de {total}
            </Typography>
        </Box>
    );
};

const SectionTitle = ({ children, action }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, mt: 0.5 }}>
        <Typography variant="overline" fontWeight={800} letterSpacing={1.2} color="text.disabled">
            {children}
        </Typography>
        {action}
    </Box>
);

const GoBtn = ({ to, label }) => {
    const navigate = useNavigate();
    return (
        <Button size="small" variant="text" onClick={() => navigate(to)}
            sx={{
                fontWeight: 700, fontSize: 11, textTransform: 'none', color: 'text.secondary',
                '&:hover': { color: CCO.azul }
            }}>
            {label} →
        </Button>
    );
};

// ─── TAB 1: MINISTERIO ───────────────────────────────────────
const TabMinisterio = ({ d }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const aColor = d.asistencia.pct >= 80 ? '#4caf50' : d.asistencia.pct >= 60 ? '#ff9800' : '#f44336';

    return (
        <Box>
            <SectionTitle action={<GoBtn to="/infantes" label="Ver infantes" />}>Infantes del Ministerio</SectionTitle>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard icon={<InfantesIcon sx={{ color: CCO.violeta, fontSize: 26 }} />}
                        title="Total Infantes" value={d.infantes.total}
                        subtitle={`${d.infantes.patrocinados} patrocinados · ${d.infantes.noPatrocinados} sin patrocinio`}
                        color={CCO.violeta} onClick={() => navigate('/infantes')} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard icon={<AsistenciaIcon sx={{ color: aColor, fontSize: 26 }} />}
                        title="Asistencia este Mes" value={`${d.asistencia.pct}%`}
                        subtitle="Promedio mensual del ministerio"
                        color={aColor} onClick={() => navigate('/asistencia')} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard icon={<VisitaIcon sx={{ color: d.visitas.sinVisita > 0 ? '#ef5350' : '#4caf50', fontSize: 26 }} />}
                        title="Sin Visita este Año" value={d.visitas.sinVisita}
                        subtitle={d.visitas.sinVisita > 0 ? 'Requieren visita domiciliaria' : 'Todos han sido visitados'}
                        color={d.visitas.sinVisita > 0 ? '#ef5350' : '#4caf50'} onClick={() => navigate('/visitas')} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard icon={<CheckIcon sx={{ color: '#4caf50', fontSize: 26 }} />}
                        title="Visitas Realizadas" value={d.visitas.realizadas}
                        subtitle={`de ${d.infantes.total} infantes este año`}
                        color="#4caf50" onClick={() => navigate('/visitas')} />
                </Grid>
            </Grid>

            <Grid container spacing={2.5} alignItems="stretch">
                {/* Regalos */}
                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <SectionTitle action={<GoBtn to="/regalos" label="Ver regalos" />}>
                        Regalos y Kits {new Date().getFullYear()}
                    </SectionTitle>
                    <Card elevation={0} sx={{ border: '1.5px solid', borderColor: 'divider', borderRadius: 3, flex: 1 }}>
                        <CardContent sx={{ p: 3 }}>
                            <ProgressBar label="Regalos de Navidad" value={d.regalos.navidad.entregados} total={d.regalos.navidad.total} color="#ef5350" />
                            <ProgressBar label="Kits Escolares" value={d.regalos.kits.entregados} total={d.regalos.kits.total} color={CCO.azul} />
                            <ProgressBar label="Atención Especial (est.)"
                                value={Math.round(d.infantes.total * 0.15)} total={d.infantes.total} color={CCO.celeste} />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Cumpleaños */}
                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <SectionTitle>Cumpleaños este Mes</SectionTitle>
                    <Card elevation={0} sx={{ border: '1.5px solid', borderColor: 'divider', borderRadius: 3, flex: 1 }}>
                        <CardContent sx={{ p: 3 }}>
                            {d.cumplesMes.length === 0 ? (
                                <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                                    No hay cumpleaños registrados este mes
                                </Alert>
                            ) : (
                                <List disablePadding>
                                    {d.cumplesMes.map((c, i) => (
                                        <Box key={i}>
                                            <ListItem disableGutters sx={{ py: 1 }}>
                                                <ListItemAvatar>
                                                    <Avatar sx={{
                                                        width: 40, height: 40, fontWeight: 900, fontSize: '0.95rem',
                                                        background: `linear-gradient(135deg, ${CCO.amarillo}, ${CCO.naranja})`,
                                                        color: '#fff',
                                                    }}>
                                                        {c.edad}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={c.nombre}
                                                    secondary={c.fecha}
                                                    primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem' }}
                                                    secondaryTypographyProps={{ fontSize: '0.8rem' }}
                                                />
                                            </ListItem>
                                            {i < d.cumplesMes.length - 1 && <Divider />}
                                        </Box>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Próximos Eventos del Ministerio */}
                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <SectionTitle action={<GoBtn to="/calendario" label="Ver calendario" />}>
                        Próximos Eventos
                    </SectionTitle>
                    <Card elevation={0} sx={{ border: '1.5px solid', borderColor: 'divider', borderRadius: 3, flex: 1 }}>
                        <CardContent sx={{ p: 3 }}>
                            {d.eventos?.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 2 }}>
                                    <EventIcon sx={{ fontSize: 40, color: 'text.disabled', opacity: 0.5 }} />
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        No hay eventos programados
                                    </Typography>
                                </Box>
                            ) : (
                                <List disablePadding>
                                    {d.eventos.map((ev, i, arr) => {
                                        const f = new Date(ev.fecha);
                                        return (
                                            <Box key={ev.id}>
                                                <ListItem disableGutters sx={{ py: 1.25, alignItems: 'flex-start' }}>
                                                    <ListItemAvatar>
                                                        <Box sx={{
                                                            width: 44, height: 44, borderRadius: 2,
                                                            bgcolor: alpha(CCO.violeta, 0.12),
                                                            border: `1px solid ${alpha(CCO.violeta, 0.25)}`,
                                                            display: 'flex', flexDirection: 'column',
                                                            alignItems: 'center', justifyContent: 'center',
                                                            flexShrink: 0,
                                                        }}>
                                                            <Typography sx={{ fontSize: 14, fontWeight: 900, color: CCO.violeta, lineHeight: 1 }}>
                                                                {f.getDate()}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: 8, fontWeight: 700, color: CCO.violeta, lineHeight: 1, mt: 0.25, opacity: 0.85 }}>
                                                                {f.toLocaleString('es-EC', { month: 'short' }).toUpperCase()}
                                                            </Typography>
                                                        </Box>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={ev.titulo}
                                                        secondary={ev.desc || 'Sin descripción'}
                                                        primaryTypographyProps={{ fontWeight: 800, fontSize: '0.85rem' }}
                                                        secondaryTypographyProps={{ fontSize: '0.75rem', sx: { display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' } }}
                                                        sx={{ pl: 0.5 }}
                                                    />
                                                </ListItem>
                                                {i < arr.length - 1 && <Divider />}
                                            </Box>
                                        );
                                    })}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

// ─── TAB 2: INVENTARIO ───────────────────────────────────────
const TabInventario = ({ d }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const stockList = d.inventario.stockBajo;

    return (
        <Box>
            <SectionTitle action={<GoBtn to="/inventario/materiales" label="Ir a Materiales" />}>Inventario de Materiales</SectionTitle>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <StatCard icon={<InvIcon sx={{ color: CCO.azul, fontSize: 26 }} />}
                        title="Materiales Registrados" value={d.inventario.matTotal}
                        subtitle="Artículos en el sistema" color={CCO.azul}
                        onClick={() => navigate('/inventario/materiales')} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard icon={<WarningIcon sx={{ color: stockList.length > 0 ? '#ff9800' : '#4caf50', fontSize: 26 }} />}
                        title="Stock Crítico" value={stockList.length}
                        subtitle={stockList.length > 0 ? 'Artículos bajo el mínimo' : 'Todo en niveles normales'}
                        color={stockList.length > 0 ? '#ff9800' : '#4caf50'}
                        onClick={() => navigate('/inventario/materiales')} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard icon={<UsuariosIcon sx={{ color: CCO.violeta, fontSize: 26 }} />}
                        title="Usuarios Activos" value={d.usuarios.activos}
                        subtitle={`${d.usuarios.tutores} tutores · ${d.usuarios.activos - d.usuarios.tutores} otros`}
                        color={CCO.violeta} onClick={() => navigate('/usuarios')} />
                </Grid>
            </Grid>

            <SectionTitle>Materiales con Stock Bajo o Crítico</SectionTitle>
            {stockList.length === 0 ? (
                <Alert severity="success" variant="outlined" sx={{ borderRadius: 3 }}>
                    Todo el inventario está en niveles adecuados
                </Alert>
            ) : (
                <Grid container spacing={2.5}>
                    {stockList.map(item => {
                        const pct = Math.min(100, Math.round((item.cantidad / item.min) * 100));
                        const color = pct < 30 ? '#f44336' : pct < 60 ? '#ff9800' : '#4caf50';
                        return (
                            <Grid item xs={12} sm={6} md={4} key={item.id}>
                                <Card elevation={0} sx={{
                                    border: '1.5px solid', borderColor: alpha(color, 0.35),
                                    borderRadius: 3, p: 0,
                                }}>
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                            <Typography variant="body2" fontWeight={700} sx={{ flex: 1, pr: 1 }}>
                                                {item.nombre}
                                            </Typography>
                                            <Chip
                                                label={`${item.cantidad} / ${item.min}`}
                                                size="small"
                                                sx={{
                                                    fontWeight: 800, minWidth: 64,
                                                    bgcolor: alpha(color, 0.12), color,
                                                    border: `1px solid ${alpha(color, 0.3)}`
                                                }}
                                            />
                                        </Box>
                                        <LinearProgress variant="determinate" value={pct}
                                            sx={{
                                                height: 8, borderRadius: 4, bgcolor: alpha(color, 0.1),
                                                '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 }
                                            }} />
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                                            Stock mínimo: {item.min} unidades
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Box>
    );
};



// ─── Página principal ─────────────────────────────────────────
export default function DashboardPage() {
    const theme = useTheme();
    const { user } = useAuth();
    const isDark = theme.palette.mode === 'dark';
    const [tab, setTab] = useState(0);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await dashboardService.getStats();
                setStats(res.data);
            } catch (error) {
                console.error('Error al cargar estadísticas:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const TABS = [
        { label: 'Ministerio', badge: 0 },
        { label: 'Inventario', badge: stats?.inventario?.alertaCount || 0 },
    ];

    const hora = new Date().getHours();
    const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

    return (
        <MainLayout>
            <Box sx={{ p: { xs: 2, md: 3 } }}>

                {/* Header */}
                <Box sx={{ mb: 3.5 }}>
                    <Typography variant="h4" fontWeight={900}>
                        {saludo}, {user?.nombre?.split(' ')[0] || user?.username}!
                    </Typography>
                    <Typography color="text.secondary" fontWeight={500} sx={{ mt: 0.5 }}>
                        Sistema KidScam · CCO / Ministerio Vidas en Acción —{' '}
                        {new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </Typography>
                </Box>

                {/* Tabs */}
                <Box sx={{
                    mb: 3.5, borderRadius: 3,
                    border: `1.5px solid ${theme.palette.divider}`,
                    overflow: 'hidden',
                    bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
                }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth"
                        sx={{
                            '& .MuiTabs-indicator': {
                                height: 3, borderRadius: '3px 3px 0 0',
                                background: `linear-gradient(90deg, ${CCO.naranja} 0%, ${CCO.violeta} 100%)`,
                            },
                            '& .MuiTab-root': {
                                fontWeight: 700,
                                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                                py: 2, textTransform: 'none', letterSpacing: 0.3, minHeight: 58,
                                '&:hover': { bgcolor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.04) },
                                '&.Mui-selected': { color: CCO.naranja },
                            },
                        }}>
                        {TABS.map((t, i) => (
                            <Tab key={i} label={
                                t.badge > 0 ? (
                                    <Badge badgeContent={t.badge} color="error"
                                        sx={{ '& .MuiBadge-badge': { top: -4, right: -8, fontWeight: 800 } }}>
                                        <span>{t.label}</span>
                                    </Badge>
                                ) : t.label
                            } />
                        ))}
                    </Tabs>
                </Box>

                {/* Contenido */}
                <Box key={tab} sx={{
                    animation: 'fadeUp .28s ease',
                    '@keyframes fadeUp': {
                        from: { opacity: 0, transform: 'translateY(8px)' },
                        to: { opacity: 1, transform: 'translateY(0)' },
                    },
                }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                            <CircularProgress color="primary" />
                        </Box>
                    ) : (
                        <>
                            {tab === 0 && stats && <TabMinisterio d={stats} />}
                            {tab === 1 && stats && <TabInventario d={stats} />}
                        </>
                    )}
                </Box>

            </Box>
        </MainLayout>
    );
}
