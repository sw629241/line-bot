// 全局狀態
let currentBot = 'sxi-bot';
let currentCategory = 'products';

// 配置數據結構
const categoryConfigs = {
    products: { systemPrompt: '', examples: '', rules: [] },
    prices: { systemPrompt: '', examples: '', rules: [] },
    shipping: { systemPrompt: '', examples: '', rules: [] },
    promotions: { systemPrompt: '', examples: '', rules: [] },
    chat: { systemPrompt: '', examples: '', rules: [] },
    noresponse: { systemPrompt: '', examples: '', rules: [] }
};

// 載入類別配置
async function loadCategoryConfig(category) {
    try {
        const config = await window.bot.loadConfig();
        if (config.categories) {
            // 保存所有類別的配置
            Object.keys(config.categories).forEach(cat => {
                if (config.categories[cat]) {
                    categoryConfigs[cat] = {
                        systemPrompt: config.categories[cat].systemPrompt || '',
                        examples: config.categories[cat].examples || '',
                        rules: config.categories[cat].rules || []
                    };
                }
            });
            
            // 更新當前類別的 UI
            if (config.categories[category]) {
                window.ui.updateUIWithConfig(category, categoryConfigs[category]);
            }
        }
    } catch (error) {
        console.error('載入類別配置失敗:', error);
        window.ui.showAlert('error', '載入配置失敗: ' + error.message);
    }
}

// 初始化事件監聽器
function initializeEventListeners() {
    // Bot 選擇器變更事件
    document.querySelector('#botSelector').addEventListener('change', async (e) => {
        currentBot = e.target.value;
        await loadCategoryConfig(currentCategory);
    });

    // 類別標籤點擊事件
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('click', async () => {
            currentCategory = tab.getAttribute('data-bs-target').slice(1);
            await loadCategoryConfig(currentCategory);
        });
    });

    // 設置儲存按鈕事件
    setupSaveButtons();
    
    // 設置新增規則按鈕事件
    setupAddRuleButtons();
    
    // 設置測試按鈕事件
    setupTestButtons();
}

// 設置儲存按鈕的事件處理
function setupSaveButtons() {
    // GPT 設定儲存按鈕
    document.querySelectorAll('[id$="GPT"]').forEach(button => {
        button.addEventListener('click', () => {
            const category = button.id.replace('save', '').toLowerCase().replace('gpt', '');
            window.gpt.saveGPTSettings(category);
        });
    });

    // 規則儲存按鈕
    document.querySelectorAll('[id$="Rules"]').forEach(button => {
        button.addEventListener('click', () => {
            const category = button.id.replace('save', '').toLowerCase().replace('rules', '');
            saveAllRules(category);
        });
    });
}

// 設置新增規則按鈕事件
function setupAddRuleButtons() {
    document.querySelectorAll('[id^="add"][id$="Rule"]').forEach(button => {
        button.addEventListener('click', () => {
            // 從按鈕 ID 中提取類別名稱（例如：addProductsRule -> products）
            const category = button.id.replace('add', '').replace('Rule', '').toLowerCase();
            console.log('新增規則按鈕被點擊:', button.id, '-> 類別:', category);
            
            // 確保 categoryConfigs 中有該類別
            if (!categoryConfigs[category]) {
                categoryConfigs[category] = { rules: [] };
            }
            
            // 確保 rules 陣列存在
            if (!categoryConfigs[category].rules) {
                categoryConfigs[category].rules = [];
            }
            
            addNewRule(category);
        });
    });
}

// 設置測試按鈕事件
function setupTestButtons() {
    document.querySelectorAll('[id^="test"]').forEach(button => {
        button.addEventListener('click', async () => {
            const category = button.id.replace('test', '').toLowerCase();
            const input = document.getElementById(`${category}TestInput`);
            if (!input || !input.value.trim()) {
                window.ui.showAlert('warning', '請輸入測試訊息');
                return;
            }
            
            try {
                // 顯示載入中
                const result = document.getElementById(`${category}TestResult`);
                if (result) {
                    result.textContent = '處理中...';
                }
                
                // 執行測試
                await window.bot.testCategory(category, input.value.trim());
            } catch (error) {
                console.error('測試失敗:', error);
            }
        });
    });
}

// 新增空白規則
function addNewRule(category) {
    console.log('新增規則:', category, categoryConfigs[category]);
    
    // 新增空白規則
    const newRule = {
        keywords: '',
        response: '',
        ratio: 50,
        style: 'default',
        enabled: true
    };
    
    // 添加到規則列表
    categoryConfigs[category].rules.push(newRule);
    
    // 更新界面
    window.ui.updateRulesList(category, categoryConfigs[category].rules);
}

// 更新規則（用於表格內聯編輯）
function updateRule(category, index, field, value) {
    console.log('更新規則:', { category, index, field, value });
    
    if (!categoryConfigs[category].rules) {
        categoryConfigs[category].rules = [];
    }
    
    if (!categoryConfigs[category].rules[index]) {
        categoryConfigs[category].rules[index] = {};
    }
    
    categoryConfigs[category].rules[index][field] = value;
}

// 儲存所有規則
async function saveAllRules(category) {
    try {
        console.log('儲存規則:', { category, rules: categoryConfigs[category].rules });
        
        // 先獲取最新的配置
        const currentConfig = await window.bot.loadConfig();
        
        // 合併配置
        const newConfig = {
            categories: {
                ...currentConfig.categories,
                [category]: {
                    ...currentConfig.categories[category],
                    ...categoryConfigs[category]
                }
            }
        };
        
        // 保存配置
        await window.bot.saveConfig(newConfig);
        window.ui.showAlert('success', '規則已儲存');
    } catch (error) {
        console.error('儲存規則失敗:', error);
        window.ui.showAlert('danger', '儲存規則失敗');
    }
}

// 刪除規則
async function deleteRule(category, index) {
    if (confirm('確定要刪除此規則嗎？')) {
        try {
            console.log('刪除規則:', { category, index });
            
            // 先獲取最新的配置
            const currentConfig = await window.bot.loadConfig();
            
            // 從陣列中移除規則
            categoryConfigs[category].rules.splice(index, 1);
            
            // 合併配置
            const newConfig = {
                categories: {
                    ...currentConfig.categories,
                    [category]: {
                        ...currentConfig.categories[category],
                        ...categoryConfigs[category]
                    }
                }
            };
            
            // 保存配置
            await window.bot.saveConfig(newConfig);
            
            // 更新界面
            window.ui.updateRulesList(category, categoryConfigs[category].rules);
            window.ui.showAlert('success', '規則已刪除');
        } catch (error) {
            console.error('刪除規則失敗:', error);
            window.ui.showAlert('danger', '刪除規則失敗');
            
            // 如果儲存失敗，重新載入配置
            await loadCategoryConfig(category);
        }
    }
}

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('初始化開始...');
        
        // 初始化事件監聽器
        initializeEventListeners();
        
        // 載入初始類別配置
        await loadCategoryConfig(currentCategory);
        
        console.log('初始化完成');
    } catch (error) {
        console.error('初始化失敗:', error);
        window.ui.showAlert('error', '初始化失敗: ' + error.message);
    }
});

// 導出全局變量和函數
window.admin = {
    currentBot,
    currentCategory,
    categoryConfigs,
    loadCategoryConfig,
    addNewRule,
    updateRule,
    deleteRule
};
