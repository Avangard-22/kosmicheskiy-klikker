// js/upgrades-panel.js (v1.0) — 🚀 ПАНЕЛЬ «УЛУЧШЕНИЯ»
// Все 10 апгрейдов в одном окне (по образцу Магазина/Достижений):
// пауза при открытии, карточки, покупка через GAME_FEATURES.buyUpgrade.
(function () {
'use strict';

let panelVisible = false;

const $ = id => document.getElementById(id);
const LANG = () => window.currentLanguage || 'ru';
function tr(ru, en, zh) { const l = LANG(); return l === 'en' ? en : l === 'zh' ? zh : ru; }

function fmt(n) {
    n = Number(n);
    if (!isFinite(n)) return '0';
    if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
    if (n >= 1e9)  return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6)  return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3)  return (n / 1e3).toFixed(1) + 'K';
    return String(Math.floor(n));
}

const caps     = () => window.GAME_CONFIG?.balanceConfig?.newUpgradeMax || {};
const critCap  = () => window.GAME_CONFIG?.balanceConfig?.critChanceCap  || 1;
const multCap  = () => window.GAME_CONFIG?.balanceConfig?.critMultiplierCap || 999;
const lvlOf    = type => window.GAME_FEATURES?.upgradeLevelOf ? window.GAME_FEATURES.upgradeLevelOf(type) : 0;
const coins    = () => window.gameState?.coins || 0;

// ─── РЕЕСТР КАРТОЧЕК ───
const DEFS = [
    { type: 'clickPower', icon: '👊',
      name: tr('Сила удара', 'Click Power', '点击力量'),
      desc: tr('Увеличивает урон каждого клика.', 'Increases damage per click.', '提升每次点击的伤害。'),
      stat: gs => `👊 ${fmt(gs.clickPower)}`,
      maxed: () => false },
    { type: 'critChance', icon: '🎯',
      name: tr('Шанс крита', 'Crit Chance', '暴击几率'),
      desc: tr('Повышает шанс критического удара.', 'Raises critical hit chance.', '提升暴击几率。'),
      stat: gs => `🎯 ${((gs.critChance || 0) * 100).toFixed(1)}%`,
      maxed: gs => (gs.critChance || 0) >= critCap() },
    { type: 'critMultiplier', icon: '💥',
      name: tr('Множитель крита', 'Crit Multiplier', '暴击倍率'),
      desc: tr('Усиливает урон критических ударов.', 'Boosts critical hit damage.', '提升暴击伤害。'),
      stat: gs => `💥 x${(gs.critMultiplier || 2).toFixed(1)}`,
      maxed: gs => (gs.critMultiplier || 2) >= multCap() },
    { type: 'helper', icon: '🤖',
      name: tr('Активировать Bobo', 'Activate Bobo', '激活 Bobo'),
      desc: tr('Bobo автоматически бьёт блоки 60 секунд.', 'Bobo auto-hits blocks for 60s.', 'Bobo 自动攻击方块 60 秒。'),
      stat: gs => gs.helperActive
          ? `⏱ ${Math.max(0, Math.ceil((gs.helperTimeLeft || 0) / 1000))}с`
          : tr('Активаций: ', 'Activations: ', '激活次数: ') + (gs.helperActivations || 0),
      maxed: () => false },
    { type: 'helperDamage', icon: '🛠️',
      name: tr('Урон Bobo', 'Bobo Damage', 'Bobo 伤害'),
      desc: tr('Увеличивает урон каждого удара Bobo.', 'Increases each Bobo hit.', '提升 Bobo 每次攻击的伤害。'),
      stat: gs => `🤖 lvl ${gs.helperUpgradeLevel || 0}`,
      maxed: () => false },
    { type: 'boboSpeed', icon: '⚡',
      name: tr('Ускоритель', 'Bobo Booster', '加速器'),
      desc: tr('Bobo атакует заметно быстрее.', 'Bobo attacks much faster.', 'Bobo 攻击速度大幅提升。'),
      stat: gs => `⚡ lvl ${lvlOf('boboSpeed')}${caps().boboSpeed ? ' / ' + caps().boboSpeed : ''}`,
      maxed: gs => !!caps().boboSpeed && lvlOf('boboSpeed') >= caps().boboSpeed },
    { type: 'resonance', icon: '🔗',
      name: tr('Резонанс', 'Resonance', '共振'),
      desc: tr('Комбо держится дольше (окно 2с).', 'Combo window lasts longer (2s).', '连击窗口持续更久（2秒）。'),
      stat: gs => `🔗 lvl ${lvlOf('resonance')}${caps().resonance ? ' / ' + caps().resonance : ''}`,
      maxed: gs => !!caps().resonance && lvlOf('resonance') >= caps().resonance },
    { type: 'gravity', icon: '🪐',
      name: tr('Гравитация', 'Gravity Well', '引力'),
      desc: tr('Блоки замедляются у верхней границы.', 'Blocks slow down near the top.', '顶部附近方块减速。'),
      stat: gs => `🪐 lvl ${lvlOf('gravity')}${caps().gravity ? ' / ' + caps().gravity : ''}`,
      maxed: gs => !!caps().gravity && lvlOf('gravity') >= caps().gravity },
    { type: 'anchor', icon: '⚓',
      name: tr('Квантовый якорь', 'Quantum Anchor', '量子锚点'),
      desc: tr('Усиливает стек и кап телепортов.', 'Empowers teleport stack and cap.', '强化传送叠加与上限。'),
      stat: gs => `⚓ lvl ${lvlOf('anchor')}${caps().anchor ? ' / ' + caps().anchor : ''}`,
      maxed: gs => !!caps().anchor && lvlOf('anchor') >= caps().anchor },
    { type: 'compass', icon: '🧭',
      name: tr('Звёздный компас', 'Star Compass', '星象罗盘'),
      desc: tr('Чаще спавнятся редкие блоки.', 'More rare blocks spawn.', '稀有方块生成率提升。'),
      stat: gs => `🧭 lvl ${lvlOf('compass')}${caps().compass ? ' / ' + caps().compass : ''}`,
      maxed: gs => !!caps().compass && lvlOf('compass') >= caps().compass }
];

