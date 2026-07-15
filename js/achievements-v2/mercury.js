// js/achievements-v2/mercury.js
// ═══════════════════════════════════════════════════
// 🧪 МЕРКУРИЙ v2.0 — Контекстная система достижений
// ЧТО: Самодостаточный модуль локации с бесконечной прогрессией.
//      Одна метрика = одна карточка. Генерация по формулам.
// ЗАЧЕМ: Фундамент для масштабирования на все планеты.
// ИНТЕГРАЦИЯ: gameState.achievementsV2.mercury (save-system)
//             combat-system.js → achievementsSystem.increment*()
// ═══════════════════════════════════════════════════
(function() {
'use strict';

// ─────────────────────────────────────────────────────
// 🔢 ДЕТЕРМИНИРОВАННЫЙ JITTER (±10%)
// ЧТО: hashStr(seed) → стабильное число между сессиями
// ЗАЧЕМ: Цели не меняются при перезагрузке, но не «круглые»
// ─────────────────────────────────────────────────────
function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0);
}

function jit(seed, pct) {
    return 1 + ((hashStr(seed) % 1000) / 1000 - 0.5) * 2 * pct;
}

// ─────────────────────────────────────────────────────
// 📐 КОНФИГУРАЦИЯ МЕРКУРИЯ
// ЧТО: Единый источник всех числовых параметров локации
// ЗАЧЕМ: Баланс тюнится здесь, генератор не меняется
// ─────────────────────────────────────────────────────
const CONFIG = {
    id: 'mercury',
    prefix: 'm',
    emoji: '☿',
    nameKey: 'gameTitle.mercury',
    descKey: 'achievements.mercury.description',
    scale: 1.0,                    // Масштаб (база для всех планет)
    masterAU: 0.38710,             // AU для финального достижения
    
    // 10 метрик: base × growth^tier × jit(seed)
metrics: {
    // ── БОЕВЫЕ (уже работают) ──
    blocks:   { base: 1,     growth: 1.50, rewardBase: 25,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '🔨' },
    crits:    { base: 10,    growth: 1.60, rewardBase: 60,   rewardGrowth: 1.10, type: 'cumulative',  emoji: '⚡' },
    combo:    { base: 5,     growth: 1.40, rewardBase: 80,   rewardGrowth: 1.12, type: 'record_max',  emoji: '🔥' },
    rare:     { base: 3,     growth: 1.80, rewardBase: 150,  rewardGrowth: 1.15, type: 'cumulative',  emoji: '⭐' },
    damage:   { base: 500,   growth: 1.70, rewardBase: 40,   rewardGrowth: 1.09, type: 'cumulative',  emoji: '💥' },
    
    // ── ЭКОНОМИКА И ПОМОЩНИКИ (подключаем) ──
    crystals: { base: 200,   growth: 1.60, rewardBase: 30,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '💎' },
    bobo:     { base: 3,     growth: 1.50, rewardBase: 100,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '🤖' },
    boboKills: { base: 5,     growth: 1.55, rewardBase: 45,   rewardGrowth: 1.10, type: 'cumulative',  emoji: '🔧' },
    boboDmg:   { base: 1000,  growth: 1.55, rewardBase: 50,   rewardGrowth: 1.10, type: 'cumulative',  emoji: '⚡' },
    
    // ── НАВЫК И ЭФФЕКТИВНОСТЬ (подключаем + новое) ──
    time:     { base: 60,    growth: 1.30, rewardBase: 50,   rewardGrowth: 1.07, type: 'cumulative',  emoji: '⏱️' },
    speed:    { base: 30000, growth: 0.85, rewardBase: 120,  rewardGrowth: 1.12, type: 'record_min',  emoji: '🏃' },
    accuracy: { base: 50,    growth: 1.20, rewardBase: 90,   rewardGrowth: 1.10, type: 'record_max',  emoji: '🎯' },
    perfect:  { base: 10,    growth: 1.50, rewardBase: 200,  rewardGrowth: 1.15, type: 'record_max',  emoji: '✨' } // НОВОЕ
    critStreak:{ base: 3,     growth: 1.40, rewardBase: 150,  rewardGrowth: 1.12, type: 'record_max',  emoji: '🎯' }
}
};

