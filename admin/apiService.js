// API 請求輔助函數
class ApiService {
    constructor() {
        this.currentBot = 'sxi-bot';
    }

    async init() {
        console.log('初始化 API 服務...');
        return Promise.resolve();
    }

    async sendRequest(method, url, data = null) {
        console.log(`發送請求: ${method} ${url}`, data ? `請求內容: ${JSON.stringify(data)}` : '');
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log(`請求成功: ${method} ${url}`, result);
            return result;
        } catch (error) {
            console.error(`請求失敗:`, { method, url, error: error.message });
            throw new Error(`請求失敗: ${error.message}`);
        }
    }

    setCurrentBot(botId) {
        this.currentBot = botId;
    }

    async getConfig(botId) {
        console.log(`正在從 API 加載 ${botId} 的配置...`);
        try {
            // 使用正確的路徑格式
            const response = await fetch(`/admin/${botId}/config.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const config = await response.json();
            console.log(`成功加載 ${botId} 的配置:`, config);
            return config;
        } catch (error) {
            console.error(`加載 ${botId} 配置失敗:`, error);
            throw error;
        }
    }

    async saveConfig(botId, config) {
        console.log(`保存 ${botId} 的配置...`);
        try {
            const response = await this.sendRequest('POST', `/admin/api/save-config/${botId}`, config);
            if (response.success) {
                console.log(`成功保存 ${botId} 的配置`);
                return response;
            } else {
                throw new Error(`保存配置失敗: ${response.error || '未知錯誤'}`);
            }
        } catch (error) {
            console.error('保存配置時發生錯誤:', error);
            throw error;
        }
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