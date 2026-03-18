import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box, Typography, TextField, Button, Grid, MenuItem,
    Card, CardContent, alpha, useTheme, Switch, Chip, Avatar, IconButton,
} from '@mui/material';
import { ArrowBack as BackIcon, Save as SaveIcon, PersonAdd as AddPersonIcon, PhotoCamera as CameraIcon, Delete as DeleteIcon, AssignmentInd as IdIcon, ChildCare as ChildIcon, ContactPhone as ContactIcon, CheckCircle as CheckedIcon, RadioButtonUnchecked as UncheckedIcon, Explore as MapIcon } from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import { useSnackbar } from 'notistack';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ─── Paleta CCO ───────────────────────────────────────
const CCO = { amarillo: '#FFD700', naranja: '#FF8C00', violeta: '#6A5ACD', azul: '#4169E1' };



// ─── Auto-generador de código ──────────────────────────
// Formato: EC080200001, EC080200002, ...
const PREFIX = 'EC0802';
const generarCodigo = () => {
    const leer = (k, d) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : d; } catch { return d; } };
    const infantes = leer('cco_infantes_v2', []);
    // Busca el mayor número secuencial ya usado
    let max = 0;
    infantes.forEach(inf => {
        if (inf.codigo && inf.codigo.startsWith(PREFIX)) {
            const num = parseInt(inf.codigo.slice(PREFIX.length), 10);
            if (!isNaN(num) && num > max) max = num;
        }
    });
    return `${PREFIX}${String(max + 1).padStart(5, '0')}`;
};

const EMPTY_FORM = {
    codigo: '',
    foto: '',
    esPatrocinado: false,
    enfermedades: '',
    alergias: '',
    persona: {
        nombres: '', apellidos: '',
        fechaNacimiento: '',
        tutor: '',
        cuidador: '',
        telefono: '',
        telefono2: '',
        email: '',
        direccion: '',
        ubicacionGps: '',
        cedula: '',
    },
};

// ─── Datos mock para edición ───────────────────────────
const MOCK = {
    1: {
        codigo: 'EC080200001', foto: '', esPatrocinado: true,
        enfermedades: 'Ninguna conocida', alergias: 'Ninguna',
        persona: {
            nombres: 'María Fernanda', apellidos: 'Chamba Condo',
            fechaNacimiento: '2012-03-31', tutor: 'Fisma',
            cuidador: 'María Magdalene Condo Sinalima',
            telefono: '098 563 3054', telefono2: '', email: '',
            direccion: 'Antofagasta, Menfi Central', ubicacionGps: '-4.0041,-79.2084', cedula: '',
        },
    },
};

// ─── Componentes de Mapa ─────────────────────────────
const LocationMarker = ({ positionStr, setPositionStr }) => {
    let pos = null;
    if (positionStr && positionStr.includes(',')) {
        const parts = positionStr.split(',');
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            pos = { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) };
        }
    }
    useMapEvents({
        click(e) {
            setPositionStr(`${e.latlng.lat}, ${e.latlng.lng}`);
        },
    });
    return pos === null ? null : <Marker position={pos} />;
};

const MapUpdater = ({ positionStr }) => {
    const map = useMap();
    useEffect(() => {
        if (positionStr && positionStr.includes(',')) {
            const parts = positionStr.split(',');
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                map.flyTo([parseFloat(parts[0]), parseFloat(parts[1])], map.getZoom(), { duration: 1.5 });
            }
        }
    }, [positionStr, map]);
    return null;
};

const InfanteFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { enqueueSnackbar } = useSnackbar();
    const isEditing = !!id;

    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [obteniendoGps, setObteniendoGps] = useState(false);
    const fotoRef = useRef();

    const handleFoto = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => set('foto', ev.target.result);
        reader.readAsDataURL(file);
    };

    const obtenerUbicacion = () => {
        if (!navigator.geolocation) {
            enqueueSnackbar('Geolocalización no soportada en este navegador', { variant: 'error' });
            return;
        }
        setObteniendoGps(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setP('ubicacionGps', `${pos.coords.latitude}, ${pos.coords.longitude}`);
                setObteniendoGps(false);
                enqueueSnackbar('Ubicación capturada correctamente', { variant: 'success' });
            },
            (err) => {
                console.error(err);
                setObteniendoGps(false);
                enqueueSnackbar('Error al obtener la ubicación. Da permisos al navegador.', { variant: 'error' });
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    useEffect(() => {
        if (isEditing) {
            const data = MOCK[id];
            if (data) { setForm(data); return; }
            // fallback genérico
            setForm({
                ...EMPTY_FORM,
                codigo: `${PREFIX}${String(id).padStart(5, '0')}`,
                esPatrocinado: Number(id) % 2 === 0,
                persona: {
                    ...EMPTY_FORM.persona,
                    nombres: ['Camila', 'Sebastián', 'Valentina'][Number(id) % 3],
                    apellidos: ['Torres', 'Morales', 'Cedeño'][Number(id) % 3],
                    fechaNacimiento: '2018-06-15',
                    tutor: 'Tutor ejemplo',
                    cuidador: 'Representante ejemplo',
                    telefono: '0987654321',
                    direccion: 'Guayaquil',
                    cedula: `095${id}234567`,
                },
            });
        } else {
            // Nuevo: auto-generar código
            setForm(f => ({ ...f, codigo: generarCodigo() }));
        }
    }, [id, isEditing]);

    const set  = (field, val) => setForm(f => ({ ...f, [field]: val }));
    const setP = (field, val) => setForm(f => ({ ...f, persona: { ...f.persona, [field]: val } }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        // Guardar en localStorage (mock persistence)
        const leer = (k, d) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : d; } catch { return d; } };
        const infantes = leer('cco_infantes_v2', []);
        if (isEditing) {
            const idx = infantes.findIndex(i => String(i.id) === String(id) || i.codigo === form.codigo);
            if (idx >= 0) infantes[idx] = { ...infantes[idx], ...form };
            else infantes.push({ id: Number(id), ...form });
        } else {
            infantes.push({ id: Date.now(), ...form });
        }
        localStorage.setItem('cco_infantes_v2', JSON.stringify(infantes));

        await new Promise(r => setTimeout(r, 500));
        setSaving(false);
        enqueueSnackbar(isEditing ? 'Infante actualizado' : 'Infante creado', { variant: 'success' });
        navigate(isEditing ? `/infantes/${id}` : '/infantes');
    };

    // Calcular edad automáticamente
    const calcEdad = () => {
        if (!form.persona.fechaNacimiento) return null;
        const hoy = new Date();
        const nac = new Date(form.persona.fechaNacimiento);
        let anios = hoy.getFullYear() - nac.getFullYear();
        let meses = hoy.getMonth() - nac.getMonth();
        if (meses < 0) { anios--; meses += 12; }
        if (anios < 0) return null;
        return `${anios} años y ${meses} meses`;
    };
    const edad = calcEdad();

    return (
        <MainLayout>
            <Box component="form" onSubmit={handleSubmit} sx={{ p: { xs: 1.5, md: 0 }, maxWidth: 960, mx: 'auto' }}>

                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} variant="outlined" size="small" sx={{ borderRadius: 2, mb: 1 }}>
                            Volver
                        </Button>
                        <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AddPersonIcon sx={{ fontSize: 32, color: isDark ? CCO.naranja : CCO.violeta }} />
                            {isEditing ? 'Editar Infante' : 'Nuevo Infante'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {isEditing ? `Editando registro ${form.codigo}` : 'Completa los datos del nuevo infante'}
                        </Typography>
                    </Box>
                    <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving}
                        sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 700 }}>
                        {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                </Box>

                {/* ── Sección 1: Identificación ─────────────────────── */}
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 4, mb: 3, overflow: 'hidden' }}>
                    <Box sx={{ height: 5, background: `linear-gradient(90deg, ${CCO.azul}, ${CCO.violeta})` }} />
                    <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                            <IdIcon sx={{ color: CCO.azul, fontSize: 20 }} />
                            <Typography variant="subtitle1" fontWeight={700}>Identificación del Infante</Typography>
                        </Box>
                        <Grid container spacing={2.5}>

                            {/* Código del infante — siempre editable */}
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Código del Infante" value={form.codigo}
                                    onChange={e => set('codigo', e.target.value)}
                                    size="small"
                                    helperText="Formato: EC0802XXXXX"
                                    sx={{ '& input': { fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 } }}
                                />
                            </Grid>


                            {/* Patrocinio — switch simple */}
                            <Grid item xs={12} sm={6}>
                                <Box sx={{
                                    border: `1.5px solid`,
                                    borderColor: form.esPatrocinado ? alpha('#4caf50', 0.5) : theme.palette.divider,
                                    borderRadius: 2.5, px: 2, py: 1,
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    bgcolor: form.esPatrocinado ? alpha('#4caf50', 0.06) : 'transparent',
                                    transition: 'all .2s ease', cursor: 'pointer',
                                    height: '100%', minHeight: 48,
                                }} onClick={() => set('esPatrocinado', !form.esPatrocinado)}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {form.esPatrocinado
                                            ? <CheckedIcon sx={{ color: 'success.main', fontSize: 20 }} />
                                            : <UncheckedIcon sx={{ color: 'text.disabled', fontSize: 20 }} />}
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}
                                                color={form.esPatrocinado ? 'success.main' : 'text.secondary'}>
                                                {form.esPatrocinado ? 'Patrocinado' : 'No Patrocinado'}
                                            </Typography>
                                            <Typography variant="caption" color="text.disabled">Toca para cambiar</Typography>
                                        </Box>
                                    </Box>
                                    <Switch checked={form.esPatrocinado} onChange={e => { e.stopPropagation(); set('esPatrocinado', e.target.checked); }} color="success" />
                                </Box>
                            </Grid>

                            {/* Foto del infante */}
                            <Grid item xs={12}>
                                <Typography variant="body2" fontWeight={700} sx={{ mb: 1.5 }}>Foto del Infante</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                                    <Avatar
                                        src={form.foto || undefined}
                                        sx={{
                                            width: 100, height: 100, border: `2px dashed`,
                                            borderColor: form.foto ? alpha(CCO.violeta, 0.5) : theme.palette.divider,
                                            bgcolor: form.foto ? 'transparent' : alpha(CCO.azul, 0.06),
                                        }}
                                    >
                                        {!form.foto && <ChildIcon sx={{ fontSize: 44, color: alpha(CCO.azul, 0.4) }} />}
                                    </Avatar>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <input ref={fotoRef} type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
                                        <Button variant="outlined" startIcon={<CameraIcon />}
                                            onClick={() => fotoRef.current?.click()}
                                            size="small" sx={{ borderRadius: 2, fontWeight: 700 }}>
                                            {form.foto ? 'Cambiar foto' : 'Subir foto'}
                                        </Button>
                                        {form.foto && (
                                            <Button variant="text" color="error" startIcon={<DeleteIcon />}
                                                onClick={() => set('foto', '')} size="small"
                                                sx={{ borderRadius: 2, fontWeight: 700 }}>
                                                Quitar foto
                                            </Button>
                                        )}
                                        <Typography variant="caption" color="text.disabled">
                                            JPG, PNG o WEBP · Máx. 5 MB
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>

                            {/* Enfermedades y alergias */}
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Enfermedades" value={form.enfermedades}
                                    onChange={e => set('enfermedades', e.target.value)} size="small" multiline rows={2}
                                    placeholder="Ninguna conocida..." />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Alergias" value={form.alergias}
                                    onChange={e => set('alergias', e.target.value)} size="small" multiline rows={2}
                                    placeholder="Ninguna conocida..." />
                            </Grid>

                        </Grid>
                    </CardContent>
                </Card>

                {/* ── Sección 2: Datos del Niño ────────────────────── */}
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 4, mb: 3, overflow: 'hidden' }}>
                    <Box sx={{ height: 5, background: `linear-gradient(90deg, ${CCO.naranja}, ${CCO.amarillo})` }} />
                    <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ChildIcon sx={{ color: CCO.naranja, fontSize: 20 }} />
                                <Typography variant="subtitle1" fontWeight={700}>Datos del Niño / Niña</Typography>
                            </Box>
                            {edad && (
                                <Chip label={edad} size="small"
                                    sx={{ fontWeight: 700, bgcolor: alpha(CCO.violeta, 0.12), color: CCO.violeta }} />
                            )}
                        </Box>
                        <Grid container spacing={2.5}>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Nombres *" value={form.persona.nombres}
                                    onChange={e => setP('nombres', e.target.value)} required size="small" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Apellidos *" value={form.persona.apellidos}
                                    onChange={e => setP('apellidos', e.target.value)} required size="small" />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Fecha de Nacimiento" type="date" value={form.persona.fechaNacimiento}
                                    onChange={e => setP('fechaNacimiento', e.target.value)} size="small"
                                    slotProps={{ inputLabel: { shrink: true } }} />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Cédula" value={form.persona.cedula}
                                    onChange={e => setP('cedula', e.target.value)} size="small" placeholder="0900000000" />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Tutor" value={form.persona.tutor}
                                    onChange={e => setP('tutor', e.target.value)} size="small"
                                    placeholder="Nombre del tutor" />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* ── Sección 3: Cuidador / Contacto ────────────────── */}
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 4, mb: 3, overflow: 'hidden' }}>
                    <Box sx={{ height: 5, background: `linear-gradient(90deg, ${CCO.violeta}, ${CCO.azul})` }} />
                    <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                            <ContactIcon sx={{ color: CCO.violeta, fontSize: 20 }} />
                            <Typography variant="subtitle1" fontWeight={700}>Cuidador y Contacto</Typography>
                        </Box>
                        <Grid container spacing={2.5}>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Cuidador / Representante" value={form.persona.cuidador}
                                    onChange={e => setP('cuidador', e.target.value)} size="small"
                                    placeholder="Nombre completo del cuidador" />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField fullWidth label="Teléfono *" value={form.persona.telefono}
                                    onChange={e => setP('telefono', e.target.value)} required size="small"
                                    placeholder="098 563 3054" />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField fullWidth label="Teléfono 2" value={form.persona.telefono2}
                                    onChange={e => setP('telefono2', e.target.value)} size="small" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Email" value={form.persona.email}
                                    onChange={e => setP('email', e.target.value)} type="email" size="small" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Dirección" value={form.persona.direccion}
                                    onChange={e => setP('direccion', e.target.value)} size="small"
                                    placeholder="Sector, calle, referencia..." />
                            </Grid>

                            {/* Google Maps GPS */}
                            {/* Selector de Mapa interactivo */}
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                    <Typography variant="body2" fontWeight={700}>Ubicación Interactiva (Pincha en el mapa)</Typography>
                                    <Button variant="outlined" size="small" startIcon={<MapIcon />} 
                                        onClick={obtenerUbicacion} disabled={obteniendoGps}
                                        sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
                                        {obteniendoGps ? 'Ubicando...' : 'Obtener mi ubicación'}
                                    </Button>
                                </Box>
                                <TextField fullWidth value={form.persona.ubicacionGps || ''}
                                    onChange={e => setP('ubicacionGps', e.target.value)} size="small"
                                    placeholder="Da clic en el mapa para generar coordenadas, o pega un link"
                                    sx={{ mb: 2 }} />
                                
                                <Box sx={{ width: '100%', height: 320, borderRadius: 3, overflow: 'hidden', border: `1px solid ${theme.palette.divider}`, position: 'relative', zIndex: 0 }}>
                                    <MapContainer 
                                        center={
                                            form.persona.ubicacionGps && form.persona.ubicacionGps.includes(',') && !isNaN(parseFloat(form.persona.ubicacionGps.split(',')[0]))
                                            ? { lat: parseFloat(form.persona.ubicacionGps.split(',')[0]), lng: parseFloat(form.persona.ubicacionGps.split(',')[1]) }
                                            : { lat: -3.997809, lng: -79.222595 } // Loja, Ecuador por defecto
                                        } 
                                        zoom={14} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                                        <MapUpdater positionStr={form.persona.ubicacionGps} />
                                        <LocationMarker positionStr={form.persona.ubicacionGps} setPositionStr={(val) => setP('ubicacionGps', val)} />
                                    </MapContainer>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Botones finales */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={() => navigate(-1)} color="inherit" sx={{ borderRadius: 2 }}>Cancelar</Button>
                    <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving}
                        sx={{ borderRadius: 3, px: 4, py: 1.2, fontWeight: 700 }}>
                        {saving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Infante'}
                    </Button>
                </Box>

            </Box>
        </MainLayout>
    );
};

export default InfanteFormPage;
