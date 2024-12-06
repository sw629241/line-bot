import { api } from './api.js';

export class UI {
    constructor() {
        this.currentBot = 'sxi-bot';
        this.config = null;
        this.initialized = false;
    }

    async init() {
        try {
            console.log('初始化 UI...');
            // 先載入組件，再載入配置
            await this.loadComponents();
            await this.loadConfig();
            console.log('UI 初始化完成');
        } catch (error) {
            console.error('UI 初始化失敗:', error);
            this.showAlert('error', '初始化失敗: ' + error.message);
        }
    }

    async loadConfig() {
        try {
            console.log('開始載入配置...');
            console.log('當前 Bot:', this.currentBot);
            
            this.config = await api.getConfig(this.currentBot);
            console.log('配置載入成功:', this.config);
            
            if (!this.config || !this.config.categories) {
                throw new Error('配置格式無效');
            }
            
            this.updateUI();
            console.log('UI 更新完成');
        } catch (error) {
            console.error('載入配置失敗:', error);
            this.showAlert('error', '載入配置失敗: ' + error.message);
        }
    }

    async loadComponents() {
        try {
            console.log('開始載入組件...');
            
            // 載入 Bot 選擇器
            console.log('載入 Bot 選擇器...');
            const botSelectorResponse = await fetch('bot-selector.html');
            if (!botSelectorResponse.ok) {
                throw new Error(`無法載入 Bot 選擇器: ${botSelectorResponse.status}`);
            }
            const botSelectorHtml = await botSelectorResponse.text();
            document.getElementById('botSelectorContainer').innerHTML = botSelectorHtml;
            console.log('Bot 選擇器載入完成');

            // 載入類別標籤
            console.log('載入類別標籤...');
            const categoryTabsResponse = await fetch('category-tabs.html');
            if (!categoryTabsResponse.ok) {
                throw new Error(`無法載入類別標籤: ${categoryTabsResponse.status}`);
            }
            const categoryTabsHtml = await categoryTabsResponse.text();
            document.getElementById('categoryTabsContainer').innerHTML = categoryTabsHtml;
            console.log('類別標籤載入完成');

            // 載入 GPT 設定到各個面板
            console.log('載入 GPT 設定...');
            const gptSettingsResponse = await fetch('gpt-settings.html');
            if (!gptSettingsResponse.ok) {
                throw new Error(`無法載入 GPT 設定: ${gptSettingsResponse.status}`);
            }
            const gptSettingsHtml = await gptSettingsResponse.text();
            
            const gptPanels = ['products', 'prices', 'shipping', 'promotions', 'chat', 'sensitive'];
            gptPanels.forEach(panel => {
                console.log(`載入 ${panel} 面板的 GPT 設定...`);
                const container = document.getElementById(`${panel}GptSettings`);
                if (!container) {
                    console.error(`找不到 ${panel}GptSettings 容器`);
                    return;
                }
                container.innerHTML = gptSettingsHtml;
            });
            console.log('GPT 設定載入完成');

            // 載入規則到所有面板
            console.log('載入規則...');
            const replyRulesResponse = await fetch('reply-rules.html');
            if (!replyRulesResponse.ok) {
                throw new Error(`無法載入回覆規則: ${replyRulesResponse.status}`);
            }
            const replyRulesHtml = await replyRulesResponse.text();

            gptPanels.forEach(panel => {
                console.log(`載入 ${panel} 面板的規則...`);
                const container = document.getElementById(`${panel}ReplyRules`);
                if (!container) {
                    console.error(`找不到 ${panel}ReplyRules 容器`);
                    return;
                }
                container.innerHTML = replyRulesHtml;
            });
            console.log('規則載入完成');

            // 載入測試區域到各個面板
            console.log('載入測試區域...');
            const testAreaResponse = await fetch('test-area.html');
            if (!testAreaResponse.ok) {
                throw new Error(`無法載入測試區域: ${testAreaResponse.status}`);
            }
            const testAreaHtml = await testAreaResponse.text();
            gptPanels.forEach(panel => {
                console.log(`載入 ${panel} 面板的測試區域...`);
                const container = document.getElementById(`${panel}TestArea`);
                if (!container) {
                    console.error(`找不到 ${panel}TestArea 容器`);
                    return;
                }
                container.innerHTML = testAreaHtml;
            });
            console.log('測試區域載入完成');

            // 初始化事件監聽器
            console.log('初始化事件監聽器...');
            this.initializeEventListeners();
            console.log('事件監聽器初始化完成');

            console.log('所有組件載入完成');
        } catch (error) {
            console.error('載入組件失敗：', error);
            this.showAlert('error', '載入組件失敗：' + error.message);
            throw error;
        }
    }

