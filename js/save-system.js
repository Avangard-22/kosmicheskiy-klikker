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

// ✅ Единая точка выбора бэкенда: облако Telegram → локальный fallback
function getCloud() {
    if (window.telegramCloud?.isAvailable) return window.telegramCloud;
    if (window.localCloud?.isAvailable) return window.localCloud;
    return null;
}
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
    darkMatter: 0,               // ⚠️ LEGACY
    clickPower: 1,
    critChance: 0.001,
    critMultiplier: 2.0,
    currentLocation: 'mercury',
    totalDamageDealt: 0,
    planetDamageDealt: 0,
    clickUpgradeLevel: 0,
    critChanceUpgradeLevel: 0,
    critMultiplierUpgradeLevel: 0,
    helperUpgradeLevel: 0,
    helperSpeedLevel: 0,   // 🆕 v11: Ускоритель (интервал Bobo)
    resonanceLevel: 0,     // 🆕 v11: Резонанс (окно комбо)
    gravityLevel: 0,       // 🆕 v11: Гравитационный колодец
    anchorLevel: 0,        // 🆕 v11: Квантовый якорь (телепорты)
    compassLevel: 0,       // 🆕 v11: Звёздный компас (редкие блоки)
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

     // ✅ BoC-экономика v3
bocEarned: 0,                 // престиж-BoC (пассивный бонус, не тратится)
bocLiquid: 0,                 // жидкая BoC (кэшбэк + конвертация, тратится на врата)
bocSpentOnGates: 0,           // сколько BoC ушло на врата (метрика)
heliopauseProgress: 0,        // 🌌 прогресс рейда Гелиопаузы, 0–100% (персистентно)
    teleportMult: 1,              // множитель телепорта (сумма стека, кап ×20)
    planetTeleports: 0,           // счётчик телепортов на планете
    runNumber: 1,                 // № престиж-рана (скейлинг цен врат)
    _helioPct: 0,                 // рейд Гелиопаузы: 0–100% (+10% за ран)
    _tpStacks: {},                // стеки множителей телепорта по локациям (FIFO ≤5)
    _spentRun: 0,                 // потрачено в текущем ране (КПД Кузницы)
    _farmRunsOnPlanet: 0,         // фарм-проходы текущей локации (истощение жилы)
    _planetCompleteShown: null,   // флаг экрана завершения

    // ✅ Кешбэк-метрики (5% от трат → BoC)
    cashbackSpentCrystals: 0,     // сумма потраченных 💎, с которых начислен кешбэк
    cashbackBoCEarned: 0,         // сумма начисленного BoC (дробное)
    cashbackCrystalsTotal: 0,     // аналитика (зарезервировано)

    achievementsV2: {}
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
    
