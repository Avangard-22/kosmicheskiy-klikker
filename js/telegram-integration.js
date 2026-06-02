// js/telegram-integration.js
(function() {
'use strict';
const tg = window.Telegram?.WebApp;
const isTelegram = !!tg;
const CLOUD_API_URL = 'https://d5d43ru46b7455niv49r.xxg4zr82.apigw.yandexcloud.net';

window.isTelegramEnvironment = isTelegram;

if (!isTelegram) {
    console.log('ℹ️ Telegram WebApp не обнаружен. Работа в режиме браузера.');
    window.telegramHaptic = {
        light: () => {}, medium: () => {}, heavy: () => {},
        success: () => {}, warning: () => {}, error: () => {}, selectionChanged: () => {}
    };
    window.telegramCloud = {
        isAvailable: false,
        saveProgress: async () => ({ success: false, error: 'Not in Telegram' }),
        loadProgress: async () => ({ success: false, error: 'Not in Telegram' }),
        getLeaderboard: async () => ({ success: false, data: [] })
    };
    return;
}

console.log('📱 Telegram WebApp detected. Initializing...');
console.log('☁️ Cloud API URL:', CLOUD_API_URL);

tg.ready();
tg.expand();

function applyThemeColors() {
    const root = document.documentElement;
    if (tg.themeParams) {
        const colors = ['bg_color', 'text_color', 'hint_color', 'link_color', 'button_color', 'button_text_color', 'secondary_bg_color'];
        colors.forEach(key => {
            if (tg.themeParams[key]) root.style.setProperty(`--tg-${key.replace('_', '-')}`, tg.themeParams[key]);
        });
    }
}
applyThemeColors();
if (tg.onEvent) tg.onEvent('themeChanged', applyThemeColors);

window.telegramHaptic = {
    light: () => { try { tg.HapticFeedback.impactOccurred('light'); } catch(e) {} },
    medium: () => { try { tg.HapticFeedback.impactOccurred('medium'); } catch(e) {} },
    heavy: () => { try { tg.HapticFeedback.impactOccurred('heavy'); } catch(e) {} },
    success: () => { try { tg.HapticFeedback.notificationOccurred('success'); } catch(e) {} },
    warning: () => { try { tg.HapticFeedback.notificationOccurred('warning'); } catch(e) {} },
    error: () => { try { tg.HapticFeedback.notificationOccurred('error'); } catch(e) {} },
    selectionChanged: () => { try { tg.HapticFeedback.selectionChanged(); } catch(e) {} }
};

window.telegramMainButton = {
    show: (text, onClick) => {
        if (text) tg.MainButton.setText(text);
        if (onClick) { tg.MainButton.offClick(); tg.MainButton.onClick(onClick); }
        tg.MainButton.show();
    },
    hide: () => { tg.MainButton.hide(); tg.MainButton.offClick(); },
    setText: (text) => tg.MainButton.setText(text),
    setProgress: (isActive) => { isActive ? tg.MainButton.showProgress() : tg.MainButton.hideProgress(); }
};

window.telegramBackButton = {
    show: (onClick) => {
        if (onClick) { tg.BackButton.offClick(); tg.BackButton.onClick(onClick); }
        tg.BackButton.show();
    },
    hide: () => { tg.BackButton.hide(); tg.BackButton.offClick(); }
};

window.telegramUser = tg.initDataUnsafe?.user || null;
window.telegramInitData = tg.initData || '';

// === ☁️ ОБЛАЧНЫЕ ФУНКЦИИ (Этого не хватало в вашем файле!) ===
window.telegramCloud = {
    isAvailable: true, // ✅ Разрешаем попытки обращения к облаку

    saveProgress: async function(progressData) {
        console.log('☁️ [SAVE] Отправка:', progressData);
        try {
            const response = await fetch(`${CLOUD_API_URL}/api/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': tg.initData },
                body: JSON.stringify({ progress: progressData })
            });
            const result = await response.json();
            console.log('☁️ [SAVE] Ответ:', result);
            if (result.success) this.isAvailable = true;
            return result;
        } catch (error) {
            console.error('❌ [SAVE] Ошибка:', error.message);
            return { success: false, error: error.message };
        }
    },

    loadProgress: async function() {
        console.log('☁️ [LOAD] Загрузка из облака...');
        try {
            const response = await fetch(`${CLOUD_API_URL}/api/save`, {
                method: 'GET',
                headers: { 'X-Telegram-Init-Data': tg.initData }
            });
            const result = await response.json();
            console.log('☁️ [LOAD] Ответ:', result);
            if (result.success) this.isAvailable = true;
            return result;
        } catch (error) {
            console.error('❌ [LOAD] Ошибка:', error.message);
            return { success: false, error: error.message };
        }
    },

    getLeaderboard: async function(limit = 50) {
        try {
            const response = await fetch(`${CLOUD_API_URL}/api/leaderboard?limit=${limit}`, {
                method: 'GET',
                headers: { 'X-Telegram-Init-Data': tg.initData }
            });
            return await response.json();
        } catch (error) {
            return { success: false, data: [] };
        }
    }
};

console.log('✅ Telegram Integration initialized successfully');
})();
