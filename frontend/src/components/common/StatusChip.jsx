import { Chip, alpha } from '@mui/material';

const statusConfig = {
    ok: { label: 'Disponible', color: '#00e676', bgColor: 'rgba(0, 230, 118, 0.12)' },
    low: { label: 'Stock Bajo', color: '#ff9800', bgColor: 'rgba(255, 152, 0, 0.12)' },
    critical: { label: 'Crítico', color: '#ff5252', bgColor: 'rgba(255, 82, 82, 0.12)' },
    out: { label: 'Agotado', color: '#d32f2f', bgColor: 'rgba(211, 47, 47, 0.16)' },
    fungible: { label: 'Fungible', color: '#40c4ff', bgColor: 'rgba(64, 196, 255, 0.12)' },
    non_fungible: { label: 'No Fungible', color: '#7c4dff', bgColor: 'rgba(124, 77, 255, 0.12)' },
    office_supply: { label: 'Oficina', color: '#ffab40', bgColor: 'rgba(255, 171, 64, 0.12)' },
    active: { label: 'Activo', color: '#00e676', bgColor: 'rgba(0, 230, 118, 0.12)' },
    inactive: { label: 'Inactivo', color: '#90a4ae', bgColor: 'rgba(144, 164, 174, 0.12)' },
    available: { label: 'Disponible', color: '#00e676', bgColor: 'rgba(0, 230, 118, 0.12)' },
    in_use: { label: 'En Uso', color: '#40c4ff', bgColor: 'rgba(64, 196, 255, 0.12)' },
    damaged: { label: 'Dañado', color: '#ff5252', bgColor: 'rgba(255, 82, 82, 0.12)' },
    retired: { label: 'Retirado', color: '#90a4ae', bgColor: 'rgba(144, 164, 174, 0.12)' },
    // Condiciones del Excel
    Buena: { label: 'Buena', color: '#00e676', bgColor: 'rgba(0, 230, 118, 0.12)' },
    Regular: { label: 'Regular', color: '#ff9800', bgColor: 'rgba(255, 152, 0, 0.12)' },
    Dañada: { label: 'Dañada', color: '#ff5252', bgColor: 'rgba(255, 82, 82, 0.12)' },
};

const StatusChip = ({ status, label: customLabel, size = 'small', colorOverride, ...props }) => {
    const config = statusConfig[status] || { label: status, color: '#90a4ae', bgColor: 'rgba(144, 164, 174, 0.12)' };

    // colorOverride allows semantic palette colors ('success', 'warning', 'error') fallback
    // when status is not in config — already handled via statusConfig entries above

    return (
        <Chip
            label={customLabel || config.label}
            size={size}
            sx={{
                color: config.color,
                bgcolor: config.bgColor,
                fontWeight: 600,
                fontSize: '0.7rem',
                letterSpacing: '0.02em',
                border: `1px solid ${alpha(config.color, 0.2)}`,
                ...props.sx,
            }}
            {...props}
        />
    );
};

export const getStockStatus = (stock, minStock) => {
    if (stock === 0) return 'out';
    if (stock <= minStock) return 'critical';
    if (stock <= minStock * 2) return 'low';
    return 'ok';
};

export default StatusChip;
