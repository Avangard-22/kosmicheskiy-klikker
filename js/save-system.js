// js/save-system.js
(function() {
'use strict';
const SAVE_KEY = 'cosmicClickerSave';
const AUTO_SAVE_INTERVAL = 30000;
const CLOUD_SYNC_COOLDOWN = 5000;

let autoSaveTimer = null;
let lastCloudSync = 0;
let isSyncing = false;

// ✅ НОВОЕ: флаг загрузки из облака
let isCloudLoaded = false;
// ✅ НОВОЕ: очередь операций, ожидающих загрузки облака
let pendingBonusOperations = [];

// ✅ НОВОЕ: экспортируем флаг для других модулей
window.isCloudLoaded = false;

// ✅ НОВОЕ: функция добавления операции в очередь
window.addToBonusQueue = function(operation) {
    if (typeof operation === 'function') {
        pendingBonusOperations.push(operation);
        console.log('⏳ Операция добавлена в очередь бонусов. Ожидание загрузки из облака...');
    }
};

// ✅ НОВОЕ: функция выполнения всех отложенных операций
function flushBonusQueue() {
    console.log('📋 Выполняем отложенные операции бонусов:', pendingBonusOperations.length);
    const operations = [...pendingBonusOperations];
    pendingBonusOperations = [];
    
    operations.forEach((op, index) => {
        console.log(`📋 Выполняем операцию бонуса ${index + 1}/${operations.length}`);
        try {
            if (typeof op === 'function') {
                op();
            }
        } catch (e) {
            console.error('❌ Ошибка выполнения операции бонуса:', e);
        }
    });
}

// ✅ Дефолтное состояние (единый источник правды)
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
    boboSkin: 'default'
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
 * ✅ ОТПРАВЛЯЕМ ВЕСЬ gameState + timestamp
 */
function extractCloudData() {
    if (!window.gameState) return null;
    
    const planetOrder = window.GAME_CONFIG?.planetOrder || ['mercury'];
    const currentLevel = planetOrder.indexOf(window.gameState.currentLocation) + 1;
    
    // Вычисляем разблокированные локации на основе текущего прогресса
    const unlocked = [];
    for (let i = 0; i <= planetOrder.indexOf(window.gameState.currentLocation); i++) {
        unlocked.push(planetOrder[i]);
    }
    
    const username = window.telegramUser?.username || 
                      window.telegramUser?.first_name || 
                      'Anonymous';

    return {
        crystals: Math.floor(window.gameState.coins || 0),
        level: currentLevel,
        score: Math.floor(window.gameState.totalDamageDealt || 0),
        unlocked_locations: unlocked,
        bobo_skin: window.gameState.boboSkin || 'default',
        username: username,
        // ✅ timestamp для сравнения между устройствами
        timestamp: Date.now(),
        // ✅ ОТПРАВЛЯЕМ ВЕСЬ gameState
        full_game_state: JSON.parse(JSON.stringify(window.gameState))
    };
}

/**
 * Применить данные из облака к gameState
 */
function applyCloudData(cloudData) {
    if (!cloudData || !window.gameState) return;
    
    const planetOrder = window.GAME_CONFIG?.planetOrder || ['mercury'];
    
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
        return;
    }
    
    // Резервный вариант для старых данных
    console.log('⚠️ Используем старый формат данных');
    
    if (cloudData.crystals > (window.gameState.coins || 0)) {
        window.gameState.coins = cloudData.crystals;
    }
    
    const currentLevel = planetOrder.indexOf(window.gameState.currentLocation) + 1;
    if (cloudData.level > currentLevel && planetOrder[cloudData.level - 1]) {
        window.gameState.currentLocation = planetOrder[cloudData.level - 1];
    }
    
    if (cloudData.score > (window.gameState.totalDamageDealt || 0)) {
        window.gameState.totalDamageDealt = cloudData.score;
    }
    
    if (cloudData.bobo_skin) {
        window.gameState.boboSkin = cloudData.bobo_skin;
    }
}

/**
 * 💾 Сохранить игру (localStorage + облако)
 */
window.saveGame = function() {
    try {
        if (!window.gameState || !window.gameMetrics) {
            console.warn('⚠️ saveGame: gameState или gameMetrics не инициализированы');
            return false;
        }

        const saveData = {
            version: 2,
            timestamp: Date.now(),
            gameState: window.gameState,
            gameMetrics: window.gameMetrics
        };

        // 1. Всегда сохраняем локально
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        
        // 2. Визуальная индикация локального сохранения
        showSaveIndicator('💾', 'Сохранено');

        // 3. Фоновая синхронизация с облаком (неблокирующая)
        cloudSaveAsync();

        return true;
    } catch (e) {
        console.error('❌ Ошибка сохранения игры:', e);
        return false;
    }
};

/**
 * ☁️ Асинхронное сохранение в облако
 */
async function cloudSaveAsync() {
    if (!window.telegramCloud?.isAvailable) return;
    
    const now = Date.now();
    if (now - lastCloudSync < CLOUD_SYNC_COOLDOWN) return;
    if (isSyncing) return;
    
    isSyncing = true;
    try {
        const cloudData = extractCloudData();
        if (cloudData) {
            console.log('☁️ [CLOUD] Sending data:', cloudData);
            const result = await window.telegramCloud.saveProgress(cloudData);
            if (result?.success) {
                lastCloudSync = now;
                showSaveIndicator('☁️', 'Синхронизировано', '#4CAF50');
                console.log('✅ [CLOUD] Sync successful');
            } else {
                console.warn('⚠️ [CLOUD] Sync failed:', result?.error);
            }
        }
    } catch (e) {
        console.warn('⚠️ Ошибка облачной синхронизации:', e);
    } finally {
        isSyncing = false;
    }
}

/**
 * 📥 Загрузить игру (локально)
 */
window.loadGame = function() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) {
            console.log('ℹ️ Локальное сохранение не найдено');
            return false;
        }

        const saveData = JSON.parse(raw);
        
        if (!saveData || !saveData.gameState || !saveData.gameMetrics) {
            console.warn('⚠️ Повреждённое сохранение, сброс');
            return false;
        }

        window.gameState = deepMerge(DEFAULT_GAME_STATE, saveData.gameState);
        window.gameMetrics = deepMerge(DEFAULT_GAME_METRICS, saveData.gameMetrics);

        window.gameMetrics.sessions = (window.gameMetrics.sessions || 0) + 1;

        // Сбрасываем временные состояния
        window.gameState.gameActive = false;
        window.gameState.gamePaused = false;
        window.gameState.helperActive = false;
        window.gameState.helperTimeLeft = 0;
        window.gameState.boboCoinBonus = 0;
        window.gameState.comboCount = 0;

        console.log('✅ Локальная игра загружена. Сессия #' + window.gameMetrics.sessions);
        console.log('💾 gameState.coins:', window.gameState.coins);
        console.log('💾 gameState.currentLocation:', window.gameState.currentLocation);
        return true;
    } catch (e) {
        console.error('❌ Ошибка загрузки сохранения:', e);
        return false;
    }
};

