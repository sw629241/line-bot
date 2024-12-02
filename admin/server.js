import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 確保日誌目錄存在
const logDir = path.join(__dirname, 'logs');
await mkdir(logDir, { recursive: true });

// 簡單的日誌函數
const logger = {
    info: (...args) => {
        console.log(new Date().toISOString(), 'INFO:', ...args);
    },
    error: (...args) => {
        console.error(new Date().toISOString(), 'ERROR:', ...args);
    }
};

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs/promises';
import { configService } from './configService.js';

// Initialize OpenAI
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// Initialize Express app
const app = express();

// 設置中間件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 請求日誌中間件
app.use((req, res, next) => {
    logger.info('Incoming request:', {
        method: req.method,
        url: req.url,
        body: req.body,
        query: req.query,
        headers: req.headers
    });
    next();
});

// Load bot configuration
export async function loadBotConfig(botType) {
    try {
        const configPath = path.join(process.cwd(), 'admin', `${botType === 'primary' ? 'sxi' : 'fas'}-bot`, 'config.json');
        const configData = await fs.readFile(configPath, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        logger.error('Error loading bot configuration:', error);
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
    "ratio": "0-100 之間的數值（建議的動態生成比例，必須是字串）",
    "style": "建議的語言風格（專業/親切/少女/幽默）"
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
            logger.error('GPT response parsing error:', error);
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
                ratio: "0",
                style: "專業"
            };
        }

        return {
            category: result.category,
            intent: result.intent,
            confidence: result.confidence,
            keywords: result.keywords || [],
            content: result.content || '',
            ratio: result.ratio || "50",
            style: result.style || "親切"
        };
    } catch (error) {
        logger.error('Error processing message with GPT:', error);
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
        logger.error('Error handling message event:', error);
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
        logger.error('Error writing to log file:', error);
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
        logger.error('Error handling follow event:', error);
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
        logger.error('Error handling join event:', error);
        throw error;
    }
}

