// Основная игровая логика
(function() {
    'use strict';
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const astronomicalUnits = {
        mercury: 0.38710,
        venus: 0.72333,
        earth: 1.00000,
        mars: 1.52366,
        jupiter: 5.20336,
        saturn: 9.53707,
        uranus: 19.19126,
        neptune: 30.06896,
        pluto: 39.48200
    };
    
    const AU_TO_DAMAGE = 149597870.691;
    const planetOrder = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    
    const locationRequirements = {
        mercury: { damageRequired: 0, targetAU: astronomicalUnits.mercury, nextLocation: 'venus' },
        venus: { damageRequired: 0, targetAU: astronomicalUnits.venus, nextLocation: 'earth' },
        earth: { damageRequired: 0, targetAU: astronomicalUnits.earth, nextLocation: 'mars' },
        mars: { damageRequired: 0, targetAU: astronomicalUnits.mars, nextLocation: 'jupiter' },
        jupiter: { damageRequired: 0, targetAU: astronomicalUnits.jupiter, nextLocation: 'saturn' },
        saturn: { damageRequired: 0, targetAU: astronomicalUnits.saturn, nextLocation: 'uranus' },
        uranus: { damageRequired: 0, targetAU: astronomicalUnits.uranus, nextLocation: 'neptune' },
        neptune: { damageRequired: 0, targetAU: astronomicalUnits.neptune, nextLocation: 'pluto' },
        pluto: { damageRequired: 0, targetAU: astronomicalUnits.pluto, nextLocation: null }
    };
    
    const locations = {
        mercury: { name: "☿ Меркурий", color: "#bb86fc", coinColor: "#a0d2ff", borderColor: "#4a55e0", blockColors: ['#2962ff', '#4fc3f7', '#bb86fc', '#f8bbd0'] },
        venus: { name: "♀ Венера", color: "#ffab91", coinColor: "#a0d2ff", borderColor: "#ff5722", blockColors: ['#ff5722', '#ff9800', '#ff5722', '#e91e63'] },
        earth: { name: "♁ Земля", color: "#80deea", coinColor: "#a0d2ff", borderColor: "#0288d1", blockColors: ['#0288d1', '#29b6f6', '#00bcd4', '#00e5ff'] },
        mars: { name: "♂ Марс", color: "#a5d6a7", coinColor: "#a0d2ff", borderColor: "#388e3c", blockColors: ['#388e3c', '#66bb6a', '#9ccc65', '#d4e157'] },
        jupiter: { name: "♃ Юпитер", color: "#ce93d8", coinColor: "#a0d2ff", borderColor: "#7b1fa2", blockColors: ['#7b1fa2', '#9c27b0', '#ab47bc', '#e1bee7'] },
        saturn: { name: "♄ Сатурн", color: "#ce93d8", coinColor: "#a0d2ff", borderColor: "#7b1fa2", blockColors: ['#7b1fa2', '#9c27b0', '#ab47bc', '#e1bee7'] },
        uranus: { name: "♅ Уран", color: "#ce93d8", coinColor: "#a0d2ff", borderColor: "#7b1fa2", blockColors: ['#7b1fa2', '#9c27b0', '#ab47bc', '#e1bee7'] },
        neptune: { name: "♆ Нептун", color: "#ce93d8", coinColor: "#a0d2ff", borderColor: "#7b1fa2", blockColors: ['#7b1fa2', '#9c27b0', '#ab47bc', '#e1bee7'] },
        pluto: { name: "♇ Плутон", color: "#ce93d8", coinColor: "#a0d2ff", borderColor: "#7b1fa2", blockColors: ['#7b1fa2', '#9c27b0', '#ab47bc', '#e1bee7'] }
    };
    
    let blockSpeed = isMobile ? 25 : 20;
    const baseClickUpgradeCost = 80;
    const baseHelperUpgradeCost = 1500;
    const baseCritChanceCost = 500;
    const baseCritMultiplierCost = 800;
    const baseHelperDmgCost = 1000;
    
    const rareBlocks = {
        GOLD: { name: "Золотой", chance: 0.03, multiplier: 8, healthMultiplier: 1.8, effect: "Мгновенный бонус", className: "block-gold" },
        RAINBOW: { name: "Радужный", chance: 0.02, multiplier: 5, healthMultiplier: 1.5, effect: "Увеличение силы", className: "block-rainbow" },
        CRYSTAL: { name: "Кристальный", chance: 0.025, multiplier: 6, healthMultiplier: 1.6, effect: "Время помощника", className: "block-crystal" },
        MYSTERY: { name: "Загадочный", chance: 0.015, multiplier: 10, healthMultiplier: 2.0, effect: "Случайный бонус", className: "block-mystery" }
    };
    
    const balanceConfig = {
        baseHealth: 80,
        targetClicks: 70,
        healthRandomRange: { min: 0.8, max: 1.3 },
        damageProgression: { baseMultiplier: 1.15, diminishingReturns: 0.96, maxLevelEffect: 60 },
        rewardMultiplier: 2.5,
        comboMultiplier: 0.25,
        randomBonusRange: { min: 0.8, max: 1.5 },
        penaltyMin: 0.05,  // ✅ Минимальный штраф 5%
        penaltyMax: 0.45   // ✅ Максимальный штраф 45%
    };
    
    let currentBlock = null;
    let currentBlockHealth = 0;
    let helperElement = null;
    let helperInterval = null;
    let helperPosition = { x: 0, y: 0 };
    let helperTimer = null;
    
    function getCurrentSpeed() {
        if (!window.gameState) return blockSpeed;
        let speed = blockSpeed;
        const locationIndex = planetOrder.indexOf(window.gameState.currentLocation);
        if (locationIndex < 3) speed *= 0.85;
        
        if (window.shopSystem && typeof window.shopSystem.getSpeedMultiplier === 'function') {
            speed *= window.shopSystem.getSpeedMultiplier();
        }
        return speed;
    }
    
    function calculateBlockHealth() {
        const currentReq = locationRequirements[window.gameState.currentLocation];
        const locationBonus = 1 + (currentReq.targetAU * 2);
        let baseHealth = balanceConfig.baseHealth * locationBonus;
        const targetHealth = window.gameState.clickPower * balanceConfig.targetClicks;
        const combinedHealth = (baseHealth + targetHealth) / 2;
        const randomFactor = balanceConfig.healthRandomRange.min +
            Math.random() * (balanceConfig.healthRandomRange.max - balanceConfig.healthRandomRange.min);
        return Math.floor(combinedHealth * randomFactor);
    }
    
    function calculateClickPower() {
        const basePower = 1;
        const upgradeBonus = window.gameState.clickUpgradeLevel;
        const diminishingEffect = Math.pow(balanceConfig.damageProgression.diminishingReturns,
            Math.min(window.gameState.clickUpgradeLevel, balanceConfig.damageProgression.maxLevelEffect));
        const nonLinearGrowth = Math.sqrt(window.gameState.clickUpgradeLevel + 1);
        return basePower + (upgradeBonus * diminishingEffect * nonLinearGrowth * balanceConfig.damageProgression.baseMultiplier);
    }
    
    function getRareBlockType() {
        const rand = Math.random();
        let cumulativeChance = 0;
        for (const [type, block] of Object.entries(rareBlocks)) {
            cumulativeChance += block.chance;
            if (rand <= cumulativeChance) return type;
        }
        return null;
    }
    
    function announceRareBlock(blockName) {
        const announce = document.createElement('div');
        announce.className = 'rare-block-announce';
        announce.style.cssText = `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1.8em; font-weight: bold; color: gold; z-index: 50; text-shadow: 0 0 10px black; animation: fadeInOut 2s;`;
        announce.textContent = `🌟 ${blockName} блок! 🌟`;
        document.body.appendChild(announce);
        setTimeout(() => {
            if (announce.parentNode) document.body.removeChild(announce);
        }, 2000);
    }
    
    function updateHUD() {
        if (!window.gameState) return;
        const coinsDisplay = document.getElementById('coins-value');
        const clickPowerDisplay = document.getElementById('clickPower-value');
        const critChanceDisplay = document.getElementById('critChance-value');
        const critMultiplierDisplay = document.getElementById('critMultiplier-value');
        
        if (coinsDisplay) coinsDisplay.textContent = Math.floor(window.gameState.coins).toLocaleString();
        if (clickPowerDisplay) clickPowerDisplay.textContent = Math.round(window.gameState.clickPower);
        if (critChanceDisplay) critChanceDisplay.textContent = `${(window.gameState.critChance * 100).toFixed(1)}%`;
        if (critMultiplierDisplay) critMultiplierDisplay.textContent = `x${window.gameState.critMultiplier.toFixed(1)}`;
    }
    
    function updateUpgradeButtons() {
        if (!window.gameState) return;
        
        const clickCost = Math.floor(baseClickUpgradeCost * Math.pow(1.5, window.gameState.clickUpgradeLevel));
        const upgradeClickBtn = document.getElementById('upgradeClickBtn');
        if (upgradeClickBtn) {
            upgradeClickBtn.querySelector('.upgrade-cost').textContent = clickCost.toLocaleString();
            if (window.gameState.coins >= clickCost) {
                upgradeClickBtn.className = "upgrade-btn btn-available";
                upgradeClickBtn.title = "Увеличить силу удара";
            } else {
                upgradeClickBtn.className = "upgrade-btn btn-unavailable";
                upgradeClickBtn.title = "Недостаточно кристаллов";
            }
        }
        
        const baseHelperCost = Math.floor(baseHelperUpgradeCost * Math.pow(1.4, window.gameState.helperUpgradeLevel));
        const activationBonus = Math.floor((window.gameState.helperActivations || 0) / 10);
        const helperCost = Math.floor(baseHelperCost * (1 + activationBonus * 0.2));
        
        const upgradeHelperBtn = document.getElementById('upgradeHelperBtn');
        if (upgradeHelperBtn) {
            upgradeHelperBtn.querySelector('.upgrade-cost').textContent = helperCost.toLocaleString();
            if (window.gameState.coins >= helperCost) {
                upgradeHelperBtn.className = "upgrade-btn btn-available";
                upgradeHelperBtn.title = `Активировать Bobo на 1 минуту (Активаций: ${window.gameState.helperActivations || 0})`;
            } else {
                upgradeHelperBtn.className = "upgrade-btn btn-unavailable";
                upgradeHelperBtn.title = "Недостаточно кристаллов";
            }
        }
        
        const critChanceCost = Math.floor(baseCritChanceCost * Math.pow(1.3, window.gameState.critChanceUpgradeLevel));
        const upgradeCritChanceBtn = document.getElementById('upgradeCritChanceBtn');
        if (upgradeCritChanceBtn) {
            upgradeCritChanceBtn.querySelector('.upgrade-cost').textContent = critChanceCost.toLocaleString();
            if (window.gameState.coins >= critChanceCost) {
                upgradeCritChanceBtn.className = "upgrade-btn btn-available";
                upgradeCritChanceBtn.title = "Увеличить шанс критического удара";
            } else {
                upgradeCritChanceBtn.className = "upgrade-btn btn-unavailable";
                upgradeCritChanceBtn.title = "Недостаточно кристаллов";
            }
        }
        
        const critMultiplierCost = Math.floor(baseCritMultiplierCost * Math.pow(1.25, window.gameState.critMultiplierUpgradeLevel));
        const upgradeCritMultBtn = document.getElementById('upgradeCritMultBtn');
        if (upgradeCritMultBtn) {
            upgradeCritMultBtn.querySelector('.upgrade-cost').textContent = critMultiplierCost.toLocaleString();
            if (window.gameState.coins >= critMultiplierCost) {
                upgradeCritMultBtn.className = "upgrade-btn btn-available";
                upgradeCritMultBtn.title = "Увеличить множитель критического удара";
            } else {
                upgradeCritMultBtn.className = "upgrade-btn btn-unavailable";
                upgradeCritMultBtn.title = "Недостаточно кристаллов";
            }
        }
        
        const helperDmgCost = Math.floor(baseHelperDmgCost * Math.pow(1.8, window.gameState.helperUpgradeLevel));
        const upgradeHelperDmgBtn = document.getElementById('upgradeHelperDmgBtn');
        if (upgradeHelperDmgBtn) {
            upgradeHelperDmgBtn.querySelector('.upgrade-cost').textContent = helperDmgCost.toLocaleString();
            if (window.gameState.coins >= helperDmgCost) {
                upgradeHelperDmgBtn.className = "upgrade-btn btn-available";
                upgradeHelperDmgBtn.title = "Увеличить урон помощника";
            } else {
                upgradeHelperDmgBtn.className = "upgrade-btn btn-unavailable";
                upgradeHelperDmgBtn.title = "Недостаточно кристаллов";
            }
        }
    }
    
    function updateProgressBar() {
        if (!window.gameState) return;
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const currentReq = locationRequirements[window.gameState.currentLocation];
        const currentAU = window.gameState.totalDamageDealt / AU_TO_DAMAGE;
        const targetAU = currentReq.targetAU;
        const percentage = Math.min(100, (currentAU / targetAU) * 100);
        
        if (progressBar) progressBar.style.width = percentage + '%';
        if (progressText) {
            window.applyTranslation(progressText, 'progressText', {
                current: currentAU.toFixed(5),
                target: targetAU.toFixed(5),
                percent: percentage.toFixed(1)
            });
        }
    }
    
    function checkLocationUpgrade() {
        if (!window.gameState) return;
        const currentReq = locationRequirements[window.gameState.currentLocation];
        const nextLocation = currentReq.nextLocation;
        const currentAU = window.gameState.totalDamageDealt / AU_TO_DAMAGE;
        const targetAU = currentReq.targetAU;
        
        if (nextLocation && currentAU >= targetAU) {
            setLocation(nextLocation);
            const tooltipText = window.formatString(
                window.translations[window.currentLanguage].locationProgress.unlocked,
                { location: locations[nextLocation].name }
            );
            if (window.showTooltip) window.showTooltip(tooltipText);
            setTimeout(window.hideTooltip, 3000);
        }
        updateProgressBar();
    }
    
    function setLocation(loc) {
        if (!window.gameState) return;
        const currentIdx = planetOrder.indexOf(window.gameState.currentLocation);
        const targetIdx = planetOrder.indexOf(loc);
        
        if (targetIdx < currentIdx) {
            console.warn("Нельзя вернуться к предыдущей локации!");
            return;
        }
        
        window.gameState.currentLocation = loc;
        
        const gameTitle = document.getElementById('gameTitle');
        const header = document.getElementById('header');
        if (gameTitle) window.applyTranslation(gameTitle, `gameTitle.${loc}`);
        if (header) header.style.borderColor = locations[loc].borderColor;
        
        if (window.planetBackground && window.planetBackground.setPlanet) {
            window.planetBackground.setPlanet(loc);
        }
        
        const levelAnnounce = document.getElementById('levelAnnounce');
        if (levelAnnounce) {
            levelAnnounce.textContent = locations[loc].name;
            levelAnnounce.style.color = locations[loc].color;
            levelAnnounce.style.opacity = "1";
            setTimeout(() => {
                levelAnnounce.style.opacity = "0";
            }, 2000);
        }
        
        if (window.achievementsSystem) {
            const planetIndex = planetOrder.indexOf(loc) + 1;
            window.achievementsSystem.updatePlanetProgress(planetIndex);
        }
        updateProgressBar();
    }
    
    // ✅ НОВАЯ ФУНКЦИЯ: Применение штрафа за пропуск блока
    function applyUpgradePenalty() {
        if (!window.gameState) return;
        
        // Выбираем случайное улучшение для штрафа
        const upgrades = [
            { key: 'clickUpgradeLevel', name: 'Сила удара', getValue: () => window.gameState.clickUpgradeLevel, setValue: (v) => { window.gameState.clickUpgradeLevel = v; } },
            { key: 'critChanceUpgradeLevel', name: 'Шанс крита', getValue: () => window.gameState.critChanceUpgradeLevel, setValue: (v) => { window.gameState.critChanceUpgradeLevel = v; window.gameState.critChance = Math.max(0.001, 0.001 + v * 0.001); } },
            { key: 'critMultiplierUpgradeLevel', name: 'Множитель крита', getValue: () => window.gameState.critMultiplierUpgradeLevel, setValue: (v) => { window.gameState.critMultiplierUpgradeLevel = v; window.gameState.critMultiplier = Math.max(2.0, 2.0 + v * 0.2); } },
            { key: 'helperUpgradeLevel', name: 'Урон Bobo', getValue: () => window.gameState.helperUpgradeLevel, setValue: (v) => { window.gameState.helperUpgradeLevel = v; } }
        ];
        
        // Выбираем случайное улучшение
        const randomUpgrade = upgrades[Math.floor(Math.random() * upgrades.length)];
        
        // Генерируем случайный процент штрафа (5% - 45%)
        const penaltyPercent = balanceConfig.penaltyMin + Math.random() * (balanceConfig.penaltyMax - balanceConfig.penaltyMin);
        const penaltyPercentRounded = Math.round(penaltyPercent * 100);
        
        // Получаем текущее значение
        const currentValue = randomUpgrade.getValue();
        
        // Если улучшение уже на 0, не штрафуем
        if (currentValue <= 0) {
            console.log('⚠️ Улучшение уже на 0, штраф не применяется');
            return;
        }
        
        // Рассчитываем новое значение
        const newValue = Math.max(0, Math.floor(currentValue * (1 - penaltyPercent)));
        const lostValue = currentValue - newValue;
        
        // Применяем штраф
        randomUpgrade.setValue(newValue);
        
        // Пересчитываем силу клика
        window.gameState.clickPower = calculateClickPower();
        
        // Показываем уведомление
        showPenaltyAnnouncement(randomUpgrade.name, penaltyPercentRounded, lostValue);
        
        // Звук штрафа
        playSound('penaltySound');
        
        // Виброотдача
        if (window.telegramHaptic) {
            window.telegramHaptic.error();
        } else if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
        
        // Обновляем HUD и кнопки
        updateHUD();
        updateUpgradeButtons();
        
        // Сохраняем игру
        window.saveGame();
        
        console.log(`⚠️ Штраф применён: ${randomUpgrade.name} -${penaltyPercentRounded}% (${currentValue} → ${newValue})`);
    }
    
    // ✅ Показ уведомления о штрафе
    function showPenaltyAnnouncement(upgradeName, penaltyPercent, lostValue) {
        const penaltyAnnounce = document.getElementById('penaltyAnnounce');
        if (!penaltyAnnounce) return;
        
        penaltyAnnounce.innerHTML = `
            <div style="font-size: 1.5em; color: #ff6b6b; font-weight: bold;">⚠️ ШТРАФ!</div>
            <div style="font-size: 1.1em; color: #fff; margin: 10px 0;">${upgradeName} -${penaltyPercent}%</div>
            <div style="font-size: 0.9em; color: #ccc;">Потеряно уровней: ${lostValue}</div>
        `;
        
        penaltyAnnounce.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(255, 107, 107, 0.95), rgba(255, 68, 68, 0.95));
            color: #fff;
            padding: 30px 40px;
            border-radius: 15px;
            z-index: 2000;
            text-align: center;
            font-family: 'Orbitron', sans-serif;
            box-shadow: 0 10px 40px rgba(255, 107, 107, 0.5);
            border: 3px solid #ff4444;
            animation: penaltyPulse 0.5s ease-out;
        `;
        
        penaltyAnnounce.style.opacity = '1';
        penaltyAnnounce.style.display = 'block';
        
        setTimeout(() => {
            penaltyAnnounce.style.transition = 'all 0.5s ease-in';
            penaltyAnnounce.style.opacity = '0';
            penaltyAnnounce.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => {
                penaltyAnnounce.style.display = 'none';
            }, 500);
        }, 2500);
    }
    
    function createDamageText(damage, block, color = '#ff4444') {
        const rect = block.getBoundingClientRect();
        const text = document.createElement('div');
        text.className = 'damage-text';
        text.textContent = `-${damage}`;
        text.style.color = color;
        
        let left = rect.left + rect.width / 2;
        let top = rect.top;
        const textWidth = 100;
        
        if (left < textWidth / 2) left = textWidth / 2;
        if (left > window.innerWidth - textWidth / 2) left = window.innerWidth - textWidth / 2;
        if (top < 50) top = 50;
        
        text.style.left = left + 'px';
        text.style.top = top + 'px';
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
                if (text.parentNode) document.body.removeChild(text);
            }
        }
        animate();
    }
    
    function showComboText(combo, bonus, block) {
        const rect = block.getBoundingClientRect();
        const text = document.createElement('div');
        text.className = 'combo-text';
        text.textContent = window.formatString(
            window.translations[window.currentLanguage].tooltips.combo,
            { count: combo, bonus: bonus }
        );
        
        let left = rect.left + rect.width / 2;
        let top = rect.top;
        const textWidth = 150;
        
        if (left < textWidth / 2) left = textWidth / 2;
        if (left > window.innerWidth - textWidth / 2) left = window.innerWidth - textWidth / 2;
        if (top < 50) top = 50;
        
        text.style.left = left + 'px';
        text.style.top = top + 'px';
        document.body.appendChild(text);
        
        setTimeout(() => {
            if (text.parentNode) document.body.removeChild(text);
        }, 1000);
    }
    
    function showRewardText(reward, block) {
        const rect = block.getBoundingClientRect();
        const text = document.createElement('div');
        text.className = 'reward-text';
        text.textContent = window.formatString(
            window.translations[window.currentLanguage].tooltips.reward,
            { reward: reward }
        );
        
        let left = rect.left + rect.width / 2;
        let top = rect.top + rect.height / 2;
        const textWidth = 120;
        
        if (left < textWidth / 2) left = textWidth / 2;
        if (left > window.innerWidth - textWidth / 2) left = window.innerWidth - textWidth / 2;
        if (top < 50) top = 50;
        
        text.style.left = left + 'px';
        text.style.top = top + 'px';
        document.body.appendChild(text);
        
        setTimeout(() => {
            if (text.parentNode) document.body.removeChild(text);
        }, 1500);
    }
    
    function createExplosion(block) {
        const rect = block.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const explosionSize = isMobile ? 150 : 200;
        
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        explosion.style.left = centerX + 'px';
        explosion.style.top = centerY + 'px';
        explosion.style.width = explosionSize + 'px';
        explosion.style.height = explosionSize + 'px';
        document.body.appendChild(explosion);
        
        const particleCount = isMobile ? 20 : 25;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'explosion-particle';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            const particleSize = isMobile ? 10 : 12;
            particle.style.width = particleSize + 'px';
            particle.style.height = particleSize + 'px';
            
            const location = locations[window.gameState.currentLocation];
            particle.style.backgroundColor = location.blockColors[Math.floor(Math.random() * location.blockColors.length)];
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 100;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.setProperty('--tx', tx + 'px');
            particle.style.setProperty('--ty', ty + 'px');
            document.body.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) document.body.removeChild(particle);
            }, 800);
        }
        
        setTimeout(() => {
            if (explosion.parentNode) document.body.removeChild(explosion);
        }, 600);
    }
    
    function updateCracks(block, health) {
        if (!block) return;
        const existingCrack = block.querySelector('.crack-overlay');
        if (existingCrack) block.removeChild(existingCrack);
        
        const maxHealth = parseInt(block.dataset.maxHealth);
        const damageRatio = 1 - (health / maxHealth);
        
        if (damageRatio > 0.7) {
            addCracks(block, 'crack-3');
        } else if (damageRatio > 0.4) {
            addCracks(block, 'crack-2');
        } else if (damageRatio > 0.1) {
            addCracks(block, 'crack-1');
        }
    }
    
    function addCracks(block, crackLevel) {
        const crackOverlay = document.createElement('div');
        crackOverlay.className = `crack-overlay ${crackLevel}`;
        block.appendChild(crackOverlay);
    }
    
    function playSound(soundId) {
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => {});
        }
    }
    
    function hitBlock(block, damage) {
        if (!window.gameState || !window.gameState.gameActive) return;
        
        if (navigator.vibrate) navigator.vibrate(50);
        if (window.telegramHaptic) window.telegramHaptic.light();
        
        playSound('clickSound');
        
        block.style.transform = 'translateX(-50%) scale(0.85)';
        setTimeout(() => {
            block.style.transform = 'translateX(-50%) scale(1)';
        }, 100);
        
        let finalDamage = Math.round(damage);
        let isCrit = false;
        
        if (Math.random() < window.gameState.critChance) {
            finalDamage = Math.round(damage * window.gameState.critMultiplier);
            isCrit = true;
            window.gameMetrics.totalCrits = (window.gameMetrics.totalCrits || 0) + 1;
            if (window.achievementsSystem) {
                window.achievementsSystem.incrementCrits(1);
            }
        }
        
        currentBlockHealth -= finalDamage;
        window.gameState.totalDamageDealt += finalDamage;
        window.gameMetrics.totalClicks = (window.gameMetrics.totalClicks || 0) + 1;
        
        createDamageText(finalDamage, block, isCrit ? '#FFD700' : '#ff4444');
        checkLocationUpgrade();
        
        if (currentBlockHealth <= 0) {
            destroyBlock(block);
        } else {
            block.textContent = Math.floor(currentBlockHealth);
            updateCracks(block, currentBlockHealth);
        }
    }
    
    function destroyBlock(block) {
        if (!window.gameState) return;
        
        const now = Date.now();
        const COMBO_TIME_WINDOW = isMobile ? 1500 : 2000;
        
        if (now - window.gameState.lastDestroyTime < COMBO_TIME_WINDOW) {
            window.gameState.comboCount = (window.gameState.comboCount || 0) + 1;
        } else {
            window.gameState.comboCount = 1;
        }
        window.gameState.lastDestroyTime = now;
        
        const baseReward = 25 + (locationRequirements[window.gameState.currentLocation].targetAU * 100);
        let reward = Math.floor(baseReward * balanceConfig.rewardMultiplier);
        
        const randomBonus = balanceConfig.randomBonusRange.min +
            Math.random() * (balanceConfig.randomBonusRange.max - balanceConfig.randomBonusRange.min);
        reward = Math.floor(reward * randomBonus);
        
        if (window.gameState.boboCoinBonus > 0) {
            reward = Math.floor(reward * (1 + window.gameState.boboCoinBonus));
        }
        
        if (window.gameState.shopItems && window.gameState.shopItems.crystalBoost && window.gameState.shopItems.crystalBoost.active) {
            reward = Math.floor(reward * 1.5);
        }
        
        let isRare = false;
        for (const type in rareBlocks) {
            if (block.classList.contains(rareBlocks[type].className)) {
                isRare = true;
                reward = Math.floor(reward * rareBlocks[type].multiplier);
                break;
            }
        }
        
        if (window.gameState.comboCount > 1) {
            const comboBonus = Math.floor(reward * (window.gameState.comboCount * balanceConfig.comboMultiplier));
            reward += comboBonus;
            showComboText(window.gameState.comboCount, comboBonus, block);
            playSound('comboSound');
        }
        
        window.gameState.coins += reward;
        window.gameMetrics.blocksDestroyed = (window.gameMetrics.blocksDestroyed || 0) + 1;
        window.gameMetrics.totalCoinsEarned = (window.gameMetrics.totalCoinsEarned || 0) + reward;
        
        if (window.achievementsSystem) {
            window.achievementsSystem.incrementBlocksDestroyed(1);
            window.achievementsSystem.incrementCoinsEarned(reward);
            if (window.gameState.comboCount > (window.gameMetrics.maxCombo || 0)) {
                window.gameMetrics.maxCombo = window.gameState.comboCount;
                window.achievementsSystem.updateCombo(window.gameState.comboCount);
            }
        }
        
        updateHUD();
        updateUpgradeButtons();
        playSound('breakSound');
        showRewardText(reward, block);
        createExplosion(block);
        
        const gameArea = document.getElementById('gameArea');
        if (gameArea && gameArea.contains(block)) {
            gameArea.removeChild(block);
        }
        
        currentBlock = null;
        currentBlockHealth = 0;
        
        setTimeout(() => {
            if (window.gameState && window.gameState.gameActive) createMovingBlock();
        }, 500);
    }
    
    function getBlockSize() {
        const baseSize = isMobile ? 80 : 60;
        const locationIndex = planetOrder.indexOf(window.gameState.currentLocation);
        if (locationIndex < 3) return baseSize * 1.2;
        return baseSize * (1 + locationIndex * 0.15);
    }
    
    function createMovingBlock() {
        if (!window.gameState || !window.gameState.gameActive) return;
        
        const gameArea = document.getElementById('gameArea');
        if (!gameArea) return;
        
        if (currentBlock && gameArea.contains(currentBlock)) {
            gameArea.removeChild(currentBlock);
        }
        
        const blockHealth = calculateBlockHealth();
        currentBlockHealth = blockHealth;
        
        const block = document.createElement("div");
        block.className = "moving-block";
        const size = getBlockSize();
        block.style.width = size + "px";
        block.style.height = size + "px";
        block.style.bottom = "0px";
        block.dataset.maxHealth = blockHealth;
        
        const theme = locations[window.gameState.currentLocation];
        const colorIndex = Math.floor(Math.random() * theme.blockColors.length);
        const potentialRareType = getRareBlockType();
        
        if (potentialRareType) {
            const rareBlock = rareBlocks[potentialRareType];
            block.classList.add(rareBlock.className);
            currentBlockHealth = Math.floor(currentBlockHealth * rareBlock.healthMultiplier);
            block.innerHTML = `🌟<div style="font-size: 0.35em; margin-top: 1px; line-height: 1.1;">${rareBlock.name}</div>`;
            announceRareBlock(rareBlock.name);
        } else {
            block.style.background = `linear-gradient(135deg, ${theme.blockColors[colorIndex]}, ${theme.blockColors[(colorIndex + 1) % theme.blockColors.length]})`;
            block.style.boxShadow = `0 0 15px ${theme.blockColors[colorIndex]}`;
            block.style.border = `2px solid ${theme.borderColor}`;
            block.textContent = blockHealth;
        }
        
        block.addEventListener('click', () => hitBlock(block, window.gameState.clickPower));
        block.addEventListener('touchstart', (e) => {
            e.preventDefault();
            hitBlock(block, window.gameState.clickPower);
        }, { passive: false });
        
        gameArea.appendChild(block);
        currentBlock = block;
        animateBlock(block);
    }
    
    function animateBlock(block) {
        if (!window.gameState || !window.gameState.gameActive || currentBlock !== block) return;
        
        const speed = getCurrentSpeed();
        let position = parseInt(block.style.bottom) || 0;
        
        function move() {
            if (!window.gameState || !window.gameState.gameActive || currentBlock !== block) return;
            position += speed / 30;
            block.style.bottom = position + "px";
            
            // ✅ НОВАЯ ЛОГИКА: Вместо game over — штраф
            if (position > window.innerHeight) {
                applyUpgradePenalty();  // ✅ Применяем штраф
                // ✅ Создаём новый блок вместо game over
                if (window.gameState && window.gameState.gameActive) {
                    setTimeout(() => createMovingBlock(), 500);
                }
                return;
            }
            requestAnimationFrame(move);
        }
        move();
    }
    
    // ✅ УДАЛЕНО: gameOver() функция больше не нужна
    
    function shareResult() {
        if (!window.gameState) return;
        
        const shareText = `🎮 Я нанес ${Math.floor(window.gameState.totalDamageDealt).toLocaleString()} урона и собрал ${Math.floor(window.gameState.coins)} Кристаллов в Космическом Кликере! 🌌 Сможешь побить мой рекорд?`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Мой рекорд в Космическом Кликере!',
                text: shareText
            }).then(() => {
                window.gameState.coins += 50;
                updateHUD();
                updateUpgradeButtons();
                if (window.showTooltip) {
                    window.showTooltip(window.translations[window.currentLanguage].tooltips.shareSuccess);
                    setTimeout(window.hideTooltip, 2000);
                }
                window.saveGame();
            });
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Результат скопирован! Поделись с друзьями!');
                window.gameState.coins += 50;
                updateHUD();
                updateUpgradeButtons();
                window.saveGame();
            });
        }
    }
    
    window.showTooltip = function(text) {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            tooltip.innerHTML = text;
            tooltip.style.opacity = "1";
        }
    };
    
    window.hideTooltip = function() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) tooltip.style.opacity = "0";
    };
    
    function moveHelperToRandomPosition() {
        if (!helperElement) return;
        
        let blockRect = { left: window.innerWidth/2, top: window.innerHeight/2 };
        if (currentBlock) {
            blockRect = currentBlock.getBoundingClientRect();
        }
        
        let attempts = 0;
        let validPosition = false;
        const safeDistance = 150;
        
        while (!validPosition && attempts < 20) {
            attempts++;
            const randomX = Math.random() * (window.innerWidth - 60) + 30;
            const randomY = Math.random() * (window.innerHeight - 120) + 60;
            
            const distance = Math.sqrt(
                Math.pow(randomX - (blockRect.left + blockRect.width/2), 2) +
                Math.pow(randomY - (blockRect.top + blockRect.height/2), 2)
            );
            
            const safeFromEdges = randomX > 60 && randomX < window.innerWidth - 60 &&
                randomY > 100 && randomY < window.innerHeight - 60;
            
            if (distance > safeDistance && safeFromEdges) {
                helperPosition = { x: randomX, y: randomY };
                validPosition = true;
            }
        }
        
        if (!validPosition) {
            helperPosition = {
                x: window.innerWidth * 0.7,
                y: window.innerHeight * 0.7
            };
        }
        
        helperElement.style.left = helperPosition.x + 'px';
        helperElement.style.top = helperPosition.y + 'px';
    }
    
    function createHelperElement() {
        if (helperElement && helperElement.parentNode) {
            document.body.removeChild(helperElement);
        }
        helperElement = document.createElement('div');
        helperElement.className = 'helper';
        document.body.appendChild(helperElement);
        moveHelperToRandomPosition();
        helperElement.style.opacity = '0';
        setTimeout(() => {
            if (helperElement) helperElement.style.opacity = '1';
        }, 100);
    }
    
    function createHelperEffect() {
        if (!currentBlock || !helperElement) return;
        
        const blockRect = currentBlock.getBoundingClientRect();
        const helperRect = helperElement.getBoundingClientRect();
        
        const beamContainer = document.createElement('div');
        beamContainer.className = 'helper-beam';
        beamContainer.style.position = 'absolute';
        beamContainer.style.zIndex = '13';
        document.body.appendChild(beamContainer);
        
        const startX = helperRect.left + helperRect.width / 2;
        const startY = helperRect.top + helperRect.height / 2;
        const endX = blockRect.left + blockRect.width / 2;
        const endY = blockRect.top + blockRect.height / 2;
        
        const canvas = document.createElement('canvas');
        const maxSize = Math.max(window.innerWidth, window.innerHeight);
        canvas.width = maxSize;
        canvas.height = maxSize;
        beamContainer.appendChild(canvas);
        beamContainer.style.left = '0px';
        beamContainer.style.top = '0px';
        
        const ctx = canvas.getContext('2d');
        let progress = 0;
        const animationDuration = 300;
        const startTime = Date.now();
        
        function animateBeam() {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            progress = Math.min(elapsed / animationDuration, 1);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (progress > 0) {
                const currentX = startX + (endX - startX) * progress;
                const currentY = startY + (endY - startY) * progress;
                
                const gradient = ctx.createLinearGradient(startX, startY, currentX, currentY);
                gradient.addColorStop(0, 'rgba(105, 240, 174, 0.9)');
                gradient.addColorStop(0.7, 'rgba(105, 240, 174, 0.5)');
                gradient.addColorStop(1, 'rgba(105, 240, 174, 0)');
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(currentX, currentY);
                ctx.lineWidth = 4 + (4 * (1 - progress));
                ctx.strokeStyle = gradient;
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(currentX, currentY, 8 * (1 - progress), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(105, 240, 174, ${0.7 * (1 - progress)})`;
                ctx.fill();
            }
            
            if (progress < 1) {
                requestAnimationFrame(animateBeam);
            } else {
                setTimeout(() => {
                    if (beamContainer.parentNode) document.body.removeChild(beamContainer);
                }, 200);
            }
        }
        animateBeam();
        
        playSound('helperSound');
        
        setTimeout(() => {
            const hitEffect = document.createElement('div');
            hitEffect.style.position = 'absolute';
            hitEffect.style.left = (endX - 10) + 'px';
            hitEffect.style.top = (endY - 10) + 'px';
            hitEffect.style.width = '20px';
            hitEffect.style.height = '20px';
            hitEffect.style.background = 'radial-gradient(circle, #69f0ae, transparent)';
            hitEffect.style.borderRadius = '50%';
            hitEffect.style.zIndex = '15';
            hitEffect.style.opacity = '0.8';
            document.body.appendChild(hitEffect);
            
            let opacity = 0.8;
            const fadeOut = setInterval(() => {
                opacity -= 0.1;
                hitEffect.style.opacity = opacity;
                if (opacity <= 0) {
                    clearInterval(fadeOut);
                    if (hitEffect.parentNode) document.body.removeChild(hitEffect);
                }
            }, 30);
        }, animationDuration);
    }
    
    function activateHelper() {
        if (!window.gameState) return;
        
        if (window.gameState.helperActive && helperInterval) {
            clearInterval(helperInterval);
            helperInterval = null;
        }
        if (window.gameState.helperActive && helperTimer) {
            clearInterval(helperTimer);
            helperTimer = null;
        }
        
        window.gameState.helperActive = true;
        window.gameState.helperTimeLeft = 60000;
        window.gameState.boboCoinBonus = 0.2;
        
        createHelperElement();
        
        helperInterval = setInterval(() => {
            if (window.gameState && window.gameState.helperActive && currentBlock && window.gameState.gameActive) {
                helperAttack();
            }
        }, 1500);
        
        helperTimer = setInterval(() => {
            if (!window.gameState || !window.gameState.helperActive) {
                if (helperTimer) clearInterval(helperTimer);
                helperTimer = null;
                return;
            }
            
            window.gameState.helperTimeLeft -= 1000;
            
            if (window.gameState.helperTimeLeft <= 0) {
                window.gameState.helperActive = false;
                
                if (helperInterval) {
                    clearInterval(helperInterval);
                    helperInterval = null;
                }
                if (helperTimer) {
                    clearInterval(helperTimer);
                    helperTimer = null;
                }
                
                window.gameState.boboCoinBonus = 0;
                
                if (helperElement) {
                    helperElement.style.opacity = '0';
                    setTimeout(() => {
                        if (helperElement && helperElement.parentNode) {
                            document.body.removeChild(helperElement);
                            helperElement = null;
                        }
                    }, 300);
                }
                
                updateUpgradeButtons();
                
                if (window.showTooltip) {
                    window.showTooltip(window.translations[window.currentLanguage].tooltips.helperEnd);
                    setTimeout(window.hideTooltip, 1500);
                }
            }
        }, 1000);
        
        updateUpgradeButtons();
        updateHUD();
        
        if (window.showTooltip) {
            window.showTooltip(window.translations[window.currentLanguage].tooltips.helperAvailable);
            setTimeout(window.hideTooltip, 2500);
        }
        
        window.saveGame();
    }
    
    function helperAttack() {
        if (!currentBlock || !window.gameState || !window.gameState.helperActive || !helperElement) return;
        
        createHelperEffect();
        
        const baseHelperDmg = window.gameState.clickPower * (1 + window.gameState.helperDamageBonus);
        const upgradedHelperDmg = baseHelperDmg * (1 + window.gameState.helperUpgradeLevel * 0.2);
        let finalHelperDmg = upgradedHelperDmg;
        
        if (window.gameState.shopItems && window.gameState.shopItems.powerSurge && window.gameState.shopItems.powerSurge.active) {
            finalHelperDmg *= 1.5;
        }
        
        currentBlockHealth -= finalHelperDmg;
        window.gameState.totalDamageDealt += finalHelperDmg;
        window.gameMetrics.totalClicks = (window.gameMetrics.totalClicks || 0) + 1;
        
        createDamageText(Math.round(finalHelperDmg), currentBlock, '#69f0ae');
        checkLocationUpgrade();
        
        if (currentBlockHealth <= 0) {
            destroyBlock(currentBlock);
        } else {
            currentBlock.textContent = Math.floor(currentBlockHealth);
            updateCracks(currentBlock, currentBlockHealth);
        }
    }
    
    function buyClickPower() {
        if (!window.gameState) return;
        
        const cost = Math.floor(baseClickUpgradeCost * Math.pow(1.5, window.gameState.clickUpgradeLevel));
        
        if (window.gameState.coins >= cost) {
            window.gameState.coins -= cost;
            window.gameState.clickUpgradeLevel += 1;
            window.gameState.clickPower = calculateClickPower();
            window.gameMetrics.upgradesBought = (window.gameMetrics.upgradesBought || 0) + 1;
            
            if (window.achievementsSystem) {
                window.achievementsSystem.incrementUpgrades(1);
            }
            
            updateHUD();
            updateUpgradeButtons();
            playSound('upgradeSound');
            
            const upgradeBtn = document.getElementById('upgradeClickBtn');
            if (upgradeBtn) {
                upgradeBtn.style.transform = 'scale(1.1)';
                upgradeBtn.style.boxShadow = '0 0 20px #4CAF50';
                setTimeout(() => {
                    upgradeBtn.style.transform = 'scale(1)';
                    upgradeBtn.style.boxShadow = '';
                }, 300);
            }
            
            if (window.showTooltip) {
                window.showTooltip(window.formatString(
                    window.translations[window.currentLanguage].tooltips.clickPowerUpgrade,
                    { power: Math.round(window.gameState.clickPower) }
                ));
                setTimeout(window.hideTooltip, 1500);
            }
            
            window.saveGame();
        } else {
            const upgradeBtn = document.getElementById('upgradeClickBtn');
            if (upgradeBtn) {
                upgradeBtn.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    upgradeBtn.style.animation = '';
                }, 500);
            }
        }
    }
    
    function buyHelper() {
        if (!window.gameState) return;
        
        const baseCost = Math.floor(baseHelperUpgradeCost * Math.pow(1.4, window.gameState.helperUpgradeLevel));
        const activationBonus = Math.floor((window.gameState.helperActivations || 0) / 10);
        const finalCost = Math.floor(baseCost * (1 + activationBonus * 0.2));
        
        if (window.gameState.coins >= finalCost) {
            window.gameState.coins -= finalCost;
            window.gameState.helperActivations = (window.gameState.helperActivations || 0) + 1;
            window.gameMetrics.helpersBought = (window.gameMetrics.helpersBought || 0) + 1;
            
            if (window.achievementsSystem) {
                window.achievementsSystem.incrementHelpers(1);
            }
            
            const upgradeBtn = document.getElementById('upgradeHelperBtn');
            if (upgradeBtn) {
                upgradeBtn.style.transform = 'scale(1.1)';
                upgradeBtn.style.boxShadow = '0 0 20px #4CAF50';
                setTimeout(() => {
                    upgradeBtn.style.transform = 'scale(1)';
                    upgradeBtn.style.boxShadow = '';
                }, 300);
            }
            
            activateHelper();
            updateHUD();
            updateUpgradeButtons();
            window.saveGame();
        } else {
            const upgradeBtn = document.getElementById('upgradeHelperBtn');
            if (upgradeBtn) {
                upgradeBtn.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    upgradeBtn.style.animation = '';
                }, 500);
            }
        }
    }
    
    function buyCritChance() {
        if (!window.gameState) return;
        
        const cost = Math.floor(baseCritChanceCost * Math.pow(1.3, window.gameState.critChanceUpgradeLevel));
        
        if (window.gameState.coins >= cost) {
            window.gameState.coins -= cost;
            window.gameState.critChance = Math.min(1.0, window.gameState.critChance + 0.001);
            window.gameState.critChanceUpgradeLevel++;
            window.gameMetrics.upgradesBought = (window.gameMetrics.upgradesBought || 0) + 1;
            
            if (window.achievementsSystem) {
                window.achievementsSystem.incrementUpgrades(1);
            }
            
            updateHUD();
            updateUpgradeButtons();
            playSound('upgradeSound');
            
            const upgradeBtn = document.getElementById('upgradeCritChanceBtn');
            if (upgradeBtn) {
                upgradeBtn.style.transform = 'scale(1.1)';
                upgradeBtn.style.boxShadow = '0 0 20px #FFD700';
                setTimeout(() => {
                    upgradeBtn.style.transform = 'scale(1)';
                    upgradeBtn.style.boxShadow = '';
                }, 300);
            }
            
            if (window.showTooltip) {
                window.showTooltip(window.formatString(
                    window.translations[window.currentLanguage].tooltips.critChanceUpgrade,
                    { chance: (window.gameState.critChance * 100).toFixed(1) }
                ));
                setTimeout(window.hideTooltip, 1500);
            }
            
            window.saveGame();
        } else {
            const upgradeBtn = document.getElementById('upgradeCritChanceBtn');
            if (upgradeBtn) {
                upgradeBtn.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    upgradeBtn.style.animation = '';
                }, 500);
            }
        }
    }
    
    function buyCritMultiplier() {
        if (!window.gameState) return;
        
        const cost = Math.floor(baseCritMultiplierCost * Math.pow(1.25, window.gameState.critMultiplierUpgradeLevel));
        
        if (window.gameState.coins >= cost) {
            window.gameState.coins -= cost;
            window.gameState.critMultiplier += 0.2;
            window.gameState.critMultiplierUpgradeLevel++;
            window.gameMetrics.upgradesBought = (window.gameMetrics.upgradesBought || 0) + 1;
            
            if (window.achievementsSystem) {
                window.achievementsSystem.incrementUpgrades(1);
            }
            
            updateHUD();
            updateUpgradeButtons();
            playSound('upgradeSound');
            
            const upgradeBtn = document.getElementById('upgradeCritMultBtn');
            if (upgradeBtn) {
                upgradeBtn.style.transform = 'scale(1.1)';
                upgradeBtn.style.boxShadow = '0 0 20px #FFD700';
                setTimeout(() => {
                    upgradeBtn.style.transform = 'scale(1)';
                    upgradeBtn.style.boxShadow = '';
                }, 300);
            }
            
            if (window.showTooltip) {
                window.showTooltip(window.formatString(
                    window.translations[window.currentLanguage].tooltips.critMultUpgrade,
                    { mult: window.gameState.critMultiplier.toFixed(1) }
                ));
                setTimeout(window.hideTooltip, 1500);
            }
            
            window.saveGame();
        } else {
            const upgradeBtn = document.getElementById('upgradeCritMultBtn');
            if (upgradeBtn) {
                upgradeBtn.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    upgradeBtn.style.animation = '';
                }, 500);
            }
        }
    }
    
    function buyHelperDamage() {
        if (!window.gameState) return;
        
        const cost = Math.floor(baseHelperDmgCost * Math.pow(1.8, window.gameState.helperUpgradeLevel));
        
        if (window.gameState.coins >= cost) {
            window.gameState.coins -= cost;
            window.gameState.helperUpgradeLevel += 1;
            window.gameMetrics.upgradesBought = (window.gameMetrics.upgradesBought || 0) + 1;
            
            if (window.achievementsSystem) {
                window.achievementsSystem.incrementUpgrades(1);
            }
            
            updateHUD();
            updateUpgradeButtons();
            playSound('upgradeSound');
            
            const upgradeBtn = document.getElementById('upgradeHelperDmgBtn');
            if (upgradeBtn) {
                upgradeBtn.style.transform = 'scale(1.1)';
                upgradeBtn.style.boxShadow = '0 0 20px #4CAF50';
                setTimeout(() => {
                    upgradeBtn.style.transform = 'scale(1)';
                    upgradeBtn.style.boxShadow = '';
                }, 300);
            }
            
            if (window.showTooltip) {
                window.showTooltip(window.formatString(
                    window.translations[window.currentLanguage].tooltips.helperDmgUpgrade,
                    { level: window.gameState.helperUpgradeLevel }
                ));
                setTimeout(window.hideTooltip, 1500);
            }
            
            window.saveGame();
        } else {
            const upgradeBtn = document.getElementById('upgradeHelperDmgBtn');
            if (upgradeBtn) {
                upgradeBtn.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    upgradeBtn.style.animation = '';
                }, 500);
            }
        }
    }
    
    function startGame(reset = true) {
        console.log('🚀 Запуск игры, reset =', reset);
        
        if (reset) {
            window.resetGame();
        } else {
            console.log('Продолжение игры с сохранением:', {
                coins: window.gameState.coins,
                damage: window.gameState.totalDamageDealt,
                location: window.gameState.currentLocation
            });
            window.gameState.clickPower = calculateClickPower();
        }
        
        window.gameState.helperActive = false;
        window.gameState.helperTimeLeft = 0;
        window.gameState.boboCoinBonus = 0;
        
        if (helperInterval) {
            clearInterval(helperInterval);
            helperInterval = null;
        }
        if (helperTimer) {
            clearInterval(helperTimer);
            helperTimer = null;
        }
        if (helperElement && helperElement.parentNode) {
            document.body.removeChild(helperElement);
            helperElement = null;
        }
        
        const gameArea = document.getElementById('gameArea');
        if (gameArea) gameArea.innerHTML = "";
        
        const welcomeScreen = document.getElementById('welcomeScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        
        if (welcomeScreen) welcomeScreen.style.display = "none";
        if (gameOverScreen) gameOverScreen.style.display = "none";
        
        window.gameState.gameActive = true;
        window.gameState.comboCount = 0;
        window.gameState.lastDestroyTime = 0;
        
        if (reset) {
            window.gameMetrics.startTime = Date.now();
            window.gameMetrics.blocksDestroyed = 0;
            window.gameMetrics.upgradesBought = 0;
            window.gameMetrics.totalClicks = 0;
            window.gameMetrics.totalCrits = 0;
            window.gameMetrics.totalCoinsEarned = 0;
            window.gameMetrics.helpersBought = 0;
            window.gameMetrics.boostersUsed = 0;
            window.gameMetrics.maxCombo = 0;
        } else {
            window.gameMetrics.startTime = Date.now();
        }
        
        updateHUD();
        updateUpgradeButtons();
        updateProgressBar();
        setLocation(window.gameState.currentLocation);
        
        if (window.shopSystem) window.shopSystem.updateShopDisplay();
        if (window.achievementsSystem) window.achievementsSystem.updateAchievementsDisplay();
        
        setTimeout(() => createMovingBlock(), 500);
        
        console.log('🎮 Игра запущена', reset ? '(новая)' : '(продолжение)');
    }
    
    function continueGame() {
        console.log('🔄 Пытаемся загрузить сохранение...');
        
        if (window.loadGame()) {
            console.log('✅ Загрузка успешна, запускаем игру...');
            updateHUD();
            updateUpgradeButtons();
            updateProgressBar();
            setLocation(window.gameState.currentLocation);
            startGame(false);
            
            if (window.showTooltip) {
                const tooltipText = window.formatString(
                    'Игра загружена! Кристаллы: {coins}, Урон: {damage}',
                    {
                        coins: Math.floor(window.gameState.coins).toLocaleString(),
                        damage: Math.floor(window.gameState.totalDamageDealt).toLocaleString()
                    }
                );
                window.showTooltip(tooltipText);
                setTimeout(window.hideTooltip, 3000);
            }
        } else {
            console.log('❌ Не удалось загрузить сохранение');
            if (window.showTooltip) {
                window.showTooltip(window.translations[window.currentLanguage].tooltips.noSave);
                setTimeout(window.hideTooltip, 2000);
            }
        }
    }
    
    function restartGame() {
        startGame(true);
    }
    
    window.updateAllTranslations = function() {
        if (!window.gameState) return;
        
        const gameTitle = document.getElementById('gameTitle');
        if (gameTitle) window.applyTranslation(gameTitle, `gameTitle.${window.gameState.currentLocation}`);
        
        const welcomeTexts = document.querySelectorAll('#welcomeScreen p');
        if (welcomeTexts.length >= 7) {
            window.applyTranslation(document.querySelector('#welcomeScreen h2'), 'welcome.title');
            window.applyTranslation(welcomeTexts[0], 'welcome.text1');
            window.applyTranslation(welcomeTexts[1], 'welcome.text2');
            window.applyTranslation(welcomeTexts[2], 'welcome.text3');
            window.applyTranslation(welcomeTexts[3], 'welcome.text4');
            window.applyTranslation(welcomeTexts[4], 'welcome.text5');
            window.applyTranslation(welcomeTexts[5], 'welcome.text6');
            window.applyTranslation(welcomeTexts[6], 'welcome.text7');
        }
        
        const continueBtn = document.getElementById('continueBtn');
        const startBtn = document.getElementById('startBtn');
        if (continueBtn) window.applyTranslation(continueBtn, 'buttons.continue');
        if (startBtn) window.applyTranslation(startBtn, 'buttons.start');
        
        updateProgressBar();
    };
    
    function initEventHandlers() {
        const langBtnWelcome = document.getElementById('langBtn-welcome');
        if (langBtnWelcome) {
            langBtnWelcome.addEventListener('click', window.switchLanguage);
            langBtnWelcome.addEventListener('touchstart', (e) => {
                e.preventDefault();
                window.switchLanguage();
            }, { passive: false });
        }
        
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                const welcomeScreen = document.getElementById('welcomeScreen');
                if (welcomeScreen) welcomeScreen.style.display = "none";
                startGame(true);
            });
            startBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const welcomeScreen = document.getElementById('welcomeScreen');
                if (welcomeScreen) welcomeScreen.style.display = "none";
                startGame(true);
            }, { passive: false });
        }
        
        const continueBtn = document.getElementById('continueBtn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                const welcomeScreen = document.getElementById('welcomeScreen');
                if (welcomeScreen) welcomeScreen.style.display = "none";
                continueGame();
            });
            continueBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const welcomeScreen = document.getElementById('welcomeScreen');
                if (welcomeScreen) welcomeScreen.style.display = "none";
                continueGame();
            }, { passive: false });
        }
        
        function addMobileButtonHandlers(button, handler) {
            if (button) {
                button.addEventListener('click', handler);
                button.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    handler();
                }, { passive: false });
            }
        }
        
        const upgradeClickBtn = document.getElementById('upgradeClickBtn');
        const upgradeHelperBtn = document.getElementById('upgradeHelperBtn');
        const upgradeCritChanceBtn = document.getElementById('upgradeCritChanceBtn');
        const upgradeCritMultBtn = document.getElementById('upgradeCritMultBtn');
        const upgradeHelperDmgBtn = document.getElementById('upgradeHelperDmgBtn');
        
        addMobileButtonHandlers(upgradeClickBtn, buyClickPower);
        addMobileButtonHandlers(upgradeHelperBtn, buyHelper);
        addMobileButtonHandlers(upgradeCritChanceBtn, buyCritChance);
        addMobileButtonHandlers(upgradeCritMultBtn, buyCritMultiplier);
        addMobileButtonHandlers(upgradeHelperDmgBtn, buyHelperDamage);
        
        if (upgradeClickBtn) {
            upgradeClickBtn.addEventListener('mouseenter', () => {
                if (window.showTooltip) window.showTooltip(window.translations[window.currentLanguage].tooltips.upgradeClick);
            });
            upgradeClickBtn.addEventListener('mouseleave', window.hideTooltip);
        }
        
        if (upgradeHelperBtn) {
            upgradeHelperBtn.addEventListener('mouseenter', () => {
                if (window.showTooltip) window.showTooltip(window.translations[window.currentLanguage].tooltips.upgradeHelper);
            });
            upgradeHelperBtn.addEventListener('mouseleave', window.hideTooltip);
        }
        
        if (upgradeCritChanceBtn) {
            upgradeCritChanceBtn.addEventListener('mouseenter', () => {
                if (window.showTooltip) window.showTooltip(window.translations[window.currentLanguage].tooltips.upgradeCritChance);
            });
            upgradeCritChanceBtn.addEventListener('mouseleave', window.hideTooltip);
        }
        
        if (upgradeCritMultBtn) {
            upgradeCritMultBtn.addEventListener('mouseenter', () => {
                if (window.showTooltip) window.showTooltip(window.translations[window.currentLanguage].tooltips.upgradeCritMult);
            });
            upgradeCritMultBtn.addEventListener('mouseleave', window.hideTooltip);
        }
        
        if (upgradeHelperDmgBtn) {
            upgradeHelperDmgBtn.addEventListener('mouseenter', () => {
                if (window.showTooltip) window.showTooltip(window.translations[window.currentLanguage].tooltips.upgradeHelperDmg);
            });
            upgradeHelperDmgBtn.addEventListener('mouseleave', window.hideTooltip);
        }
        
        const shareBtn = document.getElementById('shareBtn');
        const saveBtn = document.getElementById('saveBtn');
        
        addMobileButtonHandlers(shareBtn, shareResult);
        addMobileButtonHandlers(saveBtn, window.saveGame);
        
        window.addEventListener('resize', () => {
            if (helperElement) moveHelperToRandomPosition();
        });
    }
    
    document.addEventListener('DOMContentLoaded', function() {
        initEventHandlers();
        updateHUD();
        updateUpgradeButtons();
        
        if (window.gameState && window.gameState.currentLocation) {
            setLocation(window.gameState.currentLocation);
        }
        
        window.updateLanguageFlag();
        window.updateContinueButton();
        window.updateAllTranslations();
    });
    
    window.gameFunctions = {
        startGame,
        continueGame,
        restartGame,
        updateHUD,
        updateUpgradeButtons,
        updateProgressBar,
        checkLocationUpgrade,
        createDamageText,
        showComboText,
        showRewardText,
        createExplosion,
        playSound,
        hitBlock,
        destroyBlock,
        createMovingBlock,
        shareResult,
        updateAllTranslations,
        setLocation,
        applyUpgradePenalty
    };
})();