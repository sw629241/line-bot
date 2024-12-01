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
            return '抱歉，配置無效。';
        }

        // 使用傳入的配置對象
        const categories = config.categories;
        let categoriesInfo = '';
        
        // 處理每個類別的信息
        for (const [categoryName, category] of Object.entries(categories)) {
            categoriesInfo += `類別：${categoryName}\n`;
            if (category.description) {
                categoriesInfo += `描述：${category.description}\n`;
            }
            if (category.examples) {
                categoriesInfo += `範例：${Array.isArray(category.examples) ? category.examples.join(', ') : category.examples}\n`;
            }
            if (category.rules) {
                categoriesInfo += `規則：${typeof category.rules === 'object' ? JSON.stringify(category.rules, null, 2) : category.rules}\n`;
            }
            categoriesInfo += '\n';
        }

        const systemPrompt = config.systemPrompt || '你是一個有用的助手。';
        const userPrompt = `類別資訊：${categoriesInfo}\n\n用戶訊息：${message}`;

        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        return response.data.choices[0].message.content;
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
