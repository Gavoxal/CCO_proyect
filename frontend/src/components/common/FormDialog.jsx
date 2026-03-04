import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, MenuItem, Grid, Box, IconButton, Typography,
    alpha, useTheme, CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Autocomplete } from '@mui/material';
import { useState, useEffect } from 'react';

const FormDialog = ({
    open,
    onClose,
    onSubmit,
    title,
    fields = [],
    initialValues = {},
    submitLabel = 'Guardar',
    loading = false,
    maxWidth = 'sm',
}) => {
    const theme = useTheme();
    const [values, setValues] = useState({});
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) {
            const defaults = {};
            fields.forEach((f) => {
                defaults[f.name] = initialValues[f.name] ?? f.defaultValue ?? '';
            });
            setValues(defaults);
            setErrors({});
        }
    }, [open, initialValues, fields]);

    const handleChange = (name, value) => {
        setValues((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        fields.forEach((f) => {
            if (f.required && !values[f.name] && values[f.name] !== 0) {
                newErrors[f.name] = 'Este campo es requerido';
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(values);
        }
    };

    const renderField = (field) => {
        if (field.type === 'select') {
            return (
                <TextField
                    select
                    label={field.label}
                    name={field.name}
                    value={values[field.name] ?? ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    fullWidth
                    size="small"
                    required={field.required}
                    error={!!errors[field.name]}
                    helperText={errors[field.name]}
                    disabled={field.disabled}
                >
                    {(field.options || []).map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </MenuItem>
                    ))}
                </TextField>
            );
        }

        if (field.type === 'autocomplete') {
            return (
                <Autocomplete
                    freeSolo
                    options={field.options || []}
                    value={values[field.name] ?? ''}
                    onChange={(_, newValue) => {
                        handleChange(field.name, newValue ?? '');
                        field.onChange?.(newValue ?? '');
                    }}
                    onInputChange={(_, newInput) => {
                        handleChange(field.name, newInput);
                        field.onChange?.(newInput);
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={field.label}
                            size="small"
                            required={field.required}
                            error={!!errors[field.name]}
                            helperText={errors[field.name] || field.helperText}
                            disabled={field.disabled}
                            placeholder={field.placeholder}
                        />
                    )}
                />
            );
        }

        if (field.type === 'custom') {
            return <Box>{field.render({ values, handleChange, errors })}</Box>;
        }

        return (
            <TextField
                label={field.label}
                name={field.name}
                type={field.type || 'text'}
                value={values[field.name] ?? ''}
                onChange={(e) =>
                    handleChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)
                }
                fullWidth
                size="small"
                required={field.required}
                error={!!errors[field.name]}
                helperText={errors[field.name]}
                multiline={field.multiline}
                rows={field.rows || 1}
                disabled={field.disabled}
                InputProps={field.InputProps}
                placeholder={field.placeholder}
            />
        );
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    background: theme.palette.mode === 'dark'
                        ? `linear-gradient(145deg, ${alpha('#0d2137', 0.98)} 0%, ${alpha('#132f4c', 0.95)} 100%)`
                        : undefined,
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 1,
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {title}
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        {fields.map((field) => (
                            <Grid
                                key={field.name}
                                size={{
                                    xs: 12,
                                    sm: field.fullWidth ? 12 : 6,
                                }}
                            >
                                {renderField(field)}
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={onClose} variant="outlined" color="inherit" disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
                    >
                        {submitLabel}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default FormDialog;
