// js/achievements-v2/earth.js
// ═══════════════════════════════════════════════════
// 🌍 ЗЕМЛЯ v1.0 — Конфиг планеты (3-я от Солнца)
// ЧТО: Только данные (метрики, шаблоны имён, параметры)
// ЗАЧЕМ: Фабрика создаст модуль автоматически
// ═══════════════════════════════════════════════════
(function() {
'use strict';

const CONFIG = {
    id: 'earth',
    prefix: 'e',
    emoji: '♁',
    nameKey: 'gameTitle.earth',
    descKey: 'achievements.earth.description',
    scale: 1.2,                    // Сложнее Венеры на 20%
    masterAU: 1.00000,             // Реальное значение AU Земли (1 а.е.)
    
    // 12 метрик: увеличенные base относительно Венеры
    metrics: {
        // ── БОЕВЫЕ ──
        blocks:      { base: 3,     growth: 1.50, rewardBase: 35,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '🔨' },
        crits:       { base: 20,    growth: 1.60, rewardBase: 80,   rewardGrowth: 1.10, type: 'cumulative',  emoji: '⚡' },
        combo:       { base: 9,     growth: 1.40, rewardBase: 100,  rewardGrowth: 1.12, type: 'record_max',  emoji: '🔥' },
        rare:        { base: 5,     growth: 1.80, rewardBase: 190,  rewardGrowth: 1.15, type: 'cumulative',  emoji: '⭐' },
        damage:      { base: 1000,  growth: 1.70, rewardBase: 60,   rewardGrowth: 1.09, type: 'cumulative',  emoji: '💥' },
        
        // ── ЭКОНОМИКА И ПОМОЩНИКИ ──
        crystals:    { base: 450,   growth: 1.60, rewardBase: 40,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '💎' },
        bobo:        { base: 5,     growth: 1.50, rewardBase: 140,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '🤖' },
        boboDmg:     { base: 2000,  growth: 1.55, rewardBase: 70,   rewardGrowth: 1.10, type: 'cumulative',  emoji: '🔧' },
        upgrades:    { base: 10,    growth: 1.45, rewardBase: 60,   rewardGrowth: 1.10, type: 'cumulative',  emoji: '🛒' },
        
        // ── НАВЫК И ЭФФЕКТИВНОСТЬ ──
        time:        { base: 120,   growth: 1.30, rewardBase: 70,   rewardGrowth: 1.07, type: 'cumulative',  emoji: '⏱️' },
        speed:       { base: 22000, growth: 0.85, rewardBase: 160,  rewardGrowth: 1.12, type: 'record_min',  emoji: '🏃' },
        critStreak:  { base: 5,     growth: 1.40, rewardBase: 210,  rewardGrowth: 1.12, type: 'record_max',  emoji: '🎯' }
    }
};

const NAME_TEMPLATES = {
    // ── БОЕВЫЕ ──
    blocks:      { key: 'achievements.earth.metrics.blocks',      fallback: 'Уничтожено блоков' },
    crits:       { key: 'achievements.earth.metrics.crits',       fallback: 'Критических ударов' },
    combo:       { key: 'achievements.earth.metrics.combo',       fallback: 'Максимальное комбо' },
    rare:        { key: 'achievements.earth.metrics.rare',        fallback: 'Редких блоков' },
    damage:      { key: 'achievements.earth.metrics.damage',      fallback: 'Нанесено урона' },
    
    // ── ЭКОНОМИКА И ПОМОЩНИКИ ──
    crystals:    { key: 'achievements.earth.metrics.crystals',    fallback: 'Заработано кристаллов' },
    bobo:        { key: 'achievements.earth.metrics.bobo',        fallback: 'Активаций Bobo' },
    boboDmg:     { key: 'achievements.earth.metrics.boboDmg',     fallback: 'Урона нанесено Bobo' },
    upgrades:    { key: 'achievements.earth.metrics.upgrades',    fallback: 'Улучшений куплено' },
    
    // ── НАВЫК И ЭФФЕКТИВНОСТЬ ──
    time:        { key: 'achievements.earth.metrics.time',        fallback: 'Секунд на планете' },
    speed:       { key: 'achievements.earth.metrics.speed',       fallback: 'Рекорд скорости (мс)' },
    critStreak:  { key: 'achievements.earth.metrics.critStreak',  fallback: 'Серия критов подряд' }
};

// ✅ Регистрация через фабрику
function registerEarth() {
    if (window.AchievementsV2?.PlanetFactory) {
        window.AchievementsV2.PlanetFactory.create(CONFIG, NAME_TEMPLATES);
        console.log('🌍 [ACH-V2] Earth config loaded. Metrics:', Object.keys(CONFIG.metrics).length);
    } else {
        console.warn('⏳ [ACH-V2] PlanetFactory not ready, retrying...');
        setTimeout(registerEarth, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerEarth);
} else {
    registerEarth();
}
})();