// js/event-bus.js (v1.1 — Ready Gate)
(function() {
    'use strict';

    const listeners = {};
    
    // ✅ READY GATE: Отслеживание готовности модулей
    const REQUIRED_MODULES = ['save', 'core', 'achievements', 'shop', 'dailyBonus', 'music', 'background', 'voyager'];
    const readyModules = new Set();
    let allReadyFired = false;

    window.EventBus = {
        on: function(event, callback) {
            if (typeof callback !== 'function') {
                console.warn(`[EventBus] Попытка подписаться на "${event}" не функцией`);
                return;
            }
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(callback);
        },

        off: function(event, callback) {
            if (!listeners[event]) return;
            listeners[event] = listeners[event].filter(cb => cb !== callback);
        },

        emit: function(event, data) {
            if (!listeners[event]) return;
            const handlers = [...listeners[event]];
            handlers.forEach(cb => {
                try { cb(data); } catch (e) {
                    console.error(`[EventBus] Ошибка в обработчике "${event}":`, e);
                }
            });
        },

        once: function(event, callback) {
            if (typeof callback !== 'function') return;
            const wrapper = (data) => {
                this.off(event, wrapper);
                callback(data);
            };
            this.on(event, wrapper);
        },

        clear: function(event) {
            if (event) delete listeners[event];
            else Object.keys(listeners).forEach(key => delete listeners[key]);
        },

        listenerCount: function(event) {
            return listeners[event] ? listeners[event].length : 0;
        },

        /**
         * ✅ НОВОЕ: Регистрация готовности модуля
         * Когда все обязательные модули зарегистрировались, эмитится game:allReady
         */
        moduleReady: function(moduleName) {
            if (allReadyFired) return; // Уже запущено
            
            readyModules.add(moduleName);
            console.log(`✅ [READY] ${moduleName} готов (${readyModules.size}/${REQUIRED_MODULES.length})`);
            
            if (readyModules.size >= REQUIRED_MODULES.length) {
                allReadyFired = true;
                console.log('🚀 [READY] ВСЕ МОДУЛИ ГОТОВЫ! Запуск игры...');
                this.emit('game:allReady');
            }
        }
    };

    console.log('✅ EventBus v1.1 initialized (Ready Gate active)');
})();
