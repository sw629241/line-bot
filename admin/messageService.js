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
            // 獲取當前配置
            const config = await configService.getCurrentConfig();
            if (!config || !config.categories) {
                throw new Error('無法獲取配置或配置無效');
            }

            // 準備發送給GPT的數據
            const gptData = {
                message: message,
                categories: config.categories
            };

            console.log('Sending test message request:', {
                message: message,
                categoriesCount: Object.keys(config.categories).length
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
                const errorText = await response.text();
                console.error('API response error:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                throw new Error(`API請求失敗: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            console.log('API response success:', result);

            return {
                category: result.category,           // 判斷的類別
                intent: result.intent,               // 語義意圖
                confidence: result.confidence,       // 判斷信心度
                matchedKeywords: result.keywords,    // 匹配的關鍵詞
                generatedContent: result.content,    // 生成的內容
                dynamicRatio: result.ratio || 0,     // 動態比例
                style: result.style || 'friendly'    // 語言風格
            };
        } catch (error) {
            console.error('測試訊息處理失敗:', error);
            throw error;
        }
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

    // 處理訊息
    async processMessageWithGPT(message, botConfig) {
        try {
            const messages = [
                {
                    role: 'system',
                    content: botConfig.systemPrompt || '你是一個有幫助的助手。'
                },
                {
                    role: 'user',
                    content: message
                }
            ];

            return await this.callOpenAI(messages);
        } catch (error) {
            console.error('處理訊息失敗:', error);
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