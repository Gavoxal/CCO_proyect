import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Typography, IconButton, alpha, useTheme, Alert,
} from '@mui/material';
import {
    Close as CloseIcon,
    CameraAlt as CameraIcon,
    FlipCameraAndroid as FlipIcon,
} from '@mui/icons-material';

const BarcodeScanner = ({ open, onClose, onScan }) => {
    const theme = useTheme();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const animationRef = useRef(null);
    const [error, setError] = useState('');
    const [scanning, setScanning] = useState(false);
    const [facingMode, setFacingMode] = useState('environment');

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        setScanning(false);
    }, []);

    const startCamera = useCallback(async () => {
        try {
            setError('');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setScanning(true);

                // Use BarcodeDetector API if available
                if ('BarcodeDetector' in window) {
                    const detector = new window.BarcodeDetector({
                        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e'],
                    });

                    const detect = async () => {
                        if (!videoRef.current || videoRef.current.readyState !== 4) {
                            animationRef.current = requestAnimationFrame(detect);
                            return;
                        }
                        try {
                            const barcodes = await detector.detect(videoRef.current);
                            if (barcodes.length > 0) {
                                const barcode = barcodes[0];
                                stopCamera();
                                onScan(barcode.rawValue);
                                return;
                            }
                        } catch {
                            // continue scanning
                        }
                        animationRef.current = requestAnimationFrame(detect);
                    };
                    detect();
                } else {
                    setError('Tu navegador no soporta detección de códigos de barras. Intenta con Chrome.');
                }
            }
        } catch (err) {
            console.error('Camera error:', err);
            setError('No se pudo acceder a la cámara. Verifica los permisos.');
        }
    }, [facingMode, onScan, stopCamera]);

    useEffect(() => {
        if (open) {
            startCamera();
        }
        return () => stopCamera();
    }, [open, startCamera, stopCamera]);

    const handleFlip = () => {
        stopCamera();
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    const handleClose = () => {
        stopCamera();
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CameraIcon sx={{ color: theme.palette.primary.main }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Escanear Código de Barras
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {error ? (
                    <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                        {error}
                    </Alert>
                ) : null}
                <Box
                    sx={{
                        position: 'relative',
                        width: '100%',
                        borderRadius: 3,
                        overflow: 'hidden',
                        bgcolor: '#000',
                        aspectRatio: '4/3',
                    }}
                >
                    <video
                        ref={videoRef}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                        }}
                        playsInline
                        muted
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    {/* Scan overlay */}
                    {scanning && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '10%',
                                right: '10%',
                                height: 3,
                                transform: 'translateY(-50%)',
                                bgcolor: theme.palette.primary.main,
                                boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.6)}`,
                                animation: 'scan 2s ease-in-out infinite',
                                '@keyframes scan': {
                                    '0%, 100%': { top: '30%' },
                                    '50%': { top: '70%' },
                                },
                            }}
                        />
                    )}
                    {/* Corner indicators */}
                    {scanning && (
                        <>
                            {[{ top: '15%', left: '10%' }, { top: '15%', right: '10%' }, { bottom: '15%', left: '10%' }, { bottom: '15%', right: '10%' }].map((pos, i) => (
                                <Box
                                    key={i}
                                    sx={{
                                        position: 'absolute',
                                        ...pos,
                                        width: 24,
                                        height: 24,
                                        borderColor: theme.palette.primary.main,
                                        borderStyle: 'solid',
                                        borderWidth: 0,
                                        ...(i === 0 && { borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 }),
                                        ...(i === 1 && { borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 }),
                                        ...(i === 2 && { borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 }),
                                        ...(i === 3 && { borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 }),
                                    }}
                                />
                            ))}
                        </>
                    )}
                </Box>
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1.5, color: 'text.secondary' }}>
                    Coloca el código de barras dentro del recuadro
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={handleFlip} startIcon={<FlipIcon />} variant="outlined" color="inherit" size="small">
                    Voltear cámara
                </Button>
                <Button onClick={handleClose} variant="outlined" color="inherit">
                    Cancelar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BarcodeScanner;
