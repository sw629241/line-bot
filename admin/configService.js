import { apiService } from './apiService.js';

class ConfigService {
    constructor() {
        this.config = null;
        this.initialized = false;
        this.currentBot = 'sxi-bot';
    }

    async init() {
        console.log('初始化配置服務...');
        try {
            await this.loadConfig();
            this.initialized = true;
            console.log('配置服務初始化完成');
        } catch (error) {
            console.error('配置服務初始化失敗:', error);
            throw error;
        }
    }

    async loadConfig() {
        try {
            // 如果已經有緩存的配置，直接返回
            if (this.config && this.initialized) {
                console.log('使用緩存的配置');
                return this.config;
            }

            // 嘗試從 API 獲取配置
            try {
                this.config = await apiService.getConfig(this.currentBot);
                console.log('從 API 載入配置成功:', this.config);
                return this.config;
            } catch (error) {
                console.error('從 API 載入配置失敗，使用預設配置:', error);
                // 使用預設配置
                this.config = {
                    categories: {
                        products: { 
                            systemPrompt: '不確定的問題，一律回答:"已通知小編進行回覆，請稍等。"',
                            examples: '',
                            rules: []
                        },
                        prices: {
                            systemPrompt: '不確定的問題，一律回答:"已通知小編進行回覆，請稍等。"',
                            examples: '',
                            rules: []
                        },
                        shipping: {
                            systemPrompt: '不確定的問題，一律回答:"已通知小編進行回覆，請稍等。"',
                            examples: '',
                            rules: []
                        },
                        promotions: {
                            systemPrompt: '不確定的問題，一律回答:"已通知小編進行回覆，請稍等。"',
                            examples: '',
                            rules: []
                        },
                        chat: {
                            systemPrompt: '不確定的問題，一律回答:"已通知小編進行回覆，請稍等。"',
                            examples: '',
                            rules: []
                        },
                        sensitive: {
                            systemPrompt: '不確定的問題，一律回答:"已通知小編進行回覆，請稍等。"',
                            examples: '',
                            rules: []
                        }
                    }
                };
                return this.config;
            }
        } catch (error) {
            console.error('載入配置時發生未預期的錯誤:', error);
            throw error;
        }
    }

    async saveConfig(config) {
        try {
            // 驗證配置格式
            if (!config || !config.categories) {
                throw new Error('Invalid configuration format');
            }

            // 檢查必要的類別是否存在
            const requiredCategories = ['products', 'prices', 'shipping', 'promotions', 'chat', 'sensitive'];
            for (const category of requiredCategories) {
                if (!config.categories[category]) {
                    config.categories[category] = { systemPrompt: '', examples: '', rules: [] };
                }
            }

            // 保存配置
            await apiService.saveConfig(config);
            this.config = config;
            console.log('保存配置成功');
        } catch (error) {
            console.error('保存配置失敗:', error);
            throw error;
        }
    }

    async loadGPTSettings(containerId) {
        try {
            const category = containerId.replace('GptSettings', '').toLowerCase();
            const config = await this.loadConfig();
            const categoryConfig = config.categories[category] || { systemPrompt: '', examples: '' };

            const container = document.getElementById(containerId);
            if (container) {
                const promptTextarea = container.querySelector('.gpt-prompt');
                const examplesTextarea = container.querySelector('.gpt-examples');
                
                if (promptTextarea) {
                    promptTextarea.value = categoryConfig.systemPrompt;
                }
                if (examplesTextarea) {
                    examplesTextarea.value = categoryConfig.examples;
                }

                // 綁定保存按鈕事件
                const saveButton = container.querySelector('.save-gpt');
                if (saveButton) {
                    saveButton.addEventListener('click', async () => {
                        await this.saveGPTSettings(category);
                    });
                }
            }
        } catch (error) {
            console.error('載入 GPT 設置失敗:', error);
            throw error;
        }
    }

