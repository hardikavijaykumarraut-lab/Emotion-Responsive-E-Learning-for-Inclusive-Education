import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  InputAdornment,
  IconButton,
  CircularProgress,
  Link,
  Fade,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonAdd,
  Login as LoginIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ErrorBoundary from '../../components/ErrorBoundary/ErrorBoundary';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setLocalError] = useState('');
  const [success, setSuccess] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [formValid, setFormValid] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    role: 'student' // Default role
  });
  
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' // Default role
  });

  const { 
    user, 
    login, 
    register,
    loginAsGuest,
    error: authError,
    loginLoading: authLoginLoading,
    registerLoading: authRegisterLoading
  } = useAuth();
  
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Show auth errors from context
  useEffect(() => {
    if (authError) {
      setLocalError(authError);
      setSnackbarOpen(true);
      // We don't need to clear the error from context here
      // The error will be cleared on the next auth action
    }
  }, [authError]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setLocalError('');
    setSuccess('');
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateLogin = () => {
    if (!loginData.email.trim()) {
      setLocalError('Email is required');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(loginData.email)) {
      setLocalError('Please enter a valid email address');
      return false;
    }
    if (!loginData.password.trim()) {
      setLocalError('Password is required');
      return false;
    }
    return true;
  };

  const validateRegister = () => {
    if (!registerData.name.trim()) {
      setLocalError('Name is required');
      return false;
    }
    if (!registerData.email.trim()) {
      setLocalError('Email is required');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(registerData.email)) {
      setLocalError('Please enter a valid email address');
      return false;
    }
    if (!registerData.password) {
      setLocalError('Password is required');
      return false;
    }
    if (registerData.password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return false;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setLocalError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccess('');
    
    // Basic validation
    if (!loginData.email || !loginData.password) {
      setLocalError('Please enter both email and password');
      setSnackbarOpen(true);
      return;
    }
    
    try {
      setIsLoginLoading(true);
      
      // Call the login function from AuthContext
      const user = await login(loginData.email, loginData.password, loginData.role);
      
      if (!user) {
        throw new Error('Login failed: No user data returned');
      }
      
      // Show success message
      setSuccess(`Welcome back, ${user.name || 'User'}!`);
      setSnackbarOpen(true);
      
      // The AppContent's useEffect will handle the redirection
      // based on the updated auth state
      
    } catch (err) {
      console.error('Login error:', err);
      setLocalError(err.message || 'Invalid email or password. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccess('');
    
    // Basic validation
    if (!validateRegister()) {
      setSnackbarOpen(true);
      return;
    }
    
    try {
      setIsRegisterLoading(true);
      
      // Call the register function from AuthContext
      const userData = {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        role: registerData.role
      };
      
      const user = await register(userData);
      
      if (!user) {
        throw new Error('Registration failed: No user data returned');
      }
      
      setSuccess('Registration successful! Please log in.');
      setSnackbarOpen(true);
      
      // Switch to login tab after successful registration
      setActiveTab(0);
      
      // Clear the registration form
      setRegisterData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student'
      });
      
    } catch (err) {
      console.error('Registration error:', err);
      setLocalError(err.message || 'Registration failed. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setIsGuestLoading(true);
      setLocalError('');
      setSuccess('');
      
      // Clear any previous guest session
      localStorage.removeItem('guestUser');
      
      // Set guest user in context
      const guestUser = await loginAsGuest();
      
      if (!guestUser) {
        throw new Error('Failed to create guest session');
      }
      
      // Show success message
      setSuccess('Welcome, Guest User!');
      setSnackbarOpen(true);
      
      // Redirect to dashboard after a short delay to show the success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (error) {
      console.error('Guest login error:', error);
      setLocalError('Failed to login as guest. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setIsGuestLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <ErrorBoundary>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 2,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <Container maxWidth="sm">
          <Fade in={true} timeout={500}>
            <Paper 
              elevation={6} 
              sx={{
                p: 4,
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  bgcolor: 'primary.main',
                },
              }}
            >
              <Box textAlign="center" mb={3}>
                <Typography variant="h4" component="h1" color="primary" fontWeight="bold">
                  {activeTab === 0 ? 'Welcome Back!' : 'Create Account'}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {activeTab === 0 
                    ? 'Sign in to continue to your dashboard' 
                    : 'Join us and start your learning journey'}
                </Typography>
              </Box>

              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
                indicatorColor="primary"
                textColor="primary"
                sx={{ mb: 3 }}
              >
                <Tab label="Sign In" />
                <Tab label="Sign Up" />
              </Tabs>

              {activeTab === 0 ? (
                <Box component="form" onSubmit={handleLogin} noValidate>
                  <FormControl component="fieldset" sx={{ width: '100%', mb: 2, mt: 1 }}>
                    <FormLabel component="legend">I am a</FormLabel>
                    <RadioGroup
                      row
                      name="role"
                      value={loginData.role}
                      onChange={handleLoginChange}
                      sx={{ mt: 1 }}
                    >
                      <FormControlLabel 
                        value="student" 
                        control={<Radio size="small" />} 
                        label="Student" 
                      />
                      <FormControlLabel 
                        value="admin" 
                        control={<Radio size="small" />} 
                        label="Admin" 
                      />
                    </RadioGroup>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Email Address"
                    name="email"
                    type="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={handleLoginChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Box textAlign="right" mb={2}>
                    <Link 
                      component={RouterLink} 
                      to="/forgot-password" 
                      variant="body2"
                      color="primary"
                    >
                      Forgot password?
                    </Link>
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="large"
                    type="submit"
                    disabled={isLoginLoading || isGuestLoading}
                    startIcon={isLoginLoading ? <CircularProgress size={20} /> : <LoginIcon />}
                    sx={{ mt: 2, py: 1.5 }}
                  >
                    {isLoginLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </Box>
              ) : (
                <Box component="form" onSubmit={handleRegister} noValidate>
                  <FormControl component="fieldset" sx={{ width: '100%', mb: 2, mt: 1 }}>
                    <FormLabel component="legend">I am a</FormLabel>
                    <RadioGroup
                      row
                      name="role"
                      value={registerData.role}
                      onChange={handleRegisterChange}
                      sx={{ mt: 1 }}
                    >
                      <FormControlLabel 
                        value="student" 
                        control={<Radio size="small" />} 
                        label="Student" 
                      />
                      <FormControlLabel 
                        value="admin" 
                        control={<Radio size="small" />} 
                        label="Admin" 
                      />
                    </RadioGroup>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Full Name"
                    name="name"
                    value={registerData.name}
                    onChange={handleRegisterChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Email Address"
                    name="email"
                    type="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="large"
                    type="submit"
                    disabled={isRegisterLoading}
                    startIcon={isRegisterLoading ? <CircularProgress size={20} /> : <PersonAdd />}
                    sx={{ mt: 2, py: 1.5 }}
                  >
                    {isRegisterLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </Box>
              )}

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={handleGuestLogin}
                disabled={isGuestLoading}
                startIcon={isGuestLoading ? <CircularProgress size={20} /> : null}
                sx={{ mb: 2 }}
              >
                {isGuestLoading ? 'Signing in as Guest...' : 'Continue as Guest (Student)'}
              </Button>

              <Box textAlign="center" mt={2}>
                <Typography variant="body2" color="text.secondary">
                  {activeTab === 0 ? "Don't have an account? " : 'Already have an account? '}
                  <Link 
                    component="button" 
                    type="button" 
                    variant="body2"
                    onClick={() => setActiveTab(activeTab === 0 ? 1 : 0)}
                    sx={{ fontWeight: 'medium' }}
                  >
                    {activeTab === 0 ? 'Sign up' : 'Sign in'}
                  </Link>
                </Typography>
              </Box>
            </Paper>
          </Fade>
        </Container>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Box>
            {error && (
              <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
                {success}
              </Alert>
            )}
          </Box>
        </Snackbar>
      </Box>
    </ErrorBoundary>
  );
};

export default LoginPage;