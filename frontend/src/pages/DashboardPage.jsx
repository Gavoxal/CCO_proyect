import { useState } from 'react';
import {
    Box, Grid, Typography, Card, CardContent, LinearProgress,
    Alert, Chip, Avatar, List, ListItem, ListItemText, ListItemAvatar,
    Divider, Tab, Tabs, alpha, useTheme, Badge,
} from '@mui/material';
import {
    PeopleAlt as InfantesIcon,
    Warning as WarningIcon,
    Inventory2 as InvIcon,
    Church as ChurchIcon,
    CardGiftcard as GiftIcon,
    HomeWork as VisitaIcon,
    CheckCircle as CheckIcon,
    AccessTime as PendingIcon,
    LocalDining as AlimentosIcon,
    AssignmentTurnedIn as SolicitudIcon,
    EventNote as EventIcon,
    GroupWork as CasasIcon,
    People as MiembrosIcon,
    CalendarMonth as CalIcon,
    TrendingUp as TrendIcon,
} from '@mui/icons-material';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';

// ─── Paleta CCO ───────────────────────────────────────────────────────────────
const CCO = { amarillo: '#FFD700', naranja: '#FF8C00', violeta: '#6A5ACD', azul: '#4169E1' };

// ─── Datos mock del dashboard ─────────────────────────────────────────────────
const MOCK = {
    // Ministerio
    totalInfantes: 148,
    patrocinados: 82,
    noPatrocinados: 66,
    asistenciaMes: 91,     // %
    sinVisita: 17,
    visitasEsteAnio: 131,
    regalosNavidad: { entregados: 95, total: 148 },
    kitsEscolares: { entregados: 73, total: 148 },
    cumpleaniosEstesMes: [
        { nombre: 'María Gabriela López', fecha: '12 mar', edad: 8 },
        { nombre: 'José Andrés Pérez', fecha: '18 mar', edad: 6 },
        { nombre: 'Camila Torres', fecha: '24 mar', edad: 10 },
    ],

    // Inventario
    materialesTotal: 54,
    stockBajo: [
        { id: 1, nombre: 'Cuadernos cuadros 100 hj', cantidad: 3, min: 10 },
        { id: 2, nombre: 'Lápices HB', cantidad: 8, min: 20 },
        { id: 3, nombre: 'Pegamento en barra', cantidad: 2, min: 5 },
    ],
    desactualizados: [
        { id: 4, nombre: 'Tijeras punta roma', dias: 45 },
        { id: 5, nombre: 'Marcadores de pizarra', dias: 38 },
    ],
    solicitudesPendientes: 4,
    alimentosTotal: 28,
    stockBajoAlimentos: [
        { id: 6, nombre: 'Arroz 25 kg', cantidad: 1, min: 3 },
        { id: 7, nombre: 'Aceite vegetal 5 lt', cantidad: 2, min: 4 },
    ],

    // CCO (Iglesia)
    miembros: { activos: 320, regulares: 210, lideres: 34, nuevos: 12 },
    casasPaz: { activas: 18, enFormacion: 3, miembros: 287 },
    proximosEventos: [
        { id: 1, titulo: 'Culto Dominical', tipo: 'Iglesia', fechaInicio: '2026-03-09T10:00:00', descripcion: 'Servicio dominical general' },
        { id: 2, titulo: 'Entrega Kits Escolares', tipo: 'Ministerio', fechaInicio: '2026-03-15T09:00:00', descripcion: 'Entrega masiva de kits' },
        { id: 3, titulo: 'Reunión de Líderes', tipo: 'Iglesia', fechaInicio: '2026-03-20T18:00:00', descripcion: 'Reunión mensual de líderes' },
        { id: 4, titulo: 'Visitas Ministerio', tipo: 'Ministerio', fechaInicio: '2026-03-22T08:00:00', descripcion: 'Visitas domiciliarias programadas' },
    ],
};

// ─── Utilitarios ──────────────────────────────────────────────────────────────
const StatCard = ({ icon, title, value, subtitle, color, chip }) => {
    const theme = useTheme();
    return (
        <Card elevation={0} sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3, height: '100%',
            transition: 'transform .2s ease, box-shadow .2s ease',
            '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 24px ${alpha(color, 0.15)}` },
        }}>
            <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}
                            textTransform="uppercase" letterSpacing={0.5}>
                            {title}
                        </Typography>
                        <Typography variant="h3" fontWeight={800} lineHeight={1.1} sx={{ mt: 0.5 }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {subtitle}
                            </Typography>
                        )}
                        {chip && <Box sx={{ mt: 1 }}>{chip}</Box>}
                    </Box>
                    <Box sx={{
                        width: 48, height: 48, borderRadius: '14px',
                        bgcolor: alpha(color, 0.12),
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ml: 1,
                    }}>
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

