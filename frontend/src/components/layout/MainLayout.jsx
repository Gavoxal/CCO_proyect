import { useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const MainLayout = ({ title, children }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <Sidebar 
                mobileOpen={mobileOpen} 
                onClose={handleDrawerToggle} 
                isMobile={isMobile} 
            />
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Topbar title={title} onMenuClick={handleDrawerToggle} isMobile={isMobile} />
                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        p: { xs: 2, sm: 3 },
                        overflow: 'auto',
                    }}
                >
                    {children}
                </Box>
            </Box>
        </Box>
    );
};

export default MainLayout;
