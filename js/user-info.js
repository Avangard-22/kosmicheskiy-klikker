// js/user-info.js
(function() {
'use strict';

window.updateUserInfo = function() {
    const userNameEl = document.getElementById('userNameDisplay');
    const userAvatarEl = document.getElementById('userAvatar');
    
    if (!userNameEl) {
        console.warn('⚠️ userNameDisplay element not found');
        return;
    }
    
    // Получаем данные
    const username = window.telegramUsername || 'Anonymous';
    const avatarUrl = window.getUserAvatar ? window.getUserAvatar() : null;
    const userId = window.getUserId ? window.getUserId() : null;
    
    console.log('👤 [USER] Updating user info:');
    console.log('👤 [USER] username:', username);
    console.log('👤 [USER] userId:', userId);
    console.log('👤 [USER] avatar:', avatarUrl);
    
    // Обновляем имя
    if (userNameEl) {
        userNameEl.textContent = username;
    }
    
    // Обновляем аватарку
    if (userAvatarEl && avatarUrl) {
        userAvatarEl.src = avatarUrl;
        userAvatarEl.style.display = 'block';
        userAvatarEl.onerror = function() {
            this.style.display = 'none';
        };
    } else if (userAvatarEl) {
        userAvatarEl.style.display = 'none';
    }
};

// Автоматическое обновление при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.updateUserInfo) {
                window.updateUserInfo();
            }
        }, 1500);
    });
} else {
    setTimeout(() => {
        if (window.updateUserInfo) {
            window.updateUserInfo();
        }
    }, 1500);
}
})();
