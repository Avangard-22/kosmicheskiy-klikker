// js/onboarding-hooks.js — 🔌 АВТО-подключение онбординга (v2.1)
// 🆕 v2.1: ОДНА обёртка на владельца на тип (алиасы destroyBlock/onBlockDestroyed/…
//          больше не дают ×4–5 на один блок) + дедупликация 120мс для block.
//          Флаг COUNT_AUTO_KILLS: true = считаем и Bobo/авто-кликер, false = только ручные.
(function () {
'use strict';
const VER = '2.1';
const COUNT_AUTO_KILLS = true; // 🆕 поставь false, если шаг 5 должен считать ТОЛЬКО ручные клики
const notFalse = r => r !== false;

let lastUpgradeReportTs = 0, lastBoboReportTs = 0, lastBlockReportTs = 0;
let lastUpgradeWrapTs = 0, lastBoostReportTs = 0;

// ═══════════ активен ли помощник (для режима COUNT_AUTO_KILLS=false) ═══════════
function helperActive() {
  try {
    if (window.shopSystem?.hasAutoClick?.()) return true;
    const gs = window.gameState; if (!gs) return false;
    const now = Date.now();
    if (gs.bobo?.until && now < gs.bobo.until) return true;
    if (gs.boboUntil && now < gs.boboUntil) return true;
    if (gs.helper?.until && now < gs.helper.until) return true;
    if (gs.helperUntil && now < gs.helperUntil) return true;
    if (gs.bobo?.active === true || gs.helperActive === true) return true;
  } catch (e) {}
  return false;
}

// ═══════════ ОБЁРТКИ: одна на владельца на тип ═══════════
function wrap(owner, names, type, ok) {
  if (!owner) return false;
  const key = '__obwired_' + type;
  if (owner[key]) return true;              // 🆕 уже обёрнуто — алиасы не трогаем
  for (const n of names) {
    const fn = owner[n];
    if (typeof fn === 'function' && !fn.__ob) {
      fn.__ob = true;
      owner[key] = true;
      owner[n] = function (...args) {
        const r = fn.apply(this, args);
        try { if (!ok || ok(r, args)) window.Onboarding?.report(type); } catch (e) {}
        return r;
      };
      console.log('🔌 [HOOKS]', n, '→', type);
      return true;
    }
  }
  return false;
}

function upgradeOk(r, args) {
  const t = String((args && args[0]) || '').toLowerCase();
  const now = Date.now();
  if (/helper|bobo|бомб|авто-пом|auto-?help/.test(t)) {
    if (now - lastBoboReportTs > 400) {
      lastBoboReportTs = now;
      console.log('🔌 [COUNT] bobo +1 (активация помощника)');
      window.Onboarding?.report('bobo');
    }
    return false;
  }
  if (now - lastUpgradeReportTs < 400) return false; // вложенные обёртки (панель → ядро)
  lastUpgradeReportTs = now;
  lastUpgradeWrapTs = now;
  console.log('🔌 [COUNT] upgrade +1 (покупка)');
  return r !== false;
}

// 🆕 v2.1: один блок = один счёт (алиас-всплеск схлопывается дедупликацией)
function blockOk() {
  const now = Date.now();
  if (now - lastBlockReportTs < 120) return false;
  if (!COUNT_AUTO_KILLS && helperActive()) return false;
  lastBlockReportTs = now;
  console.log('🔌 [COUNT] block +1');
  return true;
}

function boboOk() {
  const now = Date.now();
  if (now - lastBoboReportTs > 400) {
    lastBoboReportTs = now;
    console.log('🔌 [COUNT] bobo +1');
    return true;
  }
  return false;
}

function wire() {
  const G = window.GAME_CORE || window.gameCore;
  const U = window.UpgradesPanel || window.upgradesPanel || window.upgradeSystem || window.upgrades;
  const F = window.GAME_FEATURES || window.gameFeatures;
  const D = window.dailySystem || window.dailyBonusSystem || window.DailyBonus || window.DailySystem || window.dailyBonus;
  const SH = window.shopSystem || window.ShopSystem;

  wrap(G, ['destroyBlock', 'onBlockDestroyed', 'blockDestroyed', 'killBlock'], 'block', blockOk);
  wrap(U, ['buy', 'buyUpgrade', 'purchase', 'purchaseUpgrade', 'upgrade', 'buyLevel'], 'upgrade', upgradeOk);
  wrap(F, ['buyUpgrade', 'purchaseUpgrade', 'upgrade', 'buy'], 'upgrade', upgradeOk);
  wrap(D, ['claim', 'claimDaily', 'claimBonus', 'claimDailyBonus', 'collect', 'getDaily', 'activate', 'activateBonus'], 'daily', notFalse);
  wrap(G, ['activateBobo', 'startBobo', 'useBobo'], 'bobo', boboOk);
  wrap(U, ['activateBobo', 'startBobo'], 'bobo', boboOk);
  wrap(SH, ['openShop'], 'shoplook', notFalse);   // 🆕 шаг «загляни в магазин»
}

// ═══════════ ШПИОН EventBus ═══════════
function spyEventBus() {
  const EB = window.EventBus;
  if (!EB || typeof EB.emit !== 'function' || EB.emit.__spy) return;
  const orig = EB.emit.bind(EB);
  EB.emit = function (name, data) {
    try {
      if (name === 'shop:itemPurchased') {
        const id = data && (data.id || data.boostId || (data.item && data.item.id));
        const now = Date.now();
        if (now - lastBoostReportTs > 400) {
          lastBoostReportTs = now;
          console.log('🔌 [COUNT]', id === 'autoClicker' ? 'bobo +1 (авто-кликер)' : 'boost +1 (магазин)');
          window.Onboarding?.report(id === 'autoClicker' ? 'bobo' : 'boost');
        }
      }
    } catch (e) {}
    return orig(name, data);
  };
  EB.emit.__spy = true;
}

// ═══════════ НАБЛЮДАТЕЛЬ: gameState.daily ═══════════
let lastDailySnap = null, dailyCooldown = 0;
function watchDaily() {
  const gs = window.gameState;
  if (!gs || !gs.gameActive) return;
  const d = gs.daily;
  if (d === undefined || d === null) { lastDailySnap = null; return; }
  const snap = JSON.stringify([
    d.lastClaim ?? null, d.lastClaimTs ?? null, d.claimedAt ?? null, d.lastClaimDate ?? null,
    gs.lastDailyClaim ?? null, gs.lastDailyClaimTs ?? null,
    d.streak ?? null, gs.dailyStreak ?? null, d.day ?? null, gs.dailyDay ?? null,
    d.available ?? null, d.reward ?? null
  ]);
  if (lastDailySnap === null) { lastDailySnap = snap; return; }
  if (snap !== lastDailySnap) {
    lastDailySnap = snap;
    const now = Date.now();
    if (now - dailyCooldown > 10000) {
      dailyCooldown = now;
      console.log('🔌 [WATCH] gameState.daily изменился → report(daily)');
      window.Onboarding?.report('daily');
    }
  }
}

// ═══════════ НАБЛЮДАТЕЛЬ: coins (дейлик-фолбэк) ═══════════
let lastCoins = null, coinsCooldown = 0;
function watchCoins() {
  const S = window.Onboarding?.state?.();
  if (!S || !S.enabled || S.completed) return;
  const gs = window.gameState;
  if (!gs || !gs.gameActive) return;
  const coins = gs.coins ?? null;
  if (coins === null) return;
  if (lastCoins === null) { lastCoins = coins; return; }
  if (coins > lastCoins) {
    const now = Date.now();
    if (now - coinsCooldown > 10000) {
      coinsCooldown = now;
      if (S.step === 0 && coins - lastCoins >= 50) {
        console.log('🔌 [WATCH] coins +50 и шаг=daily → report(daily)');
        window.Onboarding?.report('daily');
      }
    }
  }
  lastCoins = coins;
}

// ═══════════ НАБЛЮДАТЕЛЬ: clickPower (фолбэк, +1 за событие роста) ═══════════
let lastClickPower = null;
function watchUpgrades() {
  const S = window.Onboarding?.state?.();
  if (!S || !S.enabled || S.completed) return;
  const gs = window.gameState;
  if (!gs) return;
  const cands = [
    gs.upgrades?.clickPower, gs.upgrades?.clickPowerLevel,
    gs.upgradeLevels?.clickPower, gs.clickPowerLevel, gs.clickPower
  ];
  let lvl = null;
  for (const c of cands) {
    if (typeof c === 'number') { lvl = c; break; }
    if (c && typeof c.level === 'number') { lvl = c.level; break; }
  }
  if (lvl === null) return;
  if (lastClickPower === null) { lastClickPower = lvl; return; }
  if (lvl > lastClickPower) {
    lastClickPower = lvl;
    if (Date.now() - lastUpgradeWrapTs > 10000) {
      console.log('🔌 [WATCH] clickPower вырос (фолбэк) → +1');
      window.Onboarding?.report('upgrade', 1);
    }
  } else {
    lastClickPower = lvl;
  }
}

// ═══════════ ПУБЛИЧНЫЙ API ═══════════
window.OnboardingHooks = {
  resetWatchers() {
    lastDailySnap = null; lastClickPower = null; lastCoins = null;
    dailyCooldown = 0; coinsCooldown = 0; lastBlockReportTs = 0;
    console.log('🔌 [HOOKS] наблюдатели сброшены (Новая игра)');
  }
};

// ═══════════ BOOT ═══════════
spyEventBus();
wire();
setInterval(watchDaily, 1000);
setInterval(watchUpgrades, 1000);
setInterval(watchCoins, 1000);
let tries = 0;
const iv = setInterval(() => { spyEventBus(); wire(); if (++tries > 15) clearInterval(iv); }, 1000);
console.log('🔌 [HOOKS] v' + VER + ' готов (single-wrap + dedupe; COUNT_AUTO_KILLS=' + COUNT_AUTO_KILLS + ')');
})();
