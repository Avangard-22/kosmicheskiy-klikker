 // js/save-system.js (v4.1 — ТОЛЬКО серверное сохранение)
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
// СОСТОЯНИЕ ЗАГРУЗКИ
// ============================================
let isLoadingFromCloud = false;
let cloudLoadCompleted = false;
let cloudLoadStartTime = 0;
let firstSaveTimer = null;
const CLOUD_LOAD_TIMEOUT = 30000; // 30 секунд
const FIRST_SAVE_DELAY = 15000;   // 15 секунд

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
planetDamageDealt: 0,  // ✅ НОВОЕ: Урон на текущей планете (для прогресс-бара)
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
    dailyProgress: null, // ✅ ЧИСТОЕ РЕШЕНИЕ: хранится ВНУТРИ gameState и сохраняется на сервер автоматически
    
    // ✅ НОВОЕ: Динамические цены магазина (сохраняются в облако)
    shopPurchaseCount: 0,
    shopPriceMultiplier: 1.0,
    
    // ✅ НОВОЕ: Состояние системы достижений v2
    achievementsV2: {}
    // skipPenaltyState создаётся динамически в ensureSkipPenaltyState()
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
    // ✅ НОВОЕ: Активная серия критов (сбрасывается при пропуске)
    currentCritStreak: 0,
    // ✅ НОВОЕ: Планетарные метрики создаются динамически в ensurePlanetStatsStructure()
    planetStats: {}
};

// ============================================
// УТИЛИТЫ
// ============================================
function deepMerge(defaults, saved) {
    // Если saved не объект — возвращаем как есть
    if (typeof saved !== 'object' || saved === null) return saved;
    if (Array.isArray(saved)) return [...saved];
    
    // ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: создаём результат из saved, а не из defaults
    // Это гарантирует, что данные из облака полностью заменят дефолтные
    const result = Object.assign({}, saved);
    
    // Добавляем отсутствующие поля из defaults (для обратной совместимости)
    if (defaults) {
        for (const key in defaults) {
            if (defaults.hasOwnProperty(key) && !(key in result)) {
                if (typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key])) {
                    result[key] = deepMerge(defaults[key], result[key] || {});
                } else {
                    result[key] = defaults[key];
                }
            }
        }
    }
    
    return result;
}

// ═══════════════════════════════════════════════════
// 🏗️ ОБЕСПЕЧЕНИЕ СТРУКТУРЫ ДАННЫХ (автоматически для всех планет)
// ═══════════════════════════════════════════════════

/**
 * Гарантирует наличие planetStats для всех 9 планет с актуальными полями
 * Вызывается при загрузке и инициализации
 */
function ensurePlanetStatsStructure() {
    if (!window.gameMetrics) window.gameMetrics = {};
    if (!window.gameMetrics.planetStats) window.gameMetrics.planetStats = {};
    
    const planetOrder = window.GAME_CONFIG?.planetOrder || ['mercury'];
    
    // ✅ Актуальный шаблон полей для каждой планеты (12 метрик)
    const planetTemplate = {
        blocks: 0,
        crits: 0,
        combo: 0,
        rare: 0,
        damageDealt: 0,          // ✅ НОВОЕ: планетарный урон
        crystalsEarned: 0,
        boboActivations: 0,
        boboDamage: 0,
        boboCrystalsEarned: 0,   // ✅ НОВОЕ
        upgrades: 0,             // ✅ НОВОЕ
        timePlayed: 0,
        fastestBlock: 0,
        maxCritStreak: 0         // ✅ НОВОЕ (заменяет bestAccuracy и maxPerfectStreak)
    };
    
    let migrated = false;
    
    planetOrder.forEach(planet => {
        if (!window.gameMetrics.planetStats[planet]) {
            // Создаём с нуля
            window.gameMetrics.planetStats[planet] = Object.assign({}, planetTemplate);
        } else {
            // Дополняем отсутствующие поля (не перезаписываем существующие!)
            const stats = window.gameMetrics.planetStats[planet];
            for (const key in planetTemplate) {
                if (stats[key] === undefined) {
                    stats[key] = planetTemplate[key];
                }
            }
            
            // 🔄 МИГРАЦИЯ: переносим устаревшие поля в новые
            if (stats.bestAccuracy !== undefined && stats.maxCritStreak === 0) {
                stats.maxCritStreak = Math.floor((stats.bestAccuracy || 0) / 10);
                delete stats.bestAccuracy;
                migrated = true;
            }
            if (stats.maxPerfectStreak !== undefined) {
                if (stats.maxPerfectStreak > stats.maxCritStreak) {
                    stats.maxCritStreak = stats.maxPerfectStreak;
                }
                delete stats.maxPerfectStreak;
                migrated = true;
            }
        }
    });
    
    if (migrated) {
        console.log('🔄 [SAVE] Выполнена миграция planetStats (старые поля → новые)');
    }
}

