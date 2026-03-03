import { Card, CardContent, Box, Typography, alpha, useTheme } from '@mui/material';

const StatsCard = ({ title, value, icon, color = 'primary', subtitle }) => {
    const theme = useTheme();
    const mainColor = theme.palette[color]?.main || color;

    return (
        <Card
            sx={{
                position: 'relative',
                overflow: 'hidden',
                cursor: 'default',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(90deg, ${mainColor} 0%, ${alpha(mainColor, 0.5)} 100%)`,
                },
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>
                            {title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            width: 52,
                            height: 52,
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `linear-gradient(135deg, ${alpha(mainColor, 0.2)} 0%, ${alpha(mainColor, 0.1)} 100%)`,
                            color: mainColor,
                        }}
                    >
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default StatsCard;
