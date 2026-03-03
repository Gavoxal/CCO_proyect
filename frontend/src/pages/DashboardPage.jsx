import { useState, useEffect } from 'react';
import { Box, Grid, Typography, Card, CardContent, alpha, useTheme, Chip } from '@mui/material';
import {
    Inventory2 as InventoryIcon,
    Warning as WarningIcon,
    Category as CategoryIcon,
    AttachMoney as MoneyIcon,
    TrendingDown as TrendingDownIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import MainLayout from '../components/layout/MainLayout';
import StatsCard from '../components/common/StatsCard';
import StatusChip from '../components/common/StatusChip';
import LoadingOverlay from '../components/common/LoadingOverlay';
import { dashboardService } from '../services/dashboardService';

const CHART_COLORS = ['#00bcd4', '#7c4dff', '#ffab40', '#ff5252', '#00e676', '#40c4ff'];

const DashboardPage = () => {
    const theme = useTheme();
    const [stats, setStats] = useState(null);
    const [categoryData, setCategoryData] = useState([]);
    const [stockByType, setStockByType] = useState([]);
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [statsRes, catRes, typeRes, movRes] = await Promise.all([
                    dashboardService.getStats(),
                    dashboardService.getCategoryDistribution(),
                    dashboardService.getStockByType(),
                    dashboardService.getRecentMovements(),
                ]);
                if (statsRes.success) setStats(statsRes.data);
                if (catRes.success) setCategoryData(catRes.data);
                if (typeRes.success) setStockByType(typeRes.data);
                if (movRes.success) setMovements(movRes.data);
            } catch (err) {
                console.error('Error loading dashboard:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <MainLayout title="Dashboard">
                <LoadingOverlay message="Cargando dashboard..." />
            </MainLayout>
        );
    }

    return (
        <MainLayout title="Dashboard">
            <Box sx={{ animation: 'fadeIn 0.5s ease', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard
                            title="Total Productos"
                            value={stats?.totalProducts || 0}
                            icon={<InventoryIcon fontSize="large" />}
                            color="primary"
                            subtitle={`${stats?.totalStock || 0} unidades en stock`}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard
                            title="Stock Bajo"
                            value={stats?.lowStockCount || 0}
                            icon={<WarningIcon fontSize="large" />}
                            color="warning"
                            subtitle="Productos por debajo del mínimo"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard
                            title="Categorías"
                            value={stats?.totalCategories || 0}
                            icon={<CategoryIcon fontSize="large" />}
                            color="secondary"
                            subtitle="Categorías principales"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard
                            title="Valor Total"
                            value={`$${stats?.totalValue || '0.00'}`}
                            icon={<MoneyIcon fontSize="large" />}
                            color="success"
                            subtitle="Valor del inventario"
                        />
                    </Grid>
                </Grid>

                {/* Charts Row */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {/* Category Distribution Pie */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                    Distribución por Categoría
                                </Typography>
                                <Box sx={{ height: 280 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {categoryData.map((_, index) => (
                                                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                contentStyle={{
                                                    background: theme.palette.background.paper,
                                                    border: `1px solid ${theme.palette.divider}`,
                                                    borderRadius: 8,
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                                    {categoryData.map((cat, i) => (
                                        <Chip
                                            key={cat.name}
                                            label={`${cat.name} (${cat.value})`}
                                            size="small"
                                            sx={{
                                                bgcolor: alpha(CHART_COLORS[i % CHART_COLORS.length], 0.12),
                                                color: CHART_COLORS[i % CHART_COLORS.length],
                                                fontWeight: 500,
                                                fontSize: '0.7rem',
                                            }}
                                        />
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Stock by Type Bar */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                    Stock por Tipo
                                </Typography>
                                <Box sx={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stockByType} barGap={8}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.1)} />
                                            <XAxis dataKey="name" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                                            <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                                            <RechartsTooltip
                                                contentStyle={{
                                                    background: theme.palette.background.paper,
                                                    border: `1px solid ${theme.palette.divider}`,
                                                    borderRadius: 8,
                                                }}
                                            />
                                            <Bar dataKey="count" name="Productos" fill="#00bcd4" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="stock" name="Stock" fill="#7c4dff" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Low Stock Alerts & Recent Movements */}
                <Grid container spacing={3}>
                    {/* Low Stock */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <WarningIcon sx={{ color: 'warning.main' }} />
                                    Alertas de Stock Bajo
                                </Typography>
                                {stats?.lowStockItems?.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                                        ¡Todo el inventario está en niveles óptimos! 🎉
                                    </Typography>
                                ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        {stats?.lowStockItems?.map((item) => (
                                            <Box
                                                key={item.id}
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    bgcolor: alpha(theme.palette.warning.main, 0.06),
                                                    border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
                                                }}
                                            >
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {item.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Mín: {item.min_stock} | Actual: {item._stock}
                                                    </Typography>
                                                </Box>
                                                <StatusChip status={item._stock === 0 ? 'out' : 'critical'} />
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Recent Movements */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                    Últimos Movimientos
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {movements.map((mov) => (
                                        <Box
                                            key={mov.id}
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                p: 1.5,
                                                borderRadius: 2,
                                                bgcolor: alpha(theme.palette.primary.main, 0.03),
                                                border: `1px solid ${theme.palette.divider}`,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                                                },
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box
                                                    sx={{
                                                        width: 34,
                                                        height: 34,
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        bgcolor: mov.movement_type === 'Entrada' || mov.movement_type === 'Devolución'
                                                            ? alpha('#00e676', 0.12)
                                                            : alpha('#ff5252', 0.12),
                                                    }}
                                                >
                                                    {mov.movement_type === 'Entrada' || mov.movement_type === 'Devolución' ? (
                                                        <TrendingUpIcon sx={{ fontSize: 18, color: '#00e676' }} />
                                                    ) : (
                                                        <TrendingDownIcon sx={{ fontSize: 18, color: '#ff5252' }} />
                                                    )}
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {mov.product_name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {mov.movement_type} • {mov.quantity} ud • {mov.user_name}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(mov.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </MainLayout>
    );
};

export default DashboardPage;
