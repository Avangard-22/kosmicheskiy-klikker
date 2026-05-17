// achievements.js
(function() {
'use strict';
const achievements = {
blockBreaker: {
levels: [
{ id: 'novice', target: 10, reward: 100, name: 'Новичок' },
{ id: 'apprentice', target: 50, reward: 250, name: 'Ученик' },
{ id: 'journeyman', target: 200, reward: 500, name: 'Подмастерье' },
{ id: 'expert', target: 1000, reward: 1000, name: 'Эксперт' },
{ id: 'master', target: 5000, reward: 2500, name: 'Мастер' },
{ id: 'grandmaster', target: 20000, reward: 5000, name: 'Гроссмейстер' },
{ id: 'legend', target: 100000, reward: 10000, name: 'Легенда' },
{ id: 'mythical', target: 500000, reward: 25000, name: 'Мифический' },
{ id: 'divine', target: 1000000, reward: 50000, name: 'Божественный' },
{ id: 'cosmic', target: 5000000, reward: 100000, name: 'Космический' }
],
icon: 'fas fa-hammer',
description: 'Разрушить блоков'
},
crystalCollector: {
levels: [
{ id: 'rich', target: 1000, reward: 500, name: 'Богач' },
{ id: 'wealthy', target: 10000, reward: 2500, name: 'Состоятельный' },
{ id: 'millionaire', target: 100000, reward: 10000, name: 'Миллионер' },
{ id: 'tycoon', target: 1000000, reward: 25000, name: 'Магнат' },
{ id: 'crystalKing', target: 10000000, reward: 100000, name: 'Король кристаллов' },
{ id: 'crystalEmperor', target: 50000000, reward: 250000, name: 'Император' },
{ id: 'crystalGod', target: 100000000, reward: 500000, name: 'Бог кристаллов' },
{ id: 'crystalUniverse', target: 500000000, reward: 1000000, name: 'Вселенная' },
{ id: 'crystalInfinity', target: 1000000000, reward: 2500000, name: 'Бесконечность' },
{ id: 'crystalOmnipotent', target: 5000000000, reward: 5000000, name: 'Всемогущий' }
],
icon: 'fas fa-gem',
description: 'Собрать кристаллов'
},
critSpecialist: {
levels: [
{ id: 'critMaster', target: 50, reward: 300, name: 'Мастер крита' },
{ id: 'critExpert', target: 500, reward: 1500, name: 'Эксперт крита' },
{ id: 'critChampion', target: 2500, reward: 5000, name: 'Чемпион крита' },
{ id: 'critGod', target: 10000, reward: 20000, name: 'Бог крита' },
{ id: 'critLegend', target: 50000, reward: 50000, name: 'Легенда крита' },
{ id: 'critMythical', target: 200000, reward: 100000, name: 'Мифический' },
{ id: 'critDivine', target: 1000000, reward: 250000, name: 'Божественный' },
{ id: 'critCosmic', target: 5000000, reward: 500000, name: 'Космический' }
],
icon: 'fas fa-star',
description: 'Нанести критических ударов'
},
upgrader: {
levels: [
{ id: 'upgradeStarter', target: 5, reward: 200, name: 'Начинающий' },
{ id: 'upgradeEnthusiast', target: 15, reward: 500, name: 'Энтузиаст' },
{ id: 'upgradeMaster', target: 30, reward: 1000, name: 'Мастер' },
{ id: 'upgradePerfectionist', target: 50, reward: 2500, name: 'Перфекционист' },
{ id: 'upgradeGenius', target: 100, reward: 5000, name: 'Гений' },
{ id: 'upgradeVisionary', target: 200, reward: 10000, name: 'Визионер' },
{ id: 'upgradeArchitect', target: 500, reward: 25000, name: 'Архитектор' },
{ id: 'upgradeTranscendent', target: 1000, reward: 50000, name: 'Трансцендент' }
],
icon: 'fas fa-chart-line',
description: 'Купить улучшений'
},
helperExpert: {
levels: [
{ id: 'helperNovice', target: 1, reward: 300, name: 'Новичок' },
{ id: 'helperSpecialist', target: 5, reward: 1000, name: 'Специалист' },
{ id: 'helperMaster', target: 10, reward: 2500, name: 'Мастер' },
{ id: 'helperCommander', target: 25, reward: 5000, name: 'Командир' },
{ id: 'helperLegend', target: 50, reward: 10000, name: 'Легенда' },
{ id: 'helperCosmic', target: 100, reward: 25000, name: 'Космический' }
],
icon: 'fas fa-robot',
description: 'Нанять помощников'
},
boosterUser: {
levels: [
{ id: 'boosterBeginner', target: 3, reward: 200, name: 'Новичок' },
{ id: 'boosterRegular', target: 10, reward: 600, name: 'Регулярный' },
{ id: 'boosterAddict', target: 25, reward: 1500, name: 'Зависимый' },
{ id: 'boosterMaster', target: 50, reward: 3000, name: 'Мастер' },
{ id: 'boosterLegend', target: 100, reward: 7500, name: 'Легенда' },
{ id: 'boosterCosmic', target: 250, reward: 15000, name: 'Космический' }
],
icon: 'fas fa-bolt',
description: 'Использовать бустов'
},
planetExplorer: {
levels: [
{ id: 'mercuryExplorer', target: 1, reward: 100, name: 'Меркурий' },
{ id: 'venusExplorer', target: 2, reward: 200, name: 'Венера' },
{ id: 'earthExplorer', target: 3, reward: 300, name: 'Земля' },
{ id: 'marsExplorer', target: 4, reward: 400, name: 'Марс' },
{ id: 'jupiterExplorer', target: 5, reward: 500, name: 'Юпитер' },
{ id: 'saturnExplorer', target: 6, reward: 600, name: 'Сатурн' },
{ id: 'uranusExplorer', target: 7, reward: 700, name: 'Уран' },
{ id: 'neptuneExplorer', target: 8, reward: 800, name: 'Нептун' },
{ id: 'plutoExplorer', target: 9, reward: 900, name: 'Плутон' },
{ id: 'solarSystemMaster', target: 9, reward: 5000, name: 'Мастер СС' },
{ id: 'galaxyExplorer', target: 9, reward: 10000, name: 'Исследователь галактики' },
{ id: 'universeConqueror', target: 9, reward: 25000, name: 'Покоритель вселенной' }
],
icon: 'fas fa-globe-americas',
description: 'Исследовать планет'
},
comboMaster: {
levels: [
{ id: 'comboApprentice', target: 10, reward: 200, name: 'Ученик' },
{ id: 'comboExpert', target: 25, reward: 500, name: 'Эксперт' },
{ id: 'comboMaster', target: 50, reward: 1000, name: 'Мастер' },
{ id: 'comboGod', target: 100, reward: 2500, name: 'Бог комбо' },
{ id: 'comboLegend', target: 200, reward: 5000, name: 'Легенда' },
{ id: 'comboMythical', target: 500, reward: 10000, name: 'Мифический' },
{ id: 'comboDivine', target: 1000, reward: 25000, name: 'Божественный' },
{ id: 'comboCosmic', target: 2500, reward: 50000, name: 'Космический' }
],
icon: 'fas fa-fire',
description: 'Достигнуть комбо'
},
totalDamage: {
levels: [
{ id: 'damage1k', target: 1000, reward: 500, name: '1K урона' },
{ id: 'damage10k', target: 10000, reward: 2000, name: '10K урона' },
{ id: 'damage100k', target: 100000, reward: 5000, name: '100K урона' },
{ id: 'damage1m', target: 1000000, reward: 15000, name: '1M урона' },
{ id: 'damage10m', target: 10000000, reward: 50000, name: '10M урона' },
{ id: 'damage100m', target: 100000000, reward: 150000, name: '100M урона' },
{ id: 'damage1b', target: 1000000000, reward: 500000, name: '1B урона' },
{ id: 'damageCosmic', target: 10000000000, reward: 1000000, name: 'Космический урон' }
],
icon: 'fas fa-bomb',
description: 'Нанести общего урона'
},
playTime: {
levels: [
{ id: 'time1min', target: 60, reward: 100, name: '1 минута' },
{ id: 'time5min', target: 300, reward: 500, name: '5 минут' },
{ id: 'time15min', target: 900, reward: 1500, name: '15 минут' },
{ id: 'time30min', target: 1800, reward: 3000, name: '30 минут' },
{ id: 'time1hour', target: 3600, reward: 7500, name: '1 час' },
{ id: 'time5hours', target: 18000, reward: 20000, name: '5 часов' },
{ id: 'time10hours', target: 36000, reward: 50000, name: '10 часов' },
{ id: 'timeLegend', target: 86400, reward: 100000, name: '24 часа' }
],
icon: 'fas fa-clock',
description: 'Провести времени в игре (сек)'
},
rareBlocks: {
levels: [
{ id: 'rare1', target: 1, reward: 500, name: 'Первый редкий' },
{ id: 'rare10', target: 10, reward: 2000, name: '10 редких' },
{ id: 'rare50', target: 50, reward: 5000, name: '50 редких' },
{ id: 'rare100', target: 100, reward: 10000, name: '100 редких' },
{ id: 'rare500', target: 500, reward: 25000, name: '500 редких' },
{ id: 'rare1000', target: 1000, reward: 50000, name: '1000 редких' }
],
icon: 'fas fa-star',
description: 'Разрушить редких блоков'
},
totalClicks: {
levels: [
{ id: 'clicks100', target: 100, reward: 100, name: '100 кликов' },
{ id: 'clicks1k', target: 1000, reward: 500, name: '1K кликов' },
{ id: 'clicks10k', target: 10000, reward: 2000, name: '10K кликов' },
{ id: 'clicks100k', target: 100000, reward: 7500, name: '100K кликов' },
{ id: 'clicks1m', target: 1000000, reward: 25000, name: '1M кликов' },
{ id: 'clicksLegend', target: 10000000, reward: 100000, name: 'Легенда кликов' }
],
icon: 'fas fa-hand-pointer',
description: 'Совершить кликов'
},
accuracy: {
levels: [
{ id: 'accuracy10', target: 10, reward: 500, name: '10% точность' },
{ id: 'accuracy25', target: 25, reward: 1500, name: '25% точность' },
{ id: 'accuracy50', target: 50, reward: 5000, name: '50% точность' },
{ id: 'accuracy75', target: 75, reward: 15000, name: '75% точность' },
{ id: 'accuracy90', target: 90, reward: 50000, name: '90% точность' },
{ id: 'accuracyPerfect', target: 95, reward: 100000, name: 'Идеальная' }
],
icon: 'fas fa-bullseye',
description: 'Точность критов (%)'
},
sessions: {
levels: [
{ id: 'sessions10', target: 10, reward: 200, name: '10 сессий' },
{ id: 'sessions50', target: 50, reward: 1000, name: '50 сессий' },
{ id: 'sessions100', target: 100, reward: 2500, name: '100 сессий' },
{ id: 'sessions500', target: 500, reward: 7500, name: '500 сессий' },
{ id: 'sessions1000', target: 1000, reward: 20000, name: '1000 сессий' },
{ id: 'sessionsLegend', target: 5000, reward: 50000, name: 'Легенда' }
],
icon: 'fas fa-play-circle',
description: 'Завершить сессий'
}
};

let achievementsPanelVisible = false;
let totalAchievements = 0;
let unlockedAchievements = 0;

function init() {
calculateTotalAchievements();
createAchievementsPanel();
setupEventHandlers();
updateAchievementsDisplay();
checkSavedAchievements();
}

function calculateTotalAchievements() {
totalAchievements = 0;
Object.values(achievements).forEach(category => {
totalAchievements += category.levels.length;
});
}

// ✅ ИСПРАВЛЕННАЯ функция createAchievementsPanel
function createAchievementsPanel() {
    const panel = document.getElementById('achievementsPanel');
    if (!panel) return;
    
    panel.innerHTML = '';
    
    const title = document.createElement('h3');
    title.textContent = '🏆 Достижения';
    title.style.marginBottom = '15px';
    panel.appendChild(title);

const progressContainer = document.createElement('div');
progressContainer.style.cssText = 'width:100%;background:#333;border-radius:10px;margin-bottom:15px;overflow:hidden;border:2px solid #444;';

const progressBar = document.createElement('div');
progressBar.id = 'achievementsProgressBar';
progressBar.style.cssText = 'height:10px;background:linear-gradient(90deg,#4CAF50,#8BC34A);width:0%;border-radius:5px;transition:width 0.5s ease;';

const progressText = document.createElement('div');
progressText.id = 'achievementsProgressText';
progressText.style.cssText = 'text-align:center;font-size:0.8em;color:#fff;padding:5px;font-family:Orbitron,sans-serif;';

progressContainer.appendChild(progressBar);
panel.appendChild(progressContainer);
panel.appendChild(progressText);

Object.entries(achievements).forEach(([catId, cat]) => {
const catDiv = document.createElement('div');
catDiv.className = 'achievement-category';
catDiv.style.cssText = 'margin-bottom:20px;border-bottom:1px solid #444;padding-bottom:10px;';

const catTitle = document.createElement('div');
catTitle.style.cssText = 'display:flex;align-items:center;margin-bottom:10px;font-weight:bold;color:#4FC3F7;font-size:1.1em;';
catTitle.innerHTML = `<i class="${cat.icon}" style="margin-right:8px;"></i>${cat.description}`;
catDiv.appendChild(catTitle);

cat.levels.forEach((level, idx) => {
const itemId = `achievement${capitalizeFirstLetter(catId + '_' + level.id)}`;
const item = document.createElement('div');
item.className = 'achievement-item';
item.id = itemId;
item.style.cssText = 'background:linear-gradient(135deg,rgba(40,40,60,0.8),rgba(30,30,50,0.9));border-radius:8px;padding:10px;margin-bottom:8px;display:flex;align-items:center;border:1px solid #444;position:relative;transition:all 0.3s ease;min-height:60px;';
item.style.background = [
'rgba(100,150,255,0.1)','rgba(100,200,255,0.15)','rgba(150,100,255,0.2)',
'rgba(200,100,255,0.25)','rgba(255,100,150,0.3)','rgba(255,150,100,0.35)','rgba(255,200,100,0.4)'
][idx % 7];

item.innerHTML = `
<i class="${cat.icon}" style="font-size:1.5em;margin-right:10px;color:#FFD700;"></i>
<div style="flex:1;">
<span class="achievement-name" style="font-weight:bold;display:block;color:#fff;">${level.name}</span>
<span class="achievement-description" style="font-size:0.75em;opacity:0.8;">${cat.description}: ${level.target}</span>
<div class="achievement-reward" style="display:flex;align-items:center;font-size:0.8em;margin-top:3px;color:#FFD700;">
<i class="fas fa-gem" style="margin-right:3px;"></i>${level.reward}
</div>
</div>
<div class="achievement-progress" style="margin-left:auto;color:#4FC3F7;font-size:0.8em;font-weight:bold;font-family:Orbitron,sans-serif;">0%</div>
`;
catDiv.appendChild(item);
});
panel.appendChild(catDiv);
});
}

// ✅ ИСПРАВЛЕННАЯ функция setupEventHandlers
function setupEventHandlers() {
    const btn = document.getElementById('achievementsBtn');
    const panel = document.getElementById('achievementsPanel');
    if (!btn || !panel) return;
    
    // ✅ НЕ клонируем кнопку, просто добавляем обработчики
    btn.addEventListener('click', toggleAchievementsPanel);
    btn.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        toggleAchievementsPanel(); 
    }, { passive: false });

    document.addEventListener('click', (e) => {
        if (achievementsPanelVisible && 
            !panel.contains(e.target) && 
            !btn.contains(e.target)) {
            hideAchievementsPanel();
        }
    });
}

