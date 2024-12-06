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

            const result = response.choices[0]?.message?.content;
            if (!result) {
                throw new Error("No response from GPT");
            }

            try {
                const parsedResult = JSON.parse(result);
                // 驗證所有必需的字段
                const requiredFields = ['category', 'intent', 'confidence', 'keywords', 'isSensitive', 'generatedResponse'];
                const missingFields = requiredFields.filter(field => !(field in parsedResult));
                
                if (missingFields.length > 0) {
                    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
                }

                // 設置默認值和類型轉換
                const defaultResult = {
                    category: 'chat',
                    intent: '',
                    confidence: 0,
                    keywords: [],
                    isSensitive: false,
                    generatedResponse: ''
                };

                const finalResult = { ...defaultResult, ...{
                    category: String(parsedResult.category),
                    intent: String(parsedResult.intent),
                    confidence: Number(parsedResult.confidence) || 0,
                    keywords: Array.isArray(parsedResult.keywords) ? parsedResult.keywords : [],
                    isSensitive: Boolean(parsedResult.isSensitive),
                    generatedResponse: String(parsedResult.generatedResponse)
                }};

                console.log('最終處理結果:', finalResult);
                return finalResult;

            } catch (parseError) {
                console.error('Failed to parse GPT response:', result);
                throw new Error(`Invalid JSON response: ${parseError.message}`);
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
    return `你是一個專業的對話分析助手。你的任務是分析用戶訊息，並根據提供的類別設定進行判斷。
請根據以下規則進行分析：

1. 首先判斷是否包含敏感詞。
2. 如果不是敏感詞，則判斷最適合的類別。
3. 分析用戶的語義意圖。
4. 判斷訊息中的關鍵詞是否匹配類別中的設定。
5. 如果需要生成回覆，請根據指定的動態比例和語言風格生成。

你必須始終返回以下格式的 JSON，不要返回任何其他內容：
{
    "category": "類別名稱，必須是以下之一：products, prices, shipping, promotions, chat, sensitive",
    "intent": "用戶意圖的簡短描述",
    "confidence": 0.95,
    "keywords": ["匹配到的關鍵詞列表"],
    "isSensitive": false,
    "generatedResponse": "根據類別設定生成的回覆內容"
}

注意事項：
1. 所有字段都必須返回，不能省略。
2. 如果沒有相關內容，使用空字符串或空數組。
3. confidence 值必須是 0-1 之間的數字。
4. isSensitive 必須是布爾值（true/false）。
5. keywords 必須是字符串數組。
6. category 必須是預定義的類別之一。
7. 不要在 JSON 之外添加任何解釋或說明。

類別設定如下：
${JSON.stringify(categories, null, 2)}`;
}

/**
 * 構建用戶提示詞
 * @param {string} userMessage - 用戶訊息
 * @param {Object} categories - 所有類別的設定
 * @returns {string} 用戶提示詞
 */
function buildUserPrompt(userMessage, categories) {
    return `請分析以下用戶訊息：
${userMessage}

請記住：
1. 如果是敏感詞，將isSensitive設為true，不需要其他處理。
2. 如果無法確定類別或找不到匹配的關鍵詞，將category設為"chat"（一般對話）。
3. 關鍵詞判斷要考慮同義詞和變形詞（如"at5"和"at5s"）。
4. confidence值範圍為0-1，表示判斷的信心程度。
5. 如果需要生成回覆，請參考對應類別的動態比例和語言風格。`;
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