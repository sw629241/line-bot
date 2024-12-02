import { configService } from './configService.js';
import { messageService } from './messageService.js';

class UI {
    constructor() {
        this.currentBot = 'sxi-bot';
        this.currentCategory = 'products';
        this.categoryConfigs = {};
        
        // 確保 window.ui 存在
        window.ui = this;
    }

    async init() {
        try {
            console.log('初始化 UI...');
            
            // 等待 DOM 載入完成
            if (document.readyState === 'loading') {
                await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
            }
            
            await this.loadInitialConfig();
            await this.initializeComponents();
            console.log('UI 初始化完成');
        } catch (error) {
            console.error('UI 初始化失敗:', error);
            throw error;
        }
    }

    async loadInitialConfig() {
        try {
            const config = await configService.loadConfig();
            if (config && config.categories) {
                this.categoryConfigs = config.categories;
            }
        } catch (error) {
            console.error('載入初始配置失敗:', error);
            throw error;
        }
    }

    async initializeComponents() {
        try {
            // 初始化所有 GPT 設置容器
            document.querySelectorAll('.gpt-settings-container').forEach(async container => {
                await this.initGptSettings(container);
            });
            
            // 初始化所有回覆規則容器
            document.querySelectorAll('.reply-rules-container').forEach(async container => {
                await this.initReplyRules(container);
            });
            
            // 初始化所有測試區域容器
            document.querySelectorAll('.test-area-container').forEach(async container => {
                await this.initTestArea(container);
            });
        } catch (error) {
            console.error('初始化組件失敗:', error);
            throw error;
        }
    }

    async initGptSettings(container) {
        try {
            const category = this.getCurrentCategory(container);
            const config = this.categoryConfigs[category] || { systemPrompt: '', examples: '' };
            
            const template = `
                <div class="mb-3">
                    <label for="${category}Prompt" class="form-label">系統提示詞</label>
                    <textarea class="form-control" id="${category}Prompt" rows="5">${config.systemPrompt}</textarea>
                </div>
                <div class="mb-3">
                    <label for="${category}Examples" class="form-label">範例對話</label>
                    <textarea class="form-control" id="${category}Examples" rows="5">${config.examples}</textarea>
                </div>
                <button class="btn btn-primary save-gpt-settings">保存設置</button>
            `;
            
            container.innerHTML = template;
            
            // 綁定保存按鈕事件
            container.querySelector('.save-gpt-settings').addEventListener('click', async () => {
                await this.saveGPTSettings(category);
            });
        } catch (error) {
            console.error('初始化 GPT 設置失敗:', error);
            throw error;
        }
    }

    async initReplyRules(container) {
        try {
            const category = this.getCurrentCategory(container);
            const config = this.categoryConfigs[category] || { rules: [] };
            
            const template = `
                <div class="mb-3">
                    <button class="btn btn-success add-rule">新增規則</button>
                    <button class="btn btn-primary save-all-rules">保存所有規則</button>
                </div>
                <div class="rules-list"></div>
            `;
            
            container.innerHTML = template;
            
            // 更新規則列表
            this.updateRulesList(category, config.rules || []);
            
            // 綁定按鈕事件
            container.querySelector('.add-rule').addEventListener('click', () => {
                this.addNewRule(category);
            });
            
            container.querySelector('.save-all-rules').addEventListener('click', async () => {
                await this.saveAllRules(category);
            });
        } catch (error) {
            console.error('初始化回覆規則失敗:', error);
            throw error;
        }
    }

    async initTestArea(container) {
        try {
            const category = this.getCurrentCategory(container);
            
            const template = `
                <div class="mb-3">
                    <label for="${category}Test" class="form-label">測試輸入</label>
                    <textarea class="form-control" id="${category}Test" rows="3"></textarea>
                </div>
                <div class="mb-3">
                    <button class="btn btn-primary test-button">測試</button>
                </div>
                <div class="mb-3">
                    <label for="${category}TestResult" class="form-label">測試結果</label>
                    <textarea class="form-control" id="${category}TestResult" rows="5" readonly></textarea>
                </div>
            `;
            
            container.innerHTML = template;
            
            // 綁定測試按鈕事件
            container.querySelector('.test-button').addEventListener('click', async () => {
                await this.testResponse(category);
            });
        } catch (error) {
            console.error('初始化測試區域失敗:', error);
            throw error;
        }
    }

    getCurrentCategory(container) {
        const panel = container.closest('.tab-pane');
        return panel ? panel.id : this.currentCategory;
    }

