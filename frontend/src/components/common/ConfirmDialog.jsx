import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, alpha, useTheme,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

const ConfirmDialog = ({
    open,
    onClose,
    onConfirm,
    title = '¿Estás seguro?',
    message = 'Esta acción no se puede deshacer.',
    confirmLabel = 'Eliminar',
    cancelLabel = 'Cancelar',
    severity = 'error',
}) => {
    const theme = useTheme();
    const color = theme.palette[severity]?.main || theme.palette.error.main;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(color, 0.12),
                        }}
                    >
                        <WarningIcon sx={{ color, fontSize: 24 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {title}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 7 }}>
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} variant="outlined" color="inherit">
                    {cancelLabel}
                </Button>
                <Button onClick={onConfirm} variant="contained" color={severity}>
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
