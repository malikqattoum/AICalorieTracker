import express from 'express';
const app = express();
const PORT = 3003;

// Simple test endpoint for mobile app connectivity
app.get('/api/mobile-test', (req, res) => {
  console.log('=== MOBILE TEST ENDPOINT HIT ===');
  console.log('Request received from mobile app');
  console.log('Sending connectivity test response');
  
  res.json({
    success: true,
    message: 'Mobile app connectivity test successful',
    timestamp: new Date().toISOString(),
    server: 'AI Calorie Tracker Test Backend',
    version: '1.0.0',
    environment: 'test',
    ip: req.ip,
    headers: {
      'user-agent': req.get('User-Agent'),
      'x-forwarded-for': req.get('X-Forwarded-For'),
      'x-real-ip': req.get('X-Real-IP')
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Test server is healthy',
    timestamp: new Date().toISOString(),
    server: 'AI Calorie Tracker Test Backend',
    version: '1.0.0'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test endpoint available at: http://localhost:${PORT}/api/mobile-test`);
});