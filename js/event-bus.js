// js/event-bus.js
(function() {
    'use strict';

    const listeners = {};

    window.EventBus = {
        /**
         * Подписаться на событие
         * @param {string} event - Имя события (например, 'block:destroyed')
         * @param {Function} callback - Функция-обработчик
         */
        on: function(event, callback) {
            if (typeof callback !== 'function') {
                console.warn(`[EventBus] Попытка подписаться на "${event}" не функцией`);
                return;
            }
            if (!listeners[event]) {
                listeners[event] = [];
            }
            listeners[event].push(callback);
        },

        /**
         * Отписаться от события
         * @param {string} event - Имя события
         * @param {Function} callback - Та же функция, что была передана в on()
         */
        off: function(event, callback) {
            if (!listeners[event]) return;
            listeners[event] = listeners[event].filter(cb => cb !== callback);
        },

        /**
         * Опубликовать событие
         * @param {string} event - Имя события
         * @param {*} data - Данные, передаваемые подписчикам
         */
        emit: function(event, data) {
            if (!listeners[event]) return;
            
            // Создаём копию массива, чтобы избежать проблем при изменении 
            // списка подписчиков внутри обработчика
            const handlers = [...listeners[event]];
            
            handlers.forEach(cb => {
                try {
                    cb(data);
                } catch (e) {
                    console.error(`[EventBus] Ошибка в обработчике события "${event}":`, e);
                }
            });
        },

        /**
         * Подписаться один раз (автоматически отписывается после первого вызова)
         * @param {string} event - Имя события
         * @param {Function} callback - Функция-обработчик
         */
        once: function(event, callback) {
            if (typeof callback !== 'function') return;
            
            const wrapper = (data) => {
                this.off(event, wrapper);
                callback(data);
            };
            this.on(event, wrapper);
        },

        /**
         * Удалить всех подписчиков конкретного события
         * @param {string} event - Имя события
         */
        clear: function(event) {
            if (event) {
                delete listeners[event];
            } else {
                // Если событие не указано — очищаем всё
                Object.keys(listeners).forEach(key => delete listeners[key]);
            }
        },

        /**
         * Получить количество подписчиков на событие (для отладки)
         * @param {string} event - Имя события
         * @returns {number}
         */
        listenerCount: function(event) {
            return listeners[event] ? listeners[event].length : 0;
        }
    };

    console.log('✅ EventBus initialized');
})();
