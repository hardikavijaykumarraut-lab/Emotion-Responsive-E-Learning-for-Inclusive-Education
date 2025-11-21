import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress, responsiveFontSizes, Typography, Button } from '@mui/material';
import AuthProvider, { useAuth } from './contexts/AuthContext';
import AccessibilityProvider, { useAccessibility } from './contexts/AccessibilityContext';
import { EmotionProvider } from './contexts/EmotionContext';

const HomePage = lazy(() => import('./pages/HomePage/HomePage').then(module => ({ default: module.default })));
const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage').then(module => ({ default: module.default })));
const RegisterPage = lazy(() => import('./pages/RegisterPage/RegisterPage').then(module => ({ default: module.default })));
const DashboardPage = lazy(() => import('./pages/DashboardPage/DashboardPage').then(module => ({ default: module.default })));
const LearningPage = lazy(() => import('./pages/LearningPage/LearningPage').then(module => ({ default: module.default })));
const AdminLogin = lazy(() => import('./pages/AdminLogin/AdminLogin').then(module => ({ default: module.default })));
const AdminPage = lazy(() => import('./pages/AdminPage/AdminPage').then(module => ({ default: module.default })));
const CameraTest = lazy(() => import('./pages/CameraTest/CameraTest').then(module => ({ default: module.default })));
const Header = lazy(() => import('./components/Header/Header').then(module => ({ default: module.default })));

// Theme configuration
const createAppTheme = (mode, fontSize, highContrast = false) => {
  const fontSizeMap = {
    small: 0.875,
    normal: 1,
    large: 1.125,
    xl: 1.25
  };

  const baseTheme = createTheme({
    palette: {
      mode: highContrast ? 'light' : mode,
      primary: {
        main: highContrast ? '#0000ff' : '#2196f3',
      },
      secondary: {
        main: highContrast ? '#ff0000' : '#f50057',
      },
      background: {
        default: highContrast ? '#ffffff' : (mode === 'dark' ? '#121212' : '#f5f7fa'),
        paper: highContrast ? '#ffffff' : (mode === 'dark' ? '#1e1e1e' : '#ffffff'),
      },
      text: {
        primary: highContrast ? '#000000' : (mode === 'dark' ? '#ffffff' : '#333333'),
      },
    },
    typography: {
      fontSize: 14 * (fontSizeMap[fontSize] || 1),
      fontFamily: 'Inter, Arial, sans-serif',
      h1: {
        fontSize: `${2.5 * fontSizeMap[fontSize]}rem`,
        fontWeight: 600,
      },
      h2: {
        fontSize: `${2 * fontSizeMap[fontSize]}rem`,
        fontWeight: 600,
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 500,
      },
      button: {
        textTransform: 'none',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '12px 24px',
            '&:focus': {
              outline: '2px solid #2196f3',
              outlineOffset: '2px',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: highContrast ? '2px solid #000000' : 'none',
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          'html, body': {
            textSizeAdjust: '100%',
            WebkitTextSizeAdjust: '100%',
            msTextSizeAdjust: '100%',
            MozTextSizeAdjust: '100%',
          },
        },
      },
    },
  });

  return responsiveFontSizes(baseTheme);
};

// Loading fallback component
const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
  </Box>
);

// Component to handle scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// PrivateRoute component for protected routes
const PrivateRoute = ({ children, allowGuest = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <LoadingFallback />;
  }
  
  // If user is not authenticated, redirect to login
  if (!isAuthenticated && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If guest access is not allowed and user is a guest, redirect to login
  if (!allowGuest && user?.isGuest) {
    return <Navigate to="/login" state={{ from: location, guestNotAllowed: true }} replace />;
  }
  
  return children;
};

// PublicRoute component for public routes
const PublicRoute = ({ children, restricted = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <LoadingFallback />;
  }
  
  if (user && restricted) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }
  return children;
};

