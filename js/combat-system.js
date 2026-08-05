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
let critChance = Math.min(CFG.balanceConfig.critChanceCap || 1, (window.gameState.critChance || 0.001) * getBonus('getCritChanceMultiplier', 1));
let critMult = Math.min(CFG.balanceConfig.critMultiplierCap || 999, (window.gameState.critMultiplier || 2) * getBonus('getCritMultMultiplier', 1));
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
         if (r.isCrit) {
             // incrementCrits внутри делает: gm.totalCrits += 1 (и ачивки)
             window.achievementsSystem.incrementCrits(1);
             if (window.achievementsSystem.incrementPlanetCrits) {
                 window.achievementsSystem.incrementPlanetCrits(window.gameState.currentLocation, 1);
             }
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

    // ═══════════════════════════════════════════════════
    // ❤️ HP БЛОКА — считается от УРОНА ИГРОКА
    // Участвует ТОЛЬКО прокачка из HUD (клики, криты, Bobo).
    // Бонусы магазина НЕ участвуют — они помогают ломать, а не раздувать HP.
    // ═══════════════════════════════════════════════════
    _expectedDamagePerClick: function() {
        if (!window.gameState) return 1;
        const gs = window.gameState;
        const cfg = CFG.balanceConfig.hpFromPlayer || {};

        // 1. Сила удара — та же ступенчатая прогрессия, что в HUD
        let clickPower = gs.clickPower || 1;
        if (typeof window.GAME_CORE?.calculateClickPower === 'function') {
            clickPower = window.GAME_CORE.calculateClickPower();
        }

        // 2. Средний урон с критами: base × (1 + шанс × (множитель − 1))
        const critChance = Math.min(cfg.maxCritChance ?? 0.50, gs.critChance || 0.001);
        const critMult = Math.min(cfg.maxCritMult ?? 10, gs.critMultiplier || 2);
        const critFactor = 1 + critChance * (critMult - 1);

        // 3. Вклад Bobo — только пока активен, реальная формула его урона,
        //    а НЕ экспонента (Math.pow(1.5, lvl) ломала HP)
        let boboDps = 0;
        if (gs.helperActive) {
            const boboDmgPerHit = clickPower
                * (1 + (gs.helperDamageBonus || 0))
                * (1 + (gs.helperUpgradeLevel || 0) * 0.2);
            const interval = ((gs.permanentHelperInterval || 1500) / 1000); // сек
            boboDps = boboDmgPerHit / interval;
        }

        const clicksPerSec = cfg.playerClicksPerSec ?? 5;
        const boboWeight = cfg.boboWeight ?? 0.55;
        const boboPerClick = (boboDps / clicksPerSec) * boboWeight;

        return clickPower * critFactor + boboPerClick;
    },

    calculateBlockHealth: function() {
        if (!window.gameState) return 80;

        // Первый блок планеты — всегда лёгкий (80–110)
        if (!window.gameState.planetFirstBlockCleared) {
            return 80 + Math.floor(Math.random() * 31);
        }

        const cfg = CFG.balanceConfig;
        const hpCfg = cfg.hpFromPlayer || {};
        const au = CFG.astronomicalUnits[window.gameState.currentLocation] || 0;
        const auMult = 1 + Math.log(1 + au) * 0.1; // Меркурий ×1.03 → Плутон ×1.37

        // Целевые клики: 70–90 (случайный диапазон, чтобы не было «ровно 70»)
        const targetClicks = (cfg.targetClicks || 70) + Math.floor(Math.random() * 21);

        // HP = ожидаемый урон за клик × целевые клики × AU
        const expected = this._expectedDamagePerClick();
        let hp = Math.floor(expected * targetClicks * auMult);

        // Случайный разброс ±20%
        const rnd = cfg.healthRandomRange.min +
            Math.random() * (cfg.healthRandomRange.max - cfg.healthRandomRange.min);
        hp = Math.floor(hp * rnd);

        // ✅ Страховочный потолок (не даёт HP улететь даже с прокачанным Bobo)
        const maxMult = hpCfg.maxTotalMult ?? 6;
        const cap = Math.floor((window.gameState.clickPower || 1) * maxMult * ((cfg.targetClicks || 70) + 20));
        hp = Math.min(hp, Math.max(cap, 200));

        // Дневная HP-рампа (анти-фарм) — оставляем как есть
        const ramp = cfg.dailyRamp;
        if (ramp && ramp.enabled) {
            const blocksToday = window.gameState.dailyBlocksDestroyed || 0;
            const steps = Math.min(Math.floor(blocksToday / (ramp.blocksPerStep || 100)), ramp.maxSteps || 30);
            if (steps > 0) hp = Math.floor(hp * (1 + steps * ((ramp.hpPercentPerStep || 5) / 100)));
        }

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

        // ✅ НОВАЯ ФОРМУЛА: Логарифмическая прогрессия наград
        // ЧТО: Плавный рост вместо линейного скачка на Юпитере
        // ЗАЧЕМ: Предотвращает спидран, даёт положительный баланс на всех планетах
        // РЕЗУЛЬТАТ: Меркурий x1.26 → Плутон x3.96 (максимум +41% на Юпитере, далее 6-18%)
        const au = CFG.astronomicalUnits[window.gameState.currentLocation] || 0;
        const auMult = 1 + Math.log(1 + au) * 0.8;  // Плавный логарифмический рост
        const baseReward = 150;  // Базовая награда
        let reward = Math.floor(baseReward * auMult * CFG.balanceConfig.rewardMultiplier);
        const rng = CFG.balanceConfig.randomBonusRange;
        reward = Math.floor(reward * (rng.min + Math.random() * (rng.max - rng.min)));
        if (window.gameState.boboCoinBonus > 0) reward = Math.floor(reward * (1 + window.gameState.boboCoinBonus));
        reward = Math.floor(reward * getBonus('getRewardMultiplier', 1));
        if (window.GAME_CORE?.permanentRewardMult > 1) reward = Math.floor(reward * window.GAME_CORE.permanentRewardMult);

        // ✅ НОВОЕ: Буст 30 дней (daily-bonus.js) — +500% к кристаллам, пока активен
        if (window.dailyBonusSystem?.isBoostActive()) {
            reward = Math.floor(reward * 6); // +500% = ×6
        }

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
// ✅ НОВОЕ: Применяем бафф кристаллов от кометы (random-events.js)
let crystalBuffBonus = 0;
if (window.RandomEvents && typeof window.RandomEvents.consumeCrystalBuff === 'function') {
    const rewardBefore = reward;
    reward = window.RandomEvents.consumeCrystalBuff(reward);
    crystalBuffBonus = reward - rewardBefore; // Сколько добавил бафф
}

// ✅ НОВОЕ: Если был кристальный бафф — учитываем бонус в метриках
if (crystalBuffBonus > 0 && window.achievementsSystem) {
    const planet = window.gameState.currentLocation;
    // Глобальная метрика
    if (window.achievementsSystem.incrementCoinsEarned) {
        window.achievementsSystem.incrementCoinsEarned(crystalBuffBonus);
    }
    // Планетарная метрика "Заработано кристаллов"
    if (planet && window.achievementsSystem.incrementPlanetCrystals) {
        window.achievementsSystem.incrementPlanetCrystals(planet, crystalBuffBonus);
    }
    console.log(`💫 [COMBAT] Crystal buff bonus: +${crystalBuffBonus} 💎 (tracked in metrics)`);
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
            // incrementCoinsEarned внутри делает: gm.totalCoinsEarned += reward (и ачивки)
            window.achievementsSystem.incrementCoinsEarned(res.reward);
            window.achievementsSystem.incrementPlanetBlocks(p, 1);
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
