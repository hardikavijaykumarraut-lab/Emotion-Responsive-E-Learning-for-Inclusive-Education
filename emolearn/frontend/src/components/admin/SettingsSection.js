import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const SettingsSection = () => {
  const { api } = useAuth();
  const [settings, setSettings] = useState({
    siteTitle: 'EmoLearn',
    siteDescription: 'Emotion-based learning platform',
    theme: 'light',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    emailFrom: 'noreply@emolearn.com',
    emailServer: '',
    emailPort: 587,
    emailUsername: '',
    emailPassword: '',
    storageProvider: 'local',
    s3AccessKey: '',
    s3SecretKey: '',
    s3Bucket: '',
    s3Region: '',
    googleClientId: '',
    googleClientSecret: '',
    facebookAppId: '',
    facebookAppSecret: ''
  });
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentIntegration, setCurrentIntegration] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const integrations = [
    { id: 'google', name: 'Google', icon: 'G', enabled: !!settings.googleClientId },
    { id: 'facebook', name: 'Facebook', icon: 'F', enabled: !!settings.facebookAppId },
    { id: 'microsoft', name: 'Microsoft', icon: 'M', enabled: false },
    { id: 'github', name: 'GitHub', icon: 'G', enabled: false },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      showSnackbar('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/api/settings', settings);
      showSnackbar('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      showSnackbar('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleIntegrationClick = (integration) => {
    setCurrentIntegration(integration);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentIntegration(null);
  };

  const saveIntegration = async () => {
    // In a real app, this would save the integration settings
    showSnackbar(`${currentIntegration.name} settings saved`);
    handleCloseDialog();
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Settings</Typography>
      
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="General" />
        <Tab label="Email" />
        <Tab label="Storage" />
        <Tab label="Integrations" />
        <Tab label="Security" />
      </Tabs>

      <Paper sx={{ p: 3, mb: 3 }}>
        {tabValue === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Site Title"
                name="siteTitle"
                value={settings.siteTitle}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Site Description"
                name="siteDescription"
                value={settings.siteDescription}
                onChange={handleInputChange}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Theme</InputLabel>
                <Select
                  name="theme"
                  value={settings.theme}
                  onChange={handleInputChange}
                  label="Theme"
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="system">System Default</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.maintenanceMode}
                    onChange={handleInputChange}
                    name="maintenanceMode"
                    color="primary"
                  />
                }
                label="Maintenance Mode"
                sx={{ display: 'block', mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.registrationEnabled}
                    onChange={handleInputChange}
                    name="registrationEnabled"
                    color="primary"
                  />
                }
                label="Allow User Registration"
                sx={{ display: 'block', mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={handleInputChange}
                    name="emailNotifications"
                    color="primary"
                  />
                }
                label="Enable Email Notifications"
                sx={{ display: 'block' }}
              />
            </Grid>
          </Grid>
        )}

        {tabValue === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="From Email"
                name="emailFrom"
                value={settings.emailFrom}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="SMTP Server"
                name="emailServer"
                value={settings.emailServer}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                type="number"
                label="SMTP Port"
                name="emailPort"
                value={settings.emailPort}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SMTP Username"
                name="emailUsername"
                value={settings.emailUsername}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                type="password"
                label="SMTP Password"
                name="emailPassword"
                value={settings.emailPassword}
                onChange={handleInputChange}
                margin="normal"
              />
              <Box mt={2}>
                <Button variant="contained" color="primary">
                  Send Test Email
                </Button>
              </Box>
            </Grid>
          </Grid>
        )}

        {tabValue === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Storage Provider</InputLabel>
                <Select
                  name="storageProvider"
                  value={settings.storageProvider}
                  onChange={handleInputChange}
                  label="Storage Provider"
                >
                  <MenuItem value="local">Local Storage</MenuItem>
                  <MenuItem value="s3">Amazon S3</MenuItem>
                  <MenuItem value="azure" disabled>Azure Blob Storage</MenuItem>
                  <MenuItem value="gcp" disabled>Google Cloud Storage</MenuItem>
                </Select>
              </FormControl>
              
              {settings.storageProvider === 's3' && (
                <>
                  <TextField
                    fullWidth
                    label="S3 Access Key"
                    name="s3AccessKey"
                    value={settings.s3AccessKey}
                    onChange={handleInputChange}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    type="password"
                    label="S3 Secret Key"
                    name="s3SecretKey"
                    value={settings.s3SecretKey}
                    onChange={handleInputChange}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="S3 Bucket Name"
                    name="s3Bucket"
                    value={settings.s3Bucket}
                    onChange={handleInputChange}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="S3 Region"
                    name="s3Region"
                    value={settings.s3Region}
                    onChange={handleInputChange}
                    margin="normal"
                  />
                  <Button variant="contained" color="primary" sx={{ mt: 2 }}>
                    Test Connection
                  </Button>
                </>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Storage Usage</Typography>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Total Space: <strong>10 GB</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Used: <strong>2.5 GB (25%)</strong>
                    </Typography>
                  </Box>
                  <Box width="100%" height="10px" bgcolor="#e0e0e0" borderRadius="5px" overflow="hidden">
                    <Box width="25%" height="100%" bgcolor="primary.main" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tabValue === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>OAuth Integrations</Typography>
            <Grid container spacing={2}>
              {integrations.map((integration) => (
                <Grid item xs={12} sm={6} md={4} key={integration.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer',
                      borderColor: integration.enabled ? 'success.main' : 'divider',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                    onClick={() => handleIntegrationClick(integration)}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center">
                        <Box 
                          width={40} 
                          height={40} 
                          borderRadius="50%" 
                          bgcolor={integration.enabled ? 'success.light' : 'grey.200'}
                          display="flex" 
                          alignItems="center" 
                          justifyContent="center"
                          mr={2}
                        >
                          <Typography variant="h6" color={integration.enabled ? 'success.contrastText' : 'text.secondary'}>
                            {integration.icon}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle1">{integration.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {integration.enabled ? 'Connected' : 'Not connected'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {tabValue === 4 && (
          <Box>
            <Typography variant="h6" gutterBottom>Security Settings</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.require2FA}
                      onChange={handleInputChange}
                      name="require2FA"
                      color="primary"
                    />
                  }
                  label="Require Two-Factor Authentication"
                  sx={{ display: 'block', mb: 2 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.passwordExpiry}
                      onChange={handleInputChange}
                      name="passwordExpiry"
                      color="primary"
                    />
                  }
                  label="Enable Password Expiration (90 days)"
                  sx={{ display: 'block', mb: 2 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.loginAttempts}
                      onChange={handleInputChange}
                      name="loginAttempts"
                      color="primary"
                    />
                  }
                  label="Lock Account After 5 Failed Login Attempts"
                  sx={{ display: 'block' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Session Settings</Typography>
                <TextField
                  fullWidth
                  type="number"
                  label="Session Timeout (minutes)"
                  name="sessionTimeout"
                  value={settings.sessionTimeout || 30}
                  onChange={handleInputChange}
                  margin="normal"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.singleSession}
                      onChange={handleInputChange}
                      name="singleSession"
                      color="primary"
                    />
                  }
                  label="Allow Only One Active Session Per User"
                  sx={{ display: 'block', mt: 1 }}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      <Box display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      {/* Integration Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        {currentIntegration && (
          <>
            <DialogTitle>
              {currentIntegration.name} Integration
            </DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                margin="normal"
                label={`${currentIntegration.name} Client ID`}
                value={settings[`${currentIntegration.id}ClientId`] || ''}
                onChange={handleInputChange}
                name={`${currentIntegration.id}ClientId`}
              />
              <TextField
                fullWidth
                margin="normal"
                type="password"
                label={`${currentIntegration.name} Client Secret`}
                value={settings[`${currentIntegration.id}ClientSecret`] || ''}
                onChange={handleInputChange}
                name={`${currentIntegration.id}ClientSecret`}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                Redirect URI:
              </Typography>
              <Typography variant="caption" component="div" sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }}>
                {window.location.origin}/api/auth/{currentIntegration.id}/callback
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add this redirect URI to your {currentIntegration.name} Developer Console.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={saveIntegration} variant="contained" color="primary">
                Save
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsSection;
