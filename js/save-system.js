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
// ДЕФОЛТНЫЕ ДАННЫЕ
// ============================================
const DEFAULT_GAME_STATE = {
    coins: 0,
    clickPower: 1,
    critChance: 0.001,
    critMultiplier: 2.0,
    currentLocation: 'mercury',
    totalDamageDealt: 0,
    planetDamageDealt: 0,          // ✅ НОВОЕ — для прогресс-бара (сбрасывается)
    planetFirstBlockCleared: false, // ✅ НОВОЕ — защита эксплойта первого блока
    darkMatter: 0,                  // ✅ НОВОЕ — тёмная материя
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
    permanentBonuses: {},           // ✅ НОВОЕ — постоянные бонусы от планет
    unlockedLocations: ['mercury'],
    boboSkin: 'default',
    dailyBonus: {
        lastClaimDate: null,
        currentDay: 1,
        totalClaimed: 0,
        streak: 0
    }
};

const DEFAULT_GAME_METRICS = {
    startTime: 0,
    totalTimePlayed: 0,  
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
    planetStats: {}                 // ✅ НОВОЕ — планетарные метрики
};

// ============================================
// УТИЛИТЫ
// ============================================
function deepMerge(defaults, saved) {
    const result = Object.assign({}, defaults);
    for (const key in saved) {
        if (saved.hasOwnProperty(key)) {
            if (key in defaults) {
                if (
                    typeof defaults[key] === 'object' &&
                    defaults[key] !== null &&
                    !Array.isArray(defaults[key]) &&
                    typeof saved[key] === 'object' &&
                    saved[key] !== null &&
                    !Array.isArray(saved[key])
                ) {
                    result[key] = deepMerge(defaults[key], saved[key]);
                } else {
                    result[key] = saved[key];
                }
            } else {
                result[key] = saved[key];
            }
        }
    }
    return result;
}
// ============================================
// 🏆 ТРЕКЕР ЛИДЕРБОРДА (дельты за периоды)
// ============================================
function updateLeaderboardStats() {
    if (!window.gameState) return;
    const now = Date.now();
    const DAY = 86400000;      // 24 часа
    const WEEK = 7 * DAY;
    const MONTH = 30 * DAY;

    // Инициализация при первом запуске
    if (!window.gameState._lb) {
        window.gameState._lb = {
            dayStart: now,
            weekStart: now,
            monthStart: now,
            dayDamage: 0,
            weekDamage: 0,
            monthDamage: 0,
            _lastDamage: window.gameState.totalDamageDealt || 0
        };
    }
    const lb = window.gameState._lb;

    // Сдвиг окон (скользящее окно)
    if (now - lb.dayStart >= DAY) {
        lb.dayStart = now;
        lb.dayDamage = 0;
    }
    if (now - lb.weekStart >= WEEK) {
        lb.weekStart = now;
        lb.weekDamage = 0;
    }
    if (now - lb.monthStart >= MONTH) {
        lb.monthStart = now;
        lb.monthDamage = 0;
    }

    // Дельта урона с последнего сохранения
    const currentDamage = window.gameState.totalDamageDealt || 0;
    const delta = currentDamage - (lb._lastDamage || 0);
    if (delta > 0) {
        lb.dayDamage += delta;
        lb.weekDamage += delta;
        lb.monthDamage += delta;
    }
    lb._lastDamage = currentDamage;
}

