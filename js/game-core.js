/* ==========================================================================
   🎮 COSMIC CLICKER - ENGINE CORE (PRODUCTION READY)
   ========================================================================== */

(function() {
'use strict';

// Безопасный доступ к глобальным модулям-зависимостям
const CFG = window.GAME_CONFIG;
const UI = window.GAME_UI;
const FEAT = window.GAME_FEATURES;

// Инициализация глобальных контейнеров состояния, если они не созданы ранее
window.gameState = window.gameState || {};
window.gameMetrics = window.gameMetrics || {};

window.GAME_CORE = {
    // --- Состояние игрового цикла ---
    currentBlock: null,
    currentBlockHealth: 0,
    isGamePaused: false,
    blockSpeed: /Android|webOS|iPhone/i.test(navigator.userAgent) ? 25 : 20,

    // --- Потоки и таймеры автоматизации ---
    helperElement: null,
    helperInterval: null,
    helperTimer: null,
    helperPosition: { x: 0, y: 0 },
    autoClickInterval: null,
    magnetInterval: null,

    // --- Кэш графической подсистемы (Оптимизация памяти) ---
    effectsCanvas: null,
    effectsCtx: null,
    damageTextPool: [], // Пул объектов для переиспользования DOM-узлов текста урона
    
    // --- Системы защиты (Анти-чит) ---
    lastClickTime: 0,
    clickSpikeCount: 0,

    /* ==========================================================================
       1. ИНИЦИАЛИЗАЦИЯ И СИСТЕМНЫЕ ФУНКЦИИ
       ========================================================================== */

    /**
     * Инициализирует обработчики событий и подготавливает пул объектов.
     */
    init: function() {
        this.initEventHandlers();
        this.preloadDamageTextPool(20); // Заготавливаем 20 DOM-элементов под урон
        
        // Первичная отрисовка интерфейса
        if (UI) {
            UI.updateHUD();
            UI.updateUpgradeButtons();
            if (window.gameState?.currentLocation) this.setLocation(window.gameState.currentLocation);
        }
        
        if (window.updateLanguageFlag) window.updateLanguageFlag();
        if (window.updateContinueButton) window.updateContinueButton();
    },

    /**
     * Безопасное извлечение бонусов из системы магазина.
     * @param {string} type - Имя метода в shopSystem
     * @param {number} fallback - Значение по умолчанию
     */
    getBonus: function(type, fallback = 1) {
        if (window.shopSystem && typeof window.shopSystem[type] === 'function') {
            return window.shopSystem[type]();
        }
        return fallback;
    },

    /**
     * Воспроизведение аудиоэффектов с принудительным сбросом тайминга.
     * @param {string} id - ID тега <audio>
     */
    playSound: function(id) {
        const sound = document.getElementById(id);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {}); // Игнорируем автоплей-блокировки браузера
        }
    },

    pauseGame: function() {
        this.isGamePaused = true;
        if (window.gameState) window.gameState.gamePaused = true;
        const panel = document.getElementById('shopPanel');
        if (panel) { panel.style.maxHeight = '65vh'; panel.style.overflowY = 'auto'; }
    },

    resumeGame: function() {
        this.isGamePaused = false;
        if (window.gameState) window.gameState.gamePaused = false;
    },

    /* ==========================================================================
       2. МАТЕМАТИЧЕСКИЙ ДВИЖОК И БАЛАНС
       ========================================================================== */

    /**
     * Расчет силы клика на основе нелинейной экспоненциальной прогрессии.
     */
    calculateClickPower: function() {
        if (!CFG) return 1;
        const lvl = window.gameState.clickUpgradeLevel || 0;
        const prog = CFG.balanceConfig.damageProgression;
        return 1 + (lvl * Math.pow(prog.diminishingReturns, Math.min(lvl, prog.maxLevelEffect)) * Math.sqrt(lvl + 1) * prog.baseMultiplier);
    },

    /**
     * Возвращает текущую скорость движения блока с учетом локации и баффов.
     */
    getCurrentSpeed: function() {
        if (!window.gameState || !CFG) return this.blockSpeed;
        let speed = this.blockSpeed * (CFG.planetOrder.indexOf(window.gameState.currentLocation) < 3 ? 0.85 : 1);
        return speed * this.getBonus('getSpeedMultiplier', 1);
    },

    /**
     * Расчет динамического здоровья блока под текущую силу игрока.
     */
    calculateBlockHealth: function() {
        if (!CFG || !window.gameState) return 10;
        const target = (window.gameState.clickPower || 1) * CFG.balanceConfig.targetClicks;
        const base = CFG.balanceConfig.baseHealth * (1 + CFG.astronomicalUnits[window.gameState.currentLocation] * 2);
        const randRange = CFG.balanceConfig.healthRandomRange;
        const random = randRange.min + Math.random() * (randRange.max - randRange.min);
        return Math.floor(((base + target) / 2) * random * this.getBonus('getBlockHealthMultiplier', 1));
    },

    /* ==========================================================================
       3. ИГРОВОЙ ЦИКЛ И РАБОТА С АСТЕРОИДАМИ (DOM & GPU)
       ========================================================================== */

    /**
     * Создание нового астероида (блока) в игровой зоне.
     */
    createMovingBlock: function() {
        if (!window.gameState?.gameActive || this.isGamePaused || !CFG) return;
        const gameArea = document.getElementById('gameArea');
        if (!gameArea) return;

        // Очищаем старый блок, если он почему-то выжил
        if (this.currentBlock?.parentNode === gameArea) {
            gameArea.removeChild(this.currentBlock);
        }

        this.currentBlockHealth = this.calculateBlockHealth();
        
        const block = document.createElement('div');
        block.className = 'moving-block';
        
        // Масштабирование размеров под экраны и локации
        const size = (window.innerWidth < 768 ? 80 : 60) * (CFG.planetOrder.indexOf(window.gameState.currentLocation) < 3 ? 1.2 : (1 + CFG.planetOrder.indexOf(window.gameState.currentLocation) * 0.15));
        
        block.style.width = `${size}px`;
        block.style.height = `${size}px`;
        
        // Подготовка CSS-переменных для плавных GPU-трансформаций
        block.style.setProperty('--block-y', '0px');
        block.style.setProperty('--block-scale', '1');
        block.dataset.maxHealth = this.currentBlockHealth;

        const theme = CFG.locations[window.gameState.currentLocation];
        const rareType = this.getRareBlockType();

        // Логика визуализации типа блока (Редкий / Обычный)
        if (rareType) {
            const rb = CFG.rareBlocks[rareType];
            block.classList.add(rb.className);
            this.currentBlockHealth = Math.floor(this.currentBlockHealth * rb.healthMultiplier);
            block.innerHTML = `🌟 <div style="font-size:0.35em;margin-top:1px;line-height:1.1;">${rb.name}</div>`;
            this.announceRareBlock(rb.name);
        } else {
            const ci = Math.floor(Math.random() * theme.blockColors.length);
            block.style.background = `linear-gradient(135deg, ${theme.blockColors[ci]}, ${theme.blockColors[(ci + 1) % theme.blockColors.length]})`;
            block.style.boxShadow = `0 0 15px ${theme.blockColors[ci]}`;
            block.style.border = `2px solid ${theme.borderColor}`;
            block.textContent = this.currentBlockHealth;
        }

        // Кроссплатформенные обработчики ввода
        block.addEventListener('click', () => this.hitBlock(block, window.gameState.clickPower));
        block.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            this.hitBlock(block, window.gameState.clickPower); 
        }, { passive: false });

        gameArea.appendChild(block);
        this.currentBlock = block;
        this.animateBlock(block);
    },

    getRareBlockType: function() {
        if (!CFG) return null;
        const rand = Math.random(), luck = this.getBonus('getLuckMultiplier', 1);
        let cum = 0;
        for (const [key, b] of Object.entries(CFG.rareBlocks)) {
            cum += b.chance * luck;
            if (rand <= cum) return key;
        }
        return null;
    },

    announceRareBlock: function(name) {
        const el = document.createElement('div');
        el.className = 'rare-block-announce';
        el.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:1.8em;font-weight:bold;color:gold;z-index:50;text-shadow:0 0 10px black;animation:fadeInOut 2s;';
        el.textContent = `🌟 ${name} блок! 🌟`;
        document.body.appendChild(el);
        setTimeout(() => el.parentNode?.removeChild(el), 2000);
    },

    /**
     * Анимация полета блока вверх с использованием requestAnimationFrame и transform.
     */
    animateBlock: function(block) {
        if (!window.gameState?.gameActive || this.currentBlock !== block) return;
        let pos = 0;
        
        const move = () => {
            if (this.isGamePaused || !window.gameState?.gameActive || this.currentBlock !== block) {
                requestAnimationFrame(move); 
                return;
            }
            
            pos += this.getCurrentSpeed() / 30;
            block.style.setProperty('--block-y', `${pos}px`);
            
            // Если блок улетел за пределы экрана (+100px буфер)
            if (pos > window.innerHeight + 100) {
                if (FEAT && typeof FEAT.applyUpgradePenalty === 'function') {
                    FEAT.applyUpgradePenalty();
                }
                
                // ИСПРАВЛЕНО: Полная зачистка DOM, предотвращающая утечку памяти
                if (block.parentNode) block.parentNode.removeChild(block);
                if (this.currentBlock === block) this.currentBlock = null;
                
                if (window.gameState?.gameActive) {
                    setTimeout(() => this.createMovingBlock(), 500);
                }
                return;
            }
            requestAnimationFrame(move);
        };
        move();
    },

    /* ==========================================================================
       4. БОЕВАЯ СИСТЕМА, ДЕСТРУКЦИЯ И АНТИ-ЧИТ
       ========================================================================== */

    /**
     * Обработка нанесения урона по блоку (включая Криты и Клиентский Анти-чит).
     */
    hitBlock: function(block, damage) {
        if (!window.gameState?.gameActive || this.isGamePaused) return;

        // --- КЛИЕНТСКИЙ АНТИ-ЧИТ ---
        const now = Date.now();
        const clickDelta = now - this.lastClickTime;
        this.lastClickTime = now;

        if (clickDelta < 35) { // Клик быстрее 35мс физически невозможен для человека (>28 CPS)
            this.clickSpikeCount++;
            if (this.clickSpikeCount > 4) {
                this.spawnDamageText('BOT!', block, '#FFCC00', true);
                return; // Блокируем регистрацию урона от автокликера
            }
        } else {
            this.clickSpikeCount = Math.max(0, this.clickSpikeCount - 1);
        }
        // ---------------------------

        if (navigator.vibrate) navigator.vibrate(50);
        if (window.telegramHaptic) window.telegramHaptic.light();
        this.playSound('clickSound');
        
        // Эффект сжатия без деформации общей анимации движения
        block.style.setProperty('--block-scale', '0.85');
        setTimeout(() => { block.style.setProperty('--block-scale', '1'); }, 100);

        let finalDamage = damage * this.getBonus('getDamageMultiplier', 1);
        let isCrit = false;
        let critChance = window.gameState.critChance * this.getBonus('getCritChanceMultiplier', 1);
        let critMult = window.gameState.critMultiplier * this.getBonus('getCritMultMultiplier', 1);
        
        if (Math.random() < Math.min(1.0, critChance)) {
            finalDamage = Math.round(finalDamage * critMult);
            isCrit = true;
            if (window.achievementsSystem) window.achievementsSystem.incrementCrits(1);
        } else {
            finalDamage = Math.round(finalDamage);
        }

        this.currentBlockHealth -= finalDamage;
        window.gameState.totalDamageDealt += finalDamage;

        if (window.achievementsSystem) {
            window.achievementsSystem.incrementTotalDamage(finalDamage);
            window.achievementsSystem.incrementTotalClicks(1);
        }

        this.spawnDamageText(finalDamage, block, isCrit ? '#FFD700' : '#ff4444', isCrit);
        if (UI) UI.checkLocationUpgrade();

        if (this.currentBlockHealth <= 0) {
            this.destroyBlock(block);
        } else {
            block.textContent = Math.floor(this.currentBlockHealth);
            this.updateCracks(block, this.currentBlockHealth);
        }
    },

    /**
     * Уничтожение астероида, расчет наград, комбо-множителей и сохранение.
     */
    destroyBlock: function(block) {
        if (!window.gameState || !CFG || !UI) return;
        
        const now = Date.now();
        const comboWindow = /Android|webOS|iPhone/i.test(navigator.userAgent) ? 1500 : 2000;
        
        window.gameState.comboCount = (now - (window.gameState.lastDestroyTime || 0) < comboWindow) ? (window.gameState.comboCount || 0) + 1 : 1;
        window.gameState.lastDestroyTime = now;

        // Базовый расчет награды на основе удаленности планеты от Солнца
        let reward = Math.floor((25 + CFG.astronomicalUnits[window.gameState.currentLocation] * 100) * CFG.balanceConfig.rewardMultiplier);
        const randRange = CFG.balanceConfig.randomBonusRange;
        reward = Math.floor(reward * (randRange.min + Math.random() * (randRange.max - randRange.min)));
        
        if (window.gameState.boboCoinBonus > 0) reward = Math.floor(reward * (1 + window.gameState.boboCoinBonus));
        reward = Math.floor(reward * this.getBonus('getRewardMultiplier', 1));

        let isRare = false;
        for (const k in CFG.rareBlocks) {
            if (block.classList.contains(CFG.rareBlocks[k].className)) {
                reward = Math.floor(reward * CFG.rareBlocks[k].multiplier);
                isRare = true;
                break;
            }
        }

        // Начисление комбо-бонусов
        if (window.gameState.comboCount > 1) {
            let comboMult = CFG.balanceConfig.comboMultiplier * this.getBonus('getComboMultiplier', 1);
            const bonusCoins = Math.floor(reward * (window.gameState.comboCount * comboMult));
            reward += bonusCoins;
            this.showComboText(window.gameState.comboCount, bonusCoins, block);
            this.playSound('comboSound');
        }

        window.gameState.coins += reward;

        // Фиксация достижений
        if (window.achievementsSystem) {
            const currentPlanet = window.gameState.currentLocation;
            window.achievementsSystem.incrementCoinsEarned(reward);
            window.achievementsSystem.incrementPlanetBlocks(currentPlanet, 1);
            if (isRare) {
                window.achievementsSystem.incrementRareBlocks(1);
                window.achievementsSystem.incrementPlanetRareBlocks(currentPlanet, 1);
            }
            if (window.gameState.comboCount > (window.gameMetrics.maxCombo || 0)) {
                window.gameMetrics.maxCombo = window.gameState.comboCount;
                window.achievementsSystem.updateCombo(window.gameState.comboCount);
                window.achievementsSystem.updatePlanetCombo(currentPlanet, window.gameState.comboCount);
            }
        }

        UI.updateHUD();
        UI.updateUpgradeButtons();
        this.playSound('breakSound');
        this.showRewardText(reward, block);
        
        if (FEAT && typeof FEAT.createExplosion === 'function') {
            FEAT.createExplosion(block);
        }

        if (block.parentNode) block.parentNode.removeChild(block);
        this.currentBlock = null;
        this.currentBlockHealth = 0;
        
        setTimeout(() => { if (window.gameState?.gameActive) this.createMovingBlock(); }, 500);
    },

    /* ==========================================================================
       5. ОПТИМИЗИРОВАННЫЙ СЛОЙ ГРАФИКИ И ЭФФЕКТОВ (CANVAS & POOLING)
       ========================================================================== */

    /**
     * Предварительная генерация пула элементов для текста урона.
     * Защищает от лагов выделения памяти (Memory Allocation Fluctuation).
     */
    preloadDamageTextPool: function(size) {
        for (let i = 0; i < size; i++) {
            const t = document.createElement('div');
            t.className = 'damage-text';
            t.style.display = 'none';
            t.style.position = 'fixed';
            t.style.pointerEvents = 'none';
            document.body.appendChild(t);
            this.damageTextPool.push({ el: t, active: false });
        }
    },

    /**
     * Активация готового текстового узла из пула вместо создания нового.
     */
    spawnDamageText: function(dmg, block, col, isCrit) {
        // Ищем свободный элемент в пуле
        let poolObj = this.damageTextPool.find(obj => !obj.active);
        
        // Если пул перегружен, создаем аварийный элемент
        if (!poolObj) {
            const t = document.createElement('div');
            t.className = 'damage-text';
            t.style.position = 'fixed';
            t.style.pointerEvents = 'none';
            document.body.appendChild(t);
            poolObj = { el: t, active: true };
            this.damageTextPool.push(poolObj);
        }

        poolObj.active = true;
        const t = poolObj.el;
        
        t.textContent = isCrit && typeof dmg === 'number' ? `💥 -${dmg}` : `-${dmg}`;
        t.style.color = col;
        t.style.display = 'block';
        t.style.fontSize = isCrit ? '1.5em' : '1.1em';
        t.style.fontWeight = 'bold';
        t.style.zIndex = '100';

        const r = block.getBoundingClientRect();
        let l = r.left + r.width / 2;
        let tp = r.top;
        
        // Корректировка выхода за края экрана
        l = Math.max(50, Math.min(l, window.innerWidth - 50));
        tp = Math.max(50, tp);
        
        t.style.left = `${l}px`;
        t.style.top = `${tp}px`;

        let opacity = 1;
        let yCoord = tp;
        
        const anim = () => {
            opacity -= 0.025;
            yCoord -= 1.8;
            t.style.opacity = opacity;
            t.style.top = `${yCoord}px`;
            
            if (opacity > 0) {
                requestAnimationFrame(anim);
            } else {
                t.style.display = 'none';
                poolObj.active = false; // Возвращаем элемент в пул
            }
        };
        anim();
    },

    /**
     * Отрисовка лазерного луча Bobo через постоянный Canvas-синглтон.
     */
    createHelperEffect: function() {
        if (!this.currentBlock || !this.helperElement) return;
        
        const br = this.currentBlock.getBoundingClientRect();
        const hr = this.helperElement.getBoundingClientRect();

        const sx = hr.left + hr.width / 2;
        const sy = hr.top + hr.height / 2;
        const ex = br.left + br.width / 2;
        const ey = br.top + br.height / 2;

        // Создаем холст эффектов один раз за всю сессию игры
        if (!this.effectsCanvas) {
            this.effectsCanvas = document.createElement('canvas');
            this.effectsCanvas.id = 'gameEffectsCanvas';
            this.effectsCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100dvh;z-index:13;pointer-events:none;';
            document.body.appendChild(this.effectsCanvas);
            this.effectsCtx = this.effectsCanvas.getContext('2d');
        }

        // Динамический ресайз холста без сброса контекста
        if (this.effectsCanvas.width !== window.innerWidth || this.effectsCanvas.height !== window.innerHeight) {
            this.effectsCanvas.width = window.innerWidth;
            this.effectsCanvas.height = window.innerHeight;
        }

        let progress = 0;
        const startTime = Date.now();
        const ctx = this.effectsCtx;
        const canvas = this.effectsCanvas;

        const drawBeam = () => {
            const elapsed = Date.now() - startTime;
            progress = Math.min(elapsed / 200, 1); // Анимация выстрела за 200мс
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (progress < 1) {
                const cx = sx + (ex - sx) * progress;
                const cy = sy + (ey - sy) * progress;
                const gradient = ctx.createLinearGradient(sx, sy, cx, cy);
                
                gradient.addColorStop(0, 'rgba(105, 240, 174, 1)');
                gradient.addColorStop(0.8, 'rgba(105, 240, 174, 0.4)');
                gradient.addColorStop(1, 'rgba(105, 240, 174, 0)');
                
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(cx, cy);
                ctx.lineWidth = 5 * (1 - progress);
                ctx.strokeStyle = gradient;
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(cx, cy, 8 * (1 - progress), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(105, 240, 174, ${0.8 * (1 - progress)})`;
                ctx.fill();
                
                requestAnimationFrame(drawBeam);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };
        drawBeam();
        this.playSound('helperSound');
    },

    helperAttack: function() {
        if (!this.currentBlock || !window.gameState?.helperActive || !this.helperElement || this.isGamePaused) return;

        this.createHelperEffect();

        let dmg = window.gameState.clickPower * (1 + (window.gameState.helperDamageBonus || 0)) * (1 + (window.gameState.helperUpgradeLevel || 0) * 0.2) * this.getBonus('getDamageMultiplier', 1);

        this.currentBlockHealth -= dmg;
        window.gameState.totalDamageDealt += dmg;

        if (window.achievementsSystem) window.achievementsSystem.incrementTotalDamage(dmg);

        this.spawnDamageText(Math.round(dmg), this.currentBlock, '#69f0ae', false);
        if (UI) UI.checkLocationUpgrade();

        if (this.currentBlockHealth <= 0) {
            this.destroyBlock(this.currentBlock);
        } else {
            this.currentBlock.textContent = Math.floor(this.currentBlockHealth);
            this.updateCracks(this.currentBlock, this.currentBlockHealth);
        }
    },

    updateCracks: function(block, health) {
        if (!block) return;
        const ex = block.querySelector('.crack-overlay');
        if (ex) block.removeChild(ex);
        const max = parseInt(block.dataset.maxHealth), rat = 1 - (health / max);
        if (rat > 0.7) block.appendChild(Object.assign(document.createElement('div'), { className: 'crack-overlay crack-3' }));
        else if (rat > 0.4) block.appendChild(Object.assign(document.createElement('div'), { className: 'crack-overlay crack-2' }));
        else if (rat > 0.1) block.appendChild(Object.assign(document.createElement('div'), { className: 'crack-overlay crack-1' }));
    },

    createHelperElement: function() {
        if (this.helperElement?.parentNode) this.helperElement.parentNode.removeChild(this.helperElement);
        this.helperElement = document.createElement('div');
        this.helperElement.className = 'helper';
        document.body.appendChild(this.helperElement);
        this.moveHelperToRandomPosition();
        this.helperElement.style.opacity = '0';
        setTimeout(() => { if (this.helperElement) this.helperElement.style.opacity = '1'; }, 100);
    },

    moveHelperToRandomPosition: function() {
        if (!this.helperElement) return;
        let t = { left: window.innerWidth / 2, top: window.innerHeight / 2 };
        if (this.currentBlock) t = this.currentBlock.getBoundingClientRect();
        for (let i = 0; i < 20; i++) {
            const rx = Math.random() * (window.innerWidth - 60) + 30,
                  ry = Math.random() * (window.innerHeight - 120) + 60;
            const dist = Math.sqrt(Math.pow(rx - (t.left + t.width / 2), 2) + Math.pow(ry - (t.top + t.height / 2), 2));
            if (dist > 150 && rx > 60 && rx < window.innerWidth - 60 && ry > 100 && ry < window.innerHeight - 60) {
                this.helperPosition = { x: rx, y: ry };
                break;
            }
        }
        this.helperElement.style.left = this.helperPosition.x + 'px';
        this.helperElement.style.top = this.helperPosition.y + 'px';
    },

    /* ==========================================================================
       6. УПРАВЛЕНИЕ МЕЖПЛАНЕТНЫМИ СОСТОЯНИЯМИ И ЗАГРУЗКОЙ
       ========================================================================== */

    setLocation: function(loc) {
        if (!window.gameState || !CFG || !UI) return;
        if (CFG.planetOrder.indexOf(loc) < CFG.planetOrder.indexOf(window.gameState.currentLocation)) return;
        window.gameState.currentLocation = loc;

        const gameTitle = document.getElementById('gameTitle');
        const header = document.getElementById('header');
        if (gameTitle && window.applyTranslation) window.applyTranslation(gameTitle, `gameTitle.${loc}`);
        if (header) header.style.borderColor = CFG.locations[loc].borderColor;

        if (window.planetBackground?.setPlanet) window.planetBackground.setPlanet(loc);

        const ann = document.getElementById('levelAnnounce');
        if (ann) {
            ann.textContent = CFG.locations[loc].name;
            ann.style.color = CFG.locations[loc].color;
            ann.style.opacity = "1";
            setTimeout(() => { ann.style.opacity = "0"; }, 2000);
        }

        if (window.achievementsSystem) window.achievementsSystem.updatePlanetProgress(CFG.planetOrder.indexOf(loc) + 1);
        UI.updateProgressBar();
    },

    startGame: function(reset = true) {
        console.log('🚀 Start, reset =', reset);
        if (reset) {
            if (typeof window.resetGame === 'function') window.resetGame();
        } else {
            window.gameState.clickPower = this.calculateClickPower();
        }

        this.isGamePaused = false;
        if (window.gameState) window.gameState.gamePaused = false;
        window.gameState.helperActive = false;
        window.gameState.helperTimeLeft = 0;
        window.gameState.boboCoinBonus = 0;

        if (this.helperInterval) { clearInterval(this.helperInterval); this.helperInterval = null; }
        if (this.helperTimer) { clearInterval(this.helperTimer); this.helperTimer = null; }
        if (this.helperElement?.parentNode) this.helperElement.parentNode.removeChild(this.helperElement);
        this.helperElement = null;
        if (this.autoClickInterval) { clearInterval(this.autoClickInterval); this.autoClickInterval = null; }
        if (this.magnetInterval) { clearInterval(this.magnetInterval); this.magnetInterval = null; }

        const ga = document.getElementById('gameArea');
        if (ga) ga.innerHTML = "";
        const ws = document.getElementById('welcomeScreen'),
              gs = document.getElementById('gameOverScreen');
        if (ws) ws.style.display = "none";
        if (gs) gs.style.display = "none";

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

        if (UI) {
            UI.updateHUD();
            UI.updateUpgradeButtons();
            UI.updateProgressBar();
        }
        this.setLocation(window.gameState.currentLocation);

        if (window.shopSystem?.updateShopDisplay) window.shopSystem.updateShopDisplay();
        if (window.achievementsSystem?.updateAchievementsDisplay) window.achievementsSystem.updateAchievementsDisplay();

        setTimeout(() => this.createMovingBlock(), 500);
    },

    continueGame: async function() {
        console.log('🔄 [GAME] Starting continueGame...');

        if (!window.gameState || Object.keys(window.gameState).length === 0) {
            window.gameState = {
                coins: 0, clickPower: 1, critChance: 0.001, critMultiplier: 2.0,
                currentLocation: 'mercury', totalDamageDealt: 0, clickUpgradeLevel: 0,
                critChanceUpgradeLevel: 0, critMultiplierUpgradeLevel: 0, helperUpgradeLevel: 0,
                helperActivations: 0, helperActive: false, helperTimeLeft: 0, helperDamageBonus: 0,
                boboCoinBonus: 0, comboCount: 0, lastDestroyTime: 0, gameActive: false, gamePaused: false,
                achievements: {}, shopItems: {}, permanentBonuses: {}, unlockedLocations: ['mercury'],
                boboSkin: 'default', dailyBonus: { lastClaimDate: null, currentDay: 1, totalClaimed: 0, streak: 0 }
            };
        }

        if (!window.gameMetrics || Object.keys(window.gameMetrics).length === 0) {
            window.gameMetrics = {
                startTime: 0, blocksDestroyed: 0, upgradesBought: 0, totalClicks: 0, totalCrits: 0,
                totalCoinsEarned: 0, helpersBought: 0, boostersUsed: 0, maxCombo: 0, rareBlocksDestroyed: 0, sessions: 0
            };
        }

        if (typeof window.cloudInit === 'function') {
            try { await window.cloudInit(); } catch (e) { console.error('☁️ [GAME] cloudInit error:', e); }
        }

        if (UI) {
            UI.updateHUD();
            UI.updateUpgradeButtons();
            UI.updateProgressBar();
        }
        this.setLocation(window.gameState.currentLocation);
        this.startGame(false);

        if (window.showTooltip && window.formatString) {
            const t = window.formatString('Игра загружена! Кристаллы: {coins}', {
                coins: Math.floor(window.gameState.coins || 0).toLocaleString()
            });
            window.showTooltip(t);
            setTimeout(window.hideTooltip, 3000);
        }
    },

    restartGame: function() { this.startGame(true); },

    /* ==========================================================================
       7. ИНИЦИАЛИЗАЦИЯ ИВЕНТОВ И СВЯЗУЮЩИЙ ИНТЕРФЕЙС
       ========================================================================== */

    initEventHandlers: function() {
        const langBtn = document.getElementById('langBtn-welcome');
        if (langBtn) {
            langBtn.addEventListener('click', window.switchLanguage);
            langBtn.addEventListener('touchstart', e => { e.preventDefault(); window.switchLanguage(); }, { passive: false });
        }

        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                const ws = document.getElementById('welcomeScreen'); if (ws) ws.style.display = "none";
                this.startGame(true);
            });
        }

        const contBtn = document.getElementById('continueBtn');
        if (contBtn) {
            contBtn.addEventListener('click', () => {
                const ws = document.getElementById('welcomeScreen'); if (ws) ws.style.display = "none";
                this.continueGame();
            });
        }

        const add = (id, fn) => {
            const b = document.getElementById(id);
            if (b) {
                b.addEventListener('click', fn);
                b.addEventListener('touchstart', e => { e.preventDefault(); fn(); }, { passive: false });
            }
        };

        if (FEAT) {
            add('upgradeClickBtn', () => FEAT.buyClickPower());
            add('upgradeHelperBtn', () => FEAT.buyHelper());
            add('upgradeCritChanceBtn', () => FEAT.buyCritChance());
            add('upgradeCritMultBtn', () => FEAT.buyCritMultiplier());
            add('upgradeHelperDmgBtn', () => FEAT.buyHelperDamage());
        }

        add('shareBtn', () => {
            if (!window.gameState) return;
            const txt = `🎮 Я нанес ${Math.floor(window.gameState.totalDamageDealt).toLocaleString()} урона и собрал ${Math.floor(window.gameState.coins)} Кристаллов! 🌌`;
            if (navigator.share) {
                navigator.share({ title: 'Космический Кликер', text: txt }).then(() => {
                    window.gameState.coins += 50;
                    if (UI) { UI.updateHUD(); UI.updateUpgradeButtons(); }
                    if (typeof window.saveGame === 'function') window.saveGame();
                });
            }
        });

        add('saveBtn', () => { if (typeof window.saveGame === 'function') window.saveGame(); });

        const tips = {
            upgradeClickBtn: 'tooltips.upgradeClick', upgradeHelperBtn: 'tooltips.upgradeHelper',
            upgradeCritChanceBtn: 'tooltips.upgradeCritChance', upgradeCritMultBtn: 'tooltips.upgradeCritMult',
            upgradeHelperDmgBtn: 'tooltips.upgradeHelperDmg'
        };

        Object.entries(tips).forEach(([id, tk]) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('mouseenter', () => {
                    if (window.showTooltip && window.translations) {
                        window.showTooltip(window.translations[window.currentLanguage][tk]);
                    }
                });
                btn.addEventListener('mouseleave', () => { if (window.hideTooltip) window.hideTooltip(); });
            }
        });

        window.addEventListener('resize', () => { if (this.helperElement) this.moveHelperToRandomPosition(); });
    }
};

// Проброс мостов для внешних систем (UI, Shop, Features)
window.gameFunctions = {
    startGame: () => window.GAME_CORE.startGame(true),
    continueGame: () => window.GAME_CORE.continueGame(),
    restartGame: () => window.GAME_CORE.restartGame(),
    pauseGame: () => window.GAME_CORE.pauseGame(),
    resumeGame: () => window.GAME_CORE.resumeGame(),
    updateHUD: () => UI?.updateHUD(),
    updateUpgradeButtons: () => UI?.updateUpgradeButtons(),
    updateProgressBar: () => UI?.updateProgressBar(),
    checkLocationUpgrade: () => UI?.checkLocationUpgrade(),
    createDamageText: (d, b, c) => window.GAME_CORE.spawnDamageText(d, b, c, false),
    showComboText: (c, b, bl) => window.GAME_CORE.showComboText(c, b, bl),
    showRewardText: (r, bl) => window.GAME_CORE.showRewardText(r, bl),
    createExplosion: bl => FEAT?.createExplosion(bl),
    playSound: id => window.GAME_CORE.playSound(id),
    hitBlock: (b, d) => window.GAME_CORE.hitBlock(b, d),
    destroyBlock: bl => window.GAME_CORE.destroyBlock(bl),
    createMovingBlock: () => window.GAME_CORE.createMovingBlock(),
    shareResult: () => {},
    updateAllTranslations: () => {},
    setLocation: loc => window.GAME_CORE.setLocation(loc),
    applyUpgradePenalty: () => FEAT?.applyUpgradePenalty(),
    calculateClickPower: () => window.GAME_CORE.calculateClickPower()
};

// Запуск ядра
document.addEventListener('DOMContentLoaded', () => {
    window.GAME_CORE.init();
});

})();
