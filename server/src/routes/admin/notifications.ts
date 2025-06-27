import { Router } from 'express';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// Middleware to protect all admin notification routes
router.use(isAdmin);

// Mock notification data - in a real application, this would be stored in database
let notifications = [
  {
    id: 'notif_1',
    title: 'System Maintenance Scheduled',
    message: 'Scheduled maintenance will occur tomorrow from 2 AM to 4 AM EST. All services will be temporarily unavailable.',
    type: 'warning',
    priority: 'high',
    status: 'sent',
    channels: ['email', 'push'],
    recipients: {
      type: 'all',
      count: 1250
    },
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    createdBy: 'admin@system.com',
    openRate: 78.5,
    clickRate: 12.3
  },
  {
    id: 'notif_2',
    title: 'Premium Feature Update',
    message: 'New AI analysis features are now available for premium users. Upgrade today to access advanced nutrition insights!',
    type: 'info',
    priority: 'medium',
    status: 'draft',
    channels: ['email'],
    recipients: {
      type: 'free',
      count: 850
    },
    scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    sentAt: '',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    createdBy: 'marketing@system.com',
    openRate: 0,
    clickRate: 0
  }
];

let templates = [
  {
    id: 'template_1',
    name: 'Welcome Email',
    subject: 'Welcome to {{siteName}}!',
    content: 'Hello {{userName}}, welcome to our platform!',
    type: 'email',
    variables: ['siteName', 'userName'],
    isActive: true
  },
  {
    id: 'template_2',
    name: 'Security Alert',
    subject: 'Security Alert - {{alertType}}',
    content: 'We detected {{alertType}} on your account from {{location}}.',
    type: 'email',
    variables: ['alertType', 'location'],
    isActive: true
  }
];

// Get notification statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      totalSent: notifications.filter(n => n.status === 'sent').length,
      totalScheduled: notifications.filter(n => n.status === 'scheduled').length,
      averageOpenRate: 65.2,
      averageClickRate: 8.7,
      failedDeliveries: 23,
      activeSubscribers: 1250
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ message: 'Failed to fetch notification statistics' });
  }
});

// Get notifications with filtering
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    
    let filteredNotifications = [...notifications];
    
    // Filter by type
    if (type && type !== 'all') {
      filteredNotifications = filteredNotifications.filter(n => n.type === type);
    }
    
    // Filter by status
    if (status && status !== 'all') {
      filteredNotifications = filteredNotifications.filter(n => n.status === status);
    }
    
    // Sort by creation date (newest first)
    filteredNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    res.json(filteredNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Create new notification
router.post('/', async (req, res) => {
  try {
    const { title, message, type, priority, channels, recipients } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }
    
    // Calculate recipient count based on type
    let recipientCount = 0;
    switch (recipients.type) {
      case 'all':
        recipientCount = 1250;
        break;
      case 'premium':
        recipientCount = 400;
        break;
      case 'free':
        recipientCount = 850;
        break;
      case 'custom':
        recipientCount = recipients.customList?.length || 0;
        break;
    }
    
    const newNotification = {
      id: `notif_${Date.now()}`,
      title,
      message,
      type: type || 'info',
      priority: priority || 'medium',
      status: 'draft' as const,
      channels: channels || ['email'],
      recipients: {
        ...recipients,
        count: recipientCount
      },
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // Default to 1 hour from now
      sentAt: '',
      createdAt: new Date().toISOString(),
      createdBy: req.user?.email || 'admin',
      openRate: 0,
      clickRate: 0
    };
    
    notifications.push(newNotification);
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification: newNotification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Failed to create notification' });
  }
});

