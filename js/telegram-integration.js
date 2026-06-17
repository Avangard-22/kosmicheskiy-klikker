// js/telegram-integration.js
(function() {
'use strict';

const CLOUD_API_URL = 'https://d5de5jfdv68j295hgj7a.y3q8o1jq.apigw.yandexcloud.net';

/**
 * Безопасное извлечение данных пользователя из initData
 */
function extractUserFromInitData(initData) {
    if (!initData) return null;
    try {
        const params = new URLSearchParams(initData);
        const userJson = params.get('user');
        if (userJson) {
            const user = JSON.parse(decodeURIComponent(userJson));
            console.log('✅ [TELEGRAM] User extracted from initData:', user);
            return user;
        }
        return null;
    } catch (e) {
        console.error('❌ [TELEGRAM] Error extracting user from initData:', e);
        return null;
    }
}

/**
 * Получение username с fallback
 */
function getUsername(user) {
    if (!user) return 'Anonymous';
    if (user.username) return user.username;
    if (user.first_name) {
        return user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
    }
    if (user.id) return `User_${user.id}`;
    return 'Anonymous';
}

/**
 * Инициализация Telegram интеграции
 */
function initTelegramIntegration() {
    console.log('🔍 [TELEGRAM] Initializing Telegram integration...');
    
    const tg = window.Telegram?.WebApp;
    const isTelegram = !!tg;
    
    console.log('🔍 [TELEGRAM] Telegram WebApp available:', isTelegram);
    console.log('🔍 [TELEGRAM] User Agent:', navigator.userAgent);
    
    window.isTelegramEnvironment = isTelegram;
    window.isCloudAvailable = false;
    
    if (!isTelegram) {
        console.log('ℹ️ [TELEGRAM] Telegram WebApp не обнаружен. Работа в режиме браузера.');
        
        window.telegramHaptic = {
            light: () => {}, medium: () => {}, heavy: () => {},
            success: () => {}, warning: () => {}, error: () => {},
            selectionChanged: () => {}
        };

        window.telegramCloud = {
            isAvailable: false,
            saveProgress: async () => ({ success: false, error: 'Not in Telegram' }),
            loadProgress: async () => ({ success: false, error: 'Not in Telegram' }),
            getLeaderboard: async () => ({ success: false, data: [] })
        };
        
        window.telegramUser = null;
        window.telegramUsername = 'Anonymous';
        window.getTelegramUser = () => window.telegramUser;
        window.getTelegramUsername = () => window.telegramUsername;
        
        return;
    }

    console.log('📱 [TELEGRAM] Telegram WebApp detected. Initializing...');

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
    console.log('🔍 [TELEGRAM] tg.initDataUnsafe:', tg.initDataUnsafe);
    console.log('🔍 [TELEGRAM] tg.initDataUnsafe.user:', tg.initDataUnsafe?.user);
    console.log('🔍 [TELEGRAM] tg.initData length:', tg.initData?.length || 0);
    
    // Приоритет 1: из initDataUnsafe
    if (tg.initDataUnsafe?.user) {
        window.telegramUser = tg.initDataUnsafe.user;
        console.log('✅ [TELEGRAM] User from initDataUnsafe:', window.telegramUser);
    } 
    // Приоритет 2: извлекаем из initData напрямую
    else if (tg.initData) {
        const userFromInitData = extractUserFromInitData(tg.initData);
        if (userFromInitData) {
            window.telegramUser = userFromInitData;
            console.log('✅ [TELEGRAM] User extracted from initData:', window.telegramUser);
        }
    }
    
    // Получаем username с fallback
    window.telegramUsername = getUsername(window.telegramUser);
    window.telegramInitData = tg.initData || '';
    
    console.log('🔍 [TELEGRAM] telegramUser:', window.telegramUser);
    console.log('🔍 [TELEGRAM] telegramUsername:', window.telegramUsername);
    console.log('🔍 [TELEGRAM] telegramInitData length:', window.telegramInitData?.length || 0);

    // Экспортируем функции для доступа из других модулей
    window.getTelegramUser = () => window.telegramUser;
    window.getTelegramUsername = () => window.telegramUsername || 'Anonymous';

    // === ☁️ ОБЛАЧНЫЕ ФУНКЦИИ ===
    window.telegramCloud = {
        isAvailable: true,
        
        saveProgress: async function(progressData) {
            console.log('☁️ [SAVE] Отправка:', progressData);
            console.log('☁️ [SAVE] username:', window.telegramUsername);
            try {
                const response = await fetch(`${CLOUD_API_URL}/api/save`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'text/plain'
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
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'text/plain'
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

    // Устанавливаем флаг доступности облака
    window.isCloudAvailable = true;
    
    console.log('✅ [TELEGRAM] Telegram Integration initialized');
    console.log('☁️ [TELEGRAM] Cloud API:', CLOUD_API_URL);
    console.log('👤 [TELEGRAM] User ID:', window.telegramUser?.id);
    console.log('👤 [TELEGRAM] Username:', window.telegramUsername);
}

// Запуск инициализации
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTelegramIntegration);
} else {
    initTelegramIntegration();
}
})();
