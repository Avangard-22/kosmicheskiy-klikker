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
    sessions: 0,
    visitedPlanets: []
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
            }
        }
    }
    return result;
}

function extractCloudData() {
    if (!window.gameState) return null;
    
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

function applyCloudData(cloudData) {
    if (!cloudData || !window.gameState) return;
    
    if (cloudData.full_game_state && typeof cloudData.full_game_state === 'object') {
        console.log('☁️ Применяем ПОЛНЫЙ gameState из облака');
        
        const currentGameActive = window.gameState.gameActive;
        const currentGamePaused = window.gameState.gamePaused;
        
        const cloudDailyBonus = cloudData.full_game_state.dailyBonus;
        window.gameState = deepMerge(DEFAULT_GAME_STATE, cloudData.full_game_state);
        
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

        console.log('💾 [SAVE] Сохранение запрошено...');
        
        // Визуальный отклик: переводим кнопку в режим ожидания (дыхания), подтверждая фиксацию клика
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn && !saveBtn.classList.contains('save-pulse-success')) {
            saveBtn.classList.add('save-pending');
        }
        
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

function debouncedCloudSave() {
    if (cloudSaveTimeout) {
        clearTimeout(cloudSaveTimeout);
    }
    
    cloudSaveTimeout = setTimeout(() => {
        cloudSaveTimeout = null;
        cloudSaveAsync();
    }, CLOUD_SAVE_DEBOUNCE);
    
    console.log('⏱️ [SAVE] Debounce: сохранение через ' + (CLOUD_SAVE_DEBOUNCE / 1000) + ' сек');
}

window.flushCloudSave = function() {
    if (typeof cloudSaveTimeout !== 'undefined' && cloudSaveTimeout) {
        clearTimeout(cloudSaveTimeout);
        cloudSaveTimeout = null;
        console.log('⚡ [SAVE] Debounce отменён — принудительное сохранение');
    }

    if (window.telegramCloud?.saveProgressCritical) {
        console.log('🚨 [SAVE] Критическое сохранение при закрытии...');
        const cloudData = extractCloudData();
        if (cloudData) {
            window.telegramCloud.saveProgressCritical(cloudData);
        }
    } else {
        cloudSaveAsync();
    }
};

// ============================================
// ✅ НОВОЕ: ОСНОВНАЯ ФУНКЦИЯ СОХРАНЕНИЯ В ОБЛАКО
// ============================================

async function cloudSaveAsync() {
    if (!window.telegramCloud?.isAvailable) {
        console.warn('⚠️ [CLOUD] Облако недоступно');
        return;
    }
    
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
                    // ✅ ИСПРАВЛЕНО: передаём цвет явно
                showSaveIndicator('☁️', 'Сохранено', '#4CAF50');
                console.log('✅ [CLOUD] Sync successful');
            } else {
                console.warn('⚠️ [CLOUD] Sync failed:', result?.error);
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
        console.log('☁️ Инициализация облачной синхронизации...');
        
        const loaded = await window.loadGame();
        
        if (loaded) {
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
            await cloudSaveAsync();
        }
        
        console.log('✅ Облачная синхронизация завершена');
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
        // Очищаем предыдущие состояния
        saveBtn.classList.remove('save-pending', 'save-pulse-success', 'save-pulse-error');
        
        // Вынужденный reflow для сброса CSS-анимаций
        void saveBtn.offsetWidth;
        
        // ✅ ИСПРАВЛЕНО: проверяем цвет корректно
        // Если цвет не передан или зелёный — успех, иначе — ошибка
        const isSuccess = !color || color === '#4CAF50' || color === '#4CAF50';
        
        if (isSuccess) {
            saveBtn.classList.add('save-pulse-success');
        } else {
            saveBtn.classList.add('save-pulse-error');
        }
        
        // Удаляем классы после анимации
        setTimeout(() => {
            saveBtn.classList.remove('save-pulse-success', 'save-pulse-error');
        }, 1000);
    }

    // Всплывающий текст под кнопкой
    let indicator = document.getElementById('saveIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'saveIndicator';
        indicator.style.cssText = 'position:absolute;top:55px;right:10px;padding:4px 8px;background:rgba(0,0,0,0.7);color:#4CAF50;border-radius:4px;font-size:0.75em;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;font-family:Orbitron,sans-serif;letter-spacing:0.5px;';
        document.body.appendChild(indicator);
    }
    
    // ✅ ИСПРАВЛЕНО: показываем иконку и текст
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
