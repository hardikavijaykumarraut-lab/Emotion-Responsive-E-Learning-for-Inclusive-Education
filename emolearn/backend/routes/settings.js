const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Path to settings file
const SETTINGS_PATH = path.join(__dirname, '../data/settings.json');

// Helper function to read settings
async function readSettings() {
  try {
    const data = await fs.readFile(SETTINGS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, create with default settings
    if (error.code === 'ENOENT') {
      const defaultSettings = {
        appName: 'Emotion Learning Platform',
        theme: {
          primaryColor: '#4a6fa5',
          secondaryColor: '#6c757d',
          darkMode: false
        },
        features: {
          enableGamification: true,
          enableSocialSharing: true,
          enableEmailNotifications: true
        },
        maintenanceMode: false,
        version: '1.0.0',
        updatedAt: new Date().toISOString()
      };
      await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
      await fs.writeFile(SETTINGS_PATH, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
    throw error;
  }
}

// Helper function to write settings
async function writeSettings(settings) {
  const updatedSettings = {
    ...settings,
    updatedAt: new Date().toISOString()
  };
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(updatedSettings, null, 2));
  return updatedSettings;
}

// Get all settings
router.get('/', verifyToken, async (req, res) => {
  try {
    const settings = await readSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error reading settings:', error);
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// Update settings (admin only)
router.put('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const currentSettings = await readSettings();
    const updatedSettings = { ...currentSettings, ...req.body };
    
    // Save the updated settings
    const savedSettings = await writeSettings(updatedSettings);
    
    res.json(savedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get specific setting section
router.get('/:section', verifyToken, async (req, res) => {
  try {
    const { section } = req.params;
    const settings = await readSettings();
    
    if (settings[section] === undefined) {
      return res.status(404).json({ error: 'Setting section not found' });
    }
    
    res.json(settings[section]);
  } catch (error) {
    console.error(`Error reading ${req.params.section} settings:`, error);
    res.status(500).json({ error: `Failed to read ${req.params.section} settings` });
  }
});

// Update specific setting section (admin only)
router.put('/:section', verifyToken, isAdmin, async (req, res) => {
  try {
    const { section } = req.params;
    const currentSettings = await readSettings();
    
    if (currentSettings[section] === undefined) {
      return res.status(404).json({ error: 'Setting section not found' });
    }
    
    const updatedSettings = {
      ...currentSettings,
      [section]: { ...currentSettings[section], ...req.body }
    };
    
    // Save the updated settings
    const savedSettings = await writeSettings(updatedSettings);
    
    res.json(savedSettings[section]);
  } catch (error) {
    console.error(`Error updating ${req.params.section} settings:`, error);
    res.status(500).json({ error: `Failed to update ${req.params.section} settings` });
  }
});

// Toggle maintenance mode (admin only)
router.post('/maintenance', verifyToken, isAdmin, async (req, res) => {
  try {
    const currentSettings = await readSettings();
    const maintenanceMode = !currentSettings.maintenanceMode;
    
    const updatedSettings = {
      ...currentSettings,
      maintenanceMode,
      maintenanceMessage: req.body.message || 'The application is currently under maintenance.'
    };
    
    // Save the updated settings
    const savedSettings = await writeSettings(updatedSettings);
    
    res.json({
      maintenanceMode: savedSettings.maintenanceMode,
      maintenanceMessage: savedSettings.maintenanceMessage
    });
  } catch (error) {
    console.error('Error toggling maintenance mode:', error);
    res.status(500).json({ error: 'Failed to toggle maintenance mode' });
  }
});

// Get feature flags
router.get('/features/flags', verifyToken, async (req, res) => {
  try {
    const settings = await readSettings();
    res.json(settings.features || {});
  } catch (error) {
    console.error('Error reading feature flags:', error);
    res.status(500).json({ error: 'Failed to read feature flags' });
  }
});

// Update feature flags (admin only)
router.put('/features/flags', verifyToken, isAdmin, async (req, res) => {
  try {
    const currentSettings = await readSettings();
    
    const updatedSettings = {
      ...currentSettings,
      features: {
        ...currentSettings.features,
        ...req.body
      }
    };
    
    // Save the updated settings
    const savedSettings = await writeSettings(updatedSettings);
    
    res.json(savedSettings.features);
  } catch (error) {
    console.error('Error updating feature flags:', error);
    res.status(500).json({ error: 'Failed to update feature flags' });
  }
});

module.exports = router;
