import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const MainLayout = ({ title, children }) => {
    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Topbar title={title} />
                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        p: 3,
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
