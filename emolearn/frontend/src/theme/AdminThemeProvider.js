import React, { createContext, useMemo, useState, useContext, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import adminTheme from './adminTheme';

// Create a context for theme mode
const ThemeModeContext = createContext({
  toggleColorMode: () => {},
  mode: 'light',
});

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return context;
};

const AdminThemeProvider = ({ children }) => {
  // Get the initial mode from localStorage or default to 'light'
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem('adminThemeMode') || 'light';
    } catch (error) {
      return 'light';
    }
  });

  // Save the theme mode preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('adminThemeMode', mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }, [mode]);

  // Toggle between light and dark mode
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
      mode,
    }),
    [mode]
  );

  // Create the theme based on the current mode
  const theme = useMemo(() => adminTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export default AdminThemeProvider;
