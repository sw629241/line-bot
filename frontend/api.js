/**
 * 前端 API 服務
 * 負責與後端 API 通信
 */
class ApiService {
    constructor() {
        // 使用相對路徑，這樣會自動匹配當前域名和端口
        this.baseUrl = '/api';
    }

    /**
     * 獲取機器人配置
     */
    async getConfig(botId) {
        try {
            console.log(`正在獲取 ${botId} 的配置...`);
            const response = await fetch(`${this.baseUrl}/bots/${botId}/config`);
            console.log('API 響應狀態:', response.status);
            
            if (!response.ok) {
                const error = await response.text();
                console.error(`獲取配置失敗: ${error}`);
                throw new Error(`Failed to fetch config: ${error}`);
            }
            
            const config = await response.json();
            console.log('獲取到的配置:', config);
            return config;
        } catch (error) {
            console.error('Error fetching config:', error);
            throw error;
        }
    }

    /**
     * 保存機器人配置
     */
    async saveConfig(botId, config) {
        try {
            const response = await fetch(`${this.baseUrl}/bots/${botId}/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to save config: ${error}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error saving config:', error);
            throw error;
        }
    }

    /**
     * 測試訊息
     */
    async testMessage(botId, message, category) {
        try {
            const response = await fetch(`${this.baseUrl}/bots/${botId}/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, category })
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to test message: ${error}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error testing message:', error);
            throw error;
        }
    }
}

// 導出單例
export const api = new ApiService();