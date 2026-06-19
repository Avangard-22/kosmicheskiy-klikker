// js/telegram-integration.js
(function() {
'use strict';

const CLOUD_API_URL = 'https://d5de5jfdv68j295hgj7a.y3q8o1jq.apigw.yandexcloud.net';

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

/**
 * Отправка данных в облако с retry механизмом
 * @param {string} action - 'save' или 'load'
 * @param {Object} progressData - данные для сохранения (опционально)
 * @param {string} initData - initData Telegram
 * @param {number} maxRetries - максимальное количество попыток (по умолчанию 3)
 */
async function sendToCloud(action, progressData, initData, maxRetries = 3) {
    console.log('🔍 [CLOUD] sendToCloud called with action:', action);
    console.log(' [CLOUD] initData available:', !!initData);
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

    // ✅ НОВОЕ: Retry цикл с экспоненциальной задержкой
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔍 [CLOUD] Попытка ${attempt}/${maxRetries} для action=${action}`);
            
            const response = await fetch(`${CLOUD_API_URL}/api/save`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify(body)
            });

            console.log('🔍 [CLOUD] Response status:', response.status);

            // ✅ НОВОЕ: Повтор при серверных ошибках (5xx)
            if (response.status >= 500 && attempt < maxRetries) {
                const delay = 1000 * attempt; // 1с, 2с, 3с
                console.warn(`⚠️ [CLOUD] Серверная ошибка ${response.status}, повтор через ${delay}мс`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue; // Переходим к следующей попытке
            }

            // ✅ НОВОЕ: Повтор при таймаутах и сетевых ошибках
            if (!response.ok && attempt < maxRetries) {
                const delay = 1000 * attempt;
                console.warn(`⚠️ [CLOUD] HTTP ошибка ${response.status}, повтор через ${delay}мс`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            const result = await response.json();
            console.log('☁️ [CLOUD] Ответ:', result);

            if (result.success) {
                window.isCloudAvailable = true;
            }

            return result;
        } catch (error) {
            console.error(`❌ [CLOUD] Ошибка на попытке ${attempt}:`, error.message);
            
            // ✅ НОВОЕ: Если это последняя попытка — возвращаем ошибку
            if (attempt >= maxRetries) {
                console.error('❌ [CLOUD] Все попытки исчерпаны');
                return { success: false, error: error.message };
            }
            
            // ✅ НОВОЕ: Задержка перед следующей попыткой
            const delay = 1000 * attempt;
            console.warn(`⚠️ [CLOUD] Сетевая ошибка, повтор через ${delay}мс`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    // На случай, если цикл завершился без return (не должно произойти)
    return { success: false, error: 'Unexpected retry loop exit' };
}

function initTelegramIntegration() {
    // ✅ Защита от повторной инициализации
    if (window.telegramCloud && window.telegramCloud.isAvailable) {
        console.log('ℹ️ [TELEGRAM] Уже инициализирован, пропускаем');
        return;
    }
    
    console.log(' [TELEGRAM] Initializing Telegram integration...');
    const tg = window.Telegram?.WebApp;
    const isTelegram = !!tg;
    
    console.log('🔍 Telegram WebApp available:', isTelegram);
    console.log('🔍 User Agent:', navigator.userAgent);
    
    const initDataFromURL = extractInitDataFromURL();
    console.log('🔍 initData from URL:', initDataFromURL ? 'exists (' + initDataFromURL.length + ' chars)' : 'null');
    
    window.isTelegramEnvironment = isTelegram;
    window.isCloudAvailable = false;
    
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
        
        if (initDataFromURL) {
            try {
                const params = new URLSearchParams(initDataFromURL);
                const userJson = params.get('user');
                if (userJson) {
                    window.telegramUser = JSON.parse(decodeURIComponent(userJson));
                    console.log('✅ telegramUser from URL:', window.telegramUser);
                }
            } catch (e) {
                console.error(' Error parsing user from URL:', e);
            }
        }
        
        return;
    }

    console.log('📱 Telegram WebApp detected. Initializing...');

    tg.ready();
    tg.expand();

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
        setProgress: (isActive) => {
            if (isActive) tg.MainButton.showProgress();
            else tg.MainButton.hideProgress();
        }
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
    
    console.log('🔍 telegramUser:', window.telegramUser);
    console.log('🔍 telegramInitData length:', window.telegramInitData?.length || 0);

    window.telegramCloud = {
        isAvailable: true,
        
        saveProgress: async function(progressData) {
            console.log('☁️ [SAVE] Отправка:', progressData);
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

    console.log('✅ Telegram Integration initialized');
    console.log('☁️ Cloud API:', CLOUD_API_URL);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTelegramIntegration);
} else {
    initTelegramIntegration();
}
})();
