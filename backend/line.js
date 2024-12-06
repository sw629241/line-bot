import crypto from 'crypto';
import { lineConfig } from './config.js';
import { analyzeMessage } from './gpt.js';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 驗證 LINE 簽名
function validateSignature(body, signature, channelSecret) {
    if (!channelSecret) {
        console.error('Missing channel secret');
        return false;
    }
    
    const hash = crypto
        .createHmac('SHA256', channelSecret)
        .update(body)
        .digest('base64');
    
    console.log('Signature validation:');
    console.log('- Received signature:', signature);
    console.log('- Calculated hash:', hash);
    console.log('- Channel secret exists:', !!channelSecret);
    
    return hash === signature;
}

// 處理 webhook 事件
export async function handleWebhook(req, res, botType, client) {
    console.log(`[${new Date().toISOString()}] Received webhook request for ${botType}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    try {
        // 檢查 LINE 簽名
        const signature = req.get('x-line-signature');
        if (!signature) {
            console.error('Missing LINE signature');
            return res.status(400).json({ error: 'Missing signature' });
        }

        // 檢查 client 是否存在
        if (!client) {
            console.error(`LINE client for ${botType} is not configured`);
            return res.status(400).json({ error: 'Bot not configured' });
        }

        // 檢查 channel secret
        const channelSecret = lineConfig[botType]?.channelSecret;
        if (!channelSecret) {
            console.error(`Missing channel secret for ${botType}`);
            return res.status(400).json({ error: 'Missing channel secret' });
        }

        // 驗證簽名
        console.log('Raw body:', req.rawBody?.toString());
        const isValid = validateSignature(
            req.rawBody,
            signature,
            channelSecret
        );

        if (!isValid) {
            console.error('Invalid signature');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const events = req.body.events;
        if (!events || !Array.isArray(events)) {
            console.error('Invalid webhook events format:', events);
            return res.status(400).json({ error: 'Invalid events format' });
        }

        // 記錄 webhook 事件
        console.log(`[${new Date().toISOString()}] Processing ${events.length} events for ${botType}:`, 
            JSON.stringify(events, null, 2));

        // 處理每個事件
        for (const event of events) {
            try {
                switch (event.type) {
                    case 'message':
                        if (event.message.type === 'text') {
                            try {
                                // 讀取配置文件
                                const configFile = JSON.parse(await readFile(join(__dirname, `${botType}-bot-config.json`), 'utf8'));
                                
                                // 使用 GPT 分析訊息
                                const analysis = await analyzeMessage(event.message.text, configFile.categories);
                                console.log(`[${botType}-bot] GPT 分析結果:`, analysis);

                                // 只有在有生成回應時才發送訊息
                                if (analysis && analysis.generatedResponse) {
                                    await client.replyMessage(event.replyToken, {
                                        type: 'text',
                                        text: analysis.generatedResponse
                                    });
                                }
                                // 如果是敏感詞或沒有回應，不發送任何訊息
                            } catch (error) {
                                console.error('Error analyzing message:', error);
                                // 發生錯誤時返回預設訊息
                                // await client.replyMessage(event.replyToken, {
                                //     type: 'text',
                                //     text: '抱歉，我現在無法正確處理您的訊息。請稍後再試。'
                                // });
                            }
                        }
                        break;
                    case 'follow':
                        await client.replyMessage(event.replyToken, {
                            type: 'text',
                            text: '感謝您加入！'
                        });
                        break;
                    case 'join':
                        await client.replyMessage(event.replyToken, {
                            type: 'text',
                            text: '謝謝邀請我加入群組！'
                        });
                        break;
                    default:
                        console.log(`Unhandled event type: ${event.type}`);
                }
            } catch (error) {
                console.error(`Error processing event ${event.type}:`, error);
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}