/**
 * ☁️ Инициализация облачной синхронизации (вызывается при старте)
 * ✅ ИСПРАВЛЕНО: сравниваем по timestamp, разблокируем очередь бонусов
 */
window.cloudInit = async function() {
    if (!window.telegramCloud) {
        console.log('ℹ️ Telegram Cloud не инициализирован');
        // ✅ НОВОЕ: даже если облака нет — разблокируем операции
        isCloudLoaded = true;
        window.isCloudLoaded = true;
        flushBonusQueue();
        return;
    }
    
    try {
        console.log('☁️ Инициализация облачной синхронизации...');
        
        const result = await window.telegramCloud.loadProgress();
        console.log('🔍 cloudInit: loadProgress result:', result);
        
        if (!result?.success || !result.data) {
            console.log('☁️ Облако пустое или ошибка, отправляем локальные данные');
            await cloudSaveAsync();
            // ✅ НОВОЕ: разблокируем операции
            isCloudLoaded = true;
            window.isCloudLoaded = true;
            flushBonusQueue();
            return;
        }
        
        const cloudData = result.data;
        console.log('☁️ Облачные данные получены:', {
            has_full_state: !!cloudData.full_game_state,
            crystals: cloudData.crystals,
            level: cloudData.level,
            score: cloudData.score,
            timestamp: cloudData.timestamp
        });
        
        // ✅ НОВОЕ: сравниваем по timestamp (время последнего сохранения)
        const cloudTimestamp = cloudData.timestamp || 0;
        const localTimestamp = getLocalTimestamp();
        
        console.log('🔍 Сравнение timestamp: облако=' + cloudTimestamp + ' vs локально=' + localTimestamp);
        
        // Облако выигрывает, если его timestamp новее
        const cloudWins = cloudTimestamp > localTimestamp;
        
        if (cloudWins) {
            console.log('☁️ Облачные данные новее — применяем');
            applyCloudData(cloudData);
            
            // ✅ НОВОЕ: обновляем локальное сохранение после применения облачных данных
            try {
                const updatedSaveData = {
                    version: 2,
                    timestamp: Date.now(),
                    gameState: window.gameState,
                    gameMetrics: window.gameMetrics
                };
                localStorage.setItem(SAVE_KEY, JSON.stringify(updatedSaveData));
                console.log('💾 Локальное сохранение обновлено с новым timestamp');
            } catch (e) {
                console.warn('⚠️ Не удалось обновить локальное сохранение:', e);
            }
            
            if (window.UI?.updateHUD) window.UI.updateHUD();
            if (window.UI?.updateUpgradeButtons) window.UI.updateUpgradeButtons();
            
            if (window.showTooltip) {
                window.showTooltip('☁️ Данные синхронизированы с облаком!');
                setTimeout(() => window.hideTooltip && window.hideTooltip(), 2500);
            }
            
            if (window.telegramHaptic?.success) {
                window.telegramHaptic.success();
            }
        } else {
            console.log('☁️ Локальные данные актуальнее — синхронизируем в облако');
            await cloudSaveAsync();
        }
        
        console.log('✅ Облачная синхронизация завершена');
        
        // ✅ НОВОЕ: разблокируем операции и выполняем очередь
        isCloudLoaded = true;
        window.isCloudLoaded = true;
        flushBonusQueue();
        
    } catch (e) {
        console.warn('⚠️ Ошибка cloudInit:', e);
        console.warn('⚠️ Ошибка cloudInit stack:', e.stack);
        
        // ✅ НОВОЕ: даже при ошибке разблокируем операции
        isCloudLoaded = true;
        window.isCloudLoaded = true;
        flushBonusQueue();
    }
};

