class MessageService {
    constructor() {
        this.botConfig = null;
    }

    setBotConfig(config) {
        this.botConfig = config;
    }

    async processMessage(message) {
        try {
            if (!this.botConfig) {
                throw new Error('Bot configuration not set');
            }

            // 根據設定決定是否使用 GPT
            if (this.botConfig.useGpt) {
                return await this.processWithGpt(message);
            } else {
                return await this.processWithRules(message);
            }
        } catch (error) {
            console.error('Error processing message:', error);
            throw error;
        }
    }

    async processWithGpt(message) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    config: this.botConfig
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error in GPT processing:', error);
            throw error;
        }
    }

    async processWithRules(message) {
        try {
            // 使用回覆規則處理訊息
            const matchedRule = this.botConfig.replyRules.find(rule => 
                message.toLowerCase().includes(rule.keyword.toLowerCase())
            );

            return matchedRule ? matchedRule.response : this.botConfig.defaultResponse;
        } catch (error) {
            console.error('Error in rule processing:', error);
            throw error;
        }
    }

    async testMessage(message) {
        try {
            return await this.processMessage(message);
        } catch (error) {
            console.error('Error in test message:', error);
            throw error;
        }
    }
}

// Export as singleton
export const messageService = new MessageService();
