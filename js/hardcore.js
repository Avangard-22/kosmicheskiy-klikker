// js/hardcore.js — 🎮 ХАРДКОР-РАЗНООБРАЗИЕ (v1.0)
//  Фича 1 «Цепная реакция» — серия без промаха → множитель 💎 + BoC на вехах (1 раз за ран; Луна — до 2)
//  Фича 2 «Хроно-блоки»    — блок с таймером: добил кликом = ×3 + заряд времени; прозевал = адреналин
//
//  Принцип: НИЧЕГО не переписываем в боевой математике. Только обёртки:
//    · GAME_CORE.createMovingBlock        (спавн → хроно-блок)
//    · GAME_CORE.destroyBlock            (ручной/авто + прогресс серии)
//    · GAME_CORE.getCurrentSpeed         (слоу-мо / адреналин)
//    · GAME_CORE.getRareBlockType        (Кровавая луна → ×2 шанс ⭐)
//    · GAME_FEATURES.applyUpgradePenalty (промах → сброс серии)
//    · CombatSystem.calculateDestroyReward (множители к награде)
(function () {
'use strict';

// ═══════════════════ КОНФИГ ═══════════════════
const CFG_HC = {
    chain: {
        enabled: true,
        // вехи серии: множитель 💎 + разовая BoC-награда
        tiers: [
            { at: 25,  mult: 1.3, boc: 3,  label: 'Разогрев' },
            { at: 75,  mult: 1.8, boc: 6,  label: 'Поток' },
            { at: 150, mult: 2.5, boc: 10, label: 'Резонанс' },
            { at: 300, mult: 3.0, boc: 18, label: 'Кровавая луна' }
        ],
        bloodMoonMs: 15000,   // ⭐ редкие ×2 к шансу
    },
    chrono: {
        enabled: true,
        every: 80, jitter: 20,   // ~80±20 блоков до хроно-блока
        hpMult: 0.6,
        timerMs: 3500,
        rewardMult: 3,
        chargesForSlowMo: 3,
        slowMoMs: 6000,
        slowMoFactor: 0.7,        // −30% скорости блоков
        adrenalineBlocks: 15,
        adrenalineSpeed: 1.25
    }
};

// ═══════════════════ СОСТОЯНИЕ ═══════════════════
// Живёт в window.gameState.hc → сохраняется в облако автоматически
// (extractCloudData клонирует весь gameState целиком).
const HC = { _lastAuto: false, _lastChrono: false, _inGameDestroy: false, _hooks: false, _timer: null };

function st() {
    const gs = window.gameState;
    if (!gs) return null;
    if (!gs.hc) gs.hc = {
        streak: 0, best: 0, tier: 0,
        chronoIn: CFG_HC.chrono.every, chronoKilled: 0, chronoEscaped: 0,
        charges: 0, slowUntil: 0, bloodMoonUntil: 0, adrenaline: 0
    };
    const s = gs.hc;
    if (typeof s.chronoIn !== 'number' || s.chronoIn <= 0) s.chronoIn = CFG_HC.chrono.every;
    // 🆕 BoC-вехи: 25/75/150 — 1 раз за ран; 300 («Луна») — до BLOOD_MOON_BOC_MAX за ран
    if (!Array.isArray(s.bocClaimed)) s.bocClaimed = [false, false, false];
    if (typeof s.bocRunNumber !== 'number') s.bocRunNumber = 0;
    if (typeof s.bloodMoonBocClaims !== 'number') s.bloodMoonBocClaims = 0;
    return s;
}

// ═══════════════════ ФИЧА 1: ЦЕПНАЯ РЕАКЦИЯ ═══════════════════
function streakMult(s) {
    let m = 1;
    for (const t of CFG_HC.chain.tiers) if ((s.streak || 0) >= t.at) m = t.mult;
    return m;
}

// 🌙 предел BoC-выплат за «Кровавую луну» в одном ране
const BLOOD_MOON_BOC_MAX = 2;

function bumpStreak(s) {
    const tiers = CFG_HC.chain.tiers;
    const gs = window.gameState;

    // 🔁 Новый ран → вехи 25/75/150 доступны заново, лимит Луны сброшен.
    //    Сброс серии (промах) BoC НЕ возвращает — только множители 💎.
    if (gs && s.bocRunNumber !== gs.runNumber) {
        s.bocRunNumber = gs.runNumber;
        s.bocClaimed = [false, false, false];
        s.bloodMoonBocClaims = 0;
    }

    s.streak = (s.streak || 0) + 1;
    if (s.streak > (s.best || 0)) s.best = s.streak;

    let unlocked = s.tier || 0;
    while (unlocked < tiers.length && s.streak >= tiers[unlocked].at) {
        const idx = unlocked;
        const t = tiers[unlocked++];
        const isMoon = (idx === tiers.length - 1);

        // 💰 BoC: 25/75/150 — только при ПЕРВОМ достижении за ран.
        //    300 (Луна) — до BLOOD_MOON_BOC_MAX раз за ран (нужна свежая серия 300).
        let payBoc = false;
        if (isMoon) {
            if (s.bloodMoonBocClaims < BLOOD_MOON_BOC_MAX) { s.bloodMoonBocClaims++; payBoc = true; }
        } else if (!s.bocClaimed[idx]) {
            s.bocClaimed[idx] = true; payBoc = true;
        }

        if (payBoc && gs) gs.bocLiquid = (gs.bocLiquid || 0) + t.boc;   // скилл капает BoC-кэшбэком
        if (isMoon) s.bloodMoonUntil = Date.now() + CFG_HC.chain.bloodMoonMs;

        const bocTxt = payBoc ? ` (+${t.boc} BoC)` : '';
        toast(`🔥 ${t.label} — серия ${s.streak} · ×${t.mult} 💎${bocTxt}${isMoon ? ' · 🌙 луна' : ''}`, '#FFD700');
        if (window.telegramHaptic?.success) window.telegramHaptic.success();
    }
    s.tier = unlocked;
}

function resetStreak(s) {
    const lost = s.streak || 0;
    s.streak = 0; s.tier = 0;
    if (lost >= CFG_HC.chain.tiers[0].at) toast(`💔 Серия ${lost} сброшена`, '#ff9800');
}

// ═══════════════════ ФИЧА 2: ХРОНО-БЛОКИ ═══════════════════
function onSpawn(block) {
    const core = window.GAME_CORE, s = st(), c = CFG_HC.chrono;
    if (!core || !block || !s) return;
    if (block.dataset.hcSpawned === '1') return;       // защита от повторного вызова (пауза)
    block.dataset.hcSpawned = '1';

    if (s.adrenaline > 0) s.adrenaline--;

    if (!c.enabled) return;
    if (Number(block.textContent) !== core.currentBlockHealth) return;  // редкий блок — не трогаем

    s.chronoIn = (s.chronoIn || c.every) - 1;
    if (s.chronoIn <= 0) {
        s.chronoIn = c.every + Math.floor((Math.random() * 2 - 1) * c.jitter);
        makeChrono(block);
    }
}

function makeChrono(block) {
    const core = window.GAME_CORE, c = CFG_HC.chrono;
    core.currentBlockHealth = Math.max(1, Math.floor(core.currentBlockHealth * c.hpMult));
    block.dataset.chrono = '1';
    block.dataset.hcDeadline = String(Date.now() + c.timerMs);
    block.classList.add('hc-chrono');
    block.textContent = core.currentBlockHealth;      // низкий HP виден сразу
    showBadge(block);
    toast('⏱ Хроно-блок! Добей кликом', '#4fc3f7');
    if (window.telegramHaptic?.warning) window.telegramHaptic.warning();
}

function escapeChrono(block) {
    const core = window.GAME_CORE, s = st(), c = CFG_HC.chrono;
    if (s) { s.chronoEscaped++; s.adrenaline = c.adrenalineBlocks; }
    hideBadge();
    if (core.currentBlock === block) { core.currentBlock = null; core.currentBlockHealth = 0; }
    const ga = document.getElementById('gameArea');
    if (ga && block && ga.contains(block)) ga.removeChild(block);
    toast(`⏱ Прозевал! +${Math.round((c.adrenalineSpeed - 1) * 100)}% скорости на ${c.adrenalineBlocks} блоков`, '#ff6b6b');
    if (window.telegramHaptic?.error) window.telegramHaptic.error();
    if (window.gameState?.gameActive) setTimeout(() => { if (window.gameState?.gameActive) core.createMovingBlock(); }, 500);
}

function addCharge(s) {
    const c = CFG_HC.chrono;
    s.charges++;
    if (s.charges >= c.chargesForSlowMo) {
        s.charges = 0;
        s.slowUntil = Date.now() + c.slowMoMs;
        toast(`🐌 Слоу-мо ${c.slowMoMs / 1000} сек!`, '#4fc3f7');
    } else {
        toast(`⏱ +1 заряд времени (${s.charges}/${c.chargesForSlowMo})`, '#FFD700');
    }
    if (window.telegramHaptic?.success) window.telegramHaptic.success();
}

// ── Плавающий таймер над хроно-блоком ──
let badgeEl = null;
function showBadge(block) {
    if (!badgeEl) { badgeEl = document.createElement('div'); badgeEl.className = 'hc-chrono-badge'; document.body.appendChild(badgeEl); }
    badgeEl.style.display = 'block';
    updateBadge(block);
}
function updateBadge(block) {
    if (!badgeEl || !block || !block.isConnected) return;
    const r = block.getBoundingClientRect();
    const leftMs = Math.max(0, Number(block.dataset.hcDeadline) - Date.now());
    badgeEl.textContent = '⏱ ' + (leftMs / 1000).toFixed(1);
    badgeEl.style.left = (r.left + r.width / 2) + 'px';
    badgeEl.style.top = (r.top - 18) + 'px';
}
function hideBadge() { if (badgeEl) badgeEl.style.display = 'none'; }

function tick() {
    const core = window.GAME_CORE, gs = window.gameState;
    if (!HC._hooks || !core || !gs || !gs.gameActive) { hideBadge(); return; }
    const b = core.currentBlock;
    if (b && b.dataset?.chrono === '1') {
        updateBadge(b);
        if (!core.isGamePaused && Date.now() >= Number(b.dataset.hcDeadline)) escapeChrono(b);
    } else hideBadge();
}

// ═══════════════════ UI: пилюля + тост ═══════════════════
function createPill() {
    if (document.getElementById('hcPill')) return;
    document.body.appendChild(Object.assign(document.createElement('div'), { id: 'hcPill' }));
    setInterval(updatePill, 500);
}
function updatePill() {
    const el = document.getElementById('hcPill');
    if (!el) return;
    const gs = window.gameState, s = gs?.hc;
    if (!gs?.gameActive || !s) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    const parts = [];
    if (CFG_HC.chain.enabled) parts.push('🔥 ' + (s.streak || 0));
    if (CFG_HC.chrono.enabled) parts.push('⏱ ' + (s.charges || 0) + '/' + CFG_HC.chrono.chargesForSlowMo);
    if (Date.now() < (s.slowUntil || 0)) parts.push('🐌');
    if (Date.now() < (s.bloodMoonUntil || 0)) parts.push('🌙');
    el.textContent = parts.join(' · ');
}
function toast(text, color) {
    const el = document.createElement('div');
    el.className = 'hc-toast';
    el.textContent = text;
    el.style.borderColor = color || '#FFD700';
    el.style.color = color || '#FFD700';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
}

// ═══════════════════ УСТАНОВКА ОБЁРТОК ═══════════════════
function install() {
    const core = window.GAME_CORE, feat = window.GAME_FEATURES, cs = window.CombatSystem;
    if (!core || !feat || !cs) return false;
    if (HC._hooks) return true;

    // 1) СПАВН → хроно-блок
    const _create = core.createMovingBlock.bind(core);
    core.createMovingBlock = function () {
        _create();
        onSpawn(this.currentBlock);
    };

    // 2) РАЗРУШЕНИЕ → серия + детект ручного/авто хроно-килла
    const _destroy = core.destroyBlock.bind(core);
    core.destroyBlock = function (block, isAuto) {
        HC._lastAuto = !!isAuto;
        HC._lastChrono = !!(block && block.dataset && block.dataset.chrono === '1');
        const wasChrono = HC._lastChrono;
        HC._inGameDestroy = true;
        let res;
        try { res = _destroy(block, isAuto); }
        finally { HC._inGameDestroy = false; }

        const s = st();
        // 🆕 серия — только за ручные добивания (иначе Bobo/авто набивают её и Луна = AFK-кран)
        if (s && CFG_HC.chain.enabled && !isAuto) bumpStreak(s);
        if (wasChrono) {
            if (!isAuto && s) { s.chronoKilled++; addCharge(s); }
            hideBadge();
        }
        return res;
    };

    // 3) СКОРОСТЬ → слоу-мо / адреналин
    const _speed = core.getCurrentSpeed.bind(core);
    core.getCurrentSpeed = function () {
        let sp = _speed() || 0;
        const s = window.gameState?.hc;                 // читаем без создания
        if (s) {
            if (Date.now() < (s.slowUntil || 0)) sp *= CFG_HC.chrono.slowMoFactor;
            if ((s.adrenaline || 0) > 0) sp *= CFG_HC.chrono.adrenalineSpeed;
        }
        return sp;
    };

    // 4) РЕДКИЕ БЛОКИ → Кровавая луна (вторая попытка ≈ ×2 к шансу)
    const _rare = core.getRareBlockType.bind(core);
    core.getRareBlockType = function () {
        const r = _rare();
        if (r) return r;
        const s = window.gameState?.hc;
        if (s && Date.now() < (s.bloodMoonUntil || 0)) return _rare();
        return null;
    };

    // 5) ПРОМАХ → сброс серии (applyUpgradePenalty вызывается на каждый мисс)
    if (typeof feat.applyUpgradePenalty === 'function') {
        const _penalty = feat.applyUpgradePenalty.bind(feat);
        feat.applyUpgradePenalty = function () {
            const s = window.gameState?.hc;
            if (s && CFG_HC.chain.enabled && s.streak > 0) resetStreak(s);
            return _penalty();
        };
    }

    // 6) НАГРАДА → множители (только для ручных убийств и только внутри игры)
    const _reward = cs.calculateDestroyReward.bind(cs);
    cs.calculateDestroyReward = function (block, isAuto) {
        const res = _reward(block, isAuto);
        if (!HC._inGameDestroy || !res || typeof res.reward !== 'number') return res;  // сим/внешний вызов — не трогаем
        const s = window.gameState?.hc;
        if (!s) return res;
        let mult = 1;
        if (CFG_HC.chain.enabled && !HC._lastAuto) mult *= streakMult(s);
        if (HC._lastChrono && !HC._lastAuto) mult *= CFG_HC.chrono.rewardMult;  // хроно-блок кликом → ×3 💎
        if (mult !== 1) res.reward = Math.floor(res.reward * mult);
        return res;
    };

    HC._hooks = true;
    HC._timer = setInterval(tick, 200);
    createPill();
    console.log('🎮 [HARDCORE] v1.0 активен: Цепная реакция + Хроно-блоки');
    return true;
}

// CSS модуля
const style = document.createElement('style');
style.textContent = `
.hc-chrono{border:3px solid #4fc3f7!important;box-shadow:0 0 22px #4fc3f7!important;animation:hcChronoPulse .6s infinite alternate}
@keyframes hcChronoPulse{from{filter:brightness(1)}to{filter:brightness(1.45)}}
.hc-chrono-badge{position:fixed;transform:translateX(-50%);z-index:60;pointer-events:none;font-family:Orbitron,sans-serif;font-weight:700;font-size:12px;color:#4fc3f7;background:rgba(0,0,0,.72);border:2px solid #4fc3f7;border-radius:8px;padding:2px 8px}
#hcPill{position:fixed;left:10px;bottom:70px;z-index:40;display:none;font-family:Orbitron,sans-serif;font-weight:700;font-size:12px;color:#fff;background:rgba(0,0,0,.55);border:1px solid rgba(255,215,0,.5);border-radius:10px;padding:4px 10px;pointer-events:none;gap:6px}
.hc-toast{position:fixed;top:42%;left:50%;transform:translateX(-50%);z-index:10000;font-family:Orbitron,sans-serif;font-weight:700;font-size:14px;background:rgba(0,0,0,.82);border:2px solid #FFD700;border-radius:12px;padding:10px 16px;text-align:center;max-width:280px;pointer-events:none;opacity:0;animation:hcToast 2.2s forwards}
@keyframes hcToast{10%{opacity:1}80%{opacity:1}100%{opacity:0}}
`;
document.head.appendChild(style);

// ── boot с ожиданием готовности ядра ──
function boot() {
    if (install()) return;
    let tries = 0;
    const t = setInterval(() => { if (install() || ++tries > 40) clearInterval(t); }, 500);
    if (window.EventBus) {
        window.EventBus.once('core:ready', install);
        window.EventBus.once('save:ready', install);
    }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

window.HardcoreSystem = { config: CFG_HC, getState: () => window.gameState?.hc || null };
})();
