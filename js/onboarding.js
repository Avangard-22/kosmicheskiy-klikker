// js/onboarding.js — 🚀 ОНБОРДИНГ НОВИЧКА (v2.2)
// 🆕 v2.2: ТРОЙНАЯ ЗАЩИТА перезапуска при "Новой игре":
//          1) Обёртка GAME_CORE.startGame/resetGame
//          2) Наблюдатель за сбросом gameState.stats.blocksDestroyed
//          3) Наблюдатель за переходом gameState.coins: 0 → малое число
(function () {
'use strict';
const VER = '2.2';
const CFG = {
  lsKey: 'cosmic_onboarding_v1',
  z: 9990,
  hintCooldownSec: 45,
  maxHintsPerSession: 3,
  highlightMs: 6000,
  completionToastMs: 5000,
  newGameEvents: ['game:newGame', 'game:new', 'game:started', 'game:start', 'game:reset', 'game:restart'],
  selectors: {
    upgrades:     ['#upgradesBtn', '#btnUpgrades', '[data-open="upgrades"]'],
    shop:         ['#shopBtn', '#btnShop', '[data-open="shop"]'],
    daily:        ['#dailyBtn', '#btnDaily', '[data-open="daily"]'],
    bobo:         ['#boboBtn', '#btnBobo', '[data-open="bobo"]'],
    powerSurge:   ['#shop-card-powerSurge'],
    crystalBoost: ['#shop-card-crystalBoost']
  },
  openers: {
    upgrades: () => window.UpgradesPanel?.open?.() || window.upgradesPanel?.open?.() || window.upgradesSystem?.openPanel?.(),
    shop:     () => window.shopSystem?.openShop?.(),
    daily:    () => window.dailySystem?.open?.() || window.dailyBonusSystem?.open?.() || window.shopSystem?.openShop?.(),
    bobo:     () => window.UpgradesPanel?.open?.() || window.upgradesPanel?.open?.() || window.upgradesSystem?.openPanel?.()
  }
};

const STEPS = [
  { id: 'daily',   goal: 1, reward: 150, target: 'daily',
    ru: 'Активируй Ежедневный бонус', ruHint: '🎁 раз в ~23 ч: кристаллы, бустер или уровни улучшений — сильно ускоряет старт',
    en: 'Claim the daily bonus',      enHint: '🎁 once per ~23 h: crystals, a booster or upgrade levels' },
  { id: 'boost',   goal: 2, reward: 200, target: 'shop', items: ['powerSurge', 'crystalBoost'],
    ru: 'Купи бонус в Магазине',       ruHint: '«🛒 Магазин»: купи «⚡ Скачок силы» и «💰 Усилитель кристаллов» — окупятся сразу',
    en: 'Buy a shop boost',           enHint: '"🛒 Shop": buy "⚡ Power Surge" and "💰 Crystal Boost" — pays off instantly' },
    { id: 'upgrade', goal: 5, reward: 300, target: 'upgrades',
    ru: 'Купи улучшение «Сила удара» 5 раз', ruHint: '«⚡ Улучшения» → «Сила удара»: купи 5 уровней подряд — каждый усиливает клик',
    en: 'Buy Click Power 5 times',           enHint: '"⚡ Upgrades" → "Click Power": buy 5 levels in a row' },
  { id: 'bobo',    goal: 1, reward: 250, target: 'bobo',
    ru: 'Включи Bobo или авто-кликер', ruHint: 'Помощник бьёт блоки за тебя: меньше промахов, больше дохода',
    en: 'Activate Bobo or Auto-Clicker', enHint: 'A helper attacks blocks for you: fewer misses, more income' },
  { id: 'block',   goal: 5, reward: 150,
    ru: 'Разбей 5 блоков',        ruHint: 'Любым способом: кликами, Bobo или авто-кликером — главное, чтобы 5 блоков пало',
    en: 'Destroy 5 blocks',       enHint: 'Any method counts: clicks, Bobo or auto-clicker — 5 blocks must fall' },
];

const L = () => (window.currentLanguage === 'en' ? 'en' : 'ru');
const MOUNT = document.documentElement;
let S = load();
let panel, hintsShown = 0, lastHintTs = 0;
let lastHideReason = '', shownLogged = false;
let completionToastShown = false;
let eventBusBound = false;
let startGameBound = false;
let restartCooldown = 0; // 🆕 v2.2: защита от множественных перезапусков

function load() {
  try {
    return Object.assign(
      { step: 0, prog: {}, done: [], hints: {}, collapsed: false, enabled: false, completed: false },
      JSON.parse(localStorage.getItem(CFG.lsKey) || '{}')
    );
  } catch (e) {
    return { step: 0, prog: {}, done: [], hints: {}, collapsed: false, enabled: false, completed: false };
  }
}
function save() { try { localStorage.setItem(CFG.lsKey, JSON.stringify(S)); } catch (e) {} }

function inGame() {
  if (window.gameState?.gameActive) return true;
  if (!window.gameState) return false;
  const ws = document.getElementById('welcomeScreen');
  return !ws || getComputedStyle(ws).display === 'none' || ws.classList.contains('hidden');
}

// ═══════════ ЯВНЫЙ СБРОС (только при "Новой игре") ═══════════
function restartOnboarding(src) {
  const now = Date.now();
  if (now - restartCooldown < 3000) {
    console.log('🚀 [ONBOARDING] пропуск перезапуска (кулдаун 3с)');
    return;
  }
  restartCooldown = now;
  
  console.log('🚀 [ONBOARDING] 🔄 restartOnboarding() вызван через:', src);
  S.step = 0;
  S.prog = {};
  S.done = [];
  S.hints = {};
  S.collapsed = false;
  S.enabled = true;
  S.completed = false;
  completionToastShown = false;
  hintsShown = 0;
  lastHintTs = 0;
  save();
  if (window.OnboardingHooks?.resetWatchers) window.OnboardingHooks.resetWatchers();
  
  setTimeout(() => {
    render();
    toast(L() === 'ru' ? '🚀 Новое приключение! Задачи новичка снова активны.' : '🚀 New adventure! Starter tasks are back.');
    console.log('🚀 [ONBOARDING] ✅ маршрут перезапущен, enabled=', S.enabled, 'completed=', S.completed);
  }, 600);
}

// ═══════════ 🆕 v2.2: ОБЁРТКА GAME_CORE.startGame / resetGame ═══════════
function bindStartGame() {
  if (startGameBound) return;
  const G = window.GAME_CORE || window.gameCore;
  if (!G) return;
  
  for (const method of ['startGame', 'resetGame', 'newGame', 'startNewGame']) {
    const fn = G[method];
    if (typeof fn === 'function' && !fn.__obRestart) {
      fn.__obRestart = true;
      G[method] = function (...args) {
        console.log('🚀 [ONBOARDING] перехвачен GAME_CORE.' + method + '()');
        const r = fn.apply(this, args);
        // 🆕 v2.2: отложенный перезапуск (даём gameState инициализироваться)
        setTimeout(() => restartOnboarding('GAME_CORE.' + method), 800);
        return r;
      };
      startGameBound = true;
      console.log('🚀 [ONBOARDING] ✅ обёрнут GAME_CORE.' + method);
      return;
    }
  }
}

// ═══════════ АКТИВАЦИЯ ═══════════
function activate(src) {
  if (S.completed) {
    console.log('🚀 [ONBOARDING] пропуск: обучение уже завершено в этом забеге');
    return;
  }
  if (S.enabled && S.done.length >= STEPS.length) {
    console.log('🚀 [ONBOARDING] пропуск: маршрут этого забега уже пройден');
    return;
  }
  if (!S.enabled) {
    S.enabled = true;
    save();
    console.log('🚀 [ONBOARDING] активирован через:', src);
    if (inGame()) toast(L() === 'ru' ? '🚀 Задачи новичка включены — награда за каждый шаг!' : '🚀 Starter tasks on — reward for every step!');
  }
  render();
}

function watchActivation() {
  if (S.completed) return;
  if (S.enabled && S.done.length < STEPS.length) return;
  if (!S.enabled && inGame()) {
    const gs = window.gameState;
    const blocks = gs?.stats?.blocksDestroyed ?? gs?.blocksDestroyed ?? null;
    if (blocks === null || blocks === 0) {
      activate('игра идёт + нулевой прогресс');
    }
  }
}

// 🆕 v2.2: Наблюдатель за сбросом gameState (признак "Новой игры")
let lastBlocksDestroyed = null;
let lastCoins = null;
function watchGameStateReset() {
  const gs = window.gameState;
  if (!gs) return;
  
  const blocks = gs.stats?.blocksDestroyed ?? gs.blocksDestroyed ?? null;
  const coins = gs.coins ?? null;
  
  // Сценарий 1: blocksDestroyed сбросился до 0 (или стал null)
  if (lastBlocksDestroyed !== null && lastBlocksDestroyed > 0 && blocks === 0) {
    console.log('🚀 [ONBOARDING] обнаружен сброс blocksDestroyed:', lastBlocksDestroyed, '→', blocks);
    restartOnboarding('сброс blocksDestroyed');
  }
  
  // Сценарий 2: coins сбросились до 0, потом выросли до малого числа (ежедневный бонус)
  if (lastCoins !== null && lastCoins > 1000 && coins < 500 && coins > 0) {
    console.log('🚀 [ONBOARDING] обнаружен сброс coins + бонус:', lastCoins, '→', coins);
    restartOnboarding('сброс coins + бонус');
  }
  
  lastBlocksDestroyed = blocks;
  lastCoins = coins;
}

function giveCrystals(n) {
  try {
    if (window.GameEconomy?.addCrystals) return window.GameEconomy.addCrystals(n, 'onboarding');
    if (window.gameEconomy?.addCrystals) return window.gameEconomy.addCrystals(n, 'onboarding');
    if (typeof window.gameState?.coins === 'number') { window.gameState.coins += n; if (window.GAME_UI?.updateHUD) window.GAME_UI.updateHUD(); return true; }
    if (typeof window.gameState?.crystals === 'number') { window.gameState.crystals += n; return true; }
  } catch (e) {}
  return false;
}

// ═══════════ ПАНЕЛЬ ═══════════
function ensurePanel() {
  if (panel) return;
  injectStyles();
  injectMobileStyles();   // 🆕 v2.4
  panel = document.createElement('div');
  panel.id = 'obPanel';
  panel.style.zIndex = CFG.z;
  panel.style.display = 'none';
  panel.addEventListener('click', e => { if (e.target.id === 'obToggle') { S.collapsed = !S.collapsed; save(); render(); } });
  MOUNT.appendChild(panel);
  setInterval(render, 2000);
}

function cur() { return STEPS[S.step]; }

function hidePanel(reason) {
  panel.style.display = 'none';
  if (reason !== lastHideReason) {
    lastHideReason = reason;
    shownLogged = false;
    if (reason !== 'обучение завершено') {
      console.log('🚀 [ONBOARDING] панель скрыта:', reason);
    }
  }
}

function render() {
  if (!panel) return;
  if (!MOUNT.contains(panel)) MOUNT.appendChild(panel);

  if (S.completed) return hidePanel('обучение завершено');
  const done = S.done.length;
  if (!S.enabled) return hidePanel('не активирован (enabled=false)');
  if (!inGame()) return hidePanel('не в игре (gameActive=false и welcome виден)');
  if (done >= STEPS.length) return hidePanel('маршрут уже пройден (done=' + done + '/5)');

  if (!shownLogged) { shownLogged = true; lastHideReason = ''; console.log('🚀 [ONBOARDING] панель ПОКАЗАНА'); }
  panel.style.display = 'block';

  const s = cur();
  if (!s) return hidePanel('текущий шаг не определён (cur()==null)');

  const ru = L() === 'ru';
  const prog = Math.min(S.prog[s.id] || 0, s.goal);
  panel.innerHTML = S.collapsed
    ? `<button id="obToggle" class="ob-bar">🚀 ${done}/${STEPS.length}</button>`
    : `<div class="ob-card">
         <div class="ob-head"><button id="obToggle" class="ob-min">—</button>
           <span class="ob-title">🚀 ${ru ? 'Задачи новичка' : 'Starter tasks'} · ${done}/${STEPS.length}</span></div>
         <div class="ob-task">${ru ? s.ru : s.en} <b>(${prog}/${s.goal})</b> <span class="ob-reward">+${s.reward}💎</span></div>
         <div class="ob-hint">${ru ? s.ruHint : s.enHint}</div>
         <div class="ob-row">
           <div class="ob-dots">${STEPS.map((x, i) => `<i class="${i < done ? 'ok' : i === S.step ? 'now' : ''}"></i>`).join('')}</div>
           ${s.target ? `<button class="ob-btn" data-act="where">${ru ? '👉 Показать где' : '👉 Show me'}</button>` : ''}
         </div>
       </div>`;
  const w = panel.querySelector('[data-act="where"]');
  if (w) w.onclick = () => showWhere(s);
  setTimeout(fixPosition, 60);
}

function fixPosition() {
  if (!panel || panel.style.display === 'none') return;
  panel.style.position = 'fixed';
  panel.style.left = '50%'; panel.style.top = 'auto';
  panel.style.bottom = '10px'; panel.style.transform = 'translateX(-50%)';
  const r = panel.getBoundingClientRect();
  const bad = !r.width || r.top > innerHeight || r.bottom < 0 || r.left > innerWidth || r.right < 0;
  if (bad) {
    const sx = window.scrollX || 0, sy = window.scrollY || 0;
    panel.style.position = 'absolute';
    panel.style.transform = 'none';
    panel.style.left = (sx + Math.max(8, (innerWidth - panel.offsetWidth) / 2)) + 'px';
    panel.style.top  = (sy + innerHeight - panel.offsetHeight - 12) + 'px';
  }
}

function showWhere(s) {
  const el = find(s.target);
  if (!el) { toast(L() === 'ru' ? cur().ruHint : cur().enHint); return; }
  CFG.openers[s.target]?.();
  setTimeout(() => {
    highlight(el);
    if (s.items && s.items.length > 0) {
      setTimeout(() => {
        s.items.forEach(itemId => {
          const itemEl = find(itemId);
          if (itemEl) {
            itemEl.classList.add('ob-hl');
            itemEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
            setTimeout(() => itemEl.classList.remove('ob-hl'), CFG.highlightMs);
          }
        });
      }, 400);
    }
  }, 350);
}

function find(key) {
  for (const sel of CFG.selectors[key] || []) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function highlight(el) {
  el.classList.add('ob-hl');
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  setTimeout(() => el.classList.remove('ob-hl'), CFG.highlightMs);
}

// ═══════════ ПРОГРЕСС ═══════════
function report(type, n = 1) {
  if (S.completed) return;
  if (!S.enabled) return;

  const s = cur();
  if (!s) return;
  if (s.id !== type) {
    console.log('🚀 [OB] ⏭️ пропущен: текущий шаг', s.id, 'не совпадает с', type);
    return;
  }

  S.prog[type] = (S.prog[type] || 0) + n;
  console.log('🚀 [OB] ✅', type, 'прогресс:', S.prog[type], '/', s.goal);

  if (S.prog[type] >= s.goal) {
    S.done.push(type);
    S.step++;
    giveCrystals(s.reward);
    toast((L() === 'ru' ? '✅ Задача выполнена! +' : '✅ Task done! +') + s.reward + '💎');

    if (S.done.length === STEPS.length) {
      S.completed = true;
      save();
      if (!completionToastShown) {
        completionToastShown = true;
        toast(L() === 'ru' ? '🏆 Обучение завершено. Удачной игры!' : '🏆 Tutorial complete. Good luck!');
        window.GameEconomy?.giveCoupon?.() || window.gameEconomy?.giveCoupon?.();
      }
      render();
      return;
    }
    save();
  }
  save();
  render();
}

// ═══════════ ТОСТЫ / ПОДСКАЗКИ / БЕЙДЖИ ═══════════
function toast(text) {
  const t = document.createElement('div');
  t.className = 'ob-toast';
  t.style.zIndex = CFG.z + 1;
  t.textContent = text;
  // 🆕 v2.3: ставим тост НАД панелью задач, чтобы не перекрывать её
  const ph = (panel && panel.style.display !== 'none') ? panel.offsetHeight : 0;
  t.style.bottom = (16 + ph + 12) + 'px';
  MOUNT.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 400);
  }, CFG.completionToastMs);
}

