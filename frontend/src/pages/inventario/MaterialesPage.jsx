import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, Chip, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, Stack, IconButton, Tooltip, Alert,
} from '@mui/material';
import {
    Add as AddIcon, SystemUpdateAlt as IngresarIcon,
    CallMade as DespacharIcon, Warning as WarningIcon, Edit as EditIcon, Delete as DeleteIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import DataTable from '../../components/common/DataTable';
import { materialesService } from '../../services/appServices';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

const FUENTE_COLORS = { Compassion: 'primary', Plan: 'secondary', Iglesia: 'success', ViasEnAccion: 'warning' };

export default function MaterialesPage() {
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const canWrite = ['admin', 'director', 'secretaria', 'tutor_especial'].includes(user?.rol);
    const canDelete = ['admin', 'director'].includes(user?.rol);

    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [alertas, setAlertas] = useState({ stockBajo: [], desactualizados: [] });
    const [buscar, setBuscar] = useState('');
    const [page, setPage] = useState(0);
    const [dialog, setDialog] = useState({ open: false, tipo: null, item: null, cantidad: 1, form: {} });

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const [res, alertRes] = await Promise.all([
                materialesService.listar({ buscar: buscar || undefined, page: page + 1, limit: 20 }),
                materialesService.alertas(),
            ]);
            setRows(res.data || []);
            setTotal(res.meta?.total || 0);
            setAlertas(alertRes.data || { stockBajo: [], desactualizados: [] });
        } catch { enqueueSnackbar('Error cargando materiales', { variant: 'error' }); }
        finally { setLoading(false); }
    }, [buscar, page]);

    useEffect(() => { cargar(); }, [cargar]);

    const handleAccion = async () => {
        const { tipo, item, cantidad, form } = dialog;
        try {
            if (tipo === 'ingresar') await materialesService.ingresar(item.id, cantidad);
            if (tipo === 'despachar') await materialesService.despachar(item.id, cantidad);
            if (tipo === 'crear') await materialesService.crear({ ...form, cantidadDisponible: 0, stockMinimo: 5 });
            if (tipo === 'editar') await materialesService.actualizar(item.id, form);
            enqueueSnackbar('Operación exitosa', { variant: 'success' });
            setDialog(d => ({ ...d, open: false }));
            cargar();
        } catch (err) {
            enqueueSnackbar(err?.response?.data?.error || 'Error', { variant: 'error' });
        }
    };

    const handleEliminar = async (id) => {
        if (!window.confirm('¿Eliminar este material?')) return;
        try { await materialesService.eliminar(id); enqueueSnackbar('Eliminado', { variant: 'success' }); cargar(); }
        catch { enqueueSnackbar('Error eliminando', { variant: 'error' }); }
    };

    const openDialog = (tipo, item = null) =>
        setDialog({ open: true, tipo, item, cantidad: 1, form: item ? { ...item } : { codigo: '', nombreMaterial: '', fuenteRecurso: 'Iglesia', categoria: '' } });

    const columns = [
        { id: 'codigo', label: 'Código', render: r => <Chip label={r.codigo} size="small" variant="outlined" /> },
        {
            id: 'nombre', label: 'Material', minWidth: 200, render: r => (
                <Box>
                    <Typography variant="body2" fontWeight={600}>{r.nombreMaterial}</Typography>
                    <Typography variant="caption" color="text.secondary">{r.categoria}</Typography>
                </Box>
            )
        },
        {
            id: 'stock', label: 'Stock', render: r => (
                <Chip label={r.cantidadDisponible} size="small" color={r.stockBajo ? 'error' : 'success'} />
            )
        },
        { id: 'fuente', label: 'Fuente', render: r => <Chip label={r.fuenteRecurso} size="small" color={FUENTE_COLORS[r.fuenteRecurso] || 'default'} variant="outlined" /> },
        { id: 'actualizado', label: 'Actualizado', render: r => new Date(r.fechaUltimaActualizacion).toLocaleDateString() },
        {
            id: 'acciones', label: '', render: r => canWrite && (
                <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Ingresar"><IconButton size="small" color="success" onClick={() => openDialog('ingresar', r)}><IngresarIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Despachar"><IconButton size="small" color="warning" onClick={() => openDialog('despachar', r)}><DespacharIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => openDialog('editar', r)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    {canDelete && <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => handleEliminar(r.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>}
                </Stack>
            )
        },
    ];

    const totalAlertas = alertas.stockBajo.length + alertas.desactualizados.length;

    return (
        <MainLayout>
            <Box sx={{ p: 3 }}>
                {totalAlertas > 0 && (
                    <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
                        {alertas.stockBajo.length > 0 && `${alertas.stockBajo.length} material(es) con stock bajo. `}
                        {alertas.desactualizados.length > 0 && `${alertas.desactualizados.length} material(es) sin actualizar (+30 días).`}
                    </Alert>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                    <Box>
                        <Typography variant="h4" fontWeight={800}>Inventario · Materiales</Typography>
                        <Typography color="text.secondary">{total} items registrados</Typography>
                    </Box>
                    {canWrite && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog('crear')} sx={{ fontWeight: 700, borderRadius: 2 }}>
                            Nuevo Material
                        </Button>
                    )}
                </Box>
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <TextField size="small" placeholder="Buscar material..." value={buscar}
                        onChange={e => { setBuscar(e.target.value); setPage(0); }} sx={{ flex: 1 }} />
                </Stack>
                <DataTable columns={columns} rows={rows} loading={loading} totalCount={total}
                    page={page} rowsPerPage={20}
                    onPageChange={(_, p) => setPage(p)}
                    onRowsPerPageChange={() => { }} />
            </Box>

            <Dialog open={dialog.open} onClose={() => setDialog(d => ({ ...d, open: false }))} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight={700}>
                    {{ ingresar: 'Ingresar Stock', despachar: 'Despachar Stock', crear: 'Nuevo Material', editar: 'Editar Material' }[dialog.tipo]}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        {['ingresar', 'despachar'].includes(dialog.tipo) ? (
                            <TextField label="Cantidad" type="number" value={dialog.cantidad} fullWidth size="small"
                                onChange={e => setDialog(d => ({ ...d, cantidad: parseInt(e.target.value) || 1 }))} />
                        ) : (
                            <Stack spacing={2}>
                                <TextField label="Código *" value={dialog.form.codigo || ''} fullWidth size="small"
                                    onChange={e => setDialog(d => ({ ...d, form: { ...d.form, codigo: e.target.value } }))} />
                                <TextField label="Nombre Material *" value={dialog.form.nombreMaterial || ''} fullWidth size="small"
                                    onChange={e => setDialog(d => ({ ...d, form: { ...d.form, nombreMaterial: e.target.value } }))} />
                                <TextField label="Categoría" value={dialog.form.categoria || ''} fullWidth size="small"
                                    onChange={e => setDialog(d => ({ ...d, form: { ...d.form, categoria: e.target.value } }))} />
                                <TextField select label="Fuente de Recurso" value={dialog.form.fuenteRecurso || 'Iglesia'} fullWidth size="small"
                                    onChange={e => setDialog(d => ({ ...d, form: { ...d.form, fuenteRecurso: e.target.value } }))}>
                                    {['Compassion', 'Plan', 'Iglesia', 'ViasEnAccion'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                                </TextField>
                            </Stack>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialog(d => ({ ...d, open: false }))}>Cancelar</Button>
                    <Button variant="contained" onClick={handleAccion}>Confirmar</Button>
                </DialogActions>
            </Dialog>
        </MainLayout>
    );
}
