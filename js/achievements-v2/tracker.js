// js/achievements-v2/tracker.js (UNIVERSAL v2.0)
// ═══════════════════════════════════════════════════
// 🔗 УНИВЕРСАЛЬНЫЙ ТРЕКЕР — работает с ЛЮБОЙ планетой
// ЧТО: Мост между combat-system.js и достижениями v2.
// ЗАЧЕМ: Не нужно переписывать при добавлении новой планеты.
// ═══════════════════════════════════════════════════
(function() {
'use strict';

let saveDebounceTimer = null;
function debouncedSave() {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(function() {
        if (typeof window.saveGame === 'function') window.saveGame();
    }, 10000);
}

// ✅ УНИВЕРСАЛЬНЫЙ ПОИСК МОДУЛЯ ПЛАНЕТЫ
function getPlanetModule(planet) {
    if (!window.AchievementsV2?.PlanetFactory) return null;
    return window.AchievementsV2.PlanetFactory.get(planet);
}

// ═══════════════════════════════════════════════════
// 🌍 ПЛАНЕТАРНЫЕ МЕТРИКИ (12 штук)
// ═══════════════════════════════════════════════════
function incrementPlanetBlocks(planet, c) {
    if (!c) c = 1;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    gm.planetStats[planet].blocks = (gm.planetStats[planet].blocks || 0) + c;
    const module = getPlanetModule(planet);
    if (module) module.updateMetricProgress('blocks', gm.planetStats[planet].blocks);
    debouncedSave();
}

function incrementPlanetCrits(planet, c) {
    if (!c) c = 1;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    gm.planetStats[planet].crits = (gm.planetStats[planet].crits || 0) + c;
    const module = getPlanetModule(planet);
    if (module) module.updateMetricProgress('crits', gm.planetStats[planet].crits);
    debouncedSave();
}

function updatePlanetCombo(planet, combo) {
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    if (combo > (gm.planetStats[planet].combo || 0)) {
        gm.planetStats[planet].combo = combo;
        const module = getPlanetModule(planet);
        if (module) module.updateMetricProgress('combo', combo);
    }
}

function incrementPlanetRareBlocks(planet, c) {
    if (!c) c = 1;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    gm.planetStats[planet].rare = (gm.planetStats[planet].rare || 0) + c;
    const module = getPlanetModule(planet);
    if (module) module.updateMetricProgress('rare', gm.planetStats[planet].rare);
    debouncedSave();
}

function incrementPlanetCrystals(planet, amount) {
    if (!amount) return;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    gm.planetStats[planet].crystalsEarned = (gm.planetStats[planet].crystalsEarned || 0) + amount;
    const module = getPlanetModule(planet);
    if (module) module.updateMetricProgress('crystals', gm.planetStats[planet].crystalsEarned);
    debouncedSave();
}

// ✅ НОВОЕ: Метрика bobo (активации Bobo)
function incrementPlanetBobo(planet) {
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    gm.planetStats[planet].boboActivations = (gm.planetStats[planet].boboActivations || 0) + 1;
    const module = getPlanetModule(planet);
    if (module) module.updateMetricProgress('bobo', gm.planetStats[planet].boboActivations);
    debouncedSave();
}

// ✅ НОВОЕ: Метрика boboDmg (урон от Bobo)
function incrementPlanetBoboDamage(planet, damage) {
    if (!damage) return;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    gm.planetStats[planet].boboDamage = (gm.planetStats[planet].boboDamage || 0) + damage;
    const module = getPlanetModule(planet);
    if (module) module.updateMetricProgress('boboDmg', gm.planetStats[planet].boboDamage);
    debouncedSave();
}

// ✅ НОВОЕ: Метрика boboKills (блоки уничтоженные Bobo)
function incrementPlanetBoboKills(planet, c) {
    if (!c) c = 1;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    gm.planetStats[planet].boboKills = (gm.planetStats[planet].boboKills || 0) + c;
    const module = getPlanetModule(planet);
    if (module) module.updateMetricProgress('boboKills', gm.planetStats[planet].boboKills);
    debouncedSave();
}

// ✅ НОВОЕ: Метрика critStreak (серия критов подряд)
function updatePlanetCritStreak(planet, streak) {
    if (!streak || streak <= 0) return;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    const current = gm.planetStats[planet].maxCritStreak || 0;
    if (streak > current) {
        gm.planetStats[planet].maxCritStreak = streak;
        const module = getPlanetModule(planet);
        if (module) module.updateMetricProgress('critStreak', streak);
        debouncedSave();
    }
}

function updatePlanetTime(planet, seconds) {
    if (!seconds) return;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    gm.planetStats[planet].timePlayed = (gm.planetStats[planet].timePlayed || 0) + seconds;
    const module = getPlanetModule(planet);
    if (module) module.updateMetricProgress('time', gm.planetStats[planet].timePlayed);
    debouncedSave();
}

function updatePlanetSpeed(planet, milliseconds) {
    if (!milliseconds || milliseconds <= 0) return;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    const current = gm.planetStats[planet].fastestBlock || 0;
    if (current === 0 || milliseconds < current) {
        gm.planetStats[planet].fastestBlock = milliseconds;
        const module = getPlanetModule(planet);
        if (module) module.updateMetricProgress('speed', milliseconds);
        debouncedSave();
    }
}

// ═══════════════════════════════════════════════════
// 🏆 ГЛОБАЛЬНЫЕ МЕТРИКИ
// ═══════════════════════════════════════════════════
function incrementTotalDamage(d) {
    var gs = window.gameState;
    if (!gs) gs = window.gameState = {};
    gs.totalDamageDealt = (gs.totalDamageDealt || 0) + d;
    const currentPlanet = gs.currentLocation;
    const module = getPlanetModule(currentPlanet);
    if (module) module.checkMasterAchievement(gs.planetDamageDealt || 0);
}

function incrementCoinsEarned(a) {
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    gm.totalCoinsEarned = (gm.totalCoinsEarned || 0) + a;
}

function updatePlanetProgress(planet) {
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.visitedPlanets) gm.visitedPlanets = [];
    if (gm.visitedPlanets.indexOf(planet) === -1) {
        gm.visitedPlanets.push(planet);
        gm.planetsVisited = gm.visitedPlanets.length;
    }
}

function updateCombo(combo) {
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (combo > (gm.maxCombo || 0)) gm.maxCombo = combo;
}

function incrementCrits(c) {
    if (!c) c = 1;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    gm.totalCrits = (gm.totalCrits || 0) + c;
}

function incrementUpgrades(c) {
    if (!c) c = 1;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    gm.upgradesBought = (gm.upgradesBought || 0) + c;
}

function incrementHelpers(c) {
    if (!c) c = 1;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    gm.helpersBought = (gm.helpersBought || 0) + c;
}

function incrementBoosters(c) {
    if (!c) c = 1;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    gm.boostersUsed = (gm.boostersUsed || 0) + c;
}

function incrementRareBlocks(c) {
    if (!c) c = 1;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    gm.rareBlocksDestroyed = (gm.rareBlocksDestroyed || 0) + c;
}

function incrementTotalClicks(c) {
    if (!c) c = 1;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    gm.totalClicks = (gm.totalClicks || 0) + c;
}

function updateTimePlayed() {}

// ═══════════════════════════════════════════════════
// 🌐 ЭКСПОРТ API
// ═══════════════════════════════════════════════════
window.achievementsSystem = {
    init: function() { console.log('🔗 [ACH-V2] Tracker initialized (UNIVERSAL)'); },
    toggleAchievementsPanel: function() { if (window.AchievementsV2?.UI?.togglePanel) window.AchievementsV2.UI.togglePanel(); },
    showAchievementsPanel: function() { if (window.AchievementsV2?.UI?.showPanel) window.AchievementsV2.UI.showPanel(); },
    hideAchievementsPanel: function() { if (window.AchievementsV2?.UI?.hidePanel) window.AchievementsV2.UI.hidePanel(); },
    updateAchievementsDisplay: function() { if (window.AchievementsV2?.UI?.renderGridView) window.AchievementsV2.UI.renderGridView(); },
    updateTimePlayed: updateTimePlayed,
    getUnlockedCount: function() { return 0; },
    getTotalCount: function() { return 0; },
    
    // Планетарные метрики (12 штук)
    incrementPlanetBlocks: incrementPlanetBlocks,
    incrementPlanetCrits: incrementPlanetCrits,
    updatePlanetCombo: updatePlanetCombo,
    incrementPlanetRareBlocks: incrementPlanetRareBlocks,
    incrementPlanetCrystals: incrementPlanetCrystals,
    incrementPlanetBobo: incrementPlanetBobo,
    incrementPlanetBoboDamage: incrementPlanetBoboDamage,
    incrementPlanetBoboKills: incrementPlanetBoboKills,
    updatePlanetCritStreak: updatePlanetCritStreak,
    updatePlanetTime: updatePlanetTime,
    updatePlanetSpeed: updatePlanetSpeed,
    
    // Глобальные метрики
    incrementTotalDamage: incrementTotalDamage,
    incrementCoinsEarned: incrementCoinsEarned,
    updatePlanetProgress: updatePlanetProgress,
    updateCombo: updateCombo,
    incrementCrits: incrementCrits,
    incrementUpgrades: incrementUpgrades,
    incrementHelpers: incrementHelpers,
    incrementBoosters: incrementBoosters,
    incrementRareBlocks: incrementRareBlocks,
    incrementTotalClicks: incrementTotalClicks
};

console.log('🔗 [ACH-V2] Tracker shim initialized (UNIVERSAL with 12 planet metrics)');
})();