function hintOnce(id, text) {
  const now = Date.now();
  if (S.hints[id] || hintsShown >= CFG.maxHintsPerSession || now - lastHintTs < CFG.hintCooldownSec * 1000) return;
  S.hints[id] = 1;
  hintsShown++;
  lastHintTs = now;
  save();
  toast(text);
}

function dailyReady() {
  return window.dailySystem?.isAvailable?.() || window.dailyBonusSystem?.isAvailable?.() ||
         window.DailyBonus?.isAvailable?.() || window.gameState?.daily?.available;
}

function tick() {
  if (!S.enabled || !inGame() || S.completed) return;
  const ru = L() === 'ru';
  if (dailyReady()) {
    badge('daily', true);
    hintOnce('daily', ru ? '🎁 Ежедневный бонус готов — забери, он бесплатно ускоряет старт!' : '🎁 Daily bonus is ready — free boost, take it!');
  } else badge('daily', false);

  const c = window.gameState?.coins ?? window.gameState?.crystals;
  if (typeof c === 'number' && c > 500) {
    badge('upgrades', true);
    hintOnce('upgrade', ru ? '💎 Кристаллы лежат мёртвым грузом — вложись в «Силу удара», окупится сразу.' : '💎 Idle crystals? Invest into Click Power — pays off instantly.');
  } else badge('upgrades', false);
}

