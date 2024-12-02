import { configService } from './configService.js';
import { ui } from './ui.js';
import { apiService } from './apiService.js';

class MessageService {
    constructor() {
        this.initialized = false;
        this.apiKey = null;
    }

    async init() {
        if (!this.initialized) {
            await this.initializeOpenAI();
            this.initialized = true;
        }
    }

    // 保存 GPT 設定
    async saveGPTSettings(category) {
        try {
            const systemPrompt = document.getElementById(`${category}Prompt`).value;
            const examples = document.getElementById(`${category}Examples`).value;
            
            await configService.saveGPTSettings(category, systemPrompt, examples);
            console.log('GPT 設定已保存');
            return true;
        } catch (error) {
            console.error('保存 GPT 設定失敗:', error);
            return false;
        }
    }

    // 測試 GPT 回應
    async testGPTResponse(message, botConfig) {
        try {
            const response = await this.processMessageWithGPT(message, botConfig);
            return response;
        } catch (error) {
            console.error('測試 GPT 回應失敗:', error);
            return '測試失敗: ' + error.message;
        }
    }

    // 創建預設訊息
    createDefaultMessage(text) {
        return {
            type: 'text',
            text: text
        };
    }

    // 創建錯誤訊息
    createErrorMessage() {
        return this.createDefaultMessage('抱歉，我現在無法正確處理您的訊息。請稍後再試。');
    }

    // 創建歡迎訊息
    createWelcomeMessage(botType) {
        return this.createDefaultMessage(`歡迎追蹤${botType}！`);
    }

    // 創建加入訊息
    createJoinMessage(botType, sourceType) {
        return this.createDefaultMessage(`感謝將${botType}加入${sourceType === 'group' ? '群組' : '聊天室'}！`);
    }

    // 處理 webhook 事件
    async handleMessageEvent(event, botConfig) {
        try {
            const response = await this.processMessageWithGPT(event.message.text, botConfig);
            await this.replyMessage(event.replyToken, this.createDefaultMessage(response));
        } catch (error) {
            console.error('處理訊息事件失敗:', error);
            await this.replyMessage(event.replyToken, this.createErrorMessage());
        }
    }

    // 處理追蹤事件
    async handleFollowEvent(event, botType) {
        try {
            const message = this.createWelcomeMessage(botType);
            await this.replyMessage(event.replyToken, message);
        } catch (error) {
            console.error('處理追蹤事件失敗:', error);
        }
    }

    // 處理加入事件
    async handleJoinEvent(event, botType) {
        try {
            const message = this.createJoinMessage(botType, event.source.type);
            await this.replyMessage(event.replyToken, message);
        } catch (error) {
            console.error('處理加入事件失敗:', error);
        }
    }

    // 處理測試訊息
    async testMessage(message) {
        try {
            // 確保配置已初始化
            if (!this.initialized) {
                await this.init();
            }

            // 獲取當前配置
            const config = await configService.getCurrentConfig();
            if (!config) {
                throw new Error('無法獲取配置');
            }

            // 檢查敏感詞
            if (this.containsSensitiveWords(message, config.categories.sensitive?.rules?.map(r => r.keywords).flat() || [])) {
                return {
                    category: 'sensitive',
                    intent: '敏感詞檢測',
                    confidence: 1.0,
                    keywords: ['敏感詞'],
                    dynamicRatio: 0,
                    response: null
                };
            }

            // 檢查關鍵詞匹配
            let matchedCategory = null;
            let matchedRule = null;
            let matchedKeywords = [];

            // 遍歷所有類別尋找匹配的規則
            for (const [category, categoryConfig] of Object.entries(config.categories)) {
                if (category === 'sensitive') continue;
                
                for (const rule of (categoryConfig.rules || [])) {
                    // 檢查每個關鍵詞
                    const keywords = Array.isArray(rule.keywords) ? rule.keywords : [rule.keywords];
                    const matched = keywords.some(keyword => {
                        // 將關鍵詞轉換為正則表達式模式
                        const pattern = keyword
                            .replace(/\s+/g, '\\s*')  // 處理空格
                            .replace(/和|與|跟/g, '[和與跟]');  // 處理連接詞變化
                        const regex = new RegExp(pattern, 'i');
                        return regex.test(message);
                    });

                    if (matched) {
                        matchedCategory = category;
                        matchedRule = rule;
                        matchedKeywords = keywords;
                        break;
                    }
                }
                if (matchedCategory) break;
            }

            // 返回分析結果
            const result = {
                category: matchedCategory || 'unknown',
                intent: matchedCategory ? '查詢產品資訊' : 'unknown',
                confidence: matchedCategory ? 0.8 : 0.0,
                keywords: matchedKeywords,
                dynamicRatio: matchedRule ? (typeof matchedRule.ratio === 'string' ? parseInt(matchedRule.ratio) : matchedRule.ratio) : 0,
                style: matchedRule?.style || 'friendly',
                response: matchedRule?.response || config.categories[matchedCategory]?.systemPrompt || '已通知小編進行回覆，請稍等。'
            };

            console.log('測試訊息分析結果:', result);
            return result;

        } catch (error) {
            console.error('測試訊息處理失敗:', error);
            return {
                category: 'error',
                intent: 'error',
                confidence: 0.0,
                keywords: [],
                dynamicRatio: 0,
                style: 'friendly',
                response: '處理訊息時發生錯誤'
            };
        }
    }

