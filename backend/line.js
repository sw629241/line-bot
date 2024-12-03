import { processMessageWithGPT } from './gpt.js';
import { logger } from './utils.js';
import { loadConfig } from './config.js';

// 處理 webhook 事件
export async function handleWebhook(req, res, botType, client) {
    try {
        const events = req.body.events;
        
        if (!events || !Array.isArray(events)) {
            return res.status(400).json({ error: 'Invalid events format' });
        }

        await Promise.all(events.map(event => handleEvent(event, botType, client)));
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        logger.error('Error handling webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// 處理測試消息
export async function handleTestMessage(req, res) {
    try {
        const { message, botType } = req.body;
        
        if (!message || !botType) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const response = await processMessageWithGPT(message, botType);
        res.json({ response });
    } catch (error) {
        logger.error('Error handling test message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// 處理單個事件
async function handleEvent(event, botType, client) {
    try {
        await logEvent(botType, event);

        switch (event.type) {
            case 'message':
                if (event.message.type === 'text') {
                    await handleMessageEvent(event, botType, client);
                }
                break;
            case 'follow':
                await handleFollowEvent(event, botType, client);
                break;
            case 'join':
                await handleJoinEvent(event, botType, client);
                break;
        }
    } catch (error) {
        logger.error('Error handling event:', error);
    }
}

// 處理消息事件
async function handleMessageEvent(event, botType, client) {
    try {
        const response = await processMessageWithGPT(event.message.text, botType);
        await client.replyMessage(event.replyToken, {
            type: 'text',
            text: response
        });
    } catch (error) {
        logger.error('Error handling message event:', error);
    }
}

// 處理追蹤事件
async function handleFollowEvent(event, botType, client) {
    try {
        const config = loadConfig();
        const welcomeMessage = config.welcomeMessages[botType] || '感謝您的追蹤！';
        await client.replyMessage(event.replyToken, {
            type: 'text',
            text: welcomeMessage
        });
    } catch (error) {
        logger.error('Error handling follow event:', error);
    }
}

// 處理加入群組事件
async function handleJoinEvent(event, botType, client) {
    try {
        const config = loadConfig();
        const welcomeMessage = config.groupWelcomeMessages[botType] || '感謝邀請我加入群組！';
        await client.replyMessage(event.replyToken, {
            type: 'text',
            text: welcomeMessage
        });
    } catch (error) {
        logger.error('Error handling join event:', error);
    }
}

// 記錄事件
async function logEvent(botType, event) {
    logger.info('Event received:', {
        botType,
        eventType: event.type,
        timestamp: event.timestamp,
        source: event.source
    });
}