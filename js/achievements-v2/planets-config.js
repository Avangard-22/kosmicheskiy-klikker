// js/achievements-v2/planets-config.js — ЕДИНАЯ ТАБЛИЦА ПЛАНЕТ (заменяет 10 файлов)
// ═══════════════════════════════════════════════════════════
// ЧТО: Только данные. Логика (генерация, ранги, сохранение) — в planet-factory.js.
// ЗАЧЕМ: Одна таблица вместо 10 копипастов → правки баланса в одном месте.
// ═══════════════════════════════════════════════════════════
(function () {
'use strict';

// ── ОБЩИЕ ПАРАМЕТРЫ МЕТРИК (одинаковы для всех планет) ──
const METRIC_META = {
    blocks:       { growth: 1.50, rewardGrowth: 1.08, type: 'cumulative', emoji: '🔨', fallback: 'Уничтожено блоков' },
    crits:        { growth: 1.60, rewardGrowth: 1.10, type: 'cumulative', emoji: '⚡', fallback: 'Критических ударов' },
    combo:        { growth: 1.40, rewardGrowth: 1.12, type: 'record_max', emoji: '🔥', fallback: 'Максимальное комбо' },
    rare:         { growth: 1.80, rewardGrowth: 1.15, type: 'cumulative', emoji: '⭐', fallback: 'Редких блоков' },
    damage:       { growth: 1.70, rewardGrowth: 1.09, type: 'cumulative', emoji: '💥', fallback: 'Нанесено урона' },
    crystals:     { growth: 1.60, rewardGrowth: 1.08, type: 'cumulative', emoji: '💎', fallback: 'Заработано кристаллов' },
    bobo:         { growth: 1.50, rewardGrowth: 1.10, type: 'cumulative', emoji: '🤖', fallback: 'Активаций Bobo' },
    boboDmg:      { growth: 1.55, rewardGrowth: 1.10, type: 'cumulative', emoji: '🔧', fallback: 'Урона нанесено Bobo' },
    boboCrystals: { growth: 1.60, rewardGrowth: 1.10, type: 'cumulative', emoji: '💰', fallback: 'Кристаллов от Bobo' },
    upgrades:     { growth: 1.45, rewardGrowth: 1.10, type: 'cumulative', emoji: '🛒', fallback: 'Улучшений куплено' },
    time:         { growth: 1.30, rewardGrowth: 1.07, type: 'cumulative', emoji: '⏱️', fallback: 'Секунд на планете' },
    days:         { growth: 1.0,  rewardGrowth: 1.0,  type: 'days',       emoji: '📅', fallback: 'Дней в игре' },
    critStreak:   { growth: 1.40, rewardGrowth: 1.12, type: 'record_max', emoji: '🎯', fallback: 'Серия критов подряд' }
};

const nameKeyOf   = id => `gameTitle.${id}`;
const descKeyOf   = id => `achievements.${id}.description`;
const metricKeyOf = (id, m) => `achievements.${id}.metrics.${m}`;

// ── ТАБЛИЦА: только числа баланса (base / rewardBase) ──
const PLANETS = [
    { id: 'mercury', prefix: 'm',  emoji: '☿', scale: 1.0, masterAU: 0.38710,
      metrics: {
          blocks:{base:1,rewardBase:25},  crits:{base:10,rewardBase:60},  combo:{base:5,rewardBase:80},
          rare:{base:3,rewardBase:150},   damage:{base:500,rewardBase:40}, crystals:{base:200,rewardBase:30},
          bobo:{base:3,rewardBase:100},   boboDmg:{base:1000,rewardBase:50}, boboCrystals:{base:500,rewardBase:35},
          upgrades:{base:5,rewardBase:40}, time:{base:60,rewardBase:200},  days:{base:1,rewardBase:500},
          critStreak:{base:3,rewardBase:150} } },

    { id: 'venus', prefix: 'v',  emoji: '♀', scale: 1.1, masterAU: 0.72333,
      metrics: {
          blocks:{base:2,rewardBase:30},   crits:{base:15,rewardBase:70},  combo:{base:7,rewardBase:90},
          rare:{base:4,rewardBase:170},    damage:{base:700,rewardBase:50}, crystals:{base:300,rewardBase:35},
          bobo:{base:4,rewardBase:120},    boboDmg:{base:1400,rewardBase:60}, boboCrystals:{base:750,rewardBase:40},
          upgrades:{base:7,rewardBase:50}, time:{base:90,rewardBase:60},    days:{base:1,rewardBase:500},
          critStreak:{base:4,rewardBase:180} } },

    { id: 'earth', prefix: 'e',  emoji: '♁', scale: 1.2, masterAU: 1.00000,
      metrics: {
          blocks:{base:3,rewardBase:35},   crits:{base:20,rewardBase:80},  combo:{base:9,rewardBase:100},
          rare:{base:5,rewardBase:190},    damage:{base:1000,rewardBase:60}, crystals:{base:450,rewardBase:40},
          bobo:{base:5,rewardBase:140},    boboDmg:{base:2000,rewardBase:70}, boboCrystals:{base:1100,rewardBase:45},
          upgrades:{base:10,rewardBase:60}, time:{base:120,rewardBase:70},   days:{base:1,rewardBase:500},
          critStreak:{base:5,rewardBase:210} } },

    { id: 'mars', prefix: 'r',  emoji: '♂', scale: 1.3, masterAU: 1.52366,
      metrics: {
          blocks:{base:4,rewardBase:40},   crits:{base:25,rewardBase:90},  combo:{base:10,rewardBase:110},
          rare:{base:6,rewardBase:210},    damage:{base:1200,rewardBase:70}, crystals:{base:500,rewardBase:45},
          bobo:{base:6,rewardBase:160},    boboDmg:{base:2500,rewardBase:80}, boboCrystals:{base:1200,rewardBase:50},
          upgrades:{base:12,rewardBase:70}, time:{base:150,rewardBase:80},   days:{base:1,rewardBase:500},
          critStreak:{base:6,rewardBase:240} } },

    { id: 'jupiter', prefix: 'j',  emoji: '♃', scale: 1.4, masterAU: 5.20336,
      metrics: {
          blocks:{base:6,rewardBase:50},   crits:{base:35,rewardBase:110}, combo:{base:12,rewardBase:130},
          rare:{base:8,rewardBase:250},    damage:{base:2000,rewardBase:90}, crystals:{base:750,rewardBase:55},
          bobo:{base:8,rewardBase:200},    boboDmg:{base:4000,rewardBase:100}, boboCrystals:{base:1800,rewardBase:60},
          upgrades:{base:15,rewardBase:80}, time:{base:240,rewardBase:100},  days:{base:1,rewardBase:500},
          critStreak:{base:8,rewardBase:280} } },

    { id: 'saturn', prefix: 's',  emoji: '♄', scale: 1.5, masterAU: 9.53707,
      metrics: {
          blocks:{base:8,rewardBase:60},   crits:{base:45,rewardBase:130}, combo:{base:14,rewardBase:150},
          rare:{base:10,rewardBase:300},   damage:{base:2800,rewardBase:110}, crystals:{base:1000,rewardBase:65},
          bobo:{base:10,rewardBase:240},   boboDmg:{base:5500,rewardBase:120}, boboCrystals:{base:2400,rewardBase:70},
          upgrades:{base:18,rewardBase:95}, time:{base:300,rewardBase:120},  days:{base:1,rewardBase:500},
          critStreak:{base:10,rewardBase:320} } },

    { id: 'uranus', prefix: 'u',  emoji: '♅', scale: 1.6, masterAU: 19.19126,
      metrics: {
          blocks:{base:10,rewardBase:70},  crits:{base:60,rewardBase:150}, combo:{base:16,rewardBase:170},
          rare:{base:12,rewardBase:350},   damage:{base:4000,rewardBase:130}, crystals:{base:1400,rewardBase:75},
          bobo:{base:12,rewardBase:280},   boboDmg:{base:7500,rewardBase:140}, boboCrystals:{base:3400,rewardBase:80},
          upgrades:{base:22,rewardBase:110}, time:{base:420,rewardBase:140}, days:{base:1,rewardBase:500},
          critStreak:{base:12,rewardBase:360} } },

    { id: 'neptune', prefix: 'n',  emoji: '♆', scale: 1.7, masterAU: 30.06896,
      metrics: {
          blocks:{base:12,rewardBase:80},  crits:{base:75,rewardBase:170}, combo:{base:18,rewardBase:190},
          rare:{base:14,rewardBase:400},   damage:{base:5500,rewardBase:150}, crystals:{base:1900,rewardBase:85},
          bobo:{base:14,rewardBase:320},   boboDmg:{base:10000,rewardBase:160}, boboCrystals:{base:4600,rewardBase:90},
          upgrades:{base:26,rewardBase:125}, time:{base:540,rewardBase:160}, days:{base:1,rewardBase:500},
          critStreak:{base:14,rewardBase:400} } },

    { id: 'pluto', prefix: 'p',  emoji: '♇', scale: 1.8, masterAU: 39.48200,
      metrics: {
          blocks:{base:15,rewardBase:90},  crits:{base:90,rewardBase:190}, combo:{base:20,rewardBase:210},
          rare:{base:16,rewardBase:450},   damage:{base:7000,rewardBase:170}, crystals:{base:2500,rewardBase:95},
          bobo:{base:16,rewardBase:360},   boboDmg:{base:14000,rewardBase:180}, boboCrystals:{base:6000,rewardBase:100},
          upgrades:{base:30,rewardBase:140}, time:{base:720,rewardBase:180}, days:{base:1,rewardBase:500},
          critStreak:{base:16,rewardBase:440} } },

    { id: 'heliopause', prefix: 'hp', emoji: '🌌', scale: 1.9, masterAU: 120.00000,
      metrics: {
          blocks:{base:18,rewardBase:100}, crits:{base:100,rewardBase:210}, combo:{base:22,rewardBase:230},
          rare:{base:18,rewardBase:500},   damage:{base:8000,rewardBase:190}, crystals:{base:3500,rewardBase:105},
          bobo:{base:18,rewardBase:400},   boboDmg:{base:16000,rewardBase:200}, boboCrystals:{base:7000,rewardBase:110},
          upgrades:{base:36,rewardBase:150}, time:{base:800,rewardBase:200}, days:{base:1,rewardBase:500},
          critStreak:{base:20,rewardBase:480} } }
];

// ── СБОРКА конфига + шаблонов имён (повторяет структуру старых 10 файлов) ──
function buildPlanet(p) {
    const metrics = {};
    const templates = {};
    for (const m of Object.keys(p.metrics)) {
        const meta = METRIC_META[m];
        metrics[m] = {
            base: p.metrics[m].base,
            rewardBase: p.metrics[m].rewardBase,
            growth: meta.growth,
            rewardGrowth: meta.rewardGrowth,
            type: meta.type,
            emoji: meta.emoji
        };
        templates[m] = { key: metricKeyOf(p.id, m), fallback: meta.fallback };
    }
    return {
        config: {
            id: p.id,
            prefix: p.prefix,
            emoji: p.emoji,
            nameKey: nameKeyOf(p.id),
            descKey: descKeyOf(p.id),
            scale: p.scale,
            masterAU: p.masterAU,
            metrics
        },
        templates
    };
}

// ── РЕГИСТРАЦИЯ через фабрику (с ретраем — как в старых файлах) ──
function registerAll() {
    if (!window.AchievementsV2?.PlanetFactory) {
        console.warn('⏳ [ACH-V2] PlanetFactory not ready, retrying...');
        setTimeout(registerAll, 100);
        return;
    }
    for (const p of PLANETS) {
        const { config, templates } = buildPlanet(p);
        window.AchievementsV2.PlanetFactory.create(config, templates);
        console.log(`${p.emoji} [ACH-V2] ${p.id} config loaded. Metrics: ${Object.keys(config.metrics).length}`);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerAll);
} else {
    registerAll();
}
})();