// ─────────────────────────────────────────────────────
// 🏷️ ШАБЛОНЫ ИМЁН (мультиязычность через translations.js)
// ЧТО: {N} заменяется на номер уровня при рендеринге
// ЗАЧЕМ: Не хардкодим имена — переводы в translations.js
// ─────────────────────────────────────────────────────
const NAME_TEMPLATES = {
    // ── БОЕВЫЕ ──
    blocks:   { key: 'achievements.mercury.metrics.blocks',   fallback: 'Уничтожено блоков' },
    crits:    { key: 'achievements.mercury.metrics.crits',    fallback: 'Критических ударов' },
    combo:    { key: 'achievements.mercury.metrics.combo',    fallback: 'Максимальное комбо' },
    rare:     { key: 'achievements.mercury.metrics.rare',     fallback: 'Редких блоков' },
    damage:   { key: 'achievements.mercury.metrics.damage',   fallback: 'Нанесено урона' },
    
    // ── ЭКОНОМИКА И ПОМОЩНИКИ ──
    crystals: { key: 'achievements.mercury.metrics.crystals', fallback: 'Заработано кристаллов' },
    bobo:     { key: 'achievements.mercury.metrics.bobo',     fallback: 'Активаций Bobo' },
    boboKills: { key: 'achievements.mercury.metrics.boboKills', fallback: 'Блоков уничтожено Bobo' },
    boboDmg:   { key: 'achievements.mercury.metrics.boboDmg',   fallback: 'Урона нанесено Bobo' },
     
    // ── НАВЫК И ЭФФЕКТИВНОСТЬ ──
    time:     { key: 'achievements.mercury.metrics.time',     fallback: 'Секунд на планете' },
    speed:    { key: 'achievements.mercury.metrics.speed',    fallback: 'Рекорд скорости (мс)' },
    accuracy: { key: 'achievements.mercury.metrics.accuracy', fallback: 'Точность попаданий (%)' },
    perfect:  { key: 'achievements.mercury.metrics.perfect',  fallback: 'Идеальная серия' } // НОВОЕ
    critStreak:{ key: 'achievements.mercury.metrics.critStreak',fallback: 'Серия критов подряд' }
};

// ─────────────────────────────────────────────────────
// 🎖️ РАНГИ И ЗВАНИЯ
// ЧТО: Суммарные уровни → звание + перманентный бонус
// ЗАЧЕМ: Долгосрочная мотивация, кумулятивные бонусы
// ─────────────────────────────────────────────────────
const RANKS = [
    { threshold: 1,    title: { ru: '✨ Искра',       en: '✨ Spark',          zh: '✨ 火花' },     bonus: null },
    { threshold: 10,   title: { ru: '🌟 Созвездие',   en: '🌟 Constellation',  zh: '🌟 星座' },   bonus: { type: 'clickPower', value: 0.01 } },
    { threshold: 50,   title: { ru: '🌌 Галактика',   en: '🌌 Galaxy',         zh: '🌌 星系' },   bonus: { type: 'coinsMult', value: 0.02 } },
    { threshold: 100,  title: { ru: '🌫️ Туманность',  en: '🌫️ Nebula',         zh: '🌫️ 星云' },   bonus: { type: 'critChance', value: 0.003 } },
    { threshold: 250,  title: { ru: '💥 Сверхновая',  en: '💥 Supernova',      zh: '💥 超新星' }, bonus: { type: 'comboMult', value: 0.05 } },
    { threshold: 500,  title: { ru: '🕳️ Чёрная дыра', en: '🕳️ Black Hole',     zh: '🕳️ 黑洞' },   bonus: { type: 'damageMult', value: 0.07 } },
    { threshold: 1000, title: { ru: '⚛️ Кварк',       en: '⚛️ Quark',           zh: '⚛️ 夸克' },   bonus: { type: 'rareChance', value: 0.10 } }
];

function toRoman(num) {
    if (num <= 0) return String(num);
    const lookup = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
    let roman = '';
    for (const i in lookup) { while (num >= lookup[i]) { roman += i; num -= lookup[i]; } }
    return roman;
}

/**
 * Вычисляет ранг по суммарному количеству разблокированных уровней
 */
