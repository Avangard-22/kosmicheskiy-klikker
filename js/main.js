// === СОХРАНЕНИЕ ===
function saveGame() {
  const saveData = {
    coins,
    clickPower,
    clickUpgradeLevel,
    maxLevelReached,
    currentPlanet, // <-- Сохраняем текущую планету
    currentLevelOnPlanet, // <-- Сохраняем уровень на планете
    critChance,
    critUpgradeLevel,
    helperDamageUpgradeLevel,
    lastDailyReward: localStorage.getItem('lastDailyReward')
  };
  localStorage.setItem('cosmicBlocksSave', JSON.stringify(saveData));
}
function loadGame() {
  const saved = localStorage.getItem('cosmicBlocksSave');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      coins = data.coins || 0;
      clickPower = data.clickPower || 1;
      clickUpgradeLevel = data.clickUpgradeLevel || 0;
      // slowBonus = data.slowBonus || 0; // <-- Удалено
      maxLevelReached = data.maxLevelReached || 0;
      currentPlanet = data.currentPlanet || 'mercury'; // <-- Загружаем планету
      currentLevelOnPlanet = data.currentLevelOnPlanet || 1; // <-- Загружаем уровень на планете
      critChance = data.critChance || 0; // <-- Новое
      critUpgradeLevel = data.critUpgradeLevel || 0; // <-- Новое
      helperDamageUpgradeLevel = data.helperDamageUpgradeLevel || 0; // <-- Новое
    } catch (e) {
      console.warn('Ошибка загрузки сохранения', e);
      // Если ошибка, начинаем с Меркурия
      currentPlanet = 'mercury';
      currentLevelOnPlanet = 1;
      critChance = 0;
      critUpgradeLevel = 0;
      helperDamageUpgradeLevel = 0;
    }
  } else {
    // Если сохранений нет, начинаем с Меркурия
    currentPlanet = 'mercury';
    currentLevelOnPlanet = 1;
    critChance = 0;
    critUpgradeLevel = 0;
    helperDamageUpgradeLevel = 0;
  }
}
function checkDailyReward() {
  const now = Date.now();
  const last = localStorage.getItem('lastDailyReward');
  if (!last || now - parseInt(last) >= 24 * 60 * 60 * 1000) {
    coins += 1000;
    updateCoins();
    localStorage.setItem('lastDailyReward', now.toString());
    showTooltip('🎁 +1000 камушков!');
    setTimeout(hideTooltip, 2000);
    saveGame();
    return true;
  } else {
    const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - (now - parseInt(last))) / (1000 * 60 * 60));
    showTooltip(`Награда через ${hoursLeft} ч.`);
    setTimeout(hideTooltip, 2000);
    return false;
  }
}

// === НОВАЯ СТРУКТУРА: ПАРАМЕТРЫ КРИТИЧЕСКОГО УРОНА ===
let critChance = 0; // Шанс крита (в %)
const critBaseChance = 2; // Базовый шанс при первом улучшении
const critBaseCost = 150; // Базовая стоимость улучшения крита
const critCostMultiplier = 2.0; // Множитель стоимости для крита

// === ВЫСОКОПРИОРИТЕТНЫЕ ИСПРАВЛЕНИЯ ===
let coins = 0;
let maxLevelReached = 0; // <-- Теперь это общий максимум за всё время
let clickPower = 1;
let clickUpgradeLevel = 0;
const baseClickUpgradeCost = 80;
// let slowBonus = 0; // <-- Удалено
// const slowCost = 2000; // <-- Удалено
let gameActive = false; // <-- Удалена переменная paused
let currentPlanet = 'mercury'; // <-- Изменено: теперь строка-ключ
let currentLevelOnPlanet = 1; // <-- НОВОЕ: уровень *внутри* текущей локации
let maxLevelOnCurrentPlanet = planetData[currentPlanet].maxLevel; // <-- НОВОЕ: динамический максимум
let currentBlockHealth = 0;
let currentBlock = null;
let blockSpeed = 30; // <-- Используется как базовая скорость, но теперь динамическая
let comboCount = 0;
let lastDestroyTime = 0;
const COMBO_TIME_WINDOW = 2000;
let helperActive = false;
let helperTimeLeft = 0;
const helperDuration = 60000;
const helperCost = 1500;
let helperInterval;
// --- НОВЫЕ ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
let helperDamageMultiplier = 1.3; // <-- Начальный урон помощника = 130% от clickPower
// ---
const gameMetrics = {
    startTime: Date.now(),
    blocksDestroyed: 0,
    upgradesBought: 0,
    totalClicks: 0,
    sessions: parseInt(localStorage.getItem('gameSessions') || '0') + 1
};
let stars = [];
let lavaParticles = [];
let snowflakes = [];
let bioDots = [];

