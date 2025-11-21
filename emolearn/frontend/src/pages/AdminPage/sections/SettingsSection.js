import React, { useState, useEffect } from 'react';
import adminApi from '../../../api/adminApi';
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
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  MenuItem,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Visibility,
  VisibilityOff,
  HelpOutline as HelpIcon
} from '@mui/icons-material';

// Form handling
const useFormik = (config) => {
  const [values, setValues] = React.useState(config.initialValues || {});
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({
      ...touched,
      [name]: true
    });
  };

  const validateForm = (formValues, activeTabContext) => {
    if (config.validationSchema) {
      // Pass context to validation schema
      return config.validationSchema.validate(formValues || values, { 
        context: { activeTab: activeTabContext } 
      });
    }
    return {};
  };

  const handleSubmit = async (e, activeTabContext) => {
    e?.preventDefault();
    
    // Validate form
    const validationErrors = validateForm(undefined, activeTabContext);
    setErrors(validationErrors);
    
    // If there are errors, don't submit
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await config.onSubmit(values, activeTabContext);
    } catch (error) {
      setErrors(error.errors || {});
    } finally {
      setIsSubmitting(false);
    }
  };

  // Re-validate when values changes
  React.useEffect(() => {
    // Validation will happen on submit, not automatically
  }, [values]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting,
    setFieldValue: (field, value) => {
      setValues({
        ...values,
        [field]: value
      });
    },
    setFieldTouched: (field, isTouched = true) => {
      setTouched({
        ...touched,
        [field]: isTouched
      });
    },
    resetForm: () => {
      setValues(config.initialValues || {});
      setErrors({});
      setTouched({});
    },
    dirty: JSON.stringify(values) !== JSON.stringify(config.initialValues || {})
  };
};

// Simple validation
const Yup = {
  object: (schema) => ({
    validate: (values, context = {}) => {
      const errors = {};
      Object.entries(schema).forEach(([key, validateFn]) => {
        // Handle regular required validation
        if (validateFn.required && !values[key]) {
          errors[key] = validateFn.message || 'This field is required';
        }
        // Handle conditional validation
        if (validateFn.conditions) {
          validateFn.conditions.forEach(condition => {
            const { field, value, then } = condition;
            // For our case, we're checking the activeTab context
            if (context.activeTab === 'email' && key === 'smtpHost' && then.required && !values[key]) {
              errors[key] = then.message || 'This field is required';
            }
          });
        }
      });
      return errors;
    }
  }),
  string: () => {
    const schema = {
      required: (message) => {
        schema.required = true;
        schema.message = message;
        return schema;
      },
      when: (field, options) => {
        // Simple implementation of when method
        if (!schema.conditions) {
          schema.conditions = [];
        }
        schema.conditions.push({
          field,
          value: options.is,
          then: options.then({
            required: (message) => ({
              required: true,
              message
            })
          })
        });
        return schema;
      }
    };
    return schema;
  }
};

// Helper to create conditional schema
const whenHelper = (Yup) => {
  return {
    required: (message) => ({
      required: true,
      message
    })
  };
};

