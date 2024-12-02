import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { configService } from './configService.js';

// Initialize OpenAI
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// Load bot configuration
export async function loadBotConfig(botType) {
    try {
        const configPath = path.join(process.cwd(), 'admin', `${botType === 'primary' ? 'sxi' : 'fas'}-bot`, 'config.json');
        const configData = await fs.readFile(configPath, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        console.error('Error loading bot configuration:', error);
        return null;
    }
}

// Process message with GPT
export async function processMessageWithGPT(message, botType) {
    try {
        const config = await configService.getConfig(botType);
        if (!config || !config.categories) {
            throw new Error('配置無效: 缺少 categories 屬性');
        }

        // 檢查必要的類別是否存在
        const requiredCategories = ['products', 'prices', 'shipping', 'promotions', 'chat', 'sensitive'];
        const missingCategories = requiredCategories.filter(cat => !config.categories[cat]);
        
        if (missingCategories.length > 0) {
            throw new Error(`配置無效: 缺少必要類別 ${missingCategories.join(', ')}`);
        }

        // 檢查每個類別的必要屬性
        for (const category in config.categories) {
            const cat = config.categories[category];
            if (!cat.systemPrompt || !cat.examples || !Array.isArray(cat.rules)) {
                throw new Error(`配置無效: ${category} 類別缺少必要屬性 (systemPrompt, examples, rules)`);
            }
        }

        // 準備系統提示詞
        const systemPrompt = `你是一個智能助手，負責分析用戶訊息並提供適當的回應。請根據以下規則處理：

1. 分析用戶訊息的意圖和語義
2. 判斷最適合的回應類別
3. 識別關鍵詞（包括同義詞和變形詞）
4. 評估回應的信心度
5. 如果需要，生成適當的回應內容

回應格式必須是 JSON，包含以下欄位：
{
    "category": "最適合的類別名稱",
    "intent": "用戶意圖描述",
    "confidence": 0.1-1.0 之間的數值,
    "keywords": ["匹配到的關鍵詞陣列"],
    "content": "生成的回應內容",
    "ratio": 0-100 之間的數值（建議的動態生成比例）,
    "style": "建議的語言風格（professional/friendly/cute/humorous）"
}`;

        // 準備類別資訊
        let categoriesInfo = '';
        for (const [categoryName, category] of Object.entries(config.categories)) {
            categoriesInfo += `
類別：${categoryName}
系統提示詞：${category.systemPrompt || '無'}
範例：${category.examples || '無'}
規則：
${JSON.stringify(category.rules, null, 2)}
-------------------`;
        }

        // 發送到 GPT 進行處理
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `
類別資訊：
${categoriesInfo}

用戶訊息：${message}

請分析這個訊息並以 JSON 格式回應。` }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        // 解析 GPT 回應
        const gptResponse = response.data.choices[0].message.content;
        let result;
        try {
            result = JSON.parse(gptResponse);
        } catch (error) {
            console.error('GPT response parsing error:', error);
            throw new Error('無法解析 GPT 回應');
        }

        // 驗證必要欄位
        if (!result.category || !result.intent || result.confidence === undefined) {
            throw new Error('GPT 回應格式無效');
        }

        // 處理敏感詞檢查
        if (result.category === 'sensitive') {
            return {
                category: 'sensitive',
                intent: 'sensitive_content',
                confidence: 1.0,
                keywords: [],
                content: '',
                ratio: 0,
                style: 'professional'
            };
        }

        return {
            category: result.category,
            intent: result.intent,
            confidence: result.confidence,
            keywords: result.keywords || [],
            content: result.content || '',
            ratio: result.ratio || 0,
            style: result.style || 'friendly'
        };
    } catch (error) {
        console.error('Error processing message with GPT:', error);
        throw new Error('Failed to process with GPT: ' + error.message);
    }
}

// Handle message event
export async function handleMessageEvent(event, botType, client) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return null;
    }

    try {
        const messageText = event.message.text;
        const response = await processMessageWithGPT(messageText, botType);
        
        await client.replyMessage(event.replyToken, {
            type: 'text',
            text: response
        });

        return { success: true };
    } catch (error) {
        console.error('Error handling message event:', error);
        return { success: false, error: error.message };
    }
}

