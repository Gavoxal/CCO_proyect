import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, TextField, Stack, IconButton, Avatar, 
    Grid, Card, CardContent, InputAdornment, Divider, Paper,
    CircularProgress, Chip, alpha, Container, Tooltip, Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Badge as BadgeIcon,
    LocalPhone as PhoneIcon,
    Home as HomeIcon,
    Work as WorkIcon,
    PhotoCamera as PhotoIcon,
    Lock as LockIcon,
    Visibility as ShowIcon,
    VisibilityOff as HideIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import { usuariosService } from '../../services/appServices';



const ROLES = {
    admin: { label: 'Administrador', color: '#7c4dff' },
    director: { label: 'Director', color: '#00bcd4' },
    secretaria: { label: 'Secretaría', color: '#4caf50' },
    tutor_especial: { label: 'Tutor Especial', color: '#ff9800' },
    tutor: { label: 'Tutor', color: '#9e9e9e' },
};

export default function ProfilePage() {
    const theme = useTheme();
    const { user, updateUser } = useAuth();
    const { enqueueSnackbar } = useSnackbar();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const [form, setForm] = useState({
        nombres: '', apellidos: '', cedula: '', telefono1: '', direccion: '',
        email: '', profesion: '', password: '', confirmarPassword: '',
        foto: null, previewUrl: null
    });

    const [errors, setErrors] = useState({});

    const cargarPerfil = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const res = await usuariosService.obtener(user.id);
            const data = res.data;
            setForm({
                nombres: data.persona?.nombres || '',
                apellidos: data.persona?.apellidos || '',
                cedula: data.persona?.cedula || '',
                telefono1: data.persona?.telefono1 || '',
                direccion: data.persona?.direccion || '',
                email: data.email || '',
                profesion: data.persona?.tutor?.profesion || '',
                password: '', confirmarPassword: '',
                foto: null,
                previewUrl: data.persona?.tutor?.fotografia ? getImageUrl(data.persona.tutor.fotografia) : null
            });
        } catch (error) {
            enqueueSnackbar('Error al cargar perfil', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [user?.id, enqueueSnackbar]);

    useEffect(() => { cargarPerfil(); }, [cargarPerfil]);

    useEffect(() => {
        if (user?.passwordExpired) {
            setEditing(true);
        }
    }, [user?.passwordExpired]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm(f => ({ ...f, foto: file, previewUrl: URL.createObjectURL(file) }));
        }
    };

    const validate = () => {
        const errs = {};
        if (!form.nombres.trim()) errs.nombres = 'Campo requerido';
        if (!form.apellidos.trim()) errs.apellidos = 'Campo requerido';
        if (!form.email.trim()) errs.email = 'Campo requerido';
        if (form.password) {
            const robustPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;
            if (!robustPass.test(form.password)) {
                errs.password = 'La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y un carácter especial (@$!%*?&.)';
            }
            if (form.password !== form.confirmarPassword) errs.confirmarPassword = 'Las contraseñas no coinciden';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const updateData = {
                email: form.email,
                profesion: form.profesion || undefined,
                persona: {
                    nombres: form.nombres,
                    apellidos: form.apellidos,
                    cedula: form.cedula,
                    telefono1: form.telefono1,
                    direccion: form.direccion,
                }
            };
            if (form.password) updateData.password = form.password;
            await usuariosService.actualizar(user.id, updateData);
            if (form.foto) await usuariosService.subirFoto(user.id, form.foto);

            enqueueSnackbar('Perfil actualizado con éxito', { variant: 'success' });
            updateUser({
                nombre: `${form.nombres} ${form.apellidos}`,
                email: form.email,
                passwordExpired: false
            });
            setEditing(false);
            setForm(f => ({ ...f, password: '', confirmarPassword: '' }));
            cargarPerfil();
        } catch (error) {
            enqueueSnackbar(error.response?.data?.error || 'Error al guardar cambios', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const rolCfg = ROLES[user?.rol] || ROLES.tutor;

    if (loading) return (
        <MainLayout>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        </MainLayout>
    );

    const handleToggleEdit = () => {
        if (editing && user?.passwordExpired) {
            enqueueSnackbar('Debes actualizar tu contraseña para continuar utilizando el sistema', { variant: 'error' });
            return;
        }
        setEditing(!editing);
    };

    return (
        <MainLayout>
            <Container maxWidth="md" sx={{ py: { xs: 2, md: 5 } }}>
                
                {/* ─── Hero Section ────────────────────────────────────────── */}
                <Paper elevation={0} sx={{ 
                    borderRadius: '24px', overflow: 'hidden', border: '1px solid', borderColor: 'divider',
                    mb: 4, position: 'relative', bgcolor: 'background.paper'
                }}>
                    {/* Banner */}
                    <Box sx={{ 
                        height: { xs: 120, md: 180 }, 
                        background: `linear-gradient(135deg, ${rolCfg.color} 0%, ${alpha(rolCfg.color, 0.4)} 100%)`,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 4
                    }}>
                        <Box>
                            <Typography variant="h4" fontWeight={900} letterSpacing="-0.5px">Mi Perfil</Typography>
                            <Typography variant="body2" color="text.secondary">Gestiona tu información personal y de cuenta</Typography>
                        </Box>
                        <Stack direction="row" spacing={2}>
                            {user?.passwordExpired && (
                                <Alert severity="error" sx={{ borderRadius: '12px', fontWeight: 700 }}>
                                    ¡Contraseña Expirada! Debes actualizarla.
                                </Alert>
                            )}
                            <Button 
                                variant={editing ? "outlined" : "contained"}
                                startIcon={editing ? (user?.passwordExpired ? <LockIcon /> : <CloseIcon />) : (saving ? <CircularProgress size={20} color="inherit" /> : <EditIcon />)}
                                onClick={handleToggleEdit}
                                sx={{ 
                                    borderRadius: '12px', bgcolor: 'background.paper', color: 'text.primary',
                                    fontWeight: 800, textTransform: 'none', px: 2,
                                    '&:hover': { bgcolor: alpha(theme.palette.background.paper, 0.9) },
                                    boxShadow: theme.shadows[4]
                                }}
                            >
                                {editing ? 'Cancelar' : 'Editar Perfil'}
                            </Button>
                        </Stack>
                    </Box>

                    {/* Avatar y Nombre Central */}
                    <Box sx={{ textAlign: 'center', mt: -8, pb: 4, px: 3, position: 'relative' }}>
                        <Box sx={{ position: 'relative', display: 'inline-block' }}>
                            <Avatar 
                                src={form.previewUrl ? (form.previewUrl.startsWith('blob:') ? form.previewUrl : getImageUrl(form.previewUrl)) : undefined}
                                sx={{ 
                                    width: { xs: 120, md: 160 }, height: { xs: 120, md: 160 }, 
                                    border: '6px solid', borderColor: 'background.paper',
                                    boxShadow: theme.shadows[10],
                                    background: `linear-gradient(135deg, ${rolCfg.color} 0%, ${alpha(rolCfg.color, 0.6)} 100%)`,
                                    fontSize: 64, fontWeight: 900
                                }}
                            >
                                {!form.previewUrl && form.nombres.charAt(0)}
                            </Avatar>
                            {editing && (
                                <Tooltip title="Cambiar fotografía" arrow>
                                    <IconButton 
                                        component="label" size="medium"
                                        sx={{ 
                                            position: 'absolute', bottom: 10, right: 10, 
                                            bgcolor: theme.palette.primary.main, color: 'white',
                                            '&:hover': { bgcolor: theme.palette.primary.dark },
                                            boxShadow: 4, border: '3px solid white'
                                        }}
                                    >
                                        <PhotoIcon />
                                        <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>

                        <Typography variant="h4" fontWeight={900} sx={{ mt: 2, letterSpacing: '-0.5px' }}>
                            {form.nombres} {form.apellidos}
                        </Typography>
                        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mt: 1 }}>
                            <Chip 
                                label={rolCfg.label} 
                                sx={{ 
                                    bgcolor: alpha(rolCfg.color, 0.1), color: rolCfg.color, 
                                    fontWeight: 800, px: 2, height: 28, fontSize: '0.75rem'
                                }} 
                            />
                            <Typography variant="body2" color="text.secondary">· {form.email}</Typography>
                        </Stack>
                    </Box>
                </Paper>

                {/* ─── Contenido en Stack Unificado ────────────────────────────── */}
                <Stack spacing={3}>
                    
                    {/* Tarjeta 1: Información de Cuenta */}
                    <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider' }} elevation={0}>
                        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                            <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <BadgeIcon color="primary" /> Información de Usuario
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <TextField 
                                        fullWidth label="Nombres" name="nombres" value={form.nombres} 
                                        onChange={handleChange} disabled={!editing} error={!!errors.nombres} helperText={errors.nombres}
                                        variant="outlined" size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField 
                                        fullWidth label="Apellidos" name="apellidos" value={form.apellidos} 
                                        onChange={handleChange} disabled={!editing} error={!!errors.apellidos} helperText={errors.apellidos}
                                        variant="outlined" size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField 
                                        fullWidth label="Correo Electrónico" name="email" value={form.email} 
                                        onChange={handleChange} disabled={!editing} error={!!errors.email} helperText={errors.email}
                                        size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                    />
                                </Grid>
                                {(user?.rol === 'tutor' || user?.rol === 'tutor_especial') && (
                                    <Grid item xs={12} sm={6}>
                                        <TextField 
                                            fullWidth label="Cargo / Profesión" name="profesion" value={form.profesion} 
                                            onChange={handleChange} disabled={!editing}
                                            size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Tarjeta 2: Datos de Contacto */}
                    <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider' }} elevation={0}>
                        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                            <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <PersonIcon color="primary" /> Datos de Identidad y Contacto
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <TextField 
                                        fullWidth label="Cédula de Identidad" name="cedula" value={form.cedula} 
                                        onChange={handleChange} disabled={!editing}
                                        size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField 
                                        fullWidth label="Teléfono / Celular" name="telefono1" value={form.telefono1} 
                                        onChange={handleChange} disabled={!editing}
                                        size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField 
                                        fullWidth label="Dirección Domiciliaria" name="direccion" value={form.direccion} 
                                        onChange={handleChange} disabled={!editing}
                                        size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Tarjeta 3: Seguridad */}
                    <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider' }} elevation={0}>
                        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                            <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <LockIcon color="primary" /> Seguridad de la Cuenta
                            </Typography>
                            {editing ? (
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField 
                                            fullWidth label="Nueva Contraseña" name="password" type={showPass ? "text" : "password"} value={form.password} 
                                            onChange={handleChange} placeholder="Mínimo 6 caracteres"
                                            error={!!errors.password} helperText={errors.password}
                                            size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton size="small" onClick={() => setShowPass(!showPass)}>
                                                            {showPass ? <HideIcon fontSize="small" /> : <ShowIcon fontSize="small" />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                )
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField 
                                            fullWidth label="Confirmar Contraseña" name="confirmarPassword" type={showPass ? "text" : "password"} value={form.confirmarPassword} 
                                            onChange={handleChange} error={!!errors.confirmarPassword} helperText={errors.confirmarPassword}
                                            size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                        />
                                    </Grid>
                                </Grid>
                            ) : (
                                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.03), borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                                    <Typography variant="body2" color="text.secondary" textAlign="center">
                                        Las credenciales de acceso están protegidas. Cambia al modo edición para actualizar tu contraseña.
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* Botón de Guardado (Solo en edición) */}
                    {editing && (
                        <Box sx={{ pt: 2, display: 'flex', justifyContent: 'center' }}>
                            <Button 
                                variant="contained" size="large"
                                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                onClick={handleSave} disabled={saving}
                                sx={{ 
                                    borderRadius: '16px', px: 8, py: 1.8, fontSize: '1rem', fontWeight: 900,
                                    textTransform: 'none',
                                    boxShadow: `0 12px 30px ${alpha(rolCfg.color, 0.4)}`,
                                    background: `linear-gradient(135deg, ${rolCfg.color} 0%, ${alpha(rolCfg.color, 0.8)} 100%)`,
                                    '&:hover': { background: `linear-gradient(135deg, ${rolCfg.color} 0%, ${rolCfg.color} 100%)`, transform: 'translateY(-2px)' }
                                }}
                            >
                                {saving ? 'Guardando cambios...' : 'Guardar Perfil'}
                            </Button>
                        </Box>
                    )}
                </Stack>
            </Container>
        </MainLayout>
    );
}
