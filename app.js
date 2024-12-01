import express from 'express';
import { middleware } from '@line/bot-sdk';
import dotenv from 'dotenv';
import { createWebhookHandler } from './src/lineWebhook.js';
import fs from 'fs/promises';
import path from 'path';

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
const primaryWebhookHandler = createWebhookHandler('primary');
const secondaryWebhookHandler = createWebhookHandler('secondary');

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
  res.sendFile('admin.html', { root: './admin' });
});

// Raw body parser
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Admin API Routes
app.get('/admin/api/get-config/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const configPath = path.join(process.cwd(), 'admin', botId, 'config.json');
    
    try {
      const configData = await fs.readFile(configPath, 'utf8');
      res.json(JSON.parse(configData));
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 如果檔案不存在，返回預設配置
        const defaultConfig = {
          categories: {
            products: { systemPrompt: '', examples: '', rules: [] },
            prices: { systemPrompt: '', examples: '', rules: [] },
            shipping: { systemPrompt: '', examples: '', rules: [] },
            promotions: { systemPrompt: '', examples: '', rules: [] },
            chat: { systemPrompt: '', examples: '', rules: [] },
            sensitive: { systemPrompt: '', examples: '', rules: [] }
          }
        };
        res.json(defaultConfig);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/api/save-config/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const configDir = path.join(process.cwd(), 'admin', botId);
    const configPath = path.join(configDir, 'config.json');
    
    console.log('Saving config:', {
      botId,
      configDir,
      configPath,
      bodySize: JSON.stringify(req.body).length
    });

    // 確保目錄存在
    await fs.mkdir(configDir, { recursive: true });
    
    // 先將配置寫入臨時文件
    const tempPath = `${configPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(req.body, null, 2));
    
    // 確認臨時文件寫入成功
    const tempContent = await fs.readFile(tempPath, 'utf8');
    JSON.parse(tempContent); // 驗證 JSON 格式
    
    // 如果驗證成功，將臨時文件重命名為正式文件
    await fs.rename(tempPath, configPath);
    
    console.log('Config saved successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving config:', {
      error: error.message,
      stack: error.stack,
      botId: req.params.botId
    });
    res.status(500).json({ error: error.message });
  }
});

app.get('/admin/api/openai-key', (req, res) => {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    res.status(404).json({ error: 'OpenAI API key not found' });
  } else {
    res.json({ key: openaiKey });
  }
});

// Primary webhook route
app.post('/webhook1', middleware(primaryLineConfig), (req, res) => {
  primaryWebhookHandler.handleWebhook(req, res).catch(error => {
    console.error('Primary webhook error:', error);
    res.status(500).json({ error: error.message });
  });
});

// Secondary webhook route
app.post('/webhook2', middleware(secondaryLineConfig), (req, res) => {
  secondaryWebhookHandler.handleWebhook(req, res).catch(error => {
    console.error('Secondary webhook error:', error);
    res.status(500).json({ error: error.message });
  });
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

// Add CSP headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https: chrome-extension:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' chrome-extension:; " +
    "style-src 'self' 'unsafe-inline' https:; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https: chrome-extension:; " +
    "frame-src 'self' https: chrome-extension:;"
  );
  next();
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

export { server };