const ProgressRow = ({ label, value, total, color }) => (
    <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">{label}</Typography>
            <Typography variant="body2" fontWeight={700} color={color}>{value}/{total}</Typography>
        </Box>
        <LinearProgress variant="determinate" value={total > 0 ? (value / total) * 100 : 0}
            sx={{ height: 8, borderRadius: 4, bgcolor: alpha(color, 0.15), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 } }} />
    </Box>
);

const SectionTitle = ({ children }) => (
    <Typography variant="overline" fontWeight={700} letterSpacing={1} color="text.disabled" sx={{ display: 'block', mb: 1.5 }}>
        {children}
    </Typography>
);

// ─── TAB 1: MINISTERIO ────────────────────────────────────────────────────────
const TabMinisterio = () => {
    const theme = useTheme();
    return (
        <Box>
            <SectionTitle>👶 Infantes</SectionTitle>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard icon={<InfantesIcon sx={{ color: CCO.violeta }} />} title="Total Infantes"
                        value={MOCK.totalInfantes} subtitle="Registrados en el sistema" color={CCO.violeta}
                        chip={
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Chip label={`${MOCK.patrocinados} patr.`} size="small" sx={{ bgcolor: alpha(CCO.azul, 0.1), color: CCO.azul, fontSize: '0.65rem' }} />
                                <Chip label={`${MOCK.noPatrocinados} no patr.`} size="small" sx={{ bgcolor: alpha(CCO.naranja, 0.1), color: CCO.naranja, fontSize: '0.65rem' }} />
                            </Box>
                        }
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard icon={<TrendIcon sx={{ color: CCO.azul }} />} title="Asistencia este Mes"
                        value={`${MOCK.asistenciaMes}%`} subtitle="Promedio mensual del ministerio" color={CCO.azul} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        icon={<VisitaIcon sx={{ color: MOCK.sinVisita > 0 ? '#ef5350' : '#4caf50' }} />}
                        title="Sin Visita este Año" value={MOCK.sinVisita}
                        subtitle={MOCK.sinVisita > 0 ? '⚠️ Requieren visita' : '✅ Todos visitados'}
                        color={MOCK.sinVisita > 0 ? '#ef5350' : '#4caf50'} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard icon={<CheckIcon sx={{ color: '#4caf50' }} />} title="Visitas Realizadas"
                        value={MOCK.visitasEsteAnio} subtitle={`de ${MOCK.totalInfantes} infantes`} color="#4caf50" />
                </Grid>
            </Grid>

            <SectionTitle>🎁 Regalos y Kits {new Date().getFullYear()}</SectionTitle>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <GiftIcon sx={{ color: CCO.naranja }} />
                                <Typography variant="subtitle1" fontWeight={700}>Entregas</Typography>
                            </Box>
                            <ProgressRow label="🎁 Navidad" value={MOCK.regalosNavidad.entregados} total={MOCK.regalosNavidad.total} color="#ef5350" />
                            <ProgressRow label="🎒 Kit Escolar" value={MOCK.kitsEscolares.entregados} total={MOCK.kitsEscolares.total} color={CCO.azul} />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, height: '100%' }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <CalIcon sx={{ color: CCO.violeta }} />
                                <Typography variant="subtitle1" fontWeight={700}>🎂 Cumpleaños este Mes</Typography>
                            </Box>
                            <List disablePadding dense>
                                {MOCK.cumpleaniosEstesMes.map((c, i) => (
                                    <ListItem key={i} disableGutters sx={{ py: 0.5 }}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ width: 34, height: 34, bgcolor: alpha(CCO.amarillo, 0.2), color: '#b8860b', fontSize: '0.8rem', fontWeight: 700 }}>
                                                {c.edad}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary={c.nombre}
                                            secondary={c.fecha}
                                            primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
                                            secondaryTypographyProps={{ fontSize: '0.75rem' }} />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

// ─── TAB 2: INVENTARIO ────────────────────────────────────────────────────────
const TabInventario = () => {
    const theme = useTheme();
    return (
        <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <StatCard icon={<InvIcon sx={{ color: CCO.azul }} />} title="Materiales Registrados"
                        value={MOCK.materialesTotal} subtitle="Artículos en el sistema" color={CCO.azul} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard icon={<AlimentosIcon sx={{ color: '#4caf50' }} />} title="Alimentos Registrados"
                        value={MOCK.alimentosTotal} subtitle="Productos en bodega" color="#4caf50" />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard
                        icon={<SolicitudIcon sx={{ color: MOCK.solicitudesPendientes > 0 ? CCO.naranja : '#4caf50' }} />}
                        title="Solicitudes Pendientes" value={MOCK.solicitudesPendientes}
                        subtitle={MOCK.solicitudesPendientes > 0 ? 'Requieren aprobación' : 'Sin pendientes'}
                        color={MOCK.solicitudesPendientes > 0 ? CCO.naranja : '#4caf50'} />
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <SectionTitle>📦 Materiales — Stock Bajo o Crítico</SectionTitle>
                    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                        <CardContent sx={{ p: 2.5 }}>
                            {MOCK.stockBajo.length === 0
                                ? <Alert severity="success" variant="outlined" sx={{ borderRadius: 2 }}>Todo en niveles normales</Alert>
                                : MOCK.stockBajo.map(item => (
                                    <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: `1px solid ${theme.palette.divider}`, '&:last-child': { borderBottom: 'none' } }}>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>{item.nombre}</Typography>
                                            <Typography variant="caption" color="text.secondary">Mínimo: {item.min} uds</Typography>
                                        </Box>
                                        <Chip label={`${item.cantidad} uds`} size="small" color="error" variant="outlined" />
                                    </Box>
                                ))}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <SectionTitle>🍚 Alimentos — Stock Bajo</SectionTitle>
                    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, mb: 2 }}>
                        <CardContent sx={{ p: 2.5 }}>
                            {MOCK.stockBajoAlimentos.length === 0
                                ? <Alert severity="success" variant="outlined" sx={{ borderRadius: 2 }}>Todo en niveles normales</Alert>
                                : MOCK.stockBajoAlimentos.map(item => (
                                    <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: `1px solid ${theme.palette.divider}`, '&:last-child': { borderBottom: 'none' } }}>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>{item.nombre}</Typography>
                                            <Typography variant="caption" color="text.secondary">Mínimo: {item.min} uds</Typography>
                                        </Box>
                                        <Chip label={`${item.cantidad} uds`} size="small" color="warning" variant="outlined" />
                                    </Box>
                                ))}
                        </CardContent>
                    </Card>

                    <SectionTitle>🕒 Sin Actualizar (+30 días)</SectionTitle>
                    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                        <CardContent sx={{ p: 2.5 }}>
                            {MOCK.desactualizados.length === 0
                                ? <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>Todo actualizado</Alert>
                                : MOCK.desactualizados.map(item => (
                                    <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: `1px solid ${theme.palette.divider}`, '&:last-child': { borderBottom: 'none' } }}>
                                        <Typography variant="body2" fontWeight={600}>{item.nombre}</Typography>
                                        <Chip label={`${item.dias} días`} size="small" color="warning" variant="outlined" />
                                    </Box>
                                ))}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

