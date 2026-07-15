// js/achievements-v2/mercury.js (ЧИСТЫЙ КОНФИГ)
(function() {
'use strict';

const CONFIG = {
    id: 'mercury', 
    prefix: 'm', 
    emoji: '☿',
    nameKey: 'gameTitle.mercury', 
    descKey: 'achievements.mercury.description',
    scale: 1.0, 
    masterAU: 0.38710,
    metrics: {
        // ── БОЕВЫЕ ──
        blocks:    { base: 1,     growth: 1.50, rewardBase: 25,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '🔨' },
        crits:     { base: 10,    growth: 1.60, rewardBase: 60,   rewardGrowth: 1.10, type: 'cumulative',  emoji: '⚡' },
        combo:     { base: 5,     growth: 1.40, rewardBase: 80,   rewardGrowth: 1.12, type: 'record_max',  emoji: '🔥' },
        rare:      { base: 3,     growth: 1.80, rewardBase: 150,  rewardGrowth: 1.15, type: 'cumulative',  emoji: '⭐' },
        damage:    { base: 500,   growth: 1.70, rewardBase: 40,   rewardGrowth: 1.09, type: 'cumulative',  emoji: '💥' },
        
        // ── ЭКОНОМИКА И ПОМОЩНИКИ ──
        crystals:  { base: 200,   growth: 1.60, rewardBase: 30,   rewardGrowth: 1.08, type: 'cumulative',  emoji: '💎' },
        bobo:      { base: 3,     growth: 1.50, rewardBase: 100,  rewardGrowth: 1.10, type: 'cumulative',  emoji: '🤖' },
        boboKills: { base: 5,     growth: 1.55, rewardBase: 45,   rewardGrowth: 1.10, type: 'cumulative',  emoji: '🔧' },
        boboDmg:   { base: 1000,  growth: 1.55, rewardBase: 50,   rewardGrowth: 1.10, type: 'cumulative',  emoji: '⚡' },
        
        // ── НАВЫК И ЭФФЕКТИВНОСТЬ ──
        time:      { base: 60,    growth: 1.30, rewardBase: 50,   rewardGrowth: 1.07, type: 'cumulative',  emoji: '⏱️' },
        speed:     { base: 30000, growth: 0.85, rewardBase: 120,  rewardGrowth: 1.12, type: 'record_min',  emoji: '🏃' },
        critStreak:{ base: 3,     growth: 1.40, rewardBase: 150,  rewardGrowth: 1.12, type: 'record_max',  emoji: '🎯' }
    }
};

const NAME_TEMPLATES = {
    // ── БОЕВЫЕ ──
    blocks:    { key: 'achievements.mercury.metrics.blocks',   fallback: 'Уничтожено блоков' },
    crits:     { key: 'achievements.mercury.metrics.crits',    fallback: 'Критических ударов' },
    combo:     { key: 'achievements.mercury.metrics.combo',    fallback: 'Максимальное комбо' },
    rare:      { key: 'achievements.mercury.metrics.rare',     fallback: 'Редких блоков' },
    damage:    { key: 'achievements.mercury.metrics.damage',   fallback: 'Нанесено урона' },
    
    // ── ЭКОНОМИКА И ПОМОЩНИКИ ──
    crystals:  { key: 'achievements.mercury.metrics.crystals', fallback: 'Заработано кристаллов' },
    bobo:      { key: 'achievements.mercury.metrics.bobo',     fallback: 'Активаций Bobo' },
    boboKills: { key: 'achievements.mercury.metrics.boboKills',fallback: 'Блоков уничтожено Bobo' },
    boboDmg:   { key: 'achievements.mercury.metrics.boboDmg',  fallback: 'Урона нанесено Bobo' },
    
    // ── НАВЫК И ЭФФЕКТИВНОСТЬ ──
    time:      { key: 'achievements.mercury.metrics.time',     fallback: 'Секунд на планете' },
    speed:     { key: 'achievements.mercury.metrics.speed',    fallback: 'Рекорд скорости (мс)' },
    critStreak:{ key: 'achievements.mercury.metrics.critStreak',fallback: 'Серия критов подряд' }
};

// ✅ Надёжная регистрация через фабрику (с повторными попытками)
function registerMercury() {
    if (window.AchievementsV2 && window.AchievementsV2.PlanetFactory) {
        window.AchievementsV2.PlanetFactory.create(CONFIG, NAME_TEMPLATES);
        console.log('✅ [ACH-V2] Mercury успешно зарегистрирован через PlanetFactory');
    } else {
        console.warn('⏳ [ACH-V2] PlanetFactory ещё не готова, повтор через 100мс...');
        setTimeout(registerMercury, 100);
    }
}

// Запускаем регистрацию
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerMercury);
} else {
    registerMercury();
}
})();
