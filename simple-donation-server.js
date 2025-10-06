const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Twitch API Configuration
const TWITCH_CONFIG = {
  clientId: 'meabi1n42pccff5rz9ujpno7ky9vlt',
  clientSecret: 'y7pguc8mv066etiu7eqs67bcleoxnu',
  webhookSecret: 'y7pguc8mv066etiu7eqs67bcleoxnu'
};

// Store active connections to broadcast to
const connectedClients = new Set();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Verify Twitch webhook signature
function verifyTwitchSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = 'sha256=' + hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

// Broadcast donation to all connected clients
function broadcastDonation(donationData) {
  const message = JSON.stringify({
    type: 'donation',
    data: donationData
  });
  
  connectedClients.forEach(client => {
    try {
      client.write(`data: ${message}\n\n`);
    } catch (error) {
      console.error('Error broadcasting to client:', error);
      connectedClients.delete(client);
    }
  });
  
  console.log('📢 Broadcasted donation:', donationData);
}

// Webhook endpoint for Twitch Bits
app.post('/webhook/bits', (req, res) => {
  const signature = req.headers['twitch-eventsub-message-signature'];
  const body = JSON.stringify(req.body);
  
  // Verify webhook signature
  if (!verifyTwitchSignature(body, signature, TWITCH_CONFIG.webhookSecret)) {
    console.error('❌ Invalid webhook signature for bits');
    return res.status(403).send('Forbidden');
  }
  
  const event = req.body.event;
  console.log('🎉 Bits received:', event);
  
  // Trigger donation effect
  const donationData = {
    type: 'bits',
    amount: event.bits_used,
    message: event.message || 'Thanks for the bits!',
    from: event.user_name,
    timestamp: Date.now()
  };
  
  broadcastDonation(donationData);
  res.status(200).send('OK');
});

// Server-Sent Events endpoint for real-time updates
app.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  // Add client to connected clients
  connectedClients.add(res);
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to donation server' })}\n\n`);
  
  // Handle client disconnect
  req.on('close', () => {
    connectedClients.delete(res);
    console.log('Client disconnected. Active connections:', connectedClients.size);
  });
  
  console.log('Client connected. Active connections:', connectedClients.size);
});

// Test endpoint to trigger donation manually
app.post('/test-donation', (req, res) => {
  const { type, amount, message, from } = req.body;
  
  const donationData = {
    type: type || 'donation',
    amount: amount || 5,
    message: message || 'Test donation',
    from: from || 'TestUser',
    timestamp: Date.now()
  };
  
  broadcastDonation(donationData);
  res.json({ success: true, donation: donationData });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    connectedClients: connectedClients.size,
    uptime: process.uptime()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple donation server running on http://localhost:${PORT}`);
  console.log('📡 Available endpoints:');
  console.log(`   Test: http://localhost:3000/test-donation`);
  console.log(`   Events: http://localhost:3000/events`);
  console.log(`   Health: http://localhost:3000/health`);
  console.log(`   Bits webhook: http://localhost:3000/webhook/bits`);
  console.log('');
  console.log('✅ Server is ready! Your website can connect to: http://localhost:3000');
  console.log('💡 For Twitch webhooks, you need to expose this server to the internet');
  console.log('💡 You can use ngrok manually: ngrok http 3000');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
