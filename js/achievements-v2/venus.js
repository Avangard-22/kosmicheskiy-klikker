// js/achievements-v2/venus.js
// ═══════════════════════════════════════════════════
// ♀ ВЕНЕРА v1.0 — Конфиг планеты
// ЧТО: Только данные (метрики, шаблоны имён, параметры)
// ЗАЧЕМ: Фабрика создаст модуль автоматически
// ═══════════════════════════════════════════════════
(function() {
'use strict';

const CONFIG = {
    id: 'venus',
    prefix: 'v',
    emoji: '♀',
    nameKey: 'gameTitle.venus',
    descKey: 'achievements.venus.description',
    scale: 1.1,                    // Сложнее Меркурия на 10%
    masterAU: 0.72333,             // Реальное значение AU Венеры
    
    metrics: {
        // ── БОЕВЫЕ (увеличенные base) ──
        blocks:      { base: 2,     growth: 1.50, rewardBase: 30,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '🔨' },
        crits:       { base: 15,    growth: 1.60, rewardBase: 70,   rewardGrowth: 1.10, type: 'cumulative',  emoji: '⚡' },
        combo:       { base: 7,     growth: 1.40, rewardBase: 90,   rewardGrowth: 1.12, type: 'record_max',  emoji: '🔥' },
        rare:        { base: 4,     growth: 1.80, rewardBase: 170,  rewardGrowth: 1.15, type: 'cumulative',  emoji: '⭐' },
        damage:      { base: 700,   growth: 1.70, rewardBase: 50,   rewardGrowth: 1.09, type: 'cumulative',  emoji: '💥' },
        
        // ── ЭКОНОМИКА И ПОМОЩНИКИ ──
        crystals:    { base: 300,   growth: 1.60, rewardBase: 35,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '💎' },
        bobo:        { base: 4,     growth: 1.50, rewardBase: 120,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '🤖' },
        boboDmg:     { base: 1400,  growth: 1.55, rewardBase: 60,   rewardGrowth: 1.10, type: 'cumulative',  emoji: '🔧' },
        upgrades:    { base: 7,     growth: 1.45, rewardBase: 50,   rewardGrowth: 1.10, type: 'cumulative',  emoji: '🛒' },
        
        // ── НАВЫК И ЭФФЕКТИВНОСТЬ ──
        time:        { base: 90,    growth: 1.30, rewardBase: 60,   rewardGrowth: 1.07, type: 'cumulative',  emoji: '⏱️' },
        speed:       { base: 25000, growth: 0.85, rewardBase: 140,  rewardGrowth: 1.12, type: 'record_min',  emoji: '🏃' },
        critStreak:  { base: 4,     growth: 1.40, rewardBase: 180,  rewardGrowth: 1.12, type: 'record_max',  emoji: '🎯' }
    }
};

const NAME_TEMPLATES = {
    blocks:      { key: 'achievements.venus.metrics.blocks',      fallback: 'Уничтожено блоков' },
    crits:       { key: 'achievements.venus.metrics.crits',       fallback: 'Критических ударов' },
    combo:       { key: 'achievements.venus.metrics.combo',       fallback: 'Максимальное комбо' },
    rare:        { key: 'achievements.venus.metrics.rare',        fallback: 'Редких блоков' },
    damage:      { key: 'achievements.venus.metrics.damage',      fallback: 'Нанесено урона' },
    crystals:    { key: 'achievements.venus.metrics.crystals',    fallback: 'Заработано кристаллов' },
    bobo:        { key: 'achievements.venus.metrics.bobo',        fallback: 'Активаций Bobo' },
    boboDmg:     { key: 'achievements.venus.metrics.boboDmg',     fallback: 'Урона нанесено Bobo' },
    upgrades:    { key: 'achievements.venus.metrics.upgrades',    fallback: 'Улучшений куплено' },
    time:        { key: 'achievements.venus.metrics.time',        fallback: 'Секунд на планете' },
    speed:       { key: 'achievements.venus.metrics.speed',       fallback: 'Рекорд скорости (мс)' },
    critStreak:  { key: 'achievements.venus.metrics.critStreak',  fallback: 'Серия критов подряд' }
};

// Регистрация через фабрику
if (window.AchievementsV2?.PlanetFactory) {
    window.AchievementsV2.PlanetFactory.create(CONFIG, NAME_TEMPLATES);
}

console.log('♀ [ACH-V2] Venus config loaded. Metrics:', Object.keys(CONFIG.metrics).length);
})();