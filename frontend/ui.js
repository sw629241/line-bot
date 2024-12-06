import { api } from './api.js';

export class UI {
    constructor() {
        this.currentBot = 'sxi-bot';
        this.config = null;
        this.initialized = false;
        
        // 添加類別中英文對照表
        this.categoryMap = {
            'products': '產品資訊',
            'prices': '產品價格',
            'shipping': '運輸費用',
            'promotions': '活動優惠',
            'chat': '一般對話',
            'sensitive': '敏感詞'
        };
        
        // 歷史記錄相關
        this.HISTORY_KEY = 'test_history';
        this.MAX_HISTORY_ITEMS = 50;
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
        console.log('初始化事件監聽器...');

        // Bot 選擇器事件
        const botSelector = document.getElementById('botSelector');
        if (botSelector) {
            botSelector.addEventListener('change', async (event) => {
                this.currentBot = event.target.value;
                await this.loadConfig();
            });
        }

        // 測試按鈕事件
        const testButtons = document.querySelectorAll('.test-button');
        testButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const testInput = button.closest('.input-group').querySelector('.test-input');
                if (testInput && testInput.value.trim()) {
                    await this.testMessage(testInput.value.trim());
                }
            });
        });

        // 測試輸入框 Enter 鍵事件
        const testInputs = document.querySelectorAll('.test-input');
        testInputs.forEach(input => {
            input.addEventListener('keypress', async (event) => {
                if (event.key === 'Enter' && input.value.trim()) {
                    await this.testMessage(input.value.trim());
                }
            });
        });

        // 清除歷史按鈕事件
        const clearHistoryButtons = document.querySelectorAll('.clear-history-button');
        clearHistoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.clearHistory();
            });
        });

        console.log('事件監聽器初始化完成');
    }

    async testMessage(message) {
        try {
            console.log('開始測試訊息:', message);
            
            // 顯示載入中
            const spinner = document.getElementById('loading-spinner');
            spinner.classList.remove('d-none');
            
            // 清空並隱藏結果區域
            const resultWrapper = document.querySelector('.test-result-wrapper');
            resultWrapper.classList.remove('show');
            
            // 發送測試請求
            const result = await api.testMessage(this.currentBot, message);
            console.log('測試結果:', result);
            
            // 更新結果顯示
            document.querySelector('.test-category').textContent = this.categoryMap[result.category] || result.category;
            document.querySelector('.test-confidence').textContent = `${Math.round(result.confidence * 100)}%`;
            document.querySelector('.test-intent').textContent = result.intent;
            document.querySelector('.test-keywords').innerHTML = result.keywords.map(keyword => 
                `<span class="badge bg-secondary me-1">${keyword}</span>`
            ).join('');
            document.querySelector('.test-sensitive').textContent = result.isSensitive ? '是' : '否';
            document.querySelector('.test-sensitive').className = `test-sensitive badge ${result.isSensitive ? 'bg-danger' : 'bg-success'}`;
            document.querySelector('.test-response').textContent = result.generatedResponse;
            
            // 顯示結果區域
            resultWrapper.classList.add('show');
            
            // 添加到歷史記錄
            this.addToHistory(message, result);
            
        } catch (error) {
            console.error('測試訊息失敗:', error);
            this.showAlert('error', '測試失敗: ' + error.message);
        } finally {
            // 隱藏載入中
            const spinner = document.getElementById('loading-spinner');
            spinner.classList.add('d-none');
        }
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

    addToHistory(message, result) {
        try {
            // 獲取現有歷史記錄
            let history = JSON.parse(localStorage.getItem(this.HISTORY_KEY) || '[]');
            
            // 添加新記錄
            const historyItem = {
                message,
                result,
                timestamp: new Date().toISOString()
            };
            
            // 將新記錄添加到開頭
            history.unshift(historyItem);
            
            // 限制歷史記錄數量
            if (history.length > this.MAX_HISTORY_ITEMS) {
                history = history.slice(0, this.MAX_HISTORY_ITEMS);
            }
            
            // 保存到 localStorage
            localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
            
            // 更新 UI
            this.updateHistoryUI();
            
        } catch (error) {
            console.error('添加歷史記錄失敗:', error);
        }
    }

    clearHistory() {
        try {
            // 清除 localStorage 中的歷史記錄
            localStorage.removeItem(this.HISTORY_KEY);
            
            // 更新 UI
            this.updateHistoryUI();
            
        } catch (error) {
            console.error('清除歷史記錄失敗:', error);
        }
    }

    updateHistoryUI() {
        try {
            // 獲取歷史記錄
            const history = JSON.parse(localStorage.getItem(this.HISTORY_KEY) || '[]');
            
            // 獲取所有歷史記錄列表容器
            const historyLists = document.querySelectorAll('.test-history-list');
            
            historyLists.forEach(historyList => {
                // 清空現有內容
                historyList.innerHTML = '';
                
                // 如果沒有歷史記錄，顯示提示
                if (history.length === 0) {
                    historyList.innerHTML = '<div class="text-muted text-center">暫無歷史記錄</div>';
                    return;
                }
                
                // 獲取模板
                const template = document.getElementById('history-item-template');
                if (!template) {
                    console.error('找不到歷史記錄模板');
                    return;
                }
                
                // 添加歷史記錄項目
                history.forEach(item => {
                    const clone = template.content.cloneNode(true);
                    
                    // 設置訊息
                    clone.querySelector('.test-message').textContent = item.message;
                    
                    // 設置時間
                    const time = new Date(item.timestamp);
                    clone.querySelector('.test-time').textContent = 
                        `${time.getFullYear()}/${(time.getMonth() + 1).toString().padStart(2, '0')}/${time.getDate().toString().padStart(2, '0')} ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;
                    
                    // 設置類別
                    const category = clone.querySelector('.category');
                    category.textContent = this.categoryMap[item.result.category] || item.result.category;
                    
                    // 設置信心度
                    clone.querySelector('.confidence').textContent = 
                        `${Math.round(item.result.confidence * 100)}%`;
                    
                    // 設置敏感詞標記
                    const sensitive = clone.querySelector('.sensitive');
                    sensitive.textContent = item.result.isSensitive ? '敏感' : '正常';
                    sensitive.className = `sensitive badge ${item.result.isSensitive ? 'bg-danger' : 'bg-success'}`;
                    
                    // 設置回覆
                    clone.querySelector('.response').textContent = item.result.generatedResponse;
                    
                    historyList.appendChild(clone);
                });
            });
            
        } catch (error) {
            console.error('更新歷史記錄 UI 失敗:', error);
        }
    }

    loadHistory() {
        const history = localStorage.getItem(this.HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    }

    saveHistory(history) {
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    }

    renderHistory() {
        const history = this.loadHistory();
        const historyList = document.querySelector('.test-history-list');
        const template = document.getElementById('history-item-template');
        
        historyList.innerHTML = '';
        
        history.forEach(item => {
            const historyItem = template.content.cloneNode(true);
            
            // 填充數據
            historyItem.querySelector('.test-message').textContent = item.message;
            historyItem.querySelector('.test-time').textContent = new Date(item.timestamp).toLocaleString();
            historyItem.querySelector('.category').textContent = this.categoryMap[item.result.category] || item.result.category;
            historyItem.querySelector('.confidence').textContent = `${Math.round(item.result.confidence * 100)}%`;
            
            const sensitiveSpan = historyItem.querySelector('.sensitive');
            if (item.result.isSensitive) {
                sensitiveSpan.textContent = '敏感';
                sensitiveSpan.classList.add('bg-danger');
            } else {
                sensitiveSpan.textContent = '正常';
                sensitiveSpan.classList.add('bg-success');
            }
            
            historyItem.querySelector('.response').textContent = item.result.generatedResponse || '-';
            
            historyList.appendChild(historyItem);
        });
    }

    setLoading(isLoading) {
        const spinner = document.getElementById('loading-spinner');
        const testButton = document.querySelector('.test-button');
        const testInput = document.querySelector('.test-input');
        
        if (isLoading) {
            spinner.classList.remove('d-none');
            testButton.disabled = true;
            testInput.disabled = true;
        } else {
            spinner.classList.add('d-none');
            testButton.disabled = false;
            testInput.disabled = false;
        }
    }

    updateTestResult(result) {
        // 更新類別
        const categorySpan = document.querySelector('.test-category');
        categorySpan.textContent = this.categoryMap[result.category] || result.category;
        
        // 更新信心度
        const confidenceSpan = document.querySelector('.test-confidence');
        confidenceSpan.textContent = `${Math.round(result.confidence * 100)}%`;
        
        // 更新語義意圖
        const intentSpan = document.querySelector('.test-intent');
        intentSpan.textContent = result.intent || '-';
        
        // 更新關鍵詞
        const keywordsDiv = document.querySelector('.test-keywords');
        keywordsDiv.innerHTML = '';
        if (result.keywords && result.keywords.length > 0) {
            result.keywords.forEach(keyword => {
                const badge = document.createElement('span');
                badge.className = 'badge bg-secondary me-1';
                badge.textContent = keyword;
                keywordsDiv.appendChild(badge);
            });
        } else {
            keywordsDiv.textContent = '-';
        }
        
        // 更新敏感詞狀態
        const sensitiveSpan = document.querySelector('.test-sensitive');
        if (result.isSensitive) {
            sensitiveSpan.textContent = '敏感';
            sensitiveSpan.className = 'test-sensitive badge bg-danger';
        } else {
            sensitiveSpan.textContent = '正常';
            sensitiveSpan.className = 'test-sensitive badge bg-success';
        }
        
        // 更新生成回覆
        const responseDiv = document.querySelector('.test-response');
        responseDiv.textContent = result.generatedResponse || '-';
        
        // 顯示結果區域
        const resultWrapper = document.querySelector('.test-result-wrapper');
        resultWrapper.classList.add('show');
    }

    clearTestResult() {
        document.querySelector('.test-category').textContent = '-';
        document.querySelector('.test-confidence').textContent = '-';
        document.querySelector('.test-intent').textContent = '-';
        document.querySelector('.test-keywords').textContent = '-';
        document.querySelector('.test-sensitive').className = 'test-sensitive badge bg-secondary';
        document.querySelector('.test-sensitive').textContent = '-';
        document.querySelector('.test-response').textContent = '-';
        
        const resultWrapper = document.querySelector('.test-result-wrapper');
        resultWrapper.classList.remove('show');
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
