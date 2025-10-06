const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const ngrok = require('ngrok');

const app = express();
const PORT = 3000;

// Twitch API Configuration
const TWITCH_CONFIG = {
  clientId: 'meabi1n42pccff5rz9ujpno7ky9vlt',
  clientSecret: 'y7pguc8mv066etiu7eqs67bcleoxnu',
  webhookSecret: 'y7pguc8mv066etiu7eqs67bcleoxnu', // Using client secret as webhook secret
  ngrokAuthToken: '2x63QelQ5ib9dYvMxhOw0CqWeox_4Ugyga8vFUsYabGbFZ5fP'
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

// Webhook endpoint for Channel Points
app.post('/webhook/channel-points', (req, res) => {
  const signature = req.headers['twitch-eventsub-message-signature'];
  const body = JSON.stringify(req.body);
  
  if (!verifyTwitchSignature(body, signature, TWITCH_CONFIG.webhookSecret)) {
    console.error('❌ Invalid webhook signature for channel points');
    return res.status(403).send('Forbidden');
  }
  
  const event = req.body.event;
  console.log('⭐ Channel points redeemed:', event);
  
  const donationData = {
    type: 'points',
    amount: event.reward.cost,
    message: `Redeemed: ${event.reward.title}`,
    from: event.user_name,
    timestamp: Date.now()
  };
  
  broadcastDonation(donationData);
  res.status(200).send('OK');
});

// Webhook endpoint for Subscriptions
app.post('/webhook/subscription', (req, res) => {
  const signature = req.headers['twitch-eventsub-message-signature'];
  const body = JSON.stringify(req.body);
  
  if (!verifyTwitchSignature(body, signature, TWITCH_CONFIG.webhookSecret)) {
    console.error('❌ Invalid webhook signature for subscription');
    return res.status(403).send('Forbidden');
  }
  
  const event = req.body.event;
  console.log('🎉 New subscription:', event);
  
  const amount = event.tier === '1000' ? 5 : event.tier === '2000' ? 10 : 25;
  const donationData = {
    type: 'subscription',
    amount: amount,
    message: 'Thanks for subscribing!',
    from: event.user_name,
    timestamp: Date.now()
  };
  
  broadcastDonation(donationData);
  res.status(200).send('OK');
});

// Webhook endpoint for Follows
app.post('/webhook/follow', (req, res) => {
  const signature = req.headers['twitch-eventsub-message-signature'];
  const body = JSON.stringify(req.body);
  
  if (!verifyTwitchSignature(body, signature, TWITCH_CONFIG.webhookSecret)) {
    console.error('❌ Invalid webhook signature for follow');
    return res.status(403).send('Forbidden');
  }
  
  const event = req.body.event;
  console.log('👋 New follower:', event);
  
  const donationData = {
    type: 'follow',
    amount: 0,
    message: 'Thanks for following!',
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

// Start server and ngrok tunnel
async function startServer() {
  try {
    // Start Express server first
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
    
    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to start ngrok tunnel
    try {
      console.log('🌐 Starting ngrok tunnel...');
      
      // Set auth token
      await ngrok.authtoken(TWITCH_CONFIG.ngrokAuthToken);
      console.log('✅ Ngrok auth token set');
      
      // Connect tunnel
      const url = await ngrok.connect({
        addr: PORT,
        authtoken: TWITCH_CONFIG.ngrokAuthToken
      });
      
      console.log('🌐 Ngrok tunnel active:', url);
      console.log('📡 Webhook endpoints:');
      console.log(`   Bits: ${url}/webhook/bits`);
      console.log(`   Channel Points: ${url}/webhook/channel-points`);
      console.log(`   Subscriptions: ${url}/webhook/subscription`);
      console.log(`   Follows: ${url}/webhook/follow`);
      console.log(`   Events: ${url}/events`);
      console.log(`   Test: ${url}/test-donation`);
      
      // Save ngrok URL to file for easy access
      require('fs').writeFileSync('ngrok-url.txt', url);
      
      console.log('\n✅ Server is ready! Your website can now connect to:', url);
      console.log('💡 Use this URL to set up Twitch EventSub webhooks');
      
    } catch (ngrokError) {
      console.log('⚠️ Ngrok tunnel failed to start:', ngrokError.message);
      console.log('📡 Server is still running on http://localhost:3000');
      console.log('💡 You can still test the server locally:');
      console.log(`   Test: http://localhost:3000/test-donation`);
      console.log(`   Events: http://localhost:3000/events`);
      console.log('💡 For Twitch webhooks, you may need to:');
      console.log('   1. Check your ngrok auth token');
      console.log('   2. Try running: ngrok http 3000 (manually)');
      console.log('   3. Or use a different tunneling service');
    }
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await ngrok.kill();
  process.exit(0);
});

// Start the server
startServer();
