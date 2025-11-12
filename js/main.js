
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

    function createDamageText(damage, block, isCrit = false) { // <-- Добавлен isCrit
        const rect = block.getBoundingClientRect();
        const text = document.createElement('div');
        text.className = 'damage-text';
        text.textContent = `-${damage}`;
        if (isCrit) {
            text.style.color = '#ff0000'; // Красный для крита
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
        const theme = planetData[currentPlanet]; // <-- Используем planetData
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
        if (!gameActive || !particlesCanvas) return; // <-- Заменено на !gameActive
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
        if (gameActive) { // <-- Заменено на gameActive
            requestAnimationFrame(animateParticles);
        }
    }

    // === НОВАЯ ФУНКЦИЯ: Установка планеты ===
    function setPlanet(planetKey) {
        if (!planetData[planetKey]) {
            console.error(`Планета ${planetKey} не найдена в planetData`);
            return;
        }
        document.querySelectorAll('.location').forEach(el => el.classList.remove('active'));
        document.getElementById(`location-${planetKey}`).classList.add('active');
        currentPlanet = planetKey;
        maxLevelOnCurrentPlanet = planetData[planetKey].maxLevel;
        blockSpeed = planetData[planetKey].blockSpeed; // <-- Обновляем базовую скорость
        const theme = planetData[planetKey];
        if (gameTitle) gameTitle.textContent = theme.name;
        // if (pauseBtn) { // <-- Удалено
        //     pauseBtn.style.borderColor = theme.borderColor;
        //     pauseBtn.style.color = theme.color;
        // }
        if (levelInfo) levelInfo.style.color = theme.color;
        if (coinsDisplay) {
            coinsDisplay.style.color = theme.coinColor;
            coinsDisplay.style.textShadow = `0 0 4px ${theme.coinColor}80`;
        }
        if (header) header.style.borderColor = theme.borderColor;
        // Запуск анимаций для новой планеты
        initAnimationsForCurrentPlanet();
        if (levelAnnounce) {
            levelAnnounce.textContent = theme.name;
            levelAnnounce.style.color = theme.color;
            levelAnnounce.style.opacity = "1";
            setTimeout(() => {
                levelAnnounce.style.opacity = "0";
            }, 2000);
        }
        // Сбрасываем уровень на планете до 1 при входе
        currentLevelOnPlanet = 1;
        updateHUD();
    }

    // === ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: Инициализация анимаций для текущей планеты ===
    function initAnimationsForCurrentPlanet() {
        // Очищаем все canvas
        [starsCanvas, lavaCanvas, iceCanvas, bioCanvas].forEach(canvas => {
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        });

        switch(currentPlanet) {
            case 'mercury':
                initMercury(); // <-- Вызываем из mercury.js
                animateMercury(); // <-- Вызываем из mercury.js
                break;
            case 'venus':
                initVenus(); // <-- Вызываем из venus.js
                animateVenus(); // <-- Вызываем из venus.js
                break;
            case 'earth':
                initEarth(); // <-- Вызываем из earth.js
                animateEarth(); // <-- Вызываем из earth.js
                break;
            case 'mars':
                initMars(); // <-- Вызываем из mars.js
                animateMars(); // <-- Вызываем из mars.js
                break;
            case 'jupiter':
                initJupiter(); // <-- Вызываем из jupiter.js
                animateJupiter(); // <-- Вызываем из jupiter.js
                break;
            case 'saturn':
                initSaturn(); // <-- Вызываем из saturn.js
                animateSaturn(); // <-- Вызываем из saturn.js
                break;
            case 'uranus':
                initUranus(); // <-- Вызываем из uranus.js
                animateUranus(); // <-- Вызываем из uranus.js
                break;
            case 'neptune':
                initNeptune(); // <-- Вызываем из neptune.js
                animateNeptune(); // <-- Вызываем из neptune.js
                break;
            case 'pluto':
                initPluto(); // <-- Вызываем из pluto.js
                animatePluto(); // <-- Вызываем из pluto.js
                break;
        }
    }

    function getCurrentSpeed() {
        // return Math.max(5, blockSpeed - slowBonus * 2); // <-- Заменено
        return blockSpeed; // <-- Упрощённый расчёт скорости без замедления
    }

    function updateHUD() {
        // Изменяем формат отображения уровня
        if (levelInfo) levelInfo.textContent = `Ур. ${currentLevelOnPlanet}/${maxLevelOnCurrentPlanet} (${planetData[currentPlanet].name})`;
        if (clickPowerDisplay) clickPowerDisplay.textContent = `Сила: ${clickPower}`;
        if (critChanceDisplay) critChanceDisplay.textContent = `Шанс крита: ${Math.floor(critChance)}%`; // <-- Новое
        if (speedDisplay) speedDisplay.textContent = `Скорость: ${Math.round(getCurrentSpeed())}`;
        if (blockLevelDisplay) blockLevelDisplay.textContent = `Блок: ${currentLevelOnPlanet}`;
        if (blockHealthDisplay) blockHealthDisplay.textContent = `Осталось: ${currentBlockHealth > 0 ? currentBlockHealth : '—'}`;
        if (helperDamageDisplay) helperDamageDisplay.textContent = `Урон помощника: ${Math.floor(clickPower * helperDamageMultiplier)}`; // <-- Новое
        updateHelperTimer();
    }

    function updateCoins() {
        if (coinsDisplay) coinsDisplay.textContent = `Камушки: ${Math.floor(coins).toLocaleString()}`;
        updateUpgradeButtons();
    }

    function updateUpgradeButtons() {
        const clickCost = Math.floor(baseClickUpgradeCost * Math.pow(1.5, clickUpgradeLevel));
        // const slowCost = 2000; // <-- Удалено
        const critCost = Math.floor(critBaseCost * Math.pow(critCostMultiplier, critUpgradeLevel)); // <-- Новое
        const helperDamageCost = Math.floor(2000 * Math.pow(2.0, helperDamageUpgradeLevel)); // <-- Новое (примерная формула)

        if (upgradeClickBtn) {
            if (coins >= clickCost) {
                upgradeClickBtn.className = "upgrade-btn btn-available";
            } else {
                upgradeClickBtn.className = "upgrade-btn btn-unavailable";
            }
        }
        // if (upgradeSlowBtn) { // <-- Удалено
        //     if (coins >= slowCost && slowBonus === 0) {
        //         upgradeSlowBtn.className = "upgrade-btn btn-available";
        //     } else {
        //         upgradeSlowBtn.className = "upgrade-btn btn-unavailable";
        //     }
        // }
        if (upgradeCritBtn) { // <-- Новое
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
        if (upgradeHelperDamageBtn) { // <-- Новое
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

    // function buySlow() { // <-- Удалено
    //     if (coins >= slowCost && slowBonus === 0) {
    //         coins -= slowCost;
    //         slowBonus += 1;
    //         gameMetrics.upgradesBought++;
    //         updateCoins();
    //         updateHUD();
    //         playSound('upgradeSound');
    //         showTooltip(`Скорость блоков уменьшена!`);
    //         setTimeout(hideTooltip, 1500);
    //         saveGame();
    //     }
    // }

    function buyCritChance() { // <-- Новое
        const cost = Math.floor(critBaseCost * Math.pow(critCostMultiplier, critUpgradeLevel));
        if (coins >= cost) {
            coins -= cost;
            if (critUpgradeLevel === 0) {
                critChance = critBaseChance; // Устанавливаем базовый шанс при первом улучшении
            } else {
                critChance += 1; // Увеличиваем шанс на 1% за каждое последующее улучшение
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

    function buyHelperDamageUpgrade() { // <-- Новое
        const cost = Math.floor(2000 * Math.pow(2.0, helperDamageUpgradeLevel)); // Примерная формула
        if (coins >= cost) {
            coins -= cost;
            helperDamageMultiplier += 0.3; // Увеличиваем урон помощника на 30% за уровень
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
            activateHelper(); // <-- Вызываем из helper.js
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
        // Используем параметры текущей планеты
        const currentPlanetData = planetData[currentPlanet];
        const blockHealth = Math.floor(currentPlanetData.baseHealth * Math.pow(currentPlanetData.healthMultiplier, level - 1));
        currentBlockHealth = blockHealth;
        // maxLevelReached обновляется в destroyBlock
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
        if (!gameActive) return; // <-- Заменено на !gameActive
        const speed = getCurrentSpeed();
        let position = parseInt(block.style.bottom) || 0;
        function move() {
            if (!gameActive || currentBlock !== block) return; // <-- Заменено на !gameActive
            position += speed / 30;
            block.style.bottom = position + "px";
            if (position > window.innerHeight) {
                // Игра НЕ завершается по уходу блока в новой системе
                // gameOver(); // <-- Закомментировано
                // Вместо этого, просто удалим блок и создадим новый
                if (gameArea.contains(block)) {
                    gameArea.removeChild(block);
                }
                currentBlock = null;
                currentBlockHealth = 0;
                // Создаём новый блок
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

    function gameOver() {
        // Функция gameOver больше не используется, так как игра не завершается
        // gameActive = false;
        // ... остальная логика ...
    }

    // function togglePause() { // <-- Удалено
    //     if (!gameActive) return;
    //     paused = !paused;
    //     if (pauseBtn) {
    //         pauseBtn.textContent = paused ? "▶ Продолжить" : "⏸ Пауза";
    //     }
    // }

    function shareResult() {
        const shareText = `🎮 Я достиг ${maxLevelReached} уровня в Космическом Кликере! 🌌
Сможешь побить мой рекорд?`;
        if (navigator.share) {
            navigator.share({
                title: 'Мой рекорд в Космическом Кликере!',
                text: shareText
            }).then(() => {
                coins += 50;
                updateCoins();
                showTooltip('+50 камушков за распространение!');
                setTimeout(hideTooltip, 2000);
                saveGame();
            });
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Результат скопирован! Поделись с друзьями!');
                coins += 50;
                updateCoins();
                saveGame();
            });
        }
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
        helperDamageMultiplier = 1.3; // <-- Сброс урона помощника при старте игры
        gameMetrics.startTime = Date.now();
        gameMetrics.blocksDestroyed = 0;
        gameMetrics.upgradesBought = 0;
        gameMetrics.totalClicks = 0;
        updateCoins();
        updateHUD();
        setPlanet(currentPlanet); // <-- Устанавливаем текущую планету (или Меркурий при первом запуске)
        animateParticles();
        setTimeout(() => createMovingBlock(currentLevelOnPlanet), 500);
    }

    function restartGame() {
        coins = 0;
        maxLevelReached = 0;
        clickPower = 1;
        clickUpgradeLevel = 0;
        // slowBonus = 0; // <-- Удалено
        gameActive = true; // <-- Удалена переменная paused
        comboCount = 0;
        lastDestroyTime = 0;
        helperActive = false;
        helperTimeLeft = 0;
        helperDamageMultiplier = 1.3; // <-- Новое: сброс урона помощника
        if (helperInterval) clearInterval(helperInterval);
        gameArea.innerHTML = "";
        if (gameOverScreen) gameOverScreen.style.display = "none";
        // if (pauseBtn) pauseBtn.textContent = "⏸ Пауза"; // <-- Удалено
        if (levelInfo) levelInfo.textContent = "Уровень: —";
        if (levelAnnounce) levelAnnounce.style.opacity = "0";
        gameMetrics.startTime = Date.now();
        gameMetrics.blocksDestroyed = 0;
        gameMetrics.upgradesBought = 0;
        gameMetrics.totalClicks = 0;
        // Сброс к начальной планете и уровню
        currentPlanet = 'mercury';
        currentLevelOnPlanet = 1;
        maxLevelOnCurrentPlanet = planetData[currentPlanet].maxLevel;
        blockSpeed = planetData[currentPlanet].blockSpeed;
        critChance = 0; // <-- Новое: сброс крита
        critUpgradeLevel = 0; // <-- Новое: сброс улучшения крита
        helperDamageUpgradeLevel = 0; // <-- Новое: сброс улучшения урона помощника
        setPlanet(currentPlanet);
        updateCoins();
        updateHUD();
        animateParticles();
        setTimeout(() => createMovingBlock(currentLevelOnPlanet), 500);
    }

    // === ОБРАБОТЧИКИ СОБЫТИЙ ===
    if (startBtn) startBtn.addEventListener('click', startGame);
    // if (pauseBtn) pauseBtn.addEventListener('click', togglePause); // <-- Удалено
    if (upgradeClickBtn) {
        upgradeClickBtn.addEventListener('click', buyClickPower);
        upgradeClickBtn.addEventListener('mouseenter', () => showTooltip('Сила удара<br>+1 урон'));
        upgradeClickBtn.addEventListener('mouseleave', hideTooltip);
    }
    // if (upgradeSlowBtn) { // <-- Удалено
    //     upgradeSlowBtn.addEventListener('click', buySlow);
    //     upgradeSlowBtn.addEventListener('mouseenter', () => showTooltip('Якорь<br>−2 скорости'));
    //     upgradeSlowBtn.addEventListener('mouseleave', hideTooltip);
    // }
    if (upgradeCritBtn) { // <-- Новое
        upgradeCritBtn.addEventListener('click', buyCritChance);
        upgradeCritBtn.addEventListener('mouseenter', () => showTooltip('Шанс крита<br>+1% (первый +2%)'));
        upgradeCritBtn.addEventListener('mouseleave', hideTooltip);
    }
    if (upgradeHelperBtn) {
        upgradeHelperBtn.addEventListener('click', buyHelper);
        upgradeHelperBtn.addEventListener('mouseenter', () => showTooltip('Помощник<br>Авто-атака на 1 минуту'));
        upgradeHelperBtn.addEventListener('mouseleave', hideTooltip);
    }
    if (upgradeHelperDamageBtn) { // <-- Новое
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

    // ИНИЦИАЛИЗАЦИЯ
    updateCoins();
    updateHUD();
    setPlanet(currentPlanet); // <-- Устанавливаем начальную планету при загрузке
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
