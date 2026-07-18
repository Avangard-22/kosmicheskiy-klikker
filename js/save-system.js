// js/save-system.js (v4.1 — Гарантированная целостность данных для Yandex Cloud)
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
    planetDamageDealt: 0,
    darkMatter: 0,          // ✅ ДОБАВЛЕНО: критично для сохранения
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
    dailyBonus: { lastClaimDate: null, currentDay: 1, totalClaimed: 0, streak: 0 },
    achievementsV2: {},
    skipPenaltyState: { activated: false, skipCount: 0, rollbackCount: 0, activationDistance: 0, totalRolledBack: 0 }
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
    visitedPlanets: [],
    currentPerfectStreak: 0,
    currentCritStreak: 0,
    planetStats: {}
};

// ============================================
// УТИЛИТЫ
// ============================================
function deepMerge(defaults, saved) {
    if (typeof saved !== 'object' || saved === null) return saved;
    if (Array.isArray(saved)) return [...saved];
    const result = Object.assign({}, defaults || {});
    for (const key in saved) {
        if (saved.hasOwnProperty(key)) {
            if (typeof saved[key] === 'object' && saved[key] !== null && !Array.isArray(saved[key])) {
                result[key] = deepMerge(defaults ? defaults[key] : {}, saved[key]);
            } else {
                result[key] = saved[key];
            }
        }
    }
    return result;
}

// ═══════════════════════════════════════════════════
// 🏗️ ОБЕСПЕЧЕНИЕ СТРУКТУРЫ ДАННЫХ
// ═══════════════════════════════════════════════════

function ensurePlanetStatsStructure() {
    if (!window.gameMetrics) window.gameMetrics = {};
    if (!window.gameMetrics.planetStats) window.gameMetrics.planetStats = {};
    
    const planetOrder = window.GAME_CONFIG?.planetOrder || ['mercury'];
    const planetTemplate = {
        blocks: 0, crits: 0, combo: 0, rare: 0, damageDealt: 0,
        crystalsEarned: 0, boboActivations: 0, boboDamage: 0,
        boboCrystalsEarned: 0, upgrades: 0, timePlayed: 0,
        fastestBlock: 0, maxCritStreak: 0
    };
    
    planetOrder.forEach(planet => {
        if (!window.gameMetrics.planetStats[planet]) {
            window.gameMetrics.planetStats[planet] = Object.assign({}, planetTemplate);
        } else {
            const stats = window.gameMetrics.planetStats[planet];
            for (const key in planetTemplate) {
                if (stats[key] === undefined) stats[key] = planetTemplate[key];
            }
        }
    });
}

function ensureAchievementsV2Structure() {
    if (!window.gameState) window.gameState = {};
    if (!window.gameState.achievementsV2) window.gameState.achievementsV2 = {};
    
    const planetOrder = window.GAME_CONFIG?.planetOrder || ['mercury'];
    const achTemplate = { rank: 0, totalUnlocked: 0, metrics: {}, masterUnlocked: false };
    
    planetOrder.forEach(planet => {
        if (!window.gameState.achievementsV2[planet]) {
            window.gameState.achievementsV2[planet] = Object.assign({}, achTemplate);
        } else {
            const ach = window.gameState.achievementsV2[planet];
            if (ach.rank === undefined) ach.rank = 0;
            if (ach.totalUnlocked === undefined) ach.totalUnlocked = 0;
            if (!ach.metrics) ach.metrics = {};
            if (ach.masterUnlocked === undefined) ach.masterUnlocked = false;
        }
    });
}

function ensureSkipPenaltyState() {
    if (!window.gameState) return;
    if (!window.gameState.skipPenaltyState) {
        window.gameState.skipPenaltyState = { activated: false, skipCount: 0, rollbackCount: 0, activationDistance: 0, totalRolledBack: 0 };
    }
}

function reconstructMetricsFromAchievements() {
    if (!window.gameState || !window.gameMetrics) return;
    
    ensurePlanetStatsStructure();
    ensureAchievementsV2Structure();
    ensureSkipPenaltyState();
    
    const gm = window.gameMetrics;
    const ach = window.gameState.achievementsV2;
    if (!ach || !gm.planetStats) return;
    
    const mapping = {
        blocks: 'blocks', crits: 'crits', combo: 'combo', rare: 'rare',
        damage: 'damageDealt', crystals: 'crystalsEarned', bobo: 'boboActivations',
        boboDmg: 'boboDamage', boboCrystals: 'boboCrystalsEarned',
        upgrades: 'upgrades', time: 'timePlayed', speed: 'fastestBlock', critStreak: 'maxCritStreak'
    };
    
    for (const planet in ach) {
        const planetStats = gm.planetStats[planet];
        if (!planetStats || !ach[planet].metrics) continue;
        
        for (const [metricKey, statField] of Object.entries(mapping)) {
            if (!ach[planet].metrics[metricKey]) ach[planet].metrics[metricKey] = { level: 0, progress: 0 };
            
            const realValue = planetStats[statField] || 0;
            if (realValue > (ach[planet].metrics[metricKey].progress || 0)) {
                ach[planet].metrics[metricKey].progress = realValue;
            }
        }
    }
}

