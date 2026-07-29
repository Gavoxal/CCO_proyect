import { useState, useEffect, useRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, MenuItem, Box, Typography,
    IconButton, Divider, Stack, Grid, Avatar, alpha, useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/DeleteOutline';

export default function EditRegaloModal({ open, item, onSave, onClose, getImageUrl }) {
    const theme = useTheme();
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        estado: 'pendiente',
        fechaEntrega: '',
        observaciones: '',
        anio: ''
    });

    const [file, setFile] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(null);

    useEffect(() => {
        if (item) {
            setFormData({
                estado: item.estado || 'pendiente',
                fechaEntrega: item.fechaEntrega ? item.fechaEntrega.split('T')[0] : '',
                observaciones: item.observaciones || '',
                anio: item.anio || new Date().getFullYear()
            });
            setFile(null);
            setFotoPreview(null);
        }
    }, [item]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFotoPreview(URL.createObjectURL(selectedFile));
            if (formData.estado === 'pendiente') {
                setFormData(prev => ({ ...prev, estado: 'entregado' }));
                if (!formData.fechaEntrega) {
                    setFormData(prev => ({ ...prev, fechaEntrega: new Date().toISOString().split('T')[0] }));
                }
            }
        }
    };

    const handleRemoveNewFoto = () => {
        setFile(null);
        setFotoPreview(null);
    };

    const handleSave = () => {
        onSave(item.id, formData, file);
    };

    if (!item) return null;

    const currentPhotoUrl = item.foto ? getImageUrl(item.foto) : null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={800}>Editar Registro</Typography>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileChange}
                />

                <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">INFANTE</Typography>
                    <Typography variant="body1" fontWeight={700}>
                        {item.infante?.persona?.nombres} {item.infante?.persona?.apellidos}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Código: {item.infante?.codigo}</Typography>
                </Box>

                <Stack spacing={3}>
                    {/* Sección de Fotografía */}
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 1, textTransform: 'uppercase' }}>
                            Evidencia Fotográfica
                        </Typography>
                        <Box sx={{ 
                            position: 'relative', 
                            width: '100%', 
                            height: 180, 
                            borderRadius: 3, 
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                        }} onClick={() => fileInputRef.current?.click()}>
                            
                            {(fotoPreview || currentPhotoUrl) ? (
                                <>
                                    <img 
                                        src={fotoPreview || currentPhotoUrl} 
                                        alt="Evidencia" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    />
                                    <Box sx={{ 
                                        position: 'absolute', 
                                        bottom: 8, 
                                        right: 8, 
                                        display: 'flex', 
                                        gap: 1 
                                    }}>
                                        {fotoPreview && (
                                            <IconButton 
                                                size="small" 
                                                onClick={(e) => { e.stopPropagation(); handleRemoveNewFoto(); }}
                                                sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                        <IconButton 
                                            size="small" 
                                            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                                        >
                                            <PhotoCameraIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </>
                            ) : (
                                <>
                                    <PhotoCameraIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1, opacity: 0.5 }} />
                                    <Typography variant="body2" color="primary" fontWeight={600}>Subir Fotografía</Typography>
                                    <Typography variant="caption" color="text.secondary">Haz clic para seleccionar</Typography>
                                </>
                            )}
                        </Box>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                label="Estado"
                                name="estado"
                                value={formData.estado}
                                onChange={handleChange}
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            >
                                <MenuItem value="pendiente">Pendiente</MenuItem>
                                <MenuItem value="entregado">Entregado</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                type="number"
                                fullWidth
                                label="Año/Gestión"
                                name="anio"
                                value={formData.anio}
                                onChange={handleChange}
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>
                    </Grid>

                    {formData.estado === 'entregado' && (
                        <TextField
                            fullWidth
                            type="date"
                            label="Fecha de Entrega"
                            name="fechaEntrega"
                            value={formData.fechaEntrega}
                            onChange={handleChange}
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                    )}

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Observaciones"
                        name="observaciones"
                        value={formData.observaciones}
                        onChange={handleChange}
                        size="small"
                        placeholder="Añade notas sobre la entrega o errores corregidos..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button variant="outlined" onClick={onClose} color="inherit" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>Cancelar</Button>
                <Button 
                    variant="contained" 
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}
                >
                    Guardar Cambios
                </Button>
            </DialogActions>
        </Dialog>
    );
}