function badge(key, on) {
  const el = find(key);
  if (el) el.classList.toggle('ob-badge', !!on);
}

// ═══════════ САМОДИАГНОСТИКА ═══════════
function debug() {
  const r = panel ? panel.getBoundingClientRect() : null;
  const info = {
    ver: VER, enabled: S.enabled, completed: S.completed, inGame: inGame(),
    gameActive: window.gameState?.gameActive, coins: window.gameState?.coins,
    step: S.step, done: S.done, prog: S.prog,
    panelExists: !!panel, display: panel?.style.display,
    rect: r ? { top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) } : null,
    hideReason: lastHideReason || 'показана',
    eventBusBound, startGameBound
  };
  console.log('🚀 [ONBOARDING DEBUG]', info);
  return info;
}

function force() {
  S.enabled = true;
  S.completed = false;
  save();
  render();
  setTimeout(() => { fixPosition(); debug(); }, 100);
}

// ═══════════ СТИЛИ ═══════════
function injectStyles() {
  if (document.getElementById('ob-styles')) return;
  const st = document.createElement('style');
  st.id = 'ob-styles';
  st.textContent = `#obPanel{position:fixed;left:50%;transform:translateX(-50%);bottom:10px;width:min(94vw,420px);font-family:'Orbitron',system-ui,sans-serif;pointer-events:auto} .ob-bar{width:100%;background:rgba(0,0,0,.6);color:#FFD700;border:1px solid rgba(255,215,0,.5);border-radius:12px;padding:8px 14px;font-weight:700;cursor:pointer} .ob-card{background:rgba(12,10,24,.95);border:2px solid rgba(255,215,0,.35);border-radius:14px;padding:10px 12px;color:#e8e8f0;box-shadow:0 8px 30px rgba(0,0,0,.6)} .ob-head{display:flex;align-items:center;gap:8px}.ob-min{background:none;border:1px solid rgba(255,255,255,.25);color:#fff;border-radius:6px;width:24px;height:24px;cursor:pointer} .ob-title{color:#FFD700;font-weight:700;font-size:.8em} .ob-task{margin:6px 0 2px;font-size:.85em;font-weight:700}.ob-reward{color:#4CAF50} .ob-hint{font-size:.72em;color:#9aa;margin-bottom:8px} .ob-row{display:flex;align-items:center;gap:8px;justify-content:space-between} .ob-dots{display:flex;gap:4px}.ob-dots i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.2)} .ob-dots i.ok{background:#4CAF50}.ob-dots i.now{background:#FFD700;transform:scale(1.25)} .ob-btn{background:linear-gradient(135deg,#4CAF50,#388E3C);border:none;color:#fff;border-radius:10px;padding:7px 12px;font-family:inherit;font-weight:700;font-size:.75em;cursor:pointer} .ob-hl{outline:3px solid #FFD700 !important;outline-offset:3px;animation:obPulse 1s infinite} @keyframes obPulse{50%{outline-color:rgba(255,215,0,.35)}} .ob-badge::after{content:'';position:absolute;top:-4px;right:-4px;width:12px;height:12px;border-radius:50%;background:#ff3b30;box-shadow:0 0 8px #ff3b30;animation:obPulse 1.2s infinite} .ob-badge{position:relative} .ob-toast{position:fixed;left:50%;bottom:180px;transform:translateX(-50%) translateY(20px);opacity:0;transition:.35s;background:rgba(12,10,24,.97);border:2px solid rgba(76,175,80,.6);color:#e8e8f0;border-radius:12px;padding:10px 16px;font-family:'Orbitron',system-ui,sans-serif;font-size:.85em;max-width:92vw;text-align:center;pointer-events:none} .ob-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}`;
  document.head.appendChild(st);
}

