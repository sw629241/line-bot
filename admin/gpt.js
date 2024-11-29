// 保存 GPT 設定
async function saveGPTSettings(category) {
    try {
        // 先從伺服器獲取最新的配置
        const currentConfig = await window.bot.loadConfig();
        
        // 確保 categories 物件存在
        if (!currentConfig.categories) {
            currentConfig.categories = {};
        }
        
        // 只更新當前類別的設定
        currentConfig.categories[category] = {
            ...currentConfig.categories[category], // 保留原有設定
            systemPrompt: document.getElementById(`${category}Prompt`).value,
            examples: document.getElementById(`${category}Examples`).value
        };
        
        // 更新全局配置
        window.admin.categoryConfigs = currentConfig.categories;
        
        // 保存到伺服器
        await window.bot.saveConfig(currentConfig);
        
        window.ui.showAlert('success', 'GPT 設定保存成功');
    } catch (error) {
        console.error('保存 GPT 設定失敗:', error);
        window.ui.showAlert('error', '保存 GPT 設定失敗: ' + error.message);
    }
}

// 測試 GPT 回應
async function testGPTResponse(message, botConfig) {
    try {
        // 檢查配置是否有效
        if (!botConfig || !botConfig.categories) {
            throw new Error('無效的配置');
        }

        // 構建系統提示詞
        const systemPrompt = `你是一個專業的對話分類與回應生成助手。你的任務是分析用戶訊息的意圖並生成適合的回應。

請按照以下步驟處理：

1. 分析用戶訊息的語義意圖：
   - 辨識訊息中提到的產品、服務或主題
   - 判斷用戶的意圖（詢問產品資訊、價格、優惠等）
   - 確定最相關的類別

2. 在相關類別中尋找最匹配的規則：
   - 不需要完全匹配關鍵字
   - 根據語義相似度找出最相關的規則
   - 考慮上下文和同義詞

3. 找到匹配的規則後，根據動態生成比例 (ratio) 生成回覆：
   - ratio = "0"：
     * 必須完全使用固定回覆的原文
     * 不允許添加任何新內容
     * 不允許修改任何詞彙或句式
   
   - ratio = "50"：
     * 保持原有的核心信息和專業術語
     * 可以重新組織句子結構
     * 可以改變部分表達方式
   
   - ratio = "100"：
     * 完全重新撰寫，使用全新的表達方式
     * 只保留核心信息點
     * 使用不同的詞彙和句式

4. 套用指定的語言風格：
   - professional（專業）：專業術語，精確描述
   - friendly（親切）：平易近人，溫和語氣
   - cute（少女）：可愛活潑，加入表情
   - humorous（幽默）：輕鬆詼諧，有趣比喻

請以 JSON 格式返回結果：
{
    "matched_category": "最匹配的類別",
    "confidence": "匹配信心度 (0-100%)",
    "matched_rule": {
        "keywords": "匹配到的關鍵字",
        "response": "規則中的回覆",
        "ratio": "動態生成比例",
        "style": "語言風格"
    },
    "generated_reply": "根據比例和風格生成的回覆",
    "analysis": {
        "intent": "用戶意圖描述",
        "key_entities": ["識別出的關鍵實體"],
        "semantic_match": "語義匹配說明"
    }
}`;

        // 構建用戶提示詞
        const userPrompt = `所有類別的規則：
${JSON.stringify(botConfig.categories, null, 2)}

用戶訊息：${message}

請注意：
1. 先分析用戶意圖，再決定合適的類別
2. 根據語義相似度匹配規則，不要求完全匹配
3. 嚴格遵循動態生成比例的要求
4. 確保回覆符合指定的語言風格

舉例 - 產品比較意圖：
用戶：「at5跟at5s哪個好」
分析：
- 意圖：比較產品性能
- 實體：at5, at5s
- 類別：產品資訊（因為在詢問產品比較）
- 匹配：找到包含這兩個產品比較的規則`;

        // 調用 OpenAI API
        const completion = await callOpenAI([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ]);

        // 解析 GPT 回應
        const response = JSON.parse(completion.choices[0].message.content);
        
        // 轉換為期望的格式
        return {
            判斷類別: response.matched_category,
            信心度: response.confidence,
            原始訊息: message,
            符合規則: {
                關鍵詞: response.matched_rule?.keywords || '',
                固定回覆: response.matched_rule?.response || '',
                動態比例: response.matched_rule?.ratio || '',
                語言風格: response.matched_rule?.style || ''
            },
            生成回覆: response.generated_reply || '已通知小編進行回覆，請稍等。',
            分析結果: response.analysis || {}
        };

    } catch (error) {
        console.error('GPT 測試錯誤:', error);
        throw error;
    }
}

// 初始化 OpenAI 配置
let apiKey = null;

async function initializeOpenAI() {
    try {
        const response = await fetch('/admin/api/openai-key');
        const data = await response.json();
        
        if (!data.key) {
            throw new Error('OpenAI API key not found');
        }

        apiKey = data.key;
    } catch (error) {
        console.error('Failed to initialize OpenAI:', error);
        throw error;
    }
}

async function callOpenAI(messages) {
    if (!apiKey) {
        throw new Error('OpenAI not initialized');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: messages,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API call failed');
    }

    return await response.json();
}

// 導出 GPT 函數
window.gpt = {
    saveGPTSettings,
    testGPTResponse,
    initializeOpenAI
};