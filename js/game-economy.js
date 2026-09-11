// js/game-economy.js — ЕДИНЫЙ МОДУЛЬ BoC-ЭКОНОМИКИ
// Врата, конвертация 💎→BoC, телепорт, пассивный бонус престижа.
// Используется и игрой, и симулятором (один и тот же код = расхождение невозможно).
(function () {
    'use strict';

    const CFG = {
        // 1 BoC = 1000K = 1 000 000 кристаллов
        convertRate: 1_000_000,
        // Сохраняется для отображения/баланса.
        reserve: 500_000,
        cashbackRate: 0.05, // 5% от всех потраченных кристаллов
     gates: {   // ✅ v3: = ~3 круга BoC-дохода предыдущей планеты
         venus: 20, earth: 30, mars: 45, jupiter: 75, saturn: 250,
         uranus: 700, neptune: 1100, pluto: 2000,
         heliopause: 7500
     },
        // ❌ heliopauseEarned удалён: престиж = 10 ранов × 10% прогресса
        heliopauseSegmentPct: 10,
        bonusPerBoc: 0.01,               // ⚠️ legacy — не используется в расчётах (см. prestigeBonus)
        // 🎯 НАСЫЩЕНИЕ ПРЕСТИЖА (v10.13):
        //   mult(boc) = 1 + (maxMult−1) × boc/(boc + halfAt)
        //   boc = halfAt → (1+maxMult)/2;  boc → ∞ → maxMult (потолок)
        prestigeBonus: { maxMult: 20, halfAt: 1500 },

        cashbackRateTaxed: 0.10,               // ✅ 10% только при bocEarned>0
        perPlanet: {                           // ✅ награды локаций ↑
            mercury: 2, venus: 3, earth: 4, mars: 6, jupiter: 10,
            saturn: 14, uranus: 18, neptune: 24, pluto: 50
        },
        teleport: {
            min: 1.5,
            max: 5.0,
            step: 0.25
        }
    };

    function getState() {
        return window.gameState;
    }

    function gateFor(planet) {
        return CFG.gates[planet] || 0;
    }

    // ✅ ВРАТА v2:
    //  • Ранние врата (Венера…Сатурн) ×2 за каждый новый ран;
    //  • Поздние (Уран/Нептун/Плутон) — НЕ меняются.
    const EARLY_GATES = ['venus', 'earth', 'mars', 'jupiter', 'saturn'];
    // ✅ Гелиопауза: фикс 7500, но ВСЕГДА выше Плутона (+1250 запаса)
    const HELIO_MIN = 7500;
    const HELIO_MARGIN = 1250;
    function gateForRun(planet, run) {
        const r = Math.max(1, Math.floor(Number(run) || 1));
        const scale = Math.min(6, 1 + 0.5 * (r - 1)); // ран4 ×2.5, ран10 ×5.5
        if (planet === 'heliopause') {
            const plutoRun = Math.floor((CFG.gates.pluto || 0) * scale);
            return Math.max(HELIO_MIN, plutoRun + HELIO_MARGIN);
        }
        return Math.floor((CFG.gates[planet] || 0) * scale);
    }

    // 💱 КУПОН: обязательная трата BoC (скидка ≤70% на случайный апгрейд)
    const COUPON = {
        costBoC: 100, 
        minDiscount: 0.10, 
        maxDiscount: 0.70,
        baseCooldownMs: 5 * 60 * 1000, 
        cooldownStepMs: 5 * 60 * 1000,
        windowResetMs: 72 * 3600 * 1000
    };

    function couponState(state) {
        state.coupon = state.coupon || { count: 0, firstTs: 0, lastTs: 0 };
        const c = state.coupon; 
        const now = Date.now();
        if (c.firstTs && now - c.firstTs > COUPON.windowResetMs) { 
            c.count = 0; 
            c.firstTs = now; 
        }
        return c;
    }

    function couponCooldownRemaining(state) {
        const c = couponState(state);
        if (!c.count) return 0;
        const cd = COUPON.baseCooldownMs + (c.count - 1) * COUPON.cooldownStepMs;
        return Math.max(0, cd - (Date.now() - c.lastTs));
    }

    function buyCoupon(state, types) {
        if ((state.bocLiquid || 0) < COUPON.costBoC) return { success: false, reason: 'boc' };
        if (couponCooldownRemaining(state) > 0) return { success: false, reason: 'cooldown' };
        
        const c = couponState(state);
        state.bocLiquid = Number((state.bocLiquid - COUPON.costBoC).toFixed(12));
        c.count++; 
        if (!c.firstTs) c.firstTs = Date.now(); 
        c.lastTs = Date.now();
        
        // Если типы не переданы, используем стандартный пул апгрейдов
        const defaultTypes = ['clickPower', 'critChance', 'critMultiplier', 'helperDamage'];
        const selectedTypes = types || defaultTypes;
        
        const type = selectedTypes[Math.floor(Math.random() * selectedTypes.length)];
        const percent = COUPON.minDiscount + Math.random() * (COUPON.maxDiscount - COUPON.minDiscount);
        
        state.couponDiscount = { type, percent, used: false };
        return { success: true, type, percent };
    }

     function prestigeMult(bocEarned) {
        const boc = Math.max(0, Number(bocEarned) || 0);
        const pb = CFG.prestigeBonus || { maxMult: 20, halfAt: 1500 };
        const maxMult = Math.max(1.01, Number(pb.maxMult) || 20);
        const halfAt  = Math.max(1, Number(pb.halfAt) || 1500);
        return Math.min(maxMult, 1 + (maxMult - 1) * boc / (boc + halfAt));
    }

    function bocBonus() {
        return prestigeMult(getState()?.bocEarned || 0);
    }

    /**
     * Начисляет кэшбек от потраченных кристаллов.
     */
    function awardSpend(spentCrystals) {
        const state = getState();
        const spent = Number(spentCrystals);
        
        if (!state || !Number.isFinite(spent) || spent <= 0) {
            return { spent: 0, cashbackCrystals: 0, cashbackBoC: 0 };
        }

        // 1. Базовая ставка (учитываем престиж/bocEarned)
        let baseRate = ((state.bocEarned || 0) > 0) ? (CFG.cashbackRateTaxed || 0.10) : CFG.cashbackRate;

        // 2. ✅ Кристаллизация: ×4 кэшбек, пока активен любой бонус магазина
        const boostOn = Object.values(state.shopItems || {})
            .some(it => it?.active && (it.timeLeft || 0) > 0)
            || Object.values(state.simShop?.active || {}).some(v => v > 0);
        
        if (boostOn) {
            baseRate *= 4; 
        }

        // 3. 🏭 КПД Кузницы: зеркало формулы симулятора (затухание от потраченного в ране)
        const spentRun = state._spentRun || 0;
        const scale = Math.max(0.15, Math.pow(1e8 / Math.max(1e8, spentRun), 0.25));
        
        // 4. Финальный расчет ставки
        let rate = baseRate * scale * (state.teleportMult || 1) * Math.pow(0.6, state._farmRunsOnPlanet || 0);
        
        // 5. Ограничение ставки (floor 0.75%, cap 10%)
        rate = Math.min(0.10, Math.max(0.0075, rate));

        // 6. Расчет кэшбека
        const cashbackCrystals = spent * rate;
        const cashbackBoC = cashbackCrystals / CFG.convertRate;
        const roundedBoC = Number(cashbackBoC.toFixed(12));

        // Обновляем состояние
        state._spentRun = spentRun + spent;
        state.bocLiquid = Number(((state.bocLiquid || 0) + roundedBoC).toFixed(12));
        state.cashbackSpentCrystals = (state.cashbackSpentCrystals || 0) + spent;
        state.cashbackBoCEarned = Number(((state.cashbackBoCEarned || 0) + roundedBoC).toFixed(12));

        console.log(`💸 [CASHBACK] ${spent.toLocaleString('ru-RU')} 💎 → +${roundedBoC} BoC (rate: ${(rate * 100).toFixed(2)}%)`);

        if (window.GAME_UI?.updateHUD) {
            window.GAME_UI.updateHUD();
        }

        return { spent, cashbackCrystals, cashbackBoC: roundedBoC };
    }

    /**
     * Единая точка списания кристаллов.
     */
    function spendCrystals(amount) {
        const state = getState();
        const value = Math.floor(Number(amount) || 0);

        if (!state || value <= 0 || (state.coins || 0) < value) {
            return false;
        }

        state.coins -= value;
        awardSpend(value);
        return true;
    }

    /**
     * Оплата врат.
     */
/** Доступно для врат: обычные — только рановый кошелёк; Гелиопауза — рановый + резерв. */
function availableForGate(state, heliopause) {
    const liquid = Number(state?.bocLiquid) || 0;
    const reserve = Number(state?.bocReserve) || 0;
    return heliopause ? liquid + reserve : liquid;
}
/**
 * Оплата врат.
 * Обычные врата — ТОЛЬКО bocLiquid (BoC текущего рана).
 * Врата Гелиопаузы — стак: сначала bocLiquid, затем добиваем из bocReserve.
 */
function payGate(gateBoC, opts) {
    const state = getState();
    if (!state) return { success: false, spent: 0 };
    gateBoC = Math.max(0, Math.floor(gateBoC || 0));
    if (gateBoC === 0) return { success: true, spent: 0 };
    state.bocLiquid = Number(state.bocLiquid) || 0;
    state.bocReserve = Number(state.bocReserve) || 0;
    const useReserve = !!(opts && opts.heliopause);
    if (availableForGate(state, useReserve) < gateBoC) return { success: false, spent: 0 };
    let need = gateBoC;
    const fromLiquid = Math.min(state.bocLiquid, need);
    state.bocLiquid -= fromLiquid; need -= fromLiquid;
    let fromReserve = 0;
    if (need > 0) { fromReserve = Math.min(state.bocReserve, need); state.bocReserve -= fromReserve; need -= fromReserve; }
    state.bocSpentOnGates = (state.bocSpentOnGates || 0) + gateBoC;
    console.log(`🚪 [BOC] Врата: ${gateBoC} BoC (ран ${fromLiquid} + резерв ${fromReserve})`);
    return { success: true, spent: gateBoC, fromLiquid, fromReserve };
}
/** Конец рана: остаток ранового кошелька → переходящий резерв; рановый обнуляется. */
function rollOverRun() {
    const state = getState();
    if (!state) return { reserve: 0, carried: 0 };
    const carried = Number(state.bocLiquid) || 0;
    state.bocReserve = (Number(state.bocReserve) || 0) + carried;
    state.bocLiquid = 0;
    console.log(`🏦 [BOC] Конец рана: ${carried} BoC → резерв (всего ${state.bocReserve})`);
    if (window.GAME_UI?.updateHUD) window.GAME_UI.updateHUD();
    return { reserve: state.bocReserve, carried };
}

    /**
     * 💱 Конвертация «хвоста» кристаллов в BoC
     */
    function convertTail() {
        const state = getState();
        if (!state) return { converted: 0, bocLiquid: 0 };
        
        const whole = Math.floor((state.coins || 0) / CFG.convertRate);
        if (whole <= 0) return { converted: 0, bocLiquid: Number(state.bocLiquid || 0) };
        
        state.coins -= whole * CFG.convertRate;
        state.bocLiquid = Number(((state.bocLiquid || 0) + whole).toFixed(12));
        
        console.log(`💱 [BOC] Хвост конвертирован: +${whole} BoC`);
        if (window.GAME_UI?.updateHUD) window.GAME_UI.updateHUD();
        
        return { converted: whole, bocLiquid: Number(state.bocLiquid) };
    }

    function rollTeleportMult() {
        const t = CFG.teleport;
        const steps = Math.round((t.max - t.min) / t.step);
        return Number((t.min + Math.floor(Math.random() * (steps + 1)) * t.step).toFixed(2));
    }

    // ЭКСПОРТ API (Дубли удалены)
    window.GameEconomy = {
        CFG,
        gateFor,
        gateForRun,
        bocBonus,
        prestigeMult,          // ✅ чистая функция — единый источник для игры и симулятора

        COUPON, 
        couponCooldownRemaining, 
        buyCoupon,
        awardSpend,
        spendCrystals,
        payGate,
availableForGate,
rollOverRun,
convertTail,
        rollTeleportMult
    };

    console.log('🪙 GameEconomy v3 loaded: 1 BoC = 1 000 000 💎, cashback = 10% от всех расходов');
})();