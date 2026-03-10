import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Chip, Avatar, TextField, MenuItem,
    InputAdornment, Tooltip, IconButton, Stack, Paper, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, TableSortLabel, alpha, useTheme,
    Dialog, DialogTitle, DialogContent, DialogActions, Divider,
    Badge, Alert,
} from '@mui/material';
import {
    PersonAdd as AddIcon, Search as SearchIcon,
    Visibility as ViewIcon, Edit as EditIcon, Delete as DeleteIcon,
    PeopleAlt as PeopleIcon, FileUpload as ImportIcon,
    PhotoCamera as PhotoIcon, Close as CloseIcon,
    CheckCircle as SuccessIcon, Download as DownloadIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import * as XLSX from 'xlsx';

// ─── Paleta CCO ───────────────────────────────────────────────────────────────
const CCO = { amarillo: '#FFD700', naranja: '#FF8C00', violeta: '#6A5ACD', azul: '#4169E1' };

const PROGRAMA_COLORS = { Ministerio: 'primary', Comedor: 'warning', Ambos: 'success' };
const ROL_ESCRITURA = ['admin', 'director', 'secretaria', 'tutor_especial'];
const AVATAR_COLORS = ['#7c4dff', '#00bcd4', '#ff5722', '#4caf50', '#ff9800', '#e91e63', '#3f51b5', '#009688'];

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_INFANTES = [
    {
        id: 1, codigo: 'INF-001', tipoPrograma: 'Ministerio', esPatrocinado: true, fuentePatrocinio: 'Compassion',
        enfermedades: '', alergias: 'Ninguna',
        fotografia: '/mock-fotos/inf001.png', fechaActualizacionFoto: '2025-12-15',
        persona: { nombres: 'María Gabriela', apellidos: 'López Mendoza', cedula: '0951234567', telefono1: '0987654321', telefono2: '', email: '', direccion: 'Av. 9 de Octubre y Malecón', fechaNacimiento: '2018-03-12' },
        tutor: { persona: { nombres: 'Ana María', apellidos: 'Mendoza Cedeño' } },
    },
    {
        id: 2, codigo: 'INF-002', tipoPrograma: 'Ministerio', esPatrocinado: true, fuentePatrocinio: 'Compassion',
        enfermedades: 'Asma leve', alergias: 'Polvo',
        fotografia: '/mock-fotos/inf002.png', fechaActualizacionFoto: '2026-01-20',
        persona: { nombres: 'José Andrés', apellidos: 'Pérez Villao', cedula: '0952345678', telefono1: '0998765432', telefono2: '042567890', email: '', direccion: 'Sauces 8, Mz 124 V5', fechaNacimiento: '2020-07-18' },
        tutor: { persona: { nombres: 'Carmen Rosa', apellidos: 'Villao Suárez' } },
    },
    {
        id: 3, codigo: 'INF-003', tipoPrograma: 'Ambos', esPatrocinado: false, fuentePatrocinio: 'Ninguno',
        enfermedades: '', alergias: '',
        fotografia: '/mock-fotos/inf003.png', fechaActualizacionFoto: '2025-06-10',
        persona: { nombres: 'Camila Sofía', apellidos: 'Torres Aragundi', cedula: '0953456789', telefono1: '0961234567', telefono2: '', email: '', direccion: 'Bastión Popular Blq 1A', fechaNacimiento: '2016-11-24' },
        tutor: { persona: { nombres: 'Luis Alberto', apellidos: 'Torres Gómez' } },
    },
    {
        id: 4, codigo: 'INF-004', tipoPrograma: 'Ministerio', esPatrocinado: true, fuentePatrocinio: 'Plan',
        enfermedades: '', alergias: 'Mariscos',
        fotografia: '/mock-fotos/inf004.png', fechaActualizacionFoto: '2026-02-28',
        persona: { nombres: 'Sebastián', apellidos: 'Morales Intriago', cedula: '0954567890', telefono1: '0976543210', telefono2: '', email: '', direccion: 'Guasmo Sur Coop. Cristo Vive', fechaNacimiento: '2019-01-05' },
        tutor: { persona: { nombres: 'Gloria', apellidos: 'Intriago Palma' } },
    },
    {
        id: 5, codigo: 'INF-005', tipoPrograma: 'Comedor', esPatrocinado: false, fuentePatrocinio: 'Ninguno',
        enfermedades: 'Rinitis', alergias: '',
        fotografia: null, fechaActualizacionFoto: null,
        persona: { nombres: 'Valentina', apellidos: 'Cedeño Bravo', cedula: '0955678901', telefono1: '0945678901', telefono2: '', email: '', direccion: 'Isla Trinitaria Coop. Independencia', fechaNacimiento: '2017-05-30' },
        tutor: { persona: { nombres: 'Marta', apellidos: 'Bravo Moreira' } },
    },
    {
        id: 6, codigo: 'INF-006', tipoPrograma: 'Ministerio', esPatrocinado: true, fuentePatrocinio: 'Compassion',
        enfermedades: '', alergias: '',
        fotografia: null, fechaActualizacionFoto: null,
        persona: { nombres: 'Daniel Alejandro', apellidos: 'Ramírez Loor', cedula: '0956789012', telefono1: '0934567890', telefono2: '', email: '', direccion: 'Flor de Bastión Blq 7', fechaNacimiento: '2018-09-14' },
        tutor: { persona: { nombres: 'Patricia', apellidos: 'Loor Zambrano' } },
    },
    {
        id: 7, codigo: 'INF-007', tipoPrograma: 'Ambos', esPatrocinado: true, fuentePatrocinio: 'Compassion',
        enfermedades: 'Dermatitis atópica', alergias: 'Lácteos',
        fotografia: null, fechaActualizacionFoto: null,
        persona: { nombres: 'Isabella', apellidos: 'Vélez Zambrano', cedula: '0957890123', telefono1: '0923456789', telefono2: '', email: '', direccion: 'Paraíso de la Flor Etapa 2', fechaNacimiento: '2019-12-01' },
        tutor: { persona: { nombres: 'Rosa', apellidos: 'Zambrano Quiñónez' } },
    },
    {
        id: 8, codigo: 'INF-008', tipoPrograma: 'Ministerio', esPatrocinado: false, fuentePatrocinio: 'Ninguno',
        enfermedades: '', alergias: '',
        fotografia: null, fechaActualizacionFoto: null,
        persona: { nombres: 'Matías', apellidos: 'Suárez Pincay', cedula: '0958901234', telefono1: '0912345678', telefono2: '', email: '', direccion: 'Sergio Toral Sec. 3', fechaNacimiento: '2020-04-22' },
        tutor: { persona: { nombres: 'Jorge', apellidos: 'Suárez Reyes' } },
    },
    {
        id: 9, codigo: 'INF-009', tipoPrograma: 'Comedor', esPatrocinado: false, fuentePatrocinio: 'Ninguno',
        enfermedades: '', alergias: 'Gluten',
        fotografia: null, fechaActualizacionFoto: null,
        persona: { nombres: 'Luciana', apellidos: 'Mera Chávez', cedula: '0959012345', telefono1: '0901234567', telefono2: '', email: '', direccion: 'Monte Sinaí Coop. Realidad', fechaNacimiento: '2017-08-10' },
        tutor: { persona: { nombres: 'Elena', apellidos: 'Chávez Ponce' } },
    },
    {
        id: 10, codigo: 'INF-010', tipoPrograma: 'Ministerio', esPatrocinado: true, fuentePatrocinio: 'Plan',
        enfermedades: '', alergias: '',
        fotografia: null, fechaActualizacionFoto: null,
        persona: { nombres: 'Nicolás Emilio', apellidos: 'Castro Bone', cedula: '0950123456', telefono1: '0890123456', telefono2: '042345678', email: '', direccion: 'Vergeles Sector 1 Mz 20', fechaNacimiento: '2018-06-28' },
        tutor: { persona: { nombres: 'Sandra', apellidos: 'Bone Espinoza' } },
    },
    {
        id: 11, codigo: 'INF-011', tipoPrograma: 'Ministerio', esPatrocinado: true, fuentePatrocinio: 'Compassion',
        enfermedades: '', alergias: '',
        fotografia: null, fechaActualizacionFoto: null,
        persona: { nombres: 'Emilia', apellidos: 'Figueroa Palacios', cedula: '0961234500', telefono1: '0967891234', telefono2: '', email: '', direccion: 'Coop. Nueva Prosperina', fechaNacimiento: '2019-02-15' },
        tutor: { persona: { nombres: 'María', apellidos: 'Palacios Vera' } },
    },
    {
        id: 12, codigo: 'INF-012', tipoPrograma: 'Ambos', esPatrocinado: false, fuentePatrocinio: 'Ninguno',
        enfermedades: 'Anemia leve', alergias: '',
        fotografia: null, fechaActualizacionFoto: null,
        persona: { nombres: 'Santiago', apellidos: 'Quishpe Yagual', cedula: '0962345600', telefono1: '0956782345', telefono2: '', email: '', direccion: 'Pascuales Coop. El Fortín', fechaNacimiento: '2016-10-03' },
        tutor: { persona: { nombres: 'Pedro', apellidos: 'Quishpe Llumiquinga' } },
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const calcEdad = (fechaNac) => {
    const hoy = new Date();
    const nac = new Date(fechaNac);
    let edad = hoy.getFullYear() - nac.getFullYear();
    if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--;
    return edad;
};

const getInitials = (row) => `${row.persona?.nombres?.charAt(0) || ''}${row.persona?.apellidos?.charAt(0) || ''}`;

const fotoBadge = (fecha) => {
    if (!fecha) return { color: '#ef5350', text: 'Sin foto' };
    const d = new Date(fecha);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays <= 90) return { color: '#4caf50', text: `${d.toLocaleDateString('es-EC')}` };
    if (diffDays <= 365) return { color: '#ff9800', text: `${d.toLocaleDateString('es-EC')}` };
    return { color: '#ef5350', text: `${d.toLocaleDateString('es-EC')}` };
};

// ─── Excel Column Mapping ─────────────────────────────────────────────────────
const EXCEL_FIELD_MAP = {
    // Detect column names from common Excel formats
    'codigo': 'codigo', 'código': 'codigo', 'code': 'codigo', 'id': 'codigo',
    'nombres': 'nombres', 'nombre': 'nombres', 'name': 'nombres', 'primer nombre': 'nombres',
    'apellidos': 'apellidos', 'apellido': 'apellidos', 'last name': 'apellidos',
    'cedula': 'cedula', 'cédula': 'cedula', 'ci': 'cedula', 'documento': 'cedula',
    'telefono': 'telefono1', 'teléfono': 'telefono1', 'telefono1': 'telefono1', 'teléfono1': 'telefono1', 'celular': 'telefono1', 'phone': 'telefono1',
    'telefono2': 'telefono2', 'teléfono2': 'telefono2',
    'email': 'email', 'correo': 'email',
    'direccion': 'direccion', 'dirección': 'direccion', 'address': 'direccion',
    'fecha nacimiento': 'fechaNacimiento', 'fecha_nacimiento': 'fechaNacimiento', 'nacimiento': 'fechaNacimiento', 'birth': 'fechaNacimiento', 'f. nacimiento': 'fechaNacimiento',
    'programa': 'tipoPrograma', 'tipo programa': 'tipoPrograma', 'tipo': 'tipoPrograma',
    'patrocinado': 'esPatrocinado', 'sponsorship': 'esPatrocinado',
    'patrocinio': 'fuentePatrocinio', 'fuente': 'fuentePatrocinio', 'sponsor': 'fuentePatrocinio',
    'enfermedades': 'enfermedades', 'enfermedad': 'enfermedades',
    'alergias': 'alergias', 'alergia': 'alergias',
    'tutor': 'tutor', 'representante': 'tutor',
};

const mapExcelRow = (row) => {
    const mapped = { persona: {} };
    const personaFields = ['nombres', 'apellidos', 'cedula', 'telefono1', 'telefono2', 'email', 'direccion', 'fechaNacimiento'];

    Object.entries(row).forEach(([key, value]) => {
        const normalized = key.toLowerCase().trim();
        const field = EXCEL_FIELD_MAP[normalized];
        if (!field) return;
        const val = value != null ? String(value).trim() : '';
        if (personaFields.includes(field)) {
            mapped.persona[field] = val;
        } else if (field === 'esPatrocinado') {
            mapped.esPatrocinado = ['si', 'sí', 'yes', 'true', '1'].includes(val.toLowerCase());
        } else {
            mapped[field] = val;
        }
    });

    return mapped;
};

// ─── InfantesPage ─────────────────────────────────────────────────────────────
const InfantesPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const fileInputRef = useRef(null);

    const [infantes, setInfantes] = useState(MOCK_INFANTES);
    const [search, setSearch] = useState('');
    const [filtroPat, setFiltroPat] = useState('');
    const [filtroProg, setFiltroProg] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState('asc');

    // Excel import state
    const [importOpen, setImportOpen] = useState(false);
    const [importData, setImportData] = useState([]);
    const [importColumns, setImportColumns] = useState([]);
    const [importFileName, setImportFileName] = useState('');

    const canWrite = ROL_ESCRITURA.includes(user?.rol);
    const canDelete = ['admin', 'director'].includes(user?.rol);

    // Filtrado
    const filtered = useMemo(() => {
        let res = infantes;
        if (search) {
            const s = search.toLowerCase();
            res = res.filter(i =>
                `${i.persona.nombres} ${i.persona.apellidos}`.toLowerCase().includes(s) ||
                i.codigo.toLowerCase().includes(s) ||
                i.persona.cedula?.includes(s)
            );
        }
        if (filtroPat === 'true') res = res.filter(i => i.esPatrocinado);
        if (filtroPat === 'false') res = res.filter(i => !i.esPatrocinado);
        if (filtroProg) res = res.filter(i => i.tipoPrograma === filtroProg);
        return res;
    }, [infantes, search, filtroPat, filtroProg]);

    // Ordenamiento
    const sorted = useMemo(() => {
        if (!orderBy) return filtered;
        return [...filtered].sort((a, b) => {
            let av, bv;
            if (orderBy === 'nombre') { av = `${a.persona.nombres} ${a.persona.apellidos}`; bv = `${b.persona.nombres} ${b.persona.apellidos}`; }
            else if (orderBy === 'codigo') { av = a.codigo; bv = b.codigo; }
            else if (orderBy === 'edad') { av = calcEdad(a.persona.fechaNacimiento); bv = calcEdad(b.persona.fechaNacimiento); return order === 'asc' ? av - bv : bv - av; }
            else { av = a[orderBy] || ''; bv = b[orderBy] || ''; }
            return order === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
        });
    }, [filtered, orderBy, order]);

    const paginatedRows = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const patrocinados = infantes.filter(i => i.esPatrocinado).length;
    const conFoto = infantes.filter(i => i.fotografia).length;

    const handleSort = (field) => {
        setOrder(orderBy === field && order === 'asc' ? 'desc' : 'asc');
        setOrderBy(field);
    };

    const handleEliminar = (id) => {
        if (!window.confirm('¿Eliminar este infante? Esta acción no se puede deshacer.')) return;
        setInfantes(prev => prev.filter(i => i.id !== id));
        enqueueSnackbar('Infante eliminado', { variant: 'success' });
    };

    // ── Excel Import ──────────────────────────────────────────────────────────
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportFileName(file.name);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

                if (data.length === 0) {
                    enqueueSnackbar('El archivo no contiene datos', { variant: 'warning' });
                    return;
                }

                setImportColumns(Object.keys(data[0]));
                setImportData(data);
                setImportOpen(true);
            } catch (err) {
                enqueueSnackbar('Error al leer el archivo Excel', { variant: 'error' });
            }
        };
        reader.readAsBinaryString(file);
        // Reset input
        e.target.value = '';
    };

    const handleImportConfirm = () => {
        const maxId = Math.max(...infantes.map(i => i.id), 0);
        const newInfantes = importData.map((row, idx) => {
            const mapped = mapExcelRow(row);
            return {
                id: maxId + idx + 1,
                codigo: mapped.codigo || `INF-${String(maxId + idx + 1).padStart(3, '0')}`,
                tipoPrograma: mapped.tipoPrograma || 'Ministerio',
                esPatrocinado: mapped.esPatrocinado || false,
                fuentePatrocinio: mapped.fuentePatrocinio || 'Ninguno',
                enfermedades: mapped.enfermedades || '',
                alergias: mapped.alergias || '',
                fotografia: null,
                fechaActualizacionFoto: null,
                persona: {
                    nombres: mapped.persona.nombres || '',
                    apellidos: mapped.persona.apellidos || '',
                    cedula: mapped.persona.cedula || '',
                    telefono1: mapped.persona.telefono1 || '',
                    telefono2: mapped.persona.telefono2 || '',
                    email: mapped.persona.email || '',
                    direccion: mapped.persona.direccion || '',
                    fechaNacimiento: mapped.persona.fechaNacimiento || '',
                },
                tutor: mapped.tutor ? { persona: { nombres: mapped.tutor, apellidos: '' } } : null,
            };
        });

        setInfantes(prev => [...prev, ...newInfantes]);
        setImportOpen(false);
        setImportData([]);
        enqueueSnackbar(`${newInfantes.length} infantes importados correctamente. Completa los datos faltantes manualmente.`, { variant: 'success' });
    };

    const handleDownloadTemplate = () => {
        const template = [
            { Código: 'INF-099', Nombres: 'Juan', Apellidos: 'Pérez', Cédula: '0912345678', Teléfono: '0987654321', Dirección: 'Guayaquil', 'Fecha Nacimiento': '2018-05-15', Programa: 'Ministerio', Patrocinado: 'Si', Patrocinio: 'Compassion', Tutor: 'María Pérez' },
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Infantes');
        XLSX.writeFile(wb, 'plantilla_infantes.xlsx');
    };

    return (
        <MainLayout>
            <Box sx={{ p: { xs: 1.5, md: 0 } }}>
                {/* Hidden file input */}
                <input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFileSelect} />

                {/* ── Header ──────────────────────────────────────── */}
                <Box sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    mb: 3, flexWrap: 'wrap', gap: 2,
                }}>
                    <Box>
                        <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PeopleIcon sx={{ fontSize: 32, color: isDark ? CCO.naranja : CCO.violeta }} />
                            Infantes
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {infantes.length} registrados · {patrocinados} patrocinados · {conFoto} con foto
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1.5}>
                        {canWrite && (
                            <>
                                <Button variant="outlined" startIcon={<ImportIcon />}
                                    onClick={() => fileInputRef.current?.click()}
                                    sx={{ borderRadius: 3, px: 2.5, fontWeight: 600, fontSize: '0.82rem' }}>
                                    Importar Excel
                                </Button>
                                <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/infantes/nuevo')}
                                    sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 700 }}>
                                    Nuevo Infante
                                </Button>
                            </>
                        )}
                    </Stack>
                </Box>

                {/* ── Filtros ─────────────────────────────────────── */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                    <TextField
                        size="small" placeholder="Buscar por nombre, apellido o código..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                        sx={{ flex: 1, minWidth: 220 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                    />
                    <TextField select size="small" label="Patrocinado" value={filtroPat}
                        onChange={(e) => { setFiltroPat(e.target.value); setPage(0); }}
                        sx={{ minWidth: 150 }}>
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="true">Patrocinados</MenuItem>
                        <MenuItem value="false">No patrocinados</MenuItem>
                    </TextField>
                    <TextField select size="small" label="Programa" value={filtroProg}
                        onChange={(e) => { setFiltroProg(e.target.value); setPage(0); }}
                        sx={{ minWidth: 150 }}>
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="Ministerio">Ministerio</MenuItem>
                        <MenuItem value="Comedor">Comedor</MenuItem>
                        <MenuItem value="Ambos">Ambos</MenuItem>
                    </TextField>
                </Stack>

                {/* ── Tabla ───────────────────────────────────────── */}
                <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                    <TableContainer>
                        <Table sx={{ minWidth: 950 }}>
                            <TableHead>
                                <TableRow>
                                    {[
                                        { id: 'foto', label: 'Foto', sort: false, w: 75 },
                                        { id: 'codigo', label: 'Código', sort: true, w: 100 },
                                        { id: 'nombre', label: 'Nombre', sort: true, w: 180 },
                                        { id: 'edad', label: 'Edad', sort: true, w: 70 },
                                        { id: 'tutor', label: 'Tutor', sort: false, w: 150 },
                                        { id: 'patrocinado', label: 'Patrocinado', sort: false, w: 110 },
                                        { id: 'programa', label: 'Programa', sort: false, w: 110 },
                                        { id: 'fotoEstado', label: 'Foto Estado', sort: false, w: 110 },
                                    ].map(col => (
                                        <TableCell key={col.id} sx={{
                                            fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase',
                                            letterSpacing: '0.05em', py: 1.5, minWidth: col.w,
                                        }}>
                                            {col.sort ? (
                                                <TableSortLabel active={orderBy === col.id} direction={orderBy === col.id ? order : 'asc'} onClick={() => handleSort(col.id)}>
                                                    {col.label}
                                                </TableSortLabel>
                                            ) : col.label}
                                        </TableCell>
                                    ))}
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', py: 1.5, minWidth: 100 }} align="right">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                            <Typography color="text.secondary">No se encontraron infantes</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedRows.map((row) => {
                                    const fb = fotoBadge(row.fechaActualizacionFoto);
                                    return (
                                        <TableRow key={row.id} hover sx={{
                                            cursor: 'pointer', transition: 'background .15s',
                                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                                        }} onClick={() => navigate(`/infantes/${row.id}`)}>
                                            {/* Foto */}
                                            <TableCell>
                                                <Badge
                                                    overlap="circular"
                                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                    badgeContent={
                                                        row.fotografia
                                                            ? <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: fb.color, border: '2px solid', borderColor: 'background.paper' }} />
                                                            : <PhotoIcon sx={{ fontSize: 14, color: '#ef5350' }} />
                                                    }
                                                >
                                                    <Avatar
                                                        src={row.fotografia || undefined}
                                                        sx={{
                                                            width: 42, height: 42, fontWeight: 700, fontSize: '0.82rem',
                                                            bgcolor: AVATAR_COLORS[row.id % AVATAR_COLORS.length],
                                                            border: row.fotografia ? `2px solid ${fb.color}` : '2px solid transparent',
                                                        }}
                                                    >
                                                        {getInitials(row)}
                                                    </Avatar>
                                                </Badge>
                                            </TableCell>
                                            {/* Código */}
                                            <TableCell>
                                                <Chip label={row.codigo} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                                            </TableCell>
                                            {/* Nombre */}
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>{row.persona.nombres} {row.persona.apellidos}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{row.persona.telefono1}</Typography>
                                                </Box>
                                            </TableCell>
                                            {/* Edad */}
                                            <TableCell>
                                                {row.persona.fechaNacimiento ? (
                                                    <Chip label={`${calcEdad(row.persona.fechaNacimiento)} años`} size="small"
                                                        sx={{ bgcolor: alpha(CCO.azul, 0.1), color: CCO.azul, fontWeight: 600, fontSize: '0.72rem' }} />
                                                ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                                            </TableCell>
                                            {/* Tutor */}
                                            <TableCell>
                                                <Typography variant="body2" fontSize="0.82rem">
                                                    {row.tutor ? `${row.tutor.persona.nombres} ${row.tutor.persona.apellidos}` : '—'}
                                                </Typography>
                                            </TableCell>
                                            {/* Patrocinado */}
                                            <TableCell>
                                                <Chip label={row.esPatrocinado ? row.fuentePatrocinio : 'No'} size="small"
                                                    color={row.esPatrocinado ? 'success' : 'default'} variant="outlined" sx={{ fontWeight: 600 }} />
                                            </TableCell>
                                            {/* Programa */}
                                            <TableCell>
                                                <Chip label={row.tipoPrograma} size="small" color={PROGRAMA_COLORS[row.tipoPrograma] || 'default'} variant="filled" sx={{ fontWeight: 600 }} />
                                            </TableCell>
                                            {/* Foto Estado */}
                                            <TableCell>
                                                {row.fotografia ? (
                                                    <Tooltip title={`Actualizada: ${fb.text}`}>
                                                        <Chip icon={<PhotoIcon sx={{ fontSize: 14 }} />}
                                                            label={fb.text} size="small"
                                                            sx={{ fontWeight: 600, fontSize: '0.68rem', bgcolor: alpha(fb.color, 0.1), color: fb.color, border: `1px solid ${alpha(fb.color, 0.3)}` }} />
                                                    </Tooltip>
                                                ) : (
                                                    <Chip icon={<PhotoIcon sx={{ fontSize: 14 }} />}
                                                        label="Sin foto" size="small"
                                                        sx={{ fontWeight: 600, fontSize: '0.68rem', bgcolor: alpha('#ef5350', 0.1), color: '#ef5350', border: `1px solid ${alpha('#ef5350', 0.3)}` }} />
                                                )}
                                            </TableCell>
                                            {/* Acciones */}
                                            <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                    <Tooltip title="Ver detalle">
                                                        <IconButton size="small" onClick={() => navigate(`/infantes/${row.id}`)} sx={{ color: 'info.main' }}>
                                                            <ViewIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {canWrite && (
                                                        <Tooltip title="Editar">
                                                            <IconButton size="small" onClick={() => navigate(`/infantes/${row.id}/editar`)} sx={{ color: 'warning.main' }}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {canDelete && (
                                                        <Tooltip title="Eliminar">
                                                            <IconButton size="small" color="error" onClick={() => handleEliminar(row.id)}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div" count={sorted.length} page={page}
                        onPageChange={(_, p) => setPage(p)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        rowsPerPageOptions={[5, 10, 25]}
                        labelRowsPerPage="Filas por página:"
                        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                        sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
                    />
                </Paper>

                {/* ═══════════════════════════════════════════════════════════════
                    DIALOG: Importar desde Excel
                    ═══════════════════════════════════════════════════════════════ */}
                <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="lg" fullWidth
                    PaperProps={{ sx: { borderRadius: 4, maxHeight: '85vh' } }}>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <ImportIcon sx={{ color: CCO.azul }} />
                            <Box>
                                <Typography variant="h6" fontWeight={700}>Importar Infantes desde Excel</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Archivo: <b>{importFileName}</b> · {importData.length} registro{importData.length !== 1 ? 's' : ''} encontrado{importData.length !== 1 ? 's' : ''}
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton onClick={() => setImportOpen(false)} size="small"><CloseIcon /></IconButton>
                    </DialogTitle>
                    <Divider />
                    <DialogContent sx={{ p: 0 }}>
                        <Alert severity="info" sx={{ mx: 3, mt: 2, borderRadius: 2 }}>
                            <Typography variant="body2">
                                <b>Columnas detectadas:</b> {importColumns.join(', ')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                Los campos faltantes (foto, enfermedades, etc.) se podrán completar manualmente después de la importación.
                            </Typography>
                        </Alert>

                        {/* Preview Table */}
                        <TableContainer sx={{ maxHeight: 400, mt: 2 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', bgcolor: isDark ? '#1a1f36' : '#f5f5f5' }}>#</TableCell>
                                        {importColumns.map(col => (
                                            <TableCell key={col} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', bgcolor: isDark ? '#1a1f36' : '#f5f5f5', whiteSpace: 'nowrap' }}>
                                                {col}
                                                {EXCEL_FIELD_MAP[col.toLowerCase().trim()] && (
                                                    <Chip label={`→ ${EXCEL_FIELD_MAP[col.toLowerCase().trim()]}`} size="small"
                                                        sx={{ ml: 0.5, fontSize: '0.6rem', height: 18, bgcolor: alpha(CCO.azul, 0.1), color: CCO.azul }} />
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {importData.slice(0, 50).map((row, idx) => (
                                        <TableRow key={idx} hover>
                                            <TableCell><Typography variant="caption" fontWeight={600}>{idx + 1}</Typography></TableCell>
                                            {importColumns.map(col => (
                                                <TableCell key={col}>
                                                    <Typography variant="body2" fontSize="0.78rem" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {row[col] != null ? String(row[col]) : ''}
                                                    </Typography>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                    {importData.length > 50 && (
                                        <TableRow>
                                            <TableCell colSpan={importColumns.length + 1} align="center" sx={{ py: 2 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    ... y {importData.length - 50} registro{importData.length - 50 !== 1 ? 's' : ''} más
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </DialogContent>
                    <Divider />
                    <DialogActions sx={{ p: 2.5, gap: 1 }}>
                        <Button onClick={() => setImportOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>
                            Cancelar
                        </Button>
                        <Button variant="contained" startIcon={<SuccessIcon />}
                            onClick={handleImportConfirm}
                            sx={{ borderRadius: 3, px: 3, fontWeight: 700 }}>
                            Importar {importData.length} Infante{importData.length !== 1 ? 's' : ''}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </MainLayout>
    );
};

export default InfantesPage;
