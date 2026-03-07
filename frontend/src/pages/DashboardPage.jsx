import { useState, useEffect } from 'react';
import {
    Box, Grid, Typography, Card, CardContent, LinearProgress,
    Alert, Chip, Avatar, List, ListItem, ListItemText, ListItemAvatar,
    Divider, Skeleton, alpha, useTheme,
} from '@mui/material';
import {
    PeopleAlt as InfantesIcon,
    CheckCircle as CheckIcon,
    Warning as WarningIcon,
    Inventory2 as InvIcon,
    CalendarMonth as CalIcon,
    Church as ChurchIcon,
    CardGiftcard as GiftIcon,
    TrendingUp as TrendIcon,
    HomeWork as VisitaIcon,
} from '@mui/icons-material';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import {
    infantesService, asistenciaService, materialesService,
    regalosService, miembrosService, casasPazService, eventosService,
} from '../services/appServices';

// ─── Componente de tarjeta de estadística ────────────────────────────────────
const StatCard = ({ icon, title, value, subtitle, color, loading }) => {
    const theme = useTheme();
    return (
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                            {title}
                        </Typography>
                        {loading ? (
                            <Skeleton width={80} height={44} />
                        ) : (
                            <Typography variant="h3" fontWeight={800} lineHeight={1.1} sx={{ mt: 0.5 }}>
                                {value}
                            </Typography>
                        )}
                        {subtitle && !loading && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{
                        width: 48, height: 48, borderRadius: '14px',
                        bgcolor: alpha(color, 0.12),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

// ─── Barra de progreso con label ─────────────────────────────────────────────
const ProgressRow = ({ label, value, total, color }) => (
    <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">{label}</Typography>
            <Typography variant="body2" fontWeight={600} color={color}>
                {value}/{total}
            </Typography>
        </Box>
        <LinearProgress
            variant="determinate"
            value={total > 0 ? (value / total) * 100 : 0}
            sx={{
                height: 8, borderRadius: 4,
                bgcolor: alpha(color, 0.15),
                '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
            }}
        />
    </Box>
);

// ─── Evento del calendario ───────────────────────────────────────────────────
const EventoRow = ({ evento }) => {
    const colores = { Ministerio: '#7c4dff', Iglesia: '#4caf50', Emergencia: '#f44336' };
    const color = colores[evento.tipo] || '#9e9e9e';
    const fecha = new Date(evento.fechaInicio);
    return (
        <ListItem disableGutters sx={{ py: 0.75 }}>
            <ListItemAvatar>
                <Avatar sx={{ bgcolor: alpha(color, 0.15), color, width: 40, height: 40, fontSize: '0.75rem', fontWeight: 700 }}>
                    {fecha.getDate()}
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                primary={evento.titulo}
                secondary={`${fecha.toLocaleDateString('es-EC', { month: 'short' })} · ${evento.tipo}`}
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }}
                secondaryTypographyProps={{ fontSize: '0.75rem' }}
            />
            <Chip label={evento.tipo} size="small" sx={{ bgcolor: alpha(color, 0.12), color, fontSize: '0.65rem' }} />
        </ListItem>
    );
};

// ─── DashboardPage ────────────────────────────────────────────────────────────
const DashboardPage = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        totalInfantes: 0, patrocinados: 0, noPatrocinados: 0,
        asistenciaMes: 0, // porcentaje
        regalosNavidad: { entregados: 0, total: 0 },
        kitsEscolares: { entregados: 0, total: 0 },
        sinVisita: 0,
        stockBajo: [], desactualizados: [],
        solicitudesPendientes: 0,
        miembros: { activos: 0, regulares: 0, lideres: 0 },
        casasPazActivas: 0,
        proximosEventos: [],
    });

    useEffect(() => {
        const cargar = async () => {
            try {
                const anio = new Date().getFullYear();
                const [
                    infantesRes, sinVisitaRes, alertasRes,
                    regalosNavRes, kitsRes,
                    eventosRes,
                ] = await Promise.allSettled([
                    infantesService.listar({ limit: 1 }),
                    infantesService.sinVisitaAnio(),
                    materialesService.alertas(),
                    regalosService.listar({ tipo: 'regalo_navidad', anio, limit: 1 }),
                    regalosService.listar({ tipo: 'kit_escolar', anio, limit: 1 }),
                    eventosService.listar({ limit: 3 }),
                ]);

                const infTotal = infantesRes.value?.meta?.total || 0;
                const sinVisita = sinVisitaRes.value?.data?.length || 0;
                const alertas = alertasRes.value?.data || {};
                const navTotal = regalosNavRes.value?.meta?.total || 0;
                const kitsTotal = kitsRes.value?.meta?.total || 0;
                const eventos = eventosRes.value?.data || [];

                // Calcular entregados (aproximación con conteo por estado)
                const [navEntRes, kitEntRes, solPendRes] = await Promise.allSettled([
                    regalosService.listar({ tipo: 'regalo_navidad', anio, estado: 'entregado', limit: 1 }),
                    regalosService.listar({ tipo: 'kit_escolar', anio, estado: 'entregado', limit: 1 }),
                    infantesService.listar({ limit: 1 }), // placeholder
                ]);

                setData({
                    totalInfantes: infTotal,
                    sinVisita,
                    regalosNavidad: { entregados: navEntRes.value?.meta?.total || 0, total: navTotal },
                    kitsEscolares: { entregados: kitEntRes.value?.meta?.total || 0, total: kitsTotal },
                    stockBajo: alertas.stockBajo || [],
                    desactualizados: alertas.desactualizados || [],
                    proximosEventos: eventos,
                });
            } catch (err) {
                console.error('Error cargando dashboard:', err);
            } finally {
                setLoading(false);
            }
        };
        cargar();
    }, []);

    return (
        <MainLayout>
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" fontWeight={800}>
                        ¡Bienvenido, {user?.nombre?.split(' ')[0] || user?.username}! 👋
                    </Typography>
                    <Typography color="text.secondary">
                        Sistema KidScam · CCO / Ministerio Vías en Acción
                    </Typography>
                </Box>

                {/* ━━━ SECCIÓN A: Ministerio Infantes ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <Box sx={{ mb: 1 }}>
                    <Typography variant="overline" color="text.disabled" fontWeight={700} letterSpacing={1}>
                        👶 Ministerio · Infantes
                    </Typography>
                </Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            loading={loading}
                            icon={<InfantesIcon sx={{ color: '#7c4dff' }} />}
                            title="Total Infantes"
                            value={data.totalInfantes}
                            subtitle="Registrados en el sistema"
                            color="#7c4dff"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            loading={loading}
                            icon={<VisitaIcon sx={{ color: data.sinVisita > 0 ? '#f44336' : '#4caf50' }} />}
                            title="Sin Visita este Año"
                            value={data.sinVisita}
                            subtitle={data.sinVisita > 0 ? '⚠️ Requieren visita' : '✅ Todos visitados'}
                            color={data.sinVisita > 0 ? '#f44336' : '#4caf50'}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <GiftIcon sx={{ color: '#ff9800' }} />
                                    <Typography variant="subtitle2" fontWeight={700}>Regalos y Kits {new Date().getFullYear()}</Typography>
                                </Box>
                                {loading ? (
                                    <><Skeleton variant="text" sx={{ mb: 1 }} /><Skeleton variant="rectangular" height={10} sx={{ mb: 1.5 }} /></>
                                ) : (
                                    <>
                                        <ProgressRow label="🎁 Navidad" value={data.regalosNavidad.entregados} total={data.regalosNavidad.total} color="#f44336" />
                                        <ProgressRow label="🎒 Kit Escolar" value={data.kitsEscolares.entregados} total={data.kitsEscolares.total} color="#2196f3" />
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* ━━━ SECCIÓN B: Inventario ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <Box sx={{ mb: 1 }}>
                    <Typography variant="overline" color="text.disabled" fontWeight={700} letterSpacing={1}>
                        📦 Inventario
                    </Typography>
                </Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <WarningIcon sx={{ color: '#f44336' }} fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={700}>Stock Bajo o Crítico</Typography>
                                </Box>
                                {loading ? <Skeleton variant="rectangular" height={60} /> : (
                                    data.stockBajo.length === 0
                                        ? <Alert severity="success" variant="outlined" sx={{ borderRadius: 2 }}>Todo el inventario está en niveles normales</Alert>
                                        : data.stockBajo.slice(0, 4).map(item => (
                                            <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                                <Typography variant="body2">{item.nombreMaterial}</Typography>
                                                <Chip label={`${item.cantidadDisponible} uds`} size="small" color="error" variant="outlined" />
                                            </Box>
                                        ))
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <InvIcon sx={{ color: '#ff9800' }} fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={700}>Sin Actualizar (+30 días)</Typography>
                                </Box>
                                {loading ? <Skeleton variant="rectangular" height={60} /> : (
                                    data.desactualizados.length === 0
                                        ? <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>Todo el inventario está actualizado</Alert>
                                        : data.desactualizados.slice(0, 4).map(item => (
                                            <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                                <Typography variant="body2">{item.nombreMaterial}</Typography>
                                                <Chip label="Desactualizado" size="small" color="warning" variant="outlined" />
                                            </Box>
                                        ))
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* ━━━ SECCIÓN C + D: Iglesia CCO + Calendario ━━━━━━━━━━━━━━━━━━━━━ */}
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ mb: 1 }}>
                            <Typography variant="overline" color="text.disabled" fontWeight={700} letterSpacing={1}>
                                ⛪ Iglesia CCO
                            </Typography>
                        </Box>
                        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                            <CardContent sx={{ p: 2.5 }}>
                                {loading ? (
                                    [1, 2, 3].map(i => <Skeleton key={i} variant="text" sx={{ mb: 1 }} />)
                                ) : (
                                    <>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                            <Typography variant="body2" color="text.secondary">Miembros Activos</Typography>
                                            <Typography variant="body2" fontWeight={700}>{data.miembros?.activos ?? '—'}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                            <Typography variant="body2" color="text.secondary">Regulares</Typography>
                                            <Typography variant="body2" fontWeight={700}>{data.miembros?.regulares ?? '—'}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                            <Typography variant="body2" color="text.secondary">Líderes</Typography>
                                            <Typography variant="body2" fontWeight={700}>{data.miembros?.lideres ?? '—'}</Typography>
                                        </Box>
                                        <Divider sx={{ my: 1 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="text.secondary">Casas de Paz Activas</Typography>
                                            <Typography variant="body2" fontWeight={700} color="primary">{data.casasPazActivas ?? '—'}</Typography>
                                        </Box>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Box sx={{ mb: 1 }}>
                            <Typography variant="overline" color="text.disabled" fontWeight={700} letterSpacing={1}>
                                📅 Próximos Eventos
                            </Typography>
                        </Box>
                        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                            <CardContent sx={{ p: 2.5 }}>
                                {loading ? [1, 2, 3].map(i => <Skeleton key={i} variant="text" height={50} />) : (
                                    data.proximosEventos.length === 0
                                        ? <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>No hay eventos próximos registrados</Alert>
                                        : <List disablePadding>
                                            {data.proximosEventos.map((ev, i) => (
                                                <Box key={ev.id}>
                                                    <EventoRow evento={ev} />
                                                    {i < data.proximosEventos.length - 1 && <Divider />}
                                                </Box>
                                            ))}
                                        </List>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </MainLayout>
    );
};

export default DashboardPage;
