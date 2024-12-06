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
 * 生成動態回應
 * @param {Object} rule - 匹配的規則
 * @param {string} fixedResponse - 固定回應
 * @param {number} ratio - 動態比例 (0, 50, 100)
 * @returns {Promise<string>} 生成的回應
 */
async function generateDynamicResponse(rule, fixedResponse, ratio) {
    if (ratio === 0) {
        return fixedResponse;
    }

    const style = rule.style || '親切'; // 默認使用親切風格
    let prompt = '';

    if (ratio === 50) {
        prompt = `請以${style}的語氣，保留一半的固定內容「${fixedResponse}」，重新組織語句產生回應。
保留核心訊息但使用更生動的表達方式。`;
    } else if (ratio === 100) {
        prompt = `請以${style}的語氣，參考這個固定回應「${fixedResponse}」，完全重新撰寫一個回應。
保留核心訊息但使用全新的表達方式。

語氣參考：
- 專業：使用精準的術語，保持客觀和專業
- 親切：像朋友般溫暖，使用溫和的語氣
- 少女：活潑可愛，使用表情符號和可愛用語
- 幽默：輕鬆詼諧，可以加入適當的玩笑`;
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `你是一個專業的客服機器人，擅長用不同的語氣風格回應客戶。
當前設定的語氣風格是：${style}`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 200
        });

        return response.choices[0]?.message?.content || fixedResponse;
    } catch (error) {
        console.error('生成動態回應時出錯:', error);
        return fixedResponse; // 發生錯誤時返回固定回應
    }
}

/**
 * 分析用戶訊息並返回GPT判斷結果
 * @param {string} userMessage - 用戶訊息
 * @param {Object} categories - 所有類別的設定，包含GPT設定和回覆規則
 * @returns {Promise<Object>} GPT分析結果
 */
export async function analyzeMessage(userMessage, categories) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            // 構建系統提示詞
            const systemPrompt = buildSystemPrompt(categories);
            
            // 構建用戶提示詞
            const userPrompt = buildUserPrompt(userMessage, categories);

            console.log(`嘗試 GPT 分析 (第 ${attempt} 次)`);
            console.log('系統提示詞:', systemPrompt);
            console.log('用戶提示詞:', userPrompt);

            // 調用GPT API
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
                max_tokens: 800
            });

            const result = JSON.parse(response.choices[0]?.message?.content);
            
            // 如果找到匹配的規則，生成動態回應
            if (result.matchedRule) {
                const rule = result.matchedRule;
                const ratio = rule.ratio || 0;
                const fixedResponse = rule.response;
                
                // 生成動態回應
                const dynamicResponse = await generateDynamicResponse(rule, fixedResponse, ratio);
                result.generatedResponse = dynamicResponse;
            }

            return result;
        } catch (error) {
            console.error(`Attempt ${attempt}/${MAX_RETRIES} failed:`, error);
            
            if (attempt === MAX_RETRIES) {
                return {
                    category: 'error',
                    intent: '系統錯誤',
                    confidence: 0,
                    keywords: [],
                    isSensitive: false,
                    generatedResponse: '抱歉，我現在無法正確處理您的訊息。請稍後再試。'
                };
            }

            if (error.message.includes('rate limit')) {
                console.log(`Waiting ${RETRY_DELAY}ms before retry...`);
                await delay(RETRY_DELAY);
                continue;
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
    let prompt = `你是一個專業的訊息分析助手。你需要分析用戶的訊息，判斷它屬於哪個類別，並找出匹配的規則。

分析步驟：
1. 檢查是否包含敏感詞
2. 理解訊息的整體語意
3. 尋找匹配的規則
4. 返回分析結果

可用的類別和規則：
${JSON.stringify(categories, null, 2)}

返回格式：
{
    "category": "匹配到的類別",
    "intent": "用戶意圖描述",
    "confidence": 0.95,
    "keywords": ["匹配到的關鍵概念"],
    "isSensitive": false,
    "matchedRule": {
        "keywords": "規則關鍵字",
        "response": "固定回應內容",
        "ratio": 0,
        "style": "語言風格"
    }
}

注意事項：
1. 優先處理敏感詞
2. 跨類別搜索關鍵字
3. 使用語意理解而不是完全匹配
4. 所有字串使用雙引號`;

    return prompt;
}

/**
 * 構建用戶提示詞
 * @param {string} userMessage - 用戶訊息
 * @param {Object} categories - 所有類別的設定
 * @returns {string} 用戶提示詞
 */
function buildUserPrompt(userMessage, categories) {
    return `請分析以下訊息：${userMessage}

請特別注意：
1. 這個訊息是否包含敏感詞
2. 訊息的整體語意是什麼
3. 是否匹配到任何規則
4. 應該使用哪個類別的規則來回應

請以 JSON 格式回應，不要加入任何其他說明。`;
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