// js/achievements-v2/pluto.js
// ═══════════════════════════════════════════════════
// ♇ ПЛУТОН v1.0 — Конфиг планеты (9-я от Солнца)
// ЧТО: Только данные (метрики, шаблоны имён, параметры)
// ЗАЧЕМ: Фабрика создаст модуль автоматически
// ОСОБЕННОСТЬ: Финальная планета — карликовая, самая дальняя
// ═══════════════════════════════════════════════════
(function() {
'use strict';

const CONFIG = {
    id: 'pluto',
    prefix: 'p',
    emoji: '♇',
    nameKey: 'gameTitle.pluto',
    descKey: 'achievements.pluto.description',
    scale: 1.8,                     // Максимальная сложность (финал)
    masterAU: 39.48200,             // Реальное значение AU Плутона
    
    // 12 метрик: максимальные base для финального вызова
    metrics: {
        // ── БОЕВЫЕ ──
        blocks:      { base: 15,    growth: 1.50, rewardBase: 90,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '🔨' },
        crits:       { base: 90,    growth: 1.60, rewardBase: 190,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '⚡' },
        combo:       { base: 20,    growth: 1.40, rewardBase: 210,  rewardGrowth: 1.12, type: 'record_max',  emoji: '🔥' },
        rare:        { base: 16,    growth: 1.80, rewardBase: 450,  rewardGrowth: 1.15, type: 'cumulative',  emoji: '⭐' },
        damage:      { base: 7000,  growth: 1.70, rewardBase: 170,  rewardGrowth: 1.09, type: 'cumulative',  emoji: '💥' },
        
        // ── ЭКОНОМИКА И ПОМОЩНИКИ ──
        crystals:    { base: 2500,  growth: 1.60, rewardBase: 95,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '💎' },
        bobo:        { base: 16,    growth: 1.50, rewardBase: 360,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '🤖' },
        boboDmg:     { base: 14000, growth: 1.55, rewardBase: 180,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '🔧' },
        upgrades:    { base: 30,    growth: 1.45, rewardBase: 140,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '🛒' },
        
        // ── НАВЫК И ЭФФЕКТИВНОСТЬ ──
        time:        { base: 720,   growth: 1.30, rewardBase: 180,  rewardGrowth: 1.07, type: 'cumulative',  emoji: '⏱️' },
        speed:       { base: 7000,  growth: 0.85, rewardBase: 380,  rewardGrowth: 1.12, type: 'record_min',  emoji: '🏃' },
        critStreak:  { base: 16,    growth: 1.40, rewardBase: 440,  rewardGrowth: 1.12, type: 'record_max',  emoji: '🎯' }
    }
};

const NAME_TEMPLATES = {
    // ── БОЕВЫЕ ──
    blocks:      { key: 'achievements.pluto.metrics.blocks',      fallback: 'Уничтожено блоков' },
    crits:       { key: 'achievements.pluto.metrics.crits',       fallback: 'Критических ударов' },
    combo:       { key: 'achievements.pluto.metrics.combo',       fallback: 'Максимальное комбо' },
    rare:        { key: 'achievements.pluto.metrics.rare',        fallback: 'Редких блоков' },
    damage:      { key: 'achievements.pluto.metrics.damage',      fallback: 'Нанесено урона' },
    
    // ── ЭКОНОМИКА И ПОМОЩНИКИ ──
    crystals:    { key: 'achievements.pluto.metrics.crystals',    fallback: 'Заработано кристаллов' },
    bobo:        { key: 'achievements.pluto.metrics.bobo',        fallback: 'Активаций Bobo' },
    boboDmg:     { key: 'achievements.pluto.metrics.boboDmg',     fallback: 'Урона нанесено Bobo' },
    upgrades:    { key: 'achievements.pluto.metrics.upgrades',    fallback: 'Улучшений куплено' },
    
    // ── НАВЫК И ЭФФЕКТИВНОСТЬ ──
    time:        { key: 'achievements.pluto.metrics.time',        fallback: 'Секунд на планете' },
    speed:       { key: 'achievements.pluto.metrics.speed',       fallback: 'Рекорд скорости (мс)' },
    critStreak:  { key: 'achievements.pluto.metrics.critStreak',  fallback: 'Серия критов подряд' }
};

// ✅ Регистрация через фабрику
function registerPluto() {
    if (window.AchievementsV2?.PlanetFactory) {
        window.AchievementsV2.PlanetFactory.create(CONFIG, NAME_TEMPLATES);
        console.log('♇ [ACH-V2] Pluto config loaded. Metrics:', Object.keys(CONFIG.metrics).length);
    } else {
        console.warn('⏳ [ACH-V2] PlanetFactory not ready, retrying...');
        setTimeout(registerPluto, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerPluto);
} else {
    registerPluto();
}
})();