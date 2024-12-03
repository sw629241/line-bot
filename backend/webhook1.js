const { Client } = require('@line/bot-sdk');
const { lineConfig } = require('./config');

const client = new Client(lineConfig.primary);

async function handleWebhook(req) {
    const events = req.body.events;
    
    if (!Array.isArray(events)) {
        throw new Error('Invalid request body');
    }

    return Promise.all(events.map(async (event) => {
        try {
            return await handleEvent(event);
        } catch (error) {
            console.error('Error handling event:', error);
            throw error;
        }
    }));
}

async function handleEvent(event) {
    // 在這裡處理不同類型的事件
    if (event.type !== 'message' || event.message.type !== 'text') {
        return null;
    }

    // 回覆訊息
    return client.replyMessage(event.replyToken, {
        type: 'text',
        text: event.message.text
    });
}

module.exports = {
    handleWebhook
};