function toggleAchievementsPanel() {
const panel = document.getElementById('achievementsPanel');
if (!panel) return;
if (achievementsPanelVisible) hideAchievementsPanel();
else showAchievementsPanel();
}

function showAchievementsPanel() {
const panel = document.getElementById('achievementsPanel');
if (!panel) return;
panel.style.display = 'flex';
achievementsPanelVisible = true;
updateAchievementsDisplay();
if (window.shopSystem && typeof window.shopSystem.closeShop === 'function') {
window.shopSystem.closeShop();
}
}

function hideAchievementsPanel() {
const panel = document.getElementById('achievementsPanel');
if (!panel) return;
panel.style.display = 'none';
achievementsPanelVisible = false;
}

function updateProgress(categoryId, value) {
if (!window.gameState || !window.gameState.achievements) return;
const catData = achievements[categoryId];
if (!catData) return;
if (!window.gameState.achievements[categoryId]) {
window.gameState.achievements[categoryId] = { progress: 0, levels: {} };
}
window.gameState.achievements[categoryId].progress = value;

catData.levels.forEach(level => {
const state = window.gameState.achievements[categoryId].levels[level.id];
if (!state || state.unlocked) return;
if (value >= level.target) unlockAchievement(categoryId, level.id);
});

updateAchievementsDisplay();
if (typeof window.saveGame === 'function') window.saveGame();
}

