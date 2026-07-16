// js/achievements-v2/jupiter.js
// ═══════════════════════════════════════════════════
// ♃ ЮПИТЕР v1.0 — Конфиг планеты (5-я от Солнца)
// ЧТО: Только данные (метрики, шаблоны имён, параметры)
// ЗАЧЕМ: Фабрика создаст модуль автоматически
// ОСОБЕННОСТЬ: Газовый гигант — большой скачок сложности
// ═══════════════════════════════════════════════════
(function() {
'use strict';

const CONFIG = {
    id: 'jupiter',
    prefix: 'j',
    emoji: '♃',
    nameKey: 'gameTitle.jupiter',
    descKey: 'achievements.jupiter.description',
    scale: 1.4,                    // Скачок сложности (газовый гигант)
    masterAU: 5.20336,             // Реальное значение AU Юпитера
    
    // 12 метрик: увеличенные base относительно Марса
    metrics: {
        // ── БОЕВЫЕ ──
        blocks:      { base: 6,     growth: 1.50, rewardBase: 50,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '🔨' },
        crits:       { base: 35,    growth: 1.60, rewardBase: 110,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '⚡' },
        combo:       { base: 12,    growth: 1.40, rewardBase: 130,  rewardGrowth: 1.12, type: 'record_max',  emoji: '🔥' },
        rare:        { base: 8,     growth: 1.80, rewardBase: 250,  rewardGrowth: 1.15, type: 'cumulative',  emoji: '⭐' },
        damage:      { base: 2000,  growth: 1.70, rewardBase: 90,   rewardGrowth: 1.09, type: 'cumulative',  emoji: '💥' },
        
        // ── ЭКОНОМИКА И ПОМОЩНИКИ ──
        crystals:    { base: 750,   growth: 1.60, rewardBase: 55,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '💎' },
        bobo:        { base: 8,     growth: 1.50, rewardBase: 200,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '🤖' },
        boboDmg:     { base: 4000,  growth: 1.55, rewardBase: 100,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '🔧' },
        upgrades:    { base: 15,    growth: 1.45, rewardBase: 80,   rewardGrowth: 1.10, type: 'cumulative',  emoji: '🛒' },
        
        // ── НАВЫК И ЭФФЕКТИВНОСТЬ ──
        time:        { base: 240,   growth: 1.30, rewardBase: 100,  rewardGrowth: 1.07, type: 'cumulative',  emoji: '⏱️' },
        speed:       { base: 15000, growth: 0.85, rewardBase: 220,  rewardGrowth: 1.12, type: 'record_min',  emoji: '🏃' },
        critStreak:  { base: 8,     growth: 1.40, rewardBase: 280,  rewardGrowth: 1.12, type: 'record_max',  emoji: '🎯' }
    }
};

const NAME_TEMPLATES = {
    // ── БОЕВЫЕ ──
    blocks:      { key: 'achievements.jupiter.metrics.blocks',      fallback: 'Уничтожено блоков' },
    crits:       { key: 'achievements.jupiter.metrics.crits',       fallback: 'Критических ударов' },
    combo:       { key: 'achievements.jupiter.metrics.combo',       fallback: 'Максимальное комбо' },
    rare:        { key: 'achievements.jupiter.metrics.rare',        fallback: 'Редких блоков' },
    damage:      { key: 'achievements.jupiter.metrics.damage',      fallback: 'Нанесено урона' },
    
    // ── ЭКОНОМИКА И ПОМОЩНИКИ ──
    crystals:    { key: 'achievements.jupiter.metrics.crystals',    fallback: 'Заработано кристаллов' },
    bobo:        { key: 'achievements.jupiter.metrics.bobo',        fallback: 'Активаций Bobo' },
    boboDmg:     { key: 'achievements.jupiter.metrics.boboDmg',     fallback: 'Урона нанесено Bobo' },
    upgrades:    { key: 'achievements.jupiter.metrics.upgrades',    fallback: 'Улучшений куплено' },
    
    // ── НАВЫК И ЭФФЕКТИВНОСТЬ ──
    time:        { key: 'achievements.jupiter.metrics.time',        fallback: 'Секунд на планете' },
    speed:       { key: 'achievements.jupiter.metrics.speed',       fallback: 'Рекорд скорости (мс)' },
    critStreak:  { key: 'achievements.jupiter.metrics.critStreak',  fallback: 'Серия критов подряд' }
};

// ✅ Регистрация через фабрику
function registerJupiter() {
    if (window.AchievementsV2?.PlanetFactory) {
        window.AchievementsV2.PlanetFactory.create(CONFIG, NAME_TEMPLATES);
        console.log('♃ [ACH-V2] Jupiter config loaded. Metrics:', Object.keys(CONFIG.metrics).length);
    } else {
        console.warn('⏳ [ACH-V2] PlanetFactory not ready, retrying...');
        setTimeout(registerJupiter, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerJupiter);
} else {
    registerJupiter();
}
})();