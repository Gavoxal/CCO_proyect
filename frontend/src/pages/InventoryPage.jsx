import { useState, useEffect, useCallback } from 'react';
import {
    Box, Button, Grid, MenuItem, TextField, Typography,
    Dialog, DialogTitle, DialogContent, IconButton, Chip,
    alpha, useTheme, Fade, Tabs, Tab,
} from '@mui/material';
import {
    Add as AddIcon,
    QrCodeScanner as ScannerIcon,
    FilterList as FilterIcon,
    Close as CloseIcon,
    Inventory2 as InventoryIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import MainLayout from '../components/layout/MainLayout';
import DataTable from '../components/common/DataTable';
import FormDialog from '../components/common/FormDialog';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatusChip, { getStockStatus } from '../components/common/StatusChip';
import BarcodeScanner from '../components/barcode/BarcodeScanner';
import BarcodeGenerator from '../components/barcode/BarcodeGenerator';
import { inventoryService } from '../services/inventoryService';

const productTypes = [
    { value: 'fungible', label: 'Fungible' },
    { value: 'non_fungible', label: 'No Fungible' },
    { value: 'office_supply', label: 'Suministro de Oficina' },
];

const InventoryPage = () => {
    const theme = useTheme();
    const { enqueueSnackbar } = useSnackbar();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ type: '', category_id: '', lowStock: false });
    const [showFilters, setShowFilters] = useState(false);

    // Dialogs
    const [formOpen, setFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null });
    const [scannerOpen, setScannerOpen] = useState(false);
    const [detailProduct, setDetailProduct] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await inventoryService.getAll(filters);
            if (res.success) setProducts(res.data);
        } catch (err) {
            enqueueSnackbar('Error al cargar productos', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [filters, enqueueSnackbar]);

    const loadMeta = async () => {
        const [catRes, brandRes, unitRes] = await Promise.all([
            inventoryService.getCategories(),
            inventoryService.getBrands(),
            inventoryService.getUnits(),
        ]);
        if (catRes.success) setCategories(catRes.data);
        if (brandRes.success) setBrands(brandRes.data);
        if (unitRes.success) setUnits(unitRes.data);
    };

    useEffect(() => { loadMeta(); }, []);
    useEffect(() => { loadProducts(); }, [loadProducts]);

    // CRUD handlers
    const handleCreate = () => {
        setEditingProduct(null);
        setFormOpen(true);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormOpen(true);
    };

    const handleSubmit = async (values) => {
        try {
            const data = {
                ...values,
                category_id: Number(values.category_id),
                brand_id: values.brand_id ? Number(values.brand_id) : null,
                unit_id: Number(values.unit_id),
                min_stock: Number(values.min_stock) || 0,
                unit_cost: Number(values.unit_cost) || 0,
                _stock: Number(values._stock) || 0,
                has_serial: values.type === 'non_fungible',
            };

            let res;
            if (editingProduct) {
                res = await inventoryService.update(editingProduct.id, data);
            } else {
                res = await inventoryService.create(data);
            }

            if (res.success) {
                enqueueSnackbar(res.message, { variant: 'success' });
                setFormOpen(false);
                loadProducts();
            } else {
                enqueueSnackbar(res.message, { variant: 'error' });
            }
        } catch {
            enqueueSnackbar('Error al guardar producto', { variant: 'error' });
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            const res = await inventoryService.delete(deleteDialog.product.id);
            if (res.success) {
                enqueueSnackbar(res.message, { variant: 'success' });
                loadProducts();
            }
        } catch {
            enqueueSnackbar('Error al eliminar producto', { variant: 'error' });
        }
        setDeleteDialog({ open: false, product: null });
    };

    const handleScan = async (barcode) => {
        setScannerOpen(false);
        const res = await inventoryService.getByBarcode(barcode);
        if (res.success) {
            setDetailProduct(res.data);
            enqueueSnackbar(`Producto encontrado: ${res.data.name}`, { variant: 'success' });
        } else {
            enqueueSnackbar(`Código "${barcode}" no registrado. ¿Deseas crear un nuevo producto?`, { variant: 'info' });
            setEditingProduct(null);
            setFormOpen(true);
        }
    };

    const handleGenerateBarcode = () => {
        return inventoryService.generateBarcode();
    };

    // Table columns
    const columns = [
        { field: 'sku', headerName: 'SKU', sortable: true },
        {
            field: 'name', headerName: 'Nombre', sortable: true, renderCell: (row) => (
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.barcode || 'Sin código'}</Typography>
                </Box>
            )
        },
        { field: '_categoryName', headerName: 'Categoría', sortable: true },
        {
            field: 'type', headerName: 'Tipo', sortable: true, renderCell: (row) => (
                <StatusChip status={row.type} />
            )
        },
        {
            field: '_stock', headerName: 'Stock', sortable: true, renderCell: (row) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{row._stock}</Typography>
                    <StatusChip status={getStockStatus(row._stock, row.min_stock)} />
                </Box>
            )
        },
        {
            field: 'unit_cost', headerName: 'Costo', sortable: true, renderCell: (row) => (
                <Typography variant="body2">${(row.unit_cost || 0).toFixed(2)}</Typography>
            )
        },
    ];

    // Form fields
    const formFields = [
        { name: 'name', label: 'Nombre del producto', required: true, fullWidth: true },
        { name: 'description', label: 'Descripción', multiline: true, rows: 2, fullWidth: true },
        {
            name: 'category_id', label: 'Categoría', type: 'select', required: true,
            options: categories.map(c => ({ value: c.id, label: `${c.parent_id ? '  └ ' : ''}${c.name}` })),
        },
        {
            name: 'type', label: 'Tipo', type: 'select', required: true,
            options: productTypes,
        },
        {
            name: 'brand_id', label: 'Marca', type: 'select',
            options: [{ value: '', label: 'Sin marca' }, ...brands.map(b => ({ value: b.id, label: b.name }))],
        },
        {
            name: 'unit_id', label: 'Unidad de medida', type: 'select', required: true,
            options: units.map(u => ({ value: u.id, label: `${u.name} (${u.abbreviation})` })),
        },
        {
            name: 'barcode', label: 'Código de barras', type: 'custom', render: ({ values, handleChange }) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        size="small"
                        label="Código de barras"
                        value={values.barcode || ''}
                        onChange={(e) => handleChange('barcode', e.target.value)}
                        fullWidth
                    />
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleChange('barcode', handleGenerateBarcode())}
                        sx={{ whiteSpace: 'nowrap', minWidth: 'auto', px: 2 }}
                    >
                        Generar
                    </Button>
                </Box>
            )
        },
        { name: '_stock', label: 'Stock inicial', type: 'number' },
        { name: 'min_stock', label: 'Stock mínimo', type: 'number' },
        { name: 'unit_cost', label: 'Costo unitario ($)', type: 'number' },
    ];

    return (
        <MainLayout title="Inventario">
            <Box sx={{ animation: 'fadeIn 0.5s ease', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
                {/* Header Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Gestión de Productos
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {products.length} productos registrados
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                            variant="outlined"
                            startIcon={<ScannerIcon />}
                            onClick={() => setScannerOpen(true)}
                            sx={{ borderRadius: '10px' }}
                        >
                            Escanear
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<FilterIcon />}
                            onClick={() => setShowFilters(!showFilters)}
                            sx={{ borderRadius: '10px' }}
                        >
                            Filtros
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleCreate}
                            sx={{ borderRadius: '10px' }}
                        >
                            Nuevo Producto
                        </Button>
                    </Box>
                </Box>

                {/* Filters */}
                <Fade in={showFilters}>
                    <Box sx={{ display: showFilters ? 'flex' : 'none', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <TextField
                            select
                            size="small"
                            label="Tipo"
                            value={filters.type}
                            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                            sx={{ minWidth: 160 }}
                        >
                            <MenuItem value="">Todos</MenuItem>
                            {productTypes.map(t => (
                                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            size="small"
                            label="Categoría"
                            value={filters.category_id}
                            onChange={(e) => setFilters(prev => ({ ...prev, category_id: e.target.value ? Number(e.target.value) : '' }))}
                            sx={{ minWidth: 180 }}
                        >
                            <MenuItem value="">Todas</MenuItem>
                            {categories.map(c => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            ))}
                        </TextField>
                        <Chip
                            label="Stock bajo"
                            variant={filters.lowStock ? 'filled' : 'outlined'}
                            color={filters.lowStock ? 'warning' : 'default'}
                            onClick={() => setFilters(prev => ({ ...prev, lowStock: !prev.lowStock }))}
                            sx={{ alignSelf: 'center', cursor: 'pointer' }}
                        />
                        <Button
                            size="small"
                            onClick={() => setFilters({ type: '', category_id: '', lowStock: false })}
                            sx={{ alignSelf: 'center' }}
                        >
                            Limpiar
                        </Button>
                    </Box>
                </Fade>

                {/* Product Table */}
                <DataTable
                    columns={columns}
                    rows={products}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={(product) => setDeleteDialog({ open: true, product })}
                    onView={(product) => setDetailProduct(product)}
                    searchPlaceholder="Buscar por nombre, SKU o código de barras..."
                />

                {/* Create/Edit Form */}
                <FormDialog
                    open={formOpen}
                    onClose={() => setFormOpen(false)}
                    onSubmit={handleSubmit}
                    title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                    fields={formFields}
                    initialValues={editingProduct || {}}
                    submitLabel={editingProduct ? 'Actualizar' : 'Crear Producto'}
                    maxWidth="md"
                />

                {/* Delete Confirm */}
                <ConfirmDialog
                    open={deleteDialog.open}
                    onClose={() => setDeleteDialog({ open: false, product: null })}
                    onConfirm={handleDeleteConfirm}
                    title="¿Eliminar producto?"
                    message={`¿Estás seguro de eliminar "${deleteDialog.product?.name}"? Esta acción no se puede deshacer.`}
                />

                {/* Barcode Scanner */}
                <BarcodeScanner
                    open={scannerOpen}
                    onClose={() => setScannerOpen(false)}
                    onScan={handleScan}
                />

                {/* Product Detail */}
                <Dialog
                    open={!!detailProduct}
                    onClose={() => setDetailProduct(null)}
                    maxWidth="sm"
                    fullWidth
                >
                    {detailProduct && (
                        <>
                            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <InventoryIcon sx={{ color: theme.palette.primary.main }} />
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        Detalle del Producto
                                    </Typography>
                                </Box>
                                <IconButton onClick={() => setDetailProduct(null)} size="small">
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </DialogTitle>
                            <DialogContent dividers>
                                <Tabs
                                    value={activeTab}
                                    onChange={(_, v) => setActiveTab(v)}
                                    sx={{ mb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
                                >
                                    <Tab label="Información" />
                                    <Tab label="Código de Barras" />
                                </Tabs>

                                {activeTab === 0 && (
                                    <Grid container spacing={2}>
                                        {[
                                            { label: 'SKU', value: detailProduct.sku },
                                            { label: 'Nombre', value: detailProduct.name },
                                            { label: 'Categoría', value: detailProduct._categoryName },
                                            { label: 'Marca', value: detailProduct._brandName },
                                            { label: 'Tipo', value: detailProduct.type, chip: true },
                                            { label: 'Unidad', value: detailProduct._unitName },
                                            { label: 'Stock', value: detailProduct._stock, stock: true },
                                            { label: 'Stock Mínimo', value: detailProduct.min_stock },
                                            { label: 'Costo Unitario', value: `$${(detailProduct.unit_cost || 0).toFixed(2)}` },
                                            { label: 'Código de Barras', value: detailProduct.barcode || 'No asignado' },
                                        ].map((item) => (
                                            <Grid size={{ xs: 6 }} key={item.label}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    {item.label}
                                                </Typography>
                                                {item.chip ? (
                                                    <StatusChip status={item.value} />
                                                ) : item.stock ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{item.value}</Typography>
                                                        <StatusChip status={getStockStatus(detailProduct._stock, detailProduct.min_stock)} />
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{item.value}</Typography>
                                                )}
                                            </Grid>
                                        ))}
                                        {detailProduct.description && (
                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    Descripción
                                                </Typography>
                                                <Typography variant="body2">{detailProduct.description}</Typography>
                                            </Grid>
                                        )}
                                    </Grid>
                                )}

                                {activeTab === 1 && (
                                    <Box sx={{ py: 2 }}>
                                        {detailProduct.barcode ? (
                                            <BarcodeGenerator
                                                value={detailProduct.barcode}
                                                productName={detailProduct.name}
                                            />
                                        ) : (
                                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    Este producto no tiene código de barras asignado
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    onClick={async () => {
                                                        const newBarcode = handleGenerateBarcode();
                                                        await inventoryService.update(detailProduct.id, {
                                                            ...detailProduct,
                                                            barcode: newBarcode,
                                                        });
                                                        setDetailProduct({ ...detailProduct, barcode: newBarcode });
                                                        loadProducts();
                                                        enqueueSnackbar('Código de barras generado exitosamente', { variant: 'success' });
                                                    }}
                                                >
                                                    Generar Código de Barras
                                                </Button>
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </DialogContent>
                        </>
                    )}
                </Dialog>
            </Box>
        </MainLayout>
    );
};

export default InventoryPage;