function calculateRank(totalUnlocked) {
    let currentRank = RANKS[0];
    let nextThreshold = RANKS[1]?.threshold || null;
    
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (totalUnlocked >= RANKS[i].threshold) {
            currentRank = RANKS[i];
            nextThreshold = RANKS[i + 1]?.threshold || null;
            break;
        }
    }
    
    // Пост-1000: +100 за ранг «Легенда N»
    if (totalUnlocked >= 1000) {
        const extraRanks = Math.floor((totalUnlocked - 1000) / 100);
        const legendNum = extraRanks + 1;
        nextThreshold = 1000 + (extraRanks + 1) * 100;
        currentRank = {
            threshold: 1000 + extraRanks * 100,
            title: {
                ru: `👑 Легенда ${toRoman(legendNum)}`,
                en: `👑 Legend ${toRoman(legendNum)}`,
                zh: `👑 传奇 ${toRoman(legendNum)}`
            },
            bonus: { type: 'allMult', value: 0.01 * legendNum }
        };
    }
    
    return { rank: totalUnlocked, title: currentRank.title, bonus: currentRank.bonus, nextThreshold };
}

// ─────────────────────────────────────────────────────
// ⚙️ ГЕНЕРАТОР УРОВНЕЙ
// ЧТО: Бесконечная цепочка уровней для одной метрики
// ЗАЧЕМ: Уровень ∞ вычисляется так же, как уровень 1
// ─────────────────────────────────────────────────────

/**
 * Генерирует один уровень метрики
 * @param {string} metric - 'blocks', 'crits', ...
 * @param {number} tier - 0, 1, 2, ..., ∞
 */
function generateLevel(metric, tier) {
    const cfg = CONFIG.metrics[metric];
    if (!cfg) return null;
    
    const seed = `${CONFIG.id}:${metric}:${tier}`;
    
    // Формула цели
    let target;
    if (cfg.type === 'record_min') {
        target = Math.max(1000, Math.round(cfg.base * Math.pow(cfg.growth, tier) * jit(seed, 0.10)));
    } else {
        target = Math.max(1, Math.round(cfg.base * Math.pow(cfg.growth, tier) * jit(seed, 0.10)));
    }
    
    // Формула награды
    const reward = Math.max(1, Math.round(cfg.rewardBase * Math.pow(cfg.rewardGrowth, tier) * jit(seed + ':r', 0.05)));
    
    // Шаблон имени
    const tmpl = NAME_TEMPLATES[metric] || { key: `ach.${CONFIG.id}.${metric}`, fallback: `${metric} {N}` };
    
    return {
        id: `${CONFIG.prefix}_${metric}_t${tier}`,
        tier,
        target,
        reward,
        nameKey: tmpl.key,
        nameFallback: tmpl.fallback.replace('{N}', tier + 1),
        metric,
        metricType: cfg.type,
        emoji: cfg.emoji
    };
}

/**
 * Генерирует N уровней (для UI)
 */
function generateLevels(metric, fromTier, count) {
    const levels = [];
    for (let i = 0; i < count; i++) {
        const level = generateLevel(metric, fromTier + i);
        if (level) levels.push(level);
    }
    return levels;
}

/**
 * Проверяет, достигнут ли уровень
 */
function isLevelComplete(metric, tier, currentValue) {
    const level = generateLevel(metric, tier);
    if (!level) return false;
    if (level.metricType === 'record_min') {
        return currentValue > 0 && currentValue <= level.target;
    }
    return currentValue >= level.target;
}

// ─────────────────────────────────────────────────────
// 🏆 ФИНАЛЬНОЕ ДОСТИЖЕНИЕ: «Меркурий покорён!»
// ЧТО: Разблокируется при 99.9% прохождения AU планеты
// ЗАЧЕМ: Чувство завершения перед переходом на Венеру
// ─────────────────────────────────────────────────────
function getMasterAchievement() {
    const AU_TO_DAMAGE = window.GAME_CONFIG?.AU_TO_DAMAGE || 149597870.691;
    const masterTarget = Math.round(CONFIG.masterAU * AU_TO_DAMAGE * 0.999);
    
    return {
        id: `${CONFIG.prefix}_master`,
        tier: -1,
        target: masterTarget,
        reward: 5000,
        nameKey: 'ach.mercury.master',
        nameFallback: '☿ Меркурий покорён!',
        metric: 'planetDamage',
        metricType: 'cumulative',
        isMaster: true,
        emoji: '👑'
    };
}