function unlockAchievement(catId, levelId) {
if (!window.gameState || !window.gameState.achievements) return;
const catData = achievements[catId];
const level = catData.levels.find(l => l.id === levelId);
const state = window.gameState.achievements[catId]?.levels[levelId];
if (!level || !state || state.unlocked) return;

state.unlocked = true;
state.progress = level.target;
window.gameState.coins += level.reward;
unlockedAchievements++;

updateAchievementsCounter();
if (typeof window.updateHUD === 'function') window.updateHUD();
if (typeof window.updateUpgradeButtons === 'function') window.updateUpgradeButtons();
showAchievementNotification(catId, levelId);

// ✅ ИСПРАВЛЕНО: Используем GAME_CORE.playSound вместо window.playSound
if (window.GAME_CORE && typeof window.GAME_CORE.playSound === 'function') {
window.GAME_CORE.playSound('upgradeSound');
} else {
const s = document.getElementById('upgradeSound');
if (s) { s.currentTime = 0; s.play().catch(() => {}); }
}

if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
if (typeof window.saveGame === 'function') window.saveGame();
}

function showAchievementNotification(catId, levelId) {
const catData = achievements[catId];
const level = catData.levels.find(l => l.id === levelId);
if (!level) return;
const notif = document.createElement('div');
notif.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,rgba(255,215,0,0.95),rgba(255,140,0,0.95));color:#000;padding:15px 25px;border-radius:15px;z-index:2000;text-align:center;font-family:Orbitron,sans-serif;font-weight:bold;box-shadow:0 5px 25px rgba(255,215,0,0.5);animation:achSlideDown 0.5s ease-out;max-width:350px;width:90%;border:3px solid #fff;';