function tryBindEventBus() {
  if (eventBusBound) return;
  if (!window.EventBus || typeof window.EventBus.on !== 'function') return;
  eventBusBound = true;
  CFG.newGameEvents.forEach(ev => {
    window.EventBus.on(ev, () => {
      console.log('🚀 [ONBOARDING] EventBus', ev, '→ перезапуск маршрута');
      restartOnboarding('EventBus ' + ev);
    });
  });
  console.log('🚀 [ONBOARDING] ✅ EventBus подписан на', CFG.newGameEvents.length, 'событий');
}
  
// ═══════════ 🆕 v2.4: МОБИЛЬНЫЕ СТИЛИ (панель не перекрывает кнопки справа) ═══════════
function injectMobileStyles() {
  if (document.getElementById('ob-mobile')) return;
  const st = document.createElement('style');
  st.id = 'ob-mobile';
  st.textContent = `
  @media (max-width: 640px){
    #obPanel{ left:8px !important; right:78px !important; width:auto !important; transform:none !important; bottom:8px !important; }
    .ob-bar{ width:auto; display:inline-block; padding:6px 12px; font-size:.85em; }
    .ob-card{ padding:8px 10px; }
    .ob-head{ gap:6px; }
    .ob-min{ width:20px; height:20px; font-size:.8em; }
    .ob-title{ font-size:.72em; }
    .ob-task{ font-size:.8em; }
    .ob-reward{ font-size:.9em; }
    .ob-hint{ font-size:.68em; margin-bottom:6px; }
    .ob-btn{ padding:6px 10px; font-size:.7em; }
    .ob-dots i{ width:6px; height:6px; }
  }`;
  document.head.appendChild(st);
}
  