// ─────────────────────────────────────────────────────
// 📊 ПРОГРЕСС КАРТОЧКИ (для UI)
// ЧТО: % выполнения текущего уровня + общий прогресс
// ЗАЧЕМ: Прогресс-бар и текст «X / Y» в карточке
// ─────────────────────────────────────────────────────
function getCardProgress(metric, currentValue) {
    let tier = 0;
    let totalUnlocked = 0;
    
    while (true) {
        if (isLevelComplete(metric, tier, currentValue)) {
            totalUnlocked++;
            tier++;
        } else {
            break;
        }
        // Защита от бесконечного цикла при очень больших значениях
        if (tier > 10000) break;
    }
    
    const currentLevel = generateLevel(metric, tier);
    const prevLevel = tier > 0 ? generateLevel(metric, tier - 1) : null;
    
    let percent = 0;
    if (currentLevel) {
        const prevTarget = prevLevel ? prevLevel.target : 0;
        const range = currentLevel.target - prevTarget;
        const progress = currentValue - prevTarget;
        percent = Math.min(100, Math.max(0, (progress / range) * 100));
    } else {
        percent = 100;
    }
    
    return { currentTier: tier, currentLevel, percent, totalUnlocked };
}

// ─────────────────────────────────────────────────────
// 💾 ИНТЕГРАЦИЯ С GAMESTATE
// ЧТО: Читает/пишет прогресс в gameState.achievementsV2.mercury
// ЗАЧЕМ: Save-system автоматически сериализует этот объект
// ─────────────────────────────────────────────────────

/**
 * Возвращает состояние метрики из gameState
 */
function getMetricState(metric) {
    const ach = window.gameState?.achievementsV2?.mercury;
    if (!ach || !ach.metrics || !ach.metrics[metric]) {
        return { level: 0, progress: 0 };
    }
    return ach.metrics[metric];
}

/**
 * Обновляет прогресс метрики и проверяет unlock
 * Вызывается из combat-system.js через achievementsSystem.increment*
 */
function updateMetricProgress(metric, newValue) {
    if (!window.gameState) return;
    
    // Инициализируем структуру если отсутствует
    if (!window.gameState.achievementsV2) window.gameState.achievementsV2 = {};
    if (!window.gameState.achievementsV2.mercury) {
        window.gameState.achievementsV2.mercury = { rank: 0, totalUnlocked: 0, metrics: {}, masterUnlocked: false };
    }
    const mercury = window.gameState.achievementsV2.mercury;
    if (!mercury.metrics[metric]) mercury.metrics[metric] = { level: 0, progress: 0 };
    
    const state = mercury.metrics[metric];
    state.progress = newValue;
    
// Проверяем разблокировку следующих уровней
let unlockedAny = false;
let totalReward = 0;

while (isLevelComplete(metric, state.level, newValue)) {
    const level = generateLevel(metric, state.level);
    if (!level) break;
    
    state.level++;
    mercury.totalUnlocked++;
    unlockedAny = true;
    totalReward += level.reward;
    
    console.log(`🏆 [ACH-V2] Mercury.${metric} tier ${state.level - 1} unlocked! +${level.reward} 💎`);
    
    if (window.EventBus) {
        window.EventBus.emit('achievement:v2:unlocked', {
            planet: CONFIG.id,
            metric,
            tier: state.level - 1,
            level,
            reward: level.reward
        });
    }
}

// ✅ НОВОЕ: Начисляем ВСЕ полученные кристаллы одним блоком
if (totalReward > 0) {
    // 1. Увеличиваем баланс игрока
    window.gameState.coins = (window.gameState.coins || 0) + totalReward;
    
    // 2. Обновляем глобальную метрику (для достижения resourceCollector)
    if (window.achievementsSystem?.incrementCoinsEarned) {
        window.achievementsSystem.incrementCoinsEarned(totalReward);
    }
    
 // 3. Обновляем HUD (чтобы игрок видел новый баланс)
if (window.GAME_UI?.updateHUD) {
    window.GAME_UI.updateHUD();
}

// 4. Обновляем кнопки апгрейдов (проверка баланса)
if (window.GAME_UI?.updateUpgradeButtons) {
    window.GAME_UI.updateUpgradeButtons();
}

// 5. Обновляем магазин (проверка баланса)
if (window.shopSystem?.updateShopDisplay) {
    window.shopSystem.updateShopDisplay();
}
    
    // 4. Звуковой и тактильный фидбек
    if (window.GAME_CORE?.playSound) {
        window.GAME_CORE.playSound('upgradeSound');
    }
    if (window.telegramHaptic?.success) {
        window.telegramHaptic.success();
    } else if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
    }
    
    // 5. Сохраняем прогресс
    if (typeof window.saveGame === 'function') {
        window.saveGame();
    }
    
    console.log(`💰 [ACH-V2] Total reward: +${totalReward} 💎 (Balance: ${window.gameState.coins})`);
}
    
    // Пересчитываем ранг
    if (unlockedAny) {
        mercury.rank = mercury.totalUnlocked;
        const rankInfo = calculateRank(mercury.totalUnlocked);
        
        if (window.EventBus) {
            window.EventBus.emit('achievement:v2:rankChanged', {
                planet: CONFIG.id,
                rank: rankInfo
            });
        }
    }
}

