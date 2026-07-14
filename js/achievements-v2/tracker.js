// js/achievements-v2/tracker.js
// ═══════════════════════════════════════════════════
// 🔗 ШИНКРОНИЗАЦИЯ С COMBAT-SYSTEM (бэкенд без UI)
// ЧТО: Экспортирует те же методы, что и старый achievements.js
//      для совместимости с combat-system.js и game-core.js
// ЗАЧЕМ: Старый achievements.js отключён, но combat-system
//        продолжает вызывать achievementsSystem.incrementPlanetBlocks()
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

// ═══════════════════════════════════════════════════
// 🌍 ПЛАНЕТАРНЫЕ МЕТРИКИ (через Mercury v2)
// ═══════════════════════════════════════════════════
function incrementPlanetBlocks(planet, c) {
    if (!c) c = 1;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = { blocks: 0, crits: 0, combo: 0, rare: 0 };
    gm.planetStats[planet].blocks = (gm.planetStats[planet].blocks || 0) + c;
    
    // ✅ Передаём в Mercury v2
    if (window.AchievementsV2?.Mercury && planet === 'mercury') {
        window.AchievementsV2.Mercury.updateMetricProgress('blocks', gm.planetStats[planet].blocks);
    }
    
    debouncedSave();
}

// ✅ НОВОЕ: Метрики для экономики и помощников
function incrementPlanetCrystals(planet, amount) {
    if (!amount) return;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = { blocks: 0, crits: 0, combo: 0, rare: 0, crystalsEarned: 0 };
    gm.planetStats[planet].crystalsEarned = (gm.planetStats[planet].crystalsEarned || 0) + amount;
    
    if (window.AchievementsV2?.Mercury && planet === 'mercury') {
        window.AchievementsV2.Mercury.updateMetricProgress('crystals', gm.planetStats[planet].crystalsEarned);
    }
    debouncedSave();
}

function incrementPlanetBobo(planet) {
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = { blocks: 0, crits: 0, combo: 0, rare: 0, boboActivations: 0 };
    gm.planetStats[planet].boboActivations = (gm.planetStats[planet].boboActivations || 0) + 1;
    
    if (window.AchievementsV2?.Mercury && planet === 'mercury') {
        window.AchievementsV2.Mercury.updateMetricProgress('bobo', gm.planetStats[planet].boboActivations);
    }
    debouncedSave();
}

function incrementPlanetBoboDamage(planet, damage) {
    if (!damage) return;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = { blocks: 0, crits: 0, combo: 0, rare: 0, boboDamage: 0 };
    gm.planetStats[planet].boboDamage = (gm.planetStats[planet].boboDamage || 0) + damage;
    
    if (window.AchievementsV2?.Mercury && planet === 'mercury') {
        window.AchievementsV2.Mercury.updateMetricProgress('boboDmg', gm.planetStats[planet].boboDamage);
    }
    debouncedSave();
}

// ✅ НОВОЕ: Метрики для навыка и эффективности
function updatePlanetTime(planet, seconds) {
    if (!seconds) return;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = { blocks: 0, crits: 0, combo: 0, rare: 0, timePlayed: 0 };
    gm.planetStats[planet].timePlayed = (gm.planetStats[planet].timePlayed || 0) + seconds;
    
    if (window.AchievementsV2?.Mercury && planet === 'mercury') {
        window.AchievementsV2.Mercury.updateMetricProgress('time', gm.planetStats[planet].timePlayed);
    }
    debouncedSave();
}

function updatePlanetSpeed(planet, milliseconds) {
    if (!milliseconds || milliseconds <= 0) return;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = { blocks: 0, crits: 0, combo: 0, rare: 0, fastestBlock: 0 };
    
    // Обновляем только если это новый рекорд (меньше время = лучше)
    const current = gm.planetStats[planet].fastestBlock || 0;
    if (current === 0 || milliseconds < current) {
        gm.planetStats[planet].fastestBlock = milliseconds;
        
        if (window.AchievementsV2?.Mercury && planet === 'mercury') {
            window.AchievementsV2.Mercury.updateMetricProgress('speed', milliseconds);
        }
        debouncedSave();
    }
}

function updatePlanetAccuracy(planet, percent) {
    if (percent === undefined || percent < 0 || percent > 100) return;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = { blocks: 0, crits: 0, combo: 0, rare: 0, bestAccuracy: 0 };
    
    // Обновляем только если это новый рекорд (больше % = лучше)
    const current = gm.planetStats[planet].bestAccuracy || 0;
    if (percent > current) {
        gm.planetStats[planet].bestAccuracy = percent;
        
        if (window.AchievementsV2?.Mercury && planet === 'mercury') {
            window.AchievementsV2.Mercury.updateMetricProgress('accuracy', percent);
        }
        debouncedSave();
    }
}

function updatePlanetPerfectStreak(planet, streak) {
    if (!streak || streak <= 0) return;
    var gm = window.gameMetrics;
    if (!gm) gm = window.gameMetrics = {};
    if (!gm.planetStats) gm.planetStats = {};
    if (!gm.planetStats[planet]) gm.planetStats[planet] = { blocks: 0, crits: 0, combo: 0, rare: 0, maxPerfectStreak: 0 };
    
    // Обновляем только если это новый рекорд (больше серия = лучше)
    const current = gm.planetStats[planet].maxPerfectStreak || 0;
    if (streak > current) {
        gm.planetStats[planet].maxPerfectStreak = streak;
        
        if (window.AchievementsV2?.Mercury && planet === 'mercury') {
            window.AchievementsV2.Mercury.updateMetricProgress('perfect', streak);
        }
        debouncedSave();
    }
}

