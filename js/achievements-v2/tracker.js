// js/achievements-v2/tracker.js (УНИВЕРСАЛЬНЫЙ ЧЕРЕЗ ФАБРИКУ — Delta Mode)
(function() {
'use strict';

let saveDebounceTimer = null;

function debouncedSave() {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(function() {
        if (typeof window.saveGame === 'function') window.saveGame();
    }, 10000);
}

// ✅ УНИВЕРСАЛЬНЫЙ ПОИСК МОДУЛЯ ПЛАНЕТЫ ЧЕРЕЗ ФАБРИКУ
function getPlanetModule(planet) {
    if (window.AchievementsV2?.PlanetFactory) {
        return window.AchievementsV2.PlanetFactory.get(planet);
    }
    return null;
}

// ═══════════════════════════════════════════════════
// 🌍 ПЛАНЕТАРНЫЕ МЕТРИКИ (работают с ЛЮБОЙ планетой)
// ═══════════════════════════════════════════════════

function incrementPlanetBlocks(planet, c) {
    if (!c) c = 1;
    var gm = window.gameMetrics || (window.gameMetrics = {});
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    gm.planetStats[planet].blocks = (gm.planetStats[planet].blocks || 0) + c;
    
    const module = getPlanetModule(planet);
    if (module) module.updateMetric('blocks', c, 'add'); // ✅ Передаем дельту (c) и режим 'add'
    debouncedSave();
}

function incrementPlanetCrits(planet, c) {
    if (!c) c = 1;
    var gm = window.gameMetrics || (window.gameMetrics = {});
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    gm.planetStats[planet].crits = (gm.planetStats[planet].crits || 0) + c;
    
    const module = getPlanetModule(planet);
    if (module) module.updateMetric('crits', c, 'add');
    debouncedSave();
}

function updatePlanetCombo(planet, combo) {
    var gm = window.gameMetrics || (window.gameMetrics = {});
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    
    if (combo > (gm.planetStats[planet].combo || 0)) {
        gm.planetStats[planet].combo = combo;
        const module = getPlanetModule(planet);
        if (module) module.updateMetric('combo', combo, 'max'); // ✅ Передаем абсолютное значение и режим 'max' (рекорд)
    }
}

function incrementPlanetRareBlocks(planet, c) {
    if (!c) c = 1;
    var gm = window.gameMetrics || (window.gameMetrics = {});
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    gm.planetStats[planet].rare = (gm.planetStats[planet].rare || 0) + c;
    
    const module = getPlanetModule(planet);
    if (module) module.updateMetric('rare', c, 'add');
    debouncedSave();
}

function incrementPlanetCrystals(planet, amount) {
    if (!amount) return;
    var gm = window.gameMetrics || (window.gameMetrics = {});
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    gm.planetStats[planet].crystalsEarned = (gm.planetStats[planet].crystalsEarned || 0) + amount;
    
    const module = getPlanetModule(planet);
    if (module) module.updateMetric('crystals', amount, 'add');
    debouncedSave();
}

function incrementPlanetBobo(planet) {
    var gm = window.gameMetrics || (window.gameMetrics = {});
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    gm.planetStats[planet].boboActivations = (gm.planetStats[planet].boboActivations || 0) + 1;
    
    const module = getPlanetModule(planet);
    if (module) module.updateMetric('bobo', 1, 'add');
    debouncedSave();
}

function incrementPlanetBoboDamage(planet, damage) {
    if (!damage) return;
    var gm = window.gameMetrics || (window.gameMetrics = {});
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    gm.planetStats[planet].boboDamage = (gm.planetStats[planet].boboDamage || 0) + damage;
    
    const module = getPlanetModule(planet);
    if (module) module.updateMetric('boboDmg', damage, 'add');
    debouncedSave();
}

function incrementPlanetUpgrades(planet, c) {
    if (!c) c = 1;
    var gm = window.gameMetrics || (window.gameMetrics = {});
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    gm.planetStats[planet].upgrades = (gm.planetStats[planet].upgrades || 0) + c;
    
    const module = getPlanetModule(planet);
    if (module) module.updateMetric('upgrades', c, 'add');
    debouncedSave();
}

function updatePlanetTime(planet, seconds) {
    if (!seconds) return;
    var gm = window.gameMetrics || (window.gameMetrics = {});
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    gm.planetStats[planet].timePlayed = (gm.planetStats[planet].timePlayed || 0) + seconds;
    
    const module = getPlanetModule(planet);
    if (module) module.updateMetric('time', seconds, 'add');
    debouncedSave();
}

function updatePlanetSpeed(planet, milliseconds) {
    if (!milliseconds || milliseconds <= 0) return;
    var gm = window.gameMetrics || (window.gameMetrics = {});
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    
    const current = gm.planetStats[planet].fastestBlock || 0;
    if (current === 0 || milliseconds < current) {
        gm.planetStats[planet].fastestBlock = milliseconds;
        const module = getPlanetModule(planet);
        if (module) module.updateMetric('speed', milliseconds, 'min'); // ✅ Режим 'min' для рекорда времени
        debouncedSave();
    }
}

function updatePlanetCritStreak(planet, streak) {
    if (!streak || streak <= 0) return;
    var gm = window.gameMetrics || (window.gameMetrics = {});
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
    
    const current = gm.planetStats[planet].maxCritStreak || 0;
    if (streak > current) {
        gm.planetStats[planet].maxCritStreak = streak;
        const module = getPlanetModule(planet);
        if (module) module.updateMetric('critStreak', streak, 'max'); // ✅ Режим 'max' для рекорда серии
        debouncedSave();
    }
}

// ═══════════════════════════════════════════════════
// 🏆 ГЛОБАЛЬНЫЕ МЕТРИКИ
// ═══════════════════════════════════════════════════

function incrementTotalDamage(d) {
    var gs = window.gameState || (window.gameState = {});
    gs.totalDamageDealt = (gs.totalDamageDealt || 0) + d;
    
    // ✅ ИСПРАВЛЕНО: Обновляем планетарный урон
    var gm = window.gameMetrics || (window.gameMetrics = {});
    if (!gm.planetStats) gm.planetStats = {};
    const currentPlanet = gs.currentLocation;
    if (!gm.planetStats[currentPlanet]) gm.planetStats[currentPlanet] = {};
    gm.planetStats[currentPlanet].damageDealt = (gm.planetStats[currentPlanet].damageDealt || 0) + d;
    
    const module = getPlanetModule(currentPlanet);
    if (module) {
        // ✅ Передаем дельту урона (d), а не абсолютное значение сессии
        module.updateMetric('damage', d, 'add');
        // ✅ Проверяем мастер-достижение через planetDamageDealt (прогресс-бар)
        module.checkMasterAchievement(gs.planetDamageDealt || 0);
    }
}

function incrementCoinsEarned(a) {
    var gm = window.gameMetrics || (window.gameMetrics = {});
    gm.totalCoinsEarned = (gm.totalCoinsEarned || 0) + a;
}

function updatePlanetProgress(planet) {
    var gm = window.gameMetrics || (window.gameMetrics = {});
    if (!gm.visitedPlanets) gm.visitedPlanets = [];
    if (gm.visitedPlanets.indexOf(planet) === -1) {
        gm.visitedPlanets.push(planet);
        gm.planetsVisited = gm.visitedPlanets.length;
    }
}

function updateCombo(combo) {
    var gm = window.gameMetrics || (window.gameMetrics = {});
    if (combo > (gm.maxCombo || 0)) gm.maxCombo = combo;
}

function incrementCrits(c) { if (!c) c = 1; var gm = window.gameMetrics || (window.gameMetrics = {}); gm.totalCrits = (gm.totalCrits || 0) + c; }
function incrementUpgrades(c) { if (!c) c = 1; var gm = window.gameMetrics || (window.gameMetrics = {}); gm.upgradesBought = (gm.upgradesBought || 0) + c; }
function incrementHelpers(c) { if (!c) c = 1; var gm = window.gameMetrics || (window.gameMetrics = {}); gm.helpersBought = (gm.helpersBought || 0) + c; }
function incrementBoosters(c) { if (!c) c = 1; var gm = window.gameMetrics || (window.gameMetrics = {}); gm.boostersUsed = (gm.boostersUsed || 0) + c; }
function incrementRareBlocks(c) { if (!c) c = 1; var gm = window.gameMetrics || (window.gameMetrics = {}); gm.rareBlocksDestroyed = (gm.rareBlocksDestroyed || 0) + c; }
function incrementTotalClicks(c) { if (!c) c = 1; var gm = window.gameMetrics || (window.gameMetrics = {}); gm.totalClicks = (gm.totalClicks || 0) + c; }
function updateTimePlayed() {}

// ═══════════════════════════════════════════════════
// 🌐 ЭКСПОРТ API
// ═══════════════════════════════════════════════════
window.achievementsSystem = {
    init: function() { console.log('🔗 [ACH-V2] Tracker initialized (UNIVERSAL via Factory - Delta Mode)'); },
    toggleAchievementsPanel: function() { if (window.AchievementsV2?.UI?.togglePanel) window.AchievementsV2.UI.togglePanel(); },
    showAchievementsPanel: function() { if (window.AchievementsV2?.UI?.showPanel) window.AchievementsV2.UI.showPanel(); },
    hideAchievementsPanel: function() { if (window.AchievementsV2?.UI?.hidePanel) window.AchievementsV2.UI.hidePanel(); },
    updateAchievementsDisplay: function() { if (window.AchievementsV2?.UI?.renderGridView) window.AchievementsV2.UI.renderGridView(); },
    updateTimePlayed: updateTimePlayed,
    getUnlockedCount: function() { return 0; },
    getTotalCount: function() { return 0; },
    incrementPlanetBlocks: incrementPlanetBlocks,
    incrementPlanetCrits: incrementPlanetCrits,
    updatePlanetCombo: updatePlanetCombo,
    incrementPlanetRareBlocks: incrementPlanetRareBlocks,
    incrementPlanetCrystals: incrementPlanetCrystals,
    incrementPlanetBobo: incrementPlanetBobo,
    incrementPlanetBoboDamage: incrementPlanetBoboDamage,
    incrementPlanetUpgrades: incrementPlanetUpgrades,
    updatePlanetTime: updatePlanetTime,
    updatePlanetSpeed: updatePlanetSpeed,
    updatePlanetCritStreak: updatePlanetCritStreak,
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

console.log('🔗 [ACH-V2] Tracker shim initialized (UNIVERSAL - Delta Mode)');
})();