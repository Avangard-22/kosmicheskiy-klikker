// js/save-system.js
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
        console.log('📋 [SAVE] Выполняем ' + pendingOperations.length + ' отложенных операций');
        const ops = [...pendingOperations];
        pendingOperations = [];
        ops.forEach(op => {
            try { if (typeof op === 'function') op(); } catch (e) { console.error(e); }
        });
    }
};

window.isSyncLocked = function() { return isOperationLocked; };

// ============================================
// ДЕФОЛТНЫЕ ДАННЫЕ (Шаблоны)
// ============================================
const DEFAULT_GAME_STATE = {
    coins: 0,
    clickPower: 1,
    critChance: 0.001,
    critMultiplier: 2.0,
    currentLocation: 'mercury',
    totalDamageDealt: 0,
    clickUpgradeLevel: 0,
    critChanceUpgradeLevel: 0,
    critMultiplierUpgradeLevel: 0,
    helperUpgradeLevel: 0,
    helperActivations: 0,
    helperActive: false,
    helperTimeLeft: 0,
    helperDamageBonus: 0,
    boboCoinBonus: 0,
    comboCount: 0,
    lastDestroyTime: 0,
    gameActive: false,
    gamePaused: false,
    achievements: {},
    shopItems: {},
    permanentBonuses: {},
    unlockedLocations: ['mercury'],
    boboSkin: 'default',
    dailyBonus: { lastClaimDate: null, currentDay: 1, totalClaimed: 0, streak: 0 }
};

const DEFAULT_GAME_METRICS = {
    startTime: 0,
    blocksDestroyed: 0,
    upgradesBought: 0,
    totalClicks: 0,
    totalCrits: 0,
    totalCoinsEarned: 0,
    helpersBought: 0,
    boostersUsed: 0,
    maxCombo: 0,
    rareBlocksDestroyed: 0,
    sessions: 0,
    visitedPlanets: []
};

// ============================================
// УТИЛИТЫ АВТОМАТИЗАЦИИ
// ============================================

// Умное глубокое слияние: принимает новые структуры, не ломая вложенность
function deepMerge(defaults, saved) {
    if (typeof saved !== 'object' || saved === null) return saved;
    if (Array.isArray(saved)) return [...saved]; // Корректно копируем массивы локаций

    const result = Object.assign({}, defaults || {});
    for (const key in saved) {
        if (saved.hasOwnProperty(key)) {
            // Если внутри объект (и не массив), уходим в рекурсию, создавая структуру на лету
            if (typeof saved[key] === 'object' && saved[key] !== null && !Array.isArray(saved[key])) {
                result[key] = deepMerge(defaults ? defaults[key] : {}, saved[key]);
            } else {
                result[key] = saved[key];
            }
        }
    }
    return result;
}

// Автоматический сборщик данных — забирает ВСЁ из gameState и gameMetrics
function extractCloudData() {
    if (!window.gameState) return null;
    
    const planetOrder = window.GAME_CONFIG?.PLANET_ORDER || ['mercury'];
    const currentLevel = planetOrder.indexOf(window.gameState.currentLocation) + 1;
    
    const username = (typeof window.getTelegramUsername === 'function') 
        ? window.getTelegramUsername()
        : (window.telegramUser?.username || window.telegramUser?.first_name || 'Anonymous');

    return {
        // Упрощенные поля для быстрого чтения сервером (лидерборды/админка)
        crystals: Math.floor(window.gameState.coins || 0),
        level: currentLevel,
        score: Math.floor(window.gameState.totalDamageDealt || 0),
        bobo_skin: window.gameState.boboSkin || 'default',
        username: username,
        timestamp: Date.now(),
        
        // Автоматический слепок всего игрового состояния
        full_game_state: JSON.parse(JSON.stringify(window.gameState)),
        full_game_metrics: JSON.parse(JSON.stringify(window.gameMetrics || {}))
    };
}

// Автоматический распаковщик данных
function applyCloudData(cloudData) {
    if (!cloudData) return;
    
    // ВосстановлениеGameState
    if (cloudData.full_game_state) {
        console.log('☁️ [LOAD] Авто-накакат gameState из облака...');
        const currentGameActive = window.gameState?.gameActive || false;
        const currentGamePaused = window.gameState?.gamePaused || false;
        
        window.gameState = deepMerge(DEFAULT_GAME_STATE, cloudData.full_game_state);
        
        // Сброс сессионных флагов, чтобы игра не зависла при старте
        window.gameState.gameActive = currentGameActive;
        window.gameState.gamePaused = currentGamePaused;
        window.gameState.helperActive = false;
        window.gameState.helperTimeLeft = 0;
        window.gameState.comboCount = 0;
    }
    
    // Автоматическое восстановление метрик
    if (cloudData.full_game_metrics) {
        console.log('📊 [LOAD] Авто-накакат gameMetrics из облака...');
        window.gameMetrics = deepMerge(DEFAULT_GAME_METRICS, cloudData.full_game_metrics);
    }
}

// ============================================
// ПУБЛИЧНЫЙ API СОХРАНЕНИЯ
// ============================================

window.saveGame = function() {
    try {
        if (!window.gameState) return false;

        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn && !saveBtn.classList.contains('save-pulse-success')) {
            saveBtn.classList.add('save-pending');
        }
        
        if (isOperationLocked) {
            pendingOperations.push(() => debouncedCloudSave());
            return true;
        }

        debouncedCloudSave();
        return true;
    } catch (e) {
        console.error('❌ Ошибка сохранения:', e);
        return false;
    }
};

