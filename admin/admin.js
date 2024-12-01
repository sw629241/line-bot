// 等待所有必要的模塊載入
async function waitForDependencies() {
    const maxAttempts = 50;
    const interval = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
        if (window.ui && window.bot && window.api) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
        attempts++;
    }
    throw new Error('等待依賴模塊超時');
}

// 確保 window.admin 存在
window.admin = window.admin || {};

// 擴展 admin 對象
const adminExtension = {
    currentBot: 'sxi-bot',
    currentCategory: 'products',
    categoryConfigs: {
        products: { systemPrompt: '', examples: '', rules: [] },
        prices: { systemPrompt: '', examples: '', rules: [] },
        shipping: { systemPrompt: '', examples: '', rules: [] },
        promotions: { systemPrompt: '', examples: '', rules: [] },
        chat: { systemPrompt: '', examples: '', rules: [] },
        sensitive: { systemPrompt: '', examples: '', rules: [] }
    },
    
    updateRule(category, index, field, value) {
        console.log('更新規則:', { category, index, field, value });
        
        if (!this.categoryConfigs[category]) {
            this.categoryConfigs[category] = {
                systemPrompt: '',
                examples: '',
                rules: []
            };
        }
        
        if (!this.categoryConfigs[category].rules) {
            this.categoryConfigs[category].rules = [];
        }
        
        if (!this.categoryConfigs[category].rules[index]) {
            this.categoryConfigs[category].rules[index] = {};
        }
        
        this.categoryConfigs[category].rules[index][field] = value;
        console.log('規則已更新:', this.categoryConfigs[category].rules[index]);
    },
    
    addNewRule(category) {
        console.log('新增規則:', category, this.categoryConfigs[category]);
        
        // 新增空白規則
        const newRule = {
            keywords: '',
            response: '',
            ratio: 50,
            style: 'default',
            enabled: true
        };
        
        // 添加到規則列表
        this.categoryConfigs[category].rules.push(newRule);
        
        // 更新界面
        window.ui.updateRulesList(category, this.categoryConfigs[category].rules);
    },
    
    deleteRule(category, index) {
        console.log('刪除規則:', { category, index });
        
        if (this.categoryConfigs[category] && 
            this.categoryConfigs[category].rules && 
            this.categoryConfigs[category].rules[index]) {
            
            // 從數組中移除規則
            this.categoryConfigs[category].rules.splice(index, 1);
            
            // 更新界面
            window.ui.updateRulesList(category, this.categoryConfigs[category].rules);
            
            // 構建完整的配置對象
            const config = {
                categories: {}
            };
            
            // 複製當前所有類別的配置
            Object.keys(this.categoryConfigs).forEach(cat => {
                config.categories[cat] = { ...this.categoryConfigs[cat] };
            });
            
            // 直接保存到伺服器
            window.bot.saveConfig(config).then(() => {
                window.ui.showAlert('success', '規則已刪除並保存');
            }).catch(error => {
                console.error('保存失敗:', error);
                window.ui.showAlert('error', '刪除規則失敗: ' + error.message);
            });
        } else {
            console.error('無法刪除規則:', { category, index });
            window.ui.showAlert('error', '刪除規則失敗');
        }
    },
    
    saveAllRules(category) {
        console.log('儲存規則:', { category, rules: this.categoryConfigs[category].rules });
        
        // 構建完整的配置對象
        const config = {
            categories: {}
        };
        
        // 複製當前所有類別的配置
        Object.keys(this.categoryConfigs).forEach(cat => {
            config.categories[cat] = { ...this.categoryConfigs[cat] };
        });
        
        // 保存配置
        window.bot.saveConfig(config);
    },
    
    async loadCategoryConfig(category) {
        try {
            console.log('開始載入類別配置:', category);
            const config = await window.bot.loadConfig();
            console.log('收到配置數據:', config);
            
            if (config && config.categories) {
                // 保存所有類別的配置
                Object.keys(config.categories).forEach(cat => {
                    if (config.categories[cat]) {
                        this.categoryConfigs[cat] = {
                            systemPrompt: config.categories[cat].systemPrompt || '',
                            examples: config.categories[cat].examples || '',
                            rules: config.categories[cat].rules || []
                        };
                    }
                });
                
                // 更新當前類別的 UI
                if (config.categories[category]) {
                    console.log('更新 UI:', category, this.categoryConfigs[category]);
                    window.ui.updateUIWithConfig(category, this.categoryConfigs[category]);
                } else {
                    console.warn('找不到類別配置:', category);
                }
            } else {
                console.warn('配置數據格式不正確:', config);
            }
        } catch (error) {
            console.error('載入類別配置失敗:', error);
            window.ui.showAlert('error', '載入配置失敗: ' + error.message);
        }
    },
    
    async initialize() {
        try {
            console.log('初始化開始...');
            
            // 等待依賴模塊載入
            await waitForDependencies();
            console.log('所有依賴模塊已載入');

            // 等待一小段時間確保組件都已加載
            await new Promise(resolve => setTimeout(resolve, 500));

            // 設置 Bot 選擇器事件
            console.log('設置 Bot 選擇器事件...');
            const botSelector = document.querySelector('#botSelector');
            if (botSelector) {
                botSelector.addEventListener('change', async (e) => {
                    this.currentBot = e.target.value;
                    await this.loadCategoryConfig(this.currentCategory);
                });
            } else {
                console.error('找不到 Bot 選擇器元素');
            }

            // 設置類別標籤事件
            console.log('設置類別標籤事件...');
            document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
                tab.addEventListener('click', () => {
                    this.currentCategory = tab.getAttribute('data-bs-target').slice(1);
                    this.loadCategoryConfig(this.currentCategory);
                });
            });

            // 設置儲存按鈕事件
            console.log('設置儲存按鈕事件...');
            document.querySelectorAll('[id$="GPT"]').forEach(button => {
                button.addEventListener('click', () => {
                    const category = button.id.replace('save', '').toLowerCase().replace('gpt', '');
                    window.gpt.saveGPTSettings(category);
                });
            });

            document.querySelectorAll('[id$="Rules"]').forEach(button => {
                button.addEventListener('click', () => {
                    const category = button.id.replace('save', '').toLowerCase().replace('rules', '');
                    this.saveAllRules(category);
                });
            });

            // 設置新增規則按鈕事件
            console.log('設置新增規則按鈕事件...');
            document.querySelectorAll('[id^="add"][id$="Rule"]').forEach(button => {
                button.addEventListener('click', () => {
                    const category = button.id.replace('add', '').replace('Rule', '').toLowerCase();
                    if (!this.categoryConfigs[category]) {
                        this.categoryConfigs[category] = { rules: [] };
                    }
                    if (!this.categoryConfigs[category].rules) {
                        this.categoryConfigs[category].rules = [];
                    }
                    this.addNewRule(category);
                });
            });

            // 設置測試按鈕事件
            console.log('設置測試按鈕事件...');
            document.querySelectorAll('[id^="test"]').forEach(button => {
                button.addEventListener('click', async () => {
                    const category = button.id.replace('test', '').toLowerCase();
                    const input = document.getElementById(`${category}TestInput`);
                    if (!input || !input.value.trim()) {
                        window.ui.showAlert('warning', '請輸入測試訊息');
                        return;
                    }
                    
                    try {
                        const result = document.getElementById(`${category}TestResult`);
                        if (result) {
                            result.textContent = '處理中...';
                        }
                        await window.bot.testCategory(category, input.value.trim());
                    } catch (error) {
                        console.error('測試失敗:', error);
                    }
                });
            });

            // 載入初始類別配置
            console.log('載入初始類別配置:', this.currentCategory);
            await this.loadCategoryConfig(this.currentCategory);
            
            console.log('初始化完成');
        } catch (error) {
            console.error('初始化失敗:', error);
            window.ui.showAlert('error', '初始化失敗: ' + error.message);
        }
    }
};

// 在所有依賴都載入後，再擴展 window.admin
async function initializeAdmin() {
    try {
        console.log('開始初始化 admin...');
        await waitForDependencies();
        
        // 擴展 window.admin 對象
        Object.assign(window.admin, adminExtension);
        console.log('admin 對象已擴展:', window.admin);
        
        // 初始化 admin
        await window.admin.initialize();
    } catch (error) {
        console.error('初始化失敗:', error);
        console.log('當前 window.admin:', window.admin);
    }
}

// 確保在 DOM 載入完成後初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdmin);
} else {
    initializeAdmin();
}
