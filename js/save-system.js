// js/save-system.js (v3.1 — Защита от рассинхронизации метрик)
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
// УТИЛИТЫ АВТОМАТИЗАЦИИ И ЗАЩИТЫ
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

// Аварийное восстановление метрик на основе накопленного прогресса ачивок
function reconstructMetricsFromAchievements() {
    if (!window.gameState) return;
    if (!window.gameMetrics) window.gameMetrics = Object.assign({}, DEFAULT_GAME_METRICS);
    
    const gm = window.gameMetrics;
    const ach = window.gameState.achievements || {};
    let healed = false;

    console.log('⚙️ [SAVE-SYSTEM] Верификация корректности игровых метрик против достижений...');

    // 1. Проверка общих кликов (clickMaster)
    if (ach.clickMaster && typeof ach.clickMaster.progress === 'number') {
        if ((gm.totalClicks || 0) < ach.clickMaster.progress) {
            gm.totalClicks = ach.clickMaster.progress;
            healed = true;
        }
    }
    // 2. Проверка времени в игре (timeInvestor)
    if (ach.timeInvestor && typeof ach.timeInvestor.progress === 'number') {
        if ((gm.totalTimePlayed || 0) < ach.timeInvestor.progress) {
            gm.totalTimePlayed = ach.timeInvestor.progress;
            healed = true;
        }
    }
    // 3. Проверка уничтоженных блоков (учитываем возможные вариации ключей ID ачивок)
    const blockAch = ach.blockSmasher || ach.blockMaster || ach.stoneBreaker;
    if (blockAch && typeof blockAch.progress === 'number') {
        if ((gm.blocksDestroyed || 0) < blockAch.progress) {
            gm.blocksDestroyed = blockAch.progress;
            healed = true;
        }
    }
    // 4. Проверка заработанного золота/кристаллов
    const coinAch = ach.treasureHunter || ach.coinCollector;
    if (coinAch && typeof coinAch.progress === 'number') {
        if ((gm.totalCoinsEarned || 0) < coinAch.progress) {
            gm.totalCoinsEarned = coinAch.progress;
            healed = true;
        }
    }
    // 5. Проверка максимального комбо
    const comboAch = ach.comboKing || ach.comboMaster;
    if (comboAch && typeof comboAch.progress === 'number') {
        if ((gm.maxCombo || 0) < comboAch.progress) {
            gm.maxCombo = comboAch.progress;
            healed = true;
        }
    }

    // Подсчет купленных апгрейдов на основе текущих уровней gameState
    const currentUpgradesCount = 
        (window.gameState.clickUpgradeLevel || 0) + 
        (window.gameState.critChanceUpgradeLevel || 0) + 
        (window.gameState.critMultiplierUpgradeLevel || 0) + 
        (window.gameState.helperUpgradeLevel || 0);
        
    if ((gm.upgradesBought || 0) < currentUpgradesCount) {
        gm.upgradesBought = currentUpgradesCount;
        healed = true;
    }

    if (healed) {
        console.warn('⚠️ [SAVE-SYSTEM] Обнаружен сбой или старая версия сохранения! Метрики успешно восстановлены:', gm);
    } else {
        console.log('✅ [SAVE-SYSTEM] Проверка пройдена: метрики соответствуют прогрессу достижений.');
    }
}

function extractCloudData() {
    if (!window.gameState) return null;
    
    const planetOrder = window.GAME_CONFIG?.PLANET_ORDER || ['mercury'];
    const currentLevel = planetOrder.indexOf(window.gameState.currentLocation) + 1;
    
    const username = (typeof window.getTelegramUsername === 'function') 
        ? window.getTelegramUsername()
        : (window.telegramUser?.username || window.telegramUser?.first_name || 'Anonymous');

    return {
        crystals: Math.floor(window.gameState.coins || 0),
        level: currentLevel,
        score: Math.floor(window.gameState.totalDamageDealt || 0),
        bobo_skin: window.gameState.boboSkin || 'default',
        username: username,
        timestamp: Date.now(),
        
        full_game_state: JSON.parse(JSON.stringify(window.gameState)),
        full_game_metrics: JSON.parse(JSON.stringify(window.gameMetrics || {}))
    };
}