// ═══════════ BOOT ═══════════
function boot() {
  ensurePanel();
  render();
  setInterval(tick, 5000);
  setInterval(watchActivation, 800);
  setInterval(fixPosition, 5000);
  setInterval(watchGameStateReset, 1000); // 🆕 v2.2: наблюдатель за сбросом gameState
  tick();
  
  tryBindEventBus();
  let ebTries = 0;
  const ebIv = setInterval(() => {
    if (eventBusBound || ++ebTries > 30) clearInterval(ebIv);
    else tryBindEventBus();
  }, 1000);
  
  // 🆕 v2.2: повторяем попытку обёртки startGame (игра может создать GAME_CORE позже)
  bindStartGame();
  let sgTries = 0;
  const sgIv = setInterval(() => {
    if (startGameBound || ++sgTries > 30) clearInterval(sgIv);
    else bindStartGame();
  }, 1000);

  const ws = document.getElementById('welcomeScreen');
  if (ws && window.MutationObserver) {
    new MutationObserver(() => {
      const hidden = getComputedStyle(ws).display === 'none' || ws.classList.contains('hidden');
      if (hidden && !S.enabled && !S.completed && inGame()) {
        const gs = window.gameState;
        const blocks = gs?.stats?.blocksDestroyed ?? gs?.blocksDestroyed ?? null;
        if (blocks === null || blocks === 0) {
          activate('welcome скрыт + игра идёт + нулевой прогресс');
        }
      }
    }).observe(ws, { attributes: true, attributeFilter: ['style', 'class'] });
  }

  console.log('🚀 [ONBOARDING] v' + VER + ' готов, enabled =', S.enabled, ', completed =', S.completed, ', done =', S.done.length);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

window.Onboarding = {
  report,
  activate,
  force,
  debug,
  restart: restartOnboarding,
  version: VER,
  whyHidden: () => lastHideReason || 'показана',
  reset()    { S = { step: 0, prog: {}, done: [], hints: {}, collapsed: false, enabled: true, completed: false }; save(); render(); },
  state: () => S
};
})();
