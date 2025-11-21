import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors and set loading state
    setError('');
    setLoading(true);
    
    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting admin login...');
      
      // Explicitly set role to 'admin' for admin login
      const userData = await login(email, password, 'admin');
      
      console.log('Login response:', userData);
      
      // Verify the user has admin role
      if (userData && (userData.role === 'admin' || userData.isAdmin)) {
        // If we get here, login was successful
        console.log('Admin login successful, navigating to admin panel');
        navigate('/admin'); // Changed from '/admin/dashboard' to '/admin'
      } else {
        // User doesn't have admin privileges
        throw new Error('Access denied. You do not have administrator privileges.');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle specific error cases
      let errorMessage = 'Failed to log in. Please try again.';
      
      if (err.response) {
        // Server responded with an error
        errorMessage = err.response.data?.message || errorMessage;
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection.';
      } else if (err.message) {
        // Something happened in setting up the request
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      // Clear password field on error
      setPassword('');
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LockIcon color="primary" sx={{ fontSize: 40 }} />
            <Typography component="h1" variant="h5">
              Admin Login
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              error={!!error}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              error={!!error}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminLogin;