import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Grid, Card, CardContent, Avatar, Chip,
    Tab, Tabs, Button, IconButton, Tooltip, Table, TableBody,
    TableCell, TableHead, TableRow, CircularProgress, Alert,
} from '@mui/material';
import { Edit as EditIcon, CameraAlt as CameraIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import { infantesService, asistenciaService } from '../../services/appServices';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

const ESTADO_COLOR = { Presente: 'success', Ausente: 'error', Justificado: 'warning' };

const InfanteDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const fileRef = useRef(null);

    const [infante, setInfante] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tabIndex, setTabIndex] = useState(0);
    const [uploadingFoto, setUploadingFoto] = useState(false);

    const canWrite = ['admin', 'director', 'secretaria', 'tutor_especial'].includes(user?.rol);

    const cargar = async () => {
        try {
            const res = await infantesService.obtener(id);
            setInfante(res.data);
        } catch { enqueueSnackbar('Error cargando infante', { variant: 'error' }); }
        finally { setLoading(false); }
    };

    useEffect(() => { cargar(); }, [id]);

    const handleFotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingFoto(true);
        try {
            await infantesService.subirFoto(id, file);
            enqueueSnackbar('Foto actualizada', { variant: 'success' });
            cargar();
        } catch { enqueueSnackbar('Error subiendo foto', { variant: 'error' }); }
        finally { setUploadingFoto(false); }
    };

    if (loading) return <MainLayout><Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box></MainLayout>;
    if (!infante) return <MainLayout><Box sx={{ p: 4 }}><Alert severity="error">Infante no encontrado</Alert></Box></MainLayout>;

    const p = infante.persona;
    const anio = new Date().getFullYear();

    return (
        <MainLayout>
            <Box sx={{ p: 3 }}>
                {/* Back + Edit */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Button startIcon={<BackIcon />} onClick={() => navigate('/infantes')} variant="outlined" size="small">
                        Volver
                    </Button>
                    {canWrite && (
                        <Button startIcon={<EditIcon />} onClick={() => navigate(`/infantes/${id}/editar`)} variant="contained" size="small">
                            Editar
                        </Button>
                    )}
                </Box>

                {/* Header con foto */}
                <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            {/* Foto */}
                            <Box sx={{ position: 'relative' }}>
                                <Avatar
                                    src={infante.fotografia ? `${API_URL}${infante.fotografia}` : undefined}
                                    sx={{ width: 100, height: 100, fontSize: '2rem', fontWeight: 700, bgcolor: '#7c4dff' }}
                                >
                                    {p?.nombres?.charAt(0)}{p?.apellidos?.charAt(0)}
                                </Avatar>
                                {canWrite && (
                                    <>
                                        <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={handleFotoChange} />
                                        <Tooltip title="Actualizar foto">
                                            <IconButton
                                                size="small"
                                                onClick={() => fileRef.current?.click()}
                                                disabled={uploadingFoto}
                                                sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}
                                            >
                                                {uploadingFoto ? <CircularProgress size={16} /> : <CameraIcon fontSize="small" />}
                                            </IconButton>
                                        </Tooltip>
                                    </>
                                )}
                                {infante.fechaActualizacionFoto && (
                                    <Typography variant="caption" color="text.disabled" display="block" textAlign="center" sx={{ mt: 0.5 }}>
                                        Foto: {new Date(infante.fechaActualizacionFoto).toLocaleDateString()}
                                    </Typography>
                                )}
                            </Box>
                            {/* Datos básicos */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h5" fontWeight={800}>{p?.nombres} {p?.apellidos}</Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                    <Chip label={`Código: ${infante.codigo}`} size="small" />
                                    <Chip label={infante.tipoPrograma} size="small" color="primary" />
                                    <Chip
                                        label={infante.esPatrocinado ? `Patrocinado · ${infante.fuentePatrocinio}` : 'No patrocinado'}
                                        size="small"
                                        color={infante.esPatrocinado ? 'success' : 'default'}
                                    />
                                </Box>
                                {infante.tutor && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Tutor: {infante.tutor.persona?.nombres} {infante.tutor.persona?.apellidos}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 2 }}>
                    <Tab label="Datos Personales" />
                    <Tab label={`Asistencia`} />
                    <Tab label={`Visitas (${infante.visitas?.length || 0})`} />
                    <Tab label={`Regalos (${infante.regalos?.length || 0})`} />
                </Tabs>

                {/* Tab 0: Datos */}
                {tabIndex === 0 && (
                    <Grid container spacing={2}>
                        {[
                            ['Cédula', p?.cedula], ['Teléfono 1', p?.telefono1], ['Teléfono 2', p?.telefono2],
                            ['Email', p?.email], ['Fecha de nacimiento', p?.fechaNacimiento ? new Date(p.fechaNacimiento).toLocaleDateString() : '—'],
                            ['Dirección', p?.direccion], ['Enfermedades', infante.enfermedades], ['Alergias', infante.alergias],
                        ].map(([label, val]) => (
                            <Grid item xs={12} sm={6} key={label}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">{label}</Typography>
                                    <Typography variant="body2">{val || '—'}</Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Tab 1: Asistencia */}
                {tabIndex === 1 && (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Estado</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {infante.asistencias?.length === 0 ? (
                                <TableRow><TableCell colSpan={2}><Alert severity="info">Sin registros de asistencia</Alert></TableCell></TableRow>
                            ) : infante.asistencias?.map(a => (
                                <TableRow key={a.id}>
                                    <TableCell>{new Date(a.fecha).toLocaleDateString()}</TableCell>
                                    <TableCell><Chip label={a.estado} size="small" color={ESTADO_COLOR[a.estado]} /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                {/* Tab 2: Visitas */}
                {tabIndex === 2 && (
                    <>
                        {infante.visitas?.find(v => new Date(v.fecha).getFullYear() === anio)
                            ? <Alert severity="success" sx={{ mb: 2 }}>✅ Visitado en {anio}</Alert>
                            : <Alert severity="warning" sx={{ mb: 2 }}>⚠️ Aún no ha sido visitado en {anio}</Alert>
                        }
                        <Table size="small">
                            <TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Observaciones</TableCell><TableCell>Adjunto</TableCell></TableRow></TableHead>
                            <TableBody>
                                {infante.visitas?.map(v => (
                                    <TableRow key={v.id}>
                                        <TableCell>{new Date(v.fecha).toLocaleDateString()}</TableCell>
                                        <TableCell>{v.observaciones || '—'}</TableCell>
                                        <TableCell>{v.archivoAdjunto ? <a href={`${API_URL}${v.archivoAdjunto}`} target="_blank" rel="noreferrer">Ver archivo</a> : '—'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </>
                )}

                {/* Tab 3: Regalos */}
                {tabIndex === 3 && (
                    <Table size="small">
                        <TableHead><TableRow><TableCell>Año</TableCell><TableCell>Tipo</TableCell><TableCell>Estado</TableCell><TableCell>Fecha Entrega</TableCell></TableRow></TableHead>
                        <TableBody>
                            {infante.regalos?.map(r => (
                                <TableRow key={r.id}>
                                    <TableCell>{r.anio}</TableCell>
                                    <TableCell><Chip label={r.tipo.replace('_', ' ')} size="small" /></TableCell>
                                    <TableCell><Chip label={r.estado} size="small" color={r.estado === 'entregado' ? 'success' : 'warning'} /></TableCell>
                                    <TableCell>{r.fechaEntrega ? new Date(r.fechaEntrega).toLocaleDateString() : '—'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Box>
        </MainLayout>
    );
};

export default InfanteDetailPage;
