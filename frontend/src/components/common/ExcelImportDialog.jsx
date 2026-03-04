import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Button, Typography, Stepper, Step, StepLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, LinearProgress, IconButton, Alert,
    alpha, useTheme, Tooltip,
} from '@mui/material';
import {
    UploadFile as UploadIcon,
    Close as CloseIcon,
    CheckCircle as CheckIcon,
    Warning as WarningIcon,
    CloudUpload as CloudUploadIcon,
    TableChart as TableIcon,
    Inventory2 as InventoryIcon,
} from '@mui/icons-material';

// ─── Column name aliases (case-insensitive matching) ──────────────────────────
const COLUMN_MAP = {
    sku: ['codigo del articulo', 'codigo del artículo', 'código del artículo', 'codigo', 'sku', 'código'],
    name: ['nombre del articulo', 'nombre del artículo', 'nombre', 'nombre del producto', 'articulo', 'artículo'],
    description: ['descripcion', 'descripción', 'description'],
    category: ['categoria', 'categoría', 'category'],
    location: ['ubicacion', 'ubicación', 'location', 'ubicacion'],
    brand: ['marca', 'modelo', 'marca / modelo de articulo', 'marca / modelo de artículo', 'marca/modelo', 'brand'],
    condition: ['condicion', 'condición', 'condition', 'estado'],
    observation: ['observacion', 'observación', 'observation', 'observaciones', 'notas'],
    area: ['area', 'área', 'dependencia'],
    responsible: ['responsable', 'responsible', 'encargado'],
    type: ['tipo', 'type', 'fungible', 'tipo de bien', 'tipo bien'],
};

const normalizeKey = (header) => header?.toString().toLowerCase().trim();

const findColumnKey = (header) => {
    const normalized = normalizeKey(header);
    for (const [key, aliases] of Object.entries(COLUMN_MAP)) {
        if (aliases.some(a => normalized.includes(a) || a.includes(normalized))) {
            return key;
        }
    }
    return null;
};

// Normalize "tipo" values to system types
const parseType = (val) => {
    if (!val) return 'office_supply';
    const v = val.toString().toLowerCase().trim();
    if (v.includes('no fungible') || v.includes('non fungible') || v.includes('no_fungible') || v.includes('activo')) return 'non_fungible';
    if (v.includes('fungible')) return 'fungible';
    return 'office_supply';
};

const TYPE_LABELS = {
    fungible: { label: 'Fungible', color: 'primary' },
    non_fungible: { label: 'No Fungible', color: 'secondary' },
    office_supply: { label: 'Of. Suministro', color: 'default' },
};

const CONDITION_COLORS = {
    Buena: 'success',
    Regular: 'warning',
    Dañada: 'error',
    default: 'default',
};

const steps = ['Cargar archivo', 'Vista previa', 'Resultado'];

