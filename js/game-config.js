// js/game-config.js
// ==========================================
// 📋 ЕДИНСТВЕННЫЙ ИСТОЧНИК ИГРОВЫХ КОНСТАНТ
// ==========================================
(function() {
'use strict';

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

// === ВИЗУАЛЬНЫЕ ТЕМЫ ПЛАНЕТ ===
const LOCATIONS = {
    mercury: {
        name: '☿ Меркурий',
        color: '#bb86fc',
        coinColor: '#a0d2ff',
        borderColor: '#4a55e0',
        blockColors: ['#2962ff', '#4fc3f7', '#bb86fc', '#f8bbd0']
    },
    venus: {
        name: '♀ Венера',
        color: '#ffab91',
        coinColor: '#a0d2ff',
        borderColor: '#ff5722',
        blockColors: ['#ff5722', '#ff9800', '#ff5722', '#e91e63']
    },
    earth: {
        name: '♁ Земля',
        color: '#80deea',
        coinColor: '#a0d2ff',
        borderColor: '#0288d1',
        blockColors: ['#0288d1', '#29b6f6', '#00bcd4', '#00e5ff']
    },
    mars: {        name: '♂ Марс',
        color: '#a5d6a7',
        coinColor: '#a0d2ff',
        borderColor: '#388e3c',
        blockColors: ['#388e3c', '#66bb6a', '#9ccc65', '#d4e157']
    },
    jupiter: {
        name: '♃ Юпитер',
        color: '#d2a679',
        coinColor: '#ffb74d',
        borderColor: '#8b4513',
        blockColors: ['#c9a961', '#d2691e', '#a0522d', '#8b4513']
    },
    saturn: {
        name: '♄ Сатурн',
        color: '#f0e68c',
        coinColor: '#ffd700',
        borderColor: '#b8860b',
        blockColors: ['#f0e68c', '#daa520', '#b8860b', '#ffd700']
    },
    uranus: {
        name: '♅ Уран',
        color: '#7fffd4',
        coinColor: '#40e0d0',
        borderColor: '#20b2aa',
        blockColors: ['#afeeee', '#7fffd4', '#40e0d0', '#48d1cc']
    },
    neptune: {
        name: '♆ Нептун',
        color: '#6495ed',
        coinColor: '#1e90ff',
        borderColor: '#0000cd',
        blockColors: ['#4169e1', '#1e90ff', '#0000cd', '#191970']
    },
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
        healthMultiplier: 1.8,        className: 'block-gold'
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
const AU_TO_DAMAGE = 149597870.691;

// === ГЕНЕРАТОР ЭКЗОПЛАНЕТ ===
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
const PROGRESSION_CONFIG = PLANET_ORDER.reduce((acc, planet, index) => {
    acc[planet] = {
        targetAU: ASTRONOMICAL_UNITS[planet],
        nextLocation: PLANET_ORDER[index + 1] || null,
        index: index
    };
    return acc;
}, {});

// === ОПРЕДЕЛЕНИЕ МОБИЛЬНОГО УСТРОЙСТВА ===
const IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// ==========================================
// 📱 АДАПТИВНЫЕ НАСТРОЙКИ ДЛЯ УСТРОЙСТВ
// ==========================================

/**
 * Определяет производительность устройства
 */
function detectDevicePerformance() {
    const ua = navigator.userAgent || '';
    const cores = navigator.hardwareConcurrency || 4;    const memory = navigator.deviceMemory || 4;
    
    // Определение модели
    let deviceModel = 'unknown';
    let deviceBrand = 'unknown';
    
    if (/realme/i.test(ua)) {
        deviceBrand = 'Realme';
        const match = ua.match(/realme\s+([^\s;)]+)/i);
        deviceModel = match ? match[1] : 'unknown';
    } else if (/samsung/i.test(ua)) {
        deviceBrand = 'Samsung';
        const match = ua.match(/SM-([^\s;)]+)/i);
        deviceModel = match ? match[1] : 'unknown';
    } else if (/xiaomi|mi\s/i.test(ua)) {
        deviceBrand = 'Xiaomi';
        const match = ua.match(/MI\s+([^\s;)]+)/i);
        deviceModel = match ? match[1] : 'unknown';
    } else if (/iphone/i.test(ua)) {
        deviceBrand = 'Apple';
        deviceModel = 'iPhone';
    } else if (/android/i.test(ua)) {
        deviceBrand = 'Android';
        deviceModel = 'unknown';
    }
    
    // Определение tier
    let tier = 'medium';
    if (cores >= 8 && memory >= 6) {
        tier = 'high';
    } else if (cores <= 4 || memory <= 3) {
        tier = 'low';
    }
    
    // Специальная обработка для Realme 10 Pro
    if (deviceBrand === 'Realme' && deviceModel.includes('10')) {
        tier = 'medium-low';
    }
    
    return {
        brand: deviceBrand,
        model: deviceModel,
        cores: cores,
        memory: memory,
        tier: tier
    };
}

