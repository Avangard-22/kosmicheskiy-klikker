// js/local-save.js — ЛОКАЛЬНЫЙ АДАПТЕР СОХРАНЕНИЙ (localStorage)
// ЧТО: fallback-бэкенд с тем же интерфейсом, что и window.telegramCloud.
// ЗАЧЕМ: локальная разработка (file://), браузер без Telegram, приватный режим.
// ВАЖНО: в production (Telegram WebApp) облако ВСЕГДА приоритетнее — ничего не ломается.
(function () {
    'use strict';

    const KEY_STATE = 'cosmicClicker.localSave.v1';

    // ─── Доступность localStorage (Safari private mode бросает исключение) ───
    function storageAvailable() {
        try {
            const t = '__ls_test__';
            window.localStorage.setItem(t, '1');
            window.localStorage.removeItem(t);
            return true;
        } catch (e) {
            return false;
        }
    }

    // ─── Принудительный режим для тестов: ?save=local | ?save=cloud ───
    function forceMode() {
        try {
            const m = new URLSearchParams(window.location.search).get('save');
            if (m === 'local') return 'local';
            if (m === 'cloud') return 'cloud';
        } catch (e) {}
        return null;
    }

    // Ленивая проверка (telegramCloud может инициализироваться позже этого файла)
    function isAvailableNow() {
        const force = forceMode();
        if (force === 'local') return storageAvailable();
        if (force === 'cloud') return false;      // локаль принудительно выключена
        return !window.telegramCloud?.isAvailable && storageAvailable(); // авто-fallback
    }

    function saveProgress(data) {
        return new Promise((resolve) => {
            if (!isAvailableNow()) return resolve({ success: false, error: 'local-disabled' });
            try {
                const payload = { v: 1, ts: Date.now(), data: data };
                window.localStorage.setItem(KEY_STATE, JSON.stringify(payload));
                resolve({ success: true });
            } catch (e) {
                console.warn('[LOCAL-SAVE] ошибка записи:', e); // quota / private mode
                resolve({ success: false, error: String(e) });
            }
        });
    }

    function loadProgress() {
        return new Promise((resolve) => {
            if (!isAvailableNow()) return resolve({ success: false, error: 'local-disabled' });
            try {
                const raw = window.localStorage.getItem(KEY_STATE);
                if (!raw) return resolve({ success: false, error: 'empty' });
                const payload = JSON.parse(raw);
                if (!payload || !payload.data) return resolve({ success: false, error: 'bad-payload' });
                resolve({ success: true, data: payload.data, ts: payload.ts });
            } catch (e) {
                console.warn('⚠️ [LOCAL-SAVE] ошибка чтения:', e);
                resolve({ success: false, error: String(e) });
            }
        });
    }

    function saveProgressCritical(data) { return saveProgress(data); }

    function clear() {
        try { window.localStorage.removeItem(KEY_STATE); } catch (e) {}
    }

    window.localCloud = {
        get isAvailable() { return isAvailableNow(); },
        saveProgress,
        loadProgress,
        saveProgressCritical,
        clear
    };

    console.log('💾 [LOCAL-SAVE] адаптер:', isAvailableNow() ? 'АКТИВЕН (облака нет)' : 'отключён (облако доступно)');
})();