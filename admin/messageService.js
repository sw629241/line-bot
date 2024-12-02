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

            if (!config.categories || Object.keys(config.categories).length === 0) {
                throw new Error('配置中沒有定義任何類別');
            }

            // 檢查配置格式
            const requiredCategories = ['products', 'prices', 'shipping', 'promotions', 'chat', 'sensitive'];
            const missingCategories = requiredCategories.filter(cat => !config.categories[cat]);
            if (missingCategories.length > 0) {
                throw new Error(`配置缺少必要類別: ${missingCategories.join(', ')}`);
            }

            // 確保每個類別都有必要的屬性
            for (const category of Object.values(config.categories)) {
                if (!category.systemPrompt) category.systemPrompt = '';
                if (!category.examples) category.examples = '';
                if (!Array.isArray(category.rules)) category.rules = [];
            }

            // 準備發送給GPT的數據
            const gptData = {
                message: message,
                botType: configService.currentBot,
                config: {
                    categories: {
                        products: config.categories.products,
                        prices: config.categories.prices,
                        shipping: config.categories.shipping,
                        promotions: config.categories.promotions,
                        chat: config.categories.chat,
                        sensitive: config.categories.sensitive
                    }
                }
            };

            console.log('Sending test message request:', {
                message: message,
                botType: configService.currentBot,
                categoriesCount: Object.keys(gptData.config.categories).length
            });

            // 發送到後端API進行處理
            const response = await fetch('/admin/api/test-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gptData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API response error:', errorData);
                throw new Error(`API請求失敗: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('測試訊息處理失敗:', error);
            throw error;
        }
    }

    // 處理訊息
    async processMessageWithGPT(message, botConfig) {
        try {
            // 1. 檢查敏感詞
            if (this.containsSensitiveWords(message, botConfig.sensitiveWords)) {
                console.log('檢測到敏感詞，忽略訊息');
                return null;
            }

            // 2. 準備分析提示
            const analysisPrompt = `
分析以下訊息並以JSON格式回傳結果：
1. 判斷最適合的類別（從以下選擇）：${Object.keys(botConfig.categories).join(', ')}
2. 分析語義意圖
3. 提供判斷信心度（0-1）
4. 識別關鍵詞
5. 如果需要生成回應，請提供建議的動態比例（0, 0.5, 或 1）

輸出格式：
{
    "category": "類別名稱",
    "intent": "語義意圖描述",
    "confidence": 0.95,
    "keywords": ["關鍵詞1", "關鍵詞2"],
    "dynamicRatio": 0.5
}

用戶訊息：${message}`;

            // 3. 進行分析
            const analysisMessages = [
                {
                    role: 'system',
                    content: '你是一個專業的訊息分析助手，專門進行意圖識別和語義分析。請只回傳要求的JSON格式。'
                },
                {
                    role: 'user',
                    content: analysisPrompt
                }
            ];

            const analysisResult = JSON.parse(await this.callOpenAI(analysisMessages));
            console.log('分析結果:', analysisResult);

            // 4. 根據分析結果生成回應
            const selectedCategory = botConfig.categories[analysisResult.category];
            if (!selectedCategory) {
                throw new Error(`未找到對應類別: ${analysisResult.category}`);
            }

            // 5. 根據動態比例決定回應方式
            let finalResponse;
            const dynamicRatio = analysisResult.dynamicRatio;

            if (dynamicRatio === 0) {
                // 使用完全固定回應
                finalResponse = selectedCategory.fixedResponse;
            } else {
                // 準備生成回應的提示
                const generationPrompt = `
根據以下資訊生成回應：
意圖: ${analysisResult.intent}
關鍵詞: ${analysisResult.keywords.join(', ')}
動態比例: ${dynamicRatio}
固定回應: ${selectedCategory.fixedResponse}
風格指南: ${selectedCategory.styleGuide || '友善且專業的語氣'}

${dynamicRatio === 0.5 ? '保留約50%固定回應的核心內容，並動態生成其餘部分' : '保留核心訊息，但完全重新生成回應'}
`;

                const generationMessages = [
                    {
                        role: 'system',
                        content: selectedCategory.systemPrompt
                    },
                    {
                        role: 'user',
                        content: generationPrompt
                    }
                ];

                finalResponse = await this.callOpenAI(generationMessages);
            }

            return finalResponse;
        } catch (error) {
            console.error('處理訊息失敗:', error);
            throw error;
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