import { ui } from './ui.js';
import { configService } from './configService.js';
import { apiService } from './apiService.js';
import { messageService } from './messageService.js';

// 初始化函數
export async function initAdmin() {
    console.log('初始化管理介面...');
    
    try {
        // 初始化服務
        await Promise.all([
            configService.init(),
            messageService.init(),
            apiService.init()
        ]);

        // 綁定事件監聽器
        bindEventListeners();
        
        // 載入初始面板的數據
        await loadPanelData('products');
        
        console.log('管理介面初始化完成');
    } catch (error) {
        console.error('管理介面初始化失敗:', error);
        throw error;
    }
}

function bindEventListeners() {
    // 監聽標籤切換事件
    const tabList = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabList.forEach(tab => {
        tab.addEventListener('shown.bs.tab', async (event) => {
            const targetId = event.target.getAttribute('data-bs-target').substring(1);
            console.log(`切換到標籤: ${targetId}`);
            await loadPanelData(targetId);
        });
    });

    // 監聽所有測試按鈕
    document.querySelectorAll('.test-button').forEach(button => {
        button.addEventListener('click', async (event) => {
            const panel = event.target.closest('.card-body');
            const input = panel.querySelector('.test-input');
            const result = panel.querySelector('.test-result');
            
            if (!input || !result) return;
            
            try {
                result.textContent = '處理中...';
                const message = input.value.trim();
                if (!message) {
                    result.textContent = '請輸入測試訊息';
                    return;
                }

                // 發送測試請求
                const response = await messageService.testMessage(message);

                // 更新結果顯示
                result.innerHTML = `
                    <div class="test-result-content">
                        <div class="result-item">
                            <span class="result-label">類別：</span>
                            <span class="result-value">${response.category || '未分類'}</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">意圖：</span>
                            <span class="result-value">${response.intent || '未知'}</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">信心度：</span>
                            <span class="result-value">${response.confidence ? (response.confidence * 100).toFixed(1) : 0}%</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">關鍵詞：</span>
                            <span class="result-value">${(response.matchedKeywords || []).join(', ') || '無'}</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">動態比例：</span>
                            <span class="result-value">${response.dynamicRatio || 0}%</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">語言風格：</span>
                            <span class="result-value">${response.style || 'standard'}</span>
                        </div>
                        <div class="result-item content-block">
                            <span class="result-label">生成內容：</span>
                            <div class="result-content">${response.generatedContent ? response.generatedContent.replace(/\n/g, '<br>') : '無生成內容'}</div>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error('測試失敗:', error);
                result.innerHTML = `
                    <div class="alert alert-danger">
                        測試失敗: ${error.message}
                    </div>
                `;
            }
        });
    });
}

async function loadPanelData(panelId) {
    try {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        // 每次切換標籤時都重置面板
        panel.querySelectorAll('.rule-list').forEach(list => {
            list.innerHTML = '';
        });

        const gptSettingsContainer = panel.querySelector('.gpt-settings-container');
        const replyRulesContainer = panel.querySelector('.reply-rules-container');

        if (gptSettingsContainer) {
            await configService.loadGPTSettings(gptSettingsContainer.id);
        }
        if (replyRulesContainer) {
            await configService.loadReplyRules(replyRulesContainer.id);
        }
    } catch (error) {
        console.error(`載入面板 ${panelId} 的數據失敗:`, error);
    }
}

async function ensureComponentsLoaded(panelId) {
    try {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        // 初始化面板中的所有組件
        const components = [
            ...panel.querySelectorAll('.gpt-settings-container'),
            ...panel.querySelectorAll('.reply-rules-container'),
            ...panel.querySelectorAll('.test-area-container')
        ];

        for (const component of components) {
            await initializeComponent(component, component.className);
        }
    } catch (error) {
        console.error(`載入面板 ${panelId} 的組件失敗:`, error);
    }
}

async function initializeComponent(container, componentType) {
    try {
        // 根據組件類型初始化
        switch (componentType) {
            case 'gpt-settings-container':
                await configService.loadGPTSettings(container.id);
                break;
            case 'reply-rules-container':
                await configService.loadReplyRules(container.id);
                break;
            case 'test-area-container':
                // 使用 ui.js 中的測試區域初始化功能
                await ui.initTestArea(container);
                break;
            default:
                console.warn(`未知的組件類型: ${componentType}`);
        }
    } catch (error) {
        console.error(`初始化組件 ${container.id} 失敗:`, error);
    }
}
