import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * 延遲指定的毫秒數
 * @param {number} ms - 延遲時間（毫秒）
 * @returns {Promise<void>}
 */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 分析用戶訊息並返回GPT判斷結果
 * @param {string} userMessage - 用戶訊息
 * @param {Object} categories - 所有類別的設定，包含GPT設定和回覆規則
 * @returns {Promise<Object>} GPT分析結果
 */
export async function analyzeMessage(userMessage, categories) {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log('\n=== 開始分析訊息 ===');
            console.log('用戶訊息:', userMessage);
            
            // 構建系統提示詞
            const systemPrompt = buildSystemPrompt(categories);
            
            // 構建用戶提示詞
            const userPrompt = `請分析以下訊息：${userMessage}

請特別注意：
1. 這個訊息是否包含敏感詞
2. 訊息的整體語意是什麼
3. 是否匹配到任何類別的關鍵概念
4. 應該使用哪個類別的規則來回應

請以 JSON 格式回應，不要加入任何其他說明。`;

            console.log('系統提示詞:', systemPrompt);
            console.log('用戶提示詞:', userPrompt);

            // 調用 GPT API
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: userPrompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 800,
                presence_penalty: 0.6,
                frequency_penalty: 0.3
            });

            console.log('\n=== GPT 回應 ===');
            console.log('完整回應:', JSON.stringify(response.choices[0]?.message?.content, null, 2));

            // 解析回應
            try {
                const result = JSON.parse(response.choices[0]?.message?.content);
                
                // 如果是敏感詞，確保設置正確的標記
                if (result.isSensitive) {
                    result.category = 'sensitive';
                    result.confidence = 1.0;
                    result.generatedResponse = '很抱歉，我無法回答這個問題。';
                }

                return result;
            } catch (error) {
                console.error('解析 GPT 回應時發生錯誤:', error);
                return {
                    category: 'chat',
                    intent: 'error_handling',
                    confidence: 0.5,
                    keywords: [],
                    isSensitive: false,
                    generatedResponse: '抱歉，我現在無法處理您的請求。請稍後再試。'
                };
            }
        } catch (error) {
            console.error(`Attempt ${attempt}/${maxRetries} failed:`, error.message);
            
            if (error.message.includes('rate limit') && attempt < maxRetries) {
                console.log(`Waiting ${retryDelay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
            }
            
            if (attempt === maxRetries) {
                // 如果所有重試都失敗，返回一個友好的錯誤響應
                return {
                    category: 'error',
                    intent: 'error_handling',
                    confidence: 0,
                    keywords: [],
                    isSensitive: false,
                    generatedResponse: '抱歉，我現在無法處理您的請求。請稍後再試。'
                };
            }
        }
    }
}

/**
 * 構建系統提示詞
 * @param {Object} categories - 所有類別的設定
 * @returns {string} 系統提示詞
 */
function buildSystemPrompt(categories) {
    return `你是一個專業的客服機器人。你的任務是分析用戶訊息並返回固定格式的 JSON 回應。

分析步驟：

1. 敏感詞檢查（最優先）：
   - 檢查訊息是否涉及性別歧視、種族歧視等敏感話題
   - 如果是敏感詞，立即將 isSensitive 設為 true 並停止後續分析

2. 語意理解：
   - 理解用戶訊息的整體語意和意圖
   - 確定用戶想詢問的主題（產品資訊、價格、運送等）
   - 尋找訊息中與規則相關的關鍵概念，不限於完全匹配

3. 跨類別關鍵字匹配：
   - 檢查所有類別的規則，不受類別限制
   - 根據語意相關性找出最匹配的規則
   - 一個訊息可能匹配多個類別的關鍵字

4. 回應生成：
   - 根據動態比例生成回應：
     * 0%：完全使用固定回覆
     * 50%：保留核心內容，重新組織語句
     * 100%：保留核心訊息，完全重寫

可用的類別和規則：
${JSON.stringify(categories, null, 2)}

返回格式：
{
    "category": "匹配到的類別",
    "intent": "用戶意圖描述",
    "confidence": 0.95,
    "keywords": ["匹配到的關鍵概念"],
    "isSensitive": true/false,
    "generatedResponse": "生成的回應"
}

注意事項：
1. 優先處理敏感詞
2. 跨類別搜索關鍵字
3. 使用語意理解而不是完全匹配
4. 回應必須是完整的句子
5. 所有字串使用雙引號`;
}

/**
 * 測試GPT回應
 * @param {string} message - 測試訊息
 * @param {Object} categories - 測試用的類別設定
 * @returns {Promise<Object>} 測試結果
 */
export async function testGPTResponse(message, categories) {
    try {
        const result = await analyzeMessage(message, categories);
        return {
            success: true,
            data: result
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}