/**
 * Гарантирует наличие achievementsV2 для всех 9 планет
 */
function ensureAchievementsV2Structure() {
    if (!window.gameState) window.gameState = {};
    if (!window.gameState.achievementsV2) window.gameState.achievementsV2 = {};
    
    const planetOrder = window.GAME_CONFIG?.planetOrder || ['mercury'];
    
    const achTemplate = {
        rank: 0,
        totalUnlocked: 0,
        metrics: {},
        masterUnlocked: false
    };
    
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

/**
 * Гарантирует наличие skipPenaltyState (протокол отката)
 */
function ensureSkipPenaltyState() {
    if (!window.gameState) return;
    if (!window.gameState.skipPenaltyState) {
        window.gameState.skipPenaltyState = {
            activated: false,
            skipCount: 0,
            rollbackCount: 0,
            activationDistance: 0,
            totalRolledBack: 0
        };
    }
}

function reconstructMetricsFromAchievements() {
    try {
        if (!window.gameState || !window.gameMetrics) return;

        ensurePlanetStatsStructure();
        ensureAchievementsV2Structure();
        ensureSkipPenaltyState();

        const gm = window.gameMetrics;
        const ach = window.gameState.achievementsV2;
        if (!ach) return;

        console.log('🔄 [SAVE-SYSTEM] Принудительная синхронизация достижений...');
        let syncCount = 0;

        const planetMapping = {
            blocks: 'blocks', crits: 'crits', combo: 'combo', rare: 'rare',
            damage: 'damageDealt', crystals: 'crystalsEarned', bobo: 'boboActivations',
            boboDmg: 'boboDamage', boboCrystals: 'boboCrystalsEarned',
            upgrades: 'upgrades', time: 'timePlayed', speed: 'fastestBlock', critStreak: 'maxCritStreak'
        };

        for (const planet in ach) {
            const planetStats = gm.planetStats?.[planet];
            if (!planetStats || !ach[planet]?.metrics) continue;

            for (const [metricKey, statField] of Object.entries(planetMapping)) {
                if (!ach[planet].metrics[metricKey]) {
                    ach[planet].metrics[metricKey] = { level: 0, progress: 0 };
                }

                const realValue = planetStats[statField] || 0;
                const savedProgress = ach[planet].metrics[metricKey].progress || 0;

                // 🛡️ ЖЕСТКОЕ ПРАВИЛО: Если реальный прогресс в игре ВЫШЕ сохранённого в ачивках, перезаписываем
                if (realValue > savedProgress) {
                    console.log(`   🛠️ Исправлено: [${planet}] ${metricKey} было ${savedProgress}, стало ${realValue}`);
                    ach[planet].metrics[metricKey].progress = realValue;
                    syncCount++;

                    // Просим систему достижений пересчитать уровень на основе нового прогресса
                    try {
                        const module = window.AchievementsV2?.PlanetFactory?.get(planet);
                        if (module && typeof module.updateMetric === 'function') {
                            module.updateMetric(metricKey, realValue, 'set');
                        }
                    } catch (err) {
                        console.warn('⚠️ Ошибка пересчета уровня ачивки (не критично):', err);
                    }
                }
            }
        }

        if (syncCount > 0) {
            console.warn(`⚠️ [SAVE-SYSTEM] Успешно восстановлено ${syncCount} значений прогресса.`);
            try {
                if (window.gameState.gameActive && window.AchievementsV2?.UI?.updateAchievementsButton) {
                    setTimeout(() => window.AchievementsV2.UI.updateAchievementsButton(), 100);
                }
            } catch (err) {
                console.warn('⚠️ Ошибка обновления UI достижений (не критично):', err);
            }
        } else {
            console.log('✅ [SAVE-SYSTEM] Прогресс достижений полностью синхронизирован с игрой.');
        }
    } catch (error) {
        console.error('❌ [SAVE-SYSTEM] Критическая ошибка синхронизации достижений:', error);
    }
}

function extractCloudData() {
    if (!window.gameState) return null;
    const planetOrder = window.GAME_CONFIG?.planetOrder || ['mercury'];
    const currentLevel = planetOrder.indexOf(window.gameState.currentLocation) + 1;
    const username = (typeof window.getTelegramUsername === 'function') 
        ? window.getTelegramUsername()
        : (window.telegramUser?.username || window.telegramUser?.first_name || 'Anonymous');
    
    // ✅ dailyProgress теперь часть gameState, он сохранится автоматически внутри full_game_state
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
        
        // ✅ Лог для отладки: проверяем, загрузились ли достижения v2
        const achV2 = window.gameState.achievementsV2 || {};
        const planetCount = Object.keys(achV2).length;
        console.log(`☁️ [LOAD] achievementsV2 загружен: ${planetCount} планет`);
        for (const planet in achV2) {
            const ach = achV2[planet];
            const metricsCount = Object.keys(ach.metrics || {}).length;
            console.log(`   ${planet}: rank=${ach.rank}, unlocked=${ach.totalUnlocked}, metrics=${metricsCount}, master=${ach.masterUnlocked}`);
        }
    }
    
    // ✅ ИСПРАВЛЕНО: full_game_metrics (с 's') — было full_game_metric (опечатка)
    if (cloudData.full_game_metrics) {
        console.log('📊 [LOAD] Накатываем gameMetrics...');
        window.gameMetrics = deepMerge(DEFAULT_GAME_METRICS, cloudData.full_game_metrics);
        console.log('📊 [LOAD] planetStats загружен:', Object.keys(window.gameMetrics.planetStats || {}).length, 'планет');
    } else {
        console.warn('⚠️ [LOAD] full_game_metrics отсутствует в облачных данных');
    }
    
    
    ensurePlanetStatsStructure();
    ensureAchievementsV2Structure();
    ensureSkipPenaltyState();
    
    // ✅ dailyProgress восстанавливается автоматически функцией deepMerge выше, 
    // так как он теперь является частью full_game_state.
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
        
        // ✅ ЖЕСТКАЯ БЛОКИРОВКА: Запрещаем любое сохранение, пока идёт загрузка
        if (isLoadingFromCloud && !cloudLoadCompleted) {
            console.log('⏳ [SAVE] ОТМЕНА: идёт загрузка из облака, сохранение заблокировано');
            return false;
        }
        
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
    // ✅ ЖЕСТКАЯ БЛОКИРОВКА: Дублируем защиту на уровне самого запроса
    if (isLoadingFromCloud && !cloudLoadCompleted) {
        console.log('⏳ [SAVE] Пропуск: загрузка из облака ещё не завершена');
        return;
    }

    if (!window.telegramCloud?.isAvailable || isOperationLocked || isSyncing) return;
    const now = Date.now();
    if (now - lastCloudSync < CLOUD_SYNC_COOLDOWN) return;
    
    const gs = window.gameState;
    
    // ✅ КРИТИЧЕСКАЯ ПРОВЕРКА: НЕ сохраняем пустое/дефолтное состояние!
    const hasRealData = (
        (gs?.coins || 0) > 100 ||           // Хотя бы 100 кристаллов
        (gs?.totalDamageDealt || 0) > 1000 ||  // Хотя бы 1000 урона
        (gs?.clickUpgradeLevel || 0) > 0 ||    // Хотя бы 1 апгрейд
        (gs?.currentLocation && gs.currentLocation !== 'mercury') || // Или другая планета
        (Object.keys(gs?.achievementsV2 || {}).length > 0) // Или есть достижения
    );
    
    const isNewGame = gs?._isNewGame === true;
    
    if (!hasRealData && !isNewGame) {
        console.warn('⚠️ [SAVE] ОТМЕНА СОХРАНЕНИЯ: gameState пустой или дефолтный!');
        console.log('📊 Текущее состояние:', {
            coins: gs?.coins,
            damage: gs?.totalDamageDealt,
            upgrades: gs?.clickUpgradeLevel,
            location: gs?.currentLocation,
            achievements: Object.keys(gs?.achievementsV2 || {}).length
        });
        return;  // ✅ НЕ СОХРАНЯЕМ ПУСТОЕ СОСТОЯНИЕ!
    }
    
    isSyncing = true;
    try {
        const cloudData = extractCloudData();
        if (cloudData) {
            console.log('☁️ [SAVE] Сохраняем в облако:', {
                coins: cloudData.crystals,
                damage: cloudData.score,
                location: cloudData.level
            });
            const result = await window.telegramCloud.saveProgress(cloudData);
            if (result?.success) {
                lastCloudSync = now;
                showSaveIndicator('☁️', 'Сохранено', '#4CAF50');
            } else {
                showSaveIndicator('⚠️', 'Ошибка', '#ff9800');
            }
        }
    } catch (e) {
        console.error('❌ [SAVE] Ошибка сохранения:', e);
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
        // ✅ Устанавливаем флаг загрузки
        isLoadingFromCloud = true;
        cloudLoadCompleted = false;
        cloudLoadStartTime = Date.now();
        
        // ✅ Обновляем UI кнопки
        updateContinueButton('loading', 0);
        
        // ✅ Ждём инициализации telegramCloud (максимум 3 секунды)
        let retries = 0;
        while (!window.telegramCloud && retries < 30) {
            await new Promise(r => setTimeout(r, 100));
            retries++;
        }
        
        if (!window.telegramCloud?.isAvailable) {
            console.warn('⚠️ [LOAD] Облако недоступно.');
            isLoadingFromCloud = false;
            cloudLoadCompleted = true;
            updateContinueButton('error', 0);
            return false;
        }
        
        // ✅ Запускаем таймер прогресса загрузки (визуальный)
        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - cloudLoadStartTime;
            const progress = Math.min(90, (elapsed / CLOUD_LOAD_TIMEOUT) * 100);
            updateContinueButton('loading', progress);
            
            // ✅ Проверка на таймаут
            if (elapsed >= CLOUD_LOAD_TIMEOUT) {
                clearInterval(progressInterval);
                isLoadingFromCloud = false;
                cloudLoadCompleted = true;
                updateContinueButton('timeout', 100);
                throw new Error('Cloud load timeout');
            }
        }, 100);
        
        // ✅ Пытаемся загрузить
        const result = await window.telegramCloud.loadProgress();
        clearInterval(progressInterval);
        
        if (result?.success && result.data) {
            console.log('☁️ [LOAD] Данные успешно загружены из облака');
            applyCloudData(result.data);
            isLoadingFromCloud = false;
            cloudLoadCompleted = true;
            updateContinueButton('ready', 100);
            return true;
        } else {
            console.log('☁️ [LOAD] Облако пустое. Начинаем новую игру.');
            isLoadingFromCloud = false;
            cloudLoadCompleted = true;
            updateContinueButton('ready', 100); // Разрешаем начать новую игру
            return false;
        }
    } catch (e) {
        console.error('❌ [LOAD] Ошибка загрузки из облака:', e);
        isLoadingFromCloud = false;
        cloudLoadCompleted = true;
        updateContinueButton('error', 0);
        return false;
    }
};

 // ============================================
