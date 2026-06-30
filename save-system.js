// js/save-system.js
(function() {
'use strict';

// ============================================
// КОНСТАНТЫ
// ============================================
const AUTO_SAVE_INTERVAL = 30000;      // 30 секунд — автосохранение
const CLOUD_SYNC_COOLDOWN = 5000;      // 5 секунд — минимальный интервал между запросами
const CLOUD_SAVE_DEBOUNCE = 3000;      // ✅ НОВОЕ: 3 секунды — задержка перед отправкой в облако

// ============================================
// СОСТОЯНИЕ СИСТЕМЫ
// ============================================
let autoSaveTimer = null;
let lastCloudSync = 0;
let isSyncing = false;

// ✅ Блокировка синхронизации для критических операций (бонусы, покупки)
let isOperationLocked = false;
let pendingOperations = [];

// ✅ НОВОЕ: Debounce для облачного сохранения
let cloudSaveTimeout = null;

/**
 * 🔒 Блокировка синхронизации (вызывается при получении бонуса)
 */
window.lockSync = function() {
    isOperationLocked = true;
    console.log('🔒 [SAVE] Синхронизация заблокирована');
};

/**
 * 🔓 Разблокировка синхронизации
 * Выполняет все отложенные операции из очереди
 */
window.unlockSync = function() {
    isOperationLocked = false;
    console.log('🔓 [SAVE] Синхронизация разблокирована');
    
    if (pendingOperations.length > 0) {
        console.log('📋 [SAVE] Выполняем ' + pendingOperations.length + ' отложенных операций');
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
    // ✅ Данные ежедневного бонуса для синхронизации через облако
    dailyBonus: {
        lastClaimDate: null,
        currentDay: 1,
        totalClaimed: 0,
        streak: 0
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
    sessions: 0
};

// ============================================
// УТИЛИТЫ
// ============================================

/**
 * Глубокое слияние объектов
 */
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
            }
        }
    }
    return result;
}

/**
 * Извлечь данные для облачного сохранения
 * ✅ Отправляем ВЕСЬ gameState + timestamp
 */
function extractCloudData() {
    if (!window.gameState) return null;
    
    const planetOrder = window.GAME_CONFIG?.planetOrder || ['mercury'];
    const currentLevel = planetOrder.indexOf(window.gameState.currentLocation) + 1;
    
    const unlocked = [];
    for (let i = 0; i <= planetOrder.indexOf(window.gameState.currentLocation); i++) {
        unlocked.push(planetOrder[i]);
    }
    
    // ✅ Получаем username через экспортируемую функцию (если доступна)
    const username = (typeof window.getTelegramUsername === 'function') 
        ? window.getTelegramUsername()
        : (window.telegramUser?.username || 
           window.telegramUser?.first_name || 
           'Anonymous');

    return {
        crystals: Math.floor(window.gameState.coins || 0),
        level: currentLevel,
        score: Math.floor(window.gameState.totalDamageDealt || 0),
        unlocked_locations: unlocked,
        bobo_skin: window.gameState.boboSkin || 'default',
        username: username,
        timestamp: Date.now(),
        full_game_state: JSON.parse(JSON.stringify(window.gameState))
    };
}

/**
 * Применить данные из облака к gameState
 */
