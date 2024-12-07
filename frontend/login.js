// 登入驗證
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const mainContent = document.getElementById('mainContent');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const username = document.getElementById('username');
    const password = document.getElementById('password');

    // 檢查是否已登入
    function checkAuth() {
        const isAuthenticated = sessionStorage.getItem('isAuthenticated');
        if (isAuthenticated === 'true') {
            loginForm.classList.add('d-none');
            mainContent.classList.remove('d-none');
        } else {
            loginForm.classList.remove('d-none');
            mainContent.classList.add('d-none');
        }
    }

    // 初始檢查登入狀態
    checkAuth();

    // 登入處理
    loginBtn.addEventListener('click', function() {
        if (username.value === 'bot' && password.value === 'zxc241zxc') {
            sessionStorage.setItem('isAuthenticated', 'true');
            checkAuth();
            // 清空輸入
            username.value = '';
            password.value = '';
        } else {
            alert('帳號或密碼錯誤');
        }
    });

    // 登出處理
    logoutBtn.addEventListener('click', function() {
        sessionStorage.removeItem('isAuthenticated');
        checkAuth();
    });

    // Enter 鍵登入
    password.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });
});