const idx = catData.levels.findIndex(l => l.id === levelId);
notif.innerHTML = `
<div style="font-size:2em;margin-bottom:10px;">${'★'.repeat(idx+1)}</div>
<div style="font-size:1.5em;margin-bottom:5px;">🏆 ДОСТИЖЕНИЕ!</div>
<div style="font-size:1.2em;margin-bottom:10px;color:#fff;">${level.name}</div>
<div style="font-size:0.9em;margin-bottom:15px;color:#eee;">${catData.description}: ${level.target}</div>
<div style="font-size:1.1em;color:#FFD700;"><i class="fas fa-gem" style="margin-right:3px;"></i>Награда: ${level.reward.toLocaleString()}</div>
<div style="margin-top:15px;font-size:0.8em;color:#ccc;">${unlockedAchievements}/${totalAchievements} (${Math.round((unlockedAchievements/totalAchievements)*100)}%)</div>
`;

document.body.appendChild(notif);
setTimeout(() => {
notif.style.animation = 'achSlideUp 0.5s ease-in forwards';
setTimeout(() => notif.parentNode?.removeChild(notif), 500);
}, 3000);

if (!document.getElementById('ach-anim-style')) {
const style = document.createElement('style');
style.id = 'ach-anim-style';
style.textContent = `@keyframes achSlideDown{from{top:-100px;opacity:0;transform:translateX(-50%) scale(0.8);}to{top:20%;opacity:1;transform:translateX(-50%) scale(1);}}@keyframes achSlideUp{from{top:20%;opacity:1;transform:translateX(-50%) scale(1);}to{top:-100px;opacity:0;transform:translateX(-50%) scale(0.8);}}.achievement-item.unlocked{border-color:#FFD700!important;box-shadow:0 0 15px rgba(255,215,0,0.5);background:linear-gradient(135deg,rgba(255,215,0,0.1),rgba(255,140,0,0.15))!important;}`;
document.head.appendChild(style);
}
}