/**
 * Проверяет финальное достижение «Меркурий покорён!»
 */
function checkMasterAchievement(currentPlanetDamage) {
    if (!window.gameState?.achievementsV2?.mercury) return;
    const mercury = window.gameState.achievementsV2.mercury;
    if (mercury.masterUnlocked) return;
    
    const master = getMasterAchievement();
    if (currentPlanetDamage >= master.target) {
    mercury.masterUnlocked = true;
    mercury.totalUnlocked++;
    mercury.rank = mercury.totalUnlocked;
    
    // ✅ НОВОЕ: Начисляем кристаллы как обычную награду
    // 1. Увеличиваем баланс игрока
    window.gameState.coins = (window.gameState.coins || 0) + master.reward;
    
    // 2. Обновляем глобальную метрику (для достижения resourceCollector)
    if (window.achievementsSystem?.incrementCoinsEarned) {
        window.achievementsSystem.incrementCoinsEarned(master.reward);
    }
    
    // 3. Обновляем HUD
    if (window.GAME_UI?.updateHUD) {
        window.GAME_UI.updateHUD();
    }
    
    // 4. Звуковой и тактильный фидбек (усиленный для мастера)
    if (window.GAME_CORE?.playSound) {
        window.GAME_CORE.playSound('upgradeSound');
    }
    if (window.telegramHaptic?.success) {
        window.telegramHaptic.success();
    } else if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
    }
    
    // 5. Сохраняем прогресс
    if (typeof window.saveGame === 'function') {
        window.saveGame();
    }
    
    console.log(`👑 [ACH-V2] MASTER: ${master.nameFallback}! +${master.reward} 💎 (Balance: ${window.gameState.coins})`);
    
    if (window.EventBus) {
        window.EventBus.emit('achievement:v2:masterUnlocked', {
            planet: CONFIG.id,
            achievement: master
        });
    }
}
}

// ─────────────────────────────────────────────────────
// 📋 СПИСОК МЕТРИК (для UI)
// ─────────────────────────────────────────────────────
function getMetricDefinitions() {
    return Object.entries(CONFIG.metrics).map(([id, cfg]) => ({
        id,
        emoji: cfg.emoji,
        nameKey: NAME_TEMPLATES[id]?.key || `ach.metric.${id}`,
        fallback: NAME_TEMPLATES[id]?.fallback || id,
        type: cfg.type
    }));
}

