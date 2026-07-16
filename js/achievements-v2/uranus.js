// js/achievements-v2/uranus.js
// ═══════════════════════════════════════════════════
// ♅ УРАН v1.0 — Конфиг планеты (7-я от Солнца)
// ЧТО: Только данные (метрики, шаблоны имён, параметры)
// ЗАЧЕМ: Фабрика создаст модуль автоматически
// ОСОБЕННОСТЬ: Ледяной гигант, очень далеко (19 AU)
// ═══════════════════════════════════════════════════
(function() {
'use strict';

const CONFIG = {
    id: 'uranus',
    prefix: 'u',
    emoji: '♅',
    nameKey: 'gameTitle.uranus',
    descKey: 'achievements.uranus.description',
    scale: 1.6,                    // Ледяной гигант, высокая сложность
    masterAU: 19.19126,            // Реальное значение AU Урана
    
    // 12 метрик: увеличенные base относительно Сатурна
    metrics: {
        // ── БОЕВЫЕ ──
        blocks:      { base: 10,    growth: 1.50, rewardBase: 70,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '🔨' },
        crits:       { base: 60,    growth: 1.60, rewardBase: 150,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '⚡' },
        combo:       { base: 16,    growth: 1.40, rewardBase: 170,  rewardGrowth: 1.12, type: 'record_max',  emoji: '🔥' },
        rare:        { base: 12,    growth: 1.80, rewardBase: 350,  rewardGrowth: 1.15, type: 'cumulative',  emoji: '⭐' },
        damage:      { base: 4000,  growth: 1.70, rewardBase: 130,  rewardGrowth: 1.09, type: 'cumulative',  emoji: '💥' },
        
        // ── ЭКОНОМИКА И ПОМОЩНИКИ ──
        crystals:    { base: 1400,  growth: 1.60, rewardBase: 75,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '💎' },
        bobo:        { base: 12,    growth: 1.50, rewardBase: 280,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '🤖' },
        boboDmg:     { base: 7500,  growth: 1.55, rewardBase: 140,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '🔧' },
        upgrades:    { base: 22,    growth: 1.45, rewardBase: 110,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '🛒' },
        
        // ── НАВЫК И ЭФФЕКТИВНОСТЬ ──
        time:        { base: 420,   growth: 1.30, rewardBase: 140,  rewardGrowth: 1.07, type: 'cumulative',  emoji: '⏱️' },
        speed:       { base: 10000, growth: 0.85, rewardBase: 300,  rewardGrowth: 1.12, type: 'record_min',  emoji: '🏃' },
        critStreak:  { base: 12,    growth: 1.40, rewardBase: 360,  rewardGrowth: 1.12, type: 'record_max',  emoji: '🎯' }
    }
};

const NAME_TEMPLATES = {
    // ── БОЕВЫЕ ──
    blocks:      { key: 'achievements.uranus.metrics.blocks',      fallback: 'Уничтожено блоков' },
    crits:       { key: 'achievements.uranus.metrics.crits',       fallback: 'Критических ударов' },
    combo:       { key: 'achievements.uranus.metrics.combo',       fallback: 'Максимальное комбо' },
    rare:        { key: 'achievements.uranus.metrics.rare',        fallback: 'Редких блоков' },
    damage:      { key: 'achievements.uranus.metrics.damage',      fallback: 'Нанесено урона' },
    
    // ── ЭКОНОМИКА И ПОМОЩНИКИ ──
    crystals:    { key: 'achievements.uranus.metrics.crystals',    fallback: 'Заработано кристаллов' },
    bobo:        { key: 'achievements.uranus.metrics.bobo',        fallback: 'Активаций Bobo' },
    boboDmg:     { key: 'achievements.uranus.metrics.boboDmg',     fallback: 'Урона нанесено Bobo' },
    upgrades:    { key: 'achievements.uranus.metrics.upgrades',    fallback: 'Улучшений куплено' },
    
    // ── НАВЫК И ЭФФЕКТИВНОСТЬ ──
    time:        { key: 'achievements.uranus.metrics.time',        fallback: 'Секунд на планете' },
    speed:       { key: 'achievements.uranus.metrics.speed',       fallback: 'Рекорд скорости (мс)' },
    critStreak:  { key: 'achievements.uranus.metrics.critStreak',  fallback: 'Серия критов подряд' }
};

// ✅ Регистрация через фабрику
function registerUranus() {
    if (window.AchievementsV2?.PlanetFactory) {
        window.AchievementsV2.PlanetFactory.create(CONFIG, NAME_TEMPLATES);
        console.log('♅ [ACH-V2] Uranus config loaded. Metrics:', Object.keys(CONFIG.metrics).length);
    } else {
        console.warn('⏳ [ACH-V2] PlanetFactory not ready, retrying...');
        setTimeout(registerUranus, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerUranus);
} else {
    registerUranus();
}
})();