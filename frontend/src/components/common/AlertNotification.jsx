import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Alert,
    alpha,
    useTheme,
    Slide,
} from '@mui/material';
import {
    CheckCircle as SuccessIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { forwardRef } from 'react';

const Transition = forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const variantConfig = {
    success: {
        icon: SuccessIcon,
        color: 'success',
        title: '¡Éxito!',
    },
    warning: {
        icon: WarningIcon,
        color: 'warning',
        title: 'Advertencia',
    },
    error: {
        icon: ErrorIcon,
        color: 'error',
        title: 'Error',
    },
    info: {
        icon: InfoIcon,
        color: 'info',
        title: 'Información',
    },
};

/**
 * AlertNotification — Componente reutilizable de alerta/confirmación modal.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onConfirm: () => void  (si se pasa, muestra botón de confirmación)
 *  - variant: 'success' | 'warning' | 'error' | 'info'
 *  - title: string
 *  - message: string | ReactNode
 *  - confirmLabel: string (default: 'Confirmar')
 *  - cancelLabel: string (default: 'Cancelar')
 *  - children: ReactNode (contenido adicional debajo del mensaje)
 */
const AlertNotification = ({
    open,
    onClose,
    onConfirm,
    variant = 'info',
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cerrar',
    children,
}) => {
    const theme = useTheme();
    const config = variantConfig[variant] || variantConfig.info;
    const Icon = config.icon;
    const color = theme.palette[config.color];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            TransitionComponent={Transition}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: `1px solid ${alpha(color.main, 0.25)}`,
                },
            }}
        >
            {/* Franja de color superior */}
            <Box
                sx={{
                    height: 6,
                    background: `linear-gradient(90deg, ${color.main}, ${color.light || color.main})`,
                }}
            />

            <DialogTitle sx={{ pt: 3, pb: 1, textAlign: 'center' }}>
                <Box
                    sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 1.5,
                        background: alpha(color.main, 0.12),
                    }}
                >
                    <Icon sx={{ fontSize: 30, color: color.main }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {title || config.title}
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ textAlign: 'center', px: 3 }}>
                {message && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: children ? 2 : 0 }}>
                        {message}
                    </Typography>
                )}
                {children}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 1 }}>
                {onConfirm ? (
                    <>
                        <Button
                            variant="outlined"
                            onClick={onClose}
                            sx={{ borderRadius: '10px', minWidth: 110 }}
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            variant="contained"
                            color={config.color}
                            onClick={() => { onConfirm(); }}
                            sx={{ borderRadius: '10px', minWidth: 110 }}
                        >
                            {confirmLabel}
                        </Button>
                    </>
                ) : (
                    <Button
                        variant="contained"
                        color={config.color}
                        onClick={onClose}
                        sx={{ borderRadius: '10px', minWidth: 140 }}
                    >
                        {cancelLabel}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default AlertNotification;