function debouncedCloudSave() {
    if (cloudSaveTimeout) clearTimeout(cloudSaveTimeout);
    cloudSaveTimeout = setTimeout(() => {
        cloudSaveTimeout = null;
        cloudSaveAsync();
    }, CLOUD_SAVE_DEBOUNCE);
}

window.flushCloudSave = function() {
    if (cloudSaveTimeout) {
        clearTimeout(cloudSaveTimeout);
        cloudSaveTimeout = null;
    }

    if (window.telegramCloud?.saveProgressCritical) {
        const cloudData = extractCloudData();
        if (cloudData) window.telegramCloud.saveProgressCritical(cloudData);
    } else {
        cloudSaveAsync();
    }
};

async function cloudSaveAsync() {
    if (!window.telegramCloud?.isAvailable || isOperationLocked || isSyncing) return;
    
    const now = Date.now();
    if (now - lastCloudSync < CLOUD_SYNC_COOLDOWN) return;

    const gs = window.gameState;
    // Защита от сохранения "пустышек"
    const hasRealData = gs?.coins > 0 || gs?.totalDamageDealt > 0 || gs?.clickUpgradeLevel > 0 || (gs?.currentLocation && gs.currentLocation !== 'mercury');
    if (!hasRealData && !gs?._isNewGame) return;

    isSyncing = true;
    try {
        const cloudData = extractCloudData();
        if (cloudData) {
            const result = await window.telegramCloud.saveProgress(cloudData);
            if (result?.success) {
                lastCloudSync = now;
                showSaveIndicator('☁️', 'Сохранено', '#4CAF50');
            } else {
                showSaveIndicator('⚠️', 'Ошибка', '#ff9800');
            }
        }
    } catch (e) {
        showSaveIndicator('❌', 'Ошибка', '#f44336');
    } finally {
        isSyncing = false;
    }
}

// ============================================
// ЗАГРУЗКА И СБРОС
// ============================================

window.loadGame = async function() {
    if (!window.telegramCloud?.isAvailable) return false;
    try {
        const result = await window.telegramCloud.loadProgress();
        if (!result?.success || !result.data) return false;
        
        applyCloudData(result.data);
        return true;
    } catch (e) {
        console.error('❌ Ошибка загрузки:', e);
        return false;
    }
};

window.cloudInit = async function() {
    if (!window.telegramCloud) return;
    try {
        const loaded = await window.loadGame();
        if (loaded) {
            if (window.GAME_UI?.updateHUD) window.GAME_UI.updateHUD();
            if (window.GAME_UI?.updateUpgradeButtons) window.GAME_UI.updateUpgradeButtons();
            if (window.showTooltip) {
                window.showTooltip('☁️ Прогресс синхронизирован!');
                setTimeout(() => window.hideTooltip && window.hideTooltip(), 2500);
            }
        } else {
            await cloudSaveAsync();
        }
    } catch (e) {
        console.warn(e);
    }
};

window.resetGame = function() {
    window.gameState = Object.assign({}, DEFAULT_GAME_STATE);
    window.gameMetrics = Object.assign({}, DEFAULT_GAME_METRICS);
    window.gameMetrics.startTime = Date.now();
    
    if (window.telegramCloud?.saveProgress) {
        window.telegramCloud.saveProgress(extractCloudData()).catch(() => {});
    }
    console.log('🔄 Прогресс обнулен локально и в облаке');
};

window.hasSave = async function() {
    if (!window.telegramCloud?.isAvailable) return false;
    try {
        const result = await window.telegramCloud.loadProgress();
        return result?.success && !!result.data;
    } catch { return false; }
};

// ============================================
// ВИЗУАЛЬНЫЙ ИНДИКАТОР СОХРАНЕНИЯ
// ============================================
function showSaveIndicator(icon = '💾', text = 'Сохранено', color = '#4CAF50') {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.classList.remove('save-pending', 'save-pulse-success', 'save-pulse-error');
        void saveBtn.offsetWidth; // Трюк с Reflow для перезапуска CSS-анимации
        saveBtn.classList.add(color === '#4CAF50' ? 'save-pulse-success' : 'save-pulse-error');
        setTimeout(() => saveBtn.classList.remove('save-pulse-success', 'save-pulse-error'), 1000);
    }

    let indicator = document.getElementById('saveIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'saveIndicator';
        indicator.style.cssText = 'position:absolute;top:55px;right:10px;padding:4px 8px;background:rgba(0,0,0,0.7);color:#4CAF50;border-radius:4px;font-size:0.75em;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;font-family:Orbitron,sans-serif;';
        document.body.appendChild(indicator);
    }
    indicator.textContent = `${icon} ${text}`;
    indicator.style.color = color;
    indicator.style.opacity = '1';

    clearTimeout(indicator._hideTimer);
    indicator._hideTimer = setTimeout(() => indicator.style.opacity = '0', 1500);
}

function startAutoSave() {
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    autoSaveTimer = setInterval(() => {
        if (window.gameState && window.gameState.gameActive) window.saveGame();
    }, AUTO_SAVE_INTERVAL);
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ
// ============================================
function init() {
    window.gameState = deepMerge(DEFAULT_GAME_STATE, window.gameState || {});
    window.gameMetrics = deepMerge(DEFAULT_GAME_METRICS, window.gameMetrics || {});
    
    startAutoSave();

    const forceSave = () => { if (window.gameState?.gameActive) window.flushCloudSave(); };
    window.addEventListener('beforeunload', forceSave);
    document.addEventListener('visibilitychange', () => { if (document.hidden) forceSave(); });

    console.log('💾 Автоматическая Save System v3.0 готова. Слияние исправлено.');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();