// Webhook handler
export async function handleWebhook(req, res, botType, client) {
    try {
        // 驗證請求體
        if (!req.body || !Array.isArray(req.body.events)) {
            logger.error('Invalid webhook request body:', req.body);
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const events = req.body.events;
        const errors = [];
        
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
                        logger.info('User unfollowed:', event.source.userId);
                        break;
                    case 'leave':
                        logger.info('Bot was removed from', event.source.type);
                        break;
                    default:
                        logger.info('Unhandled event type:', event.type);
                }
            } catch (error) {
                logger.error('Error handling event:', {
                    error: error.message,
                    stack: error.stack,
                    event: event
                });
                errors.push(error);
            }
        }));

        // 如果有任何事件處理失敗，返回 500 錯誤
        if (errors.length > 0) {
            return res.status(500).json({ 
                error: 'Some events failed to process',
                count: errors.length
            });
        }

        res.status(200).json({ message: 'OK' });
    } catch (error) {
        logger.error('Error handling webhook:', {
            error: error.message,
            stack: error.stack,
            body: req.body
        });
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Test message API endpoint
export async function handleTestMessage(req, res) {
    try {
        const { message, botType, config } = req.body;
        logger.info('收到測試訊息請求:', { message, botType });

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // 驗證配置
        if (!config || !config.categories) {
            return res.status(400).json({ error: 'Invalid configuration: missing categories' });
        }

        try {
            // 1. 分析訊息意圖
            const analysisResponse = await openai.createChatCompletion({
                model: "gpt-4-1106-preview",
                response_format: { type: "json_object" },
                messages: [
                    { 
                        role: 'system', 
                        content: `你是一個專業的客服訊息分析助手。請分析用戶訊息並返回 JSON 格式的結果。
可用的類別有：${Object.keys(config.categories).join(', ')}

分析要求：
1. 判斷最適合的類別
2. 分析語義意圖
3. 提供判斷信心度（0-1）
4. 識別關鍵詞（包含同義詞，如 at5/at5s）
5. 建議的動態生成比例（0, 50, 100）

各類別參考範例：
${Object.entries(config.categories).map(([name, category]) => 
    `${name}類別：\n${category.examples || '無範例'}\n`
).join('\n')}` 
                    },
                    { 
                        role: 'user', 
                        content: `分析以下訊息：${message}` 
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            });

            const analysisResult = JSON.parse(analysisResponse.data.choices[0].message.content);
            logger.info('GPT 分析結果:', analysisResult);

            // 2. 尋找匹配的規則
            const category = config.categories[analysisResult.category];
            let matchedRule = null;
            if (category && category.rules) {
                matchedRule = category.rules.find(rule => {
                    const keywords = Array.isArray(rule.keywords) ? rule.keywords : [rule.keywords];
                    return keywords.some(kw => {
                        const pattern = kw
                            .replace(/\s+/g, '\\s*')
                            .replace(/和|與|跟/g, '[和與跟]');
                        const regex = new RegExp(pattern, 'i');
                        return regex.test(message);
                    });
                });
            }

            // 3. 生成回應內容
            let generatedContent = null;
            if (matchedRule && analysisResult.dynamicRatio > 0) {
                const generationResponse = await openai.createChatCompletion({
                    model: "gpt-4-1106-preview",
                    messages: [
                        {
                            role: 'system',
                            content: category.systemPrompt || '你是一個專業的客服助手，請用自然且專業的方式回答問題。'
                        },
                        {
                            role: 'user',
                            content: `根據以下資訊生成回應：

用戶訊息：${message}
意圖：${analysisResult.intent}
關鍵詞：${analysisResult.keywords.join(', ')}
原始回應：${matchedRule.response}
動態比例：${analysisResult.dynamicRatio}%
語言風格：${matchedRule.style}

生成要求：
${analysisResult.dynamicRatio === 50 ? 
    '1. 保留50%原始回應的核心內容\n2. 重新組織語句，但確保資訊準確性' : 
    '1. 保留核心訊息\n2. 完全重新生成回應，但確保資訊準確性'}
3. 使用${matchedRule.style}的語言風格
4. 保持專業性和準確性
5. 確保回應流暢自然

請直接返回生成的回應內容，不要加入任何額外的說明或標記。`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                });

                generatedContent = generationResponse.data.choices[0].message.content.trim();
            }

            // 4. 返回完整結果
            const result = {
                category: analysisResult.category,
                intent: analysisResult.intent,
                confidence: analysisResult.confidence,
                keywords: analysisResult.keywords,
                dynamicRatio: analysisResult.dynamicRatio,
                style: matchedRule?.style || 'friendly',
                response: matchedRule?.response || category?.systemPrompt || '已通知小編進行回覆，請稍等。',
                generatedContent: generatedContent
            };

            res.json(result);
        } catch (error) {
            logger.error('處理測試訊息失敗:', error);
            res.status(500).json({ 
                error: `處理測試訊息失敗: ${error.message}`,
                category: 'unknown',
                intent: 'error',
                confidence: 0,
                keywords: [],
                dynamicRatio: 0,
                style: 'friendly',
                response: '處理訊息時發生錯誤',
                generatedContent: null
            });
        }
    } catch (error) {
        logger.error('測試訊息處理器錯誤:', error);
        res.status(500).json({ error: error.message });
    }
}

// Express route setup
export function setupRoutes(app) {
    app.post('/admin/api/test-message', handleTestMessage);
    
    // Webhook endpoints
    app.post('/webhook/sxi', (req, res) => handleWebhook(req, res, 'primary', sxiClient));
    app.post('/webhook/fas', (req, res) => handleWebhook(req, res, 'secondary', fasClient));
    
    // 錯誤處理中間件
    app.use((err, req, res, next) => {
        logger.error('Server Error:', { 
            error: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
            body: req.body,
            query: req.query
        });
        res.status(500).json({ error: '伺服器錯誤' });
    });

    logger.info('Routes setup completed');
}

// 處理未捕獲的異常
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Rejection:', error);
});

export { logger };  // 導出 logger 供其他模組使用
