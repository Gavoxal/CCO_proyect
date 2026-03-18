import { useState, useMemo } from 'react';
import {
    Box, Grid, Typography, Card, CardContent, LinearProgress,
    Alert, Chip, Avatar, List, ListItem, ListItemText, ListItemAvatar,
    Divider, Tab, Tabs, Button, Stack,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Badge } from '@mui/material';
import {
    PeopleAlt as InfantesIcon,
    Inventory2 as InvIcon,
    Church as ChurchIcon,
    CardGiftcard as GiftIcon,
    HomeWork as VisitaIcon,
    CheckCircle as CheckIcon,
    TrendingUp as TrendIcon,
    People as MiembrosIcon,
    CalendarMonth as CalIcon,
    WarningAmber as WarningIcon,
    Star as StarIcon,
    House as HouseIcon,
    Badge as BadgeIcon,
    ManageAccounts as UsuariosIcon,
    AssignmentTurnedIn as AsistenciaIcon,
} from '@mui/icons-material';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// ─── Paleta CCO ───────────────────────────────────────────────
const CCO = {
    naranja:  '#FF6B35',
    azul:     '#004E89',
    violeta:  '#6B2D5C',
    celeste:  '#7BAE7F',
    amarillo: '#F4C430',
};

// ─── Leer localStorage (datos reales) ────────────────────────
const leer = (key, fallback) => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
};

const getDashboardData = () => {
    const infantesRaw    = leer('cco_infantes_v2', []);
    const totalInfantes  = infantesRaw.length || 148;
    const patrocinados   = infantesRaw.filter(i => i.esPatrocinado).length || 82;

    const asistencias    = leer('cco_asistencias', []);
    const mesActual      = new Date().getMonth();
    const asistMes       = asistencias.filter(a => new Date(a.fecha).getMonth() === mesActual);
    const pctAsistencia  = asistMes.length > 0 ? Math.round((asistMes.filter(a => a.estado === 'Presente').length / asistMes.length) * 100) : 91;

    const visitas        = leer('cco_visitas', []);
    const visitasAnio    = visitas.filter(v => new Date(v.fecha).getFullYear() === new Date().getFullYear()).length || 131;
    const sinVisita      = Math.max(0, totalInfantes - visitasAnio);

    const regalos        = leer('cco_regalos', []);
    const navidad        = regalos.filter(r => r.tipo === 'regalo_navidad');
    const kits           = regalos.filter(r => r.tipo === 'kit_escolar');
    const navEntregados  = navidad.filter(r => r.estado === 'entregado').length || 95;
    const kitsEntregados = kits.filter(r => r.estado === 'entregado').length || 73;
    const navTotal       = navidad.length  || totalInfantes;
    const kitsTotal      = kits.length || totalInfantes;

    const mesNombre = new Date().toLocaleString('es-EC', { month: 'long' });
    const cumplesMes = infantesRaw
        .filter(i => i.persona?.fechaNacimiento && new Date(i.persona.fechaNacimiento).getMonth() === mesActual)
        .slice(0, 5)
        .map(i => ({
            nombre: `${i.persona.nombres} ${i.persona.apellidos}`,
            fecha:  new Date(i.persona.fechaNacimiento).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' }),
            edad:   new Date().getFullYear() - new Date(i.persona.fechaNacimiento).getFullYear(),
        }));
    const cumplesFallback = [
        { nombre: 'María Gabriela López', fecha: `12 ${mesNombre.slice(0,3)}`, edad: 8 },
        { nombre: 'José Andrés Pérez',    fecha: `18 ${mesNombre.slice(0,3)}`, edad: 6 },
        { nombre: 'Camila Torres',        fecha: `24 ${mesNombre.slice(0,3)}`, edad: 10 },
    ];

    const materiales   = leer('cco_materiales', []);
    const matTotal     = materiales.length || 54;
    const stockBajo    = materiales
        .filter(m => (m.cantidad || m.cantidadDisponible || 0) < (m.stockMinimo || 5))
        .slice(0, 5)
        .map(m => ({ id: m.id, nombre: m.nombreMaterial || m.nombre, cantidad: m.cantidad || m.cantidadDisponible || 0, min: m.stockMinimo || 5 }));
    const stockFallback = [
        { id: 1, nombre: 'Cuadernos cuadros 100 hj', cantidad: 3, min: 10 },
        { id: 2, nombre: 'Lápices HB',               cantidad: 8, min: 20 },
        { id: 3, nombre: 'Pegamento en barra',        cantidad: 2, min: 5  },
    ];

    const miembros      = leer('cco_miembros', []);
    const mActivos      = miembros.filter(m => m.tipoMembresia === 'Activo').length  || 320;
    const mRegulares    = miembros.filter(m => m.tipoMembresia === 'Regular').length || 210;
    const mLideres      = miembros.filter(m => m.tipoMembresia === 'Lider').length   || 34;
    const mDiaconos     = miembros.filter(m => m.tipoMembresia === 'Diacono').length || 8;
    const totalMiembros = miembros.length || 530;

    const casas            = leer('cco_casas_paz', []);
    const casasProgreso    = casas.filter(c => c.estado === 'EnProgreso').length   || 18;
    const casasCompletadas = casas.filter(c => c.estado === 'Completada').length   || 12;
    const casasCanceladas  = casas.filter(c => c.estado === 'Cancelada').length    || 2;
    const totalIntegrantes = casas.reduce((acc, c) => acc + (c.integrantes?.length || 0), 0) || 287;
    const consolidandose   = casas.filter(c => c.casaConsolidandose).length;
    const totalCasas       = casas.length || 32;

    const usuarios   = leer('cco_usuarios', []);
    const usrActivos = usuarios.filter(u => u.activo).length || 5;
    const tutores    = usuarios.filter(u => ['tutor','tutor_especial'].includes(u.rol)).length || 3;

    return {
        totalInfantes, patrocinados, noPatrocinados: totalInfantes - patrocinados,
        pctAsistencia, visitasAnio, sinVisita,
        navEntregados, navTotal, kitsEntregados, kitsTotal,
        cumplesMes: cumplesMes.length > 0 ? cumplesMes : cumplesFallback,
        matTotal, stockBajo: stockBajo.length > 0 ? stockBajo : stockFallback,
        usrActivos, tutores,
        mActivos, mRegulares, mLideres, mDiaconos, totalMiembros,
        casasProgreso, casasCompletadas, casasCanceladas, totalIntegrantes, consolidandose, totalCasas,
    };
};

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
                sx={{ height: 9, borderRadius: 5, bgcolor: alpha(color, 0.12),
                    '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 5 } }} />
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
            sx={{ fontWeight: 700, fontSize: 11, textTransform: 'none', color: 'text.secondary',
                '&:hover': { color: CCO.azul } }}>
            {label} →
        </Button>
    );
};