    async saveGPTSettings(category) {
        try {
            const container = document.getElementById(`${category}GptSettings`);
            if (!container) {
                throw new Error(`找不到類別 ${category} 的設置容器`);
            }

            const promptElement = container.querySelector('.gpt-prompt');
            const examplesElement = container.querySelector('.gpt-examples');
            
            if (!promptElement || !examplesElement) {
                throw new Error(`找不到必要的輸入欄位`);
            }

            const systemPrompt = promptElement.value;
            const examples = examplesElement.value;

            // 確保配置物件結構正確
            if (!this.config) {
                this.config = { categories: {} };
            }
            if (!this.config.categories) {
                this.config.categories = {};
            }
            if (!this.config.categories[category]) {
                this.config.categories[category] = {};
            }

            // 更新配置
            this.config.categories[category].systemPrompt = systemPrompt;
            this.config.categories[category].examples = examples;

            // 保存到服務器
            await this.saveConfig(this.config);
            this.showAlert('success', 'GPT 設置已保存');
            console.log(`${category} 類別的 GPT 設置已保存`);
        } catch (error) {
            console.error('保存 GPT 設置失敗:', error);
            this.showAlert('danger', '保存 GPT 設置失敗: ' + error.message);
            throw error;
        }
    }

    async loadReplyRules(containerId) {
        try {
            const category = containerId.replace('ReplyRules', '').toLowerCase();
            const config = await this.loadConfig();
            const categoryConfig = config.categories[category] || { rules: [] };

            const container = document.getElementById(containerId);
            if (container) {
                const rulesList = container.querySelector('.rule-list');
                if (rulesList) {
                    // 清空現有規則
                    rulesList.innerHTML = '';
                    
                    // 重新渲染規則列表
                    rulesList.innerHTML = categoryConfig.rules.map((rule, index) => `
                        <tr class="rule-item" data-index="${index}">
                            <td><input type="text" class="form-control rule-keywords" value="${rule.keywords || ''}"></td>
                            <td><textarea class="form-control rule-response" rows="2">${rule.response || ''}</textarea></td>
                            <td>
                                <select class="form-control rule-ratio">
                                    <option value="0" ${rule.ratio === "0" ? 'selected' : ''}>0%</option>
                                    <option value="50" ${rule.ratio === "50" ? 'selected' : ''}>50%</option>
                                    <option value="100" ${rule.ratio === "100" ? 'selected' : ''}>100%</option>
                                </select>
                            </td>
                            <td>
                                <select class="form-control rule-style">
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

                    // 綁定新增規則按鈕
                    const addButton = container.querySelector('.add-rule');
                    if (addButton) {
                        // 移除舊的事件監聽器
                        const newAddButton = addButton.cloneNode(true);
                        addButton.parentNode.replaceChild(newAddButton, addButton);
                        
                        newAddButton.addEventListener('click', () => {
                            const newRule = document.createElement('tr');
                            newRule.className = 'rule-item';
                            newRule.setAttribute('data-index', rulesList.children.length);
                            newRule.innerHTML = `
                                <td><input type="text" class="form-control rule-keywords" value=""></td>
                                <td><textarea class="form-control rule-response" rows="2"></textarea></td>
                                <td>
                                    <select class="form-control rule-ratio">
                                        <option value="0">0%</option>
                                        <option value="50" selected>50%</option>
                                        <option value="100">100%</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="form-control rule-style">
                                        <option value="專業">專業</option>
                                        <option value="親切" selected>親切</option>
                                        <option value="少女">少女</option>
                                        <option value="幽默">幽默</option>
                                    </select>
                                </td>
                                <td>
                                    <button class="btn btn-danger btn-sm delete-rule">刪除</button>
                                </td>
                            `;
                            rulesList.appendChild(newRule);

                            // 綁定新規則的刪除按鈕
                            newRule.querySelector('.delete-rule').addEventListener('click', async () => {
                                const index = parseInt(newRule.getAttribute('data-index'));
                                if (await this.deleteRule(category, index)) {
                                    newRule.remove();
                                }
                            });
                        });
                    }

                    // 重新綁定所有刪除按鈕
                    rulesList.querySelectorAll('.delete-rule').forEach(button => {
                        // 移除舊的事件監聽器
                        const newButton = button.cloneNode(true);
                        button.parentNode.replaceChild(newButton, button);
                        
                        newButton.addEventListener('click', async () => {
                            const ruleItem = newButton.closest('.rule-item');
                            const index = parseInt(ruleItem.getAttribute('data-index'));
                            if (await this.deleteRule(category, index)) {
                                ruleItem.remove();
                            }
                        });
                    });

                    // 綁定保存按鈕
                    const saveButton = container.querySelector('.save-rules');
                    if (saveButton) {
                        // 移除舊的事件監聽器
                        const newSaveButton = saveButton.cloneNode(true);
                        saveButton.parentNode.replaceChild(newSaveButton, saveButton);
                        
                        newSaveButton.addEventListener('click', async () => {
                            try {
                                await this.saveAllRules(category);
                                this.showAlert('success', '規則已保存');
                            } catch (error) {
                                this.showAlert('danger', '保存規則失敗: ' + error.message);
                            }
                        });
                    }
                }
            }
        } catch (error) {
            console.error('載入回覆規則失敗:', error);
            this.showAlert('danger', '載入回覆規則失敗: ' + error.message);
            throw error;
        }
    }

    async saveAllRules(category) {
        try {
            const container = document.getElementById(`${category}ReplyRules`);
            const rules = [];
            container.querySelectorAll('.rule-item').forEach(item => {
                rules.push({
                    keywords: item.querySelector('.rule-keywords').value,
                    response: item.querySelector('.rule-response').value,
                    ratio: parseInt(item.querySelector('.rule-ratio').value) || 50,
                    style: item.querySelector('.rule-style').value || 'friendly'
                });
            });

            // 更新配置
            if (!this.config.categories[category]) {
                this.config.categories[category] = {};
            }
            this.config.categories[category].rules = rules;

            // 保存到服務器
            await this.saveConfig(this.config);
            console.log('規則已保存');
        } catch (error) {
            console.error('保存規則失敗:', error);
            throw error;
        }
    }

    bindRuleEvents(container, category) {
        // 新增規則
        container.querySelector('.add-rule').addEventListener('click', () => {
            const rulesList = container.querySelector('.rules-list');
            const newIndex = rulesList.children.length;
            
            const newRule = document.createElement('div');
            newRule.className = 'card mb-3 rule-item';
            newRule.setAttribute('data-index', newIndex);
            newRule.innerHTML = `
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-label">關鍵字</label>
                        <input type="text" class="form-control rule-keywords" value="">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">回覆</label>
                        <textarea class="form-control rule-response" rows="3"></textarea>
                    </div>
                    <button class="btn btn-danger delete-rule">刪除</button>
                </div>
            `;
            
            rulesList.appendChild(newRule);
            
            // 綁定刪除按鈕
            newRule.querySelector('.delete-rule').addEventListener('click', () => {
                newRule.remove();
            });
        });

        // 保存所有規則
        container.querySelector('.save-all-rules').addEventListener('click', async () => {
            await this.saveAllRules(category);
        });

        // 綁定現有規則的刪除按鈕
        container.querySelectorAll('.delete-rule').forEach(button => {
            button.addEventListener('click', () => {
                button.closest('.rule-item').remove();
            });
        });
    }

    getConfig() {
        return this.config;
    }

    isInitialized() {
        return this.initialized;
    }

    setCurrentBot(botId) {
        this.currentBot = botId;
        this.config = null;  // 清除緩存，強制重新載入
    }

    async getCurrentConfig() {
        try {
            if (!this.config || !this.initialized) {
                await this.loadConfig();
            }
            return this.config;
        } catch (error) {
            console.error('獲取當前配置失敗:', error);
            throw error;
        }
    }

    showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
        alertDiv.style.zIndex = '9999';
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // 移除舊的提示（如果有的話）
        const oldAlerts = document.querySelectorAll('.alert');
        oldAlerts.forEach(alert => alert.remove());
        
        // 將提示添加到 body
        document.body.appendChild(alertDiv);
        
        // 5秒後自動關閉
        setTimeout(() => {
            if (document.body.contains(alertDiv)) {
                alertDiv.remove();
            }
        }, 5000);
    }

    async deleteRule(category, index) {
        try {
            // 從配置中刪除規則
            if (!this.config.categories[category]) {
                throw new Error('找不到指定的類別');
            }
            
            this.config.categories[category].rules.splice(index, 1);
            
            // 保存到服務器
            await this.saveConfig(this.config);
            
            // 顯示成功提示
            this.showAlert('success', '規則已刪除');
            
            return true;
        } catch (error) {
            console.error('刪除規則失敗:', error);
            this.showAlert('danger', '刪除規則失敗: ' + error.message);
            return false;
        }
    }
}

export const configService = new ConfigService();