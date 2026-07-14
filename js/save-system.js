// js/save-system.js (v4.0 — ТОЛЬКО серверное сохранение)
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
    dailyBonus: { lastClaimDate: null, currentDay: 1, totalClaimed: 0, streak: 0 },
    
    // ✅ НОВОЕ: Состояние системы достижений v2 (контекстные карточки)
    achievementsV2: {
        mercury: {
            rank: 0,
            totalUnlocked: 0,
            metrics: {},
            masterUnlocked: false
        }
        // Остальные планеты будут добавляться динамически по мере масштабирования
    }
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
    currentPerfectStreak: 0,  // ✅ НОВОЕ: Сбрасывается при пропуске блока
    
    // ✅ НОВОЕ: Планетарные метрики для всех 12 типов достижений
    planetStats: {
        mercury: {
            blocks: 0,
            crits: 0,
            combo: 0,
            rare: 0,
            crystalsEarned: 0,    // НОВОЕ: crystals
            boboActivations: 0,   // НОВОЕ: bobo
            boboDamage: 0,        // НОВОЕ: boboDmg
            timePlayed: 0,        // НОВОЕ: time (секунды)
            fastestBlock: 0,      // НОВОЕ: speed (мс, меньше = лучше)
            bestAccuracy: 0,      // НОВОЕ: accuracy (%)
            maxPerfectStreak: 0   // НОВОЕ: perfect (рекорд серии)
        }
        // Остальные планеты будут создаваться динамически при первой игре
    }
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

function reconstructMetricsFromAchievements() {
    if (!window.gameState) return;
    if (!window.gameMetrics) window.gameMetrics = Object.assign({}, DEFAULT_GAME_METRICS);
    const gm = window.gameMetrics;
    const ach = window.gameState.achievements || {};
    let healed = false;
    console.log('⚙️ [SAVE-SYSTEM] Верификация корректности игровых метрик...');
    
    if (ach.clickMaster && typeof ach.clickMaster.progress === 'number') {
        if ((gm.totalClicks || 0) < ach.clickMaster.progress) {
            gm.totalClicks = ach.clickMaster.progress;
            healed = true;
        }
    }
    
    if (ach.timeInvestor && typeof ach.timeInvestor.progress === 'number') {
        if ((gm.totalTimePlayed || 0) < ach.timeInvestor.progress) {
            gm.totalTimePlayed = ach.timeInvestor.progress;
            healed = true;
        }
    }
    
    const currentUpgradesCount = 
        (window.gameState.clickUpgradeLevel || 0) + 
        (window.gameState.critChanceUpgradeLevel || 0) + 
        (window.gameState.critMultiplierUpgradeLevel || 0) + 
        (window.gameState.helperUpgradeLevel || 0);
    if ((gm.upgradesBought || 0) < currentUpgradesCount) {
        gm.upgradesBought = currentUpgradesCount;
        healed = true;
    }
    
    // ✅ НОВОЕ: Верификация achievementsV2
    // Синхронизируем прогресс метрик с реальными значениями из planetStats
    if (window.gameState?.achievementsV2 && gm.planetStats) {
        let v2Healed = false;
        const ach = window.gameState.achievementsV2;
        
        // Для каждой планеты в достижениях
        for (const planet in ach) {
            if (!ach[planet] || !ach[planet].metrics) continue;
            const planetStats = gm.planetStats[planet];
            if (!planetStats) continue;
            
            const metrics = ach[planet].metrics;
            
            // Маппинг полей planetStats → ключей метрик
            const mapping = {
                blocks:   'blocks',
                crits:    'crits',
                combo:    'combo',
                rare:     'rare',
                crystals: 'crystalsEarned',
                bobo:     'boboActivations',
                boboDmg:  'boboDamage',
                time:     'timePlayed',
                speed:    'fastestBlock',
                accuracy: 'bestAccuracy',
                perfect:  'maxPerfectStreak'
            };
            
            for (const [metricKey, statField] of Object.entries(mapping)) {
                if (!metrics[metricKey]) {
                    metrics[metricKey] = { level: 0, progress: 0 };
                }
                
                const realValue = planetStats[statField] || 0;
                const savedProgress = metrics[metricKey].progress || 0;
                
                // Если реальное значение больше сохранённого — восстанавливаем
                if (realValue > savedProgress) {
                    metrics[metricKey].progress = realValue;
                    v2Healed = true;
                    healed = true;
                }
            }
        }
        
        if (v2Healed) {
            console.warn('⚠️ [SAVE-SYSTEM] achievementsV2 синхронизированы с planetStats');
        }
    }
    
    if (healed) {
        console.warn('⚠️ [SAVE-SYSTEM] Метрики восстановлены:', gm);
    } else {
        console.log('✅ [SAVE-SYSTEM] Метрики корректны.');
    }
}