// ─────────────────────────────────────────────────────
// 🔄 СИНХРОНИЗАЦИЯ С COMBAT-SYSTEM (мост совместимости)
// ЧТО: Подключается к существующим increment*-методам
// ЗАЧЕМ: combat-system.js продолжает работать без изменений
// ─────────────────────────────────────────────────────
function syncWithCombatSystem() {
    if (!window.achievementsSystem) return;
    
    const originalIncrementPlanetBlocks = window.achievementsSystem.incrementPlanetBlocks;
    const originalIncrementPlanetCrits = window.achievementsSystem.incrementPlanetCrits;
    const originalUpdatePlanetCombo = window.achievementsSystem.updatePlanetCombo;
    const originalIncrementPlanetRareBlocks = window.achievementsSystem.incrementPlanetRareBlocks;
    const originalIncrementTotalDamage = window.achievementsSystem.incrementTotalDamage;
    
    // Оборачиваем incrementPlanetBlocks
    window.achievementsSystem.incrementPlanetBlocks = function(planet, c) {
        if (originalIncrementPlanetBlocks) originalIncrementPlanetBlocks.call(this, planet, c);
        if (planet === CONFIG.id) {
            const gm = window.gameMetrics;
            const blocks = gm?.planetStats?.mercury?.blocks || 0;
            updateMetricProgress('blocks', blocks);
        }
    };
    
    // Оборачиваем incrementPlanetCrits
    window.achievementsSystem.incrementPlanetCrits = function(planet, c) {
        if (originalIncrementPlanetCrits) originalIncrementPlanetCrits.call(this, planet, c);
        if (planet === CONFIG.id) {
            const gm = window.gameMetrics;
            const crits = gm?.planetStats?.mercury?.crits || 0;
            updateMetricProgress('crits', crits);
        }
    };
    
    // Оборачиваем updatePlanetCombo
    window.achievementsSystem.updatePlanetCombo = function(planet, combo) {
        if (originalUpdatePlanetCombo) originalUpdatePlanetCombo.call(this, planet, combo);
        if (planet === CONFIG.id) {
            updateMetricProgress('combo', combo);
        }
    };
    
    // Оборачиваем incrementPlanetRareBlocks
    window.achievementsSystem.incrementPlanetRareBlocks = function(planet, c) {
        if (originalIncrementPlanetRareBlocks) originalIncrementPlanetRareBlocks.call(this, planet, c);
        if (planet === CONFIG.id) {
            const gm = window.gameMetrics;
            const rare = gm?.planetStats?.mercury?.rare || 0;
            updateMetricProgress('rare', rare);
        }
    };
    
    // Оборачиваем incrementTotalDamage (для damage + master)
    window.achievementsSystem.incrementTotalDamage = function(d) {
        if (originalIncrementTotalDamage) originalIncrementTotalDamage.call(this, d);
        if (window.gameState?.currentLocation === CONFIG.id) {
            const gs = window.gameState;
            updateMetricProgress('damage', gs.totalDamageDealt || 0);
            checkMasterAchievement(gs.planetDamageDealt || 0);
        }
    };
    
    console.log('🔗 [ACH-V2] Mercury synced with combat-system.js');
}

// ─────────────────────────────────────────────────────
// 🌐 ПУБЛИЧНЫЙ API
// ─────────────────────────────────────────────────────
window.AchievementsV2 = window.AchievementsV2 || {};
window.AchievementsV2.Mercury = {
    config: CONFIG,
    
    // Генерация
    generateLevel,
    generateLevels,
    getMasterAchievement,
    getMetricDefinitions,
    
    // Проверка прогресса
    isLevelComplete,
    getCardProgress,
    
    // Ранги
    calculateRank,
    RANKS,
    
    // Состояние
    getMetricState,
    updateMetricProgress,
    checkMasterAchievement,
    
    // Интеграция
    syncWithCombatSystem,
    
    // Метаданные
    getPlanetInfo: function() {
        return {
            id: CONFIG.id,
            emoji: CONFIG.emoji,
            nameKey: CONFIG.nameKey,
            descKey: CONFIG.descKey,
            scale: CONFIG.scale,
            masterAU: CONFIG.masterAU,
            metricCount: Object.keys(CONFIG.metrics).length
        };
    }
};

// Автоподключение к combat-system при загрузке
if (window.achievementsSystem) {
    syncWithCombatSystem();
} else {
    // Ждём инициализации achievementsSystem
    const waitInterval = setInterval(() => {
        if (window.achievementsSystem) {
            syncWithCombatSystem();
            clearInterval(waitInterval);
        }
    }, 200);
    // Таймаут безопасности
    setTimeout(() => clearInterval(waitInterval), 10000);
}

console.log('🧪 [ACH-V2] Mercury v2.0 loaded. Metrics:', Object.keys(CONFIG.metrics).length);
})();
