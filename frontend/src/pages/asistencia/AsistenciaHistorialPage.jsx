import { useState, useEffect } from 'react';
import { Box, Typography, TextField, MenuItem, Chip, Stack } from '@mui/material';
import MainLayout from '../../components/layout/MainLayout';
import DataTable from '../../components/common/DataTable';
import { asistenciaService } from '../../services/appServices';
import { useSnackbar } from 'notistack';

const ESTADO_COLOR = { Presente: 'success', Ausente: 'error', Justificado: 'warning' };

export default function AsistenciaHistorialPage() {
    const { enqueueSnackbar } = useSnackbar();
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filtros, setFiltros] = useState({ estado: '', page: 1, limit: 20 });

    const cargar = async () => {
        setLoading(true);
        try {
            const params = { ...filtros };
            if (!params.estado) delete params.estado;
            const res = await asistenciaService.listar(params);
            setRows(res.data || []);
            setTotal(res.meta?.total || 0);
        } catch { enqueueSnackbar('Error cargando historial', { variant: 'error' }); }
        finally { setLoading(false); }
    };

    useEffect(() => { cargar(); }, [filtros]);

    const columns = [
        { id: 'fecha', label: 'Fecha', render: r => new Date(r.fecha).toLocaleDateString() },
        { id: 'infante', label: 'Infante', render: r => `${r.infante?.persona?.nombres} ${r.infante?.persona?.apellidos}` },
        { id: 'codigo', label: 'Código', render: r => r.infante?.codigo },
        { id: 'estado', label: 'Estado', render: r => <Chip label={r.estado} size="small" color={ESTADO_COLOR[r.estado]} /> },
    ];

    return (
        <MainLayout>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>Historial de Asistencia</Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>{total} registros</Typography>

                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <TextField select size="small" label="Estado" value={filtros.estado}
                        onChange={e => setFiltros(f => ({ ...f, estado: e.target.value, page: 1 }))} sx={{ minWidth: 160 }}>
                        <MenuItem value="">Todos</MenuItem>
                        {['Presente', 'Ausente', 'Justificado'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                    </TextField>
                </Stack>

                <DataTable columns={columns} rows={rows} loading={loading} totalCount={total}
                    page={filtros.page - 1} rowsPerPage={filtros.limit}
                    onPageChange={(_, p) => setFiltros(f => ({ ...f, page: p + 1 }))}
                    onRowsPerPageChange={e => setFiltros(f => ({ ...f, limit: parseInt(e.target.value), page: 1 }))}
                />
            </Box>
        </MainLayout>
    );
}