// ============================================
// ☁️ ИЗВЛЕЧЕНИЕ ДАННЫХ ДЛЯ ОБЛАКА
// ============================================
function extractCloudData() {
    if (!window.gameState) return null;
    
    // ✅ Глубокая очистка: удаляем функции, undefined и служебные поля перед отправкой
    const cleanState = JSON.parse(JSON.stringify(window.gameState));
    const cleanMetrics = JSON.parse(JSON.stringify(window.gameMetrics || {}));
    
    // Удаляем временные флаги, которые не нужно сохранять
    delete cleanState._isNewGame;
    
    const planetOrder = window.GAME_CONFIG?.planetOrder || ['mercury'];
    const currentLocation = cleanState.currentLocation || 'mercury';
    const currentLevel = planetOrder.indexOf(currentLocation) + 1;
    
    const username = (typeof window.getTelegramUsername === 'function') 
        ? window.getTelegramUsername()
        : (window.telegramUser?.username || window.telegramUser?.first_name || 'Anonymous');
        
    const payload = {
        crystals: Math.floor(cleanState.coins || 0),
        level: currentLevel,
        score: Math.floor(cleanState.totalDamageDealt || 0),
        dark_matter: Math.floor(cleanState.darkMatter || 0), // ✅ Явно добавляем для бэкенда
        bobo_skin: cleanState.boboSkin || 'default',
        username: username,
        timestamp: Date.now(),
        full_game_state: cleanState,
        full_game_metrics: cleanMetrics
    };
    
    console.log('☁️ [SAVE] Payload готов к отправке:', {
        crystals: payload.crystals,
        dark_matter: payload.dark_matter,
        level: payload.level,
        stateKeys: Object.keys(cleanState).length,
        metricsKeys: Object.keys(cleanMetrics).length
    });
    
    return payload;
}

// ============================================
// 📥 ПРИМЕНЕНИЕ ДАННЫХ ИЗ ОБЛАКА
// ============================================
function applyCloudData(cloudData) {
    if (!cloudData) {
        console.warn('⚠️ [LOAD] cloudData пустой');
        return;
    }
    
    console.log('☁️ [LOAD] Получены данные из облака:', {
        hasState: !!cloudData.full_game_state,
        hasMetrics: !!cloudData.full_game_metrics,
        darkMatter: cloudData.full_game_state?.darkMatter,
        achievementsV2: !!cloudData.full_game_state?.achievementsV2
    });

    if (cloudData.full_game_state) {
        console.log('☁️ [LOAD] Накатываем gameState...');
        const currentGameActive = window.gameState?.gameActive || false;
        const currentGamePaused = window.gameState?.gamePaused || false;
        
        window.gameState = deepMerge(DEFAULT_GAME_STATE, cloudData.full_game_state);
        
        // Восстанавливаем флаги, которые не должны перезаписываться при загрузке
        window.gameState.gameActive = currentGameActive;
        window.gameState.gamePaused = currentGamePaused;
        window.gameState.helperActive = false;
        window.gameState.helperTimeLeft = 0;
        window.gameState.comboCount = 0;
        
        // ✅ Явная гарантия наличия критичных новых полей (защита от старых сейвов)
        if (window.gameState.darkMatter === undefined) window.gameState.darkMatter = 0;
        if (window.gameState.planetDamageDealt === undefined) window.gameState.planetDamageDealt = 0;
        if (!window.gameState.achievementsV2) window.gameState.achievementsV2 = {};
        if (!window.gameState.skipPenaltyState) window.gameState.skipPenaltyState = { activated: false, skipCount: 0, rollbackCount: 0, activationDistance: 0, totalRolledBack: 0 };
        
        console.log('☁️ [LOAD] gameState восстановлен. darkMatter:', window.gameState.darkMatter, 'планет в achievementsV2:', Object.keys(window.gameState.achievementsV2).length);
    }
    
    if (cloudData.full_game_metrics) {
        console.log('📊 [LOAD] Накатываем gameMetrics...');
        window.gameMetrics = deepMerge(DEFAULT_GAME_METRICS, cloudData.full_game_metrics);
        
        if (!window.gameMetrics.planetStats) window.gameMetrics.planetStats = {};
        
        console.log('📊 [LOAD] planetStats загружен:', Object.keys(window.gameMetrics.planetStats).length, 'планет');
    } else {
        console.warn('⚠️ [LOAD] full_game_metrics отсутствует, создаём заново');
        window.gameMetrics = Object.assign({}, DEFAULT_GAME_METRICS);
    }
    
    // ✅ Перестраиваем и гарантируем структуры
    ensurePlanetStatsStructure();
    ensureAchievementsV2Structure();
    ensureSkipPenaltyState();
    reconstructMetricsFromAchievements();
    
    console.log('✅ [LOAD] Загрузка завершена успешно');
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
    // ✅ ИСПРАВЛЕНО: добавлена проверка darkMatter, чтобы не пропускать сохранение, если кристаллы потрачены на него
    const hasRealData = (gs?.coins || 0) > 0 || 
                        (gs?.totalDamageDealt || 0) > 0 || 
                        (gs?.clickUpgradeLevel || 0) > 0 || 
                        (gs?.darkMatter || 0) > 0 || 
                        (gs?.currentLocation && gs.currentLocation !== 'mercury');
    const isNewGame = gs?._isNewGame === true;
    
    if (!hasRealData && !isNewGame) {
        console.log('☁️ [SAVE] Пропуск: нет реальных данных и это не новая игра');
        return;
    }
    
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
        showSaveIndicator('❌', 'Ошибка сети', '#f44336');
    } finally {
        isSyncing = false;
    }
}

