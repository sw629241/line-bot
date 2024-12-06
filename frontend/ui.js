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
                    <button class="btn btn-danger btn-sm delete-rule">刪除</button>
                </td>
            </tr>
        `).join('');

        // 為新添加的刪除按鈕綁定事件
        container.querySelectorAll('.delete-rule').forEach(button => {
            this.addDeleteRuleEvent(button);
        });
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

        // GPT 設定儲存按鈕事件
        document.querySelectorAll('.save-gpt').forEach(button => {
            button.addEventListener('click', async (event) => {
                try {
                    const panel = event.target.closest('.tab-pane').id;
                    const gptPrompt = document.querySelector(`#${panel}GptSettings .gpt-prompt`).value;
                    const gptExamples = document.querySelector(`#${panel}GptSettings .gpt-examples`).value;

                    // 確保配置結構存在
                    if (!this.config.categories) {
                        this.config.categories = {};
                    }
                    if (!this.config.categories[panel]) {
                        this.config.categories[panel] = {};
                    }

                    // 更新配置
                    this.config.categories[panel].systemPrompt = gptPrompt;
                    this.config.categories[panel].examples = gptExamples;

                    // 保存配置
                    await this.saveConfig();
                    this.showAlert('success', 'GPT 設定已儲存');
                } catch (error) {
                    console.error('儲存 GPT 設定失敗:', error);
                    this.showAlert('error', '儲存失敗: ' + error.message);
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

                    // 更新配置
                    this.config.sensitiveWords = sensitiveWords;

                    // 保存配置
                    await this.saveConfig();
                    this.showAlert('success', '敏感詞設定已儲存');
                } catch (error) {
                    console.error('儲存敏感詞設定失敗:', error);
                    this.showAlert('error', '儲存失敗: ' + error.message);
                }
            });
        }

        // 規則儲存按鈕事件
        document.querySelectorAll('.save-rules').forEach(button => {
            button.addEventListener('click', async (event) => {
                try {
                    const panel = event.target.closest('.tab-pane').id;
                    const rulesList = event.target.closest('.card').querySelector('.rule-list');
                    const rules = Array.from(rulesList.querySelectorAll('tr')).map(row => ({
                        keywords: row.querySelector('.rule-keyword').value,
                        response: row.querySelector('.rule-response').value,
                        ratio: parseInt(row.querySelector('.rule-ratio').value) || 0,
                        style: row.querySelector('.rule-style').value
                    }));

                    // 確保配置結構存在
                    if (!this.config.categories) {
                        this.config.categories = {};
                    }
                    if (!this.config.categories[panel]) {
                        this.config.categories[panel] = {};
                    }

                    // 更新配置
                    this.config.categories[panel].rules = rules;

                    // 保存配置
                    await this.saveConfig();
                    this.showAlert('success', '規則設定已儲存');
                } catch (error) {
                    console.error('儲存規則設定失敗:', error);
                    this.showAlert('error', '儲存失敗: ' + error.message);
                }
            });
        });

        // 新增規則按鈕事件
        document.querySelectorAll('.add-rule').forEach(button => {
            button.addEventListener('click', (event) => {
                try {
                    const rulesList = event.target.closest('.card').querySelector('.rule-list');
                    const newRow = document.createElement('tr');
                    newRow.innerHTML = `
                        <td><input type="text" class="form-control rule-keyword" value="" /></td>
                        <td><input type="text" class="form-control rule-response" value="" /></td>
                        <td>
                            <select class="form-select rule-ratio">
                                <option value="0">0%</option>
                                <option value="50">50%</option>
                                <option value="100">100%</option>
                            </select>
                        </td>
                        <td>
                            <select class="form-select rule-style">
                                <option value="專業">專業</option>
                                <option value="親切">親切</option>
                                <option value="少女">少女</option>
                                <option value="幽默">幽默</option>
                            </select>
                        </td>
                        <td>
                            <button class="btn btn-danger btn-sm delete-rule">刪除</button>
                        </td>
                    `;

                    // 添加刪除按鈕事件
                    const deleteButton = newRow.querySelector('.delete-rule');
                    this.addDeleteRuleEvent(deleteButton);

                    rulesList.appendChild(newRow);
                } catch (error) {
                    console.error('新增規則失敗:', error);
                    this.showAlert('error', '新增規則失敗: ' + error.message);
                }
            });
        });

        // 已存在規則的刪除按鈕事件
        document.querySelectorAll('.delete-rule').forEach(button => {
            this.addDeleteRuleEvent(button);
        });

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

    addDeleteRuleEvent(button) {
        const self = this;
        button.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            try {
                console.log('點擊刪除按鈕');
                
                // 顯示確認對話框
                if (!window.confirm('確定要刪除這條規則嗎？')) {
                    console.log('取消刪除');
                    return;
                }
                
                console.log('確認刪除');
                const row = event.target.closest('tr');
                const panel = event.target.closest('.tab-pane').id;
                const rulesList = event.target.closest('.rule-list');
                
                // 刪除規則行
                row.remove();
                console.log('規則行已刪除');

                // 獲取當前規則列表
                const rules = Array.from(rulesList.querySelectorAll('tr')).map(row => ({
                    keywords: row.querySelector('.rule-keyword').value,
                    response: row.querySelector('.rule-response').value,
                    ratio: parseInt(row.querySelector('.rule-ratio').value) || 0,
                    style: row.querySelector('.rule-style').value
                }));
                console.log('當前規則列表:', rules);

                // 確保配置結構存在
                if (!self.config.categories) {
                    self.config.categories = {};
                }
                if (!self.config.categories[panel]) {
                    self.config.categories[panel] = {};
                }

                // 更新配置
                self.config.categories[panel].rules = rules;

                // 保存配置
                await self.saveConfig();
                self.showAlert('success', '規則已刪除');
            } catch (error) {
                console.error('刪除規則失敗:', error);
                self.showAlert('error', '刪除規則失敗: ' + error.message);
            }
        });
    }

    async saveConfig() {
        console.log('開始保存配置...');
        console.log('配置內容:', this.config);
        
        try {
            await api.saveConfig(this.currentBot, this.config);
            console.log('配置保存成功');
        } catch (error) {
            console.error('保存配置失敗:', error);
            throw error;
        }
    }

    async testMessage(message) {
        try {
            console.log('開始測試訊息:', message);
            
            // 獲取當前活動的標籤頁
            const activeTab = document.querySelector('.tab-pane.active');
            if (!activeTab) {
                throw new Error('找不到當前活動的標籤頁');
            }
            
            // 顯示載入中
            const spinner = document.getElementById('loading-spinner');
            spinner.classList.remove('d-none');
            
            // 清空並隱藏結果區域
            const resultWrapper = activeTab.querySelector('.test-result-wrapper');
            resultWrapper.classList.remove('show');
            
            // 發送測試請求
            const result = await api.testMessage(this.currentBot, message);
            console.log('測試結果:', result);
            
            // 更新結果顯示
            activeTab.querySelector('.test-category').textContent = this.categoryMap[result.category] || result.category;
            activeTab.querySelector('.test-confidence').textContent = `${Math.round(result.confidence * 100)}%`;
            activeTab.querySelector('.test-intent').textContent = result.intent;
            activeTab.querySelector('.test-keywords').innerHTML = result.keywords.map(keyword => 
                `<span class="badge bg-secondary me-1">${keyword}</span>`
            ).join('');
            activeTab.querySelector('.test-sensitive').textContent = result.isSensitive ? '是' : '否';
            activeTab.querySelector('.test-sensitive').className = `test-sensitive badge ${result.isSensitive ? 'bg-danger' : 'bg-success'}`;
            activeTab.querySelector('.test-response').textContent = result.generatedResponse;
            
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
            
            // 更新所有歷史記錄列表
            document.querySelectorAll('.test-history-list').forEach(historyList => {
                this.renderHistory(historyList);
            });
            
        } catch (error) {
            console.error('添加歷史記錄失敗:', error);
        }
    }

    clearHistory() {
        try {
            // 清除 localStorage 中的歷史記錄
            localStorage.removeItem(this.HISTORY_KEY);
            
            // 更新所有歷史記錄列表
            document.querySelectorAll('.test-history-list').forEach(historyList => {
                this.renderHistory(historyList);
            });
            
            // 顯示成功訊息
            this.showAlert('success', '歷史記錄已清除');
            
        } catch (error) {
            console.error('清除歷史記錄失敗:', error);
            this.showAlert('error', '清除歷史記錄失敗: ' + error.message);
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

    renderHistory(historyList) {
        const history = this.loadHistory();
        historyList.innerHTML = '';
        
        history.forEach(item => {
            const historyItem = document.getElementById('history-item-template').content.cloneNode(true);
            
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
        let alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) {
            // 如果找不到警告容器，就創建一個
            alertContainer = document.createElement('div');
            alertContainer.id = 'alertContainer';
            alertContainer.className = 'sticky-top p-3 d-flex justify-content-center';
            alertContainer.style.zIndex = '1050';
            alertContainer.style.pointerEvents = 'none'; // 防止阻擋點擊
            document.body.insertBefore(alertContainer, document.body.firstChild);
        }

        // 清除所有現有的警告
        while (alertContainer.firstChild) {
            alertContainer.removeChild(alertContainer.firstChild);
        }

        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.role = 'alert';
        alert.style.minWidth = '300px';
        alert.style.maxWidth = '500px';
        alert.style.textAlign = 'center';
        alert.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        alert.style.pointerEvents = 'auto'; // 允許警告框可以點擊
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        alertContainer.appendChild(alert);

        // 確保警告容器在視窗可見範圍內
        const rect = alertContainer.getBoundingClientRect();
        if (rect.top < 0) {
            window.scrollTo({
                top: window.scrollY + rect.top - 20,
                behavior: 'smooth'
            });
        }

        // 5 秒後自動關閉
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 150);
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
