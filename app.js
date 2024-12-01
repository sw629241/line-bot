import express from 'express';
import { middleware } from '@line/bot-sdk';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { Client } from '@line/bot-sdk';
import { handleMessageEvent, processMessageWithGPT } from './admin/server.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 80;

// Enable JSON parsing middleware
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Line bot configurations
const primaryLineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const secondaryLineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN_2,
  channelSecret: process.env.LINE_CHANNEL_SECRET_2
};

// Create Line clients
const primaryClient = new Client(primaryLineConfig);
const secondaryClient = new Client(secondaryLineConfig);

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

// Serve admin.html for /admin/ path
app.get('/admin/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'admin', 'admin.html'));
});

// Serve bot configuration files
app.get('/admin/api/get-config/:botId', async (req, res) => {
  try {
    const botId = req.params.botId;
    const configPath = path.join(process.cwd(), 'admin', botId, 'config.json');
    const configData = await fs.readFile(configPath, 'utf8');
    res.json(JSON.parse(configData));
  } catch (error) {
    console.error('Error reading config:', error);
    res.status(500).json({ error: 'Failed to read config file' });
  }
});

// Save bot configuration
app.post('/admin/api/save-config/:botId', express.json(), async (req, res) => {
  try {
    const botId = req.params.botId;
    const configPath = path.join(process.cwd(), 'admin', botId, 'config.json');
    
    // 檢查目錄是否存在，如果不存在則創建
    const dirPath = path.join(process.cwd(), 'admin', botId);
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }

    // 驗證配置格式
    if (!req.body || !req.body.categories) {
      return res.status(400).json({ error: 'Invalid configuration format' });
    }

    // 保存配置
    await fs.writeFile(configPath, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({ 
      error: 'Failed to save config file',
      details: error.message 
    });
  }
});

// Test category endpoint
app.post('/admin/api/test-category/:botId', express.json(), async (req, res) => {
  try {
    const botId = req.params.botId;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await processMessageWithGPT(message, botId === 'sxi-bot' ? 'primary' : 'secondary');
    res.json({ response });
  } catch (error) {
    console.error('Error testing category:', error);
    res.status(500).json({ error: 'Failed to test category' });
  }
});

// Get OpenAI API key
app.get('/admin/api/openai-key', (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    res.json({ apiKey });
  } else {
    res.status(500).json({ error: 'OpenAI API Key not found' });
  }
});

// Configure Line bot webhook endpoints
app.post('/webhook1', async (req, res) => {
  const signature = req.headers['x-line-signature'];
  
  // Verify signature
  if (!signature) {
    return res.status(400).json({ error: 'Missing signature' });
  }

  try {
    // Convert request body to string if it's not already
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const events = req.body.events;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const results = await Promise.all(
      events.map(event => handleMessageEvent(event, 'primary', primaryClient))
    );

    res.json({ results });
  } catch (error) {
    console.error('Error handling primary webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/webhook2', async (req, res) => {
  const signature = req.headers['x-line-signature'];
  
  // Verify signature
  if (!signature) {
    return res.status(400).json({ error: 'Missing signature' });
  }

  try {
    // Convert request body to string if it's not already
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const events = req.body.events;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const results = await Promise.all(
      events.map(event => handleMessageEvent(event, 'secondary', secondaryClient))
    );

    res.json({ results });
  } catch (error) {
    console.error('Error handling secondary webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('應用程式錯誤:', err);
  res.status(500).json({ error: '內部伺服器錯誤' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
