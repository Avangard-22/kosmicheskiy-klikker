// js/telegram-integration.js
(function() {
'use strict';
const tg = window.Telegram?.WebApp;
const isTelegram = !!tg;
const CLOUD_API_URL = 'https://d5de5jfdv68j295hgj7a.y3q8o1jq.apigw.yandexcloud.net';

// === ШАГ 1: ОТЛАДОЧНОЕ ЛОГИРОВАНИЕ ===
console.log(' DEBUG: Telegram WebApp detected:', !!tg);
console.log('🔍 DEBUG: Telegram version:', tg?.version);
console.log('🔍 DEBUG: Platform:', tg?.platform);
console.log(' DEBUG: initData exists:', !!tg?.initData);
console.log('🔍 DEBUG: initData length:', tg?.initData?.length || 0);
console.log('🔍 DEBUG: initDataUnsafe:', tg?.initDataUnsafe);
console.log('🔍 DEBUG: isTelegramEnvironment:', isTelegram);

window.isTelegramEnvironment = isTelegram;
window.isCloudAvailable = false;

if (!isTelegram) {
    console.log('ℹ️ Telegram WebApp не обнаружен. Работа в режиме браузера.');
    
    window.telegramHaptic = {
        light: () => {}, medium: () => {}, heavy: () => {},
        success: () => {}, warning: () => {}, error: () => {},
        selectionChanged: () => {}
    };

    // Заглушка для облака
    window.telegramCloud = {
        isAvailable: false,
        saveProgress: async () => ({ success: false, error: 'Not in Telegram' }),
        loadProgress: async () => ({ success: false, error: 'Not in Telegram' }),
        getLeaderboard: async () => ({ success: false, data: [] })
    };
    return;
}

console.log('📱 Telegram WebApp detected. Initializing...');

tg.ready();
tg.expand();

// === ТЕМАТИЗАЦИЯ ===
function applyThemeColors() {
    const root = document.documentElement;
    if (tg.themeParams) {
        const colors = ['bg_color', 'text_color', 'hint_color', 'link_color',
                        'button_color', 'button_text_color', 'secondary_bg_color'];
        colors.forEach(key => {
            if (tg.themeParams[key]) {
                root.style.setProperty(`--tg-${key.replace('_', '-')}`, tg.themeParams[key]);
            }
        });
    }
}
applyThemeColors();
if (tg.onEvent) tg.onEvent('themeChanged', applyThemeColors);

// === HAPTIC FEEDBACK ===
window.telegramHaptic = {
    light: () => { try { tg.HapticFeedback.impactOccurred('light'); } catch(e) {} },
    medium: () => { try { tg.HapticFeedback.impactOccurred('medium'); } catch(e) {} },
    heavy: () => { try { tg.HapticFeedback.impactOccurred('heavy'); } catch(e) {} },
    success: () => { try { tg.HapticFeedback.notificationOccurred('success'); } catch(e) {} },
    warning: () => { try { tg.HapticFeedback.notificationOccurred('warning'); } catch(e) {} },
    error: () => { try { tg.HapticFeedback.notificationOccurred('error'); } catch(e) {} },
    selectionChanged: () => { try { tg.HapticFeedback.selectionChanged(); } catch(e) {} }
};

// === MAIN BUTTON ===
window.telegramMainButton = {
    show: (text, onClick) => {
        if (text) tg.MainButton.setText(text);
        if (onClick) { tg.MainButton.offClick(); tg.MainButton.onClick(onClick); }
        tg.MainButton.show();
    },
    hide: () => { tg.MainButton.hide(); tg.MainButton.offClick(); },
    setText: (text) => tg.MainButton.setText(text),
    setProgress: (isActive) => {
        if (isActive) tg.MainButton.showProgress();
        else tg.MainButton.hideProgress();
    }
};

// === BACK BUTTON ===
window.telegramBackButton = {
    show: (onClick) => {
        if (onClick) { tg.BackButton.offClick(); tg.BackButton.onClick(onClick); }
        tg.BackButton.show();
    },
    hide: () => { tg.BackButton.hide(); tg.BackButton.offClick(); }
};

// === ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ===
window.telegramUser = tg.initDataUnsafe?.user || null;
window.telegramInitData = tg.initData || '';

console.log(' DEBUG: telegramUser:', window.telegramUser);
console.log('🔍 DEBUG: telegramInitData length:', window.telegramInitData?.length || 0);

// === ☁️ ОБЛАЧНЫЕ ФУНКЦИИ ===
window.telegramCloud = {
    isAvailable: true, // ✅ В Telegram облако всегда доступно для попыток
    
    saveProgress: async function(progressData) {
        console.log('☁️ [SAVE] Отправка:', progressData);
        console.log('🔍 DEBUG: tg.initData available:', !!tg.initData);
        console.log(' DEBUG: tg.initData length:', tg.initData?.length || 0);
        try {
            const response = await fetch(`${CLOUD_API_URL}/api/save`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'text/plain' // ✅ Обходим CORS preflight!
                },
                body: JSON.stringify({ 
                    initData: tg.initData, 
                    action: 'save',
                    progress: progressData 
                })
            });
            console.log('🔍 DEBUG: Response status:', response.status);
            const result = await response.json();
            console.log('☁️ [SAVE] Ответ:', result);
            if (result.success) this.isAvailable = true;
            return result;
        } catch (error) {
            console.error('❌ [SAVE] Ошибка:', error.message);
            console.error('❌ [SAVE] Stack:', error.stack);
            return { success: false, error: error.message };
        }
    },

    loadProgress: async function() {
        console.log('️ [LOAD] Загрузка из облака...');
        console.log('🔍 DEBUG: tg.initData available:', !!tg.initData);
        try {
            const response = await fetch(`${CLOUD_API_URL}/api/save`, {
                method: 'POST', // ✅ Используем POST вместо GET
                headers: { 
                    'Content-Type': 'text/plain' // ✅ Обходим CORS preflight!
                },
                body: JSON.stringify({ 
                    initData: tg.initData, 
                    action: 'load'
                })
            });
            console.log('🔍 DEBUG: Response status:', response.status);
            const result = await response.json();
            console.log('☁️ [LOAD] Ответ:', result);
            if (result.success) this.isAvailable = true;
            return result;
        } catch (error) {
            console.error('❌ [LOAD] Ошибка:', error.message);
            console.error('❌ [LOAD] Stack:', error.stack);
            return { success: false, error: error.message };
        }
    },
    
    getLeaderboard: async function(limit = 50) {
        try {
            const response = await fetch(`${CLOUD_API_URL}/api/leaderboard?limit=${limit}`, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ 
                    initData: tg.initData, 
                    action: 'leaderboard',
                    limit: limit
                })
            });
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Leaderboard error:', error.message);
            return { success: false, data: [] };
        }
    }
};

console.log('✅ Telegram Integration initialized');
console.log('☁️ Cloud API:', CLOUD_API_URL);
})();