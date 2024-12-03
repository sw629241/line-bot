import OpenAI from 'openai';
import { loadConfig } from './config.js';
import { logger } from './utils.js';

const config = loadConfig();
const apiKey = process.env.OPENAI_API_KEY || config?.openai?.apiKey;

if (!apiKey) {
    logger.error('OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable or configure it in config.js');
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: apiKey
});

// 延遲函數
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 重試配置
const RETRY_DELAYS = [1000, 2000, 5000]; // 重試間隔（毫秒）
const MAX_RETRIES = 3;

export async function processMessageWithGPT(message, botType) {
    let lastError;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: 'system',
                        content: `你是一個 LINE Bot 助手，負責回答用戶的問題。請用友善的語氣回答。`
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                temperature: 0.7,
                max_tokens: 150
            });

            return completion.choices[0].message.content;
            
        } catch (error) {
            lastError = error;
            
            // 檢查是否是速率限制錯誤
            if (error.message?.includes('rate limit exceeded')) {
                logger.warn(`Rate limit exceeded, attempt ${attempt + 1}/${MAX_RETRIES}`);
                
                if (attempt < MAX_RETRIES - 1) {
                    // 等待指定時間後重試
                    await delay(RETRY_DELAYS[attempt]);
                    continue;
                }
            } else {
                // 如果不是速率限制錯誤，直接拋出
                break;
            }
        }
    }

    // 如果所有重試都失敗了
    logger.error('Error processing message with GPT:', lastError);
    if (lastError.message?.includes('rate limit exceeded')) {
        return '抱歉，系統目前較忙碌，請稍後再試。';
    }
    throw lastError;
}