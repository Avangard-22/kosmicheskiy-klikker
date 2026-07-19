// js/game-config.js
// ==========================================
// 📋ЕДИНСТВЕННЫЙ ИСТОЧНИК ИГРОВЫХ КОНСТАНТ
// ==========================================
(function() {
'use strict';

// ═══════════════════════════════════════════════════
// 🟢 P2: TYPE DEFINITIONS (JSDoc)
// ЧТО: Типы для gameState, gameMetrics, achievements
// КУДА: game-config.js (начало файла)
// ЗАЧЕМ: IDE autocomplete, защита от опечаток, документация.
//        НЕ влияет на runtime — только статический анализ.
// ═══════════════════════════════════════════════════

/**
 * @typedef {Object} DailyBonusState
 * @property {string|null} lastClaimDate - Дата последнего получения (ISO формат: '2026-07-09')
 * @property {number} currentDay - Текущий день цикла (1-30)
 * @property {number} totalClaimed - Общее количество полученных бонусов
 * @property {number} streak - Серия дней подряд
 * @property {number} lastClaimTimestamp - Timestamp последнего получения (мс)
 */

/**
 * @typedef {Object} ShopItemState
 * @property {boolean} purchased - Куплен ли предмет
 * @property {boolean} active - Активен ли буст
 * @property {number} timeLeft - Оставшееся время действия (мс)
 */

/**
 * @typedef {Object} AchievementLevelState
 * @property {boolean} unlocked - Разблокирован ли уровень
 * @property {number} progress - Прогресс на этом уровне
 */

/**
 * @typedef {Object} AchievementCategoryState
 * @property {number} progress - Общий прогресс категории
 * @property {number} [progress_blocks] - Прогресс по метрике blocks
 * @property {number} [progress_crits] - Прогресс по метрике crits
 * @property {number} [progress_combo] - Прогресс по метрике combo
 * @property {number} [progress_rare] - Прогресс по метрике rare
 * @property {Object<string, AchievementLevelState>} levels - Состояние уровней
 */

/**
 * @typedef {Object} PlanetStats
 * @property {number} blocks - Уничтожено блоков на планете
 * @property {number} crits - Критических ударов на планете
 * @property {number} combo - Максимальное комбо на планете
 * @property {number} rare - Редких блоков на планете
 */

/**
 * @typedef {Object} GameState
 * @property {number} coins - Текущее количество кристаллов
 * @property {number} clickPower - Текущая сила клика
 * @property {number} critChance - Шанс крита (0.001 = 0.1%)
 * @property {number} critMultiplier - Множитель крита (2.0 = x2)
 * @property {string} currentLocation - Текущая планета ('mercury', 'venus', ...)
 * @property {number} totalDamageDealt - Общий нанесённый урон
 * @property {number} clickUpgradeLevel - Уровень улучшения силы клика
 * @property {number} critChanceUpgradeLevel - Уровень улучшения шанса крита
 * @property {number} critMultiplierUpgradeLevel - Уровень улучшения множителя крита
 * @property {number} helperUpgradeLevel - Уровень улучшения урона Bobo
 * @property {number} helperActivations - Количество активаций Bobo
 * @property {boolean} helperActive - Активен ли Bobo сейчас
 * @property {number} helperTimeLeft - Оставшееся время работы Bobo (мс)
 * @property {number} helperDamageBonus - Бонус к урону Bobo
 * @property {number} boboCoinBonus - Бонус к кристаллам от Bobo (0.2 = +20%)
 * @property {number} comboCount - Текущее комбо
 * @property {number} lastDestroyTime - Timestamp последнего разрушения блока
 * @property {boolean} gameActive - Активна ли игра
 * @property {boolean} gamePaused - На паузе ли игра
 * @property {boolean} [_isNewGame] - Флаг новой игры (для сброса облака)
 * @property {Object<string, AchievementCategoryState>} achievements - Состояние достижений
 * @property {Object<string, ShopItemState>} shopItems - Состояние предметов магазина
 * @property {Object<string, any>} permanentBonuses - Перманентные бонусы
 * @property {string[]} unlockedLocations - Разблокированные планеты
 * @property {string} boboSkin - Скин Bobo ('default')
 * @property {DailyBonusState} dailyBonus - Состояние ежедневного бонуса
 * @property {number} [planetDamageDealt] - Урон на текущей планете (для прогресс-бара)
 * @property {boolean} [planetFirstBlockCleared] - Флаг первого блока на планете
 * @property {boolean} [musicMuted] - Заглушена ли музыка
 */

/**
 * @typedef {Object} GameMetrics
 * @property {number} startTime - Timestamp начала текущей сессии
 * @property {number} blocksDestroyed - Уничтожено блоков за всё время
 * @property {number} upgradesBought - Куплено улучшений
 * @property {number} totalClicks - Совершено кликов
 * @property {number} totalCrits - Критических ударов
 * @property {number} totalCoinsEarned - Заработано кристаллов
 * @property {number} helpersBought - Куплено помощников (Bobo)
 * @property {number} boostersUsed - Использовано бустов
 * @property {number} maxCombo - Максимальное комбо
 * @property {number} rareBlocksDestroyed - Уничтожено редких блоков
 * @property {number} sessions - Количество сессий
 * @property {string[]} visitedPlanets - Посещённые планеты
 * @property {number} [totalTimePlayed] - Общее время в игре (секунды)
 * @property {Object<string, PlanetStats>} [planetStats] - Статистика по планетам
 */

// ═══════════════════════════════════════════════════
// КОНЕЦ TYPE DEFINITIONS
// ═══════════════════════════════════════════════════

// === ЕДИНЫЙ ПОРЯДОК ПЛАНЕТ (используется везде) ===
const PLANET_ORDER = [
    'mercury', 'venus', 'earth', 'mars',
    'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'
];

// === АСТРОНОМИЧЕСКИЕ РАССТОЯНИЯ (а.е.) ===
const ASTRONOMICAL_UNITS = {
    mercury: 0.38710,
    venus: 0.72333,
    earth: 1.00000,
    mars: 1.52366,
    jupiter: 5.20336,
    saturn: 9.53707,
    uranus: 19.19126,
    neptune: 30.06896,
    pluto: 39.48200
};

// === КОЭФФИЦИЕНТЫ СТОИМОСТИ АПГРЕЙДОВ ПО ПЛАНЕТАМ ===
// ✅ НОВОЕ: Выравнивает стоимость апгрейдов относительно награды за блок
// Формула: примерно соответствует росту (25 + AU * 100) / (25 + 0.387 * 100)
const PLANET_COST_MULTIPLIERS = {
    mercury: 1.0,    // База (награда ~183, апгрейд 80)
    venus: 1.5,      // ×1.5 (награда ~279, апгрейд 120)
    earth: 2.0,      // ×2.0 (награда ~359, апгрейд 160)
    mars: 2.8,       // ×2.8 (награда ~509, апгрейд 224)
    jupiter: 8.5,    // ×8.5 (награда ~1567, апгрейд 680)
    saturn: 15.4,    // ×15.4 (награда ~2814, апгрейд 1232)
    uranus: 30.5,    // ×30.5 (награда ~5589, апгрейд 2440)
    neptune: 47.6,   // ×47.6 (награда ~8717, апгрейд 3808)
    pluto: 62.4      // ×62.4 (награда ~11423, апгрейд 4992)
};

// === ВИЗУАЛЬНЫЕ ТЕМЫ ПЛАНЕТ ===
// ✅ ИСПРАВЛЕНО: каждая планета имеет уникальную цветовую схему
const LOCATIONS = {
    // ☿ Меркурий — раскалённая серо-коричневая поверхность
    mercury: {
        name: '☿ Меркурий',
        color: '#bb86fc',
        coinColor: '#a0d2ff',
        borderColor: '#4a55e0',
        blockColors: ['#2962ff', '#4fc3f7', '#bb86fc', '#f8bbd0']
    },
    // ♀ Венера — горячие оранжево-красные облака
    venus: {
        name: '♀ Венера',
        color: '#ffab91',
        coinColor: '#a0d2ff',
        borderColor: '#ff5722',
        blockColors: ['#ff5722', '#ff9800', '#ff5722', '#e91e63']
    },
    // ♁ Земля — океанические синие тона
    earth: {
        name: '♁ Земля',
        color: '#80deea',
        coinColor: '#a0d2ff',
        borderColor: '#0288d1',
        blockColors: ['#0288d1', '#29b6f6', '#00bcd4', '#00e5ff']
    },
    // ♂ Марс — красно-зелёные пустыни
    mars: {
        name: '♂ Марс',
        color: '#a5d6a7',
        coinColor: '#a0d2ff',
        borderColor: '#388e3c',
        blockColors: ['#388e3c', '#66bb6a', '#9ccc65', '#d4e157']
    },
    // ♃ Юпитер — оранжево-коричневые полосы газового гиганта
    jupiter: {
        name: '♃ Юпитер',
        color: '#d2a679',
        coinColor: '#ffb74d',
        borderColor: '#8b4513',
        blockColors: ['#c9a961', '#d2691e', '#a0522d', '#8b4513']
    },
    // ♄ Сатурн — золотистые кольца
    saturn: {
        name: '♄ Сатурн',
        color: '#f0e68c',
        coinColor: '#ffd700',
        borderColor: '#b8860b',
        blockColors: ['#f0e68c', '#daa520', '#b8860b', '#ffd700']
    },
    // ♅ Уран — ледяной голубовато-зелёный
    uranus: {
        name: '♅ Уран',
        color: '#7fffd4',
        coinColor: '#40e0d0',
        borderColor: '#20b2aa',
        blockColors: ['#afeeee', '#7fffd4', '#40e0d0', '#48d1cc']
    },
    // ♆ Нептун — глубокий синий
    neptune: {
        name: '♆ Нептун',
        color: '#6495ed',
        coinColor: '#1e90ff',
        borderColor: '#0000cd',
        blockColors: ['#4169e1', '#1e90ff', '#0000cd', '#191970']
    },
    // ♇ Плутон — серо-коричневый лёд (карликовая планета)
    pluto: {
        name: '♇ Плутон',
        color: '#b0b0b0',
        coinColor: '#d3d3d3',
        borderColor: '#696969',
        blockColors: ['#a9a9a9', '#808080', '#696969', '#d3d3d3']
    }
};

// === РЕДКИЕ БЛОКИ ===
const RARE_BLOCKS = {
    GOLD: {
        name: 'Золотой',
        chance: 0.03,
        multiplier: 8,
        healthMultiplier: 1.8,
        className: 'block-gold'
    },
    RAINBOW: {
        name: 'Радужный',
        chance: 0.02,
        multiplier: 5,
        healthMultiplier: 1.5,
        className: 'block-rainbow'
    },
    CRYSTAL: {
        name: 'Кристальный',
        chance: 0.025,
        multiplier: 6,
        healthMultiplier: 1.6,
        className: 'block-crystal'
    },
    MYSTERY: {
        name: 'Загадочный',
        chance: 0.015,
        multiplier: 10,
        healthMultiplier: 2.0,
        className: 'block-mystery'
    }
};

// === БАЛАНС ИГРЫ ===
const BALANCE_CONFIG = {
    baseHealth: 80,
    targetClicks: 70,
    healthRandomRange: { min: 0.8, max: 1.3 },
    damageProgression: {
        baseMultiplier: 1.15,
        diminishingReturns: 0.96,
        maxLevelEffect: 60
    },
    rewardMultiplier: 2.5,
    comboMultiplier: 0.25,
    randomBonusRange: { min: 0.8, max: 1.5 },
    penaltyMin: 0.05,
    penaltyMax: 0.45
};

// === СТОИМОСТЬ УЛУЧШЕНИЙ ===
const COSTS = {
    baseClickUpgradeCost: 80,
    baseHelperUpgradeCost: 1500,
    baseCritChanceCost: 500,
    baseCritMultiplierCost: 800,
    baseHelperDmgCost: 1000
};

// === КОНВЕРТАЦИЯ УРОНА В А.Е. ===
// ✅ ВАЖНО: используется в game-ui.js для прогресс-бара
const AU_TO_DAMAGE = 149597870.691;

// === ГЕНЕРАТОР ЭКЗОПЛАНЕТ (для пост-Плутон контента) ===
function generateExoplanet(seed, distanceFromPluto) {
    const types = ['ice_giant', 'super_earth', 'pulsar', 'nebula', 'black_hole'];
    const type = types[Math.floor(seed * types.length)];
    const baseAU = 39.48200 + distanceFromPluto;

    return {
        id: `exo_${seed.toFixed(4)}`,
        name: `Экзопланета ${Math.floor(distanceFromPluto)}-${Math.floor(seed * 100)}`,
        type: type,
        au: baseAU,
        healthMultiplier: 1 + (distanceFromPluto * 0.1),
        rewardMultiplier: 1 + (distanceFromPluto * 0.05),
        color: `hsl(${Math.floor(seed * 360)}, 70%, 60%)`,
        blockColors: [
            `hsl(${Math.floor(seed * 360)}, 70%, 60%)`,
            `hsl(${Math.floor(seed * 360 + 30)}, 70%, 50%)`,
            `hsl(${Math.floor(seed * 360 + 60)}, 70%, 40%)`,
            `hsl(${Math.floor(seed * 360 + 90)}, 70%, 30%)`
        ]
    };
}

// === ЕДИНАЯ КОНФИГУРАЦИЯ ПРОГРЕССИИ ===
// ✅ ИСПРАВЛЕНО: использует единый PLANET_ORDER и ASTRONOMICAL_UNITS
const PROGRESSION_CONFIG = PLANET_ORDER.reduce((acc, planet, index) => {
    acc[planet] = {
        targetAU: ASTRONOMICAL_UNITS[planet],
        nextLocation: PLANET_ORDER[index + 1] || null,
        index: index
    };
    return acc;
}, {});

// === ОПРЕДЕЛЕНИЕ МОБИЛЬНОГО УСТРОЙСТВА ===
// ✅ НОВОЕ: Единый флаг для всех модулей
const IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// === ЭКСПОРТ В ГЛОБАЛЬНЫЙ ОБЪЕКТ ===
window.GAME_CONFIG = {
    // Астрономия
    AU_TO_DAMAGE: AU_TO_DAMAGE,
    astronomicalUnits: ASTRONOMICAL_UNITS,
    planetOrder: PLANET_ORDER,

// ✅ НОВОЕ: Флаг мобильного устройства
    isMobile: IS_MOBILE,
    
// Визуал
    locations: LOCATIONS,
    rareBlocks: RARE_BLOCKS,

    // Баланс
    balanceConfig: BALANCE_CONFIG,
    costs: COSTS,
    
    // ✅ НОВОЕ: Коэффициенты стоимости апгрейдов
    planetCostMultipliers: PLANET_COST_MULTIPLIERS,
    
    // Прогрессия
    PROGRESSION_CONFIG: PROGRESSION_CONFIG,

    // Генератор экзопланет
    generateExoplanet: generateExoplanet
};

console.log('📋 Game Config initialized. Planets:', PLANET_ORDER.length);
})();
