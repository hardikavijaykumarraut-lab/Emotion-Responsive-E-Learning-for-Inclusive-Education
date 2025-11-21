import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid, 
  Tabs, 
  Tab, 
  Divider,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminRoute from '../../components/AdminRoute/AdminRoute';

// Import sections
import DashboardSection from './sections/DashboardSection';
import UsersSection from './sections/UsersSection';
// ContentSection import removed
import AnalyticsSection from './sections/AnalyticsSection';
import SettingsSection from './sections/SettingsSection';

// Styled components
const StyledTabs = styled(Tabs)({
  '& .MuiTabs-indicator': {
    left: 0,
  },
});

const StyledTab = styled((props) => <Tab disableRipple {...props} />)(({ theme }) => ({
  textTransform: 'none',
  minWidth: 0,
  marginRight: theme.spacing(3),
  padding: theme.spacing(1, 2),
  textAlign: 'left',
  alignItems: 'flex-start',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    opacity: 1,
  },
  '&.Mui-selected': {
    color: theme.palette.primary.main,
    fontWeight: theme.typography.fontWeightMedium,
  },
}));

const AdminPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Get the current tab from the URL
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.endsWith('/admin') || path.endsWith('/admin/')) return 0; // Dashboard
    if (path.includes('/users')) return 1;
    // Content tab removed - shifting indices
    if (path.includes('/analytics')) return 2;
    if (path.includes('/settings')) return 3;
    return 0; // Default to dashboard
  };

  const [currentTab, setCurrentTab] = useState(getCurrentTab());

  // Update tab when route changes
  useEffect(() => {
    setCurrentTab(getCurrentTab());
  }, [location.pathname]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    switch (newValue) {
      case 0:
        navigate('/admin');
        break;
      case 1:
        navigate('/admin/users');
        break;
      // Content tab removed - shifting indices
      case 2:
        navigate('/admin/analytics');
        break;
      case 3:
        navigate('/admin/settings');
        break;
      default:
        navigate('/admin');
    }
  };

  return (
    <AdminRoute>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <Paper 
          elevation={3} 
          sx={{ 
            width: 240, 
            minWidth: 240, 
            height: '100vh',
            position: 'sticky',
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            p: 2,
            gap: 2
          }}
        >
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="div">
              Admin Panel
            </Typography>
            <IconButton onClick={logout} size="small">
              <LogoutIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <StyledTabs
              orientation="vertical"
              variant="scrollable"
              value={currentTab}
              onChange={handleTabChange}
              sx={{ borderRight: 1, borderColor: 'divider', width: '100%' }}
            >
              <StyledTab icon={<DashboardIcon />} label="Dashboard" />
              <StyledTab icon={<PeopleIcon />} label="Users" />
              {/* Content tab removed */}
              <StyledTab icon={<BarChartIcon />} label="Analytics" />
              <StyledTab icon={<SettingsIcon />} label="Settings" />
            </StyledTabs>
          </Box>
          
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="textSecondary">
              {user?.email || 'Admin User'}
            </Typography>
          </Box>
        </Paper>
        
        {/* Main Content */}
        <Box component="main" sx={{ 
          flexGrow: 1, 
          p: 3, 
          backgroundColor: '#f5f5f5', 
          minHeight: '100vh',
          overflowY: 'auto'
        }}>
          <Routes>
            <Route index element={<DashboardSection />} />
            <Route path="users" element={<UsersSection />} />
            {/* Content route removed */}
            <Route path="analytics" element={<AnalyticsSection />} />
            <Route path="settings" element={<SettingsSection />} />
          </Routes>
        </Box>
      </Box>
    </AdminRoute>
  );
};

export default AdminPage;