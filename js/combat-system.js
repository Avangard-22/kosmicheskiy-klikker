// js/combat-system.js — ЕДИНСТВЕННЫЙ модуль боевой математики (v2.2 — без дублей)
// ИСТОЧНИКИ НАГРАДЫ: только здесь.
//   · урон/криты/HP          → calculateHit / calculateBlockHealth
//   · награда за блок        → calculateDestroyReward (чистый oracle, без побочных эффектов)
//   · монеты + метрики + кометные баффы → applyDestroy (ровно один раз)
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

        // ✅ Бафф урона от кометы (random-events.js): ×1.5–3.0, пока активен
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

        // ✅ Проверка перед нанесением урона
        if (window.GAME_CORE && window.GAME_CORE.currentBlockHealth <= 0) {
            console.warn('⚠️ [COMBAT] Block already destroyed, skipping hit');
            return { destroyed: true, damage: 0, isCrit: false };
        }

        const r = this.calculateHit(baseDamage, isAuto);
        if (window.GAME_CORE) window.GAME_CORE.currentBlockHealth -= r.finalDamage;
        // 🎮 Трекинг стиля для Слоя B
        window.gameState._styleTotalDmg = (window.gameState._styleTotalDmg || 0) + r.finalDamage;
        if (isAuto) window.gameState._styleBoboDmg = (window.gameState._styleBoboDmg || 0) + r.finalDamage;
        if (r.isCrit) window.gameState._styleCrits = (window.gameState._styleCrits || 0) + 1;
        // planetDamageDealt (прогресс-бар) — не achievements, трогаем напрямую
        window.gameState.planetDamageDealt = (window.gameState.planetDamageDealt || 0) + r.finalDamage;
        // ── ЕДИНСТВЕННЫЙ ИСТОЧНИК метрик: achievements.increment ──
        if (window.achievementsSystem) {
            window.achievementsSystem.incrementTotalDamage(r.finalDamage);
            if (!isAuto) window.achievementsSystem.incrementTotalClicks(1);
            if (r.isCrit) {
                window.achievementsSystem.incrementCrits(1);
                if (window.achievementsSystem.incrementPlanetCrits) {
                    window.achievementsSystem.incrementPlanetCrits(window.gameState.currentLocation, 1);
                }
            }
        }

        // ✅ Надёжная проверка разрушения
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

        // 3. Вклад Bobo — только пока активен, реальная формула его урона
        let boboDps = 0;
        if (gs.helperActive) {
            const boboDmgPerHit = clickPower
                * (1 + (gs.helperDamageBonus || 0))
                * (1 + (gs.helperUpgradeLevel || 0) * 0.2);
            // 🆕 v11: Ускоритель (helperSpeedLevel) — детерминированно в формуле HP.
            // Базовый интервал читаем из GAME_CORE.helperIntervalBase(), а не из
            // временного поля (оно может быть изменено событием скорости Bobo).
            const interval = (window.GAME_CORE && typeof window.GAME_CORE.helperIntervalBase === 'function')
                ? window.GAME_CORE.helperIntervalBase() / 1000
                : ((gs.permanentHelperInterval || 1500) / 1000); // сек
            boboDps = boboDmgPerHit / interval;
        }

        const clicksPerSec = cfg.playerClicksPerSec ?? 5;
        const boboWeight = cfg.boboWeight ?? 0.55;
        const boboPerClick = (boboDps / clicksPerSec) * boboWeight;

        return clickPower * critFactor + boboPerClick;
    },

    // 🎮 СЛОЙ B: адаптация под стиль (0.9–1.25, зеркало симулятора)
    _styleMultiplier: function() {
        const gs = window.gameState;
        const total = Math.max(1, gs._styleTotalDmg || 0);
        const boboShare = (gs._styleBoboDmg || 0) / total;
        const planet = gs.currentLocation || 'mercury';
        const blocks = Math.max(1, window.gameMetrics?.planetStats?.[planet]?.blocks || 0);
        const critShare = (gs._styleCrits || 0) / blocks;
        let m = 1;
        m += 0.15 * Math.max(0, Math.min(1, (boboShare - 0.4) / 0.4));
        m += 0.10 * Math.max(0, Math.min(1, (critShare - 0.15) / 0.2));
        return Math.max(0.9, Math.min(1.25, m));
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

        // ── СЛОЙ A: профиль локации вместо общего ±20% ──
        const profile = (cfg.hpProfiles || {})[window.gameState.currentLocation] || {};
        const randMin = profile.randMin ?? cfg.healthRandomRange.min;
        const randMax = profile.randMax ?? cfg.healthRandomRange.max;
        hp = Math.floor(hp * (randMin + Math.random() * (randMax - randMin)));
        const n = window.gameMetrics?.planetStats?.[window.gameState.currentLocation]?.blocks || 0;
        window.gameState._ringBlock = false;
        if (profile.pattern === 'spike' && n > 0 && n % (profile.patternEvery || 17) === 0) hp = Math.floor(hp * (profile.patternMult || 2));
        if (profile.pattern === 'alt') hp = Math.floor(hp * (n % 2 === 0 ? (profile.altLight || 0.6) : (profile.altHeavy || 1.5)));
        if (profile.pattern === 'ring' && n > 0 && n % (profile.patternEvery || 10) === 0) { hp = Math.floor(hp * (profile.patternMult || 3)); window.gameState._ringBlock = true; }

        // ✅ Страховочный потолок (не даёт HP улететь даже с прокачанным Bobo)
        const maxMult = hpCfg.maxTotalMult ?? 6;
        const cap = Math.floor((window.gameState.clickPower || 1) * maxMult * ((cfg.targetClicks || 70) + 20));
        hp = Math.min(hp, Math.max(cap, 200));

        // Рампа: профильная (Плутон/Гелиопауза без дневного сброса) или дневная
        if (profile.rampNoDailyReset) {
            const steps = Math.min(Math.floor(n / (profile.rampStep || 100)), Number(profile.rampMaxSteps ?? 30));
            if (steps > 0) hp = Math.floor(hp * (1 + steps * (Number(profile.rampPerStep ?? 5) / 100)));
        } else {
            const ramp = cfg.dailyRamp;
            if (ramp && ramp.enabled) {
                const blocksToday = window.gameState.dailyBlocksDestroyed || 0;
                const steps = Math.min(Math.floor(blocksToday / (ramp.blocksPerStep || 100)), ramp.maxSteps || 30);
                if (steps > 0) hp = Math.floor(hp * (1 + steps * ((ramp.hpPercentPerStep || 5) / 100)));
            }
        }
        hp = Math.floor(hp * this._styleMultiplier()); // СЛОЙ B
        return Math.max(1, hp);
    },

    // ═══════════════════════════════════════════════════
    // 💰 ЧИСТЫЙ РАСЧЁТ НАГРАДЫ (БЕЗ ПОБОЧНЫХ ЭФФЕКТОВ)
    // ⚠️ Вызывается и симулятором как oracle награды:
    //    liveReward → calculateDestroyReward(null, true)
    //    Поэтому здесь НЕЛЬЗЯ тратить кометные баффы — иначе сим
    //    сжигает реальные заряды игрока (см. applyDestroy).
    // ═══════════════════════════════════════════════════
    calculateDestroyReward: function(block, isAuto = false) {
        if (!window.gameState) return {};
        const getBonus = window.GAME_CORE?.getBonus || ((t, f) => f);
        const now = Date.now();
        // 🆕 v11: Резонанс — комбо-окно расширяется (+500 мс за уровень, кап 8 → +4с)
        const resonanceLvl = Number(window.gameState?.resonanceLevel) || 0;
        const win = (CFG.isMobile ? 1500 : 2000) + resonanceLvl * 500;

        if (!isAuto) {
            window.gameState.comboCount = (now - (window.gameState.lastDestroyTime || 0) < win) ? (window.gameState.comboCount || 0) + 1 : 1;
            window.gameState.lastDestroyTime = now;
        }

        // ✅ Логарифмическая прогрессия наград (Меркурий ×1.26 → Плутон ×3.96)
        const au = CFG.astronomicalUnits[window.gameState.currentLocation] || 0;
        const auMult = 1 + Math.log(1 + au) * 0.8;  // Плавный логарифмический рост
        const baseReward = 150;
        let reward = Math.floor(baseReward * auMult * CFG.balanceConfig.rewardMultiplier);
        const rng = CFG.balanceConfig.randomBonusRange;
        reward = Math.floor(reward * (rng.min + Math.random() * (rng.max - rng.min)));
        if (window.gameState.boboCoinBonus > 0) reward = Math.floor(reward * (1 + window.gameState.boboCoinBonus));
        // 🔧 Тех-бонус (зеркало симулятора): доход растёт с прокачкой
        const chT = Math.min(CFG.balanceConfig.critChanceCap || 1, window.gameState.critChance || 0.001);
        const cmT = Math.min(CFG.balanceConfig.critMultiplierCap || 10, window.gameState.critMultiplier || 2);
        const techMult = Math.min(3, 1 + 0.01 * (window.gameState.clickUpgradeLevel || 0) + (1 + chT * (cmT - 1) - 1));
        reward = Math.floor(reward * techMult);
        // «Кольца» Сатурна: риск ×3 = награда ×3
        if (window.gameState._ringBlock) { reward = Math.floor(reward * 3); window.gameState._ringBlock = false; }
        reward = Math.floor(reward * getBonus('getRewardMultiplier', 1));
        if (window.GAME_CORE?.permanentRewardMult > 1) reward = Math.floor(reward * window.GAME_CORE.permanentRewardMult);

        // ✅ Буст 30 дней (daily-bonus.js) — +500% к кристаллам, пока активен
        if (window.dailyBonusSystem?.isBoostActive()) {
            reward = Math.floor(reward * 6); // +500% = ×6
        }
        // ✅ BoC: Множитель Телепорта ×1.5–5.0 — ставим ДО редких блоков и комбо,
        //    чтобы множитель масштабировал весь доход планеты
        if ((window.gameState.teleportMult || 1) > 1) {
            reward = Math.floor(reward * window.gameState.teleportMult);
        }

        let isRare = false;
        for (const k in CFG.rareBlocks) {
            if (block?.classList.contains(CFG.rareBlocks[k].className)) {
                // 🆕 v11: Звёздный компас — +25% к награде редких за уровень
                const compassLvl = Number(window.gameState?.compassLevel) || 0;
                reward = Math.floor(reward * CFG.rareBlocks[k].multiplier * (1 + 0.25 * compassLvl));
                isRare = true;
                break;
            }
        }

        let comboBonus = 0;
        if (window.gameState.comboCount > 1) {
            const cm = CFG.balanceConfig.comboMultiplier * getBonus('getComboMultiplier', 1);
            comboBonus = Math.floor(reward * (window.gameState.comboCount * cm));
            reward += comboBonus;
        }

        // ⚠️ Кометные баффы (дождь / шторм) ЗДЕСЬ НЕ ПРИМЕНЯЮТСЯ — они в applyDestroy().
        //    Здесь же они ещё и жгли заряды при вызове из simulator.js (liveReward).

        return { reward, comboCount: window.gameState.comboCount, comboBonus, isRare };
    },

    // ═══════════════════════════════════════════════════
    // ⚙️ ПРИМЕНЕНИЕ: монеты + метрики + кометные баффы — ЕДИНСТВЕННОЕ место
    //    Порядок множителей: base → combo → rare → Hardcore ×→ дождь → шторм → начисление
    // ═══════════════════════════════════════════════════
    applyDestroy: function(block, isAuto = false) {
        if (!window.gameState) return null;
        const gs = window.gameState;
        const res = this.calculateDestroyReward(block, isAuto);
        if (!res) return null;

        // ✅ флаг первого блока на планете
        if (!gs.planetFirstBlockCleared) gs.planetFirstBlockCleared = true;

        // ── Кометные баффы: ровно один вызов каждого, ДО начисления ──
        //    Висят ПОСЛЕ обёртки Hardcore (this.calculateDestroyReward уже умножен цепочкой),
        //    поэтому награда и метрики совпадают, а заряд списывается один раз.
        if ((res.reward || 0) > 0 && window.RandomEvents) {
            if (typeof window.RandomEvents.consumeCrystalBuff === 'function') {
                res.reward = window.RandomEvents.consumeCrystalBuff(res.reward);            // «Кристальный дождь» (1 блок)
            }
            if (typeof window.RandomEvents.consumeCrystalBlocksBuff === 'function') {
                res.reward = window.RandomEvents.consumeCrystalBlocksBuff(res.reward);      // «Кристальный шторм» (N блоков)
            }
        }
        res.reward = res.reward || 0;

        // ✅ ЕДИНСТВЕННОЕ начисление монет (game-core больше НЕ начисляет)
        gs.coins = (gs.coins || 0) + res.reward;

        if (!window.gameMetrics) window.gameMetrics = {};
        window.gameMetrics.blocksDestroyed = (window.gameMetrics.blocksDestroyed || 0) + 1;

        // maxCombo — единственный источник: achievements.updateCombo (ниже)
        // ── ЕДИНСТВЕННЫЙ ИСТОЧНИК метрик: achievements.increment ──
        if (window.achievementsSystem) {
            const p = gs.currentLocation;
            // incrementCoinsEarned внутри делает: gm.totalCoinsEarned += reward (и ачивки)
            window.achievementsSystem.incrementCoinsEarned(res.reward);
            // ✅ Планетарная метрика «Заработано кристаллов» (вкл. кометные баффы — они уже в res.reward)
            if (window.achievementsSystem.incrementPlanetCrystals) {
                window.achievementsSystem.incrementPlanetCrystals(p, res.reward);
            }
            // ✅ Если блок добил Bobo (isAuto) — отдельная метрика «кристаллы Bobo»
            if (isAuto && window.achievementsSystem.incrementPlanetBoboCrystals) {
                window.achievementsSystem.incrementPlanetBoboCrystals(p, res.reward);
            }
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

console.log('⚔️ CombatSystem v2.2 — единый источник награды: coins+метрики+кометные баффы в applyDestroy, oracle без побочек');
})();