// ─── ОТРИСОВКА ───
function cardHtml(d, gs) {
    const isHelper = d.type === 'helper';
    const maxed = d.maxed(gs);
    const cost = window.GAME_FEATURES?.getUpgradeCost ? window.GAME_FEATURES.getUpgradeCost(d.type) : 0;
    const affordable = coins() >= cost;

    let buyInner, cls = 'upg-buy', attrs = '';
    if (isHelper && gs.helperActive) {
        const sec = Math.max(0, Math.ceil((gs.helperTimeLeft || 0) / 1000));
        buyInner = `Bobo: ${sec}с`;
        cls += ' upg-buy-active'; attrs = ' disabled';
    } else if (maxed) {
        buyInner = tr('МАКС', 'MAX', '满级');
        cls += ' upg-buy-max'; attrs = ' disabled';
    } else {
        buyInner = `${tr('Улучшить', 'Upgrade', '升级')}<span class="upg-price">💎 ${fmt(cost)}</span>`;
        if (!affordable) { cls += ' upg-buy-broke'; attrs = ' disabled'; }
    }

    return `<div class="upg-card${isHelper && gs.helperActive ? ' upg-card-active' : ''}">
        <div class="upg-ico">${d.icon}</div>
        <div class="upg-body">
            <div class="upg-name">${d.name}</div>
            <div class="upg-desc">${d.desc}</div>
            <div class="upg-stat">${d.stat(gs)}</div>
        </div>
        <button type="button" class="${cls}" data-type="${d.type}"${attrs}>${buyInner}</button>
    </div>`;
}

function renderPanel() {
    const panel = $('upgradesPanel');
    const gs = window.gameState;
    if (!panel || !gs) return;
    panel.innerHTML = `
        <div class="upg-header">
            <span class="upg-title">${tr('🚀 Улучшения', '🚀 Upgrades', '🚀 升级')}</span>
            <button type="button" class="upg-close" data-close aria-label="Закрыть">✕</button>
        </div>
        <div class="upg-grid">${DEFS.map(d => cardHtml(d, gs)).join('')}</div>
        <div class="upg-footer">💎 <b>${fmt(coins())}</b></div>`;
}

// ─── ПОКУПКА ───
function buy(type) {
    if (!window.GAME_FEATURES) return false;
    const ok = window.GAME_FEATURES.buyUpgrade(type) === true; // false при капе/нехватке 💎
    renderPanel();
    if (window.GAME_UI?.updateHUD) window.GAME_UI.updateHUD();
    return ok;
}

// ─── ОТКРЫТЬ / ЗАКРЫТЬ (пауза + эксклюзивность с shop/achievements) ───
function openPanel() {
    if (panelVisible) return;
    const panel = $('upgradesPanel');
    if (!panel) return;
    panel.style.display = 'flex';      // сначала показываем СЕБЯ
    panelVisible = true;
    if (window.shopSystem?.closeShop)            window.shopSystem.closeShop();
    if (window.AchievementsV2?.UI?.hidePanel)    window.AchievementsV2.UI.hidePanel();
    if (window.GAME_CORE?.pauseGame)             window.GAME_CORE.pauseGame();
    renderPanel();
}

function closePanel() {
    if (!panelVisible) return;
    const panel = $('upgradesPanel');
    if (!panel) return;
    panel.style.display = 'none';
    panelVisible = false;
    const shop = $('shopPanel');
    const ach = $('achievementsPanel');
    const otherOpen = (shop && shop.style.display === 'flex') ||
                      (ach && ach.style.display === 'flex');
    if (!otherOpen && window.GAME_CORE?.resumeGame) window.GAME_CORE.resumeGame();
}

function togglePanel() { if (panelVisible) closePanel(); else openPanel(); }

