 // js/achievements-v2/saturn.js
// ═══════════════════════════════════════════════════
// ♄ САТУРН v1.0 — Конфиг планеты (6-я от Солнца)
// ЧТО: Только данные (метрики, шаблоны имён, параметры)
// ЗАЧЕМ: Фабрика создаст модуль автоматически
// ОСОБЕННОСТЬ: Газовый гигант с кольцами — высокая сложность
// ═══════════════════════════════════════════════════
(function() {
'use strict';

const CONFIG = {
    id: 'saturn',
    prefix: 's',
    emoji: '♄',
    nameKey: 'gameTitle.saturn',
    descKey: 'achievements.saturn.description',
    scale: 1.5,                     // Высокая сложность (кольца Сатурна)
    masterAU: 9.53707,              // Реальное значение AU Сатурна
    
    // 13 метрик: увеличенные base относительно Юпитера
    metrics: {
        // ── БОЕВЫЕ ──
        blocks:      { base: 8,     growth: 1.50, rewardBase: 60,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '🔨' },
        crits:       { base: 45,    growth: 1.60, rewardBase: 130,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '⚡' },
        combo:       { base: 14,    growth: 1.40, rewardBase: 150,  rewardGrowth: 1.12, type: 'record_max',  emoji: '🔥' },
        rare:        { base: 10,    growth: 1.80, rewardBase: 300,  rewardGrowth: 1.15, type: 'cumulative',  emoji: '⭐' },
        damage:      { base: 2800,  growth: 1.70, rewardBase: 110,  rewardGrowth: 1.09, type: 'cumulative',  emoji: '💥' },
        
        // ── ЭКОНОМИКА И ПОМОЩНИКИ ──
        crystals:    { base: 1000,  growth: 1.60, rewardBase: 65,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '💎' },
        bobo:        { base: 10,    growth: 1.50, rewardBase: 240,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '🤖' },
        boboDmg:     { base: 5500,  growth: 1.55, rewardBase: 120,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '🔧' },
        boboCrystals:{ base: 2400, growth: 1.60, rewardBase: 70, rewardGrowth: 1.10, type: 'cumulative', emoji: '💰' }, 
        upgrades:    { base: 18,    growth: 1.45, rewardBase: 95,   rewardGrowth: 1.10, type: 'cumulative',  emoji: '🛒' },
        
        // ── НАВЫК И ЭФФЕКТИВНОСТЬ ──
        time:        { base: 300,   growth: 1.30, rewardBase: 120,  rewardGrowth: 1.07, type: 'cumulative',  emoji: '⏱️' },
               days:        { base: 1, growth: 1.0, rewardBase: 500, rewardGrowth: 1.0, type: 'days', emoji: '📅' },
        critStreak:  { base: 10,    growth: 1.40, rewardBase: 320,  rewardGrowth: 1.12, type: 'record_max',  emoji: '🎯' }
    }
};

const NAME_TEMPLATES = {
    // ── БОЕВЫЕ ──
    blocks:      { key: 'achievements.saturn.metrics.blocks',      fallback: 'Уничтожено блоков' },
    crits:       { key: 'achievements.saturn.metrics.crits',       fallback: 'Критических ударов' },
    combo:       { key: 'achievements.saturn.metrics.combo',       fallback: 'Максимальное комбо' },
    rare:        { key: 'achievements.saturn.metrics.rare',        fallback: 'Редких блоков' },
    damage:      { key: 'achievements.saturn.metrics.damage',      fallback: 'Нанесено урона' },
    
    // ── ЭКОНОМИКА И ПОМОЩНИКИ ──
    crystals:    { key: 'achievements.saturn.metrics.crystals',    fallback: 'Заработано кристаллов' },
    bobo:        { key: 'achievements.saturn.metrics.bobo',        fallback: 'Активаций Bobo' },
    boboDmg:     { key: 'achievements.saturn.metrics.boboDmg',     fallback: 'Урона нанесено Bobo' },
 boboCrystals:{ key: 'achievements.saturn.metrics.boboCrystals',fallback: 'Кристаллов от Bobo' },   
 upgrades:    { key: 'achievements.saturn.metrics.upgrades',    fallback: 'Улучшений куплено' },
    
    // ── НАВЫК И ЭФФЕКТИВНОСТЬ ──
    time:        { key: 'achievements.saturn.metrics.time',        fallback: 'Секунд на планете' },
   days: { key: 'achievements.saturn.metrics.days', fallback: 'Дней в игре' },
    critStreak:  { key: 'achievements.saturn.metrics.critStreak',  fallback: 'Серия критов подряд' }
};

// ✅ Регистрация через фабрику
function registerSaturn() {
    if (window.AchievementsV2?.PlanetFactory) {
        window.AchievementsV2.PlanetFactory.create(CONFIG, NAME_TEMPLATES);
        console.log('♄ [ACH-V2] Saturn config loaded. Metrics:', Object.keys(CONFIG.metrics).length);
    } else {
        console.warn('⏳ [ACH-V2] PlanetFactory not ready, retrying...');
        setTimeout(registerSaturn, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerSaturn);
} else {
    registerSaturn();
}
})();
