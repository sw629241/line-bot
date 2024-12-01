// 顯示提示訊息
function showAlert(type, message) {
    // 移除所有現有的提示訊息
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    // 3秒後自動關閉
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// 更新界面配置
function updateUIWithConfig(category, config) {
    console.log('更新界面:', category, config);
    
    // 更新 GPT 設定
    const promptElement = document.getElementById(`${category}Prompt`);
    const examplesElement = document.getElementById(`${category}Examples`);
    
    // 確保有預設值，避免 undefined
    if (promptElement) {
        const promptValue = (config.systemPrompt !== undefined && config.systemPrompt !== null) ? config.systemPrompt : '';
        promptElement.value = promptValue;
    }
    if (examplesElement) {
        const examplesValue = (config.examples !== undefined && config.examples !== null) ? config.examples : '';
        examplesElement.value = examplesValue;
    }
    
    // 更新規則列表
    updateRulesList(category, config.rules || []);
}

// 更新規則列表
function updateRulesList(category, rules) {
    const tbody = document.getElementById(`${category}RuleList`);
    if (!tbody) return;

    tbody.innerHTML = rules.map((rule, index) => `
        <tr data-index="${index}">
            <td>
                <input type="text" class="form-control form-control-sm" 
                    value="${rule.keywords || ''}"
                    onchange="window.admin.updateRule('${category}', ${index}, 'keywords', this.value)">
            </td>
            <td>
                <textarea class="form-control form-control-sm" rows="2"
                    onchange="window.admin.updateRule('${category}', ${index}, 'response', this.value)">${rule.response || ''}</textarea>
            </td>
            <td>
                <input type="number" class="form-control form-control-sm" min="0" max="100" step="50"
                    value="${rule.ratio !== undefined ? rule.ratio : 50}"
                    onchange="window.admin.updateRule('${category}', ${index}, 'ratio', this.value === '' ? 50 : parseInt(this.value))">
            </td>
            <td>
                <select class="form-select form-select-sm"
                    onchange="window.admin.updateRule('${category}', ${index}, 'style', this.value)">
                    ${generateStyleOptions(rule.style)}
                </select>
            </td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="window.admin.deleteRule('${category}', ${index})">
                    刪除
                </button>
            </td>
        </tr>
    `).join('');
}

// 生成語言風格選項
function generateStyleOptions(selectedStyle) {
    const styles = [
        { value: 'professional', text: '專業' },
        { value: 'friendly', text: '親切' },
        { value: 'cute', text: '少女' },
        { value: 'humorous', text: '幽默' }
    ];

    return styles.map(style => `
        <option value="${style.value}" ${style.value === selectedStyle ? 'selected' : ''}>
            ${style.text}
        </option>
    `).join('');
}

// 導出 UI 函數
window.ui = {
    showAlert,
    updateUIWithConfig,
    updateRulesList
};