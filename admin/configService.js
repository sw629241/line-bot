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
            this.config = await apiService.getConfig(this.currentBot);
            console.log('載入配置成功:', this.config);
            return this.config;
        } catch (error) {
            console.error('載入配置失敗:', error);
            this.config = {
                categories: {
                    product: { systemPrompt: '', examples: '', rules: [] },
                    price: { systemPrompt: '', examples: '', rules: [] },
                    shipping: { systemPrompt: '', examples: '', rules: [] },
                    promotion: { systemPrompt: '', examples: '', rules: [] },
                    chat: { systemPrompt: '', examples: '', rules: [] },
                    sensitive: { systemPrompt: '', examples: '', rules: [] }
                }
            };
            return this.config;
        }
    }

    async saveConfig(config) {
        try {
            // 驗證配置格式
            if (!config || !config.categories) {
                throw new Error('Invalid configuration format');
            }

            // 檢查必要的類別是否存在
            const requiredCategories = ['product', 'price', 'shipping', 'promotion', 'chat', 'sensitive'];
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
            console.log(`${category} 類別的 GPT 設置已保存`);
        } catch (error) {
            console.error('保存 GPT 設置失敗:', error);
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
                    rulesList.innerHTML = categoryConfig.rules.map((rule, index) => `
                        <tr class="rule-item" data-index="${index}">
                            <td><input type="text" class="form-control rule-keywords" value="${rule.keywords || ''}"></td>
                            <td><textarea class="form-control rule-response" rows="2">${rule.response || ''}</textarea></td>
                            <td><input type="text" class="form-control rule-ratio" value="${rule.ratio || ''}"></td>
                            <td><input type="text" class="form-control rule-style" value="${rule.style || ''}"></td>
                            <td>
                                <button class="btn btn-danger btn-sm delete-rule">刪除</button>
                            </td>
                        </tr>
                    `).join('');

                    // 重新綁定刪除按鈕事件
                    rulesList.querySelectorAll('.delete-rule').forEach(button => {
                        button.addEventListener('click', () => {
                            button.closest('.rule-item').remove();
                        });
                    });

                    // 綁定新增規則按鈕
                    const addButton = container.querySelector('.add-rule');
                    if (addButton) {
                        addButton.addEventListener('click', () => {
                            const newRule = document.createElement('tr');
                            newRule.className = 'rule-item';
                            newRule.setAttribute('data-index', rulesList.children.length);
                            newRule.innerHTML = `
                                <td><input type="text" class="form-control rule-keywords" value=""></td>
                                <td><textarea class="form-control rule-response" rows="2"></textarea></td>
                                <td><input type="text" class="form-control rule-ratio" value=""></td>
                                <td><input type="text" class="form-control rule-style" value=""></td>
                                <td>
                                    <button class="btn btn-danger btn-sm delete-rule">刪除</button>
                                </td>
                            `;
                            rulesList.appendChild(newRule);

                            // 綁定新規則的刪除按鈕
                            newRule.querySelector('.delete-rule').addEventListener('click', () => {
                                newRule.remove();
                            });
                        });
                    }

                    // 綁定保存按鈕
                    const saveButton = container.querySelector('.save-rules');
                    if (saveButton) {
                        saveButton.addEventListener('click', async () => {
                            await this.saveAllRules(category);
                        });
                    }
                }
            }
        } catch (error) {
            console.error('載入回覆規則失敗:', error);
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
                    ratio: item.querySelector('.rule-ratio').value,
                    style: item.querySelector('.rule-style').value
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
    }
}

export const configService = new ConfigService();