/**
 * Получить timestamp локального сохранения
 */
function getLocalTimestamp() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return 0;
        const data = JSON.parse(raw);
        return data.timestamp || 0;
    } catch { return 0; }
}

function getCurrentLocalLevel() {
    if (!window.gameState || !window.GAME_CONFIG?.planetOrder) return 1;
    return window.GAME_CONFIG.planetOrder.indexOf(window.gameState.currentLocation) + 1;
}

/**
 * 🔄 Сброс прогресса
 */
window.resetGame = function() {
    window.gameState = Object.assign({}, DEFAULT_GAME_STATE);
    window.gameMetrics = Object.assign({}, DEFAULT_GAME_METRICS);
    window.gameMetrics.startTime = Date.now();
    window.gameMetrics.sessions = 1;
    
    localStorage.removeItem(SAVE_KEY);
    
    // Очистка облака (тихо, без блокировки)
    if (window.telegramCloud?.saveProgress) {
        window.telegramCloud.saveProgress({
            crystals: 0,
            level: 1,
            score: 0,
            unlocked_locations: ['mercury'],
            bobo_skin: 'default'
        }).catch(() => {});
    }
    
    console.log('🔄 Прогресс сброшен (локально и в облаке)');
};

/**
 * Проверить наличие сохранения
 */
window.hasSave = function() {
    return localStorage.getItem(SAVE_KEY) !== null;
};

/**
 * 💾 Визуальный индикатор сохранения
 */
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

/**
 * ⏱️ Запуск автосохранения
 */
function startAutoSave() {
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    autoSaveTimer = setInterval(() => {
        if (window.gameState && window.gameState.gameActive) {
            window.saveGame();
        }
    }, AUTO_SAVE_INTERVAL);
}

/**
 * 🚀 Инициализация системы
 */
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
    }

    startAutoSave();

    // Сохраняем при закрытии вкладки
    window.addEventListener('beforeunload', () => {
        if (window.gameState && window.gameState.gameActive) {
            window.saveGame();
        }
    });

    // Сохраняем при сворачивании на мобильных
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && window.gameState && window.gameState.gameActive) {
            window.saveGame();
        }
    });

    console.log('💾 Save System initialized');
    console.log('💾 gameState.coins:', window.gameState.coins);
    console.log('💾 gameState.currentLocation:', window.gameState.currentLocation);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
})();