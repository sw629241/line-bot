import express from 'express';
import { middleware } from '@line/bot-sdk';
import dotenv from 'dotenv';
import { createWebhookHandler } from './src/lineWebhook.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 80;

// Line bot configurations
const primaryLineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const secondaryLineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN_2,
  channelSecret: process.env.LINE_CHANNEL_SECRET_2
};

// Create webhook handlers
const { handleWebhook: handlePrimaryWebhook } = createWebhookHandler('primary');
const { handleWebhook: handleSecondaryWebhook } = createWebhookHandler('secondary');

// Configure static file serving
app.use(express.static('.', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Serve admin panel
app.use('/admin', express.static('admin', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Raw body parser
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Primary webhook route
app.post('/webhook1', (req, res) => {
  console.log('Webhook headers:', req.headers);
  console.log('Raw body:', req.rawBody?.toString());
  
  try {
    middleware(primaryLineConfig)(req, res, (err) => {
      if (err) {
        console.error('Middleware error:', err);
        return res.status(500).json({ error: err.message });
      }
      handlePrimaryWebhook(req, res);
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Secondary webhook route
app.post('/webhook2', (req, res) => {
  console.log('Webhook2 headers:', req.headers);
  console.log('Raw body:', req.rawBody?.toString());
  
  try {
    middleware(secondaryLineConfig)(req, res, (err) => {
      if (err) {
        console.error('Middleware error:', err);
        return res.status(500).json({ error: err.message });
      }
      handleSecondaryWebhook(req, res);
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check routes
app.get('/', (req, res) => {
  console.log('Received request for /', req.headers);
  res.status(200).send('Primary Line Bot is running');
});

app.get('/health', (req, res) => {
  console.log('Received request for /health', req.headers);
  res.setHeader('Content-Type', 'application/json');
  res.json({
    status: 'online',
    message: 'Service is healthy',
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

export { server };
