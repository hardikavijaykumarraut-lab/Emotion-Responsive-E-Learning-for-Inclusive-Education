import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  VideoLibrary as VideoLibraryIcon,
  Article as ArticleIcon,
  Quiz as QuizIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Backup as BackupIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const drawerWidth = 240;

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'isMobile',
})(({ theme, open, isMobile }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    '& .MuiDrawer-paper': {
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
  }),
  ...(!open && {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7) + 1,
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9) + 1,
    },
    '& .MuiDrawer-paper': {
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7) + 1,
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9) + 1,
      },
    },
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const AdminSidebar = ({ mobileOpen, sidebarOpen, onClose, isMobile }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State for nested menu items
  const [usersOpen, setUsersOpen] = React.useState(false);
  // Content state removed
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  
  // Toggle nested menu items
  const handleUsersClick = () => {
    setUsersOpen(!usersOpen);
  };
  
  // Content click handler removed
  const handleSettingsClick = () => {
    setSettingsOpen(!settingsOpen);
  };
  
  // Check if a menu item is active
  const isActive = (path, exact = true) => {
    return exact 
      ? location.pathname === path 
      : location.pathname.startsWith(path);
  };
  
  // Main menu items
  const mainMenuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/admin/dashboard',
      exact: true
    },
    { 
      text: 'Users', 
      icon: <PeopleIcon />,
      path: '/admin/users',
      exact: false,
      children: [
        { text: 'All Users', path: '/admin/users' },
        { text: 'Add New', path: '/admin/users/new' },
        { text: 'Roles', path: '/admin/users/roles' },
      ]
    },
    // Content menu item removed
    { 
      text: 'Courses', 
      icon: <CategoryIcon />,
      path: '/admin/courses',
      exact: false,
      children: [
        { text: 'All Courses', path: '/admin/courses' },
        { text: 'Add New', path: '/admin/courses/new' },
        { text: 'Lessons', path: '/admin/courses/lessons' },
        { text: 'Quizzes', path: '/admin/courses/quizzes' },
      ]
    },
    { 
      text: 'Media', 
      icon: <VideoLibraryIcon />,
      path: '/admin/media',
      exact: false,
      children: [
        { text: 'Library', path: '/admin/media' },
        { text: 'Upload New', path: '/admin/media/upload' },
      ]
    },
    { 
      text: 'Analytics', 
      icon: <BarChartIcon />, 
      path: '/admin/analytics',
      exact: true
    },
    { 
      text: 'Settings', 
      icon: <SettingsIcon />,
      path: '/admin/settings',
      exact: false,
      children: [
        { text: 'General', path: '/admin/settings/general' },
        { text: 'Email', path: '/admin/settings/email' },
        { text: 'Security', path: '/admin/settings/security' },
        { text: 'Backup', path: '/admin/settings/backup' },
      ]
    },
  ];
  
  // Render a single menu item
  const renderMenuItem = (item, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isItemActive = isActive(item.path, item.exact);
    
    return (
      <React.Fragment key={item.path}>
        <ListItem 
          disablePadding 
          sx={{ 
            display: 'block',
            pl: depth > 0 ? depth * 2 : 0,
          }}
        >
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                if (item.text === 'Users') handleUsersClick();
                // Content click handler removed
                else if (item.text === 'Settings') handleSettingsClick();
              } else {
                navigate(item.path);
                if (isMobile) onClose();
              }
            }}
            selected={isItemActive}
            sx={{
              minHeight: 48,
              justifyContent: sidebarOpen ? 'initial' : 'center',
              px: 2.5,
              '&.Mui-selected': {
                backgroundColor: theme.palette.action.selected,
                '&:hover': {
                  backgroundColor: theme.palette.action.selected,
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: sidebarOpen ? 3 : 'auto',
                justifyContent: 'center',
                color: isItemActive ? theme.palette.primary.main : 'inherit',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{
                fontWeight: isItemActive ? 'medium' : 'regular',
              }}
              sx={{ 
                opacity: sidebarOpen ? 1 : 0,
                '& .MuiListItemText-primary': {
                  fontSize: '0.875rem',
                },
              }}
            />
            {hasChildren && sidebarOpen && (
              <>
                {item.text === 'Users' && (usersOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
                {/* Content expand icons removed */}
                {item.text === 'Settings' && (settingsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
              </>
            )}
          </ListItemButton>
        </ListItem>
        
        {/* Nested menu items */}
        {hasChildren && sidebarOpen && (
          <Collapse 
            in={
              (item.text === 'Users' && usersOpen) || 
              // Content collapse condition removed
              (item.text === 'Settings' && settingsOpen)
            } 
            timeout="auto" 
            unmountOnExit
          >
            <List component="div" disablePadding>
              {item.children.map((child) => {
                const isChildActive = isActive(child.path, true);
                return (
                  <ListItemButton
                    key={child.path}
                    onClick={() => {
                      navigate(child.path);
                      if (isMobile) onClose();
                    }}
                    selected={isChildActive}
                    sx={{
                      pl: 4 + depth * 2,
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.action.selected,
                        '&:hover': {
                          backgroundColor: theme.palette.action.selected,
                        },
                      },
                    }}
                  >
                    <ListItemText 
                      primary={child.text} 
                      primaryTypographyProps={{
                        fontSize: '0.8125rem',
                        fontWeight: isChildActive ? 'medium' : 'regular',
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };
  
  // For mobile drawer
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        <DrawerHeader>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="div" sx={{ ml: 2 }}>
              Admin Panel
            </Typography>
            <IconButton onClick={onClose}>
              <ChevronLeftIcon />
            </IconButton>
          </Box>
        </DrawerHeader>
        <Divider />
        <List>
          {mainMenuItems.map((item) => renderMenuItem(item))}
        </List>
        <Divider />
        <List>
          <ListItemButton>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </List>
      </Drawer>
    );
  }
  
  // For desktop sidebar
  return (
    <StyledDrawer 
      variant="permanent" 
      open={sidebarOpen}
      isMobile={isMobile}
    >
      <DrawerHeader>
        {sidebarOpen && (
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="div" sx={{ ml: 1 }}>
              Admin Panel
            </Typography>
            <IconButton onClick={onClose} size="small">
              <ChevronLeftIcon />
            </IconButton>
          </Box>
        )}
      </DrawerHeader>
      <Divider />
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        <List>
          {mainMenuItems.map((item) => renderMenuItem(item))}
        </List>
      </Box>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" sx={{ opacity: sidebarOpen ? 1 : 0 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </StyledDrawer>
  );
};

export default AdminSidebar;