// ─── CSS (самодостаточно, как у Достижений) ───
const CSS = `
.upgrades-panel{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:92vw;max-width:520px;max-height:86vh;background:rgba(10,8,20,.96);border-radius:16px;border:2px solid rgba(255,215,0,.35);box-shadow:0 10px 60px rgba(0,0,0,.7);padding:14px;display:none;flex-direction:column;gap:10px;z-index:2100;backdrop-filter:blur(10px);overflow-y:auto;color:#fff;font-family:'Orbitron',system-ui,sans-serif;}
.upg-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,.12);padding-bottom:8px;}
.upg-title{color:#FFD700;font-size:1.05em;font-weight:700;}
.upg-close{background:transparent;border:none;color:#fff;font-size:1.2em;cursor:pointer;line-height:1;}
.upg-grid{display:grid;grid-template-columns:1fr;gap:8px;}
@media(min-width:480px){.upg-grid{grid-template-columns:1fr 1fr;}}
.upg-card{display:flex;gap:10px;align-items:center;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:10px;}
.upg-card-active{border-color:rgba(255,152,0,.5);}
.upg-ico{font-size:1.6em;min-width:38px;text-align:center;}
.upg-body{flex:1;min-width:0;}
.upg-name{font-weight:700;color:#FFD700;font-size:.9em;}
.upg-desc{color:rgba(255,255,255,.7);font-size:.72em;line-height:1.3;margin:2px 0 4px;}
.upg-stat{color:#4FC3F7;font-size:.78em;font-family:monospace;}
.upg-buy{flex-shrink:0;min-width:86px;background:linear-gradient(135deg,#4CAF50,#2E7D32);border:none;border-radius:10px;color:#fff;padding:8px 6px;font-size:.72em;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;gap:2px;align-items:center;}
.upg-buy:disabled{opacity:.45;cursor:default;}
.upg-buy-max{background:linear-gradient(135deg,#666,#444);}
.upg-buy-active{background:linear-gradient(135deg,#FF9800,#E65100);}
.upg-buy-broke{background:linear-gradient(135deg,#455A64,#263238);}
.upg-price{color:#FFD700;font-size:.9em;}
.upg-footer{text-align:center;color:rgba(255,255,255,.8);font-size:.85em;border-top:1px solid rgba(255,255,255,.12);padding-top:8px;}
#upgradesBtn{position:absolute;right:8px;bottom:70px;}
.upg-badge{position:absolute;bottom:2px;right:2px;background:#FF9800;color:#000;border-radius:8px;font-size:.55em;padding:0 4px;font-weight:700;display:flex;align-items:center;height:14px;}
`;

// ─── ИНИЦИАЛИЗАЦИЯ ───
function onClickPanel(e) {
    if (e.target.closest('[data-close]')) { closePanel(); return; }
    const btn = e.target.closest('[data-type]');
    if (btn && !btn.disabled) buy(btn.dataset.type);
}

function init() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const btn = $('upgradesBtn');
    const panel = $('upgradesPanel');
    if (!btn || !panel) { console.warn('⚠️ [UPG] #upgradesBtn или #upgradesPanel не найдены'); return; }

    btn.addEventListener('click', togglePanel);
    btn.addEventListener('touchstart', e => { e.preventDefault(); togglePanel(); }, { passive: false });
    panel.addEventListener('click', onClickPanel);

    // Закрытие ТОЛЬКО по клику вне панели / Escape.
    // Клик внутри панели не закрывает окно, даже если покупка
    // перерисовала DOM прямо во время события (pointerdown фиксирует точку до перерисовки).
    let clickStartedInside = false;
    document.addEventListener('pointerdown', e => {
        const p = $('upgradesPanel'), b = $('upgradesBtn');
        clickStartedInside = !!(p && b && (p.contains(e.target) || b.contains(e.target)));
    }, true); // capture — срабатывает раньше любых перерисовок

    document.addEventListener('click', e => {
        if (!panelVisible) return;
        if (clickStartedInside) { clickStartedInside = false; return; } // клик начался в панели — не закрываем
        const p = $('upgradesPanel'), b = $('upgradesBtn');
        if (p && b && !p.contains(e.target) && !b.contains(e.target)) closePanel();
    });

    document.addEventListener('keydown', e => { if (e.key === 'Escape' && panelVisible) closePanel(); });

    // Тикер: бейдж секунд Bobo на иконке + живой таймер в карточке (когда панель открыта)
    setInterval(() => {
        const gs = window.gameState, hub = $('upgradesBtn');
        if (!gs || !hub) return;
        const active = !!gs.helperActive;
        let badge = hub.querySelector('.upg-badge');
        if (active) {
            if (!badge) { badge = document.createElement('span'); badge.className = 'upg-badge'; hub.appendChild(badge); }
            badge.textContent = Math.max(0, Math.ceil((gs.helperTimeLeft || 0) / 1000)) + 'с';
            badge.style.display = 'flex';
        } else if (badge) {
            badge.style.display = 'none';
        }
        if (panelVisible && active) renderPanel(); // обновляем таймер в открытой панели
    }, 1000);

    window.upgradesSystem = {
        isOpen: () => panelVisible,
        openPanel, closePanel, togglePanel,
        refresh: renderPanel
    };
    console.log('🔧 [UPG] Панель улучшений готова');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
})();
