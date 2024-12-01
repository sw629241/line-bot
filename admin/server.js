import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs/promises';
import path from 'path';

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
        const config = await loadBotConfig(botType);
        if (!config) {
            return '抱歉，目前無法處理您的請求。';
        }

        const systemPrompt = config.systemPrompt || '你是一個有用的助手。';
        let categoriesInfo = '';
        
        if (config.categories) {
            for (const category of config.categories) {
                categoriesInfo += `類別：${category.name}\n`;
                categoriesInfo += `描述：${category.description}\n`;
                if (category.examples) {
                    categoriesInfo += `範例：${category.examples.join(', ')}\n`;
                }
                if (category.rules) {
                    categoriesInfo += `規則：${JSON.stringify(category.rules, null, 2)}\n`;
                }
                categoriesInfo += '\n';
            }
        } else {
            categoriesInfo += `描述：${config.description || '無'}\n`;
            categoriesInfo += `範例：${config.examples || '無'}\n`;
            categoriesInfo += `規則：${JSON.stringify(config.rules, null, 2)}\n`;
        }

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
        return '抱歉，處理您的請求時發生錯誤。';
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