function extractCloudData() {
    if (!window.gameState) return null;
    const planetOrder = window.GAME_CONFIG?.planetOrder || ['mercury'];
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

// ЧТО: Применение данных из облака к gameState
// КУДА: save-system.js → applyCloudData()
// ЗАЧЕМ: Восстанавливает состояние игры из облачного сохранения
function applyCloudData(cloudData) {
    if (!cloudData) return;
    
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
    
    if (cloudData.full_game_metrics) {
        console.log('📊 [LOAD] Накатываем gameMetrics...');
        window.gameMetrics = deepMerge(DEFAULT_GAME_METRICS, cloudData.full_game_metrics);
    }
    
    reconstructMetricsFromAchievements();
}

// ============================================
// ПУБЛИЧНЫЙ API СОХРАНЕНИЯ
// ============================================

// ЧТО: Сохранение ТОЛЬКО в облако (без localStorage)
// КУДА: save-system.js → window.saveGame()
// ЗАЧЕМ: Игра работает через Telegram Bot. Локальное сохранение создавало
//        конфликты. Только облако = единый источник правды.
window.saveGame = function() {
    try {
        if (!window.gameState) return false;
        
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn && !saveBtn.classList.contains('save-pulse-success')) {
            saveBtn.classList.add('save-pending');
        }
        
        // ❌ УБРАНО: localStorage (работаем только с облаком)
        
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

// ЧТО: Асинхронное сохранение в облако с проверкой _isNewGame
// КУДА: save-system.js → cloudSaveAsync()
// ЗАЧЕМ: Если игрок нажал "Новая игра", _isNewGame=true позволяет сохранить
//        пустой сейв в облако, чтобы перезатереть старый прогресс.
async function cloudSaveAsync() {
    if (!window.telegramCloud?.isAvailable || isOperationLocked || isSyncing) return;
    
    const now = Date.now();
    if (now - lastCloudSync < CLOUD_SYNC_COOLDOWN) return;
    
    const gs = window.gameState;
    const hasRealData = gs?.coins > 0 || gs?.totalDamageDealt > 0 || gs?.clickUpgradeLevel > 0 || (gs?.currentLocation && gs.currentLocation !== 'mercury');
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

// ЧТО: Загрузка ТОЛЬКО из облака (без localStorage fallback)
// КУДА: save-system.js → window.loadGame()
// ЗАЧЕМ: Игра работает через Telegram Bot. Если облако недоступно или пустое —
//        начинаем новую игру. Локальный бэкап создавал конфликты.
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
        console.warn('⚠️ [LOAD] Начинаем новую игру из-за ошибки облака');
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
        
        // ✅ НОВОЕ: Сигнализируем о готовности gameState
        if (window.EventBus) {
            window.EventBus.emit('save:ready');
            console.log('📡 [SAVE] Эмитировано событие save:ready');
        }
    } catch (e) {
        console.warn(e);
    }
};

// ЧТО: Сброс прогресса с очисткой облака
// КУДА: save-system.js → window.resetGame()
// ЗАЧЕМ: При нажатии "Новая игра" отправляем пустой сейв в облако,
//        чтобы перезаписать старый прогресс. Флаг _isNewGame гарантирует сохранение.
window.resetGame = function() {
    window.gameState = Object.assign({}, DEFAULT_GAME_STATE);
    window.gameMetrics = Object.assign({}, DEFAULT_GAME_METRICS);
    window.gameMetrics.startTime = Date.now();
    
    // ✅ Флаг новой игры для принудительного сохранения в облако
    window.gameState._isNewGame = true;
    
    // ❌ УБРАНО: localStorage.removeItem (не используем localStorage)
    
    // Отправляем пустой прогресс в облако
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
    reconstructMetricsFromAchievements();
    startAutoSave();
    
    const forceSave = () => { if (window.gameState?.gameActive) window.flushCloudSave(); };
    window.addEventListener('beforeunload', forceSave);
    document.addEventListener('visibilitychange', () => { if (document.hidden) forceSave(); });
    
    console.log('💾 Save System v4.0 готова (ТОЛЬКО сервер, без localStorage)');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();