import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Chip, Avatar, TextField, MenuItem,
    InputAdornment, Tooltip, IconButton, Stack,
} from '@mui/material';
import {
    PersonAdd as AddIcon, Search as SearchIcon,
    FileUpload as ImportIcon, Visibility as ViewIcon,
    Edit as EditIcon, Delete as DeleteIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import DataTable from '../../components/common/DataTable';
import { infantesService } from '../../services/appServices';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

const PROGRAMA_COLORS = { Ministerio: 'primary', Comedor: 'warning', Ambos: 'success' };
const ROL_ESCRITURA = ['admin', 'director', 'secretaria', 'tutor_especial'];

const InfantesPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();

    const [infantes, setInfantes] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filtros, setFiltros] = useState({ buscar: '', esPatrocinado: '', tipoPrograma: '', page: 1, limit: 20 });

    const canWrite = ROL_ESCRITURA.includes(user?.rol);
    const canDelete = ['admin', 'director'].includes(user?.rol);

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const params = { ...filtros };
            if (params.esPatrocinado === '') delete params.esPatrocinado;
            if (params.tipoPrograma === '') delete params.tipoPrograma;
            const res = await infantesService.listar(params);
            setInfantes(res.data || []);
            setTotal(res.meta?.total || 0);
        } catch (err) {
            enqueueSnackbar('Error cargando infantes', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [filtros]);

    useEffect(() => { cargar(); }, [cargar]);

    const handleEliminar = async (id) => {
        if (!window.confirm('¿Eliminar este infante?')) return;
        try {
            await infantesService.eliminar(id);
            enqueueSnackbar('Infante eliminado', { variant: 'success' });
            cargar();
        } catch {
            enqueueSnackbar('Error al eliminar', { variant: 'error' });
        }
    };

    const columns = [
        {
            id: 'foto',
            label: 'Foto',
            minWidth: 60,
            render: (row) => (
                <Avatar
                    src={row.fotografia ? `${API_URL}${row.fotografia}` : undefined}
                    sx={{ width: 38, height: 38, bgcolor: '#7c4dff', fontWeight: 700, fontSize: '0.85rem' }}
                >
                    {row.persona?.nombres?.charAt(0)}{row.persona?.apellidos?.charAt(0)}
                </Avatar>
            ),
        },
        { id: 'codigo', label: 'Código', minWidth: 90, render: (row) => <Chip label={row.codigo} size="small" variant="outlined" /> },
        {
            id: 'nombre',
            label: 'Nombre',
            minWidth: 180,
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight={600}>{row.persona?.nombres} {row.persona?.apellidos}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.persona?.telefono1}</Typography>
                </Box>
            ),
        },
        {
            id: 'tutor',
            label: 'Tutor',
            minWidth: 150,
            render: (row) => row.tutor
                ? `${row.tutor.persona?.nombres} ${row.tutor.persona?.apellidos}`
                : <Typography variant="caption" color="text.disabled">Sin tutor</Typography>,
        },
        {
            id: 'esPatrocinado',
            label: 'Patrocinado',
            minWidth: 110,
            render: (row) => (
                <Chip
                    label={row.esPatrocinado ? row.fuentePatrocinio : 'No'}
                    size="small"
                    color={row.esPatrocinado ? 'success' : 'default'}
                    variant="outlined"
                />
            ),
        },
        {
            id: 'tipoPrograma',
            label: 'Programa',
            minWidth: 110,
            render: (row) => <Chip label={row.tipoPrograma} size="small" color={PROGRAMA_COLORS[row.tipoPrograma] || 'default'} variant="filled" />,
        },
        {
            id: 'acciones',
            label: '',
            minWidth: 100,
            render: (row) => (
                <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Ver detalle">
                        <IconButton size="small" onClick={() => navigate(`/infantes/${row.id}`)}><ViewIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    {canWrite && (
                        <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => navigate(`/infantes/${row.id}/editar`)}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                    )}
                    {canDelete && (
                        <Tooltip title="Eliminar">
                            <IconButton size="small" color="error" onClick={() => handleEliminar(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                        </Tooltip>
                    )}
                </Stack>
            ),
        },
    ];

    return (
        <MainLayout>
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={800}>Infantes</Typography>
                        <Typography color="text.secondary">{total} registrados en el sistema</Typography>
                    </Box>
                    {canWrite && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/infantes/nuevo')}
                            sx={{ borderRadius: 2, fontWeight: 700 }}>
                            Nuevo Infante
                        </Button>
                    )}
                </Box>

                {/* Filtros */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                    <TextField
                        size="small" placeholder="Buscar por nombre, apellido o código..."
                        value={filtros.buscar}
                        onChange={(e) => setFiltros(f => ({ ...f, buscar: e.target.value, page: 1 }))}
                        sx={{ flex: 1 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                    />
                    <TextField select size="small" label="Patrocinado" value={filtros.esPatrocinado}
                        onChange={(e) => setFiltros(f => ({ ...f, esPatrocinado: e.target.value, page: 1 }))}
                        sx={{ minWidth: 140 }}>
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="true">Patrocinados</MenuItem>
                        <MenuItem value="false">No patrocinados</MenuItem>
                    </TextField>
                    <TextField select size="small" label="Programa" value={filtros.tipoPrograma}
                        onChange={(e) => setFiltros(f => ({ ...f, tipoPrograma: e.target.value, page: 1 }))}
                        sx={{ minWidth: 140 }}>
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="Ministerio">Ministerio</MenuItem>
                        <MenuItem value="Comedor">Comedor</MenuItem>
                        <MenuItem value="Ambos">Ambos</MenuItem>
                    </TextField>
                </Stack>

                {/* Tabla */}
                <DataTable
                    columns={columns}
                    rows={infantes}
                    loading={loading}
                    totalCount={total}
                    page={filtros.page - 1}
                    rowsPerPage={filtros.limit}
                    onPageChange={(_, p) => setFiltros(f => ({ ...f, page: p + 1 }))}
                    onRowsPerPageChange={(e) => setFiltros(f => ({ ...f, limit: parseInt(e.target.value), page: 1 }))}
                />
            </Box>
        </MainLayout>
    );
};

export default InfantesPage;
