// API 請求輔助函數
async function fetchWithAuth(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const requestStartTime = Date.now();
    console.log('發送請求:', {
        url,
        method: options.method || 'GET',
        timestamp: new Date().toISOString()
    });

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            console.log('請求超時，已經過時間:', Date.now() - requestStartTime, 'ms');
        }, 60000); // 60 秒超時

        const response = await fetch(url, { 
            ...defaultOptions, 
            ...options,
            signal: controller.signal,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            }
        });
        
        clearTimeout(timeoutId);
        
        const requestDuration = Date.now() - requestStartTime;
        console.log('收到回應:', {
            status: response.status,
            statusText: response.statusText,
            duration: requestDuration + 'ms',
            timestamp: new Date().toISOString()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
    } catch (error) {
        console.error('請求失敗:', error);
        throw error;
    }
}

// 獲取配置
async function getConfig(botId) {
    const response = await fetchWithAuth(`/admin/api/get-config/${botId}`);
    return await response.json();
}

// 保存配置
async function saveConfig(botId, config) {
    console.log('保存配置:', { 
        botId,
        configSize: JSON.stringify(config).length,
        timestamp: new Date().toISOString()
    });
    
    try {
        // 預先驗證 JSON
        JSON.stringify(config);
        
        return await fetchWithAuth(`/admin/api/save-config/${botId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
    } catch (error) {
        console.error('配置序列化失敗:', error);
        throw new Error('配置格式無效: ' + error.message);
    }
}

// 測試類別
async function testCategory(botId, category, message) {
    return await fetchWithAuth(`/admin/api/test/${botId}/${category}`, {
        method: 'POST',
        body: JSON.stringify({ message: message })
    });
}

// 導出 API 函數
window.api = {
    fetchWithAuth,
    getConfig,
    saveConfig,
    testCategory
};