function updateAchievementsCounter() {
const btn = document.getElementById('achievementsBtn');
if (!btn) return;
let span = btn.querySelector('#achievementsCount');
if (!span) {
span = document.createElement('span');
span.id = 'achievementsCount';
span.style.cssText = 'font-size:0.55em;margin-left:3px;position:absolute;bottom:2px;right:8px;font-weight:bold;';
btn.appendChild(span);
}
span.textContent = `${unlockedAchievements}/${totalAchievements}`;
updateAchievementsProgressBar();
}

function updateAchievementsProgressBar() {
const bar = document.getElementById('achievementsProgressBar');
const txt = document.getElementById('achievementsProgressText');
if (!bar || !txt) return;
const pct = totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0;
bar.style.width = pct + '%';
txt.textContent = `Разблокировано: ${unlockedAchievements}/${totalAchievements} (${Math.round(pct)}%)`;
}

function updateAchievementsDisplay() {
if (!window.gameState) return;
unlockedAchievements = 0;
Object.entries(achievements).forEach(([catId, cat]) => {
const catState = window.gameState.achievements?.[catId];
if (!catState) return;

cat.levels.forEach(level => {
const state = catState.levels[level.id];
if (!state) return;

const itemId = `achievement${capitalizeFirstLetter(catId + '_' + level.id)}`;
const item = document.getElementById(itemId);
if (!item) return;

const progEl = item.querySelector('.achievement-progress');
if (progEl) {
if (state.unlocked) {
progEl.textContent = 'РАЗБЛОКИРОВАНО';
progEl.style.color = '#4CAF50';
item.classList.add('unlocked');
unlockedAchievements++;
} else {
const pct = Math.min((catState.progress / level.target) * 100, 100);
progEl.textContent = `${Math.round(pct)}% (${catState.progress}/${level.target})`;
progEl.style.color = '#4FC3F7';
item.classList.remove('unlocked');
}
}
});
});
updateAchievementsCounter();
}

