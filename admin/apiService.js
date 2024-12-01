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

            const response = await fetch(url, options);
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
            }

            return responseData;
        } catch (error) {
            console.error('請求失敗:', { url, method, error: error.message });
            throw error;
        }
    }

    setCurrentBot(botId) {
        this.currentBot = botId;
    }

    async getConfig() {
        return this.sendRequest(`/admin/api/get-config/${this.currentBot}`);
    }

    async saveConfig(config) {
        return this.sendRequest(`/admin/api/save-config/${this.currentBot}`, 'POST', config);
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