// Send notification
router.post('/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    
    const notificationIndex = notifications.findIndex(n => n.id === id);
    if (notificationIndex === -1) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    const notification = notifications[notificationIndex];
    
    if (notification.status !== 'draft' && notification.status !== 'scheduled') {
      return res.status(400).json({ message: 'Notification cannot be sent' });
    }
    
    // Update notification status
    notifications[notificationIndex] = {
      ...notification,
      status: 'sent',
      sentAt: new Date().toISOString()
    };
    
    // In a real application, you would trigger the actual sending process here
    console.log(`Sending notification: ${notification.title} to ${notification.recipients.count} recipients`);
    
    // Simulate sending to different channels
    notification.channels.forEach(channel => {
      console.log(`- Sending via ${channel}`);
    });
    
    res.json({
      success: true,
      message: 'Notification sent successfully',
      notification: notifications[notificationIndex]
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

// Update notification
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const notificationIndex = notifications.findIndex(n => n.id === id);
    if (notificationIndex === -1) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Update notification
    notifications[notificationIndex] = {
      ...notifications[notificationIndex],
      ...updateData
    };
    
    res.json({
      success: true,
      message: 'Notification updated successfully',
      notification: notifications[notificationIndex]
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const notificationIndex = notifications.findIndex(n => n.id === id);
    if (notificationIndex === -1) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    const deletedNotification = notifications.splice(notificationIndex, 1)[0];
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// Get notification templates
router.get('/templates', async (req, res) => {
  try {
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
});

// Create notification template
router.post('/templates', async (req, res) => {
  try {
    const { name, subject, content, type, variables } = req.body;
    
    if (!name || !subject || !content) {
      return res.status(400).json({ message: 'Name, subject, and content are required' });
    }
    
    const newTemplate = {
      id: `template_${Date.now()}`,
      name,
      subject,
      content,
      type: type || 'email',
      variables: variables || [],
      isActive: true
    };
    
    templates.push(newTemplate);
    
    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      template: newTemplate
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ message: 'Failed to create template' });
  }
});

// Update notification template
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const templateIndex = templates.findIndex(t => t.id === id);
    if (templateIndex === -1) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    templates[templateIndex] = {
      ...templates[templateIndex],
      ...updateData
    };
    
    res.json({
      success: true,
      message: 'Template updated successfully',
      template: templates[templateIndex]
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ message: 'Failed to update template' });
  }
});

// Delete notification template
router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const templateIndex = templates.findIndex(t => t.id === id);
    if (templateIndex === -1) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    templates.splice(templateIndex, 1);
    
    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ message: 'Failed to delete template' });
  }
});

// Get notification settings
router.get('/settings', async (req, res) => {
  try {
    const settings = {
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      slackEnabled: false,
      defaultSendTime: '09:00',
      maxDailyNotifications: 5,
      retryFailedDeliveries: 3,
      deliveryConfirmation: true,
      unsubscribeEnabled: true,
      personalizedContent: true
    };
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ message: 'Failed to fetch notification settings' });
  }
});

// Update notification settings
router.put('/settings', async (req, res) => {
  try {
    const settings = req.body;
    
    // In a real application, you would save these settings to database
    console.log('Updated notification settings:', settings);
    
    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Failed to update notification settings' });
  }
});

// Send test notification
router.post('/test', async (req, res) => {
  try {
    const { channel, recipient } = req.body;
    
    if (!channel || !recipient) {
      return res.status(400).json({ message: 'Channel and recipient are required' });
    }
    
    // Simulate sending test notification
    console.log(`Sending test ${channel} notification to ${recipient}`);
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.json({
      success: true,
      message: `Test ${channel} notification sent to ${recipient}`,
      sentAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ message: 'Failed to send test notification' });
  }
});

// Get notification analytics
router.get('/analytics', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Mock analytics data
    const analytics = {
      timeRange,
      deliveryMetrics: {
        emailDeliveryRate: 95.2,
        pushDeliveryRate: 87.8,
        smsDeliveryRate: 99.1,
        averageOpenRate: 24.3
      },
      engagementMetrics: {
        clickThroughRate: 3.2,
        unsubscribeRate: 0.8,
        bounceRate: 2.1,
        complaintRate: 0.1
      },
      channelPerformance: [
        { channel: 'email', sent: 1250, delivered: 1190, opened: 289, clicked: 38 },
        { channel: 'push', sent: 890, delivered: 782, opened: 234, clicked: 31 },
        { channel: 'sms', sent: 450, delivered: 446, opened: 178, clicked: 12 }
      ],
      topPerformingNotifications: notifications
        .filter(n => n.status === 'sent')
        .sort((a, b) => (b.openRate || 0) - (a.openRate || 0))
        .slice(0, 5)
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching notification analytics:', error);
    res.status(500).json({ message: 'Failed to fetch notification analytics' });
  }
});

export default router;