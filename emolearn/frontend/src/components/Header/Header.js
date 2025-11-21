import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Switch,
  FormControlLabel,
  Divider,
  ListItemIcon,
  ListItemText,
  Avatar,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  TextIncrease,
  TextDecrease,
  Contrast,
  Home as HomeIcon,
  School as SchoolIcon,
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminIcon,
  Logout,
  Person,
  Login as LoginIcon,
  Accessibility as AccessibilityIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [accessibilityAnchor, setAccessibilityAnchor] = useState(null);
  
  const { 
    themeMode, 
    updateThemeMode, 
    fontSize, 
    updateFontSize, 
    highContrast,
    toggleHighContrast,
    announceToScreenReader 
  } = useAccessibility();
  const { user, logout } = useAuth();
  
  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleSettingsOpen = (event) => {
    setSettingsAnchor(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchor(null);
  };

  const handleAccessibilityOpen = (event) => {
    setAccessibilityAnchor(event.currentTarget);
  };

  const handleAccessibilityClose = () => {
    setAccessibilityAnchor(null);
  };

  const isAdmin = user?.role === 'admin';

  const handleNavigation = (path, label) => {
    navigate(path);
    announceToScreenReader(`Navigated to ${label}`);
  };

  const handleThemeToggle = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    updateThemeMode(newMode);
    announceToScreenReader(`Switched to ${newMode} mode`);
  };

  const handleFontSizeChange = (event) => {
    const newSize = event.target.value;
    updateFontSize(newSize);
    announceToScreenReader(`Font size changed to ${newSize}`);
  };

  const handleHighContrastToggle = () => {
    toggleHighContrast();
    announceToScreenReader(`High contrast ${!highContrast ? 'enabled' : 'disabled'}`);
  };

  const handleLogout = () => {
    logout();
    announceToScreenReader('Logged out successfully');
    navigate('/login');
  };

  return (
    <AppBar position="sticky" elevation={2}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <SchoolIcon sx={{ mr: 2 }} />
          <Typography 
            variant="h6" 
            component="h1"
            sx={{ fontWeight: 600 }}
          >
            EmoLearn
          </Typography>
        </Box>

        {/* Navigation */}
        <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
          <Tooltip title="Home">
            <Button
              color="inherit"
              startIcon={<HomeIcon />}
              onClick={() => handleNavigation('/', 'Home')}
              aria-current={location.pathname === '/' ? 'page' : undefined}
            >
              Home
            </Button>
          </Tooltip>
          
          <Tooltip title="Learning Modules">
            <Button
              color="inherit"
              startIcon={<SchoolIcon />}
              onClick={() => handleNavigation('/learn', 'Learning')}
              aria-current={location.pathname.startsWith('/learn') ? 'page' : undefined}
            >
              Learn
            </Button>
          </Tooltip>
          
          <Tooltip title="Progress Dashboard">
            <Button
              color="inherit"
              startIcon={<DashboardIcon />}
              onClick={() => handleNavigation('/dashboard', 'Dashboard')}
              aria-current={location.pathname === '/dashboard' ? 'page' : undefined}
            >
              Dashboard
            </Button>
          </Tooltip>
          
          {isAdmin && (
            <Tooltip title="Admin Dashboard">
              <Button
                color="inherit"
                startIcon={<AdminIcon />}
                onClick={() => handleNavigation('/admin', 'Admin Dashboard')}
                aria-current={location.pathname === '/admin' ? 'page' : undefined}
              >
                Admin
              </Button>
            </Tooltip>
          )}
        </Box>

        {/* User Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'secondary.main' }}>
            <Person />
          </Avatar>
          <Typography variant="body2" sx={{ mr: 1 }}>
            {user?.name || 'Guest'}
          </Typography>
          <IconButton
            color="inherit"
            onClick={handleLogout}
            size="small"
            aria-label="Logout"
          >
            <Logout />
          </IconButton>
        </Box>

        {/* Accessibility Menu */}
        <Tooltip title="Accessibility Settings">
          <IconButton
            color="inherit"
            onClick={handleAccessibilityOpen}
            aria-label="Accessibility settings"
          >
            <AccessibilityIcon />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={accessibilityAnchor}
          open={Boolean(accessibilityAnchor)}
          onClose={handleAccessibilityClose}
          aria-labelledby="accessibility-menu"
        >
          <MenuItem>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Font Size</InputLabel>
              <Select
                value={fontSize}
                label="Font Size"
                onChange={handleFontSizeChange}
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="large">Large</MenuItem>
                <MenuItem value="xl">Extra Large</MenuItem>
              </Select>
            </FormControl>
          </MenuItem>
          
          <MenuItem>
            <FormControlLabel
              control={
                <Switch
                  checked={highContrast}
                  onChange={handleHighContrastToggle}
                />
              }
              label="High Contrast"
            />
          </MenuItem>
          
          <MenuItem>
            <FormControlLabel
              control={
                <Switch
                  checked={themeMode === 'dark'}
                  onChange={handleThemeToggle}
                  icon={<LightModeIcon />}
                  checkedIcon={<DarkModeIcon />}
                />
              }
              label="Dark Mode"
            />
          </MenuItem>
        </Menu>

        {/* Settings Menu */}
        <Tooltip title="Settings">
          <IconButton
            color="inherit"
            onClick={handleSettingsOpen}
            aria-label="Settings"
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={settingsAnchor}
          open={Boolean(settingsAnchor)}
          onClose={handleSettingsClose}
        >
          <MenuItem onClick={handleSettingsClose}>
            Emotion Detection Settings
          </MenuItem>
          <MenuItem onClick={handleSettingsClose}>
            Learning Preferences
          </MenuItem>
          <MenuItem onClick={handleSettingsClose}>
            Privacy Settings
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
