// js/onboarding.js — 🚀 ОНБОРДИНГ НОВИЧКА (v2.6)
// 🆕 v2.6: ТРОЙНАЯ ЗАЩИТА перезапуска при "Новой игре":
//          1) Обёртка GAME_CORE.startGame/resetGame
//          2) Наблюдатель за сбросом gameState.stats.blocksDestroyed
//          3) Наблюдатель за переходом gameState.coins: 0 → малое число
(function () {
'use strict';
const VER = '2.6';
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
  { id: 'block',   goal: 1, reward: 50,
    ru: 'Уничтожь блок!',              ruHint: 'Кликай по поднимающемуся блоку — за него дают 💎',
    en: 'Tap the block!',              enHint: 'Click the rising block — it gives 💎' },
  { id: 'upgrade', goal: 1, reward: 100, target: 'upgrades',
    ru: 'Улучши силу клика',           ruHint: '«⚡ Улучшения» → «Сила удара»: теперь блоки ломаются быстрее',
    en: 'Upgrade click power',         enHint: '"⚡ Upgrades" → "Click Power": blocks break faster' },
  { id: 'block',   goal: 2, reward: 100,
    ru: 'Разбей ещё 1 блок',          ruHint: 'Чувствуешь силу? Добей ещё один блок!',
    en: 'Destroy 1 more blocks',       enHint: 'Feel the power? Finish one more!' },
  { id: 'shoplook',goal: 1, reward: 100, target: 'shop',
    ru: 'Загляни в Магазин',           ruHint: '«🛒 Магазин»: посмотри, что там есть — покупки позже',
    en: 'Peek into the Shop',          enHint: '"🛒 Shop": look around — purchases come later' },
  { id: 'bobo',    goal: 1, reward: 250, target: 'bobo',
    ru: 'Купи Bobo или авто-кликер', ruHint: 'Помощник бьёт блоки за тебя: меньше промахов, больше дохода',
    en: 'Activate Bobo or Auto-Clicker', enHint: 'A helper attacks blocks for you' },
  { id: 'daily',   goal: 1, reward: 150, target: 'daily',
    ru: 'Забери Ежедневный бонус',     ruHint: '🎁 раз в ~23 ч: кристаллы, бустер или уровни улучшений',
    en: 'Claim the daily bonus',       enHint: '🎁 once per ~23 h: crystals, a booster or upgrade levels' }
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

// ═══════════ 🆕 v2.5: ОБЁРТКА startGame С РАЗЛИЧИЕМ reset/continue ═══════════
function bindStartGame() {
if (startGameBound) return;
const G = window.GAME_CORE || window.gameCore;
if (!G) return;
for (const method of ['startGame', 'resetGame', 'newGame', 'startNewGame']) {
const fn = G[method];
if (typeof fn === 'function' && !fn.__obRestart) {
fn.__obRestart = true;
G[method] = function (...args) {
// 🆕 v2.5: перезапуск ТОЛЬКО при настоящем сбросе:
// startGame(true) / resetGame / newGame / startNewGame.
// startGame(false) — это «Продолжить»: онбординг НЕ трогаем.
const isReset = (method === 'startGame') ? (args[0] === true) : true;
console.log('🚀 [ONBOARDING] перехвачен GAME_CORE.' + method + '(' + args.join(',') + ') isReset=' + isReset);
const r = fn.apply(this, args);
if (isReset) setTimeout(() => restartOnboarding('GAME_CORE.' + method), 800);
else console.log('🚀 [ONBOARDING] continue (reset=false) — онбординг не трогаем');
return r;
};
startGameBound = true;
console.log('🚀 [ONBOARDING] ✅ обёрнут GAME_CORE.' + method + ' (reset-aware)');
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
  const s0 = cur();                                       // 🆕 P1: первый шаг тоже объясняем на паузе
  if (s0 && inGame() && !S.completed) setTimeout(() => showStepPause(s0), 600);
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

// 🆕 v2.5: наблюдатель за сбросом gameState — ТОЛЬКО настоящий сброс (New Game)
let lastBlocksDestroyed = null;

function watchGameStateReset() {
    const gs = window.gameState;
    if (!gs) return;
    
    // 🆕 v2.5: счётчик живёт в gameMetrics (gs.stats.blocksDestroyed не существует)
    const blocks = window.gameMetrics?.blocksDestroyed ?? gs?.stats?.blocksDestroyed ?? gs?.blocksDestroyed ?? null;
    
    // Единственный признак настоящего сброса: счётчик был >0 и стал 0.
    // Покупки/траты кристаллов его НЕ обнуляют → ложных срабатываний больше нет.
    // 🆕 v2.5: завершённый маршрут наблюдателем НЕ сбрасывается (только если это 
    // не подтверждённый New Game, когда blocksDestroyed переходит из >0 в 0).
    
    if (lastBlocksDestroyed !== null && lastBlocksDestroyed > 0 && blocks === 0) {
        console.log('🚀 [ONBOARDING] 🔄 обнаружен сброс blocksDestroyed:', lastBlocksDestroyed, '→', blocks);
        restartOnboarding('сброс blocksDestroyed (New Game)');
    }
    
    // Запоминаем текущее значение для следующей итерации
    lastBlocksDestroyed = blocks;
}

function giveCrystals(n) {
    try {
        if (window.GameEconomy?.addCrystals) return window.GameEconomy.addCrystals(n, 'onboarding');
        if (window.gameEconomy?.addCrystals) return window.gameEconomy.addCrystals(n, 'onboarding');
        if (typeof window.gameState?.coins === 'number') { 
            window.gameState.coins += n; 
            if (window.GAME_UI?.updateHUD) window.GAME_UI.updateHUD(); 
            return true; 
        }
        if (typeof window.gameState?.crystals === 'number') { 
            window.gameState.crystals += n; 
            return true; 
        }
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
function setLayer(n) {
  MOUNT.classList.remove('ob-layer-1', 'ob-layer-2', 'ob-layer-3');
  MOUNT.classList.add('ob-layer-' + n);
}

// ═══════════ 🆕 P0: «УМНЫЙ» ЗАЧЁТ ДЕЙЛИКА (последний шаг) ═══════════
function dailyStatus() {
  const gs = window.gameState;
  const d = gs?.daily || gs?.dailyBonus;
  const last = d?.lastClaimDate ?? d?.lastClaim ?? gs?.lastDailyClaimDate ?? null;
  const today = new Date().toDateString();
  const iso = new Date().toISOString().slice(0, 10);
  const claimedToday = (typeof last === 'number') ? new Date(last).toDateString() === today
    : (typeof last === 'string' && (last === today || last === iso));
  const avail = window.dailySystem?.isAvailable?.() ?? window.dailyBonusSystem?.isAvailable?.() ?? window.DailyBonus?.isAvailable?.() ?? null;
  if (claimedToday) return 'claimed';
  if (avail === false) return 'charging';
  if (avail === true) return 'ready';
  return 'unknown';
}

function autoCompleteCurrent(msg) {
  const s = cur();
  if (!s || S.completed || !S.enabled) return;
  S.prog[s.id] = s.goal;
  S.done.push(s.id); S.step++;
  giveCrystals(s.reward);
  toast(msg + ' +' + s.reward + '💎');
  if (S.done.length === STEPS.length) {
    S.completed = true; save();
    if (!completionToastShown) {
      completionToastShown = true;
      toast(L() === 'ru' ? '🏆 Обучение завершено. Удачной игры!' : '🏆 Tutorial complete. Good luck!');
      window.GameEconomy?.giveCoupon?.() || window.gameEconomy?.giveCoupon?.();
    }
    render(); return;
  }
  save(); render();
}

function checkDailySmart() {
  const s = cur();
  if (!s || s.id !== 'daily' || S.completed || !S.enabled || !inGame()) return;
  if ((S.prog.daily || 0) > 0) return;

  const st = dailyStatus();
  if (st !== 'claimed' && st !== 'charging') return;

  // 🆕 ИСПРАВЛЕНО: защита от повторного вызова в одном рендере
  if (checkDailySmart._running) return;
  checkDailySmart._running = true;

  const ru = L() === 'ru';
  const msg = st === 'claimed'
    ? (ru ? '🎁 Дейлик уже собран сегодня — шаг выполнен. Новый через ~23 ч!' : '🎁 Daily already claimed today — step done. New one in ~23 h!')
    : (ru ? '🎁 Дейлик перезаряжается — шаг выполнен. Загляни завтра!' : '🎁 Daily is recharging — step done. Come back tomorrow!');

  console.log('🚀 [DAILY-SMART] авто-завершение:', st);
  autoCompleteCurrent(msg);

  setTimeout(() => { checkDailySmart._running = false; }, 100);
}

function render() {
  if (!panel) return;
  if (!MOUNT.contains(panel)) MOUNT.appendChild(panel);

  if (S.completed) { setLayer(3); return hidePanel('обучение завершено'); }
  const done = S.done.length;
  if (!S.enabled) { setLayer(3); return hidePanel('не активирован (enabled=false)'); }
  if (!inGame()) return hidePanel('не в игре (gameActive=false и welcome виден)');
  if (done >= STEPS.length) { setLayer(3); return hidePanel('маршрут уже пройден (done=' + done + '/6)'); }
  setLayer(S.step <= 2 ? 1 : (S.step <= 4 ? 2 : 3));

  if (!shownLogged) { shownLogged = true; lastHideReason = ''; }
  panel.style.display = 'block';

  const s = cur();
  if (!s) return hidePanel('текущий шаг не определён (cur()==null)');

  // 🆕 ИСПРАВЛЕНО: checkDailySmart() вызывается ПОСЛЕ показа панели, чтобы тост не перекрывался
  checkDailySmart();
  if (S.completed || S.done.length >= STEPS.length) return;   // защита: если daily закрылся — выходим

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
  setTimeout(() => drawBeam(s.target), 500);              // 🆕 P1: луч при «Показать где»
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
    const ns = cur();                                     // 🆕 P1: пауза-объяснение следующего шага
    if (ns && inGame()) setTimeout(() => showStepPause(ns), 350);
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
// ═══════════ 🆕 v2.7: ПАУЗА-ПОДСКАЗКА ПРИ СМЕНЕ ШАГА ═══════════
let ownsPause = false;
function gamePause() {
  const P = window.GAME_CORE || window.gameCore;
  // Если игра уже на паузе от магазина/ачивок — не перехватываем
  if (window.gameState?.gamePaused || P?.isGamePaused) {
    console.log('🚀 [PAUSE] игра уже на паузе — не перехватываем (это магазин/ачивки)');
    return;
  }
  if (P?.pauseGame) {
    try { P.pauseGame.call(P); } catch (e) { console.error('pauseGame error:', e); }
  }
  // 🆕 v2.7: принудительно ставим оба флага (страхуем от рассинхрона внутри GAME_CORE)
  if (P) P.isGamePaused = true;
  if (window.gameState) window.gameState.gamePaused = true;
  ownsPause = true;
  console.log('🚀 [PAUSE] игра поставлена на паузу (ownsPause=true)');
}

function gameResume() {
  if (!ownsPause) {
    console.log('🚀 [PAUSE] пропуск resume (ownsPause=false) — пауза не наша, просто убираем оверлей');
    return;
  }
  const P = window.GAME_CORE || window.gameCore;
  if (P) P.isGamePaused = false;
  if (window.gameState) window.gameState.gamePaused = false;
  if (P?.resumeGame) {
    try { P.resumeGame.call(P); } catch (e) { console.error('resumeGame error:', e); }
  }
  // 🆕 P1: страховка — принудительно перезапускаем спавн блока после resume
  if (P?.createMovingBlock && window.gameState?.gameActive && !P.currentBlock) {
    setTimeout(() => P.createMovingBlock.call(P), 350);
    console.log('🚀 [PAUSE] перезапуск спавна блока (currentBlock был null)');
  }
  if (window.EventBus) {
    try { window.EventBus.emit('game:resumed'); } catch (e) {}
  }
  console.log('🚀 [PAUSE] флаги сброшены + resumeGame() + спавн перезапущен');
  ownsPause = false;
}

function showStepPause(s) {
  if (!s || !inGame() || S.completed || document.getElementById('obPause')) return;
  const ru = L() === 'ru';
  gamePause();
  const ov = document.createElement('div');
  ov.id = 'obPause';
  ov.innerHTML = `<div class="ob-pause-card">
      <div class="ob-pause-title">🚀 ${ru ? 'Задача' : 'Task'} ${S.step + 1}/${STEPS.length}</div>
      <div class="ob-pause-task">${ru ? s.ru : s.en}</div>
      <div class="ob-pause-hint">${ru ? s.ruHint : s.enHint}</div>
      <button class="ob-pause-btn">${ru ? '▶ Понятно, продолжить' : '▶ Got it, continue'}</button>
    </div>`;
  MOUNT.appendChild(ov);
  ov.querySelector('.ob-pause-btn').onclick = () => {
    ov.remove();
    gameResume();
    if (s.target) setTimeout(() => drawBeam(s.target), 250);   // луч к цели сразу после паузы
  };
}

// ═══════════ 🆕 P1: ТРЕК-ЛУЧ «ПАНЕЛЬ → ЦЕЛЬ» ═══════════
let beamTimer = null, beamIv = null;
function drawBeam(targetKey) {
  const target = find(targetKey);
  if (!target || !panel) return;
  removeBeam();
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'obBeamSvg';
  svg.setAttribute('class', 'ob-beam');
  svg.style.zIndex = CFG.z - 1;
  MOUNT.appendChild(svg);
  const paint = () => {
    const a = panel.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
    svg.innerHTML = `<line x1="${a.left + a.width / 2}" y1="${a.top}" x2="${b.left + b.width / 2}" y2="${b.top + b.height / 2}"/>`;
  };
  paint();
  target.classList.add('ob-hl');
  beamIv = setInterval(paint, 200);                       // луч догоняет цель, если UI сдвинулся
  beamTimer = setTimeout(() => { clearInterval(beamIv); removeBeam(); }, CFG.highlightMs);
}
function removeBeam() {
  if (beamTimer) { clearTimeout(beamTimer); beamTimer = null; }
  if (beamIv) { clearInterval(beamIv); beamIv = null; }
  document.getElementById('obBeamSvg')?.remove();
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
  st.textContent = `#obPanel{position:fixed;left:50%;transform:translateX(-50%);bottom:10px;width:min(94vw,420px);font-family:'Orbitron',system-ui,sans-serif;pointer-events:auto} .ob-bar{width:100%;background:rgba(0,0,0,.6);color:#FFD700;border:1px solid rgba(255,215,0,.5);border-radius:12px;padding:8px 14px;font-weight:700;cursor:pointer} .ob-card{background:rgba(12,10,24,.95);border:2px solid rgba(255,215,0,.35);border-radius:14px;padding:10px 12px;color:#e8e8f0;box-shadow:0 8px 30px rgba(0,0,0,.6)} .ob-head{display:flex;align-items:center;gap:8px}.ob-min{background:none;border:1px solid rgba(255,255,255,.25);color:#fff;border-radius:6px;width:24px;height:24px;cursor:pointer} .ob-title{color:#FFD700;font-weight:700;font-size:.8em} .ob-task{margin:6px 0 2px;font-size:.85em;font-weight:700}.ob-reward{color:#4CAF50} .ob-hint{font-size:.72em;color:#9aa;margin-bottom:8px} .ob-row{display:flex;align-items:center;gap:8px;justify-content:space-between} .ob-dots{display:flex;gap:4px}.ob-dots i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.2)} .ob-dots i.ok{background:#4CAF50}.ob-dots i.now{background:#FFD700;transform:scale(1.25)} .ob-btn{background:linear-gradient(135deg,#4CAF50,#388E3C);border:none;color:#fff;border-radius:10px;padding:7px 12px;font-family:inherit;font-weight:700;font-size:.75em;cursor:pointer} .ob-hl{outline:3px solid #FFD700 !important;outline-offset:3px;animation:obPulse 1s infinite} @keyframes obPulse{50%{outline-color:rgba(255,215,0,.35)}} .ob-badge::after{content:'';position:absolute;top:-4px;right:-4px;width:12px;height:12px;border-radius:50%;background:#ff3b30;box-shadow:0 0 8px #ff3b30;animation:obPulse 1.2s infinite} .ob-badge{position:relative} .ob-toast{position:fixed;left:50%;bottom:180px;transform:translateX(-50%) translateY(20px);opacity:0;transition:.35s;background:rgba(12,10,24,.97);border:2px solid rgba(76,175,80,.6);color:#e8e8f0;border-radius:12px;padding:10px 16px;font-family:'Orbitron',system-ui,sans-serif;font-size:.85em;max-width:92vw;text-align:center;pointer-events:none} .ob-toast.show{opacity:1;transform:translateX(-50%) translateY(0)} html.ob-layer-1 #hud-boc,html.ob-layer-1 #leaderboardBtn,html.ob-layer-1 #achievementsBtn,html.ob-layer-2 #hud-boc,html.ob-layer-2 #leaderboardBtn,html.ob-layer-2 #achievementsBtn{display:none!important} @media (max-width:640px){#obPanel{left:8px!important;right:78px!important;width:auto!important;transform:none!important;bottom:8px!important}.ob-bar{width:auto;display:inline-block;padding:6px 12px;font-size:.85em}.ob-card{padding:8px 10px}.ob-title{font-size:.72em}.ob-task{font-size:.8em}.ob-hint{font-size:.68em;margin-bottom:6px}.ob-btn{padding:6px 10px;font-size:.7em}} #obPause{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9995;display:flex;align-items:center;justify-content:center} .ob-pause-card{background:rgba(12,10,24,.97);border:2px solid rgba(255,215,0,.5);border-radius:16px;padding:18px 20px;max-width:min(92vw,420px);text-align:center;color:#e8e8f0;font-family:'Orbitron',system-ui,sans-serif} .ob-pause-title{color:#FFD700;font-weight:700;font-size:.85em;margin-bottom:8px} .ob-pause-task{font-weight:700;font-size:1.05em;margin-bottom:6px} .ob-pause-hint{font-size:.8em;color:#9aa;margin-bottom:12px} .ob-pause-btn{background:linear-gradient(135deg,#4CAF50,#388E3C);border:none;color:#fff;border-radius:12px;padding:10px 18px;font-family:inherit;font-weight:700;cursor:pointer} .ob-beam{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none} .ob-beam line{stroke:#FFD700;stroke-width:3;stroke-dasharray:10 8;animation:obBeam 1s linear infinite;filter:drop-shadow(0 0 6px rgba(255,215,0,.8))} @keyframes obBeam{to{stroke-dashoffset:-18}}`;
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
