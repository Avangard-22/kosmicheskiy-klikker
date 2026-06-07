// js/telegram-integration.js
(function() {
    'use strict';

    const tg = window.Telegram?.WebApp;
    const isTelegram = !!tg;
    const CLOUD_API_URL = 'https://d5d43ru46b7455niv49r.xxg4zr82.apigw.yandexcloud.net';

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
        setText: (text) => { tg.MainButton.setText(text); },
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

    // === ☁️ ОБЛАЧНЫЕ ФУНКЦИИ ===
window.telegramCloud = {
    isAvailable: true, // ✅ В Telegram облако всегда доступно для попыток

    saveProgress: async function(progressData) {
        console.log('☁️ [SAVE] Отправка:', progressData);
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
                method: 'POST', // ✅ Используем POST вместо GET
                headers: { 
                    'Content-Type': 'text/plain' // ✅ Обходим CORS preflight!
                },
                body: JSON.stringify({ 
                    initData: tg.initData, 
                    action: 'load'
                })
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
                console.warn('⚠️ Leaderboard error:', error.message);
                return { success: false, data: [] };
            }
        }
    };

    console.log('✅ Telegram Integration initialized');
    console.log('☁️ Cloud API:', CLOUD_API_URL);
})();