// ─── TAB 3: IGLESIA CCO ───────────────────────────────────────────────────────
const TabCCO = () => {
    const theme = useTheme();
    const colorEvento = { Ministerio: CCO.violeta, Iglesia: '#4caf50', Emergencia: '#ef5350' };

    return (
        <Box>
            <SectionTitle>⛪ Membresía</SectionTitle>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                    <StatCard icon={<MiembrosIcon sx={{ color: CCO.azul }} />} title="Miembros Activos"
                        value={MOCK.miembros.activos} subtitle="Registrados en la iglesia" color={CCO.azul} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <StatCard icon={<ChurchIcon sx={{ color: CCO.violeta }} />} title="Regulares"
                        value={MOCK.miembros.regulares} subtitle="Asistencia constante" color={CCO.violeta} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <StatCard icon={<CasasIcon sx={{ color: CCO.naranja }} />} title="Líderes"
                        value={MOCK.miembros.lideres} subtitle="Líderes activos" color={CCO.naranja} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <StatCard icon={<TrendIcon sx={{ color: '#4caf50' }} />} title="Nuevos este Mes"
                        value={MOCK.miembros.nuevos} subtitle="Incorporaciones nuevas" color="#4caf50" />
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <SectionTitle>🏠 Casas de Paz</SectionTitle>
                    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                        <CardContent sx={{ p: 2.5 }}>
                            {[
                                { label: 'Casas Activas', value: MOCK.casasPaz.activas, color: '#4caf50' },
                                { label: 'En Formación', value: MOCK.casasPaz.enFormacion, color: CCO.amarillo },
                                { label: 'Miembros Totales', value: MOCK.casasPaz.miembros, color: CCO.azul },
                            ].map((row, i, arr) => (
                                <Box key={row.label}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2 }}>
                                        <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                                        <Typography variant="body2" fontWeight={700} sx={{ color: row.color }}>{row.value}</Typography>
                                    </Box>
                                    {i < arr.length - 1 && <Divider />}
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <SectionTitle>📅 Próximos Eventos</SectionTitle>
                    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                        <CardContent sx={{ p: 2.5 }}>
                            {MOCK.proximosEventos.length === 0
                                ? <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>No hay eventos próximos</Alert>
                                : (
                                    <List disablePadding>
                                        {MOCK.proximosEventos.map((ev, i) => {
                                            const color = colorEvento[ev.tipo] || '#9e9e9e';
                                            const fecha = new Date(ev.fechaInicio);
                                            return (
                                                <Box key={ev.id}>
                                                    <ListItem disableGutters sx={{ py: 1 }}>
                                                        <ListItemAvatar>
                                                            <Avatar sx={{ bgcolor: alpha(color, 0.15), color, width: 42, height: 42, fontSize: '0.85rem', fontWeight: 800 }}>
                                                                {fecha.getDate()}
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                        <ListItemText
                                                            primary={ev.titulo}
                                                            secondary={`${fecha.toLocaleDateString('es-EC', { day: 'numeric', month: 'long' })} · ${ev.descripcion}`}
                                                            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 700 }}
                                                            secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                                        />
                                                        <Chip label={ev.tipo} size="small"
                                                            sx={{ bgcolor: alpha(color, 0.12), color, fontSize: '0.65rem', flexShrink: 0, ml: 1 }} />
                                                    </ListItem>
                                                    {i < MOCK.proximosEventos.length - 1 && <Divider />}
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

// ─── DashboardPage principal ──────────────────────────────────────────────────
const TABS = [
    { label: '👶 Ministerio', icon: <InfantesIcon />, badge: 0, component: <TabMinisterio /> },
    { label: '📦 Inventario', icon: <InvIcon />, badge: MOCK.solicitudesPendientes + MOCK.stockBajo.length, component: <TabInventario /> },
    { label: '⛪ Iglesia CCO', icon: <ChurchIcon />, badge: 0, component: <TabCCO /> },
];

const DashboardPage = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const isDark = theme.palette.mode === 'dark';
    const [tab, setTab] = useState(0);

    return (
        <MainLayout>
            <Box sx={{ p: { xs: 2, md: 3 } }}>

                {/* ── Header ────────────────────────────────────────────────── */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" fontWeight={800}>
                        ¡Bienvenido, {user?.nombre?.split(' ')[0] || user?.username}! 👋
                    </Typography>
                    <Typography color="text.secondary">
                        Sistema KidScam · CCO / Ministerio Vías en Acción
                    </Typography>
                </Box>

                {/* ── Tabs / Viñetas ────────────────────────────────────────── */}
                <Box sx={{
                    mb: 3,
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    overflow: 'hidden',
                    bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
                }}>
                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        variant="fullWidth"
                        sx={{
                            '& .MuiTabs-indicator': {
                                height: 3,
                                borderRadius: '3px 3px 0 0',
                                background: `linear-gradient(90deg, ${CCO.naranja} 0%, ${CCO.violeta} 100%)`,
                            },
                            '& .MuiTab-root': {
                                fontWeight: 700,
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                py: 1.8,
                                textTransform: 'none',
                                letterSpacing: 0.3,
                                minHeight: 56,
                                transition: 'background .2s ease',
                                '&:hover': { bgcolor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.04) },
                                '&.Mui-selected': { color: CCO.naranja },
                            },
                        }}
                    >
                        {TABS.map((t, i) => (
                            <Tab
                                key={i}
                                label={
                                    t.badge > 0 ? (
                                        <Badge badgeContent={t.badge} color="error" sx={{ '& .MuiBadge-badge': { top: -4, right: -6 } }}>
                                            <span>{t.label}</span>
                                        </Badge>
                                    ) : t.label
                                }
                            />
                        ))}
                    </Tabs>
                </Box>

                {/* ── Contenido de la tab activa ──────────────────────────── */}
                <Box sx={{ animation: 'fadeIn .3s ease', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
                    {TABS[tab].component}
                </Box>

            </Box>
        </MainLayout>
    );
};

export default DashboardPage;
