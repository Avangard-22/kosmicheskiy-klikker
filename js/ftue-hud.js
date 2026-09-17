// js/ftue-hud.js — 🧹 P3 v2: автономное управление HUD (без this, без GAME_CORE)
// Правила: Сила/Крит/Множитель и строка BoC внутри #hud-left скрыты ВСЕГДА;
//          #hud-boc скрыт до 25% прогресса (Меркурий, Ран 1), затем reveal + пульс + тост.
(function () {
'use strict';
const HIDE_VALUE_IDS = ['clickPower-value', 'critChance-value', 'critMultiplier-value'];
let wasEarly = null;

function cfg() { return window.GAME_CONFIG || window.CFG || {}; }
function progressPercent() {
  const gs = window.gameState;
  if (!gs) return 0;
  const planet = gs.currentLocation || 'mercury';
  const C = cfg();
  const targetAU = C.PROGRESSION_CONFIG?.[planet]?.targetAU || C.astronomicalUnits?.[planet] || 0.38710;
  const target = targetAU * (C.AU_TO_DAMAGE || 149597870.691);
  const pd = gs.planetDamageDealt || 0;
  return target > 0 ? (pd / target) * 100 : 0;
}
function isEarly() {
  const gs = window.gameState;
  if (!gs) return false;
  return (gs.runNumber ?? 1) === 1 && (gs.currentLocation || 'mercury') === 'mercury' && progressPercent() < 25;
}
function apply() {
  const early = isEarly();
  document.documentElement.classList.toggle('ftue-early', early);

  // 1) Сила/Крит/Множитель + дубль-строка BoC внутри #hud-left — скрыты ВСЕГДА
  document.querySelectorAll('#hud-left .hud-item').forEach(el => {
    const mustHide = HIDE_VALUE_IDS.some(id => el.querySelector('#' + id)) ||
                     /BoC/i.test(el.textContent || '');
    if (mustHide && el.style.display !== 'none') el.style.display = 'none';
    if (!mustHide && el.style.display === 'none') el.style.display = '';
  });

  // 2) #hud-boc — скрыт до 25%, после — показан
  const boc = document.getElementById('hud-boc');
  if (boc) boc.style.display = early ? 'none' : '';

  // 3) Пересечение порога → reveal
  if (wasEarly === true && early === false) {
    console.log('🧹 [FTUE-P3] порог 25% пройден — BoC раскрыт');
    const msg = '📊 25% прогресса: BoC открыт!';
    if (window.Onboarding?.toast) window.Onboarding.toast(msg);
    else if (window.showNotification) window.showNotification(msg, '#4FC3F7');
    if (boc) { boc.classList.add('ftue-reveal'); setTimeout(() => boc.classList.remove('ftue-reveal'), 3200); }
  }
  wasEarly = early;
}
setInterval(apply, 1500);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(apply, 500));
else setTimeout(apply, 500);
console.log('🧹 [FTUE-P3] v2 standalone загружен');
})();