// Main App Content Component
const AppContent = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get the intended destination or default based on user role
  const getDefaultRedirectPath = () => {
    if (user?.isGuest) return '/dashboard';
    if (user?.role === 'admin') return '/admin';
    return '/dashboard';
  };
  
  // Define route types and user roles
  const isPublicRoute = ['/', '/login', '/register'].includes(location.pathname);
  const isAuthRoute = ['/login', '/register'].includes(location.pathname);
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isGuest = user?.isGuest;
  const isAdmin = user?.role === 'admin';
  
  // Get the redirect path after login
  const from = location.state?.from?.pathname || getDefaultRedirectPath();
  
  // Handle redirection based on authentication status
  useEffect(() => {
    // Skip if still loading or no auth state determined yet
    if (loading) return;
    
    // If we're still on a public route and not authenticated, stay
    if (isPublicRoute && !isAuthenticated) return;
    
    // If we're on an auth route but already authenticated, redirect to intended destination
    if (isAuthRoute && isAuthenticated) {
      console.log('Already authenticated, redirecting to:', from);
      navigate(from, { replace: true });
      return;
    }
    
    // If not authenticated and not on a public route, redirect to login
    if (!isAuthenticated && !isPublicRoute) {
      console.log('Not authenticated, redirecting to login');
      navigate('/login', { 
        state: { from: location },
        replace: true 
      });
      return;
    }
    
    // Handle guest user redirection
    if (user?.isGuest) {
      // Allow access to home, dashboard, and learn pages for guests
      const guestAllowedRoutes = ['/', '/dashboard', '/learn'];
      const isGuestAllowed = guestAllowedRoutes.some(route => 
        location.pathname === route || location.pathname.startsWith(route + '/')
      );
      
      if (!isGuestAllowed) {
        console.log('Guest user accessing unauthorized route, redirecting to home');
        navigate('/', { replace: true });
      }
      return;
    }
    
    // Handle admin route access
    if (isAdminRoute && !isAdmin) {
      console.log('Unauthorized admin access attempt');
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [isAuthenticated, loading, location, navigate, from, isAuthRoute, isPublicRoute, isAdminRoute, isAdmin, user]);

  // Show loading state while checking auth or redirecting
  if (loading) return <LoadingFallback />;
  // Helper component to wrap routes that require authentication
  const AuthenticatedRoute = ({ children, allowGuest = false }) => (
    <PrivateRoute allowGuest={allowGuest}>
      {children}
    </PrivateRoute>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default',
        color: 'text.primary',
        transition: 'all 0.3s ease',
      }}
    >
      {user && <Header />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <PublicRoute restricted={false}>
            <HomePage />
          </PublicRoute>
        } />
        
        <Route path="/login" element={
          <PublicRoute restricted={true}>
            <LoginPage />
          </PublicRoute>
        } />
        
        <Route path="/register" element={
          <PublicRoute restricted={true}>
            <RegisterPage />
          </PublicRoute>
        } />
        
        {/* Protected Routes - Require authentication */}
        <Route path="/dashboard" element={
          <AuthenticatedRoute allowGuest={true}>
            <DashboardPage />
          </AuthenticatedRoute>
        } />
        
        <Route path="/learn" element={
          <AuthenticatedRoute allowGuest={true}>
            <LearningPage />
          </AuthenticatedRoute>
        }>
          <Route path=":subject" element={<LearningPage />} />
        </Route>
        
        {/* Admin Routes - Require admin role */}
        <Route path="/admin/*" element={
          <AuthenticatedRoute>
            {user?.role === 'admin' ? (
              <AdminPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )}
          </AuthenticatedRoute>
        } />
        
        {/* Test Routes */}
        <Route path="/camera-test" element={
          <AuthenticatedRoute allowGuest={true}>
            <CameraTest />
          </AuthenticatedRoute>
        } />
        
        {/* 404 - Not Found */}
        <Route path="*" element={
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              404 - Page Not Found
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate('/')}
              sx={{ mt: 2 }}
            >
              Go to Home
            </Button>
          </Box>
        } />
      </Routes>
    </Box>
  );
};
const App = () => {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'light';
  });
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('fontSize') || 'normal';
  });
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('highContrast') === 'true';
  });

  // Load saved settings on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode') || 'light';
    const savedFontSize = localStorage.getItem('fontSize') || 'normal';
    const savedHighContrast = localStorage.getItem('highContrast') === 'true';

    setThemeMode(savedTheme);
    setFontSize(savedFontSize);
    setHighContrast(savedHighContrast);

    // Apply initial theme settings
    const root = document.documentElement;
    root.setAttribute('data-theme', savedTheme);
    
    if (savedHighContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    const fontSizeClasses = ['font-size-small', 'font-size-normal', 'font-size-large', 'font-size-xl'];
    root.classList.remove(...fontSizeClasses);
    root.classList.add(`font-size-${savedFontSize}`);
  }, []);

  // Save settings when they change
  useEffect(() => {
    const root = document.documentElement;
    
    // Update theme attribute
    root.setAttribute('data-theme', themeMode);
    
    // Update high contrast class
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    // Update font size class
    const fontSizeClasses = ['font-size-small', 'font-size-normal', 'font-size-large', 'font-size-xl'];
    root.classList.remove(...fontSizeClasses);
    root.classList.add(`font-size-${fontSize}`);
    
    // Save to localStorage
    localStorage.setItem('themeMode', themeMode);
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('highContrast', highContrast);
  }, [themeMode, fontSize, highContrast]);

  // Create theme with current settings
  const theme = React.useMemo(
    () => createAppTheme(themeMode, fontSize, highContrast),
    [themeMode, fontSize, highContrast]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AccessibilityProvider 
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          fontSize={fontSize}
          setFontSize={setFontSize}
          highContrast={highContrast}
          setHighContrast={setHighContrast}
        >
          <EmotionProvider>
            <Router>
              <Suspense fallback={<LoadingFallback />}>
                <ScrollToTop />
                <AppContent />
              </Suspense>
            </Router>
          </EmotionProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
