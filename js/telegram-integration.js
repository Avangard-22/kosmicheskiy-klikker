// js/telegram-integration.js (ЧИСТЫЙ РЕЖИМ TELEGRAM)
(function() {
'use strict';
const CLOUD_API_URL = 'https://d5de5jfdv68j295hgj7a.y3q8o1jq.apigw.yandexcloud.net';

function getUsername(user) {
    if (!user) return 'Anonymous';
    if (user.username) return user.username;
    if (user.first_name) return user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
    if (user.id) return `User_${user.id}`;
    return 'Anonymous';
}

async function sendToCloud(action, progressData, initData, critical = false) {
    if (!initData) {
        console.error('❌ [CLOUD] No initData available');
        return { success: false, error: 'No initData' };
    }
    
    const body = { initData, action };
    if (progressData) body.progress = progressData;
    const bodyString = JSON.stringify(body);

    // Критическое сохранение через sendBeacon
    if (critical && action === 'save' && navigator.sendBeacon) {
        try {
            const blob = new Blob([bodyString], { type: 'text/plain' });
            const sent = navigator.sendBeacon(`${CLOUD_API_URL}/api/save`, blob);
            if (sent) return { success: true, beacon: true };
        } catch (e) { console.warn('⚠️ [CLOUD] sendBeacon error:', e.message); }
    }

    // Обычный запрос через fetch
    try {
        const response = await fetch(`${CLOUD_API_URL}/api/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: bodyString,
            keepalive: true
        });
        const result = await response.json();
        if (result.success) window.isCloudAvailable = true;
        return result;
    } catch (error) {
        console.error('❌ [CLOUD] Ошибка:', error.message);
        return { success: false, error: error.message };
    }
}

function initTelegramIntegration() {
    const tg = window.Telegram?.WebApp;
    
    // ✅ ЕСЛИ ЭТО НЕ TELEGRAM — СРАЗУ СООБЩАЕМ ОБ ЭТОМ
    if (!tg) {
        console.error('❌ ОШИБКА: Игра запущена вне Telegram!');
        document.body.innerHTML = '<h1 style="color:white;text-align:center;margin-top:50px;font-family:sans-serif;">Пожалуйста, откройте игру через Telegram Bot</h1>';
        return;
    }

    console.log('📱 Telegram WebApp detected. Initializing...');
    tg.ready();
    tg.expand();

    window.isTelegramEnvironment = true;
    window.isCloudAvailable = true; // ✅ ВСЕГДА true, так как мы в Telegram

    // HAPTIC FEEDBACK
    window.telegramHaptic = {
        light: () => { try { tg.HapticFeedback.impactOccurred('light'); } catch(e) {} },
        medium: () => { try { tg.HapticFeedback.impactOccurred('medium'); } catch(e) {} },
        heavy: () => { try { tg.HapticFeedback.impactOccurred('heavy'); } catch(e) {} },
        success: () => { try { tg.HapticFeedback.notificationOccurred('success'); } catch(e) {} },
        warning: () => { try { tg.HapticFeedback.notificationOccurred('warning'); } catch(e) {} },
        error: () => { try { tg.HapticFeedback.notificationOccurred('error'); } catch(e) {} }
    };

    // ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
    window.telegramUser = tg.initDataUnsafe?.user || null;
    window.telegramUsername = getUsername(window.telegramUser);
    window.telegramInitData = tg.initData || '';

    // ОБЛАЧНЫЙ API
    window.telegramCloud = {
        isAvailable: true,
        saveProgress: async function(progressData) {
            return sendToCloud('save', progressData, tg.initData, false);
        },
        saveProgressCritical: async function(progressData) {
            return sendToCloud('save', progressData, tg.initData, true);
        },
        loadProgress: async function() {
            return sendToCloud('load', null, tg.initData, false);
        },
        getLeaderboard: async function(period = 'global', limit = 50) {
            return sendToCloud('leaderboard', { period, limit }, tg.initData, false);
        },
        submitLeaderboard: async function(data) {
            return sendToCloud('leaderboard_submit', data, tg.initData, false);
        }
    };

    window.getTelegramUser = () => window.telegramUser;
    window.getTelegramUsername = () => window.telegramUsername || 'Anonymous';
    window.getUserId = () => window.telegramUser ? window.telegramUser.id : null;

    console.log('✅ Telegram Integration initialized (PURE TELEGRAM MODE)');
    console.log('👤 User ID:', window.getUserId());
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTelegramIntegration);
} else {
    initTelegramIntegration();
}
})();
