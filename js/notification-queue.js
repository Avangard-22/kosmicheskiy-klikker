// js/notification-queue.js — 📨 Единая очередь уведомлений (v1.0)
(function() {
'use strict';

const CONFIG = {
    defaultDuration: 3000,
    gapBetween: 400,
    maxQueueSize: 20
};

let queue = [];
let isShowing = false;

const PRIORITIES = {
    SYSTEM: 100,      // Критические ошибки
    ONBOARDING: 90,   // Шаги обучения
    REWARD: 70,       // Итоговая награда
    ACHIEVEMENT: 50,  // Достижения
    TOAST: 30         // Мелкие уведомления
};

function showNext() {
    if (queue.length === 0) {
        isShowing = false;
        return;
    }
    
    isShowing = true;
    const item = queue.shift();
    
    console.log('📨 [QUEUE] показ:', item.type, item.message);
    
    // Создаём DOM-элемент
    const el = document.createElement('div');
    el.className = 'notification-queue-item';
    el.style.cssText = `
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(10, 15, 30, 0.95);
        border: 2px solid ${item.borderColor || '#4FC3F7'};
        border-radius: 12px;
        padding: 16px 24px;
        color: #fff;
        font-family: 'Orbitron', sans-serif;
        font-size: 1em;
        z-index: ${window.UIManager?.getZ('NOTIFICATION') || 8500};
        text-align: center;
        max-width: 400px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.6);
        animation: slideDown 0.3s ease-out;
    `;
    el.innerHTML = item.html || item.message;
    
    document.body.appendChild(el);
    
    setTimeout(() => {
        el.style.animation = 'slideUp 0.3s ease-in forwards';
        setTimeout(() => el.remove(), 300);
        setTimeout(showNext, CONFIG.gapBetween);
    }, item.duration || CONFIG.defaultDuration);
}

window.NotificationQueue = {
    push: function(type, message, options = {}) {
        if (queue.length >= CONFIG.maxQueueSize) {
            console.warn('📨 [QUEUE] очередь переполнена, отбрасываем:', message);
            return;
        }
        
        queue.push({
            type,
            message,
            html: options.html,
            duration: options.duration,
            borderColor: options.borderColor,
            priority: PRIORITIES[type] || 0,
            timestamp: Date.now()
        });
        
        // Сортируем по приоритету (высокий → низкий)
        queue.sort((a, b) => b.priority - a.priority);
        
        if (!isShowing) showNext();
    },
    
    clear: function() {
        queue = [];
        isShowing = false;
    }
};

// Добавляем CSS-анимации
if (!document.getElementById('notification-queue-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-queue-styles';
    style.textContent = `
        @keyframes slideDown {
            from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translateX(-50%) translateY(0); opacity: 1; }
            to { transform: translateX(-50%) translateY(-20px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

console.log('📨 [Notification-Queue] v1.0 готов');
})();