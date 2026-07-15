// js/combat-system.js — ЕДИНСТВЕННЫЙ модуль боевой математики (v2.1 — без дублей)
(function() {
'use strict';

const CFG = window.GAME_CONFIG;

window.CombatSystem = {
    calculateHit: function(baseDamage, isAuto = false) {
        if (!window.gameState) return { finalDamage: 0, isCrit: false };
        const getBonus = window.GAME_CORE?.getBonus || ((t, f) => f);

        let intervalMult = 1;
        if (!isAuto && window.GAME_CORE?._intervalMultActive &&
            window.gameState?.permanentBonuses?.crystal_interval) intervalMult = 4;

        let dmg = baseDamage * getBonus('getDamageMultiplier', 1) * intervalMult;

// ✅ НОВОЕ: Применяем бафф урона от кометы (random-events.js)
// ЧТО: Умножает урон на множитель (1.5-3.0), если активен бафф
// ЗАЧЕМ: Кометы дают временное усиление урона
if (window.RandomEvents && typeof window.RandomEvents.getDamageMultiplier === 'function') {
    dmg *= window.RandomEvents.getDamageMultiplier();
}

let isCrit = false;
let critChance = Math.min(1, (window.gameState.critChance || 0.001) * getBonus('getCritChanceMultiplier', 1));
let critMult = (window.gameState.critMultiplier || 2) * getBonus('getCritMultMultiplier', 1);
if (Math.random() < critChance) { dmg = Math.round(dmg * critMult); isCrit = true; }
else dmg = Math.round(dmg);
return { finalDamage: Math.max(0, dmg), isCrit };
    },

 applyHit: function(baseDamage, isAuto = false) {
     if (!window.gameState?.gameActive || window.GAME_CORE?.isGamePaused)
         return { destroyed: false, damage: 0, isCrit: false };
     
     // ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверка перед нанесением урона
     if (window.GAME_CORE && window.GAME_CORE.currentBlockHealth <= 0) {
         console.warn('️ [COMBAT] Block already destroyed, skipping hit');
         return { destroyed: true, damage: 0, isCrit: false };
     }
     
     const r = this.calculateHit(baseDamage, isAuto);
     if (window.GAME_CORE) window.GAME_CORE.currentBlockHealth -= r.finalDamage;
     // planetDamageDealt (прогресс-бар) — не achievements, трогаем напрямую
     window.gameState.planetDamageDealt = (window.gameState.planetDamageDealt || 0) + r.finalDamage;
    
     // ── ЕДИНСТВЕННЫЙ ИСТОЧНИК метрик: achievements.increment ──
    if (window.achievementsSystem) {
        // incrementTotalDamage внутри делает: gs.totalDamageDealt += d (и ачивки)
        window.achievementsSystem.incrementTotalDamage(r.finalDamage);
        // incrementTotalClicks внутри делает: gm.totalClicks += 1 (и ачивки)
        if (!isAuto) window.achievementsSystem.incrementTotalClicks(1);
        
        // ✅ НОВОЕ: Отслеживание серии критов (critStreak)
        if (!window.gameMetrics) window.gameMetrics = {};
        if (r.isCrit) {
            // incrementCrits внутри делает: gm.totalCrits += 1 (и ачивки)
            window.achievementsSystem.incrementCrits(1);
            if (window.achievementsSystem.incrementPlanetCrits) {
                window.achievementsSystem.incrementPlanetCrits(window.gameState.currentLocation, 1);
            }
            
            // Увеличиваем серию критов
            window.gameMetrics.currentCritStreak = (window.gameMetrics.currentCritStreak || 0) + 1;
            if (window.achievementsSystem.updatePlanetCritStreak) {
                window.achievementsSystem.updatePlanetCritStreak(
                    window.gameState.currentLocation,
                    window.gameMetrics.currentCritStreak
                );
            }
        } else {
            // Не крит — сбрасываем серию
            window.gameMetrics.currentCritStreak = 0;
        }
    }
     
     // ✅ ИСПРАВЛЕНИЕ: Надёжная проверка разрушения
     const isDestroyed = (window.GAME_CORE?.currentBlockHealth || 0) <= 0;
     if (isDestroyed && window.GAME_CORE) {
         window.GAME_CORE.currentBlockHealth = 0; // Нормализуем в 0
     }
     
     return {
         destroyed: isDestroyed,
         damage: r.finalDamage,
         isCrit: r.isCrit
     };
 },

    calculateBlockHealth: function() {
        const target = (window.gameState.clickPower || 1) * CFG.balanceConfig.targetClicks;
        const base = CFG.balanceConfig.baseHealth * (1 + CFG.astronomicalUnits[window.gameState.currentLocation] * 2);
        const rnd = CFG.balanceConfig.healthRandomRange.min + Math.random() * (CFG.balanceConfig.healthRandomRange.max - CFG.balanceConfig.healthRandomRange.min);
        let hp = Math.floor(((base + target) / 2) * rnd * (window.GAME_CORE?.getBonus?.('getBlockHealthMultiplier', 1) || 1));
        if (window.GAME_CORE?.permanentBlockHpMult && window.GAME_CORE.permanentBlockHpMult < 1) hp = Math.floor(hp * window.GAME_CORE.permanentBlockHpMult);
        if (!window.gameState?.planetFirstBlockCleared) hp = Math.min(hp, 100);
        return Math.max(1, hp);
    },

    calculateDestroyReward: function(block, isAuto = false) {
        if (!window.gameState) return {};
        const getBonus = window.GAME_CORE?.getBonus || ((t, f) => f);
        const now = Date.now();
        const win = CFG.isMobile ? 1500 : 2000;

        if (!isAuto) {
            window.gameState.comboCount = (now - (window.gameState.lastDestroyTime || 0) < win) ? (window.gameState.comboCount || 0) + 1 : 1;
            window.gameState.lastDestroyTime = now;
        }

        const au = CFG.astronomicalUnits[window.gameState.currentLocation] || 0;
        let reward = Math.floor((25 + au * 100) * CFG.balanceConfig.rewardMultiplier);
        const rng = CFG.balanceConfig.randomBonusRange;
        reward = Math.floor(reward * (rng.min + Math.random() * (rng.max - rng.min)));
        if (window.gameState.boboCoinBonus > 0) reward = Math.floor(reward * (1 + window.gameState.boboCoinBonus));
        reward = Math.floor(reward * getBonus('getRewardMultiplier', 1));
        if (window.GAME_CORE?.permanentRewardMult > 1) reward = Math.floor(reward * window.GAME_CORE.permanentRewardMult);

        let isRare = false;
        for (const k in CFG.rareBlocks) {
            if (block?.classList.contains(CFG.rareBlocks[k].className)) {
                reward = Math.floor(reward * CFG.rareBlocks[k].multiplier); isRare = true; break;
            }
        }

let comboBonus = 0;
if (window.gameState.comboCount > 1) {
    const cm = CFG.balanceConfig.comboMultiplier * getBonus('getComboMultiplier', 1);
    comboBonus = Math.floor(reward * (window.gameState.comboCount * cm));
    reward += comboBonus;
}

// ✅ НОВОЕ: Применяем бафф кристаллов от кометы (random-events.js)
// ЧТО: consumeCrystalBuff() добавляет +50-500% к награде за следующий блок
// ЗАЧЕМ: Одноразовый бонус от кометы «Кристальный дождь»
if (window.RandomEvents && typeof window.RandomEvents.consumeCrystalBuff === 'function') {
    reward = window.RandomEvents.consumeCrystalBuff(reward);
}

return { reward, comboCount: window.gameState.comboCount, comboBonus, isRare };
    },

    applyDestroy: function(block, isAuto = false) {
        if (!window.gameState) return null;
        const res = this.calculateDestroyReward(block, isAuto);

        // ✅ флаг первого блока на планете
        if (!window.gameState.planetFirstBlockCleared) window.gameState.planetFirstBlockCleared = true;

        // coins — НЕ achievements, пишем напрямую
        window.gameState.coins += res.reward;
        window.gameMetrics.blocksDestroyed = (window.gameMetrics.blocksDestroyed || 0) + 1;

        // maxCombo — achievements.updateCombo тоже пишет, но условно.
        // Оставляем только один источник — через achievements, убираем прямой.
        // if (res.comboCount > (window.gameMetrics.maxCombo || 0)) window.gameMetrics.maxCombo = res.comboCount;

         // ── ЕДИНСТВЕННЫЙ ИСТОЧНИК метрик: achievements.increment ──
        if (window.achievementsSystem) {
        const p = window.gameState.currentLocation;
        window.achievementsSystem.incrementCoinsEarned(res.reward);
        window.achievementsSystem.incrementPlanetBlocks(p, 1);
        
        // ✅ НОВОЕ: Если блок уничтожен Bobo (isAuto=true), считаем его кристаллы
        if (isAuto && window.achievementsSystem.incrementPlanetBoboCrystals) {
            window.achievementsSystem.incrementPlanetBoboCrystals(p, res.reward);
        }
        
        if (res.isRare) {
            window.achievementsSystem.incrementRareBlocks(1);
            window.achievementsSystem.incrementPlanetRareBlocks(p, 1);
        }
        if (res.comboCount > (window.gameMetrics.maxCombo || 0)) {
            window.achievementsSystem.updateCombo(res.comboCount);
            window.achievementsSystem.updatePlanetCombo(p, res.comboCount);
        }
    }

        if (window.GAME_CORE) { window.GAME_CORE.currentBlock = null; window.GAME_CORE.currentBlockHealth = 0; }
        return res;
    }
};

console.log('⚔️ CombatSystem v2.1 — дубли убраны, единственный источник метрик — achievements.increment');
})();