// УПРАВЛЕНИЕ КНОПКОЙ "ПРОДОЛЖИТЬ"
// ============================================
function updateContinueButton(status, progress) {
    const btn = document.getElementById('continueBtn');
    if (!btn) return;
    
    const btnText = btn.querySelector('.btn-text');
    const btnStatus = btn.querySelector('.btn-status');
    const loadingOverlay = btn.querySelector('.btn-loading-overlay');
    const loadingBar = btn.querySelector('.btn-loading-bar');
    
    if (!btnText || !btnStatus || !loadingOverlay || !loadingBar) return;
    
    switch (status) {
        case 'loading':
            btn.disabled = true;
            btn.classList.remove('ready', 'error');
            btn.classList.add('loading');
            btnText.textContent = 'Продолжить';
            btnStatus.textContent = ' Загрузка...';
            loadingOverlay.style.display = 'block';
            loadingBar.style.width = progress + '%';
            break;
            
        case 'ready':
            btn.disabled = false;
            btn.classList.remove('loading', 'error');
            btn.classList.add('ready');
            btnText.textContent = 'Продолжить';
            btnStatus.textContent = '✅ Готово';
            loadingOverlay.style.display = 'block';
            loadingBar.style.width = '100%';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
                btnStatus.textContent = '';
            }, 500);
            break;
            
        case 'error':
        case 'timeout':
            btn.disabled = true;
            btn.classList.remove('loading', 'ready');
            btn.classList.add('error');
            btnText.textContent = 'Ошибка';
            btnStatus.textContent = status === 'timeout' 
                ? '⏰ Превышено время загрузки (30 сек)' 
                : '❌ Ошибка соединения';
            loadingOverlay.style.display = 'none';
            
            // Показываем сообщение
            setTimeout(() => {
                alert('Ошибка загрузки сохранения. Пожалуйста, перезагрузите страницу.');
            }, 100);
            break;
    }
}

// Экспортируем функцию для использования в game-core.js
window.updateContinueButton = updateContinueButton;

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
        }
        
        // ✅ НЕ сохраняем сразу! Ждём активации кнопки пользователем
        
        if (window.EventBus) {
            window.EventBus.emit('save:ready');
            console.log('📡 [SAVE] Эмитировано событие save:ready');
        }
    } catch (e) {
        console.error('❌ [CLOUD-INIT] Критическая ошибка:', e);
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
        // ✅ Сохраняем только если игра активна И загрузка из облака полностью завершена
        if (window.gameState && window.gameState.gameActive && cloudLoadCompleted) {
            window.saveGame();
        }
    }, AUTO_SAVE_INTERVAL);
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
function init() {
    window.gameState = deepMerge(DEFAULT_GAME_STATE, window.gameState || {});
    window.gameMetrics = deepMerge(DEFAULT_GAME_METRICS, window.gameMetrics || {});
    
    // ✅ НОВОЕ: Сначала обеспечиваем структуру, потом верифицируем
    ensurePlanetStatsStructure();
    ensureAchievementsV2Structure();
    ensureSkipPenaltyState();
    
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