// ✅ ФАБРИКА: каждая планета получает СОБСТВЕННЫЙ объект metrics.
// Object.assign({}, template) копировал ссылку на один metrics на всех —
// это и был корень «перетекания» прогресса между локациями.
function freshPlanetAch() {
    return { rank: 0, totalUnlocked: 0, metrics: {}, masterUnlocked: false };
}
planetOrder.forEach(planet => {
if (!window.gameState.achievementsV2[planet]) {
window.gameState.achievementsV2[planet] = freshPlanetAch();
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
 * Полный сброс прогресса ПЛАНЕТЫ (престиж-телепорт).
 * Единый источник: сбрасываем И достижения V2, И фактические planetStats.
 * Иначе reconstructMetricsFromAchievements() «воскресит» старый прогресс
 * из gameMetrics.planetStats сразу после телепорта.
 * Флаг _teleportReset говорит синхронизации: планету не трогать
 * (защитное окно 60 с — на время ближайших сейвов/перезагрузок).
 */
window.resetPlanetProgress = function (planet) {
    if (!window.gameState || !planet) return;

    // 1. Достижения V2 — как раньше (мастер-статус сохраняем).
    const ach = window.gameState.achievementsV2?.[planet];
    if (ach) {
        const master = ach.masterUnlocked || false;
        ach.metrics = {};
        ach.rank = master ? 1 : 0;
        ach.totalUnlocked = master ? 1 : 0;
        ach.masterUnlocked = master;
    }

    // 2. Фактические метрики планеты — обнуляем, чтобы синхронизация не воскресила старые значения.
    //    Шаблон полей совпадает с ensurePlanetStatsStructure().
    if (window.gameMetrics?.planetStats?.[planet]) {
        window.gameMetrics.planetStats[planet] = {
            blocks: 0, crits: 0, combo: 0, rare: 0,
            damageDealt: 0, crystalsEarned: 0,
            boboActivations: 0, boboDamage: 0, boboCrystalsEarned: 0,
            upgrades: 0, timePlayed: 0,
            fastestBlock: 0, maxCritStreak: 0
        };
    }

    // 3. Флаг: защитное окно на синхронизацию.
    window.gameState._teleportReset = window.gameState._teleportReset || {};
    window.gameState._teleportReset[planet] = Date.now();
};

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
        // ✅ ТЕЛЕПОРТ-ЗАЩИТА: планета, только что сброшенная телепортом,
        //    не синхронизируется из planetStats (там могут быть остатки),
        //    пока не пройдёт защитное окно 60 с.
        const tpReset = window.gameState?._teleportReset || {};
        const tpNow = Date.now();
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

const currentLocation = window.gameState?.currentLocation;

for (const planet in ach) {
    if (!ach[planet] || !ach[planet].metrics) continue;
    
    // ✅ ЗАЩИТА 1: Пропускаем замороженные планеты
    // (пройденные через Врата, метрики должны стоять)
    if (ach[planet].frozen) {
        continue;
    }
    
    // ✅ ЗАЩИТА 2: Синхронизируем ТОЛЬКО текущую локацию
    // (остальные планеты обновляются только через фабрику)
    if (planet !== currentLocation) {
        continue;
    }
    
    // Проверяем защитное окно телепорта
    if (tpReset[planet] && tpNow - tpReset[planet] < 60000) {
        console.log(`⏭️ [SAVE] ${planet} сброшена телепортом — синхронизация пропущена`);
        continue;
    }
    
    const planetStats = gm.planetStats?.[planet];
    if (!planetStats || !ach[planet]?.metrics) continue;
    
    for (const [metricKey, statField] of Object.entries(planetMapping)) {
        if (!ach[planet].metrics[metricKey]) {
            ach[planet].metrics[metricKey] = { level: 0, progress: 0 };
        }
        const realValue = planetStats[statField] || 0;
        const savedProgress = ach[planet].metrics[metricKey].progress || 0;
        
        if (realValue > savedProgress) {
            console.log(`🛠️ Исправлено: [${planet}] ${metricKey} было ${savedProgress}, стало ${realValue}`);
            ach[planet].metrics[metricKey].progress = realValue;
            syncCount++;
            
            try {
                const module = window.AchievementsV2?.PlanetFactory?.get(planet);
                if (module && typeof module.updateMetric === 'function') {
                    module.updateMetric(metricKey, realValue, 'set');
                }
            } catch (err) {
                console.warn(`⚠️ Ошибка пересчета уровня ачивки:`, err);
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
   // ✅ РЕЛИЗ: Санитайзим full_game_state — НЕ отправляем legacy/временные поля
    const cleanState = JSON.parse(JSON.stringify(window.gameState));
    delete cleanState.achievements;          // V1 достижения (система переведена на V2)
    delete cleanState._dailyProgressBackup;  // бэкап daily-bonus (мёртвый)
    delete cleanState.dailyProgress;         // старый daily-bonus (мёртвый)
    delete cleanState._isNewGame;            // временный флаг сброса

    return {
        crystals: Math.floor(window.gameState.coins || 0),
        level: currentLevel,
        score: Math.floor(window.gameState.totalDamageDealt || 0),
        bobo_skin: window.gameState.boboSkin || 'default',
        username: username,
        timestamp: Date.now(),
        full_game_state: cleanState,
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
     delete window.gameState.achievements;
    delete window.gameState._dailyProgressBackup;
    delete window.gameState.dailyProgress;
    delete window.gameState._isNewGame;
        
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
    
// Вызывать ПОСЛЕ восстановления gameState/gameMetrics из облака (save-system.js)
function repairCopiedMetrics() {
    const gs = window.gameState;
    const gm = window.gameMetrics;
    if (!gs?.achievementsV2 || !gm?.planetStats) return;
    
    const currentLocation = gs.currentLocation;
    const unlockedLocations = gs.unlockedLocations || ['mercury'];
    let fixed = 0;
    
    for (const [planet, ach] of Object.entries(gs.achievementsV2)) {
        if (!ach || !ach.metrics) continue;
        
        // ✅ Пропускаем текущую планету (она может иметь легитимный прогресс)
        if (planet === currentLocation) continue;
        
        // ✅ Пропускаем замороженные планеты (они прошли Врата корректно)
        if (ach.frozen) continue;
        
        // ✅ Пропускаем разблокированные планеты (игрок мог их посещать)
        if (unlockedLocations.includes(planet)) continue;
        
        // Для всех остальных (неоткрытых, не замороженных, не текущих) —
        // обнуляем метрики, если там есть ненулевой прогресс
        let hasPhantom = false;
        for (const key in ach.metrics) {
            const m = ach.metrics[key];
            if (m && (m.progress > 0 || m.level > 0)) {
                hasPhantom = true;
                break;
            }
        }
        
        if (hasPhantom) {
            for (const key in ach.metrics) {
                ach.metrics[key] = { level: 0, progress: 0 };
            }
            ach.masterUnlocked = false;
            ach.rank = 0;
            ach.totalUnlocked = 0;
            fixed++;
            console.log(`🔧 [REPAIR] ${planet}: сброшены фантомные метрики (не открыта, не заморожена)`);
        }
    }
    
    if (fixed > 0) {
        console.warn(`🔧 [REPAIR] Всего сброшено фантомных метрик: ${fixed} планет`);
    }
}
    
reconstructMetricsFromAchievements();
    
    // ✅ НОВОЕ: Гарантируем полную структуру после загрузки
    ensurePlanetStatsStructure();
    ensureAchievementsV2Structure();
    ensureSkipPenaltyState();
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
        
        // ✅ НОВОЕ: Запрет сохранения на главном экране
        // Игра не запущена (welcome screen) и это не сброс «Новой игры» → не сохраняем
        if (!window.gameState.gameActive && !window.gameState._isNewGame) {
            console.warn('⚠️ [SAVE] Главный экран — сохранение отменено');
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
    if (cloudSaveTimeout) { clearTimeout(cloudSaveTimeout); cloudSaveTimeout = null; }
    const cloud = getCloud();
    if (cloud?.saveProgressCritical) {
        const cloudData = extractCloudData();
        if (cloudData) cloud.saveProgressCritical(cloudData);
    } else {
        cloudSaveAsync();
    }
};

// ЧТО: Асинхронное сохранение в облако с проверкой _isNewGame
// КУДА: save-system.js → cloudSaveAsync()
// ЗАЧЕМ: Если игрок нажал "Новая игра", _isNewGame=true позволяет сохранить
//        пустой сейв в облако, чтобы перезатереть старый прогресс.
async function cloudSaveAsync() {
    const cloud = getCloud();
    if (!cloud || isOperationLocked || isSyncing) return;
    
    const now = Date.now();
    if (now - lastCloudSync < CLOUD_SYNC_COOLDOWN) return;
    
    const gs = window.gameState;
    const hasRealData = gs?.coins > 0 || gs?.totalDamageDealt > 0 || gs?.clickUpgradeLevel > 0 || (gs?.currentLocation && gs.currentLocation !== 'mercury')
        || gs?.bocEarned > 0 || gs?.bocLiquid > 0;   // ✅ НОВОЕ (BoC): игрок с BoC тоже сохраняется
    const isNewGame = gs?._isNewGame === true;
    
    if (!hasRealData && !isNewGame) {
        console.log('☁️ [SAVE] Пропуск: нет реальных данных и это не новая игра');
        return;
    }
    
    isSyncing = true;
    try {
        const cloudData = extractCloudData();
        if (cloudData) {
        const result = await cloud.saveProgress(cloudData);
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
        const cloud = getCloud();
        if (!cloud) {
            console.warn('⚠️ [LOAD] Ни облака, ни локального хранилища. Начинаем новую игру.');
            return false;
        }
        const result = await cloud.loadProgress();
        
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
    // ✅ Глубокая копия вложенных объектов — DEFAULT остаётся девственно чистым
    window.gameState = Object.assign({}, DEFAULT_GAME_STATE, {
        achievementsV2: {},
        dailyBonus: { lastClaimDate: null, currentDay: 1, totalClaimed: 0, streak: 0 }
    });
    window.gameMetrics = Object.assign({}, DEFAULT_GAME_METRICS, {
        planetStats: {},
        visitedPlanets: []
    });
    window.gameMetrics.startTime = Date.now();
    window.gameState._isNewGame = true;

    // ✅ Сброс локального сейва (если используется)
    if (window.localCloud?.clear) {
        window.localCloud.clear();
    }
    
    // ✅ Сброс с ОБЯЗАТЕЛЬНОЙ перезаписью облака
    const cloud = getCloud();
    if (cloud?.saveProgress) {
        const emptyData = extractCloudData();
        if (emptyData) {
            emptyData.reset = true;   // ✅ сервер обязан перезаписать game_state_json
            
            // ❌ ИСПРАВЛЕНО: Убрана зависшая строка window.telegramCloud...
            // Оставлен только единственный корректный вызов cloud.saveProgress
            cloud.saveProgress(emptyData)
                .then((result) => {
                    if (result?.success) {
                        console.log('☁️ [RESET] Облако перезаписано: новая игра подтверждена');
                        // ✅ Снимаем флаг ТОЛЬКО после подтверждения
                        window.gameState._isNewGame = false;
                    } else {
                        console.error('❌ [RESET] Облако НЕ перезаписано:', result?.error);
                    }
                })
                .catch((e) => console.error('❌ [RESET] Ошибка очистки облака:', e));
        }
    }
    console.log('🔄 Прогресс обнулён локально');
};

window.hasSave = async function() {
    const cloud = getCloud();
    if (!cloud) return false;
    try {
        const result = await cloud.loadProgress();
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