const SettingsSection = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    general: {
      siteName: 'EmoLearn',
      siteDescription: 'Emotion-based Learning Platform',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      itemsPerPage: 10,
      enableRegistration: true,
      enableEmailVerification: true,
    },
    email: {
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpSecure: true,
      smtpUser: 'user@example.com',
      smtpPassword: '',
      fromEmail: 'noreply@emolearn.com',
      fromName: 'EmoLearn',
    },
    security: {
      enable2FA: false,
      passwordMinLength: 8,
      requireStrongPassword: true,
      failedLoginAttempts: 5,
      accountLockoutTime: 30, // minutes
      sessionTimeout: 30, // minutes
    },
    maintenance: {
      maintenanceMode: false,
      maintenanceMessage: 'Site is under maintenance. Please check back later.',
    },
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getSettings();
      setSettings(prev => ({
        ...prev,
        ...response.data,
      }));
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSaveSettings = async (values, activeTabContext) => {
    try {
      setSaving(true);
      setError('');
      
      // Only send the settings for the active tab
      const settingsToUpdate = {
        [activeTabContext]: values
      };
      
      await adminApi.updateSettings(settingsToUpdate);
      
      // Update local state
      setSettings(prev => ({
        ...prev,
        [activeTabContext]: values
      }));
      
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const renderGeneralSettings = () => (
    <form onSubmit={(e) => formik.handleSubmit(e, activeTab)}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Site Name"
            name="siteName"
            value={formik.values.siteName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.siteName && Boolean(formik.errors.siteName)}
            helperText={formik.touched.siteName && formik.errors.siteName}
            disabled={saving}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Site Description"
            name="siteDescription"
            value={formik.values.siteDescription}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={saving}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="Timezone"
            name="timezone"
            value={formik.values.timezone}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={saving}
          >
            <MenuItem value="UTC">UTC</MenuItem>
            <MenuItem value="GMT">GMT</MenuItem>
            <MenuItem value="EST">EST</MenuItem>
            <MenuItem value="PST">PST</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="Date Format"
            name="dateFormat"
            value={formik.values.dateFormat}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={saving}
          >
            <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
            <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
            <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Items Per Page"
            name="itemsPerPage"
            value={formik.values.itemsPerPage}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.itemsPerPage && Boolean(formik.errors.itemsPerPage)}
            helperText={formik.touched.itemsPerPage && formik.errors.itemsPerPage}
            disabled={saving}
            inputProps={{ min: 5, max: 100 }}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formik.values.enableRegistration}
                onChange={(e) =>
                  formik.setFieldValue('enableRegistration', e.target.checked)
                }
                name="enableRegistration"
                color="primary"
                disabled={saving}
              />
            }
            label="Enable User Registration"
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formik.values.enableEmailVerification}
                onChange={(e) =>
                  formik.setFieldValue('enableEmailVerification', e.target.checked)
                }
                name="enableEmailVerification"
                color="primary"
                disabled={saving || !formik.values.enableRegistration}
              />
            }
            label="Require Email Verification"
            disabled={!formik.values.enableRegistration}
          />
        </Grid>
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={saving || !formik.dirty}
        >
          Save Changes
        </Button>
      </Box>
    </form>
  );

  const renderEmailSettings = () => (
    <form onSubmit={(e) => formik.handleSubmit(e, activeTab)}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="SMTP Host"
            name="smtpHost"
            value={formik.values.smtpHost}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.smtpHost && Boolean(formik.errors.smtpHost)}
            helperText={formik.touched.smtpHost && formik.errors.smtpHost}
            disabled={saving}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="SMTP Port"
            name="smtpPort"
            value={formik.values.smtpPort}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.smtpPort && Boolean(formik.errors.smtpPort)}
            helperText={formik.touched.smtpPort && formik.errors.smtpPort}
            disabled={saving}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formik.values.smtpSecure}
                onChange={(e) =>
                  formik.setFieldValue('smtpSecure', e.target.checked)
                }
                name="smtpSecure"
                color="primary"
                disabled={saving}
              />
            }
            label="Use SSL/TLS"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="SMTP Username"
            name="smtpUser"
            value={formik.values.smtpUser}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={saving}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="SMTP Password"
            name="smtpPassword"
            value={formik.values.smtpPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={saving}
            InputProps={{
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
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="From Email"
            name="fromEmail"
            type="email"
            value={formik.values.fromEmail}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.fromEmail && Boolean(formik.errors.fromEmail)}
            helperText={formik.touched.fromEmail && formik.errors.fromEmail}
            disabled={saving}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="From Name"
            name="fromName"
            value={formik.values.fromName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={saving}
          />
        </Grid>
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => formik.resetForm()}
          disabled={saving || !formik.dirty}
        >
          Reset
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={saving || !formik.dirty}
        >
          Save Email Settings
        </Button>
      </Box>
    </form>
  );

  const renderSecuritySettings = () => (
    <form onSubmit={(e) => formik.handleSubmit(e, activeTab)}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formik.values.enable2FA}
                onChange={(e) =>
                  formik.setFieldValue('enable2FA', e.target.checked)
                }
                name="enable2FA"
                color="primary"
                disabled={saving}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Enable Two-Factor Authentication (2FA)
                <Tooltip title="Requires users to verify their identity using an authenticator app">
                  <HelpIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
                </Tooltip>
              </Box>
            }
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Minimum Password Length"
            name="passwordMinLength"
            value={formik.values.passwordMinLength}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.passwordMinLength &&
              Boolean(formik.errors.passwordMinLength)
            }
            helperText={
              formik.touched.passwordMinLength && formik.errors.passwordMinLength
            }
            disabled={saving}
            inputProps={{ min: 6, max: 32 }}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formik.values.requireStrongPassword}
                onChange={(e) =>
                  formik.setFieldValue('requireStrongPassword', e.target.checked)
                }
                name="requireStrongPassword"
                color="primary"
                disabled={saving}
              />
            }
            label="Require Strong Passwords"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Failed Login Attempts Before Lockout"
            name="failedLoginAttempts"
            value={formik.values.failedLoginAttempts}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={saving}
            inputProps={{ min: 1, max: 10 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Account Lockout Time (minutes)"
            name="accountLockoutTime"
            value={formik.values.accountLockoutTime}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={saving}
            inputProps={{ min: 1, max: 1440 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Session Timeout (minutes)"
            name="sessionTimeout"
            value={formik.values.sessionTimeout}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={saving}
            inputProps={{ min: 5, max: 1440 }}
          />
        </Grid>
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={saving || !formik.dirty}
        >
          Save Security Settings
        </Button>
      </Box>
    </form>
  );

  const renderMaintenanceSettings = () => (
    <form onSubmit={(e) => formik.handleSubmit(e, activeTab)}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formik.values.maintenanceMode}
                onChange={(e) =>
                  formik.setFieldValue('maintenanceMode', e.target.checked)
                }
                name="maintenanceMode"
                color="primary"
                disabled={saving}
              />
            }
            label="Enable Maintenance Mode"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Maintenance Message"
            name="maintenanceMessage"
            value={formik.values.maintenanceMessage}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={saving || !formik.values.maintenanceMode}
            placeholder="We're currently performing maintenance. Please check back soon."
          />
        </Grid>
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={saving || !formik.dirty}
        >
          Save Maintenance Settings
        </Button>
      </Box>
    </form>
  );

  // Initialize formik with the current settings for the active tab
  const formik = useFormik({
    initialValues: settings[activeTab] || {},
    enableReinitialize: true,
    validationSchema: Yup.object({
      // Add validation schemas for each tab
      siteName: Yup.string().required('Required'),
      // Add more validation rules as needed
    }),
    validateOnMount: true,
    onSubmit: handleSaveSettings,
  });

  // Reset form when activeTab changes
  useEffect(() => {
    formik.resetForm();
  }, [activeTab]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5">System Settings</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchSettings}
          disabled={loading || saving}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card>
        <CardHeader
          title={
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="settings tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="General" value="general" />
              <Tab label="Email" value="email" />
              <Tab label="Security" value="security" />
              <Tab label="Maintenance" value="maintenance" />
            </Tabs>
          }
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiCardHeader-content': {
              width: '100%',
            },
          }}
        />
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {activeTab === 'general' && renderGeneralSettings()}
              {activeTab === 'email' && renderEmailSettings()}
              {activeTab === 'security' && renderSecuritySettings()}
              {activeTab === 'maintenance' && renderMaintenanceSettings()}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SettingsSection;