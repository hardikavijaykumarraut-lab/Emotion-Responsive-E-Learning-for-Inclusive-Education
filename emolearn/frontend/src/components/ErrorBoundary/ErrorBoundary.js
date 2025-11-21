import React, { Component } from 'react';
import { Box, Button, Typography } from '@mui/material';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // You can log errors to an error reporting service here
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
            textAlign: 'center',
            backgroundColor: 'background.default'
          }}
        >
          <Typography variant="h4" color="error" gutterBottom>
            Oops! Something went wrong
          </Typography>
          <Typography variant="body1" paragraph>
            We're sorry, but an unexpected error occurred. Our team has been notified.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={this.handleRefresh}
            sx={{ mt: 2 }}
          >
            Refresh Page
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Box 
              sx={{
                mt: 4,
                p: 2,
                backgroundColor: 'grey.100',
                borderRadius: 1,
                textAlign: 'left',
                maxWidth: '100%',
                overflow: 'auto',
                maxHeight: '200px'
              }}
            >
              <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {this.state.error?.toString()}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