    updateUI() {
        if (!this.config) {
            console.error('無法更新 UI: 配置為空');
            return;
        }

        console.log('開始更新 UI...');
        const categories = ['products', 'prices', 'shipping', 'promotions', 'chat', 'sensitive'];
        categories.forEach(category => {
            console.log(`更新 ${category} 類別...`);
            if (this.config.categories && this.config.categories[category]) {
                const categoryConfig = this.config.categories[category];
                
                // 更新 GPT 設定
                const gptPrompt = document.querySelector(`#${category}GptSettings .gpt-prompt`);
                const gptExamples = document.querySelector(`#${category}GptSettings .gpt-examples`);
                
                if (gptPrompt) {
                    console.log(`設置 ${category} GPT 提示詞:`, categoryConfig.systemPrompt);
                    gptPrompt.value = categoryConfig.systemPrompt || '';
                } else {
                    console.error(`找不到 ${category} GPT 提示詞輸入框`);
                }
                
                if (gptExamples) {
                    console.log(`設置 ${category} GPT 範例:`, categoryConfig.examples);
                    gptExamples.value = categoryConfig.examples || '';
                } else {
                    console.error(`找不到 ${category} GPT 範例輸入框`);
                }

                // 更新規則列表
                console.log(`更新 ${category} 規則列表:`, categoryConfig.rules);
                const rulesList = document.querySelector(`#${category}ReplyRules .rule-list`);
                if (rulesList) {
                    this.updateRulesList(categoryConfig.rules || [], rulesList);
                } else {
                    console.error(`找不到 ${category} 規則列表容器`);
                }
            } else {
                console.warn(`找不到 ${category} 類別配置`);
            }
        });

        // 更新 Bot 選擇器
        const botSelector = document.getElementById('botSelector');
        if (botSelector) {
            console.log('更新 Bot 選擇器:', this.currentBot);
            botSelector.value = this.currentBot;
        } else {
            console.error('找不到 Bot 選擇器');
        }
        
        console.log('UI 更新完成');
    }

    updateRulesList(rules, container) {
        if (!container) return;

        container.innerHTML = rules.map((rule, index) => `
            <tr>
                <td><input type="text" class="form-control rule-keyword" value="${rule.keywords || ''}" /></td>
                <td><input type="text" class="form-control rule-response" value="${rule.response || ''}" /></td>
                <td>
                    <select class="form-select rule-ratio">
                        <option value="0" ${rule.ratio === 0 ? 'selected' : ''}>0%</option>
                        <option value="50" ${rule.ratio === 50 ? 'selected' : ''}>50%</option>
                        <option value="100" ${rule.ratio === 100 ? 'selected' : ''}>100%</option>
                    </select>
                </td>
                <td>
                    <select class="form-select rule-style">
                        <option value="專業" ${rule.style === '專業' ? 'selected' : ''}>專業</option>
                        <option value="親切" ${rule.style === '親切' ? 'selected' : ''}>親切</option>
                        <option value="少女" ${rule.style === '少女' ? 'selected' : ''}>少女</option>
                        <option value="幽默" ${rule.style === '幽默' ? 'selected' : ''}>幽默</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-danger btn-sm delete-rule" data-index="${index}">刪除</button>
                </td>
            </tr>
        `).join('');
    }

    initializeEventListeners() {
        // Bot 選擇器事件
        const botSelector = document.getElementById('botSelector');
        if (botSelector) {
            botSelector.addEventListener('change', async (e) => {
                try {
                    const newBot = e.target.value;
                    this.currentBot = newBot;
                    await this.loadConfig();
                    this.showAlert('success', `已切換到 ${newBot}`);
                } catch (error) {
                    console.error('切換 bot 失敗:', error);
                    this.showAlert('error', '切換 bot 失敗: ' + error.message);
                }
            });
        }

        // GPT 設定儲存按鈕事件
        document.querySelectorAll('.save-gpt').forEach(button => {
            button.addEventListener('click', async (e) => {
                try {
                    const panel = e.target.closest('.tab-pane').id;
                    const gptPrompt = document.querySelector(`#${panel}GptSettings .gpt-prompt`).value;
                    const gptExamples = document.querySelector(`#${panel}GptSettings .gpt-examples`).value;

                    this.ensureCategoryStructure(panel);

                    // 更新配置，保持其他設定不變
                    this.config.categories[panel] = {
                        ...this.config.categories[panel],
                        systemPrompt: gptPrompt || '',
                        examples: gptExamples || '',
                        rules: this.config.categories[panel].rules || []
                    };

                    await this.saveConfigWithErrorHandling('已儲存 GPT 設定');
                } catch (error) {
                    console.error('儲存 GPT 設定失敗:', error);
                    this.showAlert('error', '儲存 GPT 設定失敗: ' + error.message);
                }
            });
        });

        // 敏感詞儲存按鈕事件
        const saveSensitiveButton = document.querySelector('.save-sensitive');
        if (saveSensitiveButton) {
            saveSensitiveButton.addEventListener('click', async () => {
                try {
                    const sensitiveWords = document.querySelector('.sensitive-words').value
                        .split('\n')
                        .map(word => word.trim())
                        .filter(word => word);

                    this.ensureConfigStructure();
                    this.config.sensitiveWords = sensitiveWords || [];

                    await this.saveConfigWithErrorHandling('已儲存敏感詞設定');
                } catch (error) {
                    console.error('儲存敏感詞設定失敗:', error);
                    this.showAlert('error', '儲存敏感詞設定失敗: ' + error.message);
                }
            });
        }

        // 新增規則按鈕事件
        document.querySelectorAll('.add-rule').forEach(button => {
            button.addEventListener('click', () => {
                const panel = button.closest('.tab-pane').id;
                const newRule = {
                    keywords: '',
                    response: '',
                    ratio: 0,
                    style: '專業'
                };

                // 確保該分類的規則陣列存在
                this.ensureCategoryStructure(panel);
                const rules = this.config.categories[panel].rules;
                
                // 添加新規則
                rules.push(newRule);
                
                // 更新 UI
                const rulesList = button.closest('.card').querySelector('.rule-list');
                this.updateRulesList(rules, rulesList);
            });
        });

        // 規則列表相關事件（刪除和儲存）
        document.querySelectorAll('.card').forEach(container => {
            const rulesList = container.querySelector('.rule-list');
            if (!rulesList) return; // 如果不是規則列表的卡片，跳過

            const panel = container.closest('.tab-pane').id;

            // 刪除規則
            rulesList.addEventListener('click', async (e) => {
                if (e.target.classList.contains('delete-rule')) {
                    const index = parseInt(e.target.dataset.index);
                    
                    // 添加確認對話框
                    if (!confirm('確定要刪除這條規則嗎？')) {
                        return;
                    }

                    try {
                        // 更新本地配置
                        this.config.categories[panel].rules.splice(index, 1);
                        
                        // 更新 UI
                        this.updateRulesList(this.config.categories[panel].rules, rulesList);
                        
                        // 直接保存到服務器
                        await this.saveConfigWithErrorHandling('已刪除規則');
                    } catch (error) {
                        // 重新載入配置以恢復狀態
                        await this.loadConfig();
                    }
                }
            });

            // 儲存規則
            const saveRulesButton = container.querySelector('.save-rules');
            if (saveRulesButton) {
                saveRulesButton.addEventListener('click', async () => {
                    try {
                        const rules = Array.from(rulesList.querySelectorAll('tr')).map(row => ({
                            keywords: row.querySelector('.rule-keyword').value,
                            response: row.querySelector('.rule-response').value,
                            ratio: parseInt(row.querySelector('.rule-ratio').value),
                            style: row.querySelector('.rule-style').value
                        }));

                        this.config.categories[panel].rules = rules;
                        await this.saveConfigWithErrorHandling('已儲存規則設定');
                    } catch (error) {
                        console.error('儲存規則設定失敗:', error);
                        this.showAlert('error', '儲存規則設定失敗: ' + error.message);
                    }
                });
            }
        });

        // 測試按鈕事件
        document.querySelectorAll('.test-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                try {
                    const panel = e.target.closest('.tab-pane').id;
                    const message = document.querySelector(`#${panel}TestArea .test-input`).value;
                    const response = await api.testMessage(this.currentBot, message, panel);
                    document.querySelector(`#${panel}TestArea .test-output`).value = response.message;
                } catch (error) {
                    console.error('測試失敗:', error);
                    this.showAlert('error', '測試失敗: ' + error.message);
                }
            });
        });
    }

    ensureConfigStructure() {
        if (!this.config) {
            this.config = {
                categories: {},
                sensitiveWords: []
            };
        }
        if (!this.config.categories) {
            this.config.categories = {};
        }
        if (!this.config.sensitiveWords) {
            this.config.sensitiveWords = [];
        }
    }

    async saveConfigWithErrorHandling(successMessage) {
        try {
            await api.saveConfig(this.currentBot, this.config);
            this.showAlert('success', successMessage);
        } catch (error) {
            console.error('保存配置失敗:', error);
            this.showAlert('error', '保存失敗: ' + error.message);
            throw error;
        }
    }

    ensureCategoryStructure(category) {
        this.ensureConfigStructure();
        
        if (!this.config.categories[category]) {
            this.config.categories[category] = {
                systemPrompt: '',
                examples: '',
                rules: []
            };
        }
    }

    showAlert(type, message) {
        const alertContainer = document.getElementById('alert-container');
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type} alert-dismissible fade show`;
        alertElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        alertContainer.appendChild(alertElement);

        // 5 秒後自動關閉
        setTimeout(() => {
            alertElement.remove();
        }, 5000);
    }
}

// 導出單例
export const ui = new UI();

// 在 DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ui.init();
    } catch (error) {
        console.error('初始化失敗:', error);
    }
});