    updateRulesList(category, rules) {
        const container = document.querySelector(`#${category} .rules-list`);
        if (!container) return;
        
        const rulesHtml = rules.map((rule, index) => `
            <div class="card mb-3 rule-card" data-index="${index}">
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-label">關鍵字</label>
                        <input type="text" class="form-control rule-keywords" value="${rule.keywords || ''}" />
                    </div>
                    <div class="mb-3">
                        <label class="form-label">回覆</label>
                        <textarea class="form-control rule-response" rows="3">${rule.response || ''}</textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">動態生成比例</label>
                        <select class="form-control rule-ratio">
                            <option value="0" ${rule.ratio === 0 || rule.ratio === "0" ? 'selected' : ''}>0%</option>
                            <option value="50" ${rule.ratio === 50 || rule.ratio === "50" ? 'selected' : ''}>50%</option>
                            <option value="100" ${rule.ratio === 100 || rule.ratio === "100" ? 'selected' : ''}>100%</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">風格</label>
                        <select class="form-control rule-style">
                            <option value="專業" ${rule.style === '專業' ? 'selected' : ''}>專業</option>
                            <option value="親切" ${rule.style === '親切' ? 'selected' : ''}>親切</option>
                            <option value="少女" ${rule.style === '少女' ? 'selected' : ''}>少女</option>
                            <option value="幽默" ${rule.style === '幽默' ? 'selected' : ''}>幽默</option>
                        </select>
                    </div>
                    <button class="btn btn-danger delete-rule">刪除</button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = rulesHtml;
        
        // 綁定規則卡片事件
        container.querySelectorAll('.rule-card').forEach(card => {
            this.bindRuleCardEvents(card, category);
        });
    }

    bindRuleCardEvents(card, category) {
        const index = parseInt(card.dataset.index);
        
        // 監聽所有輸入欄位的變化
        card.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('change', event => {
                const field = event.target.classList[1].replace('rule-', '');
                let value = event.target.value;
                
                if (event.target.type === 'checkbox') {
                    value = event.target.checked;
                } else if (event.target.type === 'number') {
                    value = parseInt(value);
                }
                
                this.updateRule(category, index, field, value);
            });
        });
        
        // 監聽刪除按鈕
        card.querySelector('.delete-rule').addEventListener('click', () => {
            this.deleteRule(category, index);
        });
    }

    async addNewRule(category) {
        if (!this.categoryConfigs[category]) {
            this.categoryConfigs[category] = { rules: [] };
        }
        
        const newRule = {
            keywords: '',
            response: '',
            ratio: 50,
            style: 'default',
            enabled: true
        };
        
        this.categoryConfigs[category].rules.push(newRule);
        this.updateRulesList(category, this.categoryConfigs[category].rules);
    }

    async deleteRule(category, index) {
        if (this.categoryConfigs[category]?.rules?.[index]) {
            this.categoryConfigs[category].rules.splice(index, 1);
            this.updateRulesList(category, this.categoryConfigs[category].rules);
            await this.saveConfig();
            this.showAlert('success', '規則已刪除');
        }
    }

    updateRule(category, index, field, value) {
        if (!this.categoryConfigs[category]) {
            this.categoryConfigs[category] = { rules: [] };
        }
        
        if (!this.categoryConfigs[category].rules[index]) {
            this.categoryConfigs[category].rules[index] = {};
        }
        
        this.categoryConfigs[category].rules[index][field] = value;
    }

    async saveGPTSettings(category) {
        try {
            const promptElement = document.getElementById(`${category}Prompt`);
            const examplesElement = document.getElementById(`${category}Examples`);
            
            if (!this.categoryConfigs[category]) {
                this.categoryConfigs[category] = {};
            }
            
            this.categoryConfigs[category].systemPrompt = promptElement?.value || '';
            this.categoryConfigs[category].examples = examplesElement?.value || '';
            
            await this.saveConfig();
            this.showAlert('success', 'GPT 設置已保存');
        } catch (error) {
            console.error('保存 GPT 設置失敗:', error);
            this.showAlert('error', '保存失敗: ' + error.message);
        }
    }

    async saveAllRules(category) {
        try {
            const config = await this.configService.loadConfig();
            const rules = [];
            
            // 獲取規則列表容器
            const rulesList = document.querySelector(`#${category} .rules-list`);
            if (!rulesList) {
                throw new Error('找不到規則列表容器');
            }

            // 遍歷每個規則項目
            rulesList.querySelectorAll('.rule-card').forEach(item => {
                const keywords = item.querySelector('.rule-keywords').value.trim();
                const response = item.querySelector('.rule-response').value.trim();
                const ratio = item.querySelector('.rule-ratio').value;
                const style = item.querySelector('.rule-style').value;

                // 只保存有關鍵字和回覆的規則
                if (keywords && response) {
                    rules.push({
                        keywords,
                        response,
                        ratio: Number(ratio),
                        style
                    });
                }
            });

            // 更新配置
            config.categories[category].rules = rules;
            await this.configService.saveConfig(config);

            // 顯示成功提示
            this.showAlert('success', '規則已保存');
        } catch (error) {
            console.error('保存規則失敗:', error);
            this.showAlert('error', '保存規則失敗');
            throw error;
        }
    }

    async saveConfig() {
        const config = {
            categories: this.categoryConfigs
        };
        await configService.saveConfig(config);
    }

    async testResponse(category) {
        try {
            const input = document.getElementById(`${category}Test`).value;
            const result = await messageService.testGPTResponse(input, this.categoryConfigs[category]);
            document.getElementById(`${category}TestResult`).value = JSON.stringify(result, null, 2);
        } catch (error) {
            console.error('測試失敗:', error);
            this.showAlert('error', '測試失敗: ' + error.message);
        }
    }

    showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
}

export const ui = new UI();