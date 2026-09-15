// js/save-system.js (v4.1 — ТОЛЬКО серверное сохранение + защита бесконечных метрик)
// PATCH v4.1:
//  1) resetPlanetProgress — заглушка без options.allowReset = true (метрики бесконечные)
//  2) repairCopiedMetrics — усилена (пропуск текущей/замороженных/открытых планет)
//  3) forceSyncAchievements — 3 сторожа: окно телепорта → frozen → только текущая локация
//  4) Порядок в applyCloudData/init: repair → reconstruct → ensure* → forceSync
(function() {
    'use strict';

    // ============================================
    // КОНСТАНТЫ
    // ============================================
    const AUTO_SAVE_INTERVAL = 30000;
    const CLOUD_SYNC_COOLDOWN = 5000;
    const CLOUD_SAVE_DEBOUNCE = 3000;
    const TP_RESET_WINDOW_MS = 60000; // защитное окно после явного сброса планеты

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
    // БАЗОВЫЕ СОСТОЯНИЯ (эталон для deepMerge/сброса)
    // ============================================
    const DEFAULT_GAME_STATE = {
        coins: 0,
        clickPower: 1,
        critChance: 0.001,
        critMultiplier: 2,
        currentLocation: 'mercury',
        totalDamageDealt: 0,
        planetDamageDealt: 0,
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
        shopItems: {},
        permanentBonuses: {},
        unlockedLocations: ['mercury'],
        boboSkin: 'default',
        dailyBonus: { lastClaimDate: null, currentDay: 1, totalClaimed: 0, streak: 0, lastClaimTimestamp: 0 },
        achievementsV2: {},
        skipPenaltyState: null,
        shopPurchaseCount: 0,
        shopPriceMultiplier: 1,
        planetFirstBlockCleared: false,
        dailyHpRampDate: null,
        dailyBlocksDestroyed: 0,
        bocLiquid: 0,
        bocEarned: 0,
        bocReserve: 0,
        runNumber: 1,
        heliopauseProgress: 0
    };

    const DEFAULT_GAME_METRICS = {
        startTime: 0,
        totalClicks: 0,
        totalCrits: 0,
        totalCoinsEarned: 0,
        helpersBought: 0,
        boostersUsed: 0,
        rareBlocksDestroyed: 0,
        maxCombo: 0,
        upgradesBought: 0,
        visitedPlanets: [],
        planetsVisited: 0,
        planetStats: {}
    };

    // Единая карта метрика-ачивки → поле planetStats (источник правды для синхронизации)
    const PLANET_METRIC_MAPPING = {
        blocks: 'blocks',
        crits: 'crits',
        combo: 'combo',
        rare: 'rare',
        damage: 'damageDealt',
        crystals: 'crystalsEarned',
        bobo: 'boboActivations',
        boboDmg: 'boboDamage',
        boboCrystals: 'boboCrystalsEarned',
        upgrades: 'upgrades',
        time: 'timePlayed',
        speed: 'fastestBlock',
        critStreak: 'maxCritStreak'
    };

    // ============================================
    // УТИЛИТЫ
    // ============================================
    function deepMerge(defaults, saved) {
        if (!saved || typeof saved !== 'object') return JSON.parse(JSON.stringify(defaults));
        const result = {};
        for (const key in defaults) {
            if (!(key in saved)) {
                result[key] = JSON.parse(JSON.stringify(defaults[key]));
            } else if (
                defaults[key] && typeof defaults[key] === 'object' && !Array.isArray(defaults[key]) &&
                saved[key] && typeof saved[key] === 'object' && !Array.isArray(saved[key])
            ) {
                result[key] = deepMerge(defaults[key], saved[key]);
            } else {
                result[key] = saved[key];
            }
        }
        // ключи, которых нет в defaults (новые поля сейва), сохраняем как есть
        for (const key in saved) {
            if (!(key in result)) result[key] = saved[key];
        }
        return result;
    }

    // ============================================
    // 🏗️ ОБЕСПЕЧЕНИЕ СТРУКТУРЫ ДАННЫХ
    // ============================================
    function ensurePlanetStatsStructure() {
        if (!window.gameMetrics) window.gameMetrics = {};
        if (!window.gameMetrics.planetStats) window.gameMetrics.planetStats = {};
        const planetOrder = window.GAME_CONFIG?.planetOrder ||
            ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'heliopause'];
        planetOrder.forEach(planet => {
            if (!window.gameMetrics.planetStats[planet]) window.gameMetrics.planetStats[planet] = {};
            const s = window.gameMetrics.planetStats[planet];
            Object.values(PLANET_METRIC_MAPPING).forEach(field => {
                if (typeof s[field] !== 'number' || !Number.isFinite(s[field])) s[field] = 0;
            });
        });
    }

    function ensureAchievementsV2Structure() {
        const gs = window.gameState;
        if (!gs) return;
        if (!gs.achievementsV2 || typeof gs.achievementsV2 !== 'object') gs.achievementsV2 = {};
        const planetOrder = window.GAME_CONFIG?.planetOrder ||
            ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'heliopause'];
        planetOrder.forEach(planet => {
            if (!gs.achievementsV2[planet]) {
                gs.achievementsV2[planet] = { rank: 0, totalUnlocked: 0, masterUnlocked: false, frozen: false, metrics: {} };
            }
            const ach = gs.achievementsV2[planet];
            if (typeof ach.frozen !== 'boolean') ach.frozen = false;
            if (!ach.metrics || typeof ach.metrics !== 'object') ach.metrics = {};
            Object.keys(PLANET_METRIC_MAPPING).forEach(key => {
                if (!ach.metrics[key] || typeof ach.metrics[key] !== 'object') {
                    ach.metrics[key] = { level: 0, progress: 0 };
                }
            });
        });
    }

    function ensureSkipPenaltyState() {
        const gs = window.gameState;
        if (!gs) return;
        if (!gs.skipPenaltyState || typeof gs.skipPenaltyState !== 'object') {
            gs.skipPenaltyState = { missedBlocks: 0, penalties: 0, lastPenaltyTime: 0 };
        }
    }

    // ============================================
    // 🔁 РЕКОНСТРУКЦИЯ planetStats ИЗ АЧИВОК (только ВВЕРХ)
    // Вызывать ПОСЛЕ repairCopiedMetrics(), иначе фантомы разлетятся по planetStats
    // ============================================
    function reconstructMetricsFromAchievements() {
        const gs = window.gameState, gm = window.gameMetrics;
        if (!gs?.achievementsV2 || !gm?.planetStats) return;
        let count = 0;
        for (const planet in gs.achievementsV2) {
            const ach = gs.achievementsV2[planet];
            const stats = gm.planetStats[planet];
            if (!ach?.metrics || !stats) continue;
            for (const [metricKey, statField] of Object.entries(PLANET_METRIC_MAPPING)) {
                const fromAch = ach.metrics[metricKey]?.progress || 0;
                const cur = stats[statField] || 0;
                if (fromAch > cur) {
                    stats[statField] = fromAch;
                    count++;
                }
            }
        }
        if (count > 0) console.log(`🔁 [SAVE-SYSTEM] Реконструкция planetStats из ачивок: ${count} значений`);
    }

    // ============================================
    // 🔧 PATCH v4.1 (СЕГМЕНТ 2): ОДНОРАЗОВАЯ ЧИСТКА ФАНТОМОВ
    // Чистим копии ТОЛЬКО на планетах: не текущая, не заморожена, не открыта.
    // ============================================
    function repairCopiedMetrics() {
        const gs = window.gameState, gm = window.gameMetrics;
        if (!gs?.achievementsV2 || !gm?.planetStats) return;

        const current = gs.currentLocation;
        const unlocked = gs.unlockedLocations || ['mercury'];
        let fixed = 0;

        for (const [planet, ach] of Object.entries(gs.achievementsV2)) {
            if (!ach || !ach.metrics) continue;
            if (planet === current) continue;         // текущую не трогаем
            if (ach.frozen) continue;                 // замороженные (пройденные) не трогаем
            if (unlocked.includes(planet)) continue;  // открытые могли быть посещены легально

            let hasPhantom = false;
            for (const key of Object.keys(ach.metrics)) {
                const m = ach.metrics[key];
                if (m && ((m.progress || 0) > 0 || (m.level || 0) > 0)) { hasPhantom = true; break; }
            }
            if (!hasPhantom) continue;

            for (const key of Object.keys(ach.metrics)) ach.metrics[key] = { level: 0, progress: 0 };
            ach.rank = 0;
            ach.totalUnlocked = 0;
            ach.masterUnlocked = false;
            fixed++;
            console.log(`🔧 [REPAIR] ${planet}: фантомные метрики сброшены (не открыта, не заморожена, не текущая)`);
        }
        if (fixed) console.warn(`🔧 [REPAIR] Всего очищено планет: ${fixed}`);
    }

    // ============================================
    // 🔄 PATCH v4.1 (СЕГМЕНТ 3): СИНХРОНИЗАЦИЯ С ЗАЩИТОЙ ЗАМОРОЗКИ
    // Сторожа: окно телепорта → frozen → только текущая локация. Только ВВЕРХ.
    // ============================================
    function forceSyncAchievements() {
        const gs = window.gameState, gm = window.gameMetrics;
        const ach = gs?.achievementsV2;
        if (!gs || !gm || !ach) return;

        const current = gs.currentLocation;
        const tpReset = gs._teleportReset || {};
        const tpNow = Date.now();

        console.log('🔄 [SAVE-SYSTEM] Принудительная синхронизация достижений (только текущая локация)...');
        let syncCount = 0;

        try {
            for (const planet in ach) {
                // ⏭️ СТОРОЖ 1: планета сброшена явно недавно (окно 60 с)
                if (tpReset[planet] && tpNow - tpReset[planet] < TP_RESET_WINDOW_MS) continue;
                // ❄️ СТОРОЖ 2: замороженная планета (пройдена через Врата) — метрики на паузе
                if (ach[planet].frozen) continue;
                // 📍 СТОРОЖ 3: синхронизируем ТОЛЬКО текущую локацию.
                //    Остальные планеты пишет исключительно фабрика (updateMetric со сторожами).
                if (planet !== current) continue;

                const planetStats = gm.planetStats?.[planet];
                if (!planetStats || !ach[planet]?.metrics) continue;

                for (const [metricKey, statField] of Object.entries(PLANET_METRIC_MAPPING)) {
                    if (!ach[planet].metrics[metricKey]) {
                        ach[planet].metrics[metricKey] = { level: 0, progress: 0 };
                    }
                    const realValue = planetStats[statField] || 0;
                    const savedProgress = ach[planet].metrics[metricKey].progress || 0;

                    // 🛡️ ЖЁСТКОЕ ПРАВИЛО: только ВВЕРХ и только для текущей планеты
                    if (realValue > savedProgress) {
                        console.log(` 🛠️ Исправлено: [${planet}] ${metricKey} было ${savedProgress}, стало ${realValue}`);
                        ach[planet].metrics[metricKey].progress = realValue;
                        syncCount++;
                        try {
                            const module = window.AchievementsV2?.PlanetFactory?.get?.(planet);
                            if (module && typeof module.updateMetric === 'function') {
                                module.updateMetric(metricKey, realValue, 'set');
                            }
                        } catch (err) {
                            console.warn('⚠️ Ошибка пересчета уровня ачивки:', err);
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

    // ============================================
    // ♻️ PATCH v4.1 (СЕГМЕНТ 1): ЗАГЛУШКА resetPlanetProgress
    // Без options.allowReset = true функция НЕ делает ничего:
    // боевые потоки (телепорт/врата/РАН) не могут обнулить бесконечные метрики.
    // ============================================
    window.resetPlanetProgress = function (planet, options) {
        const opts = options || {};
        if (opts.allowReset !== true) {
            console.warn(
                `🛡️ [SAVE] resetPlanetProgress('${planet}') ЗАБЛОКИРОВАН: ` +
                'требуется явное подтверждение (options.allowReset = true). ' +
                'Вызов из боевого потока? Используй resetPlanetState() — он не трогает метрики.'
            );
            return false;
        }
        if (!window.gameState || !planet) return false;

        // 1. Достижения V2 (мастер-статус сохраняем)
        const ach = window.gameState.achievementsV2?.[planet];
        if (ach) {
            const master = ach.masterUnlocked || false;
            ach.metrics = {};
            ach.rank = master ? 1 : 0;
            ach.totalUnlocked = master ? 1 : 0;
            ach.masterUnlocked = master;
            ach.frozen = false;
        }

        // 2. planetStats — в ноль, чтобы синхронизация не воскресила старые значения
        if (window.gameMetrics?.planetStats?.[planet]) {
            const zero = {};
            Object.values(PLANET_METRIC_MAPPING).forEach(field => { zero[field] = 0; });
            window.gameMetrics.planetStats[planet] = zero;
        }

        // 3. Защитное окно синхронизации (60 с)
        window.gameState._teleportReset = window.gameState._teleportReset || {};
        window.gameState._teleportReset[planet] = Date.now();

        console.warn(`♻️ [SAVE] resetPlanetProgress('${planet}') ВЫПОЛНЕН (явное подтверждение).`);
        return true;
    };

    // ============================================
    // 📦 ИЗВЛЕЧЕНИЕ ДАННЫХ ДЛЯ ОБЛАКА
    // ============================================
    function extractCloudData() {
        if (!window.gameState) return null;
        const planetOrder = window.GAME_CONFIG?.planetOrder || ['mercury'];
        const currentLevel = planetOrder.indexOf(window.gameState.currentLocation) + 1;
        const username = (typeof window.getTelegramUsername === 'function')
            ? window.getTelegramUsername()
            : (window.telegramUser?.username || window.telegramUser?.first_name || 'Anonymous');

        // ✅ РЕЛИЗ: Санитайзим full_game_state — НЕ отправляем legacy/временные поля
        const cleanState = JSON.parse(JSON.stringify(window.gameState));
        delete cleanState.achievements;            // V1 достижения (система переведена на V2)
        delete cleanState._dailyProgressBackup;    // бэкап daily-bonus (мёртвый)
        delete cleanState.dailyProgress;           // старый daily-bonus (мёртвый)
        delete cleanState._isNewGame;              // временный флаг сброса

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

    // ============================================
    // ☁️ ПРИМЕНЕНИЕ ДАННЫХ ИЗ ОБЛАКА
    // PATCH v4.1 (СЕГМЕНТ 4): порядок repair → reconstruct → ensure* → forceSync
    // ============================================
    function applyCloudData(cloudData) {
        if (!cloudData) return;

        if (cloudData.full_game_state) {
            console.log('☁️ [LOAD] Накатываем gameState...');
            const currentGameActive = window.gameState?.gameActive || false;
            const currentGamePaused = window.gameState?.gamePaused || false;
            window.gameState = deepMerge(DEFAULT_GAME_STATE, cloudData.full_game_state);
            window.gameState.gameActive = currentGameActive;
            window.gameState.gamePaused = currentGamePaused;
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
                console.log(`   • ${planet}: frozen=${!!ach.frozen}, метрик=${metricsCount}, rank=${ach.rank || 0}`);
            }
        } else {
            console.warn('⚠️ [LOAD] full_game_state отсутствует в облачных данных');
        }

        if (cloudData.full_game_metrics) {
            window.gameMetrics = deepMerge(DEFAULT_GAME_METRICS, cloudData.full_game_metrics);
            console.log('📊 [LOAD] planetStats загружен:', Object.keys(window.gameMetrics.planetStats || {}).length, 'планет');
        } else {
            console.warn('⚠️ [LOAD] full_game_metrics отсутствует в облачных данных');
        }

        // ✅ PATCH v4.1: правильный порядок (раньше repairCopiedMetrics не вызывалась вовсе)
        repairCopiedMetrics();                  // 1) чистим фантомы ДО реконструкции
        reconstructMetricsFromAchievements();   // 2) реконструируем planetStats из чистых ачивок
        ensurePlanetStatsStructure();           // 3) структура
        ensureAchievementsV2Structure();
        ensureSkipPenaltyState();
        forceSyncAchievements();                // 4) синхронизация только текущей в самом конце
    }

    // ============================================
    // ПУБЛИЧНЫЙ API СОХРАНЕНИЯ
    // ============================================
    window.saveGame = function() {
        try {
            if (!window.gameState) return false;

            // ✅ Запрет сохранения на главном экране
            if (!window.gameState.gameActive && !window.gameState._isNewGame) {
                console.warn('⚠️ [SAVE] Главный экран — сохранение отменено');
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

    async function cloudSaveAsync() {
        const cloud = getCloud();
        if (!cloud || isOperationLocked || isSyncing) return;

        const now = Date.now();
        if (now - lastCloudSync < CLOUD_SYNC_COOLDOWN) return;
        const gs = window.gameState;
        const hasRealData = gs?.coins > 0 || gs?.totalDamageDealt > 0 || gs?.clickUpgradeLevel > 0 ||
            (gs?.currentLocation && gs.currentLocation !== 'mercury') ||
            gs?.bocEarned > 0 || gs?.bocLiquid > 0;
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
            // ✅ Сигнализируем о готовности gameState
            if (window.EventBus) {
                window.EventBus.emit('save:ready');
                console.log('📡 [SAVE] Эмитировано событие save:ready');
            }
        } catch (e) {
            console.warn(e);
        }
    };

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
        // v4.1: структура + чистая синхронизация после сброса
        ensurePlanetStatsStructure();
        ensureAchievementsV2Structure();
        ensureSkipPenaltyState();
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

    function getCloud() {
        // Облако приоритетно; local-save подключается только если облака нет
        if (window.telegramCloud?.isAvailable) return window.telegramCloud;
        if (window.localCloud?.isAvailable) return window.localCloud;
        return window.telegramCloud || window.localCloud || null;
    }

    // ============================================
    // ВИЗУАЛЬНЫЙ ИНДИКАТОР
    // (стили #saveIndicator централизованы в styles.css — inline-стили убраны)
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
            document.body.appendChild(indicator);
        }
        indicator.textContent = `${icon} ${text}`;
        indicator.style.color = color;
        indicator.style.opacity = '1';
        if (indicator._hideTimer) clearTimeout(indicator._hideTimer);
        indicator._hideTimer = setTimeout(() => { indicator.style.opacity = '0'; }, 1500);
    }

    // ============================================
    // АВТОСОХРАНЕНИЕ
    // ============================================
    function startAutoSave() {
        if (autoSaveTimer) clearInterval(autoSaveTimer);
        autoSaveTimer = setInterval(() => {
            if (window.gameState?.gameActive) window.saveGame();
        }, AUTO_SAVE_INTERVAL);
    }

    // ============================================
    // ИНИЦИАЛИЗАЦИЯ
    // PATCH v4.1: старый inline-блок синхронизации заменён на forceSyncAchievements()
    // ============================================
    function init() {
        window.gameState = deepMerge(DEFAULT_GAME_STATE, window.gameState || {});
        window.gameMetrics = deepMerge(DEFAULT_GAME_METRICS, window.gameMetrics || {});

        // ✅ Сначала обеспечиваем структуру, потом чистим, потом верифицируем
        ensurePlanetStatsStructure();
        ensureAchievementsV2Structure();
        ensureSkipPenaltyState();
        repairCopiedMetrics();
        reconstructMetricsFromAchievements();
        forceSyncAchievements();

        startAutoSave();
        const forceSave = () => { if (window.gameState?.gameActive) window.flushCloudSave(); };
        window.addEventListener('beforeunload', forceSave);
        document.addEventListener('visibilitychange', () => { if (document.hidden) forceSave(); });
        console.log('💾 Save System v4.1 готова (ТОЛЬКО сервер, без localStorage)');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();