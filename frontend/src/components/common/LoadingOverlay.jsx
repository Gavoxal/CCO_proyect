import { Box, CircularProgress, Typography, alpha, useTheme } from '@mui/material';

const LoadingOverlay = ({ message = 'Cargando...' }) => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                gap: 2,
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    display: 'inline-flex',
                }}
            >
                <CircularProgress
                    size={48}
                    thickness={3}
                    sx={{
                        color: theme.palette.primary.main,
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        top: -4,
                        left: -4,
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    }}
                />
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {message}
            </Typography>
        </Box>
    );
};

export default LoadingOverlay;