    // 處理訊息
    async processMessageWithGPT(message, botConfig) {
        try {
            // 1. 先進行測試分析獲取基本信息
            const analysisResult = await this.testMessage(message);
            console.log('GPT分析結果:', analysisResult);

            // 如果是敏感詞或錯誤，直接返回
            if (analysisResult.category === 'sensitive' || analysisResult.category === 'error') {
                return analysisResult.response || '已通知小編進行回覆，請稍等。';
            }

            // 2. 如果找到匹配的類別和規則
            if (analysisResult.category !== 'unknown' && analysisResult.response) {
                // 根據動態比例決定是否需要生成新內容
                if (analysisResult.dynamicRatio === 0) {
                    // 直接使用固定回應
                    return analysisResult.response;
                }

                // 3. 準備生成新內容
                const generationPrompt = `
作為客服助手，請根據以下信息生成回應：

用戶訊息：${message}
意圖分析：${analysisResult.intent}
匹配關鍵詞：${analysisResult.keywords.join(', ')}
原始回應：${analysisResult.response}
動態生成比例：${analysisResult.dynamicRatio}%
語言風格：${analysisResult.style}

生成要求：
${analysisResult.dynamicRatio === 50 ? 
    '1. 保留50%原始回應的核心內容\n2. 重新組織語句，但確保資訊準確性' : 
    '1. 保留核心訊息\n2. 完全重新生成回應，但確保資訊準確性'}
3. 使用${analysisResult.style}的語言風格
4. 保持專業性和準確性
5. 確保回應流暢自然

請直接返回生成的回應內容，不要加入任何額外的說明或標記。`;

                // 4. 調用 GPT 生成回應
                const generationMessages = [
                    {
                        role: 'system',
                        content: botConfig.categories[analysisResult.category]?.systemPrompt || 
                                '你是一個專業的客服助手，請用自然且專業的方式回答問題。'
                    },
                    {
                        role: 'user',
                        content: generationPrompt
                    }
                ];

                const generatedResponse = await this.callOpenAI(generationMessages);
                
                // 5. 返回生成的回應
                return generatedResponse.trim() || analysisResult.response;
            }

            // 如果沒有匹配到任何規則，返回預設回應
            return botConfig.categories.chat?.systemPrompt || '已通知小編進行回覆，請稍等。';

        } catch (error) {
            console.error('處理訊息失敗:', error);
            return '抱歉，我需要請小編協助回答這個問題。已通知小編，請稍候。';
        }
    }

    // 檢查敏感詞
    containsSensitiveWords(message, sensitiveWords = []) {
        if (!Array.isArray(sensitiveWords) || sensitiveWords.length === 0) {
            return false;
        }
        
        const lowerMessage = message.toLowerCase();
        return sensitiveWords.some(word => 
            lowerMessage.includes(word.toLowerCase())
        );
    }

    // 初始化 OpenAI
    async initializeOpenAI() {
        try {
            const response = await fetch('/admin/api/openai-key');
            const data = await response.json();
            
            if (data.apiKey) {
                this.apiKey = data.apiKey;
                console.log('OpenAI API Key 已設置');
            } else {
                console.error('無法取得 OpenAI API Key');
            }
        } catch (error) {
            console.error('初始化 OpenAI 失敗:', error);
            throw error;
        }
    }

    // 呼叫 OpenAI API
    async callOpenAI(messages) {
        try {
            if (!this.apiKey) {
                throw new Error('OpenAI API Key 未設置');
            }

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API 錯誤: ${response.status} - ${errorData.error?.message || '未知錯誤'}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('呼叫 OpenAI API 失敗:', error);
            throw error;
        }
    }

    // 回覆訊息
    async replyMessage(replyToken, message) {
        try {
            await apiService.replyMessage(replyToken, message);
        } catch (error) {
            console.error('回覆訊息失敗:', error);
            throw error;
        }
    }

    isInitialized() {
        return this.initialized;
    }
}

export const messageService = new MessageService();