function applyCloudData(cloudData) {
    if (!cloudData || !window.gameState) return;
    
    // ✅ Если есть полный gameState — используем его
    if (cloudData.full_game_state && typeof cloudData.full_game_state === 'object') {
        console.log('☁️ Применяем ПОЛНЫЙ gameState из облака');
        
        const currentGameActive = window.gameState.gameActive;
        const currentGamePaused = window.gameState.gamePaused;
        
        window.gameState = deepMerge(DEFAULT_GAME_STATE, cloudData.full_game_state);
        
        window.gameState.gameActive = currentGameActive;
        window.gameState.gamePaused = currentGamePaused;
        window.gameState.helperActive = false;
        window.gameState.helperTimeLeft = 0;
        window.gameState.comboCount = 0;
        
        console.log('✅ Полный gameState применён');
        console.log('💾 coins:', window.gameState.coins);
        console.log('💾 clickPower:', window.gameState.clickPower);
        console.log('💾 critChance:', window.gameState.critChance);
        console.log('💾 clickUpgradeLevel:', window.gameState.clickUpgradeLevel);
        console.log('🎁 dailyBonus:', window.gameState.dailyBonus);
        return;
    }
    
    // Резервный вариант для старых данных (без full_game_state)
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

/**
 * 💾 Сохранить игру в облако (с debounce)
 * ✅ НОВОЕ: использует debounce для группировки частых вызовов
 */
window.saveGame = function() {
    try {
        if (!window.gameState || !window.gameMetrics) {
            console.warn('⚠️ saveGame: gameState или gameMetrics не инициализированы');
            return false;
        }

        console.log('💾 [SAVE] Сохранение запрошено...');
        
        // ✅ Если синхронизация заблокирована — добавляем в очередь
        if (isOperationLocked) {
            console.log('⏳ [SAVE] Синхронизация заблокирована, добавляем в очередь');
            pendingOperations.push(() => debouncedCloudSave());
            return true;
        }

        // ✅ Используем debounce для группировки вызовов
        debouncedCloudSave();
        return true;
    } catch (e) {
        console.error('❌ Ошибка сохранения игры:', e);
        return false;
    }
};

/**
 * ✅ НОВОЕ: Debounce для облачного сохранения
 * Группирует частые вызовы saveGame() в один запрос к облаку
 */
function debouncedCloudSave() {
    // Отменяем предыдущий таймер если есть
    if (cloudSaveTimeout) {
        clearTimeout(cloudSaveTimeout);
    }
    
    // Устанавливаем новый таймер
    cloudSaveTimeout = setTimeout(() => {
        cloudSaveTimeout = null;
        cloudSaveAsync();
    }, CLOUD_SAVE_DEBOUNCE);
    
    console.log('⏱️ [SAVE] Debounce: сохранение через ' + (CLOUD_SAVE_DEBOUNCE / 1000) + ' сек');
}

/**
 * ✅ НОВОЕ: Принудительное немедленное сохранение
 * Используется при закрытии вкладки/сворачивании — минуя debounce
 */
window.flushCloudSave = function() {
    // Отменяем отложенное сохранение
    if (cloudSaveTimeout) {
        clearTimeout(cloudSaveTimeout);
        cloudSaveTimeout = null;
        console.log('⚡ [SAVE] Debounce отменён — принудительное сохранение');
    }
    
    // Выполняем немедленное сохранение
    cloudSaveAsync();
};

/**
 * ☁️ Асинхронное сохранение в облако (основная функция)
 */
async function cloudSaveAsync() {
    if (!window.telegramCloud?.isAvailable) {
        console.warn('⚠️ [CLOUD] Облако недоступно');
        return;
    }
    
    // ✅ Если синхронизация заблокирована — пропускаем
    if (isOperationLocked) {
        console.log('⏳ [CLOUD] Синхронизация заблокирована, пропускаем');
        return;
    }
    
    const now = Date.now();
    if (now - lastCloudSync < CLOUD_SYNC_COOLDOWN) {
        console.log('⏳ [CLOUD] Cooldown, пропускаем');
        return;
    }
    if (isSyncing) return;

    isSyncing = true;
    try {
        const cloudData = extractCloudData();
        if (cloudData) {
            console.log('☁️ [CLOUD] Отправка данных:', {
                crystals: cloudData.crystals,
                level: cloudData.level,
                score: cloudData.score,
                timestamp: cloudData.timestamp
            });
            
            const result = await window.telegramCloud.saveProgress(cloudData);
            
            if (result?.success) {
                lastCloudSync = now;
                showSaveIndicator('☁️', 'Сохранено');
                console.log('✅ [CLOUD] Sync successful');
            } else {
                console.warn('⚠️ [CLOUD] Sync failed:', result?.error);
                showSaveIndicator('⚠️', 'Ошибка сохранения', '#ff9800');
            }
        }
    } catch (e) {
        console.warn('⚠️ Ошибка облачной синхронизации:', e);
    } finally {
        isSyncing = false;
    }
}

// ============================================
// 📥 ЗАГРУЗКА ИЗ ОБЛАКА
// ============================================

/**
 * 📥 Загрузить игру ТОЛЬКО из облака
 */
window.loadGame = async function() {
    if (!window.telegramCloud?.isAvailable) {
        console.warn('⚠️ [LOAD] Облако недоступно');
        return false;
    }
    
    try {
        console.log('📥 [LOAD] Загрузка из облака...');
        
        const result = await window.telegramCloud.loadProgress();
        
        if (!result?.success || !result.data) {
            console.log('ℹ️ [LOAD] Облако пустое — начинаем новую игру');
            return false;
        }
        
        const cloudData = result.data;
        console.log('☁️ [LOAD] Облачные данные получены:', {
            has_full_state: !!cloudData.full_game_state,
            crystals: cloudData.crystals,
            level: cloudData.level,
            score: cloudData.score,
            timestamp: cloudData.timestamp
        });
        
        // Применяем облачные данные
        applyCloudData(cloudData);
        
        console.log('✅ [LOAD] Игра загружена из облака');
        console.log('💾 gameState.coins:', window.gameState.coins);
        console.log('💾 gameState.currentLocation:', window.gameState.currentLocation);
        console.log('🎁 gameState.dailyBonus:', window.gameState.dailyBonus);
        
        return true;
    } catch (e) {
        console.error('❌ Ошибка загрузки из облака:', e);
        return false;
    }
};

/**
 * ☁️ Инициализация облачной синхронизации
 * ✅ УПРОЩЕНО: просто загружаем из облака (облако всегда авторитетно)
 */
window.cloudInit = async function() {
    if (!window.telegramCloud) {
        console.log('ℹ️ Telegram Cloud не инициализирован');
        return;
    }
    
    try {
        console.log('☁️ Инициализация облачной синхронизации...');
        
        // ✅ ВСЕГДА загружаем из облака (облако — единственный источник истины)
        const loaded = await window.loadGame();
        
        if (loaded) {
            // Обновляем UI
            if (window.UI?.updateHUD) window.UI.updateHUD();
            if (window.UI?.updateUpgradeButtons) window.UI.updateUpgradeButtons();
            
            if (window.showTooltip) {
                window.showTooltip('☁️ Данные загружены из облака!');
                setTimeout(() => window.hideTooltip && window.hideTooltip(), 2500);
            }
            
            if (window.telegramHaptic?.success) {
                window.telegramHaptic.success();
            }
        } else {
            console.log('ℹ️ Облако пустое — начинаем с дефолтными данными');
            // Отправляем дефолтные данные в облако
            await cloudSaveAsync();
        }
        
        console.log('✅ Облачная синхронизация завершена');
    } catch (e) {
        console.warn('⚠️ Ошибка cloudInit:', e);
        console.warn('⚠️ Ошибка cloudInit stack:', e.stack);
    }
};

// ============================================
// 🔄 СБРОС И ПРОВЕРКИ
// ============================================

/**
 * 🔄 Сброс прогресса
 */
window.resetGame = function() {
    window.gameState = Object.assign({}, DEFAULT_GAME_STATE);
    window.gameMetrics = Object.assign({}, DEFAULT_GAME_METRICS);
    window.gameMetrics.startTime = Date.now();
    window.gameMetrics.sessions = 1;
    
    // ✅ Отправляем сброс в облако
    if (window.telegramCloud?.saveProgress) {
        window.telegramCloud.saveProgress({
            crystals: 0,
            level: 1,
            score: 0,
            unlocked_locations: ['mercury'],
            bobo_skin: 'default',
            timestamp: Date.now(),
            full_game_state: JSON.parse(JSON.stringify(window.gameState))
        }).catch(() => {});
    }
    
    console.log('🔄 Прогресс сброшен (в облаке)');
};

/**
 * Проверить наличие сохранения в облаке
 */
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
    let indicator = document.getElementById('saveIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'saveIndicator';
        indicator.style.cssText = 'position:fixed;top:20px;right:20px;padding:8px 16px;background:rgba(0,0,0,0.85);color:#4CAF50;border-radius:8px;font-size:0.9em;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;font-family:Orbitron,sans-serif;backdrop-filter:blur(4px);';
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
    // Инициализируем gameState с дефолтными значениями
    if (!window.gameState) {
        window.gameState = Object.assign({}, DEFAULT_GAME_STATE);
    } else {
        window.gameState = deepMerge(DEFAULT_GAME_STATE, window.gameState);
    }

    if (!window.gameMetrics) {
        window.gameMetrics = Object.assign({}, DEFAULT_GAME_METRICS);
    } else {
        window.gameMetrics = deepMerge(DEFAULT_GAME_METRICS, window.gameMetrics);
    }

    startAutoSave();

    // ✅ Сохраняем в облако при закрытии вкладки (принудительно, минуя debounce)
    window.addEventListener('beforeunload', () => {
        if (window.gameState && window.gameState.gameActive) {
            // ✅ НОВОЕ: принудительное сохранение перед закрытием
            if (typeof window.flushCloudSave === 'function') {
                window.flushCloudSave();
            } else {
                window.saveGame();
            }
        }
    });

    // ✅ Сохраняем в облако при сворачивании (принудительно, минуя debounce)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && window.gameState && window.gameState.gameActive) {
            // ✅ НОВОЕ: принудительное сохранение при сворачивании
            if (typeof window.flushCloudSave === 'function') {
                window.flushCloudSave();
            } else {
                window.saveGame();
            }
        }
    });

    console.log('💾 Save System initialized (CLOUD ONLY + DEBOUNCE)');
    console.log('💾 gameState.coins:', window.gameState.coins);
    console.log('💾 gameState.currentLocation:', window.gameState.currentLocation);
    console.log('🎁 gameState.dailyBonus:', window.gameState.dailyBonus);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();
