// API 請求輔助函數
class ApiService {
    constructor() {
        this.currentBot = 'sxi-bot';
    }

    async init() {
        console.log('初始化 API 服務...');
        return Promise.resolve();
    }

    async sendRequest(url, method = 'GET', body = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (body) {
                options.body = JSON.stringify(body);
            }

            console.log(`發送請求: ${method} ${url}`, body ? '請求內容:' : '', body || '');
            const response = await fetch(url, options);
            
            const contentType = response.headers.get('content-type');
            let responseData;
            
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                const text = await response.text();
                console.error('非預期的響應類型:', contentType, '響應內容:', text);
                throw new Error(`伺服器返回了非預期的響應類型: ${contentType}`);
            }

            if (!response.ok) {
                console.error('請求失敗:', responseData);
                throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
            }

            console.log(`請求成功: ${method} ${url}`, responseData);
            return responseData;
        } catch (error) {
            console.error('請求失敗:', { url, method, error: error.message });
            if (error.message.includes('非預期的響應類型') || error.message.includes('HTTP error')) {
                throw error;
            }
            throw new Error(`請求失敗: ${error.message}`);
        }
    }

    setCurrentBot(botId) {
        this.currentBot = botId;
    }

    async getConfig() {
        try {
            // 使用完整的 API 路徑
            const response = await fetch(`/admin/${this.currentBot}/config.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const config = await response.json();
            
            // 驗證配置格式
            if (!config || !config.categories) {
                throw new Error('無效的配置格式: 缺少 categories 屬性');
            }
            
            // 驗證必要的類別
            const requiredCategories = ['products', 'prices', 'shipping', 'promotions', 'chat', 'sensitive'];
            const missingCategories = requiredCategories.filter(cat => !config.categories[cat]);
            if (missingCategories.length > 0) {
                throw new Error(`無效的配置格式: 缺少必要類別 ${missingCategories.join(', ')}`);
            }
            
            return config;
        } catch (error) {
            console.error('獲取配置失敗:', error);
            throw error;
        }
    }

    async saveConfig(config) {
        if (!config || !config.categories) {
            throw new Error('Invalid configuration format');
        }
        return this.sendRequest(`/admin/api/save-config/${this.currentBot}`, 'POST', {
            categories: config.categories
        });
    }

    async testGPTResponse(input, config) {
        return this.sendRequest(`/admin/api/test-gpt/${this.currentBot}`, 'POST', {
            input,
            config
        });
    }

    async replyMessage(replyToken, message) {
        return this.sendRequest('/admin/api/reply', 'POST', { replyToken, message });
    }

    async testCategory(category, message) {
        return this.sendRequest(`/admin/api/test-category/${this.currentBot}`, 'POST', {
            category,
            message
        });
    }
}

export const apiService = new ApiService();