# Tribes Professional League - Donation Server

This local server receives Twitch webhook events and triggers donation effects on your website.

## 🚀 Quick Start

### 1. Install Node.js
- Download and install Node.js from https://nodejs.org/
- Make sure it's added to your PATH

### 2. Create Desktop Shortcut
- Double-click `create-desktop-shortcut.bat`
- This creates a "Tribes Donation Server" shortcut on your desktop

### 3. Start the Server
- Double-click the "Tribes Donation Server" shortcut on your desktop
- The server will:
  - Install dependencies automatically
  - Start on localhost:3000
  - Create an ngrok tunnel
  - Display webhook URLs for Twitch setup

## 📡 Twitch Webhook Setup

When the server starts, it will display URLs like:
```
🌐 Ngrok tunnel active: https://abc123.ngrok.io
📡 Webhook endpoints:
   Bits: https://abc123.ngrok.io/webhook/bits
   Channel Points: https://abc123.ngrok.io/webhook/channel-points
   Subscriptions: https://abc123.ngrok.io/webhook/subscription
   Follows: https://abc123.ngrok.io/webhook/follow
```

### Set up Twitch EventSub Webhooks:

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Select your application: "T3RivalsDisplayApp2025"
3. Go to "EventSub" section
4. Create subscriptions for:

**For Bits:**
- Type: `channel.bits`
- Condition: `broadcaster_user_id` = Your Twitch User ID
- Transport: Webhook
- Callback URL: `https://abc123.ngrok.io/webhook/bits`
- Secret: `y7pguc8mv066etiu7eqs67bcleoxnu`

**For Channel Points:**
- Type: `channel.channel_points_custom_reward_redemption.add`
- Condition: `broadcaster_user_id` = Your Twitch User ID
- Transport: Webhook
- Callback URL: `https://abc123.ngrok.io/webhook/channel-points`
- Secret: `y7pguc8mv066etiu7eqs67bcleoxnu`

**For Subscriptions:**
- Type: `channel.subscribe`
- Condition: `broadcaster_user_id` = Your Twitch User ID
- Transport: Webhook
- Callback URL: `https://abc123.ngrok.io/webhook/subscription`
- Secret: `y7pguc8mv066etiu7eqs67bcleoxnu`

**For Follows:**
- Type: `channel.follow`
- Condition: `broadcaster_user_id` = Your Twitch User ID
- Transport: Webhook
- Callback URL: `https://abc123.ngrok.io/webhook/follow`
- Secret: `y7pguc8mv066etiu7eqs67bcleoxnu`

## 🎮 How It Works

1. **Server Running**: Your local server runs and creates an ngrok tunnel
2. **Twitch Events**: When someone sends bits, subscribes, etc. on Twitch
3. **Webhook**: Twitch sends the event to your ngrok URL
4. **Broadcast**: Server broadcasts the event to all connected websites
5. **Confetti**: Your website shows confetti and donation notifications

## 🧪 Testing

### Test Server Connection:
```javascript
// In browser console
testServerConnection()
```

### Test Manual Donation:
```javascript
// In browser console
triggerDonation('bits', 100, 'Test bits!', 'TestUser')
```

### Test Targeted Donation:
```javascript
// In browser console
donateToPlayer('Panda', 50, 'Great gameplay!', 'Viewer123')
donateToCaster(25, 'Amazing commentary!', 'StreamFan')
```

## 📁 Files

- `server.js` - Main server file
- `package.json` - Node.js dependencies
- `start-donation-server.bat` - Windows batch file to start server
- `start-donation-server.ps1` - PowerShell script to start server
- `create-desktop-shortcut.bat` - Creates desktop shortcut
- `ngrok-url.txt` - Contains current ngrok URL (created when server starts)

## 🔧 Configuration

### Twitch Credentials (in server.js):
```javascript
const TWITCH_CONFIG = {
  clientId: 'meabi1n42pccff5rz9ujpno7ky9vlt',
  clientSecret: 'y7pguc8mv066etiu7eqs67bcleoxnu',
  webhookSecret: 'y7pguc8mv066etiu7eqs67bcleoxnu',
  ngrokAuthToken: '2x63QelQ5ib9dYvMxhOw0CqWeox_4Ugyga8vFUsYabGbFZ5fP'
};
```

## 🎯 Donation Types Supported

- **Bits**: When viewers send bits to your channel
- **Channel Points**: When viewers redeem channel point rewards
- **Subscriptions**: New subscribers (Tier 1, 2, 3)
- **Follows**: New followers
- **Manual**: Test donations from the website

## 🚨 Troubleshooting

### Server won't start:
- Make sure Node.js is installed
- Check if port 3000 is available
- Run `npm install` manually

### No webhook events:
- Check if ngrok tunnel is active
- Verify Twitch EventSub subscriptions are created
- Check server console for errors

### Website not connecting:
- Make sure server is running
- Check browser console for connection errors
- Try `testServerConnection()` in browser console

## 📞 Support

If you need help:
1. Check the server console for error messages
2. Check browser console for connection issues
3. Verify Twitch EventSub subscriptions are active
4. Make sure ngrok tunnel is running

The server will automatically reconnect if the connection is lost.
