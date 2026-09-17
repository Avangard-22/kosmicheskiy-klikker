// js/ui-manager.js — 🎨 Единый менеджер UI-слоёв (v1.0)
(function() {
'use strict';

const Z_LAYERS = {
    GAME_AREA: 5,           // Игровое поле
    BLOCKS: 10,             // Блоки
    EXPLOSIONS: 15,         // Взрывы
    DAMAGE_TEXT: 50,        // Текст урона
    COMBO_TEXT: 51,         // Комбо-текст
    REWARD_TEXT: 52,        // Текст наград
    HUD: 25,                // HUD (кристаллы, прогресс)
    UPGRADES: 30,           // Кнопки улучшений
    ACHIEVEMENTS: 1000,     // Панель достижений
    SHOP: 1100,             // Панель магазина
    MODAL: 2000,            // Модальные окна (переход планеты)
    TOAST: 8000,            // Toast-уведомления
    NOTIFICATION: 8500,     // Очередь уведомлений
    ONBOARDING: 9000,       // Панель онбординга
    BOBO: 7000,             // Персонаж Bobo
    PAUSE_OVERLAY: 9995,    // Оверлей паузы
    MAX: 9999               // Абсолютный максимум
};

window.UIManager = {
    getZ: function(layer) {
        return Z_LAYERS[layer] || Z_LAYERS.GAME_AREA;
    },
    
    isModalOpen: function() {
        return !!document.querySelector('.achievements-panel[style*="flex"], .shop-panel[style*="flex"], .transition-modal');
    },
    
    hideBobo: function(reason) {
        const bobo = document.getElementById('boboContainer') || document.querySelector('.helper');
        if (bobo) {
            bobo.style.display = 'none';
            console.log('🤖 [UI] Bobo скрыт:', reason);
        }
    },
    
    showBobo: function() {
        const bobo = document.getElementById('boboContainer') || document.querySelector('.helper');
        if (bobo && window.gameState?.helperActive) {
            bobo.style.display = '';
            console.log('🤖 [UI] Bobo показан');
        }
    }
};

console.log('🎨 [UI-Manager] v1.0 готов');
})();