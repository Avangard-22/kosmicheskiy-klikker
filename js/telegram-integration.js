// js/telegram-integration.js
(function() {
'use strict';

const CLOUD_API_URL = 'https://d5de5jfdv68j295hgj7a.y3q8o1jq.apigw.yandexcloud.net';

// ==========================================
// ✅ НОВОЕ: Функция получения username с fallback
// ==========================================
function getUsername(user) {
    if (!user) return 'Anonymous';
    if (user.username) return user.username;
    if (user.first_name) {
        return user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
    }
    if (user.id) return `User_${user.id}`;
    return 'Anonymous';
}

// ==========================================
// Извлечение initData из URL (для режима браузера)
// ==========================================
function extractInitDataFromURL() {
    try {
        const hash = window.location.hash;
        if (!hash) return null;
        
        const params = new URLSearchParams(hash.substring(1));
        const tgWebAppData = params.get('tgWebAppData');
        
        if (tgWebAppData) {
            console.log('✅ Found tgWebAppData in URL');
            return decodeURIComponent(tgWebAppData);
        }
        
        return null;
    } catch (e) {
        console.error('❌ Error extracting initData from URL:', e);
        return null;
    }
}

// ==========================================
// Отправка данных в облако
// ==========================================
async function sendToCloud(action, progressData, initData, critical = false) {
    console.log('🔍 [CLOUD] sendToCloud called with action:', action, critical ? '(CRITICAL)' : '');
    console.log('🔍 [CLOUD] initData available:', !!initData);
    console.log('🔍 [CLOUD] initData length:', initData?.length || 0);

    if (!initData) {
        console.error('❌ [CLOUD] No initData available');
        return { success: false, error: 'No initData' };
    }

    const body = {
        initData: initData,
        action: action
    };

    if (progressData) {
        body.progress = progressData;
    }

    const bodyString = JSON.stringify(body);

    // ✅ ПРИОРИТЕТ 1: sendBeacon для критических сохранений
    if (critical && action === 'save' && navigator.sendBeacon) {
        try {
            const blob = new Blob([bodyString], { type: 'text/plain' });
            const sent = navigator.sendBeacon(`${CLOUD_API_URL}/api/save`, blob);
            if (sent) {
                console.log('✅ [CLOUD] sendBeacon successful (critical save)');
                window.isCloudAvailable = true;
                return { success: true, beacon: true };
            }
            console.warn('⚠️ [CLOUD] sendBeacon failed, falling back to fetch');
        } catch (e) {
            console.warn('⚠️ [CLOUD] sendBeacon error:', e.message);
        }
    }

    // ✅ ПРИОРИТЕТ 2: fetch с keepalive
    try {
        console.log('🔍 [CLOUD] Request body:', bodyString.substring(0, 200));

        const response = await fetch(`${CLOUD_API_URL}/api/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: bodyString,
            keepalive: true
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

// ==========================================
// Главная функция инициализации
// ==========================================
function initTelegramIntegration() {
    console.log('🔍 Initializing Telegram integration...');
    
    const tg = window.Telegram?.WebApp;
    const isTelegram = !!tg;
    
    console.log('🔍 Telegram WebApp available:', isTelegram);
    console.log('🔍 User Agent:', navigator.userAgent);
    
    const initDataFromURL = extractInitDataFromURL();
    console.log('🔍 initData from URL:', initDataFromURL ? 'exists (' + initDataFromURL.length + ' chars)' : 'null');
    
    window.isTelegramEnvironment = isTelegram;
    window.isCloudAvailable = false;
    
    // ==========================================
    // РЕЖИМ БРАУЗЕРА (не в Telegram)
    // ==========================================
    if (!isTelegram && initDataFromURL) {
        console.log('✅ Using initData from URL for cloud sync');
        window.isTelegramEnvironment = true;
        window.isCloudAvailable = true;
    }
    
    if (!isTelegram) {
        console.log('ℹ️ Telegram WebApp не обнаружен. Работа в режиме браузера.');
        
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
            saveProgressCritical: async (progressData) => {
                if (!window.isCloudAvailable) {
                    return { success: false, error: 'Not in Telegram' };
                }
                return sendToCloud('save', progressData, initDataFromURL, true);
            },
            loadProgress: async () => {
                if (!window.isCloudAvailable) {
                    return { success: false, error: 'Not in Telegram' };
                }
                return sendToCloud('load', null, initDataFromURL);
            },
getLeaderboard: async function(period = 'global', limit = 50) {
    return sendToCloud('leaderboard', { period, limit }, tg.initData, false);
},
// ✅ НОВОЕ: Отправка результата в лидерборд
submitLeaderboard: async function(data) {
    return sendToCloud('leaderboard_submit', data, tg.initData, false);
}
                return sendToCloud('leaderboard', { limit }, initDataFromURL);
            }
        };
        
        // Извлекаем пользователя из URL initData
        if (initDataFromURL) {
            try {
                const params = new URLSearchParams(initDataFromURL);
                const userJson = params.get('user');
                if (userJson) {
                    window.telegramUser = JSON.parse(decodeURIComponent(userJson));
                    window.telegramUsername = getUsername(window.telegramUser);
                    console.log('✅ telegramUser from URL:', window.telegramUser);
                    console.log('✅ telegramUsername:', window.telegramUsername);
                }
            } catch (e) {
                console.error('❌ Error parsing user from URL:', e);
            }
        }
        
        // ✅ Экспортируем функции для доступа из других модулей (режим браузера)
        window.getTelegramUser = () => window.telegramUser;
        window.getTelegramUsername = () => window.telegramUsername || 'Anonymous';
        window.getUserId = () => window.telegramUser ? window.telegramUser.id : null;
        window.getUserAvatar = () => window.telegramUser ? window.telegramUser.photo_url : null;
        
        console.log('✅ Telegram Integration initialized (browser mode)');
        console.log('☁️ Cloud API:', CLOUD_API_URL);
        return;
    }

    // ==========================================
    // РЕЖИМ TELEGRAM
    // ==========================================
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
    window.telegramUsername = getUsername(window.telegramUser);
    window.telegramInitData = tg.initData || '';
    
    console.log('🔍 [TELEGRAM] telegramUser:', window.telegramUser);
    console.log('🔍 [TELEGRAM] telegramUsername:', window.telegramUsername);
    console.log('🔍 [TELEGRAM] telegramInitData length:', window.telegramInitData?.length || 0);

    // === ОБЛАЧНЫЕ ФУНКЦИИ ===
    window.telegramCloud = {
        isAvailable: true,

        saveProgress: async function(progressData) {
            console.log('☁️ [SAVE] Отправка:', progressData);
            console.log('☁️ [SAVE] username:', window.telegramUsername);
            return sendToCloud('save', progressData, tg.initData, false);
        },

        saveProgressCritical: async function(progressData) {
            console.log('🚨 [SAVE] Критическая отправка:', progressData);
            return sendToCloud('save', progressData, tg.initData, true);
        },

        loadProgress: async function() {
            console.log('☁️ [LOAD] Загрузка из облака...');
            return sendToCloud('load', null, tg.initData, false);
        },

        getLeaderboard: async function(limit = 50) {
            return sendToCloud('leaderboard', { limit }, tg.initData, false);
        }
    };

    // ✅ ЭКСПОРТ ФУНКЦИЙ ДЛЯ ДРУГИХ МОДУЛЕЙ (режим Telegram)
    window.getTelegramUser = () => window.telegramUser;
    window.getTelegramUsername = () => window.telegramUsername || 'Anonymous';
    window.getUserId = () => window.telegramUser ? window.telegramUser.id : null;
    window.getUserAvatar = () => window.telegramUser ? window.telegramUser.photo_url : null;

    console.log('✅ Telegram Integration initialized (Telegram mode)');
    console.log('☁️ Cloud API:', CLOUD_API_URL);
    console.log('👤 User ID:', window.telegramUser?.id);
    console.log('👤 Username:', window.telegramUsername);
}

// ==========================================
// Запуск инициализации
// ==========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTelegramIntegration);
} else {
    initTelegramIntegration();
}
})();