function incrementPlanetCrits(planet, c) {
    if (!c) c = 1;
    var gm = window.gameMetrics;
    if (!gm || !gm.planetStats) return;
    if (!gm.planetStats[planet]) gm.planetStats[planet] = { blocks: 0, crits: 0, combo: 0, rare: 0 };
    gm.planetStats[planet].crits = (gm.planetStats[planet].crits || 0) + c;
    
    if (window.AchievementsV2?.Mercury && planet === 'mercury') {
        window.AchievementsV2.Mercury.updateMetricProgress('crits', gm.planetStats[planet].crits);
    }
    
    debouncedSave();
}

function updatePlanetCombo(planet, combo) {
    var gm = window.gameMetrics;
    if (!gm || !gm.planetStats) return;
    if (!gm.planetStats[planet]) gm.planetStats[planet] = { blocks: 0, crits: 0, combo: 0, rare: 0 };
    if (combo > (gm.planetStats[planet].combo || 0)) {
        gm.planetStats[planet].combo = combo;
        
        if (window.AchievementsV2?.Mercury && planet === 'mercury') {
            window.AchievementsV2.Mercury.updateMetricProgress('combo', combo);
        }
    }
}

function incrementPlanetRareBlocks(planet, c) {
    if (!c) c = 1;
    var gm = window.gameMetrics;
    if (!gm || !gm.planetStats) return;
    if (!gm.planetStats[planet]) gm.planetStats[planet] = { blocks: 0, crits: 0, combo: 0, rare: 0 };
    gm.planetStats[planet].rare = (gm.planetStats[planet].rare || 0) + c;
    
    if (window.AchievementsV2?.Mercury && planet === 'mercury') {
        window.AchievementsV2.Mercury.updateMetricProgress('rare', gm.planetStats[planet].rare);
    }
    
    debouncedSave();
}

// ═══════════════════════════════════════════════════
// 🏆 ГЛОБАЛЬНЫЕ МЕТРИКИ (заглушки для совместимости)
// ═══════════════════════════════════════════════════
function incrementTotalDamage(d) {
    var gs = window.gameState;
    if (!gs) gs = window.gameState = {};
    gs.totalDamageDealt = (gs.totalDamageDealt || 0) + d;
    
    // ✅ Проверяем мастер-достижение Mercury
    if (window.AchievementsV2?.Mercury && gs.currentLocation === 'mercury') {
        window.AchievementsV2.Mercury.checkMasterAchievement(gs.planetDamageDealt || 0);
    }
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
    if (combo > (gm.maxCombo || 0)) {
        gm.maxCombo = combo;
    }
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

function updateTimePlayed() {
    // Заглушка для совместимости
}

// ═══════════════════════════════════════════════════
// 🌐 ЭКСПОРТ API (идентично старому achievements.js)
// ═══════════════════════════════════════════════════
window.achievementsSystem = {
    init: function() { console.log('🔗 [ACH-V2] Tracker initialized (backend only)'); },
    toggleAchievementsPanel: function() {
        if (window.AchievementsV2?.UI?.togglePanel) {
            window.AchievementsV2.UI.togglePanel();
        }
    },
    showAchievementsPanel: function() {
        if (window.AchievementsV2?.UI?.showPanel) {
            window.AchievementsV2.UI.showPanel();
        }
    },
    hideAchievementsPanel: function() {
        if (window.AchievementsV2?.UI?.hidePanel) {
            window.AchievementsV2.UI.hidePanel();
        }
    },
    updateAchievementsDisplay: function() {
        if (window.AchievementsV2?.UI?.renderGridView) {
            window.AchievementsV2.UI.renderGridView();
        }
    },
    updateTimePlayed: updateTimePlayed,
    getUnlockedCount: function() { return 0; },
    getTotalCount: function() { return 0; },
    
    // ── ПЛАНЕТАРНЫЕ МЕТРИКИ (5 базовых + 7 новых) ──
    incrementPlanetBlocks: incrementPlanetBlocks,
    incrementPlanetCrits: incrementPlanetCrits,
    updatePlanetCombo: updatePlanetCombo,
    incrementPlanetRareBlocks: incrementPlanetRareBlocks,
    
    // ✅ НОВОЕ: Экономика и помощники
    incrementPlanetCrystals: incrementPlanetCrystals,
    incrementPlanetBobo: incrementPlanetBobo,
    incrementPlanetBoboDamage: incrementPlanetBoboDamage,
    
    // ✅ НОВОЕ: Навык и эффективность
    updatePlanetTime: updatePlanetTime,
    updatePlanetSpeed: updatePlanetSpeed,
    updatePlanetAccuracy: updatePlanetAccuracy,
    updatePlanetPerfectStreak: updatePlanetPerfectStreak,
    
    // ── ГЛОБАЛЬНЫЕ МЕТРИКИ ──
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

console.log('🔗 [ACH-V2] Tracker shim initialized');
})();