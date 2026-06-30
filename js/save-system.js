// js/save-system.js (v2.0)
(function() {
'use strict';

// ============================================
// КОНСТАНТЫ
// ============================================
const AUTO_SAVE_INTERVAL = 30000;
const CLOUD_SYNC_COOLDOWN = 5000;
const CLOUD_SAVE_DEBOUNCE = 3000;

// ============================================
// СОСТОЯНИЕ СИСТЕМЫ
// ============================================
let autoSaveTimer = null;
let lastCloudSync = 0;
let isSyncing = false;
let isOperationLocked = false;
let pendingOperations = [];
let cloudSaveTimeout = null;

// ============================================
// ДЕФОЛТНЫЕ НАСТРОЙКИ СОСТОЯНИЯ И МЕТРИК
// ============================================
const DEFAULT_GAME_STATE = {
    gameActive: false,
    coins: 0,
    crystals: 0,
    currentLocation: 'mercury',
    clickPowerLevel: 1,
    critChanceLevel: 0,
    critMultiplierLevel: 0,
    helperLevel: 0,
    helperUpgradeLevel: 0,
    achievements: {},
    permanentBonuses: {},
    perksUnlocked: {}
};

const DEFAULT_GAME_METRICS = {
    totalClicks: 0,
    totalDamage: 0,
    blocksDestroyed: 0,
    maxCombo: 0,
    startTime: Date.now(),
    totalTimePlayed: 0,
    planetStats: {}
};

// ============================================
// 🔒 БЛОКИРОВКА СИНХРОНИЗАЦИИ
// ============================================
window.lockSync = function() {
    isOperationLocked = true;
    console.log('🔒 [SAVE] Синхронизация заблокирована');
};

window.unlockSync = function() {
    isOperationLocked = false;
    console.log('🔓 [SAVE] Синхронизация разблокирована');
    if (pendingOperations.length > 0) {
        const ops = [...pendingOperations];
        pendingOperations = [];
        ops.forEach(op => {
            try {
                if (typeof op === 'function') op();
            } catch (e) {
                console.error('❌ [SAVE] Ошибка отложенной операции:', e);
            }
        });
    }
};

window.isSyncLocked = function() {
    return isOperationLocked;
};

// ============================================
// 🛠️ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

function deepMerge(target, source) {
    if (!source) return target;
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

// ============================================
// 💾 ОСНОВНОЙ ФУНКЦИОНАЛ СИСТЕМЫ СОХРАНЕНИЯ
// ============================================
window.hasSave = function() {
    try {
        return localStorage.getItem('cosmicClickerSave') !== null;
    } catch (e) {
        return false;
    }
};

window.saveGame = function(isCritical = false) {
    if (!window.gameState) return;

    // Локальное сохранение (LocalStorage) — всегда мгновенно для надежности
    try {
        const saveData = {
            gameState: window.gameState,
            gameMetrics: window.gameMetrics
        };
        localStorage.setItem('cosmicClickerSave', JSON.stringify(saveData));
    } catch (e) {
        console.error('❌ [SAVE] Ошибка локального сохранения:', e);
    }

    // Облачное сохранение с дебаунсом (интеграция с Telegram WebApp)
    if (window.TelegramIntegration) {
        if (isOperationLocked) {
            pendingOperations.push(() => window.saveGame(isCritical));
            console.log('⏳ [SAVE] Сохранение отложено (синхронизация заблокирована)');
            return;
        }

        if (isCritical) {
            window.flushCloudSave();
        } else {
            if (cloudSaveTimeout) clearTimeout(cloudSaveTimeout);
            cloudSaveTimeout = setTimeout(() => {
                queueCloudSave(false);
            }, CLOUD_SAVE_DEBOUNCE);
        }
    }
};

async function queueCloudSave(isCritical = false) {
    if (isSyncing) return;
    
    const now = Date.now();
    if (!isCritical && (now - lastCloudSync < CLOUD_SYNC_COOLDOWN)) {
        if (cloudSaveTimeout) clearTimeout(cloudSaveTimeout);
        cloudSaveTimeout = setTimeout(() => queueCloudSave(false), CLOUD_SYNC_COOLDOWN);
        return;
    }

    isSyncing = true;
    lastCloudSync = now;

    try {
        const progressData = {
            gameState: window.gameState,
            gameMetrics: window.gameMetrics
        };

        if (isCritical && window.TelegramIntegration.saveProgressCritical) {
            await window.TelegramIntegration.saveProgressCritical(progressData);
        } else if (window.TelegramIntegration.saveProgress) {
            await window.TelegramIntegration.saveProgress(progressData);
        }
        console.log('☁️ [SAVE] Прогресс успешно синхронизирован с облаком');
    } catch (e) {
        console.error('❌ [SAVE] Ошибка облачной синхронизации:', e);
    } finally {
        isSyncing = false;
    }
}

window.flushCloudSave = function() {
    if (cloudSaveTimeout) {
        clearTimeout(cloudSaveTimeout);
        cloudSaveTimeout = null;
    }
    
    if (!window.gameState || !window.TelegramIntegration) return;

    const progressData = {
        gameState: window.gameState,
        gameMetrics: window.gameMetrics
    };

    if (window.TelegramIntegration.saveProgressCritical) {
        window.TelegramIntegration.saveProgressCritical(progressData)
            .then(() => console.log('🚨 [SAVE] Экстренное облачное сохранение выполнено'))
            .catch(e => console.error('❌ [SAVE] Ошибка экстренного облачного сохранения:', e));
    } else if (window.TelegramIntegration.saveProgress) {
        window.TelegramIntegration.saveProgress(progressData)
            .then(() => console.log('☁️ [SAVE] Экстренное облачное сохранение выполнено'))
            .catch(e => console.error('❌ [SAVE] Ошибка экстренного облачного сохранения:', e));
    }
};

window.loadGame = async function() {
    let loadedData = null;

    // Пытаемся загрузить данные из облака Telegram
    if (window.TelegramIntegration && window.TelegramIntegration.loadProgress) {
        try {
            const cloudResponse = await window.TelegramIntegration.loadProgress();
            if (cloudResponse && cloudResponse.gameState) {
                loadedData = cloudResponse;
                console.log('☁️ [LOAD] Прогресс успешно загружен из облака');
            }
        } catch (e) {
            console.error('❌ [LOAD] Ошибка облачной загрузки, переход на локальный fallback:', e);
        }
    }

    // Локальный Fallback (LocalStorage)
    if (!loadedData) {
        try {
            const localSave = localStorage.getItem('cosmicClickerSave');
            if (localSave) {
                loadedData = JSON.parse(localSave);
                console.log('💾 [LOAD] Прогресс загружен из LocalStorage');
            }
        } catch (e) {
            console.error('❌ [LOAD] Ошибка чтения LocalStorage:', e);
        }
    }

    if (loadedData) {
        window.gameState = deepMerge(DEFAULT_GAME_STATE, loadedData.gameState);
        window.gameMetrics = deepMerge(DEFAULT_GAME_METRICS, loadedData.gameMetrics);
        if (!window.gameMetrics.planetStats) window.gameMetrics.planetStats = {};
    } else {
        window.gameState = Object.assign({}, DEFAULT_GAME_STATE);
        window.gameMetrics = Object.assign({}, DEFAULT_GAME_METRICS);
        window.gameMetrics.planetStats = {};
        console.log('✨ [LOAD] Создано новое игровое состояние');
    }

    // Инициализируем перки и интерфейс после загрузки
    if (window.PerkSystem && typeof window.PerkSystem.applyAllPerks === 'function') {
        window.PerkSystem.applyAllPerks();
    }
    
    if (window.GAME_UI && typeof window.GAME_UI.updateHUD === 'function') {
        window.GAME_UI.updateHUD();
        window.GAME_UI.updateUpgradeButtons();
    }
    
    return true;
};

function startAutoSave() {
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    autoSaveTimer = setInterval(() => {
        if (window.gameState && window.gameState.gameActive && !window.GAME_CORE?.isGamePaused) {
            window.saveGame();
        }
    }, AUTO_SAVE_INTERVAL);
}

// ============================================
// 🚀 ИНИЦИАЛИЗАЦИЯ
// ============================================
function init() {
    if (!window.gameState) {
        window.gameState = Object.assign({}, DEFAULT_GAME_STATE);
    } else {
        window.gameState = deepMerge(DEFAULT_GAME_STATE, window.gameState);
    }

    if (!window.gameMetrics) {
        window.gameMetrics = Object.assign({}, DEFAULT_GAME_METRICS);
    } else {
        window.gameMetrics = deepMerge(DEFAULT_GAME_METRICS, window.gameMetrics);
        if (!window.gameMetrics.planetStats) window.gameMetrics.planetStats = {};
    }

    startAutoSave();

    window.addEventListener('beforeunload', () => {
        if (window.gameState && window.gameState.gameActive) {
            if (typeof window.flushCloudSave === 'function') {
                window.flushCloudSave();
            } else {
                window.saveGame();
            }
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && window.gameState && window.gameState.gameActive) {
            if (typeof window.flushCloudSave === 'function') {
                window.flushCloudSave();
            } else {
                window.saveGame();
            }
        }
    });

    console.log('💾 Save System v2.0 initialized (CLOUD + DM + PERKS)');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
})();