// ─── Main Component ───────────────────────────────────────────────────────────
const ExcelImportDialog = ({ open, onClose, onImport }) => {
    const theme = useTheme();
    const fileInputRef = useRef(null);
    const [activeStep, setActiveStep] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const [fileName, setFileName] = useState('');
    const [parsedRows, setParsedRows] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importResult, setImportResult] = useState(null);

    const reset = () => {
        setActiveStep(0);
        setDragOver(false);
        setFileName('');
        setParsedRows([]);
        setWarnings([]);
        setImporting(false);
        setImportProgress(0);
        setImportResult(null);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    // ── Parse Excel file ──
    const parseFile = useCallback((file) => {
        if (!file) return;
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const workbook = XLSX.read(e.target.result, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                if (raw.length < 2) {
                    setWarnings(['El archivo está vacío o no tiene filas de datos.']);
                    return;
                }

                const headers = raw[0];
                const dataRows = raw.slice(1);
                const newWarnings = [];

                // Build column index map
                const indexMap = {}; // { sku: 2, name: 1, ... }
                headers.forEach((h, i) => {
                    const key = findColumnKey(h);
                    if (key && indexMap[key] === undefined) {
                        indexMap[key] = i;
                    }
                });

                if (indexMap.name === undefined) {
                    newWarnings.push('No se encontró la columna "Nombre del artículo". Verifica el formato del archivo.');
                }

                const rows = dataRows
                    .filter(row => row.some(cell => cell !== undefined && cell !== ''))
                    .map((row, idx) => {
                        const get = (key) => {
                            const i = indexMap[key];
                            return i !== undefined ? row[i]?.toString().trim() : '';
                        };

                        const rawSKU = get('sku');
                        const rawName = get('name');
                        const rawType = get('type');

                        if (!rawName) {
                            newWarnings.push(`Fila ${idx + 2}: Sin nombre — será omitida.`);
                            return null;
                        }

                        return {
                            _rowIndex: idx + 2,
                            sku: rawSKU || '',
                            name: rawName,
                            description: [get('description'), get('observation')].filter(Boolean).join(' | ') || '',
                            _categoryName: get('category') || 'Sin categoría',
                            _locationName: get('location') || '',
                            _brandName: get('brand') || 'Genérico',
                            condition: get('condition') || '',
                            area: get('area') || '',
                            responsible: get('responsible') || '',
                            type: parseType(rawType),
                            has_serial: parseType(rawType) === 'non_fungible',
                            min_stock: 1,
                            unit_cost: 0,
                            _stock: 1,
                            active: true,
                        };
                    })
                    .filter(Boolean);

                setWarnings(newWarnings);
                setParsedRows(rows);
                setActiveStep(1);
            } catch (err) {
                setWarnings([`Error al leer el archivo: ${err.message}`]);
            }
        };
        reader.readAsArrayBuffer(file);
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) parseFile(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) parseFile(file);
    };

    // ── Import ──
    const handleImport = async () => {
        setImporting(true);
        setActiveStep(2);
        setImportProgress(0);

        const total = parsedRows.length;
        let imported = 0, skipped = 0, errors = 0;
        const results = [];

        for (let i = 0; i < total; i++) {
            try {
                const result = await onImport([parsedRows[i]]);
                imported += result.imported || 0;
                skipped += result.skipped || 0;
                errors += result.errors || 0;
            } catch {
                errors++;
            }
            setImportProgress(Math.round(((i + 1) / total) * 100));
            // Small delay to show progress animation
            if (total > 10) await new Promise(r => setTimeout(r, 20));
        }

        setImportResult({ total, imported, skipped, errors });
        setImporting(false);
    };

    // ─── Render steps ─────────────────────────────────────────────────────────

    const renderStepUpload = () => (
        <Box sx={{ py: 2 }}>
            {warnings.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                    {warnings[0]}
                </Alert>
            )}

            {/* Drop zone */}
            <Box
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                    border: `2px dashed ${dragOver ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.2)}`,
                    borderRadius: '16px',
                    p: 6,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    background: dragOver ? alpha(theme.palette.primary.main, 0.06) : alpha(theme.palette.background.paper, 0.5),
                    '&:hover': {
                        borderColor: theme.palette.primary.main,
                        background: alpha(theme.palette.primary.main, 0.04),
                    },
                }}
            >
                <CloudUploadIcon sx={{ fontSize: 56, color: dragOver ? 'primary.main' : 'text.disabled', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Arrastra tu archivo aquí
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    o haz clic para seleccionar
                </Typography>
                <Chip label=".xlsx  •  .xls  •  .csv" size="small" variant="outlined" />
            </Box>

            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            {/* Template hint */}
            <Box sx={{ mt: 2, p: 2, borderRadius: 2, background: alpha(theme.palette.info.main, 0.08) }}>
                <Typography variant="caption" color="text.secondary">
                    <strong>Columnas esperadas:</strong> Codigo del artículo, Nombre del artículo, Descripcion, Categoria, Ubicacion, Marca/Modelo, Tipo (Fungible / No Fungible), Condicion, Observacion, Area, Responsable
                </Typography>
            </Box>
        </Box>
    );

    const renderStepPreview = () => (
        <Box>
            {/* Summary bar */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip icon={<TableIcon />} label={`${parsedRows.length} filas`} color="primary" variant="outlined" size="small" />
                <Typography variant="caption" color="text.secondary">
                    de <strong>{fileName}</strong>
                </Typography>
                {warnings.length > 0 && (
                    <Chip icon={<WarningIcon />} label={`${warnings.length} advertencia(s)`} color="warning" size="small" variant="outlined" />
                )}
            </Box>

            {warnings.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                    {warnings.map((w, i) => <div key={i}>{w}</div>)}
                </Alert>
            )}

            {/* Preview table — first 8 rows */}
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 340, border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}` }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            {['#', 'SKU', 'Nombre', 'Categoría', 'Marca', 'Tipo', 'Condición', 'Área'].map(h => (
                                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', whiteSpace: 'nowrap', background: alpha(theme.palette.background.default, 0.9) }}>
                                    {h}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {parsedRows.slice(0, 8).map((row, i) => {
                            const typeConf = TYPE_LABELS[row.type] || TYPE_LABELS.office_supply;
                            const condColor = CONDITION_COLORS[row.condition] || CONDITION_COLORS.default;
                            return (
                                <TableRow key={i} hover>
                                    <TableCell sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>{row._rowIndex}</TableCell>
                                    <TableCell sx={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>{row.sku || '—'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.72rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <Tooltip title={row.name}><span>{row.name}</span></Tooltip>
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.72rem' }}>{row._categoryName}</TableCell>
                                    <TableCell sx={{ fontSize: '0.72rem' }}>{row._brandName}</TableCell>
                                    <TableCell>
                                        <Chip label={typeConf.label} color={typeConf.color} size="small" sx={{ fontSize: '0.68rem', height: 20 }} />
                                    </TableCell>
                                    <TableCell>
                                        {row.condition ? (
                                            <Chip label={row.condition} color={condColor} size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 20 }} />
                                        ) : '—'}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.72rem' }}>{row.area || '—'}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            {parsedRows.length > 8 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'right' }}>
                    ... y {parsedRows.length - 8} filas más
                </Typography>
            )}
        </Box>
    );

    const renderStepResult = () => (
        <Box sx={{ py: 2 }}>
            {importing ? (
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ mb: 2 }}>Importando {parsedRows.length} artículos...</Typography>
                    <LinearProgress
                        variant="determinate"
                        value={importProgress}
                        sx={{ height: 10, borderRadius: 5, mb: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">{importProgress}%</Typography>
                </Box>
            ) : importResult ? (
                <Box sx={{ textAlign: 'center' }}>
                    <CheckIcon sx={{ fontSize: 56, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>¡Importación completada!</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, background: alpha(theme.palette.success.main, 0.1), minWidth: 100 }}>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main' }}>{importResult.imported}</Typography>
                            <Typography variant="caption" color="text.secondary">Importados</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, background: alpha(theme.palette.warning.main, 0.1), minWidth: 100 }}>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: 'warning.main' }}>{importResult.skipped}</Typography>
                            <Typography variant="caption" color="text.secondary">Omitidos</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, background: alpha(theme.palette.error.main, 0.08), minWidth: 100 }}>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: 'error.main' }}>{importResult.errors}</Typography>
                            <Typography variant="caption" color="text.secondary">Errores</Typography>
                        </Box>
                    </Box>
                    {importResult.skipped > 0 && (
                        <Alert severity="info" sx={{ mt: 2, borderRadius: 2, textAlign: 'left' }}>
                            Los artículos omitidos ya existían en el inventario (mismo SKU/código).
                        </Alert>
                    )}
                </Box>
            ) : null}
        </Box>
    );

    return (
        <Dialog
            open={open}
            onClose={!importing ? handleClose : undefined}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '20px',
                    background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #0d1b2a 0%, #1a2744 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                },
            }}
        >
            {/* Header */}
            <DialogTitle sx={{ pb: 0, pt: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            width: 40, height: 40, borderRadius: '12px',
                            background: alpha(theme.palette.primary.main, 0.15),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <UploadIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                Importar desde Excel
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Carga masiva de artículos al inventario
                            </Typography>
                        </Box>
                    </Box>
                    {!importing && (
                        <IconButton onClick={handleClose} size="small">
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            </DialogTitle>

            <DialogContent sx={{ pt: 2.5 }}>
                {/* Stepper */}
                <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {/* Step content */}
                {activeStep === 0 && renderStepUpload()}
                {activeStep === 1 && renderStepPreview()}
                {activeStep === 2 && renderStepResult()}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                {activeStep === 1 && !importing && (
                    <>
                        <Button
                            variant="outlined"
                            onClick={() => { setParsedRows([]); setWarnings([]); setFileName(''); setActiveStep(0); }}
                            sx={{ borderRadius: '10px' }}
                        >
                            Cambiar archivo
                        </Button>
                        <Box sx={{ flex: 1 }} />
                        <Button
                            variant="contained"
                            onClick={handleImport}
                            disabled={parsedRows.length === 0}
                            startIcon={<InventoryIcon />}
                            sx={{ borderRadius: '10px' }}
                        >
                            Importar {parsedRows.length} artículo{parsedRows.length !== 1 ? 's' : ''}
                        </Button>
                    </>
                )}
                {activeStep === 2 && !importing && (
                    <Button
                        variant="contained"
                        onClick={handleClose}
                        sx={{ borderRadius: '10px', ml: 'auto' }}
                    >
                        Cerrar
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ExcelImportDialog;
