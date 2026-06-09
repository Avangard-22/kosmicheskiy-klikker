// js/save-system.js
(function() {
'use strict';
const SAVE_KEY = 'cosmicClickerSave';
const AUTO_SAVE_INTERVAL = 30000; // 30 секунд
const CLOUD_SYNC_COOLDOWN = 5000; // Минимум 5 секунд между облачными синхронизациями

let autoSaveTimer = null;
let lastCloudSync = 0;
let isSyncing = false;

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
        username: username
    };
}

/**
 * Применить данные из облака к gameState
 */
function applyCloudData(cloudData) {
    if (!cloudData || !window.gameState) return;
    
    const planetOrder = window.GAME_CONFIG?.planetOrder || ['mercury'];
    
    // Применяем только если облачные данные лучше локальных
    if (cloudData.crystals > (window.gameState.coins || 0)) {
        window.gameState.coins = cloudData.crystals;
    }
    
    // Если уровень выше — переносим на эту планету
    const currentLevel = planetOrder.indexOf(window.gameState.currentLocation) + 1;
    if (cloudData.level > currentLevel && planetOrder[cloudData.level - 1]) {
        window.gameState.currentLocation = planetOrder[cloudData.level - 1];
    }
    
    // Общий урон
    if (cloudData.score > (window.gameState.totalDamageDealt || 0)) {
        window.gameState.totalDamageDealt = cloudData.score;
    }
    
    // Скины
    if (cloudData.bobo_skin) {
        window.gameState.boboSkin = cloudData.bobo_skin;
    }
}

/**
 * 💾 Сохранить игру (localStorage + облако)
 * ШАГ 2: Улучшенная версия с подробным логированием
 */
window.saveGame = function() {
    try {
        console.log('💾 [SAVE] Attempting to save...');
        
        if (!window.gameState || !window.gameMetrics) {
            console.error('❌ [SAVE] No game state to save');
            return false;
        }

        // Проверяем, доступен ли localStorage
        if (typeof localStorage === 'undefined') {
            console.error('❌ [SAVE] localStorage is not available');
            return false;
        }

        const saveData = {
            version: 2,
            timestamp: Date.now(),
            gameState: window.gameState,
            gameMetrics: window.gameMetrics
        };

        console.log('💾 [SAVE] Data to save:', {
            crystals: window.gameState.coins,
            level: window.gameState.currentLocation,
            damage: window.gameState.totalDamageDealt
        });

        // 1. Всегда сохраняем локально
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        
        // Проверяем, что сохранилось
        const saved = localStorage.getItem(SAVE_KEY);
        console.log('💾 [SAVE] Verification:', saved ? 'SUCCESS' : 'FAILED');
        
        // 2. Визуальная индикация локального сохранения
        showSaveIndicator('💾', 'Сохранено');

        // 3. Фоновая синхронизация с облаком (неблокирующая)
        cloudSaveAsync();

        return true;
    } catch (e) {
        console.error('❌ [SAVE] Error saving game:', e);
        console.error('❌ [SAVE] Error stack:', e.stack);
        return false;
    }
};

/**
 * ☁️ Асинхронное сохранение в облако
 */
async function cloudSaveAsync() {
    if (!window.telegramCloud?.isAvailable) {
        console.log('⚠️ [CLOUD] Cloud not available, skipping');
        return;
    }
    
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
        console.warn('⚠️ [CLOUD] Sync error:', e);
    } finally {
        isSyncing = false;
    }
}

/**
 * 📥 Загрузить игру (локально)
 * ШАГ 2: Улучшенная версия с подробным логированием
 */
window.loadGame = function() {
    try {
        console.log('💾 [LOAD] Attempting to load from localStorage...');
        
        // Проверяем, доступен ли localStorage
        if (typeof localStorage === 'undefined') {
            console.error('❌ [LOAD] localStorage is not available');
            return false;
        }
        
        const raw = localStorage.getItem(SAVE_KEY);
        console.log('💾 [LOAD] Raw data:', raw ? 'exists (' + raw.length + ' chars)' : 'null');
        
        if (!raw) {
            console.log('️ [LOAD] No save found in localStorage');
            return false;
        }
        
        const saveData = JSON.parse(raw);
        console.log('💾 [LOAD] Parsed save data version:', saveData?.version);
        
        if (!saveData || !saveData.gameState || !saveData.gameMetrics) {
            console.warn('⚠️ [LOAD] Corrupted save data, resetting');
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

        console.log('✅ [LOAD] Game loaded successfully. Session #' + window.gameMetrics.sessions);
        console.log('💾 [LOAD] Crystals:', window.gameState.coins, 'Location:', window.gameState.currentLocation);
        return true;
    } catch (e) {
        console.error('❌ [LOAD] Error loading game:', e);
        console.error(' [LOAD] Error stack:', e.stack);
        return false;
    }
};

/**
 * ☁️ Инициализация облачной синхронизации (вызывается при старте)
 * ВСЕГДА загружает из облака если есть initData
 */
window.cloudInit = async function() {
    if (!window.telegramCloud) {
        console.log('ℹ️ Telegram Cloud не инициализирован');
        return;
    }
    
    try {
        console.log('☁️ Инициализация облачной синхронизации...');
        console.log('🔍 cloudInit: isCloudAvailable:', window.isCloudAvailable);
        console.log('🔍 cloudInit: telegramCloud.isAvailable:', window.telegramCloud.isAvailable);
        
        // ВСЕГДА пытаемся загрузить из облака
        const result = await window.telegramCloud.loadProgress();
        console.log('🔍 cloudInit: loadProgress result:', result);
        
        if (!result?.success || !result.data) {
            console.log('☁️ Облако пустое или ошибка, отправляем локальные данные');
            await cloudSaveAsync();
            return;
        }
        
        const cloudData = result.data;
        console.log('☁️ Облачные данные:', cloudData);
        
        // ВСЕГДА применяем облачные данные (они авторитетнее)
        console.log('☁️ Применяем облачные данные...');
        applyCloudData(cloudData);
        
        // Обновляем UI
        if (window.UI?.updateHUD) window.UI.updateHUD();
        if (window.UI?.updateUpgradeButtons) window.UI.updateUpgradeButtons();
        
        // Уведомляем пользователя
        if (window.showTooltip) {
            window.showTooltip('☁️ Данные синхронизированы с облаком!');
            setTimeout(() => window.hideTooltip && window.hideTooltip(), 2500);
        }
        
        if (window.telegramHaptic?.success) {
            window.telegramHaptic.success();
        }
        
        console.log('✅ Облачная синхронизация завершена');
    } catch (e) {
        console.warn('⚠️ Ошибка cloudInit:', e);
        console.warn('⚠️ Ошибка cloudInit stack:', e.stack);
    }
};

/**
 * Вспомогательные функции
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
 * ️ Запуск автосохранения
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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
})();
