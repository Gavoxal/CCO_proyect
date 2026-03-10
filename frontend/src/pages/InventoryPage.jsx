import { useState, useEffect, useCallback } from 'react';
import {
    Box, Button, Grid, MenuItem, TextField, Typography,
    Dialog, DialogTitle, DialogContent, IconButton, Chip,
    alpha, useTheme, Fade, Tabs, Tab, Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    QrCodeScanner as ScannerIcon,
    FilterList as FilterIcon,
    Close as CloseIcon,
    Inventory2 as InventoryIcon,
    UploadFile as UploadFileIcon,
    Print as PrintIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import MainLayout from '../components/layout/MainLayout';
import DataTable from '../components/common/DataTable';
import FormDialog from '../components/common/FormDialog';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatusChip, { getStockStatus } from '../components/common/StatusChip';
import BarcodeScanner from '../components/barcode/BarcodeScanner';
import BarcodeGenerator from '../components/barcode/BarcodeGenerator';
import ExcelImportDialog from '../components/common/ExcelImportDialog';
import { inventoryService } from '../services/inventoryService';

const productTypes = [
    { value: 'fungible', label: 'Fungible' },
    { value: 'non_fungible', label: 'No Fungible' },
    { value: 'office_supply', label: 'Suministro de Oficina' },
];

const formatDate = (iso) => {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('es-ES', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return iso; }
};

const InventoryPage = () => {
    const theme = useTheme();
    const { enqueueSnackbar } = useSnackbar();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ type: '', category_id: '', lowStock: false });
    const [showFilters, setShowFilters] = useState(false);

    // For the SKU preview inside the form
    const [formCategoryName, setFormCategoryName] = useState('');
    const [formAreaName, setFormAreaName] = useState('');
    const [skuPreview, setSkuPreview] = useState('');

    // Dialogs
    const [formOpen, setFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null });
    const [scannerOpen, setScannerOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [detailProduct, setDetailProduct] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await inventoryService.getAll(filters);
            if (res.success) setProducts(res.data);
        } catch {
            enqueueSnackbar('Error al cargar productos', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [filters, enqueueSnackbar]);

    const loadMeta = async () => {
        const [catRes, areasRes] = await Promise.all([
            inventoryService.getCategories(),
            inventoryService.getAreas(),
        ]);
        if (catRes.success) setCategories(catRes.data);
        if (areasRes.success) setAreas(areasRes.data);
    };

    useEffect(() => { loadMeta(); }, []);
    useEffect(() => { loadProducts(); }, [loadProducts]);

    // CRUD handlers
    const handleCreate = () => {
        setEditingProduct(null);
        setFormCategoryName('');
        setFormAreaName('');
        setSkuPreview('');
        setFormOpen(true);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormCategoryName(product._categoryName || '');
        setFormAreaName(product.area || '');
        setFormOpen(true);
    };

    const handleSubmit = async (values) => {
        try {
            const data = {
                ...values,
                _categoryName: values._categoryName || formCategoryName,
                _brandName: values._brandName || values.brand || '',
                area: values.area || formAreaName,
                has_serial: values.type === 'non_fungible',
            };

            // Remove legacy fields
            delete data.brand;
            delete data.category_id;
            delete data.brand_id;
            delete data.unit_id;

            let res;
            if (editingProduct) {
                res = await inventoryService.update(editingProduct.id, data);
            } else {
                res = await inventoryService.create(data);
            }

            if (res.success) {
                enqueueSnackbar(res.message, { variant: 'success' });
                setFormOpen(false);
                // Refresh areas list (user may have added a new one)
                const areasRes = await inventoryService.getAreas();
                if (areasRes.success) setAreas(areasRes.data);
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

    const handleGenerateBarcode = () => inventoryService.generateBarcode();

    const handleBulkImport = async (rows) => inventoryService.bulkImport(rows);

    const handleImportClose = async () => {
        setImportOpen(false);
        await loadProducts();
        enqueueSnackbar('Inventario actualizado desde Excel', { variant: 'success' });
    };

    // Print barcode
    const handlePrintBarcode = (product) => {
        setDetailProduct(product);
        setActiveTab(1);
    };

    // Table columns
    const columns = [
        { field: 'sku', headerName: 'Código del Artículo', sortable: true },
        {
            field: 'name', headerName: 'Nombre del Artículo', sortable: true, renderCell: (row) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.name}</Typography>
            )
        },
        { field: '_categoryName', headerName: 'Categoría', sortable: true },
        {
            field: '_locationName', headerName: 'Ubicación', sortable: true, renderCell: (row) => (
                <Typography variant="body2">{row._locationName || '—'}</Typography>
            )
        },
        { field: '_brandName', headerName: 'Marca / Modelo', sortable: true },
        {
            field: 'type', headerName: 'Tipo', sortable: true, renderCell: (row) => (
                <StatusChip status={row.type} />
            )
        },
        {
            field: 'condition', headerName: 'Condición', sortable: true, renderCell: (row) => {
                if (!row.condition) return <Typography variant="body2" color="text.disabled">—</Typography>;
                const colorMap = { Buena: 'success', Regular: 'warning', 'Dañada': 'error' };
                return <StatusChip status={row.condition} colorOverride={colorMap[row.condition]} />;
            }
        },
        {
            field: 'area', headerName: 'Área', sortable: true, renderCell: (row) => (
                <Typography variant="body2">{row.area || '—'}</Typography>
            )
        },
        {
            field: 'responsible', headerName: 'Responsable', sortable: true, renderCell: (row) => (
                <Typography variant="body2">{row.responsible || '—'}</Typography>
            )
        },
    ];

    // Build category options for Autocomplete (names only, freeSolo)
    const categoryOptions = categories.map(c => c.name);

    // Form fields
    const formFields = [
        // SKU — auto-generated, read-only display
        {
            name: 'sku',
            label: 'Código del Artículo (auto-generado)',
            fullWidth: true,
            disabled: true,
            placeholder: 'Se genera automáticamente al elegir Categoría y Área',
            helperText: editingProduct ? undefined : 'Formato: [CAT]-[ÁREA]-[SECUENCIAL]',
        },
        // Name
        { name: 'name', label: 'Nombre del Artículo', required: true, fullWidth: true },
        // Description
        { name: 'description', label: 'Descripción', multiline: true, rows: 2, fullWidth: true },
        // Category — Autocomplete editable
        {
            name: '_categoryName',
            label: 'Categoría',
            type: 'autocomplete',
            required: true,
            options: categoryOptions,
            placeholder: 'Selecciona o escribe una nueva...',
            onChange: (val) => setFormCategoryName(val),
        },
        // Location
        { name: '_locationName', label: 'Ubicación', fullWidth: true },
        // Brand — free text
        { name: '_brandName', label: 'Marca / Modelo', placeholder: 'Ej: HP, Dell, Logitech...' },
        // Type
        {
            name: 'type', label: 'Tipo (Fungible / No Fungible)', type: 'select', required: true,
            options: productTypes,
        },
        // Condition
        {
            name: 'condition', label: 'Condición', type: 'select',
            options: [
                { value: '', label: 'No especificada' },
                { value: 'Buena', label: 'Buena' },
                { value: 'Regular', label: 'Regular' },
                { value: 'Dañada', label: 'Dañada' },
            ],
        },
        // Observation
        { name: 'observation', label: 'Observación', multiline: true, rows: 2, fullWidth: true },
        // Area — Autocomplete editable
        {
            name: 'area',
            label: 'Área',
            type: 'autocomplete',
            options: areas,
            placeholder: 'Selecciona o escribe una nueva área...',
            onChange: (val) => setFormAreaName(val),
        },
        // Responsible
        { name: 'responsible', label: 'Responsable', fullWidth: true },
        // Barcode — Número de Serie
        {
            name: 'barcode', label: 'Número de Serie / Código de Barras', type: 'custom',
            render: ({ values, handleChange }) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        size="small"
                        label="Número de Serie / Código de Barras"
                        value={values.barcode || ''}
                        onChange={(e) => handleChange('barcode', e.target.value)}
                        fullWidth
                        helperText="Este código se puede imprimir como etiqueta"
                    />
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleChange('barcode', handleGenerateBarcode())}
                        sx={{ whiteSpace: 'nowrap', minWidth: 'auto', px: 2, alignSelf: 'flex-start', mt: '2px' }}
                    >
                        Generar
                    </Button>
                </Box>
            )
        },
        // Stock & cost
        { name: '_stock', label: 'Cantidad / Stock', type: 'number' },
        { name: 'min_stock', label: 'Stock mínimo', type: 'number' },
        { name: 'unit_cost', label: 'Costo unitario ($)', type: 'number' },
    ];

    // Compute initial values — when editing, map existing product; when creating, SKU empty
    const getInitialValues = () => {
        if (!editingProduct) return {};
        return { ...editingProduct };
    };

    // Recompute SKU preview when category or area changes (only for new products)
    useEffect(() => {
        if (!formOpen || editingProduct) return;
        if (formCategoryName && formAreaName) {
            const newSku = inventoryService.generateSKU(formCategoryName, formAreaName);
            setSkuPreview(newSku);
        } else {
            setSkuPreview('');
        }
    }, [formCategoryName, formAreaName, formOpen, editingProduct]);

    // The formKey changes when SKU preview changes, forcing FormDialog to re-initialize values
    const formKey = `${formOpen}-${skuPreview}`;
    const computedInitialValues = {
        ...getInitialValues(),
        ...((!editingProduct && skuPreview) ? { sku: skuPreview } : {}),
    };

    return (
        <MainLayout title="Inventario">
            <Box sx={{ animation: 'fadeIn 0.5s ease', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
                {/* Header Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Gestión de Inventario
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {products.length} artículos registrados
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
                            variant="outlined"
                            color="secondary"
                            startIcon={<UploadFileIcon />}
                            onClick={() => setImportOpen(true)}
                            sx={{ borderRadius: '10px' }}
                        >
                            Importar Excel
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleCreate}
                            sx={{ borderRadius: '10px' }}
                        >
                            Nuevo Artículo
                        </Button>
                    </Box>
                </Box>

                {/* Filters */}
                <Fade in={showFilters}>
                    <Box sx={{ display: showFilters ? 'flex' : 'none', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <TextField
                            select size="small" label="Tipo"
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
                            select size="small" label="Categoría"
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
                    onView={(product) => { setDetailProduct(product); setActiveTab(0); }}
                    searchPlaceholder="Buscar por nombre, código o área..."
                />

                {/* Create/Edit Form */}
                <FormDialog
                    key={formKey}
                    open={formOpen}
                    onClose={() => { setFormOpen(false); setFormCategoryName(''); setFormAreaName(''); }}
                    onSubmit={handleSubmit}
                    title={editingProduct ? 'Editar Artículo' : 'Nuevo Artículo'}
                    fields={formFields}
                    initialValues={computedInitialValues}
                    submitLabel={editingProduct ? 'Actualizar' : 'Crear Artículo'}
                    maxWidth="md"
                />

                {/* Delete Confirm */}
                <ConfirmDialog
                    open={deleteDialog.open}
                    onClose={() => setDeleteDialog({ open: false, product: null })}
                    onConfirm={handleDeleteConfirm}
                    title="¿Eliminar artículo?"
                    message={`¿Estás seguro de eliminar "${deleteDialog.product?.name}"? Esta acción no se puede deshacer.`}
                />

                {/* Barcode Scanner */}
                <BarcodeScanner
                    open={scannerOpen}
                    onClose={() => setScannerOpen(false)}
                    onScan={handleScan}
                />

                {/* Excel Import */}
                <ExcelImportDialog
                    open={importOpen}
                    onClose={handleImportClose}
                    onImport={handleBulkImport}
                />

                {/* Product Detail Dialog */}
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
                                        Detalle del Artículo
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {detailProduct.barcode && (
                                        <Tooltip title="Ver e imprimir código de barras">
                                            <IconButton
                                                size="small"
                                                onClick={() => setActiveTab(1)}
                                                sx={{ color: theme.palette.primary.main }}
                                            >
                                                <PrintIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    <IconButton onClick={() => setDetailProduct(null)} size="small">
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </DialogTitle>
                            <DialogContent dividers>
                                <Tabs
                                    value={activeTab}
                                    onChange={(_, v) => setActiveTab(v)}
                                    sx={{ mb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
                                >
                                    <Tab label="Información" />
                                    <Tab label="Código de Barras / Serie" />
                                </Tabs>

                                {activeTab === 0 && (
                                    <Grid container spacing={2}>
                                        {[
                                            { label: 'Código del Artículo', value: detailProduct.sku },
                                            { label: 'Nombre del Artículo', value: detailProduct.name },
                                            { label: 'Categoría', value: detailProduct._categoryName },
                                            { label: 'Ubicación', value: detailProduct._locationName || '—' },
                                            { label: 'Marca / Modelo', value: detailProduct._brandName || '—' },
                                            { label: 'Tipo', value: detailProduct.type, chip: true },
                                            { label: 'Condición', value: detailProduct.condition || '—' },
                                            { label: 'Área', value: detailProduct.area || '—' },
                                            { label: 'Responsable', value: detailProduct.responsible || '—' },
                                            { label: 'Stock', value: detailProduct._stock, stock: true },
                                            { label: 'Stock Mínimo', value: detailProduct.min_stock },
                                            { label: 'Costo Unitario', value: `$${(detailProduct.unit_cost || 0).toFixed(2)}` },
                                            {
                                                label: 'Número de Serie / Código de Barras',
                                                value: detailProduct.barcode || 'No asignado'
                                            },
                                            {
                                                label: 'Últ. Actualización',
                                                value: formatDate(detailProduct.updated_at)
                                            },
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
                                        {detailProduct.observation && (
                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    Observación
                                                </Typography>
                                                <Typography variant="body2">{detailProduct.observation}</Typography>
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
                                                    Este artículo no tiene número de serie / código de barras asignado
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
                                                        enqueueSnackbar('Código generado exitosamente', { variant: 'success' });
                                                    }}
                                                >
                                                    Generar Número de Serie
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
