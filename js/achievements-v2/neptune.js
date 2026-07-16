// js/achievements-v2/neptune.js
// ═══════════════════════════════════════════════════
// ♆ НЕПТУН v1.0 — Конфиг планеты (8-я от Солнца)
// ЧТО: Только данные (метрики, шаблоны имён, параметры)
// ЗАЧЕМ: Фабрика создаст модуль автоматически
// ОСОБЕННОСТЬ: Ледяной гигант, глубокий космос (30 AU)
// ═══════════════════════════════════════════════════
(function() {
'use strict';

const CONFIG = {
    id: 'neptune',
    prefix: 'n',
    emoji: '♆',
    nameKey: 'gameTitle.neptune',
    descKey: 'achievements.neptune.description',
    scale: 1.7,                     // Очень высокая сложность
    masterAU: 30.06896,             // Реальное значение AU Нептуна
    
    // 12 метрик: увеличенные base относительно Урана
    metrics: {
        // ── БОЕВЫЕ ──
        blocks:      { base: 12,    growth: 1.50, rewardBase: 80,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '🔨' },
        crits:       { base: 75,    growth: 1.60, rewardBase: 170,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '⚡' },
        combo:       { base: 18,    growth: 1.40, rewardBase: 190,  rewardGrowth: 1.12, type: 'record_max',  emoji: '🔥' },
        rare:        { base: 14,    growth: 1.80, rewardBase: 400,  rewardGrowth: 1.15, type: 'cumulative',  emoji: '⭐' },
        damage:      { base: 5500,  growth: 1.70, rewardBase: 150,  rewardGrowth: 1.09, type: 'cumulative',  emoji: '💥' },
        
        // ── ЭКОНОМИКА И ПОМОЩНИКИ ──
        crystals:    { base: 1900,  growth: 1.60, rewardBase: 85,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '💎' },
        bobo:        { base: 14,    growth: 1.50, rewardBase: 320,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '🤖' },
        boboDmg:     { base: 10000, growth: 1.55, rewardBase: 160,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '🔧' },
        upgrades:    { base: 26,    growth: 1.45, rewardBase: 125,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '🛒' },
        
        // ── НАВЫК И ЭФФЕКТИВНОСТЬ ──
        time:        { base: 540,   growth: 1.30, rewardBase: 160,  rewardGrowth: 1.07, type: 'cumulative',  emoji: '⏱️' },
        speed:       { base: 8500,  growth: 0.85, rewardBase: 340,  rewardGrowth: 1.12, type: 'record_min',  emoji: '🏃' },
        critStreak:  { base: 14,    growth: 1.40, rewardBase: 400,  rewardGrowth: 1.12, type: 'record_max',  emoji: '🎯' }
    }
};

const NAME_TEMPLATES = {
    // ── БОЕВЫЕ ──
    blocks:      { key: 'achievements.neptune.metrics.blocks',      fallback: 'Уничтожено блоков' },
    crits:       { key: 'achievements.neptune.metrics.crits',       fallback: 'Критических ударов' },
    combo:       { key: 'achievements.neptune.metrics.combo',       fallback: 'Максимальное комбо' },
    rare:        { key: 'achievements.neptune.metrics.rare',        fallback: 'Редких блоков' },
    damage:      { key: 'achievements.neptune.metrics.damage',      fallback: 'Нанесено урона' },
    
    // ── ЭКОНОМИКА И ПОМОЩНИКИ ──
    crystals:    { key: 'achievements.neptune.metrics.crystals',    fallback: 'Заработано кристаллов' },
    bobo:        { key: 'achievements.neptune.metrics.bobo',        fallback: 'Активаций Bobo' },
    boboDmg:     { key: 'achievements.neptune.metrics.boboDmg',     fallback: 'Урона нанесено Bobo' },
    upgrades:    { key: 'achievements.neptune.metrics.upgrades',    fallback: 'Улучшений куплено' },
    
    // ── НАВЫК И ЭФФЕКТИВНОСТЬ ──
    time:        { key: 'achievements.neptune.metrics.time',        fallback: 'Секунд на планете' },
    speed:       { key: 'achievements.neptune.metrics.speed',       fallback: 'Рекорд скорости (мс)' },
    critStreak:  { key: 'achievements.neptune.metrics.critStreak',  fallback: 'Серия критов подряд' }
};

// ✅ Регистрация через фабрику
function registerNeptune() {
    if (window.AchievementsV2?.PlanetFactory) {
        window.AchievementsV2.PlanetFactory.create(CONFIG, NAME_TEMPLATES);
        console.log('♆ [ACH-V2] Neptune config loaded. Metrics:', Object.keys(CONFIG.metrics).length);
    } else {
        console.warn('⏳ [ACH-V2] PlanetFactory not ready, retrying...');
        setTimeout(registerNeptune, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerNeptune);
} else {
    registerNeptune();
}
})();