// Log webhook events
export async function logEvent(botType, event) {
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

// Handle follow event
export async function handleFollowEvent(event, botType, client) {
    try {
        return await client.replyMessage(event.replyToken, {
            type: 'text',
            text: `歡迎使用${botType === 'primary' ? 'SXI' : 'FAS'}機器人！\n輸入 'help' 查看可用指令。`
        });
    } catch (error) {
        console.error('Error handling follow event:', error);
        throw error;
    }
}

// Handle join event
export async function handleJoinEvent(event, botType, client) {
    try {
        return await client.replyMessage(event.replyToken, {
            type: 'text',
            text: `感謝將我加入此${event.source.type}！\n我是${botType === 'primary' ? 'SXI' : 'FAS'}機器人。輸入 'help' 查看我能做什麼。`
        });
    } catch (error) {
        console.error('Error handling join event:', error);
        throw error;
    }
}

// Webhook handler
export async function handleWebhook(req, res, botType, client) {
    try {
        const events = req.body.events;
        
        await Promise.all(events.map(async (event) => {
            try {
                // Log event
                await logEvent(botType, event);

                // Handle different event types
                switch (event.type) {
                    case 'message':
                        await handleMessageEvent(event, botType, client);
                        break;
                    case 'follow':
                        await handleFollowEvent(event, botType, client);
                        break;
                    case 'join':
                        await handleJoinEvent(event, botType, client);
                        break;
                    case 'unfollow':
                        console.log('User unfollowed:', event.source.userId);
                        break;
                    case 'leave':
                        console.log('Bot was removed from', event.source.type);
                        break;
                    default:
                        console.log('Unhandled event type:', event.type);
                }
            } catch (error) {
                console.error('Error handling event:', error);
            }
        }));

        res.status(200).end();
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).end();
    }
}

// Test message API endpoint
export async function handleTestMessage(req, res) {
    try {
        const { message, botType, config } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // 驗證配置
        if (!config || !config.categories) {
            return res.status(400).json({ error: 'Invalid configuration: missing categories' });
        }

        // 檢查必要的類別
        const requiredCategories = ['products', 'prices', 'shipping', 'promotions', 'chat', 'sensitive'];
        const missingCategories = requiredCategories.filter(cat => !config.categories[cat]);
        if (missingCategories.length > 0) {
            return res.status(400).json({ 
                error: `Invalid configuration: missing required categories: ${missingCategories.join(', ')}` 
            });
        }

        // 檢查每個類別的必要屬性
        for (const [category, data] of Object.entries(config.categories)) {
            if (!data.systemPrompt || !data.examples || !Array.isArray(data.rules)) {
                return res.status(400).json({ 
                    error: `Invalid configuration: category '${category}' is missing required properties (systemPrompt, examples, rules)` 
                });
            }
        }

        try {
            // 使用配置中的設定處理訊息
            const response = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [
                    { 
                        role: 'system', 
                        content: `你是一個智能助手，負責分析用戶訊息。可用的類別有：${Object.keys(config.categories).join(', ')}` 
                    },
                    { 
                        role: 'user', 
                        content: `分析以下訊息：${message}` 
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            });

            // 解析回應
            const result = {
                category: 'products',  // 預設類別
                intent: '查詢產品資訊',
                confidence: 0.8,
                keywords: [],
                content: response.data.choices[0].message.content,
                ratio: 50,
                style: 'friendly'
            };

            res.json(result);
        } catch (error) {
            console.error('Failed to process with GPT:', error);
            res.status(500).json({ error: `Failed to process with GPT: ${error.message}` });
        }
    } catch (error) {
        console.error('Error handling test message:', error);
        res.status(500).json({ error: error.message });
    }
}

// Express route setup
export function setupRoutes(app) {
    app.post('/admin/api/test-message', handleTestMessage);
    
    // Add other routes as needed...
}
