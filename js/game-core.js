// js/game-core.js
(function() {
'use strict';
const CFG = window.GAME_CONFIG;
const UI = window.GAME_UI;
const FEAT = window.GAME_FEATURES;

window.gameState = {};
window.gameMetrics = {};

window.GAME_CORE = {
    currentBlock: null,
    currentBlockHealth: 0,
    helperElement: null,
    helperInterval: null,
    helperTimer: null,
    helperPosition: { x: 0, y: 0 },
    isGamePaused: false,
    autoClickInterval: null,
    magnetInterval: null,
    blockSpeed: /Android|webOS|iPhone/i.test(navigator.userAgent) ? 25 : 20,

    getBonus: function(type, fallback = 1) {
        if (window.shopSystem && typeof window.shopSystem[type] === 'function') return window.shopSystem[type]();
        return fallback;
    },

    playSound: function(id) { 
        const s = document.getElementById(id); 
        if (s) { s.currentTime = 0; s.play().catch(() => {}); } 
    },

    pauseGame: function() { 
        this.isGamePaused = true; 
        if (window.gameState) window.gameState.gamePaused = true; 
        const shopPanel = document.getElementById('shopPanel');
        if (shopPanel) { shopPanel.style.maxHeight = '65vh'; shopPanel.style.overflowY = 'auto'; }
    },

    resumeGame: function() { 
        this.isGamePaused = false; 
        if (window.gameState) window.gameState.gamePaused = false; 
    },

    calculateClickPower: function() {
        const lvl = window.gameState.clickUpgradeLevel || 0;
        const prog = CFG.balanceConfig.damageProgression;
        return 1 + (lvl * Math.pow(prog.diminishingReturns, Math.min(lvl, prog.maxLevelEffect)) * Math.sqrt(lvl + 1) * prog.baseMultiplier);
    },

    getCurrentSpeed: function() {
        if (!window.gameState) return this.blockSpeed;
        let speed = this.blockSpeed * (CFG.planetOrder.indexOf(window.gameState.currentLocation) < 3 ? 0.85 : 1);
        return speed * this.getBonus('getSpeedMultiplier', 1);
    },

    calculateBlockHealth: function() {
        const target = (window.gameState.clickPower || 1) * CFG.balanceConfig.targetClicks;
        const base = CFG.balanceConfig.baseHealth * (1 + CFG.astronomicalUnits[window.gameState.currentLocation] * 2);
        const random = CFG.balanceConfig.healthRandomRange.min + Math.random() * (CFG.balanceConfig.healthRandomRange.max - CFG.balanceConfig.healthRandomRange.min);
        return Math.floor(((base + target) / 2) * random * this.getBonus('getBlockHealthMultiplier', 1));
    },

    createMovingBlock: function() {
        if (!window.gameState || !window.gameState.gameActive || this.isGamePaused) return;
        const gameArea = document.getElementById('gameArea');
        if (!gameArea) return;
        if (this.currentBlock?.parentNode === gameArea) gameArea.removeChild(this.currentBlock);
        
        this.currentBlockHealth = this.calculateBlockHealth();
        const block = document.createElement('div');
        block.className = 'moving-block';
        const size = (window.innerWidth < 768 ? 80 : 60) * (CFG.planetOrder.indexOf(window.gameState.currentLocation) < 3 ? 1.2 : (1 + CFG.planetOrder.indexOf(window.gameState.currentLocation) * 0.15));
        block.style.width = size + 'px';
        block.style.height = size + 'px';
        block.style.bottom = '0px';
        block.dataset.maxHealth = this.currentBlockHealth;
        
        const theme = CFG.locations[window.gameState.currentLocation];
        const rareType = this.getRareBlockType();
        
        if (rareType) {
            const rb = CFG.rareBlocks[rareType];
            block.classList.add(rb.className);
            this.currentBlockHealth = Math.floor(this.currentBlockHealth * rb.healthMultiplier);
            block.innerHTML = `🌟<div style="font-size:0.35em;margin-top:1px;line-height:1.1;">${rb.name}</div>`;
            this.announceRareBlock(rb.name);
        } else {
            const ci = Math.floor(Math.random() * theme.blockColors.length);
            block.style.background = `linear-gradient(135deg, ${theme.blockColors[ci]}, ${theme.blockColors[(ci + 1) % theme.blockColors.length]})`;
            block.style.boxShadow = `0 0 15px ${theme.blockColors[ci]}`;
            block.style.border = `2px solid ${theme.borderColor}`;
            block.textContent = this.currentBlockHealth;
        }
        
        block.addEventListener('click', () => this.hitBlock(block, window.gameState.clickPower));
        block.addEventListener('touchstart', (e) => { e.preventDefault(); this.hitBlock(block, window.gameState.clickPower); }, { passive: false });
        
        gameArea.appendChild(block);
        this.currentBlock = block;
        this.animateBlock(block);
    },

    getRareBlockType: function() {
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

    animateBlock: function(block) {
        if (!window.gameState || !window.gameState.gameActive || this.currentBlock !== block) return;
        let pos = parseFloat(block.style.bottom) || 0;
        const move = () => {
            if (this.isGamePaused || !window.gameState?.gameActive || this.currentBlock !== block) {
                requestAnimationFrame(move); return;
            }
            pos += this.getCurrentSpeed() / 30;
            block.style.bottom = pos + 'px';
            if (pos > window.innerHeight) {
                FEAT.applyUpgradePenalty();
                if (window.gameState?.gameActive) setTimeout(() => this.createMovingBlock(), 500);
                return;
            }
            requestAnimationFrame(move);
        };
        move();
    },

    hitBlock: function(block, damage) {
        if (!window.gameState || !window.gameState.gameActive || this.isGamePaused) return;
        if (navigator.vibrate) navigator.vibrate(50);
        if (window.telegramHaptic) window.telegramHaptic.light();
        this.playSound('clickSound');
        block.style.transform = 'translateX(-50%) scale(0.85)';
        setTimeout(() => { block.style.transform = 'translateX(-50%) scale(1)'; }, 100);
        
        let finalDamage = damage * this.getBonus('getDamageMultiplier', 1);
        let isCrit = false;
        let critChance = window.gameState.critChance * this.getBonus('getCritChanceMultiplier', 1);
        let critMult = window.gameState.critMultiplier * this.getBonus('getCritMultMultiplier', 1);
        critChance = Math.min(1.0, critChance);
        
        if (Math.random() < critChance) {
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
        
        this.createDamageText(finalDamage, block, isCrit ? '#FFD700' : '#ff4444');
        UI.checkLocationUpgrade();
        
        if (this.currentBlockHealth <= 0) this.destroyBlock(block);
        else { 
            block.textContent = Math.floor(this.currentBlockHealth); 
            this.updateCracks(block, this.currentBlockHealth); 
        }
    },

    destroyBlock: function(block) {
        if (!window.gameState) return;
        const now = Date.now(), win = /Android|webOS|iPhone/i.test(navigator.userAgent) ? 1500 : 2000;
        window.gameState.comboCount = (now - (window.gameState.lastDestroyTime || 0) < win) ? (window.gameState.comboCount || 0) + 1 : 1;
        window.gameState.lastDestroyTime = now;
        
        let r = Math.floor((25 + CFG.astronomicalUnits[window.gameState.currentLocation] * 100) * CFG.balanceConfig.rewardMultiplier);
        r = Math.floor(r * (CFG.balanceConfig.randomBonusRange.min + Math.random() * (CFG.balanceConfig.randomBonusRange.max - CFG.balanceConfig.randomBonusRange.min)));
        if (window.gameState.boboCoinBonus > 0) r = Math.floor(r * (1 + window.gameState.boboCoinBonus));
        r = Math.floor(r * this.getBonus('getRewardMultiplier', 1));
        
        let isRare = false;
        for (const k in CFG.rareBlocks) {
            if (block.classList.contains(CFG.rareBlocks[k].className)) { 
                r = Math.floor(r * CFG.rareBlocks[k].multiplier); 
                isRare = true;
                break; 
            }
        }
        
        if (window.gameState.comboCount > 1) {
            let comboMult = CFG.balanceConfig.comboMultiplier * this.getBonus('getComboMultiplier', 1);
            const bns = Math.floor(r * (window.gameState.comboCount * comboMult)); 
            r += bns;
            this.showComboText(window.gameState.comboCount, bns, block); 
            this.playSound('comboSound');
        }
        
        window.gameState.coins += r;
        
        if (window.achievementsSystem) {
            const currentPlanet = window.gameState.currentLocation;
            window.achievementsSystem.incrementCoinsEarned(r);
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
        this.showRewardText(r, block); 
        FEAT.createExplosion(block);
        
        const ga = document.getElementById('gameArea'); 
        if (ga?.contains(block)) ga.removeChild(block);
        this.currentBlock = null; 
        this.currentBlockHealth = 0;
        setTimeout(() => { if (window.gameState?.gameActive) this.createMovingBlock(); }, 500);
    },

    createDamageText: function(dmg, block, col) {
        const r = block.getBoundingClientRect(), t = document.createElement('div');
        t.className = 'damage-text'; 
        t.textContent = `-${dmg}`; 
        t.style.color = col;
        let l = r.left + r.width / 2, tp = r.top;
        if (l < 50) l = 50; 
        if (l > window.innerWidth - 50) l = window.innerWidth - 50; 
        if (tp < 50) tp = 50;
        t.style.left = l + 'px'; 
        t.style.top = tp + 'px'; 
        document.body.appendChild(t);
        let op = 1, y = tp;
        const anim = () => { 
            op -= 0.02; 
            y -= 2; 
            t.style.opacity = op; 
            t.style.top = y + 'px'; 
            if (op > 0) requestAnimationFrame(anim); 
            else if (t.parentNode) document.body.removeChild(t); 
        };
        anim();
    },

    showComboText: function(c, b, block) {
        const r = block.getBoundingClientRect(), t = document.createElement('div'); 
        t.className = 'combo-text';
        t.textContent = window.formatString(window.translations[window.currentLanguage].tooltips.combo, { count: c, bonus: b });
        let l = r.left + r.width / 2, tp = r.top;
        if (l < 75) l = 75; 
        if (l > window.innerWidth - 75) l = window.innerWidth - 75; 
        if (tp < 50) tp = 50;
        t.style.left = l + 'px'; 
        t.style.top = tp + 'px'; 
        document.body.appendChild(t);
        setTimeout(() => { if (t.parentNode) document.body.removeChild(t); }, 1000);
    },

    showRewardText: function(r, block) {
        const rct = block.getBoundingClientRect(), t = document.createElement('div'); 
        t.className = 'reward-text';
        t.textContent = window.formatString(window.translations[window.currentLanguage].tooltips.reward, { reward: r });
        let l = rct.left + rct.width / 2, tp = rct.top + rct.height / 2;
        if (l < 60) l = 60; 
        if (l > window.innerWidth - 60) l = window.innerWidth - 60; 
        if (tp < 50) tp = 50;
        t.style.left = l + 'px'; 
        t.style.top = tp + 'px'; 
        document.body.appendChild(t);
        setTimeout(() => { if (t.parentNode) document.body.removeChild(t); }, 1500);
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
        if (this.helperElement?.parentNode) document.body.removeChild(this.helperElement);
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

    createHelperEffect: function() {
        if (!this.currentBlock || !this.helperElement) return;
        const br = this.currentBlock.getBoundingClientRect(), 
              hr = this.helperElement.getBoundingClientRect();
        const c = document.createElement('div'); 
        c.className = 'helper-beam'; 
        c.style.position = 'absolute'; 
        c.style.zIndex = '13';
        c.style.pointerEvents = 'none';
        document.body.appendChild(c);
        
        const sx = hr.left + hr.width / 2, 
              sy = hr.top + hr.height / 2, 
              ex = br.left + br.width / 2, 
              ey = br.top + br.height / 2;
        const cv = document.createElement('canvas'), 
              mx = Math.max(window.innerWidth, window.innerHeight);
        cv.width = mx; 
        cv.height = mx; 
        cv.style.pointerEvents = 'none';
        c.appendChild(cv); 
        c.style.left = '0px'; 
        c.style.top = '0px';
        
        const ctx = cv.getContext('2d'); 
        let p = 0, st = Date.now();
        const an = () => {
            const el = Date.now() - st; 
            p = Math.min(el / 300, 1); 
            ctx.clearRect(0, 0, mx, mx);
            if (p > 0) {
                const cx = sx + (ex - sx) * p, cy = sy + (ey - sy) * p;
                const g = ctx.createLinearGradient(sx, sy, cx, cy);
                g.addColorStop(0, 'rgba(105, 240, 174, 0.9)'); 
                g.addColorStop(0.7, 'rgba(105, 240, 174, 0.5)'); 
                g.addColorStop(1, 'rgba(105, 240, 174, 0)');
                ctx.beginPath(); 
                ctx.moveTo(sx, sy); 
                ctx.lineTo(cx, cy);
                ctx.lineWidth = 4 + (4 * (1 - p)); 
                ctx.strokeStyle = g; 
                ctx.stroke();
                ctx.beginPath(); 
                ctx.arc(cx, cy, 8 * (1 - p), 0, Math.PI * 2); 
                ctx.fillStyle = `rgba(105, 240, 174, ${0.7 * (1 - p)})`; 
                ctx.fill();
            }
            if (p < 1) requestAnimationFrame(an); 
            else setTimeout(() => { if (c.parentNode) document.body.removeChild(c); }, 200);
        }; 
        an(); 
        this.playSound('helperSound');
    },

    helperAttack: function() {
        if (!this.currentBlock || !window.gameState || !window.gameState.helperActive || !this.helperElement || this.isGamePaused) return;
        
        this.createHelperEffect();
        
        let dmg = window.gameState.clickPower * (1 + (window.gameState.helperDamageBonus || 0)) * (1 + (window.gameState.helperUpgradeLevel || 0) * 0.2) * this.getBonus('getDamageMultiplier', 1);
        
        this.currentBlockHealth -= dmg;
        window.gameState.totalDamageDealt += dmg;
        
        if (window.achievementsSystem) {
            window.achievementsSystem.incrementTotalDamage(dmg);
        }
        
        this.createDamageText(Math.round(dmg), this.currentBlock, '#69f0ae');
        UI.checkLocationUpgrade();
        
        if (this.currentBlockHealth <= 0) this.destroyBlock(this.currentBlock);
        else {
            this.currentBlock.textContent = Math.floor(this.currentBlockHealth);
            this.updateCracks(this.currentBlock, this.currentBlockHealth);
        }
    },

    setLocation: function(loc) {
        if (!window.gameState) return;
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
        if (this.helperElement?.parentNode) document.body.removeChild(this.helperElement); 
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
        
        UI.updateHUD(); 
        UI.updateUpgradeButtons(); 
        UI.updateProgressBar(); 
        this.setLocation(window.gameState.currentLocation);
        
        if (window.shopSystem?.updateShopDisplay) window.shopSystem.updateShopDisplay();
        if (window.achievementsSystem?.updateAchievementsDisplay) window.achievementsSystem.updateAchievementsDisplay();
        
        setTimeout(() => this.createMovingBlock(), 500);
    },

continueGame: async function() {
    console.log('🔄 Пытаемся загрузить сохранение...');
    const hasLocal = typeof window.loadGame === 'function' && window.loadGame();
    
    // ☁️ ВАЖНО: облачная инициализация
    if (typeof window.cloudInit === 'function') {
        await window.cloudInit();
    }
    
    if (hasLocal || window.isCloudAvailable) {
        console.log('✅ Загрузка успешна, запускаем игру...');
        UI.updateHUD();
        UI.updateUpgradeButtons();
        UI.updateProgressBar();
        this.setLocation(window.gameState.currentLocation);
        this.startGame(false);
        if (window.showTooltip && window.formatString) {
            const t = window.formatString('Игра загружена! Кристаллы: {coins}, Урон: {damage}', {
                coins: Math.floor(window.gameState.coins).toLocaleString(),
                damage: Math.floor(window.gameState.totalDamageDealt).toLocaleString()
            });
            window.showTooltip(t);
            setTimeout(window.hideTooltip, 3000);
        }
    } else {
        if (window.showTooltip && window.translations) {
            window.showTooltip(window.translations[window.currentLanguage].tooltips.noSave);
            setTimeout(window.hideTooltip, 2000);
        }
    }
},

    restartGame: function() { 
        this.startGame(true); 
    },

    initEventHandlers: function() {
        const langBtn = document.getElementById('langBtn-welcome');
        if (langBtn) {
            langBtn.addEventListener('click', window.switchLanguage);
            langBtn.addEventListener('touchstart', e => { e.preventDefault(); window.switchLanguage(); }, { passive: false });
        }
        
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                const ws = document.getElementById('welcomeScreen');
                if (ws) ws.style.display = "none";
                this.startGame(true);
            });
            startBtn.addEventListener('touchstart', e => {
                e.preventDefault();
                const ws = document.getElementById('welcomeScreen');
                if (ws) ws.style.display = "none";
                this.startGame(true);
            }, { passive: false });
        }
        
        const contBtn = document.getElementById('continueBtn');
        if (contBtn) {
            contBtn.addEventListener('click', () => {
                const ws = document.getElementById('welcomeScreen');
                if (ws) ws.style.display = "none";
                this.continueGame();
            });
            contBtn.addEventListener('touchstart', e => {
                e.preventDefault();
                const ws = document.getElementById('welcomeScreen');
                if (ws) ws.style.display = "none";
                this.continueGame();
            }, { passive: false });
        }
        
        const add = (id, fn) => {
            const b = document.getElementById(id);
            if (b) {
                b.addEventListener('click', fn);
                b.addEventListener('touchstart', e => { e.preventDefault(); fn(); }, { passive: false });
            }
        };
        
        add('upgradeClickBtn', () => FEAT.buyClickPower());
        add('upgradeHelperBtn', () => FEAT.buyHelper());
        add('upgradeCritChanceBtn', () => FEAT.buyCritChance());
        add('upgradeCritMultBtn', () => FEAT.buyCritMultiplier());
        add('upgradeHelperDmgBtn', () => FEAT.buyHelperDamage());
        
        add('shareBtn', () => {
            if (!window.gameState) return;
            const txt = `🎮 Я нанес ${Math.floor(window.gameState.totalDamageDealt).toLocaleString()} урона и собрал ${Math.floor(window.gameState.coins)} Кристаллов! 🌌`;
            if (navigator.share) {
                navigator.share({ title: 'Космический Кликер', text: txt }).then(() => {
                    window.gameState.coins += 50;
                    UI.updateHUD();
                    UI.updateUpgradeButtons();
                    if (typeof window.saveGame === 'function') window.saveGame();
                });
            }
        });
        
        add('saveBtn', () => { if (typeof window.saveGame === 'function') window.saveGame(); });
        
        const tips = {
            upgradeClickBtn: 'tooltips.upgradeClick',
            upgradeHelperBtn: 'tooltips.upgradeHelper',
            upgradeCritChanceBtn: 'tooltips.upgradeCritChance',
            upgradeCritMultBtn: 'tooltips.upgradeCritMult',
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
                btn.addEventListener('mouseleave', () => {
                    if (window.hideTooltip) window.hideTooltip();
                });
            }
        });
        
        window.addEventListener('resize', () => {
            if (this.helperElement) this.moveHelperToRandomPosition();
        });
    }
};

window.gameFunctions = {
    startGame: () => window.GAME_CORE.startGame(true),
    continueGame: () => window.GAME_CORE.continueGame(),
    restartGame: () => window.GAME_CORE.restartGame(),
    pauseGame: () => window.GAME_CORE.pauseGame(),
    resumeGame: () => window.GAME_CORE.resumeGame(),
    updateHUD: () => UI.updateHUD(),
    updateUpgradeButtons: () => UI.updateUpgradeButtons(),
    updateProgressBar: () => UI.updateProgressBar(),
    checkLocationUpgrade: () => UI.checkLocationUpgrade(),
    createDamageText: (d, b, c) => window.GAME_CORE.createDamageText(d, b, c),
    showComboText: (c, b, bl) => window.GAME_CORE.showComboText(c, b, bl),
    showRewardText: (r, bl) => window.GAME_CORE.showRewardText(r, bl),
    createExplosion: bl => FEAT.createExplosion(bl),
    playSound: id => window.GAME_CORE.playSound(id),
    hitBlock: (b, d) => window.GAME_CORE.hitBlock(b, d),
    destroyBlock: bl => window.GAME_CORE.destroyBlock(bl),
    createMovingBlock: () => window.GAME_CORE.createMovingBlock(),
    shareResult: () => {},
    updateAllTranslations: () => {},
    setLocation: loc => window.GAME_CORE.setLocation(loc),
    applyUpgradePenalty: () => FEAT.applyUpgradePenalty(),
    calculateClickPower: () => window.GAME_CORE.calculateClickPower()
};

document.addEventListener('DOMContentLoaded', () => {
    window.GAME_CORE.initEventHandlers();
    UI.updateHUD();
    UI.updateUpgradeButtons();
    if (window.gameState?.currentLocation) window.GAME_CORE.setLocation(window.gameState.currentLocation);
    if (window.updateLanguageFlag) window.updateLanguageFlag();
    if (window.updateContinueButton) window.updateContinueButton();
});
})();