/**
 * Получает адаптивные настройки для игры */
function getAdaptiveSettings() {
    const device = detectDevicePerformance();
    
    const settings = {
        // Базовые настройки
        blockSpeed: 20,
        blockHealthMultiplier: 1.0,
        particleDensity: 1.0
    };
    
    // Адаптация по tier
    switch (device.tier) {
        case 'high':
            settings.blockSpeed = 25;
            settings.blockHealthMultiplier = 1.2;
            settings.particleDensity = 1.0;
            break;
            
        case 'medium':
            settings.blockSpeed = 30;
            settings.blockHealthMultiplier = 1.1;
            settings.particleDensity = 0.8;
            break;
            
        case 'medium-low':
            // Специально для Realme 10 Pro и подобных
            settings.blockSpeed = 35;
            settings.blockHealthMultiplier = 1.3;
            settings.particleDensity = 0.7;
            break;
            
        case 'low':
        default:
            settings.blockSpeed = 40;
            settings.blockHealthMultiplier = 1.5;
            settings.particleDensity = 0.5;
            break;
    }
    
    console.log('📱 [CONFIG] Device:', device.brand, device.model, '| Tier:', device.tier);
    console.log('⚙️  [CONFIG] Adaptive settings:', settings);
    
    return settings;
}

// Инициализируем адаптивные настройки
const ADAPTIVE_SETTINGS = getAdaptiveSettings();

// === ЭКСПОРТ В ГЛОБАЛЬНЫЙ ОБЪЕКТ ===window.GAME_CONFIG = {
    // Астрономия
    AU_TO_DAMAGE: AU_TO_DAMAGE,
    astronomicalUnits: ASTRONOMICAL_UNITS,
    planetOrder: PLANET_ORDER,

    // ✅ Мобильное устройство
    isMobile: IS_MOBILE,
    
    // ✅ Адаптивные настройки
    adaptiveSettings: ADAPTIVE_SETTINGS,
    
    // ✅ Функции для получения адаптивных параметров
    getBlockSpeed: function() {
        return ADAPTIVE_SETTINGS.blockSpeed;
    },
    
    getBlockHealthMultiplier: function() {
        return ADAPTIVE_SETTINGS.blockHealthMultiplier;
    },
    
    getParticleDensity: function() {
        return ADAPTIVE_SETTINGS.particleDensity;
    },
    
    // Визуал
    locations: LOCATIONS,
    rareBlocks: RARE_BLOCKS,

    // Баланс
    balanceConfig: BALANCE_CONFIG,
    costs: COSTS,

    // Прогрессия
    PROGRESSION_CONFIG: PROGRESSION_CONFIG,

    // Генератор экзопланет
    generateExoplanet: generateExoplanet
};

console.log('📋 Game Config initialized. Planets:', PLANET_ORDER.length);
console.log('📱 Device tier:', ADAPTIVE_SETTINGS);
})();