// --- DOM Elements ---
const coinsDisplay = document.getElementById("coins");
const clickPowerDisplay = document.getElementById("clickPowerInfo");
const critChanceDisplay = document.getElementById("critChanceInfo"); // <-- Новое
const speedDisplay = document.getElementById("speedInfo");
const blockLevelDisplay = document.getElementById("blockLevelInfo");
const blockHealthDisplay = document.getElementById("blockHealthInfo");
const helperTimerDisplay = document.getElementById("helperTimer");
const helperDamageDisplay = document.getElementById("helperDamageInfo"); // <-- Новое
const levelInfo = document.getElementById("levelInfo");
const levelAnnounce = document.getElementById("levelAnnounce");
const gameTitle = document.getElementById("gameTitle");
const upgradeClickBtn = document.getElementById("upgradeClickBtn");
// const upgradeSlowBtn = document.getElementById("upgradeSlowBtn"); // <-- Удалено
const upgradeCritBtn = document.getElementById("upgradeCritBtn"); // <-- Новое
const upgradeHelperBtn = document.getElementById("upgradeHelperBtn");
const upgradeHelperDamageBtn = document.getElementById("upgradeHelperDamageBtn"); // <-- Новое
// const pauseBtn = document.getElementById("pauseBtn"); // <-- Удалено
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreDisplay = document.getElementById("finalScore");
const tooltip = document.getElementById("tooltip");
const welcomeScreen = document.getElementById("welcomeScreen");
const header = document.getElementById("header");
const gameArea = document.getElementById("gameArea");
const particlesCanvas = document.getElementById("particlesCanvas");
const startBtn = document.querySelector('#welcomeScreen .btn');
const restartBtn = document.getElementById("restartBtn");
const shareBtn = document.getElementById("shareBtn");
const dailyRewardBtn = document.getElementById("dailyRewardBtn");
const starsCanvas = document.getElementById('starsCanvas');
const lavaCanvas = document.getElementById('lavaCanvas');
const iceCanvas = document.getElementById('iceCanvas');
const bioCanvas = document.getElementById('bioCanvas');

document.addEventListener('DOMContentLoaded', function() {

    // ЗАГРУЗКА СОХРАНЕНИЯ ПРИ СТАРТЕ
    loadGame();

    function resizeCanvases() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        [starsCanvas, lavaCanvas, iceCanvas, bioCanvas, particlesCanvas].forEach(c => {
            if (c) {
                c.width = w;
                c.height = h;
            }
        });
        // Инициализация анимаций при изменении размера окна (если текущая локация не изменилась)
        // Лучше вызывать это при смене локации, но для надёжности можно и тут
        initAnimationsForCurrentPlanet();
    }
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);

    // === ОСНОВНЫЕ ФУНКЦИИ ИГРЫ ===
    function playSound(soundId) {
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => {});
        }
    }

    function hitBlock(block, level) {
        if (!gameActive) return; // <-- Заменено на !gameActive
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        playSound('clickSound');
        block.style.transform = 'translateX(-50%) scale(0.85)';
        setTimeout(() => {
            block.style.transform = 'translateX(-50%) scale(1)';
        }, 100);
        // --- НОВАЯ ЛОГИКА: КРИТИЧЕСКИЙ УРОН ---
        let damage = clickPower;
        let isCrit = false;
        if (Math.random() * 100 < critChance) {
            damage = Math.floor(damage * 2); // <-- Множитель крита = 2
            isCrit = true;
        }
        // ---
        currentBlockHealth -= damage;
        gameMetrics.totalClicks++;

        // --- ИСПРАВЛЕНИЕ: Не даём здоровью уйти в отрицательное значение ---
        if (currentBlockHealth < 0) {
            currentBlockHealth = 0;
        }
        // ---
        createDamageText(damage, block, isCrit); // <-- Передаём isCrit
        block.textContent = currentBlockHealth; // <-- Обновляем текст *после* корректировки
        updateCracks(block, currentBlockHealth);
        updateHUD();
        // --- ИСПРАВЛЕНИЕ: Проверяем разрушение *после* обновления текста и трещин ---
        if (currentBlockHealth <= 0) {
            destroyBlock(block, level);
            return; // <-- Выйти из функции, чтобы избежать лишних действий
        }
        // ---
    }

    function destroyBlock(block, level) {
        const now = Date.now();
        if (now - lastDestroyTime < COMBO_TIME_WINDOW) {
            comboCount++;
        } else {
            comboCount = 1;
        }
        lastDestroyTime = now;
        // Используем данные текущей планеты для расчёта награды
        const currentPlanetData = planetData[currentPlanet];
        let reward = Math.floor(15 * Math.pow(1.15, level - 1)); // <-- Базовая награда, можно адаптировать
        if (comboCount > 1) {
            const comboBonus =
