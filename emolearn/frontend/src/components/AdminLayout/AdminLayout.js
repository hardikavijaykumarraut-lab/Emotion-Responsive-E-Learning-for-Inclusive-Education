import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, CssBaseline, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: 0,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
    [theme.breakpoints.up('md')]: {
      marginLeft: `${drawerWidth}px`,
      ...(open && {
        marginLeft: `${drawerWidth}px`,
      }),
    },
  })
);

const AdminLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Header */}
      <AdminHeader 
        onMenuClick={handleDrawerToggle} 
        sidebarOpen={isMobile ? mobileOpen : sidebarOpen}
      />
      
      {/* Sidebar */}
      <AdminSidebar 
        mobileOpen={mobileOpen}
        sidebarOpen={sidebarOpen}
        onClose={() => setMobileOpen(false)}
        isMobile={isMobile}
      />
      
      {/* Main content */}
      <Main open={sidebarOpen}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: 'calc(100vh - 64px)',
          pt: 3,
          pb: 6,
        }}>
          <Container maxWidth={false}>
            <Outlet />
          </Container>
        </Box>
      </Main>
    </Box>
  );
};

export default AdminLayout;