function checkSavedAchievements() {
if (!window.gameState.achievements) window.gameState.achievements = {};
Object.entries(achievements).forEach(([catId, cat]) => {
if (!window.gameState.achievements[catId]) {
window.gameState.achievements[catId] = { progress: 0, levels: {} };
}
cat.levels.forEach(level => {
if (!window.gameState.achievements[catId].levels[level.id]) {
window.gameState.achievements[catId].levels[level.id] = { unlocked: false, progress: 0 };
}
});
});

const gm = window.gameMetrics || {};
if (gm.blocksDestroyed !== undefined) updateProgress('blockBreaker', gm.blocksDestroyed);
if (gm.totalCoinsEarned !== undefined) updateProgress('crystalCollector', gm.totalCoinsEarned);
if (gm.totalCrits !== undefined) updateProgress('critSpecialist', gm.totalCrits);
if (gm.upgradesBought !== undefined) updateProgress('upgrader', gm.upgradesBought);
if (gm.helpersBought !== undefined) updateProgress('helperExpert', gm.helpersBought);
if (gm.boostersUsed !== undefined) updateProgress('boosterUser', gm.boostersUsed);
if (window.gameState.currentLocation) {
const idx = ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune','pluto'].indexOf(window.gameState.currentLocation) + 1;
if (idx > 0) updateProgress('planetExplorer', idx);
}
if (gm.maxCombo !== undefined) updateProgress('comboMaster', gm.maxCombo);
if (window.gameState.totalDamageDealt !== undefined) updateProgress('totalDamage', window.gameState.totalDamageDealt);
if (gm.totalClicks !== undefined) updateProgress('totalClicks', gm.totalClicks);
if (gm.sessions !== undefined) updateProgress('sessions', gm.sessions);

updateAchievementsDisplay();
}