// ============================================
// ЗАГРУЗКА И СБРОС
// ============================================
window.loadGame = async function() {
    try {
        if (!window.telegramCloud?.isAvailable) {
            console.warn('⚠️ [LOAD] Облако недоступно. Начинаем новую игру.');
            return false;
        }
        
        const result = await window.telegramCloud.loadProgress();
        
        if (result?.success && result.data) {
            console.log('☁️ [LOAD] Данные загружены из облака');
            applyCloudData(result.data);
            return true;
        } else {
            console.log('☁️ [LOAD] Облако пустое. Начинаем новую игру.');
            return false;
        }
    } catch (e) {
        console.error('❌ [LOAD] Ошибка загрузки из облака:', e);
        return false;
    }
};

window.cloudInit = async function() {
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
        
        if (window.EventBus) {
            window.EventBus.emit('save:ready');
            console.log('📡 [SAVE] Эмитировано событие save:ready');
        }
    } catch (e) {
        console.warn(e);
    }
};

window.resetGame = function() {
    window.gameState = Object.assign({}, DEFAULT_GAME_STATE);
    window.gameMetrics = Object.assign({}, DEFAULT_GAME_METRICS);
    window.gameMetrics.startTime = Date.now();
    
    window.gameState._isNewGame = true;
    
    if (window.telegramCloud?.saveProgress) {
        const emptyData = extractCloudData();
        if (emptyData) {
            window.telegramCloud.saveProgress(emptyData)
                .then(() => console.log('☁️ [RESET] Облако очищено'))
                .catch((e) => console.error('❌ [RESET] Ошибка очистки облака:', e));
        }
    }
    console.log('🔄 Прогресс обнулен в облаке');
};

window.hasSave = async function() {
    if (!window.telegramCloud?.isAvailable) return false;
    try {
        const result = await window.telegramCloud.loadProgress();
        return result?.success && !!result.data;
    } catch (e) {
        console.warn('⚠️ [HAS-SAVE] Ошибка проверки облака:', e);
        return false;
    }
};

// ============================================
// ВИЗУАЛЬНЫЙ ИНДИКАТОР
// ============================================
function showSaveIndicator(icon = '💾', text = 'Сохранено', color = '#4CAF50') {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.classList.remove('save-pending', 'save-pulse-success', 'save-pulse-error');
        void saveBtn.offsetWidth;
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
// ИНИЦИАЛИЗАЦИЯ
// ============================================
function init() {
    window.gameState = deepMerge(DEFAULT_GAME_STATE, window.gameState || {});
    window.gameMetrics = deepMerge(DEFAULT_GAME_METRICS, window.gameMetrics || {});
    
    ensurePlanetStatsStructure();
    ensureAchievementsV2Structure();
    ensureSkipPenaltyState();
    
    reconstructMetricsFromAchievements();
    startAutoSave();
    
    const forceSave = () => { if (window.gameState?.gameActive) window.flushCloudSave(); };
    window.addEventListener('beforeunload', forceSave);
    document.addEventListener('visibilitychange', () => { if (document.hidden) forceSave(); });
    
    console.log('💾 Save System v4.1 готова (Гарантированная целостность для Yandex Cloud)');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();
