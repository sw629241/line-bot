import { Configuration, OpenAIApi } from 'openai';
import { loadConfig } from './config.js';
import { logger } from './utils.js';

const config = loadConfig();
const configuration = new Configuration({
    apiKey: config.openai.apiKey
});
const openai = new OpenAIApi(configuration);

export async function processMessageWithGPT(message, botType) {
    try {
        const config = await loadConfig();
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

        // 準備 GPT 請求
        const messages = [
            {
                role: 'system',
                content: `你是一個智能助手，負責分析用戶訊息並提供適當的回應。請根據配置的規則和範例進行回應。`
            },
            {
                role: 'user',
                content: message
            }
        ];

        const response = await openai.createChatCompletion({
            model: config.openai.model || 'gpt-3.5-turbo',
            messages: messages,
            temperature: config.openai.temperature || 0.7,
            max_tokens: config.openai.maxTokens || 150
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        logger.error('Error processing message with GPT:', error);
        throw error;
    }
}