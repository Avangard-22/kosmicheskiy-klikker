// js/save-system.js
(function() {
'use strict';

// === ПРОВЕРКА ЗАВИСИМОСТЕЙ ===
if (!window.GAME_CONFIG) {
    console.warn('⚠️ [SAVE] GAME_CONFIG не загружен. Прогресс может не сохраняться корректно.');
}

// ============================================
// КОНСТАНТЫ
// ============================================
const AUTO_SAVE_INTERVAL = 30000;  // 30 секунд
const CLOUD_SYNC_COOLDOWN = 5000;  // 5 секунд между синхронизациями

// ============================================
// СОСТОЯНИЕ СИСТЕМЫ
// ============================================
let autoSaveTimer = null;
let lastCloudSync = 0;
let lastFullSerialize = 0; // ✅ НОВОЕ: время последней полной сериализации
let cachedGameState = null; // ✅ НОВОЕ: кэш gameState
let isSyncing = false;

// ✅ Блокировка синхронизации для критических операций (бонусы, покупки)
let isOperationLocked = false;
let pendingOperations = [];

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
                // ✅ НОВОЕ: обработка массивов — объединяем уникальные элементы
                if (Array.isArray(defaults[key]) && Array.isArray(saved[key])) {
                    result[key] = [...new Set([...defaults[key], ...saved[key]])];
                }
                // Рекурсивное слияние для вложенных объектов
                else if (
                    typeof defaults[key] === 'object' &&
                    defaults[key] !== null &&
                    !Array.isArray(defaults[key]) &&
                    typeof saved[key] === 'object' &&
                    saved[key] !== null &&
                    !Array.isArray(saved[key])
                ) {
                    result[key] = deepMerge(defaults[key], saved[key]);
                }
                // Простые значения — берём из saved
                else {
                    result[key] = saved[key];
                }
            }
        }
    }
    return result;
}

/**
 * ✅ НОВОЕ: Валидация gameState перед сохранением
 * Предотвращает сохранение битых данных
 */
function validateGameState(state) {
    if (!state || typeof state !== 'object') {
        console.error('❌ [VALIDATE] gameState не является объектом');
        return false;
    }
    
    // Проверка числовых полей
    if (typeof state.coins !== 'number' || state.coins < 0 || isNaN(state.coins)) {
        console.error('❌ [VALIDATE] coins невалиден:', state.coins);
        state.coins = 0; // Исправляем на дефолт
    }
    
    if (typeof state.clickPower !== 'number' || state.clickPower < 1) {
        console.error('❌ [VALIDATE] clickPower невалиден:', state.clickPower);
        state.clickPower = 1;
    }
    
    if (typeof state.critChance !== 'number' || state.critChance < 0 || state.critChance > 1) {
        console.error('❌ [VALIDATE] critChance невалиден:', state.critChance);
        state.critChance = 0.001;
    }
    
    if (typeof state.critMultiplier !== 'number' || state.critMultiplier < 1) {
        console.error(' [VALIDATE] critMultiplier невалиден:', state.critMultiplier);
        state.critMultiplier = 2.0;
    }
    
    // Проверка строковых полей
    if (typeof state.currentLocation !== 'string') {
        console.error('❌ [VALIDATE] currentLocation невалиден:', state.currentLocation);
        state.currentLocation = 'mercury';
    }
    
    // Проверка массивов
    if (!Array.isArray(state.unlockedLocations)) {
        console.error('❌ [VALIDATE] unlockedLocations не является массивом');
        state.unlockedLocations = ['mercury'];
    }
    
    // Проверка dailyBonus
    if (!state.dailyBonus || typeof state.dailyBonus !== 'object') {
        console.error('❌ [VALIDATE] dailyBonus невалиден');
        state.dailyBonus = {
            lastClaimDate: null,
            currentDay: 1,
            totalClaimed: 0,
            streak: 0
        };
    }
    
    // Проверка levels улучшений
    const levelFields = ['clickUpgradeLevel', 'critChanceUpgradeLevel', 
                         'critMultiplierUpgradeLevel', 'helperUpgradeLevel'];
    levelFields.forEach(field => {
        if (typeof state[field] !== 'number' || state[field] < 0) {
            console.error(`❌ [VALIDATE] ${field} невалиден:`, state[field]);
            state[field] = 0;
        }
    });
    
    return true;
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
const username = window.telegramUser?.username ||
window.telegramUser?.first_name ||
'Anonymous';

// ✅ НОВОЕ: Оптимизация сериализации
// Полная копия только раз в 5 секунд, иначе используем кэш
const now = Date.now();
const FULL_SERIALIZE_INTERVAL = 5000; // 5 секунд
let fullState;

if (!cachedGameState || (now - lastFullSerialize) > FULL_SERIALIZE_INTERVAL) {
    // Полная сериализация — дорого, но надёжно
    fullState = JSON.parse(JSON.stringify(window.gameState));
    cachedGameState = fullState;
    lastFullSerialize = now;
    console.log('🔄 [SAVE] Полная сериализация gameState');
} else {
    // Используем кэш — быстро
    fullState = cachedGameState;
}

return {
crystals: Math.floor(window.gameState.coins || 0),
level: currentLevel,
score: Math.floor(window.gameState.totalDamageDealt || 0),
unlocked_locations: unlocked,
bobo_skin: window.gameState.boboSkin || 'default',
username: username,
timestamp: now,
full_game_state: fullState
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
        console.log(' dailyBonus:', window.gameState.dailyBonus);

// ✅ НОВОЕ: Сбрасываем кэш сериализации после загрузки новых данных
cachedGameState = null;
lastFullSerialize = 0;

// ✅ НОВОЕ: Публикуем событие о загрузке данных
if (window.EventBus) {
    window.EventBus.emit('game:loaded', window.gameState);
}
return;
    }
        
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
 * 💾 Сохранить игру ТОЛЬКО в облако
 */
if (!window.gameState || !window.gameMetrics) {
    console.warn('⚠️ saveGame: gameState или gameMetrics не инициализированы');
    return false;
}

// ✅ НОВОЕ: Валидация перед сохранением
if (typeof validateGameState === 'function') {
    const isValid = validateGameState(window.gameState);
    if (!isValid) {
        console.warn('⚠️ [SAVE] gameState прошёл автоисправление, сохраняем исправленную версию');
    }
}

console.log(' [SAVE] Сохранение в облако...');

        // ✅ Если синхронизация заблокирована — добавляем в очередь
        if (typeof isOperationLocked !== 'undefined' && isOperationLocked) {
            console.log('⏳ [SAVE] Синхронизация заблокирована, добавляем в очередь');
            if (typeof pendingOperations !== 'undefined') {
                pendingOperations.push(() => cloudSaveAsync());
            }
            return true;
        }

        // ✅ Только облако, без localStorage
        cloudSaveAsync();
        showSaveIndicator('☁️', 'Сохранено');

        return true;
    } catch (e) {
        console.error('❌ Ошибка сохранения игры:', e);
        return false;
    }
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
    if (now - lastCloudSync < CLOUD_SYNC_COOLDOWN) return;
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
    
    // ✅ НОВОЕ: Публикуем событие об успешном сохранении
    if (window.EventBus) {
        window.EventBus.emit('save:success', {
            timestamp: now,
            coins: window.gameState?.coins || 0
        });
    }
}
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
window.loadGame = async function() {
    try {
        if (!window.telegramCloud?.isAvailable) {
            console.warn('⚠️ [LOAD] Облако недоступно');
            return false;
        }

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
            score: cloudData.score
        });

        // ✅ Применяем облачные данные через applyCloudData
        if (typeof applyCloudData === 'function') {
            applyCloudData(cloudData);
        }

        window.gameMetrics.sessions = (window.gameMetrics.sessions || 0) + 1;

        console.log('✅ [LOAD] Игра загружена из облака. Сессия #' + window.gameMetrics.sessions);
        console.log('💾 gameState.coins:', window.gameState.coins);
        console.log('💾 gameState.currentLocation:', window.gameState.currentLocation);
        console.log(' gameState.dailyBonus:', window.gameState.dailyBonus);

        return true;
    } catch (e) {
        console.error('❌ Ошибка загрузки из облака:', e);
        return false;
    }
};

