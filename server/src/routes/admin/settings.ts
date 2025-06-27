import { Router } from 'express';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// Middleware to protect all admin settings routes
router.use(isAdmin);

// Mock settings data - in a real application, these would be stored in database
let appSettings = {
  general: {
    siteName: 'AI Calorie Tracker',
    siteDescription: 'Advanced AI-powered food analysis and nutrition tracking',
    supportEmail: 'support@aicalorietracker.com',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
  },
  ai: {
    defaultProvider: 'openai',
    maxAnalysesPerDay: 10,
    enableAutoAnalysis: true,
    analysisTimeout: 30,
  },
  payment: {
    stripeEnabled: true,
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    trialDays: 7,
    currency: 'usd',
  },
  email: {
    provider: 'smtp',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    fromAddress: 'noreply@aicalorietracker.com',
    fromName: 'AI Calorie Tracker',
  },
  security: {
    passwordMinLength: 8,
    sessionTimeout: 1440, // 24 hours in minutes
    maxLoginAttempts: 5,
    lockoutDuration: 15, // minutes
    twoFactorEnabled: false,
  },
  notifications: {
    emailEnabled: true,
    pushEnabled: false,
    slackWebhook: '',
    discordWebhook: '',
  },
  storage: {
    provider: 'local',
    maxFileSize: 10, // MB
    allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    retentionDays: 90,
  },
  performance: {
    cacheEnabled: true,
    cacheTtl: 3600, // 1 hour
    compressionEnabled: true,
    rateLimitEnabled: true,
  },
};

// Get all settings
router.get('/', async (req, res) => {
  try {
    // In a real app, you'd fetch from database and possibly encrypt sensitive values
    const sanitizedSettings = {
      ...appSettings,
      email: {
        ...appSettings.email,
        smtpPassword: appSettings.email.smtpPassword ? '***CONFIGURED***' : ''
      }
    };
    
    res.json(sanitizedSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// Update specific settings section
router.put('/:section', async (req, res) => {
  try {
    const section = req.params.section;
    const newSettings = req.body;
    
    // Validate section exists
    if (!(section in appSettings)) {
      return res.status(400).json({ message: 'Invalid settings section' });
    }
    
    // Update the settings
    appSettings = {
      ...appSettings,
      [section]: {
        ...appSettings[section as keyof typeof appSettings],
        ...newSettings
      }
    };
    
    // In a real app, you'd save to database here
    console.log(`Updated ${section} settings:`, newSettings);
    
    res.json({ 
      success: true, 
      message: `${section} settings updated successfully`,
      settings: appSettings[section as keyof typeof appSettings]
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

// Get specific settings section
router.get('/:section', async (req, res) => {
  try {
    const section = req.params.section;
    
    if (!(section in appSettings)) {
      return res.status(400).json({ message: 'Invalid settings section' });
    }
    
    let sectionData = appSettings[section as keyof typeof appSettings];
    
    // Sanitize sensitive data
    if (section === 'email') {
      sectionData = {
        ...sectionData,
        smtpPassword: (sectionData as any).smtpPassword ? '***CONFIGURED***' : ''
      };
    }
    
    res.json(sectionData);
  } catch (error) {
    console.error('Error fetching settings section:', error);
    res.status(500).json({ message: 'Failed to fetch settings section' });
  }
});

// Test email configuration
router.post('/test-email', async (req, res) => {
  try {
    // In a real app, you'd actually send a test email using the configured settings
    console.log('Sending test email with settings:', {
      provider: appSettings.email.provider,
      host: appSettings.email.smtpHost,
      port: appSettings.email.smtpPort,
      from: appSettings.email.fromAddress
    });
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.json({ 
      success: true, 
      message: 'Test email sent successfully',
      sentTo: appSettings.general.supportEmail
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ message: 'Failed to send test email' });
  }
});

// Reset settings section to defaults
router.post('/:section/reset', async (req, res) => {
  try {
    const section = req.params.section;
    
    if (!(section in appSettings)) {
      return res.status(400).json({ message: 'Invalid settings section' });
    }
    
    // Define default settings
    const defaultSettings = {
      general: {
        siteName: 'AI Calorie Tracker',
        siteDescription: 'Advanced AI-powered food analysis and nutrition tracking',
        supportEmail: 'support@aicalorietracker.com',
        maintenanceMode: false,
        registrationEnabled: true,
        emailVerificationRequired: true,
      },
      ai: {
        defaultProvider: 'openai',
        maxAnalysesPerDay: 10,
        enableAutoAnalysis: true,
        analysisTimeout: 30,
      },
      payment: {
        stripeEnabled: true,
        monthlyPrice: 9.99,
        yearlyPrice: 99.99,
        trialDays: 7,
        currency: 'usd',
      },
      email: {
        provider: 'smtp',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUsername: '',
        smtpPassword: '',
        fromAddress: 'noreply@aicalorietracker.com',
        fromName: 'AI Calorie Tracker',
      },
      security: {
        passwordMinLength: 8,
        sessionTimeout: 1440,
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        twoFactorEnabled: false,
      },
      notifications: {
        emailEnabled: true,
        pushEnabled: false,
        slackWebhook: '',
        discordWebhook: '',
      },
      storage: {
        provider: 'local',
        maxFileSize: 10,
        allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        retentionDays: 90,
      },
      performance: {
        cacheEnabled: true,
        cacheTtl: 3600,
        compressionEnabled: true,
        rateLimitEnabled: true,
      },
    };
    
    // Reset to defaults
    appSettings = {
      ...appSettings,
      [section]: defaultSettings[section as keyof typeof defaultSettings]
    };
    
    res.json({ 
      success: true, 
      message: `${section} settings reset to defaults`,
      settings: appSettings[section as keyof typeof appSettings]
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ message: 'Failed to reset settings' });
  }
});

// Export settings (for backup)
router.get('/export/backup', async (req, res) => {
  try {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      settings: appSettings
    };
    
    res.setHeader('Content-Disposition', 'attachment; filename=settings-backup.json');
    res.setHeader('Content-Type', 'application/json');
    res.json(backup);
  } catch (error) {
    console.error('Error exporting settings:', error);
    res.status(500).json({ message: 'Failed to export settings' });
  }
});

// Import settings (from backup)
router.post('/import/backup', async (req, res) => {
  try {
    const { settings, version } = req.body;
    
    if (!settings) {
      return res.status(400).json({ message: 'Settings data is required' });
    }
    
    // Validate imported settings structure
    const requiredSections = ['general', 'ai', 'payment', 'email', 'security', 'notifications', 'storage', 'performance'];
    for (const section of requiredSections) {
      if (!(section in settings)) {
        return res.status(400).json({ message: `Missing required section: ${section}` });
      }
    }
    
    // Import settings
    appSettings = settings;
    
    console.log(`Settings imported from backup (version: ${version || 'unknown'})`);
    
    res.json({ 
      success: true, 
      message: 'Settings imported successfully',
      importedVersion: version || 'unknown'
    });
  } catch (error) {
    console.error('Error importing settings:', error);
    res.status(500).json({ message: 'Failed to import settings' });
  }
});

// Get system info
router.get('/system/info', async (req, res) => {
  try {
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
    
    res.json(systemInfo);
  } catch (error) {
    console.error('Error fetching system info:', error);
    res.status(500).json({ message: 'Failed to fetch system info' });
  }
});

export default router;