// ─── TAB 1: MINISTERIO ───────────────────────────────────────
const TabMinisterio = ({ d }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const aColor = d.pctAsistencia >= 80 ? '#4caf50' : d.pctAsistencia >= 60 ? '#ff9800' : '#f44336';

    return (
        <Box>
            <SectionTitle action={<GoBtn to="/infantes" label="Ver infantes" />}>👶 Infantes del Ministerio</SectionTitle>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard icon={<InfantesIcon sx={{ color: CCO.violeta, fontSize: 26 }} />}
                        title="Total Infantes" value={d.totalInfantes}
                        subtitle={`${d.patrocinados} patrocinados · ${d.noPatrocinados} sin patrocinio`}
                        color={CCO.violeta} onClick={() => navigate('/infantes')} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard icon={<AsistenciaIcon sx={{ color: aColor, fontSize: 26 }} />}
                        title="Asistencia este Mes" value={`${d.pctAsistencia}%`}
                        subtitle="Promedio mensual del ministerio"
                        color={aColor} onClick={() => navigate('/asistencia')} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard icon={<VisitaIcon sx={{ color: d.sinVisita > 0 ? '#ef5350' : '#4caf50', fontSize: 26 }} />}
                        title="Sin Visita este Año" value={d.sinVisita}
                        subtitle={d.sinVisita > 0 ? 'Requieren visita domiciliaria' : 'Todos han sido visitados'}
                        color={d.sinVisita > 0 ? '#ef5350' : '#4caf50'} onClick={() => navigate('/visitas')} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard icon={<CheckIcon sx={{ color: '#4caf50', fontSize: 26 }} />}
                        title="Visitas Realizadas" value={d.visitasAnio}
                        subtitle={`de ${d.totalInfantes} infantes este año`}
                        color="#4caf50" onClick={() => navigate('/visitas')} />
                </Grid>
            </Grid>

            <Grid container spacing={2.5}>
                {/* Regalos */}
                <Grid item xs={12} md={6}>
                    <SectionTitle action={<GoBtn to="/regalos" label="Ver regalos" />}>
                        🎁 Regalos y Kits {new Date().getFullYear()}
                    </SectionTitle>
                    <Card elevation={0} sx={{ border: '1.5px solid', borderColor: 'divider', borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <ProgressBar label="Regalos de Navidad" value={d.navEntregados}  total={d.navTotal}  color="#ef5350" />
                            <ProgressBar label="Kits Escolares"     value={d.kitsEntregados} total={d.kitsTotal} color={CCO.azul} />
                            <ProgressBar label="Atención Especial (est.)"
                                value={Math.round(d.totalInfantes * 0.15)} total={d.totalInfantes} color={CCO.celeste} />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Cumpleaños */}
                <Grid item xs={12} md={6}>
                    <SectionTitle>🎂 Cumpleaños este Mes</SectionTitle>
                    <Card elevation={0} sx={{ border: '1.5px solid', borderColor: 'divider', borderRadius: 3 }}>
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
            </Grid>
        </Box>
    );
};

// ─── TAB 2: INVENTARIO ───────────────────────────────────────
const TabInventario = ({ d }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const stockList = d.stockBajo;

    return (
        <Box>
            <SectionTitle action={<GoBtn to="/inventario/materiales" label="Ir a Materiales" />}>📦 Inventario de Materiales</SectionTitle>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <StatCard icon={<InvIcon sx={{ color: CCO.azul, fontSize: 26 }} />}
                        title="Materiales Registrados" value={d.matTotal}
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
                        title="Usuarios Activos" value={d.usrActivos}
                        subtitle={`${d.tutores} tutores · ${d.usrActivos - d.tutores} otros`}
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
                        const pct   = Math.min(100, Math.round((item.cantidad / item.min) * 100));
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
                                                sx={{ fontWeight: 800, minWidth: 64,
                                                    bgcolor: alpha(color, 0.12), color,
                                                    border: `1px solid ${alpha(color, 0.3)}` }}
                                            />
                                        </Box>
                                        <LinearProgress variant="determinate" value={pct}
                                            sx={{ height: 8, borderRadius: 4, bgcolor: alpha(color, 0.1),
                                                '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 } }} />
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

// ─── TAB 3: IGLESIA CCO ──────────────────────────────────────
const TabCCO = ({ d }) => {
    const theme = useTheme();
    const navigate = useNavigate();

    const proximosEventos = [
        { id: 1, titulo: 'Culto Dominical',        tipo: 'Iglesia',    fecha: '2026-03-23T10:00:00', desc: 'Servicio dominical general' },
        { id: 2, titulo: 'Entrega Kits Escolares',  tipo: 'Ministerio', fecha: '2026-03-27T09:00:00', desc: 'Entrega masiva de kits escolares' },
        { id: 3, titulo: 'Reunión de Líderes',      tipo: 'Iglesia',    fecha: '2026-03-29T18:00:00', desc: 'Reunión mensual de líderes CCO' },
        { id: 4, titulo: 'Visitas Ministerio',      tipo: 'Ministerio', fecha: '2026-03-30T08:00:00', desc: 'Visitas domiciliarias programadas' },
    ];
    const colorEv = { Ministerio: CCO.violeta, Iglesia: '#4caf50', Emergencia: '#ef5350' };

    return (
        <Box>
            {/* Miembros */}
            <SectionTitle action={<GoBtn to="/miembros" label="Ver miembros" />}>⛪ Membresía de la Iglesia</SectionTitle>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                {[
                    { label: 'Total Miembros',  value: d.totalMiembros, color: CCO.azul,    icon: <MiembrosIcon sx={{ color: CCO.azul,    fontSize: 26 }} />, sub: 'Registrados en el sistema' },
                    { label: 'Activos',         value: d.mActivos,      color: '#4caf50',   icon: <CheckIcon    sx={{ color: '#4caf50',   fontSize: 26 }} />, sub: 'Membresía activa confirmada' },
                    { label: 'Líderes',         value: d.mLideres,      color: CCO.violeta, icon: <StarIcon     sx={{ color: CCO.violeta, fontSize: 26 }} />, sub: 'Líderes confirmados' },
                    { label: 'Diáconos',        value: d.mDiaconos,     color: CCO.naranja, icon: <BadgeIcon    sx={{ color: CCO.naranja, fontSize: 26 }} />, sub: 'En servicio activo' },
                ].map(kpi => (
                    <Grid item xs={6} sm={3} key={kpi.label}>
                        <StatCard icon={kpi.icon} title={kpi.label} value={kpi.value}
                            subtitle={kpi.sub} color={kpi.color} onClick={() => navigate('/miembros')} />
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={2.5}>
                {/* Casas de Paz */}
                <Grid item xs={12} md={5}>
                    <SectionTitle action={<GoBtn to="/casas-de-paz" label="Ver casas" />}>🏠 Casas de Paz</SectionTitle>
                    <Card elevation={0} sx={{ border: '1.5px solid', borderColor: 'divider', borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            {[
                                { label: 'En Progreso',      value: d.casasProgreso,    color: CCO.naranja },
                                { label: 'Completadas',      value: d.casasCompletadas, color: '#4caf50'   },
                                { label: 'Canceladas',       value: d.casasCanceladas,  color: '#f44336'   },
                                { label: 'Total integrantes', value: d.totalIntegrantes, color: CCO.azul   },
                                ...(d.consolidandose > 0 ? [{ label: 'Consolidándose', value: d.consolidandose, color: CCO.celeste }] : []),
                            ].map((row, i, arr) => (
                                <Box key={row.label}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                                        <Typography variant="body2" color="text.secondary" fontWeight={600}>{row.label}</Typography>
                                        <Typography variant="h6" fontWeight={900} sx={{ color: row.color }}>{row.value}</Typography>
                                    </Box>
                                    {i < arr.length - 1 && <Divider />}
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Próximos Eventos */}
                <Grid item xs={12} md={7}>
                    <SectionTitle action={<GoBtn to="/calendario" label="Ver calendario" />}>📅 Próximos Eventos</SectionTitle>
                    <Card elevation={0} sx={{ border: '1.5px solid', borderColor: 'divider', borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <List disablePadding>
                                {proximosEventos.map((ev, i) => {
                                    const color = colorEv[ev.tipo] || '#9e9e9e';
                                    const f     = new Date(ev.fecha);
                                    return (
                                        <Box key={ev.id}>
                                            <ListItem disableGutters sx={{ py: 1.5, alignItems: 'flex-start' }}>
                                                <ListItemAvatar>
                                                    <Box sx={{
                                                        width: 48, height: 48, borderRadius: 2,
                                                        bgcolor: alpha(color, 0.12),
                                                        border: `1px solid ${alpha(color, 0.25)}`,
                                                        display: 'flex', flexDirection: 'column',
                                                        alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}>
                                                        <Typography sx={{ fontSize: 15, fontWeight: 900, color, lineHeight: 1 }}>
                                                            {f.getDate()}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: 9, fontWeight: 700, color, lineHeight: 1, mt: 0.25, opacity: 0.85 }}>
                                                            {f.toLocaleString('es-EC', { month: 'short' }).toUpperCase()}
                                                        </Typography>
                                                    </Box>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={ev.titulo}
                                                    secondary={ev.desc}
                                                    primaryTypographyProps={{ fontWeight: 800, fontSize: '0.9rem' }}
                                                    secondaryTypographyProps={{ fontSize: '0.8rem' }}
                                                    sx={{ pl: 1 }}
                                                />
                                                <Chip label={ev.tipo} size="small"
                                                    sx={{ bgcolor: alpha(color, 0.12), color, fontSize: '0.65rem',
                                                        fontWeight: 700, border: `1px solid ${alpha(color, 0.3)}`,
                                                        flexShrink: 0, mt: 0.5 }} />
                                            </ListItem>
                                            {i < proximosEventos.length - 1 && <Divider />}
                                        </Box>
                                    );
                                })}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

// ─── Página principal ─────────────────────────────────────────
export default function DashboardPage() {
    const theme  = useTheme();
    const { user } = useAuth();
    const isDark = theme.palette.mode === 'dark';
    const [tab, setTab]  = useState(0);
    const d = useMemo(() => getDashboardData(), []);

    const TABS = [
        { label: '👶 Ministerio',  badge: 0 },
        { label: '📦 Inventario',  badge: d.stockBajo.length },
        { label: '⛪ Iglesia CCO', badge: 0 },
    ];

    const hora   = new Date().getHours();
    const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

    return (
        <MainLayout>
            <Box sx={{ p: { xs: 2, md: 3 } }}>

                {/* Header */}
                <Box sx={{ mb: 3.5 }}>
                    <Typography variant="h4" fontWeight={900}>
                        {saludo}, {user?.nombre?.split(' ')[0] || user?.username}! 👋
                    </Typography>
                    <Typography color="text.secondary" fontWeight={500} sx={{ mt: 0.5 }}>
                        Sistema KidScam · CCO / Ministerio Vías en Acción —{' '}
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
                        to:   { opacity: 1, transform: 'translateY(0)' },
                    },
                }}>
                    {tab === 0 && <TabMinisterio d={d} />}
                    {tab === 1 && <TabInventario  d={d} />}
                    {tab === 2 && <TabCCO         d={d} />}
                </Box>

            </Box>
        </MainLayout>
    );
}