/**
 * Инициализация облачной синхронизации
window.cloudInit = async function() {
    if (!window.telegramCloud) {
        console.log('ℹ️ Telegram Cloud не инициализирован');
        return;
    }
    try {
        console.log('☁️ Инициализация облачной синхронизации...');

        // ✅ ВСЕГДА загружаем из облака — облако единственный источник истины
        const loaded = await window.loadGame();

        if (loaded) {
            console.log('✅ Облачные данные применены');

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
    // ✅ Сбрасываем gameState и metrics к дефолтным значениям
    window.gameState = Object.assign({}, DEFAULT_GAME_STATE);
    window.gameMetrics = Object.assign({}, DEFAULT_GAME_METRICS);
    window.gameMetrics.startTime = Date.now();
    window.gameMetrics.sessions = 1;

    // ✅ Отправляем ПОЛНЫЙ gameState в облако (включая dailyBonus, achievements и т.д.)
    if (window.telegramCloud?.saveProgress) {
        const fullResetData = {
            crystals: 0,
            level: 1,
            score: 0,
            unlocked_locations: ['mercury'],
            bobo_skin: 'default',
            username: window.getTelegramUsername ? window.getTelegramUsername() : 'Anonymous',
            timestamp: Date.now(),
            // ✅ ВАЖНО: отправляем полный gameState, а не обрезанные данные
            full_game_state: JSON.parse(JSON.stringify(window.gameState))
        };
        
        window.telegramCloud.saveProgress(fullResetData).then(result => {
            if (result?.success) {
                console.log('🔄 [RESET] Прогресс сброшен в облаке успешно');
            } else {
                console.warn('⚠️ [RESET] Ошибка сброса в облаке:', result?.error);
            }
        }).catch(err => {
            console.error('❌ [RESET] Ошибка сброса:', err);
        });
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

    // ✅ Сохраняем в облако при закрытии вкладки
    window.addEventListener('beforeunload', () => {
        if (window.gameState && window.gameState.gameActive) {
            window.saveGame();
        }
    });

    // ✅ Сохраняем в облако при сворачивании
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && window.gameState && window.gameState.gameActive) {
            window.saveGame();
        }
    });

    console.log('💾 Save System initialized (CLOUD ONLY)');
   console.log(' gameState.coins:', window.gameState.coins);
console.log('💾 gameState.currentLocation:', window.gameState.currentLocation);
console.log('🎁 gameState.dailyBonus:', window.gameState.dailyBonus);

// ✅ НОВОЕ: Подписка на событие получения бонуса
if (window.EventBus) {
    window.EventBus.on('bonus:claimed', (data) => {
        console.log('📡 [SAVE] Получено событие bonus:claimed:', data);
        // Сохраняем с небольшой задержкой, чтобы данные успели обновиться
        setTimeout(() => {
            if (typeof window.saveGame === 'function') {
                window.saveGame();
            }
        }, 100);
    });
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();
