// Minimal server test - just to see if basic Express works
const express = require('express');
const app = express();
const PORT = 3000;

console.log('🚀 Starting simple test server...');

app.get('/', (req, res) => {
  res.send('Simple server is working!');
});

app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working!', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`✅ Simple server running on http://localhost:${PORT}`);
  console.log('✅ Test it by going to: http://localhost:3000');
  console.log('✅ Or test endpoint: http://localhost:3000/test');
  console.log('Press Ctrl+C to stop the server');
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
