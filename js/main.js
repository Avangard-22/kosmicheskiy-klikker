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
      maxLevelReached = data.maxLevelReached || 0;
      currentPlanet = data.currentPlanet || 'mercury';
      currentLevelOnPlanet = data.currentLevelOnPlanet || 1;
      critChance = data.critChance || 0;
      critUpgradeLevel = data.critUpgradeLevel || 0;
      helperDamageUpgradeLevel = data.helperDamageUpgradeLevel || 0;
    } catch (e) {
      console.warn('Ошибка загрузки сохранения', e);
      currentPlanet = 'mercury';
      currentLevelOnPlanet = 1;
      critChance = 0;
      critUpgradeLevel = 0;
      helperDamageUpgradeLevel = 0;
    }
  } else {
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
let critChance = 0;
const critBaseChance = 2;
const critBaseCost = 150;
const critCostMultiplier = 2.0;

// === ВЫСОКОПРИОРИТЕТНЫЕ ИСПРАВЛЕНИЯ ===
let coins = 0;
let maxLevelReached = 0;
let clickPower = 1;
let clickUpgradeLevel = 0;
const baseClickUpgradeCost = 80;
let gameActive = false;
let currentPlanet = 'mercury';
let currentLevelOnPlanet = 1;
let maxLevelOnCurrentPlanet = planetData[currentPlanet].maxLevel;
let currentBlockHealth = 0;
let currentBlock = null;
let blockSpeed = 30;
let comboCount = 0;
let lastDestroyTime = 0;
const COMBO_TIME_WINDOW = 2000;
let helperActive = false;
let helperTimeLeft = 0;
const helperDuration = 60000;
const helperCost = 1500;
let helperInterval;
let helperDamageMultiplier = 1.3;
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
const critChanceDisplay = document.getElementById("critChanceInfo");
const speedDisplay = document.getElementById("speedInfo");
const blockLevelDisplay = document.getElementById("blockLevelInfo");
const blockHealthDisplay = document.getElementById("blockHealthInfo");
const helperTimerDisplay = document.getElementById("helperTimer");
const helperDamageDisplay = document.getElementById("helperDamageInfo");
const levelInfo = document.getElementById("levelInfo");
const levelAnnounce = document.getElementById("levelAnnounce");
const gameTitle = document.getElementById("gameTitle");
const upgradeClickBtn = document.getElementById("upgradeClickBtn");
const upgradeCritBtn = document.getElementById("upgradeCritBtn");
const upgradeHelperBtn = document.getElementById("upgradeHelperBtn");
const upgradeHelperDamageBtn = document.getElementById("upgradeHelperDamageBtn");
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
        if (!gameActive) return;
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        playSound('clickSound');
        block.style.transform = 'translateX(-50%) scale(0.85)';
        setTimeout(() => {
            block.style.transform = 'translateX(-50%) scale(1)';
        }, 100);

        // --- КРИТИЧЕСКИЙ УРОН ---
        let damage = clickPower;
        let isCrit = false;
        if (Math.random() * 100 < critChance) {
            damage = Math.floor(damage * 2);
            isCrit = true;
        }
        // ---

        // --- ТОЧНАЯ ЛОГИКА ИЗ ИСХОДНОГО КОДА ---
        currentBlockHealth -= damage;
        gameMetrics.totalClicks++;
        createDamageText(damage, block, isCrit);
        block.textContent = currentBlockHealth; // Обновляем текст
        updateCracks(block, currentBlockHealth);
        updateHUD();

        // Проверяем разрушение СРАЗУ после обновления текста
        if (currentBlockHealth <= 0) {
            destroyBlock(block, level);
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

        const currentPlanetData = planetData[currentPlanet];
        let reward = Math.floor(15 * Math.pow(1.15, level - 1));
        if (comboCount > 1) {
            const comboBonus = Math.floor(reward * (comboCount * 0.2));
            reward += comboBonus;
            showComboText(comboCount, comboBonus, block);
            playSound('comboSound');
        }
        coins += reward;
        gameMetrics.blocksDestroyed++;
        updateCoins();
        playSound('breakSound');
        showRewardText(reward, block);
        createExplosion(block);

        // --- ТОЧНАЯ ЛОГИКА ИЗ ИСХОДНОГО КОДА ---
        if (gameArea.contains(block)) {
            gameArea.removeChild(block);
        }
        currentBlock = null;
        currentBlockHealth = 0;
        // ---

        currentLevelOnPlanet++;
        if (currentLevelOnPlanet > maxLevelReached) {
            maxLevelReached = currentLevelOnPlanet;
        }

        if (currentLevelOnPlanet > maxLevelOnCurrentPlanet) {
            const planetKeys = Object.keys(planetData);
            const currentIndex = planetKeys.indexOf(currentPlanet);
            if (currentIndex < planetKeys.length - 1) {
                const nextPlanet = planetKeys[currentIndex + 1];
                setPlanet(nextPlanet);
            } else {
                console.log("Поздравляем! Вы прошли Солнечную систему!");
                updateHUD();
                setTimeout(() => {
                    if (gameActive) {
                        createMovingBlock(currentLevelOnPlanet);
                    }
                }, 500);
                return;
            }
        } else {
            updateHUD();
            setTimeout(() => {
                if (gameActive) {
                    createMovingBlock(currentLevelOnPlanet);
                }
            }, 500);
        }
    }

    function showComboText(combo, bonus, block) {
        const rect = block.getBoundingClientRect();
        const text = document.createElement('div');
        text.className = 'combo-text';
        text.textContent = `Комбо x${combo}! +${bonus}`;
        text.style.left = (rect.left + rect.width / 2) + 'px';
        text.style.top = (rect.top) + 'px';
        document.body.appendChild(text);
        setTimeout(() => {
            if (text.parentNode) {
                document.body.removeChild(text);
            }
        }, 1000);
    }

    function showRewardText(reward, block) {
        const rect = block.getBoundingClientRect();
        const text = document.createElement('div');
        text.className = 'reward-text';
        text.textContent = `+${reward} 💎`;
        text.style.left = (rect.left + rect.width / 2) + 'px';
        text.style.top = (rect.top + rect.height / 2) + 'px';
        document.body.appendChild(text);
        setTimeout(() => {
            if (text.parentNode) {
                document.body.removeChild(text);
            }
        }, 1500);
    }

    function createDamageText(damage, block, isCrit = false) {
        const rect = block.getBoundingClientRect();
        const text = document.createElement('div');
        text.className = 'damage-text';
        text.textContent = `-${damage}`;
        if (isCrit) {
            text.style.color = '#ff0000';
            text.style.fontWeight = 'bold';
        } else {
            text.style.color = '#ff4444';
        }
        text.style.left = (rect.left + rect.width / 2) + 'px';
        text.style.top = (rect.top) + 'px';
        document.body.appendChild(text);
        let opacity = 1;
        let yPos = parseInt(text.style.top);
        function animate() {
            opacity -= 0.02;
            yPos -= 2;
            text.style.opacity = opacity;
            text.style.top = yPos + 'px';
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                if (text.parentNode) {
                    document.body.removeChild(text);
                }
            }
        }
        animate();
    }

    const particles = [];
    function createExplosion(block) {
        const rect = block.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const theme = planetData[currentPlanet];
        for (let i = 0; i < 30; i++) {
            particles.push({
                x: centerX,
                y: centerY,
                size: Math.random() * 4 + 1,
                speedX: (Math.random() - 0.5) * 8,
                speedY: (Math.random() - 0.5) * 8,
                color: theme.blockColors[Math.floor(Math.random() * theme.blockColors.length)],
                life: 1
            });
        }
    }

    function animateParticles() {
        if (!gameActive || !particlesCanvas) return;
        const ctx = particlesCanvas.getContext('2d');
        ctx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.speedX;
            p.y += p.speedY;
            p.life -= 0.02;
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
        if (gameActive) {
            requestAnimationFrame(animateParticles);
        }
    }

    function setPlanet(planetKey) {
        if (!planetData[planetKey]) {
            console.error(`Планета ${planetKey} не найдена в planetData`);
            return;
        }
        document.querySelectorAll('.location').forEach(el => el.classList.remove('active'));
        document.getElementById(`location-${planetKey}`).classList.add('active');
        currentPlanet = planetKey;
        maxLevelOnCurrentPlanet = planetData[planetKey].maxLevel;
        blockSpeed = planetData[planetKey].blockSpeed;
        const theme = planetData[planetKey];
        if (gameTitle) gameTitle.textContent = theme.name;
        if (levelInfo) levelInfo.style.color = theme.color;
        if (coinsDisplay) {
            coinsDisplay.style.color = theme.coinColor;
            coinsDisplay.style.textShadow = `0 0 4px ${theme.coinColor}80`;
        }
        if (header) header.style.borderColor = theme.borderColor;
        initAnimationsForCurrentPlanet();
        if (levelAnnounce) {
            levelAnnounce.textContent = theme.name;
            levelAnnounce.style.color = theme.color;
            levelAnnounce.style.opacity = "1";
            setTimeout(() => {
                levelAnnounce.style.opacity = "0";
            }, 2000);
        }
        currentLevelOnPlanet = 1;
        updateHUD();
    }

    function initAnimationsForCurrentPlanet() {
        [starsCanvas, lavaCanvas, iceCanvas, bioCanvas].forEach(canvas => {
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        });

        switch(currentPlanet) {
            case 'mercury':
                initMercury();
                animateMercury();
                break;
            case 'venus':
                initVenus();
                animateVenus();
                break;
            case 'earth':
                initEarth();
                animateEarth();
                break;
            case 'mars':
                initMars();
                animateMars();
                break;
            case 'jupiter':
                initJupiter();
                animateJupiter();
                break;
            case 'saturn':
                initSaturn();
                animateSaturn();
                break;
            case 'uranus':
                initUranus();
                animateUranus();
                break;
            case 'neptune':
                initNeptune();
                animateNeptune();
                break;
            case 'pluto':
                initPluto();
                animatePluto();
                break;
        }
    }

    function getCurrentSpeed() {
        return blockSpeed;
    }

    function updateHUD() {
        if (levelInfo) levelInfo.textContent = `Ур. ${currentLevelOnPlanet}/${maxLevelOnCurrentPlanet} (${planetData[currentPlanet].name})`;
        if (clickPowerDisplay) clickPowerDisplay.textContent = `Сила: ${clickPower}`;
        if (critChanceDisplay) critChanceDisplay.textContent = `Шанс крита: ${Math.floor(critChance)}%`;
        if (speedDisplay) speedDisplay.textContent = `Скорость: ${Math.round(getCurrentSpeed())}`;
        if (blockLevelDisplay) blockLevelDisplay.textContent = `Блок: ${currentLevelOnPlanet}`;
        if (blockHealthDisplay) blockHealthDisplay.textContent = `Осталось: ${currentBlockHealth > 0 ? currentBlockHealth : '—'}`;
        if (helperDamageDisplay) helperDamageDisplay.textContent = `Урон помощника: ${Math.floor(clickPower * helperDamageMultiplier)}`;
        updateHelperTimer();
    }

    function updateCoins() {
        if (coinsDisplay) coinsDisplay.textContent = `Камушки: ${Math.floor(coins).toLocaleString()}`;
        updateUpgradeButtons();
    }

    function updateUpgradeButtons() {
        const clickCost = Math.floor(baseClickUpgradeCost * Math.pow(1.5, clickUpgradeLevel));
        const critCost = Math.floor(critBaseCost * Math.pow(critCostMultiplier, critUpgradeLevel));
        const helperDamageCost = Math.floor(2000 * Math.pow(2.0, helperDamageUpgradeLevel));

        if (upgradeClickBtn) {
            if (coins >= clickCost) {
                upgradeClickBtn.className = "upgrade-btn btn-available";
            } else {
                upgradeClickBtn.className = "upgrade-btn btn-unavailable";
            }
        }
        if (upgradeCritBtn) {
            if (coins >= critCost) {
                upgradeCritBtn.className = "upgrade-btn btn-available";
            } else {
                upgradeCritBtn.className = "upgrade-btn btn-unavailable";
            }
        }
        if (upgradeHelperBtn) {
            if (coins >= helperCost && !helperActive) {
                upgradeHelperBtn.className = "upgrade-btn btn-available";
            } else {
                upgradeHelperBtn.className = "upgrade-btn btn-unavailable";
            }
        }
        if (upgradeHelperDamageBtn) {
            if (coins >= helperDamageCost) {
                upgradeHelperDamageBtn.className = "upgrade-btn btn-available";
            } else {
                upgradeHelperDamageBtn.className = "upgrade-btn btn-unavailable";
            }
        }
    }

    function buyClickPower() {
        const cost = Math.floor(baseClickUpgradeCost * Math.pow(1.5, clickUpgradeLevel));
        if (coins >= cost) {
            coins -= cost;
            clickPower += 1;
            clickUpgradeLevel += 1;
            gameMetrics.upgradesBought++;
            updateCoins();
            updateHUD();
            playSound('upgradeSound');
            showTooltip(`Сила увеличена!<br>Теперь: ${clickPower}`);
            setTimeout(hideTooltip, 1500);
            saveGame();
        }
    }

    function buyCritChance() {
        const cost = Math.floor(critBaseCost * Math.pow(critCostMultiplier, critUpgradeLevel));
        if (coins >= cost) {
            coins -= cost;
            if (critUpgradeLevel === 0) {
                critChance = critBaseChance;
            } else {
                critChance += 1;
            }
            critUpgradeLevel += 1;
            gameMetrics.upgradesBought++;
            updateCoins();
            updateHUD();
            playSound('upgradeSound');
            showTooltip(`Шанс крита увеличен!<br>Теперь: ${Math.floor(critChance)}%`);
            setTimeout(hideTooltip, 1500);
            saveGame();
        }
    }

    function buyHelperDamageUpgrade() {
        const cost = Math.floor(2000 * Math.pow(2.0, helperDamageUpgradeLevel));
        if (coins >= cost) {
            coins -= cost;
            helperDamageMultiplier += 0.3;
            helperDamageUpgradeLevel += 1;
            gameMetrics.upgradesBought++;
            updateCoins();
            updateHUD();
            playSound('upgradeSound');
            showTooltip(`Урон помощника увеличен!<br>Теперь: ${Math.floor(clickPower * helperDamageMultiplier)}`);
            setTimeout(hideTooltip, 1500);
            saveGame();
        }
    }

    function buyHelper() {
        if (coins >= helperCost && !helperActive) {
            coins -= helperCost;
            activateHelper();
            updateCoins();
            saveGame();
        }
    }

    function showTooltip(text) {
        if (tooltip) {
            tooltip.innerHTML = text;
            tooltip.style.opacity = "1";
        }
    }

    function hideTooltip() {
        if (tooltip) tooltip.style.opacity = "0";
    }

    function createMovingBlock(level) {
        if (currentBlock && gameArea.contains(currentBlock)) {
            gameArea.removeChild(currentBlock);
        }
        const currentPlanetData = planetData[currentPlanet];
        const blockHealth = Math.floor(currentPlanetData.baseHealth * Math.pow(currentPlanetData.healthMultiplier, level - 1));
        currentBlockHealth = blockHealth;
        const block = document.createElement("div");
        block.className = "moving-block";
        const size = Math.max(60, 120 - level * 0.5);
        block.style.width = size + "px";
        block.style.height = size + "px";
        block.style.bottom = "0px";
        block.dataset.maxHealth = blockHealth;
        const theme = currentPlanetData;
        const colorIndex = level % theme.blockColors.length;
        block.style.background = `linear-gradient(135deg, ${theme.blockColors[colorIndex]}, ${theme.blockColors[(colorIndex + 1) % theme.blockColors.length]})`;
        block.style.boxShadow = `0 0 15px ${theme.blockColors[colorIndex]}`;
        block.style.border = `2px solid ${theme.borderColor}`;
        block.textContent = level;
        block.addEventListener('click', () => hitBlock(block, level));
        gameArea.appendChild(block);
        currentBlock = block;
        updateHUD();
        animateBlock(block, level);
    }

    function animateBlock(block, level) {
        if (!gameActive) return;
        const speed = getCurrentSpeed();
        let position = parseInt(block.style.bottom) || 0;
        function move() {
            if (!gameActive || currentBlock !== block) return;
            position += speed / 30;
            block.style.bottom = position + "px";
            if (position > window.innerHeight) {
                if (gameArea.contains(block)) {
                    gameArea.removeChild(block);
                }
                currentBlock = null;
                currentBlockHealth = 0;
                setTimeout(() => {
                    if (gameActive) {
                        createMovingBlock(currentLevelOnPlanet);
                    }
                }, 500);
                return;
            }
            requestAnimationFrame(move);
        }
        move();
    }

    function startGame() {
        if (welcomeScreen) {
            welcomeScreen.style.display = "none";
        }
        gameActive = true;
        comboCount = 0;
        lastDestroyTime = 0;
        helperActive = false;
        helperTimeLeft = 0;
        helperDamageMultiplier = 1.3;
        gameMetrics.startTime = Date.now();
        gameMetrics.blocksDestroyed = 0;
        gameMetrics.upgradesBought = 0;
        gameMetrics.totalClicks = 0;
        updateCoins();
        updateHUD();
        setPlanet(currentPlanet);
        animateParticles();
        setTimeout(() => createMovingBlock(currentLevelOnPlanet), 500);
    }

    function restartGame() {
        coins = 0;
        maxLevelReached = 0;
        clickPower = 1;
        clickUpgradeLevel = 0;
        gameActive = true;
        comboCount = 0;
        lastDestroyTime = 0;
        helperActive = false;
        helperTimeLeft = 0;
        helperDamageMultiplier = 1.3;
        if (helperInterval) clearInterval(helperInterval);
        gameArea.innerHTML = "";
        if (gameOverScreen) gameOverScreen.style.display = "none";
        if (levelInfo) levelInfo.textContent = "Уровень: —";
        if (levelAnnounce) levelAnnounce.style.opacity = "0";
        gameMetrics.startTime = Date.now();
        gameMetrics.blocksDestroyed = 0;
        gameMetrics.upgradesBought = 0;
        gameMetrics.totalClicks = 0;
        currentPlanet = 'mercury';
        currentLevelOnPlanet = 1;
        maxLevelOnCurrentPlanet = planetData[currentPlanet].maxLevel;
        blockSpeed = planetData[currentPlanet].blockSpeed;
        critChance = 0;
        critUpgradeLevel = 0;
        helperDamageUpgradeLevel = 0;
        setPlanet(currentPlanet);
        updateCoins();
        updateHUD();
        animateParticles();
        setTimeout(() => createMovingBlock(currentLevelOnPlanet), 500);
    }

    // === ОБРАБОТЧИКИ СОБЫТИЙ ===
    if (startBtn) startBtn.addEventListener('click', startGame);
    if (upgradeClickBtn) {
        upgradeClickBtn.addEventListener('click', buyClickPower);
        upgradeClickBtn.addEventListener('mouseenter', () => showTooltip('Сила удара<br>+1 урон'));
        upgradeClickBtn.addEventListener('mouseleave', hideTooltip);
    }
    if (upgradeCritBtn) {
        upgradeCritBtn.addEventListener('click', buyCritChance);
        upgradeCritBtn.addEventListener('mouseenter', () => showTooltip('Шанс крита<br>+1% (первый +2%)'));
        upgradeCritBtn.addEventListener('mouseleave', hideTooltip);
    }
    if (upgradeHelperBtn) {
        upgradeHelperBtn.addEventListener('click', buyHelper);
        upgradeHelperBtn.addEventListener('mouseenter', () => showTooltip('Помощник<br>Авто-атака на 1 минуту'));
        upgradeHelperBtn.addEventListener('mouseleave', hideTooltip);
    }
    if (upgradeHelperDamageBtn) {
        upgradeHelperDamageBtn.addEventListener('click', buyHelperDamageUpgrade);
        upgradeHelperDamageBtn.addEventListener('mouseenter', () => showTooltip('Сила помощника<br>+30% урона'));
        upgradeHelperDamageBtn.addEventListener('mouseleave', hideTooltip);
    }
    if (restartBtn) restartBtn.addEventListener('click', restartGame);
    if (shareBtn) shareBtn.addEventListener('click', shareResult);
    if (dailyRewardBtn) dailyRewardBtn.addEventListener('click', checkDailyReward);
    if (window.Telegram && Telegram.WebApp) {
        const tg = Telegram.WebApp;
        tg.expand();
    }

    updateCoins();
    updateHUD();
    setPlanet(currentPlanet);
    animateParticles();
});

document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});
