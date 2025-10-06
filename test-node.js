// Simple test to check if Node.js can run our server
console.log('Node.js is working!');
console.log('Testing basic server setup...');

try {
  // Test if we can require the basic modules
  const express = require('express');
  console.log('✅ Express module loaded');
  
  const crypto = require('crypto');
  console.log('✅ Crypto module loaded');
  
  const axios = require('axios');
  console.log('✅ Axios module loaded');
  
  const ngrok = require('ngrok');
  console.log('✅ Ngrok module loaded');
  
  console.log('✅ All modules loaded successfully!');
  console.log('The server should be able to start.');
  
} catch (error) {
  console.log('❌ Error loading modules:', error.message);
  console.log('This might be why the server is failing to start.');
}

console.log('Test completed. Press Ctrl+C to exit.');
