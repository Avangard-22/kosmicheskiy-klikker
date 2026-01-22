// Система достижений с прогрессивной шкалой
(function() {
const achievements = {
// Разрушение блоков (прогрессивная шкала)
blockBreaker: {
levels: [
{ id: 'novice', target: 10, reward: 100, name: 'Новичок' },
{ id: 'apprentice', target: 50, reward: 250, name: 'Ученик' },
{ id: 'journeyman', target: 200, reward: 500, name: 'Подмастерье' },
{ id: 'expert', target: 1000, reward: 1000, name: 'Эксперт' },
{ id: 'master', target: 5000, reward: 2500, name: 'Мастер' },
{ id: 'grandmaster', target: 20000, reward: 5000, name: 'Гроссмейстер' },
{ id: 'legend', target: 100000, reward: 10000, name: 'Легенда' }
],
icon: 'fas fa-hammer',
description: 'Разрушить блоков'
},
// Кристаллы (прогрессивная шкала)
crystalCollector: {
levels: [
{ id: 'rich', target: 1000, reward: 500, name: 'Богач' },
{ id: 'wealthy', target: 10000, reward: 2500, name: 'Состоятельный' },
{ id: 'millionaire', target: 100000, reward: 10000, name: 'Миллионер' },
{ id: 'tycoon', target: 1000000, reward: 25000, name: 'Магнат' },
{ id: 'crystalKing', target: 10000000, reward: 100000, name: 'Король кристаллов' }
],
icon: 'fas fa-gem',
description: 'Собрать кристаллов'
},
// Критические удары (прогрессивная шкала)
critSpecialist: {
levels: [
{ id: 'critMaster', target: 50, reward: 300, name: 'Мастер крита' },
{ id: 'critExpert', target: 500, reward: 1500, name: 'Эксперт крита' },
{ id: 'critChampion', target: 2500, reward: 5000, name: 'Чемпион крита' },
{ id: 'critGod', target: 10000, reward: 20000, name: 'Бог крита' }
],
icon: 'fas fa-star',
description: 'Нанести критических ударов'
},
// Улучшения
upgrader: {
levels: [
{ id: 'upgradeStarter', target: 5, reward: 200, name: 'Начинающий улучшатель' },
{ id: 'upgradeEnthusiast', target: 15, reward: 500, name: 'Энтузиаст улучшений' },
{ id: 'upgradeMaster', target: 30, reward: 1000, name: 'Мастер улучшений' },
{ id: 'upgradePerfectionist', target: 50, reward: 2500, name: 'Перфекционист улучшений' }
],
icon: 'fas fa-chart-line',
description: 'Купить улучшений'
},
// Помощники
helperExpert: {
levels: [
{ id: 'helperNovice', target: 1, reward: 300, name: 'Новичок помощников' },
{ id: 'helperSpecialist', target: 5, reward: 1000, name: 'Специалист помощников' },
{ id: 'helperMaster', target: 10, reward: 2500, name: 'Мастер помощников' }
],
icon: 'fas fa-robot',
description: 'Нанять помощников'
},
// Бусты из магазина
boosterUser: {
levels: [
{ id: 'boosterBeginner', target: 3, reward: 200, name: 'Начинающий бустер' },
{ id: 'boosterRegular', target: 10, reward: 600, name: 'Регулярный бустер' },
{ id: 'boosterAddict', target: 25, reward: 1500, name: 'Зависимый от бустов' }
],
icon: 'fas fa-bolt',
description: 'Использовать бустов'
},
// Планеты
planetExplorer: {
levels: [
{ id: 'mercuryExplorer', target: 1, reward: 100, name: 'Исследователь Меркурия' },
{ id: 'venusExplorer', target: 2, reward: 200, name: 'Исследователь Венеры' },
{ id: 'earthExplorer', target: 3, reward: 300, name: 'Исследователь Земли' },
{ id: 'marsExplorer', target: 4, reward: 400, name: 'Исследователь Марса' },
{ id: 'jupiterExplorer', target: 5, reward: 500, name: 'Исследователь Юпитера' },
{ id: 'saturnExplorer', target: 6, reward: 600, name: 'Исследователь Сатурна' },
{ id: 'uranusExplorer', target: 7, reward: 700, name: 'Исследователь Урана' },
{ id: 'neptuneExplorer', target: 8, reward: 800, name: 'Исследователь Нептуна' },
{ id: 'plutoExplorer', target: 9, reward: 900, name: 'Исследователь Плутона' }
],
icon: 'fas fa-globe-americas',
description: 'Исследовать планет'
},
// Комбо
comboMaster: {
levels: [
{ id: 'comboApprentice', target: 10, reward: 200, name: 'Ученик комбо' },
{ id: 'comboExpert', target: 25, reward: 500, name: 'Эксперт комбо' },
{ id: 'comboMaster', target: 50, reward: 1000, name: 'Мастер комбо' },
{ id: 'comboGod', target: 100, reward: 2500, name: 'Бог комбо' }
],
icon: 'fas fa-fire',
description: 'Достигнуть комбо'
}
};
let achievementsPanelVisible = false;
let totalAchievements = 0;
let unlockedAchievements = 0;

// Инициализация системы достижений
function init() {
calculateTotalAchievements();
createAchievementsPanel();
setupEventHandlers();
updateAchievementsDisplay();
checkSavedAchievements();
}

// Расчет общего количества достижений
function calculateTotalAchievements() {
totalAchievements = 0;
Object.values(achievements).forEach(category => {
totalAchievements += category.levels.length;
});
}

// Создание панели достижений
function createAchievementsPanel() {
const achievementsContainer = document.getElementById('achievementsContainer');
const achievementsPanel = document.getElementById('achievementsPanel');
const achievementsBtn = document.getElementById('achievementsBtn');
if (!achievementsContainer || !achievementsPanel || !achievementsBtn) return;

// Очищаем панель
achievementsPanel.innerHTML = '';

// Добавляем заголовок
const title = document.createElement('h3');
title.textContent = '🏆 Достижения';
title.style.marginBottom = '15px';
achievementsPanel.appendChild(title);

// Добавляем прогресс-бар всех достижений
const progressContainer = document.createElement('div');
progressContainer.style.cssText = `
width: 100%;
background: #333;
border-radius: 10px;
margin-bottom: 15px;
overflow: hidden;
border: 2px solid #444;
`;
const progressBar = document.createElement('div');
progressBar.id = 'achievementsProgressBar';
progressBar.style.cssText = `
height: 10px;
background: linear-gradient(90deg, #4CAF50, #8BC34A);
width: 0%;
border-radius: 5px;
transition: width 0.5s ease;
`;
const progressText = document.createElement('div');
progressText.id = 'achievementsProgressText';
progressText.style.cssText = `
text-align: center;
font-size: 0.8em;
color: #fff;
padding: 5px;
font-family: 'Orbitron', sans-serif;
`;
progressContainer.appendChild(progressBar);
achievementsPanel.appendChild(progressContainer);
achievementsPanel.appendChild(progressText);

// Добавляем категории достижений
Object.entries(achievements).forEach(([categoryId, category]) => {
const categoryDiv = document.createElement('div');
categoryDiv.className = 'achievement-category';
categoryDiv.style.cssText = `
margin-bottom: 20px;
border-bottom: 1px solid #444;
padding-bottom: 10px;
`;

const categoryTitle = document.createElement('div');
categoryTitle.style.cssText = `
display: flex;
align-items: center;
margin-bottom: 10px;
font-weight: bold;
color: #4FC3F7;
font-size: 1.1em;
`;
categoryTitle.innerHTML = `<i class="${category.icon}"></i> <span style="margin-left: 8px;">${category.description}</span>`;
categoryDiv.appendChild(categoryTitle);

// Добавляем уровни достижений
category.levels.forEach((level, index) => {
const achievementId = `${categoryId}_${level.id}`;
const achievementItem = document.createElement('div');
achievementItem.className = 'achievement-item';
achievementItem.id = `achievement${capitalizeFirstLetter(achievementId)}`;
achievementItem.style.cssText = `
background: linear-gradient(135deg, rgba(40, 40, 60, 0.8), rgba(30, 30, 50, 0.9));
border-radius: 8px;
padding: 10px;
margin-bottom: 8px;
display: flex;
align-items: center;
border: 1px solid #444;
position: relative;
transition: all 0.3s ease;
`;

// Цвет фона в зависимости от уровня
const levelColors = [
'rgba(100, 150, 255, 0.1)',
'rgba(100, 200, 255, 0.15)',
'rgba(150, 100, 255, 0.2)',
'rgba(200, 100, 255, 0.25)',
'rgba(255, 100, 150, 0.3)',
'rgba(255, 150, 100, 0.35)',
'rgba(255, 200, 100, 0.4)'
];
achievementItem.style.background = levelColors[index % levelColors.length];

// Иконка достижения
const icon = document.createElement('i');
icon.className = category.icon;
icon.style.cssText = `
font-size: 1.5em;
margin-right: 10px;
color: #FFD700;
`;

// Текст достижения
const textDiv = document.createElement('div');
textDiv.style.flex = '1';
const nameSpan = document.createElement('span');
nameSpan.className = 'achievement-name';
nameSpan.style.cssText = `
font-weight: bold;
display: block;
color: #fff;
`;
nameSpan.textContent = level.name;
const descSpan = document.createElement('span');
descSpan.className = 'achievement-description';
descSpan.style.cssText = `
font-size: 0.8em;
color: #ccc;
display: block;
`;
descSpan.textContent = `${category.description}: ${level.target}`;

// Прогресс
const progressDiv = document.createElement('div');
progressDiv.className = 'achievement-progress';
progressDiv.style.cssText = `
font-size: 0.9em;
color: #4FC3F7;
font-family: 'Orbitron', sans-serif;
`;

// Награда
const rewardDiv = document.createElement('div');
rewardDiv.className = 'achievement-reward';
rewardDiv.style.cssText = `
font-size: 0.8em;
color: #FFD700;
margin-left: 10px;
display: flex;
align-items: center;
`;
rewardDiv.innerHTML = `<i class="fas fa-gem" style="margin-right: 3px;"></i>${level.reward}`;

textDiv.appendChild(nameSpan);
textDiv.appendChild(descSpan);
textDiv.appendChild(progressDiv);
achievementItem.appendChild(icon);
achievementItem.appendChild(textDiv);
achievementItem.appendChild(rewardDiv);
categoryDiv.appendChild(achievementItem);
});
achievementsPanel.appendChild(categoryDiv);
});

// Настройка стилей панели
achievementsPanel.style.cssText = `
position: fixed;
bottom: 70px;
right: 20px;
width: 90%;
max-width: 500px;
max-height: 70vh;
background: linear-gradient(135deg, rgba(20, 20, 40, 0.95), rgba(10, 10, 30, 0.98));
border: 3px solid #FFD700;
border-radius: 15px;
padding: 20px;
z-index: 1000;
display: none;
flex-direction: column;
overflow-y: auto;
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
`;

achievementsBtn.innerHTML = `<i class="fas fa-trophy"></i> <span id="achievementsCount" style="font-size: 0.8em; margin-left: 5px;">0/${totalAchievements}</span>`;
}

// Настройка обработчиков событий
function setupEventHandlers() {
const achievementsBtn = document.getElementById('achievementsBtn');
const achievementsPanel = document.getElementById('achievementsPanel');
if (achievementsBtn && achievementsPanel) {
achievementsBtn.addEventListener('click', toggleAchievementsPanel);
achievementsBtn.addEventListener('touchstart', (e) => {
e.preventDefault();
toggleAchievementsPanel();
}, { passive: false });

// Закрытие панели при клике вне ее
document.addEventListener('click', (e) => {
if (achievementsPanelVisible &&
!achievementsPanel.contains(e.target) &&
!achievementsBtn.contains(e.target)) {
hideAchievementsPanel();
}
});
}
}

// Переключение видимости панели достижений
function toggleAchievementsPanel() {
const achievementsPanel = document.getElementById('achievementsPanel');
if (!achievementsPanel) return;
if (achievementsPanelVisible) {
hideAchievementsPanel();
} else {
showAchievementsPanel();
// Скрываем панель магазина если она открыта
if (window.shopSystem && typeof window.shopSystem.hideShopPanel === 'function') {
window.shopSystem.hideShopPanel();
}
}
}

function showAchievementsPanel() {
const achievementsPanel = document.getElementById('achievementsPanel');
if (achievementsPanel) {
achievementsPanel.style.display = 'flex';
achievementsPanelVisible = true;
updateAchievementsDisplay();
}
}

function hideAchievementsPanel() {
const achievementsPanel = document.getElementById('achievementsPanel');
if (achievementsPanel) {
achievementsPanel.style.display = 'none';
achievementsPanelVisible = false;
}
}

// Обновление прогресса достижения
function updateProgress(category, value) {
const gameState = window.gameState;
const categoryData = achievements[category];
if (!categoryData || !gameState || !gameState.achievements[category]) return;

// Обновляем прогресс для категории
gameState.achievements[category].progress = value;

// Проверяем каждый уровень достижения в категории
categoryData.levels.forEach(level => {
const achievementId = `${category}_${level.id}`;
const achievementState = gameState.achievements[category].levels[level.id];
if (!achievementState) return;
// Если достижение уже разблокировано, пропускаем
if (achievementState.unlocked) return;
// Проверяем, достигнута ли цель
if (value >= level.target) {
unlockAchievement(category, level.id);
}
});
updateAchievementsDisplay();
if (typeof window.saveGame === 'function') window.saveGame();
}

// Разблокировка достижения
function unlockAchievement(category, levelId) {
const gameState = window.gameState;
const categoryData = achievements[category];
const level = categoryData.levels.find(l => l.id === levelId);
if (!level || !gameState || !gameState.achievements[category] || !gameState.achievements[category].levels[levelId]) return;

const achievementState = gameState.achievements[category].levels[levelId];
// Если уже разблокировано, выходим
if (achievementState.unlocked) return;

// Разблокируем достижение
achievementState.unlocked = true;
achievementState.progress = level.target;

// Награда
gameState.coins += level.reward;

// Обновляем счетчик
unlockedAchievements++;
updateAchievementsCounter();

// Обновляем отображение
if (typeof window.updateHUD === 'function') window.updateHUD();
if (typeof window.updateUpgradeButtons === 'function') window.updateUpgradeButtons();

// Показываем уведомление
showAchievementNotification(category, levelId);

// Запускаем звук
playSound('upgradeSound');

// Виброотдача
if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

// Сохраняем игру
if (typeof window.saveGame === 'function') window.saveGame();
}

// Показ уведомления о разблокировке
function showAchievementNotification(category, levelId) {
const categoryData = achievements[category];
const level = categoryData.levels.find(l => l.id === levelId);
if (!level) return;

// Создаем уведомление
const notification = document.createElement('div');
notification.className = 'achievement-notification';
notification.style.cssText = `
position: fixed;
top: 20%;
left: 50%;
transform: translateX(-50%);
background: linear-gradient(135deg, rgba(255, 215, 0, 0.95), rgba(255, 140, 0, 0.95));
color: #000;
padding: 15px 25px;
border-radius: 15px;
z-index: 2000;
text-align: center;
font-family: 'Orbitron', sans-serif;
font-weight: bold;
box-shadow: 0 5px 25px rgba(255, 215, 0, 0.5);
animation: achievementSlideDown 0.5s ease-out;
max-width: 350px;
width: 90%;
border: 3px solid #fff;
`;

// Уровень достижения (звездочки)
const levelStars = '★'.repeat(categoryData.levels.findIndex(l => l.id === levelId) + 1);
notification.innerHTML = `
<div style="font-size: 1.1em; margin-bottom: 5px; color: #000;">${levelStars}</div>
<div style="font-size: 1.5em; margin-bottom: 8px; color: #000; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">🏆 ДОСТИЖЕНИЕ!</div>
<div style="font-size: 1.2em; margin-bottom: 10px; color: #000;">${level.name}</div>
<div style="font-size: 0.9em; margin-bottom: 10px; color: #333;">${categoryData.description}: ${level.target}</div>
<div style="font-size: 1em; color: #000; background: rgba(255,255,255,0.3); padding: 5px 10px; border-radius: 10px;">
Награда: <i class="fas fa-gem" style="color: #2196F3;"></i> <strong>${level.reward}</strong>
</div>
<div style="margin-top: 10px; font-size: 0.8em; color: #555;">${unlockedAchievements}/${totalAchievements}</div>
`;
document.body.appendChild(notification);

// Анимация
setTimeout(() => {
notification.style.animation = 'achievementSlideUp 0.5s ease-in forwards';
setTimeout(() => {
if (notification.parentNode) document.body.removeChild(notification);
}, 500);
}, 3000);

// Добавляем CSS для анимаций
if (!document.getElementById('achievement-animations')) {
const style = document.createElement('style');
style.id = 'achievement-animations';
style.textContent = `
@keyframes achievementSlideDown {
from { top: -100px; opacity: 0; transform: translateX(-50%) scale(0.8); }
to { top: 20%; opacity: 1; transform: translateX(-50%) scale(1); }
}
@keyframes achievementSlideUp {
from { top: 20%; opacity: 1; transform: translateX(-50%) scale(1); }
to { top: -100px; opacity: 0; transform: translateX(-50%) scale(0.8); }
}
.achievement-item.unlocked {
border-color: #FFD700 !important;
box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
}
.achievement-item.unlocked .achievement-progress {
color: #4CAF50 !important;
}
`;
document.head.appendChild(style);
}
}

// Обновление счетчика достижений
function updateAchievementsCounter() {
const achievementsBtn = document.getElementById('achievementsBtn');
if (!achievementsBtn) return;
const countSpan = achievementsBtn.querySelector('#achievementsCount');
if (countSpan) {
countSpan.textContent = `${unlockedAchievements}/${totalAchievements}`;
}
// Обновляем прогресс-бар
updateAchievementsProgressBar();
}

// Обновление прогресс-бара достижений
function updateAchievementsProgressBar() {
const progressBar = document.getElementById('achievementsProgressBar');
const progressText = document.getElementById('achievementsProgressText');
if (!progressBar || !progressText) return;
const progress = totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0;
progressBar.style.width = `${progress}%`;
progressText.textContent = `Разблокировано: ${unlockedAchievements}/${totalAchievements} (${Math.round(progress)}%)`;
}

// Обновление отображения всех достижений
function updateAchievementsDisplay() {
const gameState = window.gameState;
if (!gameState) return;

// Пересчитываем разблокированные достижения
unlockedAchievements = 0;
Object.entries(achievements).forEach(([categoryId, category]) => {
const categoryState = gameState.achievements[categoryId];
if (!categoryState) return;
category.levels.forEach(level => {
const achievementId = `${categoryId}_${level.id}`;
const achievementState = categoryState.levels[level.id];
if (!achievementState) return;
const achievementItem = document.getElementById(`achievement${capitalizeFirstLetter(achievementId)}`);
if (!achievementItem) return;

// Обновляем прогресс
const progressElement = achievementItem.querySelector('.achievement-progress');
if (progressElement) {
if (achievementState.unlocked) {
progressElement.textContent = 'РАЗБЛОКИРОВАНО';
progressElement.style.color = '#4CAF50';
achievementItem.classList.add('unlocked');
unlockedAchievements++;
} else {
const currentProgress = categoryState.progress;
const percent = Math.min((currentProgress / level.target) * 100, 100);
progressElement.textContent = `${Math.round(percent)}% (${currentProgress}/${level.target})`;
progressElement.style.color = '#4FC3F7';
achievementItem.classList.remove('unlocked');
}
}
});
});
updateAchievementsCounter();
updateAchievementsProgressBar();
}

// Проверка сохраненных достижений
function checkSavedAchievements() {
const gameState = window.gameState;
const gameMetrics = window.gameMetrics || {};

// Инициализация структуры достижений если ее нет
if (!gameState.achievements) {
gameState.achievements = {};
}

// Инициализация каждой категории
Object.entries(achievements).forEach(([categoryId, category]) => {
if (!gameState.achievements[categoryId]) {
gameState.achievements[categoryId] = {
progress: 0,
levels: {}
};
}
// Инициализация каждого уровня
category.levels.forEach(level => {
const levelId = level.id;
if (!gameState.achievements[categoryId].levels[levelId]) {
gameState.achievements[categoryId].levels[levelId] = {
unlocked: false,
progress: 0
};
}
});
});

// Синхронизация прогресса с игровыми метриками
// Разрушение блоков
if (gameMetrics.blocksDestroyed !== undefined) {
updateProgress('blockBreaker', gameMetrics.blocksDestroyed);
}
// Кристаллы
if (gameMetrics.totalCoinsEarned !== undefined) {
updateProgress('crystalCollector', gameMetrics.totalCoinsEarned);
}
// Критические удары
if (gameMetrics.totalCrits !== undefined) {
updateProgress('critSpecialist', gameMetrics.totalCrits);
}
// Улучшения (если есть метрика)
if (gameMetrics.upgradesBought !== undefined) {
updateProgress('upgrader', gameMetrics.upgradesBought);
}
// Помощники (если есть метрика)
if (gameMetrics.helpersBought !== undefined) {
updateProgress('helperExpert', gameMetrics.helpersBought);
}
// Бусты (если есть метрика)
if (gameMetrics.boostersUsed !== undefined) {
updateProgress('boosterUser', gameMetrics.boostersUsed);
}
// Планеты (текущий уровень)
if (gameState.currentLocation !== undefined) {
const planetOrder = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
const planetIndex = planetOrder.indexOf(gameState.currentLocation) + 1;
updateProgress('planetExplorer', planetIndex);
}
// Комбо (если есть метрика)
if (gameMetrics.maxCombo !== undefined) {
updateProgress('comboMaster', gameMetrics.maxCombo);
}
updateAchievementsDisplay();
}

// Вспомогательные функции
function capitalizeFirstLetter(string) {
return string.charAt(0).toUpperCase() + string.slice(1);
}

function playSound(soundId) {
const sound = document.getElementById(soundId);
if (sound) {
sound.currentTime = 0;
sound.play().catch(e => console.log("Audio play failed:", e));
}
}

function updateHUD() {
if (window.updateHUD) window.updateHUD();
}

function updateUpgradeButtons() {
if (window.updateUpgradeButtons) window.updateUpgradeButtons();
}

// API для обновления достижений из других модулей
window.achievementsSystem = {
init,
toggleAchievementsPanel,
showAchievementsPanel,
hideAchievementsPanel,
updateProgress,
unlockAchievement,
updateAchievementsDisplay,
getUnlockedCount: () => unlockedAchievements,
getTotalCount: () => totalAchievements,

// Методы для обновления конкретных категорий
incrementBlocksDestroyed: (count = 1) => {
if (!window.gameMetrics) window.gameMetrics = {};
window.gameMetrics.blocksDestroyed = (window.gameMetrics.blocksDestroyed || 0) + count;
updateProgress('blockBreaker', window.gameMetrics.blocksDestroyed);
},
incrementCoinsEarned: (amount) => {
if (!window.gameMetrics) window.gameMetrics = {};
window.gameMetrics.totalCoinsEarned = (window.gameMetrics.totalCoinsEarned || 0) + amount;
updateProgress('crystalCollector', window.gameMetrics.totalCoinsEarned);
},
incrementCrits: (count = 1) => {
if (!window.gameMetrics) window.gameMetrics = {};
window.gameMetrics.totalCrits = (window.gameMetrics.totalCrits || 0) + count;
updateProgress('critSpecialist', window.gameMetrics.totalCrits);
},
incrementUpgrades: (count = 1) => {
if (!window.gameMetrics) window.gameMetrics = {};
window.gameMetrics.upgradesBought = (window.gameMetrics.upgradesBought || 0) + count;
updateProgress('upgrader', window.gameMetrics.upgradesBought);
},
incrementHelpers: (count = 1) => {
if (!window.gameMetrics) window.gameMetrics = {};
window.gameMetrics.helpersBought = (window.gameMetrics.helpersBought || 0) + count;
updateProgress('helperExpert', window.gameMetrics.helpersBought);
},
incrementBoosters: (count = 1) => {
if (!window.gameMetrics) window.gameMetrics = {};
window.gameMetrics.boostersUsed = (window.gameMetrics.boostersUsed || 0) + count;
updateProgress('boosterUser', window.gameMetrics.boostersUsed);
},
updatePlanetProgress: (level) => {
updateProgress('planetExplorer', level);
},
updateCombo: (combo) => {
if (!window.gameMetrics) window.gameMetrics = {};
if (combo > (window.gameMetrics.maxCombo || 0)) {
window.gameMetrics.maxCombo = combo;
updateProgress('comboMaster', combo);
}
}
};

// Безопасная инициализация с проверкой gameState и DOM
function safeInit() {
if (!document.getElementById('achievementsBtn')) return;
if (!window.gameState) {
// Ждём, пока save-system.js инициализирует gameState
setTimeout(safeInit, 200);
return;
}
init();
}

if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => setTimeout(safeInit, 300));
} else {
setTimeout(safeInit, 300);
}
})();