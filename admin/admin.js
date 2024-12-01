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
                // 初始化測試區域
                break;
            default:
                console.warn(`未知的組件類型: ${componentType}`);
        }
    } catch (error) {
        console.error(`初始化組件 ${container.id} 失敗:`, error);
    }
}
