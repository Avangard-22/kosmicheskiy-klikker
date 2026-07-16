// js/achievements-v2/mars.js
// ═══════════════════════════════════════════════════
// ♂ МАРС v1.0 — Конфиг планеты (4-я от Солнца)
// ЧТО: Только данные (метрики, шаблоны имён, параметры)
// ЗАЧЕМ: Фабрика создаст модуль автоматически
// ═══════════════════════════════════════════════════
(function() {
'use strict';

const CONFIG = {
    id: 'mars',
    prefix: 'r',                    // "r" от "red planet"
    emoji: '♂',
    nameKey: 'gameTitle.mars',
    descKey: 'achievements.mars.description',
    scale: 1.3,                     // Сложнее Венеры на 30%
    masterAU: 1.52366,              // Реальное значение AU Марса
    
    // 12 метрик: увеличенные base относительно Венеры
    metrics: {
        // ── БОЕВЫЕ ──
        blocks:      { base: 4,     growth: 1.50, rewardBase: 40,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '🔨' },
        crits:       { base: 25,    growth: 1.60, rewardBase: 90,   rewardGrowth: 1.10, type: 'cumulative',  emoji: '⚡' },
        combo:       { base: 10,    growth: 1.40, rewardBase: 110,  rewardGrowth: 1.12, type: 'record_max',  emoji: '🔥' },
        rare:        { base: 6,     growth: 1.80, rewardBase: 210,  rewardGrowth: 1.15, type: 'cumulative',  emoji: '⭐' },
        damage:      { base: 1200,  growth: 1.70, rewardBase: 70,   rewardGrowth: 1.09, type: 'cumulative',  emoji: '💥' },
        
        // ── ЭКОНОМИКА И ПОМОЩНИКИ ──
        crystals:    { base: 500,   growth: 1.60, rewardBase: 45,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '💎' },
        bobo:        { base: 6,     growth: 1.50, rewardBase: 160,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '🤖' },
        boboDmg:     { base: 2500,  growth: 1.55, rewardBase: 80,   rewardGrowth: 1.10, type: 'cumulative',  emoji: '🔧' },
        boboCrystals:{ base: 1200,  growth: 1.60, rewardBase: 50,   rewardGrowth: 1.10, type: 'cumulative',  emoji: '💰' },
        
        // ── НАВЫК И ЭФФЕКТИВНОСТЬ ──
        time:        { base: 150,   growth: 1.30, rewardBase: 80,   rewardGrowth: 1.07, type: 'cumulative',  emoji: '⏱️' },
        speed:       { base: 20000, growth: 0.85, rewardBase: 180,  rewardGrowth: 1.12, type: 'record_min',  emoji: '🏃' },
        critStreak:  { base: 6,     growth: 1.40, rewardBase: 240,  rewardGrowth: 1.12, type: 'record_max',  emoji: '🎯' }
    }
};

const NAME_TEMPLATES = {
    // ── БОЕВЫЕ ──
    blocks:      { key: 'achievements.mars.metrics.blocks',      fallback: 'Уничтожено блоков' },
    crits:       { key: 'achievements.mars.metrics.crits',       fallback: 'Критических ударов' },
    combo:       { key: 'achievements.mars.metrics.combo',       fallback: 'Максимальное комбо' },
    rare:        { key: 'achievements.mars.metrics.rare',        fallback: 'Редких блоков' },
    damage:      { key: 'achievements.mars.metrics.damage',      fallback: 'Нанесено урона' },
    
    // ── ЭКОНОМИКА И ПОМОЩНИКИ ──
    crystals:    { key: 'achievements.mars.metrics.crystals',    fallback: 'Заработано кристаллов' },
    bobo:        { key: 'achievements.mars.metrics.bobo',        fallback: 'Активаций Bobo' },
    boboDmg:     { key: 'achievements.mars.metrics.boboDmg',     fallback: 'Урона нанесено Bobo' },
    boboCrystals:{ key: 'achievements.mars.metrics.boboCrystals',fallback: 'Кристаллов заработано Bobo' },
    
    // ── НАВЫК И ЭФФЕКТИВНОСТЬ ──
    time:        { key: 'achievements.mars.metrics.time',        fallback: 'Секунд на планете' },
    speed:       { key: 'achievements.mars.metrics.speed',       fallback: 'Рекорд скорости (мс)' },
    critStreak:  { key: 'achievements.mars.metrics.critStreak',  fallback: 'Серия критов подряд' }
};

// ✅ Регистрация через фабрику
function registerMars() {
    if (window.AchievementsV2?.PlanetFactory) {
        window.AchievementsV2.PlanetFactory.create(CONFIG, NAME_TEMPLATES);
        console.log('♂ [ACH-V2] Mars config loaded. Metrics:', Object.keys(CONFIG.metrics).length);
    } else {
        console.warn('⏳ [ACH-V2] PlanetFactory not ready, retrying...');
        setTimeout(registerMars, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerMars);
} else {
    registerMars();
}
})();