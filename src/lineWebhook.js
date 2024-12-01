import { Client } from '@line/bot-sdk';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { Configuration, OpenAIApi } from 'openai';

// Load environment variables
dotenv.config();

// Logging utility
async function logEvent(botType, event) {
    try {
        const logDir = path.join(process.cwd(), 'logs');
        await fs.mkdir(logDir, { recursive: true });
        
        const logFile = path.join(logDir, `${botType}_webhook_events.log`);
        const logEntry = `${new Date().toISOString()} - Bot: ${botType}, Event Type: ${event.type}, Source: ${JSON.stringify(event.source)}\n`;
        
        await fs.appendFile(logFile, logEntry);
    } catch (error) {
        console.error('Error writing to log file:', error);
    }
}

// Load bot configuration from file
async function loadBotConfig(botType) {
    try {
        // 修改配置文件路徑
        const configPath = path.join(process.cwd(), 'admin', `${botType === 'primary' ? 'sxi' : 'fas'}-bot`, 'config.json');
        console.log('Loading config from:', configPath);
        const configData = await fs.readFile(configPath, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        console.error(`Error loading ${botType} bot config:`, error);
        return null;
    }
}

// Initialize OpenAI configuration
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// Call OpenAI API
async function callOpenAI(messages) {
    try {
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000
        });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error calling OpenAI:', error);
        throw error;
    }
}

// Process message with GPT
async function processMessageWithGPT(message, botConfig) {
    try {
        // 檢查配置是否有效
        if (!botConfig || !botConfig.categories) {
            throw new Error('無效的配置');
        }

        // 構建系統提示詞
        const systemPrompt = `你是一個專業的客服助手。你的任務是根據用戶的訊息，從不同類別中選擇最合適的回應。

請遵循以下規則：
1. 先判斷用戶訊息屬於哪個類別（產品、價格、運送、促銷、聊天、敏感）
2. 使用該類別的 systemPrompt 和 examples 作為參考
3. 在該類別的 rules 中尋找最相關的規則
4. 根據規則的 ratio 和 style 生成回應：
   - ratio = "0"：完全使用原文回覆
   - ratio = "50"：保持核心信息，可重組句子
   - ratio = "100"：保留核心點，使用新表達
5. 如果找不到相關規則，使用該類別的預設回應

請以 JSON 格式返回結果：
{
    "category": "選擇的類別名稱",
    "rule": {
        "keywords": "匹配的關鍵字",
        "response": "規則中的回覆",
        "ratio": "比例",
        "style": "風格"
    },
    "reply": "最終生成的回覆"
}`;

        // 為每個類別添加範例和系統提示
        let categoriesInfo = '';
        for (const [category, config] of Object.entries(botConfig.categories)) {
            categoriesInfo += `\n=== ${category} 類別 ===\n`;
            categoriesInfo += `系統提示：${config.systemPrompt || '無'}\n`;
            categoriesInfo += `範例：${config.examples || '無'}\n`;
            categoriesInfo += `規則：${JSON.stringify(config.rules, null, 2)}\n`;
        }

        // 構建用戶提示詞
        const userPrompt = `類別資訊：${categoriesInfo}\n\n用戶訊息：${message}`;

        // 獲取 GPT 回應
        const gptResponse = await callOpenAI([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]);

        // 解析回應
        const result = JSON.parse(gptResponse);
        console.log('GPT Response:', result);

        // 返回生成的回覆
        return result.reply;
    } catch (error) {
        console.error('Error processing message with GPT:', error);
        throw error;
    }
}

// Webhook configuration factory
export function createWebhookHandler(botType = 'primary') {
  // Select configuration based on bot type
  const lineConfig = botType === 'primary' 
    ? {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
        channelSecret: process.env.LINE_CHANNEL_SECRET
      }
    : {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN_2,
        channelSecret: process.env.LINE_CHANNEL_SECRET_2
      };

  // Create Line client
  const client = new Client(lineConfig);

  // Webhook event handler
  async function handleWebhook(req, res) {
    try {
      const events = req.body.events;
      
      // Process each event
      const results = await Promise.all(
        events.map(async (event) => {
          try {
            // Log every incoming event
            await logEvent(botType, event);
            return await handleWebhookEvent(event);
          } catch (error) {
            console.error(`Error handling event in ${botType} webhook:`, error);
            return null;
          }
        })
      );

      res.status(200).json(results);
    } catch (error) {
      console.error(`${botType} webhook error:`, error);
      res.status(500).end();
    }
  }

  // Handle different event types
  async function handleWebhookEvent(event) {
    switch (event.type) {
      case 'message':
        return handleMessageEvent(event);
      case 'follow':
        return handleFollowEvent(event);
      case 'unfollow':
        return handleUnfollowEvent(event);
      case 'join':
        return handleJoinEvent(event);
      case 'leave':
        return handleLeaveEvent(event);
      default:
        console.log(`Unhandled event type in ${botType} webhook:`, event.type);
        return null;
    }
  }

  // Handle message events with GPT integration
  async function handleMessageEvent(event) {
    if (event.message.type === 'text') {
      const messageText = event.message.text;
      
      try {
        // Load bot configuration
        const botConfig = await loadBotConfig(botType);
        if (!botConfig) {
          throw new Error('Bot configuration not available');
        }

        // Process message with GPT
        const response = await processMessageWithGPT(messageText, botConfig);
        
        // Send response back to user
        const replyMessage = { 
          type: 'text', 
          text: response || '抱歉，我現在無法正確處理您的訊息。'
        };
        
        return await client.replyMessage(event.replyToken, replyMessage);
      } catch (error) {
        console.error(`Error processing message in ${botType} webhook:`, error);
        
        // Send error message to user
        const errorMessage = { 
          type: 'text', 
          text: '抱歉，我現在無法正確處理您的訊息。請稍後再試。'
        };
        
        return await client.replyMessage(event.replyToken, errorMessage);
      }
    }
    return null;
  }

  // Handle follow event
  async function handleFollowEvent(event) {
    try {
      const welcomeMessage = {
        type: 'text',
        text: `Welcome to ${botType.toUpperCase()} webhook! 
Type 'help' to see available commands.`
      };
      return await client.replyMessage(event.replyToken, welcomeMessage);
    } catch (error) {
      console.error(`Error handling follow event in ${botType} webhook:`, error);
      throw error;
    }
  }

  // Handle unfollow event
  function handleUnfollowEvent(event) {
    console.log(`User unfollowed in ${botType} webhook:`, event.source.userId);
    return null;
  }

  // Handle join event (when bot is added to a group or room)
  async function handleJoinEvent(event) {
    try {
      const joinMessage = {
        type: 'text',
        text: `Thanks for adding me to this ${event.source.type}! 
I'm the ${botType.toUpperCase()} bot. Type 'help' to see what I can do.`
      };
      return await client.replyMessage(event.replyToken, joinMessage);
    } catch (error) {
      console.error(`Error handling join event in ${botType} webhook:`, error);
      throw error;
    }
  }

  // Handle leave event (when bot is removed from a group or room)
  function handleLeaveEvent(event) {
    console.log(`Bot was removed from ${event.source.type} in ${botType} webhook`);
    return null;
  }

  return { handleWebhook };
}