function capitalizeFirstLetter(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

window.achievementsSystem = {
init, toggleAchievementsPanel: toggleAchievementsPanel, showAchievementsPanel, hideAchievementsPanel,
updateProgress, unlockAchievement, updateAchievementsDisplay,
getUnlockedCount: () => unlockedAchievements, getTotalCount: () => totalAchievements,
incrementBlocksDestroyed: (c=1) => { if(!window.gameMetrics)window.gameMetrics={}; window.gameMetrics.blocksDestroyed=(window.gameMetrics.blocksDestroyed||0)+c; updateProgress('blockBreaker',window.gameMetrics.blocksDestroyed); },
incrementCoinsEarned: (a) => { if(!window.gameMetrics)window.gameMetrics={}; window.gameMetrics.totalCoinsEarned=(window.gameMetrics.totalCoinsEarned||0)+a; updateProgress('crystalCollector',window.gameMetrics.totalCoinsEarned); },
incrementCrits: (c=1) => { if(!window.gameMetrics)window.gameMetrics={}; window.gameMetrics.totalCrits=(window.gameMetrics.totalCrits||0)+c; updateProgress('critSpecialist',window.gameMetrics.totalCrits); },
incrementUpgrades: (c=1) => { if(!window.gameMetrics)window.gameMetrics={}; window.gameMetrics.upgradesBought=(window.gameMetrics.upgradesBought||0)+c; updateProgress('upgrader',window.gameMetrics.upgradesBought); },
incrementHelpers: (c=1) => { if(!window.gameMetrics)window.gameMetrics={}; window.gameMetrics.helpersBought=(window.gameMetrics.helpersBought||0)+c; updateProgress('helperExpert',window.gameMetrics.helpersBought); },
incrementBoosters: (c=1) => { if(!window.gameMetrics)window.gameMetrics={}; window.gameMetrics.boostersUsed=(window.gameMetrics.boostersUsed||0)+c; updateProgress('boosterUser',window.gameMetrics.boostersUsed); },
updatePlanetProgress: (lvl) => updateProgress('planetExplorer', lvl),
updateCombo: (combo) => { if(!window.gameMetrics)window.gameMetrics={}; if(combo>(window.gameMetrics.maxCombo||0)){window.gameMetrics.maxCombo=combo;updateProgress('comboMaster',combo);} },
incrementRareBlocks: (c=1) => { if(!window.gameMetrics)window.gameMetrics={}; window.gameMetrics.rareBlocksDestroyed=(window.gameMetrics.rareBlocksDestroyed||0)+c; updateProgress('rareBlocks',window.gameMetrics.rareBlocksDestroyed); }
};

// ✅ ИСПРАВЛЕННАЯ функция safeInit
function safeInit() {
    if (!document.getElementById('achievementsBtn')) { 
        setTimeout(safeInit, 200); 
        return; 
    }
    if (!window.gameState) { 
        setTimeout(safeInit, 200); 
        return; 
    }
    // ✅ Добавлена проверка GAME_CORE
    if (!window.GAME_CORE) { 
        setTimeout(safeInit, 200); 
        return; 
    }
    init();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(safeInit, 300));
else setTimeout(safeInit, 300);
})();