function extractCloudData() {
    // ✅ Обновляем время в игре перед сохранением
    if (window.achievementsSystem?.updateTimePlayed) {
        window.achievementsSystem.updateTimePlayed();
    }
    
    if (!window.gameState) return null;
// ✅ Обновляем трекер перед отправкой
    updateLeaderboardStats();
    const planetOrder = window.GAME_CONFIG?.planetOrder || ['mercury'];
    const currentLevel = planetOrder.indexOf(window.gameState.currentLocation) + 1;

    const unlocked = [];
    for (let i = 0; i <= planetOrder.indexOf(window.gameState.currentLocation); i++) {
        unlocked.push(planetOrder[i]);
    }

    const username = (typeof window.getTelegramUsername === 'function')
        ? window.getTelegramUsername()
        : (window.telegramUser?.username ||
           window.telegramUser?.first_name ||
           'Anonymous');

    // ✅ Очистка runtime-счётчиков от мусора
    const cleanState = JSON.parse(JSON.stringify(window.gameState));
    delete cleanState._boboHitCounter;
    delete cleanState._boboCallCounter;
    delete cleanState._crystalIntervalStart;
    delete cleanState._crystalIntervalActive;
    return {
        crystals: Math.floor(window.gameState.coins || 0),
        level: currentLevel,
        score: Math.floor(window.gameState.totalDamageDealt || 0),
        unlocked_locations: unlocked,
        bobo_skin: window.gameState.boboSkin || 'default',
        username: username,
        timestamp: Date.now(),
        full_game_state: cleanState,
        full_game_metrics: JSON.parse(JSON.stringify(window.gameMetrics || {})),
        // ✅ НОВОЕ: данные для таблицы лидеров
        leaderboard: {

            currentLocation: window.gameState.currentLocation,
            totalDamage: Math.floor(window.gameState.totalDamageDealt || 0),
            dayDamage: Math.floor(window.gameState._lb?.dayDamage || 0),
            weekDamage: Math.floor(window.gameState._lb?.weekDamage || 0),
            monthDamage: Math.floor(window.gameState._lb?.monthDamage || 0),
            lastUpdate: Date.now()
        }
    };

function applyCloudData(cloudData) {
    if (!cloudData || !window.gameState) return;

    // ✅ НОВОЕ: Восстанавливаем gameMetrics
    if (cloudData.full_game_metrics && typeof cloudData.full_game_metrics === 'object') {
        window.gameMetrics = deepMerge(DEFAULT_GAME_METRICS, cloudData.full_game_metrics);
        if (!window.gameMetrics.planetStats) window.gameMetrics.planetStats = {};
        console.log('📊 [LOAD] gameMetrics восстановлен');
    }

    if (cloudData.full_game_state && typeof cloudData.full_game_state === 'object') {
        console.log('☁️ Применяем ПОЛНЫЙ gameState из облака');

        const currentGameActive = window.gameState.gameActive;
        const currentGamePaused = window.gameState.gamePaused;

        const cloudDailyBonus = cloudData.full_game_state.dailyBonus;
        window.gameState = deepMerge(DEFAULT_GAME_STATE, cloudData.full_game_state);

if (cloudData.leaderboard) {
    window.gameState._lb = {
        dayStart: Date.now(),
        weekStart: Date.now(),
        monthStart: Date.now(),
        dayDamage: cloudData.leaderboard.dayDamage || 0,
        weekDamage: cloudData.leaderboard.weekDamage || 0,
        monthDamage: cloudData.leaderboard.monthDamage || 0,
        _lastDamage: cloudData.leaderboard.totalDamage || 0
    };
}
        if (cloudDailyBonus) {
            window.gameState.dailyBonus = {
                lastClaimDate: cloudDailyBonus.lastClaimDate || null,
                currentDay: cloudDailyBonus.currentDay || 1,
                totalClaimed: cloudDailyBonus.totalClaimed || 0,
                streak: cloudDailyBonus.streak || 0
            };
        }

        window.gameState.gameActive = currentGameActive;
        window.gameState.gamePaused = currentGamePaused;
        window.gameState.helperActive = false;
        window.gameState.helperTimeLeft = 0;
        window.gameState.comboCount = 0;

        console.log('✅ Полный gameState применён');
        console.log('⚫ Dark Matter:', window.gameState.darkMatter);
        console.log('🌟 Permanent Bonuses:', Object.keys(window.gameState.permanentBonuses || {}));
        return;
    }

    console.log('⚠️ Используем старый формат данных');

    if (cloudData.crystals !== undefined) {
        window.gameState.coins = cloudData.crystals;
    }
    if (cloudData.score !== undefined) {
        window.gameState.totalDamageDealt = cloudData.score;
    }
    if (cloudData.bobo_skin) {
        window.gameState.boboSkin = cloudData.bobo_skin;
    }
}

// ============================================
// 💾 СОХРАНЕНИЕ В ОБЛАКО
// ============================================
window.saveGame = function() {
    try {
        if (!window.gameState || !window.gameMetrics) {
            console.warn('⚠️ saveGame: gameState или gameMetrics не инициализированы');
            return false;
        }

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
        console.error('❌ Ошибка сохранения игры:', e);
        return false;
    }
};

function debouncedCloudSave() {
    if (cloudSaveTimeout) {
        clearTimeout(cloudSaveTimeout);
    }
    cloudSaveTimeout = setTimeout(() => {
        cloudSaveTimeout = null;
        cloudSaveAsync();
    }, CLOUD_SAVE_DEBOUNCE);
}

window.flushCloudSave = function() {
    if (typeof cloudSaveTimeout !== 'undefined' && cloudSaveTimeout) {
        clearTimeout(cloudSaveTimeout);
        cloudSaveTimeout = null;
    }
    if (window.telegramCloud?.saveProgressCritical) {
        const cloudData = extractCloudData();
        if (cloudData) {
            window.telegramCloud.saveProgressCritical(cloudData);
        }
    } else {
        cloudSaveAsync();
    }
};

async function cloudSaveAsync() {
    if (!window.telegramCloud?.isAvailable) {
        console.warn('⚠️ [CLOUD] Облако недоступно');
        return;
    }
    if (isOperationLocked) return;

    const now = Date.now();
    if (now - lastCloudSync < CLOUD_SYNC_COOLDOWN) return;

    if (isSyncing) return;

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
        console.warn('⚠️ Ошибка облачной синхронизации:', e);
        showSaveIndicator('❌', 'Ошибка', '#f44336');
    } finally {
        isSyncing = false;
    }
}

