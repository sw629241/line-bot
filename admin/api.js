// API 請求輔助函數
async function fetchWithAuth(url, options = {}) {
    const credentials = btoa('admin:123');
    const defaultOptions = {
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
        },
        credentials: 'include'
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
        }, 60000); // 增加到 60 秒

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
        
        if (response.status === 401) {
            console.error('認證失敗，請檢查用戶名和密碼');
            window.ui.showAlert('error', '認證失敗，請重新登入');
            throw new Error('認證失敗');
        }
        
        const contentType = response.headers.get('content-type');
        if (!response.ok) {
            let errorMessage;
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                console.error('API 錯誤回應 (JSON):', errorData);
                errorMessage = errorData.error || `HTTP 錯誤! 狀態: ${response.status}`;
            } else {
                const errorText = await response.text();
                console.error('API 錯誤回應 (Text):', errorText);
                errorMessage = `HTTP 錯誤! 狀態: ${response.status}`;
            }
            throw new Error(errorMessage);
        }
        
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log('API 回應數據:', data);
            return data;
        }
        
        return await response.text();
    } catch (error) {
        const requestDuration = Date.now() - requestStartTime;
        if (error.name === 'AbortError') {
            console.error('請求超時:', {
                duration: requestDuration + 'ms',
                url,
                method: options.method || 'GET'
            });
            throw new Error(`請求超時（${requestDuration}ms），請稍後重試`);
        }
        console.error('API 請求失敗:', {
            error: error.message,
            duration: requestDuration + 'ms',
            url,
            method: options.method || 'GET'
        });
        throw error;
    }
}

// 獲取配置
async function getConfig(botId) {
    return await fetchWithAuth(`/admin/api/get-config/${botId}`);
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