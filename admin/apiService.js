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
                throw new Error('伺服器返回了非預期的響應類型');
            }

            if (!response.ok) {
                console.error('請求失敗:', responseData);
                throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
            }

            console.log(`請求成功: ${method} ${url}`, responseData);
            return responseData;
        } catch (error) {
            console.error('請求失敗:', { url, method, error: error.message });
            throw new Error('內部伺服器錯誤');
        }
    }

    setCurrentBot(botId) {
        this.currentBot = botId;
    }

    async getConfig() {
        return this.sendRequest(`/admin/api/get-config/${this.currentBot}`);
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