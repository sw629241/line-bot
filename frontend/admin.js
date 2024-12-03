// admin.js 已經不再需要大部分功能，因為已經移到了 ui.js 中
import { ui } from './ui.js';

// 初始化函數
export async function initAdmin() {
    console.log('初始化管理介面...');
    
    try {
        // 初始化 UI
        await ui.init();
        
        console.log('管理介面初始化完成');
    } catch (error) {
        console.error('管理介面初始化失敗:', error);
        throw error;
    }
}

// 在頁面載入時初始化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initAdmin();
    } catch (error) {
        console.error('初始化失敗:', error);
    }
});