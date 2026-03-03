import { useRef } from 'react';
import Barcode from 'react-barcode';
import { Box, Button, Typography, Paper, alpha, useTheme } from '@mui/material';
import { Download as DownloadIcon, Print as PrintIcon } from '@mui/icons-material';

const BarcodeGenerator = ({ value, productName = '', format = 'CODE128', width = 2, height = 80 }) => {
    const theme = useTheme();
    const barcodeRef = useRef(null);

    if (!value) return null;

    const handleDownload = () => {
        const svg = barcodeRef.current?.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width + 40;
            canvas.height = img.height + 60;
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (productName) {
                ctx.fillStyle = '#333';
                ctx.font = '14px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(productName, canvas.width / 2, 20);
            }

            ctx.drawImage(img, 20, productName ? 30 : 10);

            const link = document.createElement('a');
            link.download = `barcode-${value}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    const handlePrint = () => {
        const svg = barcodeRef.current?.querySelector('svg');
        if (!svg) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
      <html>
        <head>
          <title>Código de Barras - ${value}</title>
          <style>
            body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; font-family: Inter, sans-serif; }
            .container { text-align: center; }
            h3 { margin-bottom: 10px; color: #333; }
          </style>
        </head>
        <body>
          <div class="container">
            ${productName ? `<h3>${productName}</h3>` : ''}
            ${svg.outerHTML}
          </div>
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <Paper
            sx={{
                p: 3,
                textAlign: 'center',
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                background: theme.palette.mode === 'dark'
                    ? alpha('#0d2137', 0.6)
                    : alpha('#f5f7fa', 0.8),
            }}
        >
            {productName && (
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                    {productName}
                </Typography>
            )}
            <Box ref={barcodeRef} sx={{ display: 'inline-flex', p: 1.5, bgcolor: '#fff', borderRadius: 2 }}>
                <Barcode
                    value={value}
                    format={format}
                    width={width}
                    height={height}
                    displayValue={true}
                    fontSize={14}
                    margin={8}
                    background="#fff"
                    lineColor="#000"
                />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                >
                    Descargar
                </Button>
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                >
                    Imprimir
                </Button>
            </Box>
        </Paper>
    );
};

export default BarcodeGenerator;
