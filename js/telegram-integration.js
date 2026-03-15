// Telegram Mini App Integration — ЗАГЛУШКА (отключено)
(function() {
    'use strict';
    
    // ✅ Проверка наличия Telegram WebApp
    const isTelegram = !!window.Telegram?.WebApp;
    
    if (isTelegram) {
        console.log('ℹ️ Telegram WebApp detected, но облачное сохранение отключено');
        
        // Просто расширяем на весь экран
        window.Telegram.WebApp.expand();
        window.Telegram.WebApp.ready();
    }
    
    // ✅ Пустая заглушка для telegramHaptic (чтобы не было ошибок)
    window.telegramHaptic = {
        light: function() {
            if (navigator.vibrate) navigator.vibrate(10);
        },
        medium: function() {
            if (navigator.vibrate) navigator.vibrate(30);
        },
        heavy: function() {
            if (navigator.vibrate) navigator.vibrate(50);
        },
        success: function() {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        },
        error: function() {
            if (navigator.vibrate) navigator.vibrate([150, 50, 150]);
        },
        warning: function() {
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        }
    };
    
    console.log('🔷 Telegram Integration loaded (localStorage only)');
})();