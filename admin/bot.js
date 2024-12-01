// 載入配置
async function loadConfig() {
    try {
        const config = await window.api.getConfig(window.admin.currentBot);
        console.log('載入配置成功:', config);
        return config;
    } catch (error) {
        console.error('載入配置失敗:', error);
        window.ui.showAlert('error', '載入配置失敗: ' + error.message);
        return {
            categories: {
                products: { systemPrompt: '', examples: '', rules: [] },
                prices: { systemPrompt: '', examples: '', rules: [] },
                shipping: { systemPrompt: '', examples: '', rules: [] },
                promotions: { systemPrompt: '', examples: '', rules: [] },
                chat: { systemPrompt: '', examples: '', rules: [] },
                sensitive: { systemPrompt: '', examples: '', rules: [] }
            }
        };
    }
}

// 載入當前 Bot
async function loadCurrentBot() {
    try {
        console.log('載入當前 Bot 配置...');
        const config = await loadConfig();
        if (config) {
            console.log('當前 Bot 配置載入成功');
            window.ui.showAlert('success', '配置載入成功');
            return config;
        }
    } catch (error) {
        console.error('載入當前 Bot 失敗:', error);
        window.ui.showAlert('error', '載入當前 Bot 失敗: ' + error.message);
        throw error;
    }
}

// 保存配置
async function saveConfig(config) {
    try {
        console.log('正在保存配置...');
        await window.api.saveConfig(window.admin.currentBot, config);
        console.log('配置保存成功');
        window.ui.showAlert('success', '保存成功');
        
        // 等待一段時間後重新載入配置
        setTimeout(async () => {
            try {
                await loadCurrentBot();
            } catch (error) {
                console.error('重新載入配置失敗:', error);
            }
        }, 1000);
    } catch (error) {
        console.error('保存配置失敗:', error);
        window.ui.showAlert('error', '保存失敗: ' + error.message);
        throw error;
    }
}

// 測試類別
async function testCategory(category) {
    const testInput = document.getElementById(`${category}TestInput`);
    const message = testInput.value.trim();
    const resultArea = document.getElementById(`${category}TestResult`);

    if (!message) {
        window.ui.showAlert('error', '請輸入測試訊息');
        return;
    }

    try {
        // 獲取當前機器人的配置
        const fullConfig = await loadConfig();
        
        // 傳入完整的類別配置進行測試
        const response = await window.gpt.testGPTResponse(message, fullConfig);
        
        // 顯示測試結果
        resultArea.innerHTML = `<pre>${JSON.stringify(response, null, 2)}</pre>`;
        window.ui.showAlert('success', '測試完成');
    } catch (error) {
        console.error('測試失敗:', error);
        window.ui.showAlert('error', '測試失敗: ' + error.message);
        resultArea.innerHTML = `<pre>測試失敗: ${error.message}</pre>`;
    }
}

// 導出 Bot 函數
window.bot = {
    loadConfig,
    loadCurrentBot,
    saveConfig,
    testCategory
};