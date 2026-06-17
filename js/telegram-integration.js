// js/telegram-integration.js
(function() {
'use strict';

const CLOUD_API_URL = 'https://d5de5jfdv68j295hgj7a.y3q8o1jq.apigw.yandexcloud.net';

/**
 * ✅ НОВОЕ: Безопасное извлечение данных пользователя из initData
 * Решает проблему username = null
 */
function extractUserFromInitData(initData) {
    if (!initData) return null;
    
    try {
        // Парсим initData как URLSearchParams
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
 * ✅ НОВОЕ: Получение username с fallback
 * Решает проблему username = null в облаке
 */
function getUsername(user) {
    if (!user) return 'Anonymous';
    
    // Приоритет 1: username
    if (user.username) return user.username;
    
    // Приоритет 2: first_name + last_name
    if (user.first_name) {
        return user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
    }
    
    // Приоритет 3: id
    if (user.id) return `User_${user.id}`;
    
    return 'Anonymous';
}

/**
 * Извлечение initData из URL (резервный механизм)
 */
function extractInitDataFromURL() {
    try {
        const hash = window.location.hash;
        if (!hash) return null;
        
        const params = new URLSearchParams(hash.substring(1));
        const tgWebAppData = params.get('tgWebAppData');
        
        if (tgWebAppData) {
            console.log('✅ [TELEGRAM] Found tgWebAppData in URL');
            return decodeURIComponent(tgWebAppData);
        }
        
        return null;
    } catch (e) {
        console.error('❌ [TELEGRAM] Error extracting initData from URL:', e);
        return null;
    }
}

/**
 * Отправка данных в облако
 */
async function sendToCloud(action, progressData, initData) {
    console.log('🔍 [CLOUD] sendToCloud called with action:', action);
    console.log('🔍 [CLOUD] initData available:', !!initData);
    console.log('🔍 [CLOUD] initData length:', initData?.length || 0);
    
    if (!initData) {
        console.error('❌ [CLOUD] No initData available');
        return { success: false, error: 'No initData' };
    }
    
    try {
        const body = {
            initData: initData,
            action: action
        };
        
        if (progressData) {
            body.progress = progressData;
        }
        
        console.log('🔍 [CLOUD] Request body:', JSON.stringify(body).substring(0, 200));
        
        const response = await fetch(`${CLOUD_API_URL}/api/save`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify(body)
        });
        
        console.log('🔍 [CLOUD] Response status:', response.status);
        
        const result = await response.json();
        console.log('☁️ [CLOUD] Ответ:', result);
        
        if (result.success) {
            window.isCloudAvailable = true;
        }
        
        return result;
    } catch (error) {
        console.error('❌ [CLOUD] Ошибка:', error.message);
        console.error('❌ [CLOUD] Stack:', error.stack);
        return { success: false, error: error.message };
    }
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
    
    const initDataFromURL = extractInitDataFromURL();
    console.log('🔍 [TELEGRAM] initData from URL:', initDataFromURL ? 'exists (' + initDataFromURL.length + ' chars)' : 'null');
    
    window.isTelegramEnvironment = isTelegram;
    window.isCloudAvailable = false;
    
    // ✅ НОВОЕ: Режим браузера (не в Telegram)
    if (!isTelegram && initDataFromURL) {
        console.log('✅ [TELEGRAM] Using initData from URL for cloud sync');
        window.isTelegramEnvironment = true;
        window.isCloudAvailable = true;
    }
    
    if (!isTelegram) {
        console.log('ℹ️ [TELEGRAM] Telegram WebApp не обнаружен. Работа в режиме браузера.');
        
        window.telegramHaptic = {
            light: () => {}, medium: () => {}, heavy: () => {},
            success: () => {}, warning: () => {}, error: () => {},
            selectionChanged: () => {}
        };

        window.telegramCloud = {
            isAvailable: window.isCloudAvailable,
            saveProgress: async (progressData) => {
                if (!window.isCloudAvailable) {
                    return { success: false, error: 'Not in Telegram' };
                }
                return sendToCloud('save', progressData, initDataFromURL);
            },
            loadProgress: async () => {
                if (!window.isCloudAvailable) {
                    return { success: false, error: 'Not in Telegram' };
                }
                return sendToCloud('load', null, initDataFromURL);
            },
            getLeaderboard: async (limit = 50) => {
                if (!window.isCloudAvailable) {
                    return { success: false, data: [] };
                }
                return sendToCloud('leaderboard', { limit }, initDataFromURL);
            }
        };
        
        // ✅ НОВОЕ: Извлекаем пользователя из URL initData
        if (initDataFromURL) {
            const userFromURL = extractUserFromInitData(initDataFromURL);
            if (userFromURL) {
                window.telegramUser = userFromURL;
                window.telegramUsername = getUsername(userFromURL);
                console.log('✅ [TELEGRAM] telegramUser from URL:', window.telegramUser);
                console.log('✅ [TELEGRAM] telegramUsername:', window.telegramUsername);
            }
        }
        
        // ✅ НОВОЕ: Экспортируем функции для доступа из других модулей
        window.getTelegramUser = () => window.telegramUser;
        window.getTelegramUsername = () => window.telegramUsername || 'Anonymous';
        
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
    // ✅ ИСПРАВЛЕНО: Безопасное извлечение с fallback
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
    
    // ✅ НОВОЕ: Получаем username с fallback
    window.telegramUsername = getUsername(window.telegramUser);
    window.telegramInitData = tg.initData || '';
    
    console.log('🔍 [TELEGRAM] telegramUser:', window.telegramUser);
    console.log('🔍 [TELEGRAM] telegramUsername:', window.telegramUsername);
    console.log('🔍 [TELEGRAM] telegramInitData length:', window.telegramInitData?.length || 0);

    // ✅ НОВОЕ: Экспортируем функции для доступа из других модулей
    window.getTelegramUser = () => window.telegramUser;
    window.getTelegramUsername = () => window.telegramUsername || 'Anonymous';

    // === ☁️ ОБЛАЧНЫЕ ФУНКЦИИ ===
    window.telegramCloud = {
        isAvailable: true,
        
        saveProgress: async function(progressData) {
            console.log('☁️ [SAVE] Отправка:', progressData);
            console.log('☁️ [SAVE] username:', window.telegramUsername);
            return sendToCloud('save', progressData, tg.initData);
        },

        loadProgress: async function() {
            console.log('☁️ [LOAD] Загрузка из облака...');
            return sendToCloud('load', null, tg.initData);
        },
        
        getLeaderboard: async function(limit = 50) {
            return sendToCloud('leaderboard', { limit }, tg.initData);
        }
    };

    // ✅ НОВОЕ: Устанавливаем флаг доступности облака
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