function applyCloudData(cloudData) {
    if (!cloudData) return;
    
    // Восстановление GameState
    if (cloudData.full_game_state) {
        console.log('☁️ [LOAD] Накатываем gameState...');
        const currentGameActive = window.gameState?.gameActive || false;
        const currentGamePaused = window.gameState?.gamePaused || false;
        
        window.gameState = deepMerge(DEFAULT_GAME_STATE, cloudData.full_game_state);
        
        window.gameState.gameActive = currentGameActive;
        window.gameState.gamePaused = currentGamePaused;
        window.gameState.helperActive = false;
        window.gameState.helperTimeLeft = 0;
        window.gameState.comboCount = 0;
    }
    
    // Восстановление метрик
    if (cloudData.full_game_metrics) {
        console.log('📊 [LOAD] Накатываем gameMetrics...');
        window.gameMetrics = deepMerge(DEFAULT_GAME_METRICS, cloudData.full_game_metrics);
    }
    
    // КРИТИЧЕСКИЙ ФИКС: Запускаем принудительный щит ресинхронизации
    reconstructMetricsFromAchievements();
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

        // КРИТИЧЕСКИЙ ФИКС: Мгновенное дублирование сейва в LocalStorage как локальный буфер
        const localSnapshot = extractCloudData();
        if (localSnapshot) {
            localStorage.setItem('cosmicClicker_localBackup', JSON.stringify(localSnapshot));
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
                showSaveIndicator('⚠️', 'Локально', '#ff9800');
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
    let loadedFromCloud = false;
    
    // 1. Попытка загрузки из основного Telegram Cloud шлюза
    try {
        if (window.telegramCloud?.isAvailable) {
            const result = await window.telegramCloud.loadProgress();
            if (result?.success && result.data) {
                applyCloudData(result.data);
                localStorage.setItem('cosmicClicker_localBackup', JSON.stringify(result.data));
                loadedFromCloud = true;
                return true;
            }
        }
    } catch (e) {
        console.error('❌ Ошибка загрузки из облака Telegram:', e);
    }

    // 2. Локальный фаллбэк, если облако недоступно, выдало ошибку или пустое
    try {
        const localRaw = localStorage.getItem('cosmicClicker_localBackup');
        if (localRaw) {
            const localData = JSON.parse(localRaw);
            console.log('💾 [LOAD] Аварийный запуск: применен бэкап из LocalStorage');
            applyCloudData(localData);
            return true;
        }
    } catch (err) {
        console.error('❌ Ошибка чтения локального бэкапа LocalStorage:', err);
    }

    return loadedFromCloud;
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
    } catch (e) {
        console.warn(e);
    }
};

window.resetGame = function() {
    window.gameState = Object.assign({}, DEFAULT_GAME_STATE);
    window.gameMetrics = Object.assign({}, DEFAULT_GAME_METRICS);
    window.gameMetrics.startTime = Date.now();
    
    localStorage.removeItem('cosmicClicker_localBackup');
    
    if (window.telegramCloud?.saveProgress) {
        window.telegramCloud.saveProgress(extractCloudData()).catch(() => {});
    }
    console.log('🔄 Прогресс обнулен локально и в облаке');
};

window.hasSave = async function() {
    if (localStorage.getItem('cosmicClicker_localBackup')) return true;
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
// ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ
// ============================================
function init() {
    window.gameState = deepMerge(DEFAULT_GAME_STATE, window.gameState || {});
    window.gameMetrics = deepMerge(DEFAULT_GAME_METRICS, window.gameMetrics || {});
    
    // Дополнительная валидация на старте сессии
    reconstructMetricsFromAchievements();
    
    startAutoSave();

    const forceSave = () => { if (window.gameState?.gameActive) window.flushCloudSave(); };
    window.addEventListener('beforeunload', forceSave);
    document.addEventListener('visibilitychange', () => { if (document.hidden) forceSave(); });

    console.log('💾 Автоматическая Save System v3.1 готова. Метрики под защитой.');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();
