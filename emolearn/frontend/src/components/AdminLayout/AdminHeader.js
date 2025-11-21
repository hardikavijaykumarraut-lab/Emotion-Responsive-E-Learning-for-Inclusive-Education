import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Badge, 
  Box, 
  Avatar, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Tooltip,
  InputBase,
  alpha,
  styled,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  ExitToApp as ExitToAppIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  HelpOutline as HelpIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 240;

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
      '&:focus': {
        width: '30ch',
      },
    },
  },
}));

const AdminHeader = ({ onMenuClick, sidebarOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State for menus
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [messagesAnchorEl, setMessagesAnchorEl] = useState(null);
  
  // Menu open states
  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);
  const isNotificationsOpen = Boolean(notificationsAnchorEl);
  const isMessagesOpen = Boolean(messagesAnchorEl);
  
  // Handle profile menu open
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Handle mobile menu open
  const handleMobileMenuOpen = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };
  
  // Handle notifications menu open
  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };
  
  // Handle messages menu open
  const handleMessagesOpen = (event) => {
    setMessagesAnchorEl(event.currentTarget);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };
  
  // Handle mobile menu close
  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };
  
  // Handle notifications close
  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  // Handle messages close
  const handleMessagesClose = () => {
    setMessagesAnchorEl(null);
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };
  
  // Toggle theme (light/dark mode)
  const toggleColorMode = () => {
    // Implement theme toggle logic here
    console.log('Toggle theme');
  };
  
  // Mock notifications data
  const notifications = [
    { id: 1, text: 'New user registered', time: '5 min ago', read: false },
    { id: 2, text: 'New course added', time: '1 hour ago', read: false },
    { id: 3, text: 'System update available', time: '2 days ago', read: true },
  ];
  
  // Mock messages data
  const messages = [
    { id: 1, sender: 'John Doe', text: 'Hey, how are you?', time: '10 min ago', read: false },
    { id: 2, sender: 'Jane Smith', text: 'Meeting at 3 PM', time: '2 hours ago', read: true },
  ];
  
  // Unread notifications count
  const unreadNotifications = notifications.filter(n => !n.read).length;
  const unreadMessages = messages.filter(m => !m.read).length;
  
  // Menu ID for mobile
  const menuId = 'primary-search-account-menu';
  const mobileMenuId = 'primary-search-account-menu-mobile';
  
  // Render notifications menu
  const renderNotificationsMenu = (
    <Menu
      anchorEl={notificationsAnchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      id="notifications-menu"
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isNotificationsOpen}
      onClose={handleNotificationsClose}
      PaperProps={{
        style: {
          width: 350,
          maxHeight: 400,
          overflow: 'auto',
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
      </Box>
      {notifications.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">No new notifications</Typography>
        </Box>
      ) : (
        <Box>
          {notifications.map((notification) => (
            <MenuItem 
              key={notification.id} 
              onClick={handleNotificationsClose}
              sx={{
                borderLeft: notification.read ? 'none' : `3px solid ${theme.palette.primary.main}`,
                backgroundColor: notification.read ? 'inherit' : alpha(theme.palette.primary.main, 0.05),
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2">{notification.text}</Typography>
                <Typography variant="caption" color="textSecondary">{notification.time}</Typography>
              </Box>
            </MenuItem>
          ))}
          <Divider />
          <Box sx={{ p: 1, textAlign: 'center' }}>
            <Typography 
              variant="body2" 
              color="primary" 
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              View All Notifications
            </Typography>
          </Box>
        </Box>
      )}
    </Menu>
  );
  
  // Render messages menu
  const renderMessagesMenu = (
    <Menu
      anchorEl={messagesAnchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      id="messages-menu"
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMessagesOpen}
      onClose={handleMessagesClose}
      PaperProps={{
        style: {
          width: 300,
          maxHeight: 400,
          overflow: 'auto',
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="subtitle1" fontWeight="bold">Messages</Typography>
      </Box>
      {messages.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">No new messages</Typography>
        </Box>
      ) : (
        <Box>
          {messages.map((message) => (
            <MenuItem 
              key={message.id} 
              onClick={handleMessagesClose}
              sx={{
                borderLeft: message.read ? 'none' : `3px solid ${theme.palette.primary.main}`,
                backgroundColor: message.read ? 'inherit' : alpha(theme.palette.primary.main, 0.05),
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" fontWeight="medium">{message.sender}</Typography>
                  <Typography variant="caption" color="textSecondary">{message.time}</Typography>
                </Box>
                <Typography variant="body2" noWrap>{message.text}</Typography>
              </Box>
            </MenuItem>
          ))}
          <Divider />
          <Box sx={{ p: 1, textAlign: 'center' }}>
            <Typography 
              variant="body2" 
              color="primary" 
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              View All Messages
            </Typography>
          </Box>
        </Box>
      )}
    </Menu>
  );
  
  // Render profile menu
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Avatar 
          src={user?.avatar} 
          alt={user?.name}
          sx={{ 
            width: 60, 
            height: 60, 
            margin: '0 auto 8px',
            border: `2px solid ${theme.palette.primary.main}`,
          }}
        >
          {user?.name?.charAt(0) || 'U'}
        </Avatar>
        <Typography variant="subtitle1" fontWeight="medium">{user?.name || 'User'}</Typography>
        <Typography variant="body2" color="textSecondary">{user?.email || ''}</Typography>
      </Box>
      <Divider />
      <MenuItem onClick={() => { navigate('/admin/profile'); handleMenuClose(); }}>
        <ListItemIcon>
          <PersonIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Profile</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { navigate('/admin/settings'); handleMenuClose(); }}>
        <ListItemIcon>
          <SettingsIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Settings</ListItemText>
      </MenuItem>
      <MenuItem onClick={toggleColorMode}>
        <ListItemIcon>
          {theme.palette.mode === 'dark' ? (
            <LightModeIcon fontSize="small" />
          ) : (
            <DarkModeIcon fontSize="small" />
          )}
        </ListItemIcon>
        <ListItemText>
          {theme.palette.mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleLogout}>
        <ListItemIcon>
          <ExitToAppIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Logout</ListItemText>
      </MenuItem>
    </Menu>
  );
  
  // Render mobile menu
  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
    >
      <MenuItem onClick={handleNotificationsOpen}>
        <IconButton size="large" color="inherit">
          <Badge badgeContent={unreadNotifications} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <p>Notifications</p>
      </MenuItem>
      <MenuItem onClick={handleMessagesOpen}>
        <IconButton size="large" color="inherit">
          <Badge badgeContent={unreadMessages} color="error">
            <EmailIcon />
          </Badge>
        </IconButton>
        <p>Messages</p>
      </MenuItem>
      <MenuItem onClick={toggleColorMode}>
        <IconButton size="large" color="inherit">
          {theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
        <p>{theme.palette.mode === 'dark' ? 'Light Mode' : 'Dark Mode'}</p>
      </MenuItem>
      <MenuItem onClick={handleProfileMenuOpen}>
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="primary-search-account-menu"
          aria-haspopup="true"
          color="inherit"
        >
          <Avatar 
            src={user?.avatar} 
            alt={user?.name}
            sx={{ width: 30, height: 30 }}
          >
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
        </IconButton>
        <p>Profile</p>
      </MenuItem>
    </Menu>
  );
  
  return (
    <AppBar 
      position="fixed"
      sx={{
        width: { md: `calc(100% - ${sidebarOpen ? drawerWidth : 57}px)` },
        ml: { md: `${sidebarOpen ? drawerWidth : 57}px` },
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="open drawer"
          onClick={onMenuClick}
          sx={{ 
            mr: 2,
            color: theme.palette.text.primary,
            display: { md: 'none' } 
          }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ 
            display: { xs: 'none', sm: 'block' },
            color: theme.palette.text.primary,
          }}
        >
          Dashboard
        </Typography>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
          <Tooltip title="Help">
            <IconButton size="large" color="inherit" sx={{ ml: 1 }}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Toggle dark/light mode">
            <IconButton 
              size="large" 
              color="inherit" 
              onClick={toggleColorMode}
              sx={{ ml: 1 }}
            >
              {theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Notifications">
            <IconButton 
              size="large" 
              color="inherit" 
              onClick={handleNotificationsOpen}
              sx={{ ml: 1 }}
            >
              <Badge badgeContent={unreadNotifications} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Messages">
            <IconButton 
              size="large" 
              color="inherit" 
              onClick={handleMessagesOpen}
              sx={{ ml: 1 }}
            >
              <Badge badgeContent={unreadMessages} color="error">
                <EmailIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <IconButton
            edge="end"
            aria-label="account of current user"
            aria-controls={menuId}
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
            sx={{ ml: 1 }}
          >
            <Avatar 
              src={user?.avatar} 
              alt={user?.name}
              sx={{ 
                width: 36, 
                height: 36,
                border: `2px solid ${theme.palette.primary.main}`,
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
        </Box>
        
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            size="large"
            aria-label="show more"
            aria-controls={mobileMenuId}
            aria-haspopup="true"
            onClick={handleMobileMenuOpen}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>
      
      {/* Render menus */}
      {renderMenu}
      {renderMobileMenu}
      {renderNotificationsMenu}
      {renderMessagesMenu}
    </AppBar>
  );
};

export default AdminHeader;