// ============================================
// 📥 ЗАГРУЗКА ИЗ ОБЛАКА
// ============================================
window.loadGame = async function() {
    if (!window.telegramCloud?.isAvailable) {
        console.warn('⚠️ [LOAD] Облако недоступно');
        return false;
    }
    try {
        const result = await window.telegramCloud.loadProgress();

        if (!result?.success || !result.data) {
            console.log('ℹ️ [LOAD] Облако пустое — начинаем новую игру');
            return false;
        }

        const cloudData = result.data;
        applyCloudData(cloudData);

        console.log('✅ [LOAD] Игра загружена из облака');
        return true;
    } catch (e) {
        console.error('❌ Ошибка загрузки из облака:', e);
        return false;
    }
};

window.cloudInit = async function() {
    if (!window.telegramCloud) {
        console.log('ℹ️ Telegram Cloud не инициализирован');
        return;
    }
    try {
        const loaded = await window.loadGame();

        if (loaded) {
            // ✅ ИСПРАВЛЕНО: window.UI → window.GAME_UI
            if (window.GAME_UI?.updateHUD) window.GAME_UI.updateHUD();
            if (window.GAME_UI?.updateUpgradeButtons) window.GAME_UI.updateUpgradeButtons();

            if (window.showTooltip) {
                window.showTooltip('☁️ Данные загружены из облака!');
                setTimeout(() => window.hideTooltip && window.hideTooltip(), 2500);
            }

            if (window.telegramHaptic?.success) {
                window.telegramHaptic.success();
            }
        } else {
            console.log('ℹ️ Облако пустое — начинаем с дефолтными данными');
            await cloudSaveAsync();
        }
    } catch (e) {
        console.warn('⚠️ Ошибка cloudInit:', e);
    }
};

// ============================================
// 🔄 СБРОС И ПРОВЕРКИ
// ============================================
window.resetGame = function() {
    window.gameState = Object.assign({}, DEFAULT_GAME_STATE);
    window.gameMetrics = Object.assign({}, DEFAULT_GAME_METRICS);
    window.gameMetrics.startTime = Date.now();
    window.gameMetrics.sessions = 1;

    if (window.telegramCloud?.saveProgress) {
        const resetData = extractCloudData();
        window.telegramCloud.saveProgress(resetData).catch(() => {});
    }

    console.log('🔄 Прогресс сброшен (в облаке)');
};

window.hasSave = async function() {
    if (!window.telegramCloud?.isAvailable) return false;
    try {
        const result = await window.telegramCloud.loadProgress();
        return result?.success && !!result.data;
    } catch {
        return false;
    }
};

// ============================================
// 💾 ИНДИКАТОР СОХРАНЕНИЯ
// ============================================
function showSaveIndicator(icon = '💾', text = 'Сохранено', color = '#4CAF50') {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.classList.remove('save-pending', 'save-pulse-success', 'save-pulse-error');
        void saveBtn.offsetWidth;

        const isSuccess = !color || color === '#4CAF50';

        if (isSuccess) {
            saveBtn.classList.add('save-pulse-success');
        } else {
            saveBtn.classList.add('save-pulse-error');
        }

        setTimeout(() => {
            saveBtn.classList.remove('save-pulse-success', 'save-pulse-error');
        }, 1000);
    }

    let indicator = document.getElementById('saveIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'saveIndicator';
        indicator.style.cssText = 'position:absolute;top:55px;right:10px;padding:4px 8px;background:rgba(0,0,0,0.7);color:#4CAF50;border-radius:4px;font-size:0.75em;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;font-family:Orbitron,sans-serif;letter-spacing:0.5px;';
        document.body.appendChild(indicator);
    }

    indicator.textContent = `${icon} ${text}`;
    indicator.style.color = color;
    indicator.style.opacity = '1';

    clearTimeout(indicator._hideTimer);
    indicator._hideTimer = setTimeout(() => {
        indicator.style.opacity = '0';
    }, 1500);
}

// ============================================
// ⏱️ АВТОСОХРАНЕНИЕ
// ============================================
function startAutoSave() {
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    autoSaveTimer = setInterval(() => {
        if (window.gameState && window.gameState.gameActive) {
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
