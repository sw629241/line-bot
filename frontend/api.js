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
            console.log('正在保存配置...', {
                botId,
                config: JSON.stringify(config, null, 2)
            });
            
            const response = await fetch(`${this.baseUrl}/bots/${botId}/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('保存配置失敗，伺服器回應:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
                throw new Error(`Failed to save config: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('配置保存成功:', result);
            return result;
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