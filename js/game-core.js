// js/game-core.js
(function() {
'use strict';

// === ПРОВЕРКА ЗАВИСИМОСТЕЙ ===
if (!window.GAME_CONFIG) {
    throw new Error('[GAME_CORE] GAME_CONFIG не загружен. Проверьте порядок скриптов в index.html');
}
if (!window.GAME_UI) {
    throw new Error('[GAME_CORE] GAME_UI не загружен. Проверьте порядок скриптов в index.html');
}
if (!window.GAME_FEATURES) {
    throw new Error('[GAME_CORE] GAME_FEATURES не загружен. Проверьте порядок скриптов в index.html');
}

const CFG = window.GAME_CONFIG;
const UI = window.GAME_UI;
const FEAT = window.GAME_FEATURES;

// ✅ gameState и gameMetrics инициализируются в save-system.js
// Здесь только проверка на случай, если save-system не загрузился
if (!window.gameState) {
    console.warn('️ [CORE] gameState не инициализирован save-system.js');
    window.gameState = window.gameState || {};
}
if (!window.gameMetrics) {
    console.warn('⚠️ [CORE] gameMetrics не инициализирован save-system.js');
    window.gameMetrics = window.gameMetrics || {};
}

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
            block.innerHTML = `🌟 <div style="font-size:0.35em;margin-top:1px;line-height:1.1;">${rb.name}</div>`;
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

   /**
 * Обработка удара по блоку
 * ✅ Делегирует расчёт урона в CombatSystem
 */
hitBlock: function(block, damage) {
    // Делегируем в CombatSystem
    const result = window.CombatSystem?.hit(block, damage);
    
    if (!result || result.damage === 0) return;
    
    // Визуализация (остаётся в game-core)
   UI.createDamageText(result.damage, block, result.isCrit ? '#FFD700' : '#ff4444');
    
    // Достижения
    if (result.isCrit && window.EventBus) {
        window.EventBus.emit('game:critMade', 1);
    }
    
    // Проверка разрушения
    if (result.destroyed) {
        this.destroyBlock(block);
    } else {
        block.textContent = Math.floor(this.currentBlockHealth);
        UI.updateCracks(block, this.currentBlockHealth);
    }
},

   /**
 * Обработка разрушения блока
 * ✅ Делегирует расчёт награды в CombatSystem
 */
destroyBlock: function(block) {
    // Делегируем в CombatSystem
    const result = window.CombatSystem?.destroy(block);
    
    if (!result) return;
    
    // Визуализация
    if (result.comboCount > 1) {
        UI.showComboText(result.comboCount, result.comboBonus, block);
        this.playSound('comboSound');
    }
    
    UI.showRewardText(result.reward, block);
    FEAT.createExplosion(block);
    
    // Достижения
   if (window.EventBus) {
        const currentPlanet = window.gameState.currentLocation;
        
        // Событие: заработаны кристаллы
        window.EventBus.emit('game:coinsEarned', result.reward);
        
        // Событие: разрушен блок на планете
        window.EventBus.emit('game:blockDestroyed', { 
            planet: currentPlanet, 
            isRare: result.isRare 
        });
        
        // Событие: обновлено комбо
        if (result.comboCount > (window.gameMetrics.maxCombo || 0)) {
            window.gameMetrics.maxCombo = result.comboCount;
            window.EventBus.emit('game:comboUpdated', {
                combo: result.comboCount,
                planet: currentPlanet
            });
        }
    }
    
    // Обновление UI
    UI.updateHUD();
    UI.updateUpgradeButtons();
    this.playSound('breakSound');
    
    // Удаление блока
    const ga = document.getElementById('gameArea');
    if (ga?.contains(block)) ga.removeChild(block);
    this.currentBlock = null;
    this.currentBlockHealth = 0;
    
    setTimeout(() => { if (window.gameState?.gameActive) this.createMovingBlock(); }, 500);
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

         if (window.EventBus) {
        window.EventBus.emit('game:damageDealt', dmg);
    }

        UI.createDamageText(Math.round(dmg), this.currentBlock, '#69f0ae');
        UI.checkLocationUpgrade();

        if (this.currentBlockHealth <= 0) this.destroyBlock(this.currentBlock);
        else {
            this.currentBlock.textContent = Math.floor(this.currentBlockHealth);
            UI.updateCracks(this.currentBlock, this.currentBlockHealth);
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

        if (window.EventBus) {
        window.EventBus.emit('game:planetVisited', CFG.planetOrder.indexOf(loc) + 1);
       }
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
    console.log('🔄 [GAME] Starting continueGame...');
    
    // ☁️ Облачная инициализация
    if (typeof window.cloudInit === 'function') {
        console.log('☁️ [GAME] Вызов cloudInit...');
        try {
            await window.cloudInit();
            console.log('☁️ [GAME] cloudInit завершён');
        } catch (e) {
            console.error('☁️ [GAME] cloudInit error:', e);
        }
    } else {
        console.warn('⚠️ [GAME] cloudInit function NOT found');
    }
    
    // ✅ Защита: если gameState пустой после загрузки — используем дефолт
    if (!window.gameState || !window.gameState.currentLocation) {
        console.warn('⚠️ [GAME] gameState пустой, используем дефолт');
        window.gameState = {
            coins: 0,
            clickPower: 1,
            critChance: 0.001,
            critMultiplier: 2.0,
            currentLocation: 'mercury',
            totalDamageDealt: 0,
            clickUpgradeLevel: 0,
            critChanceUpgradeLevel: 0,
            critMultiplierUpgradeLevel: 0,
            helperUpgradeLevel: 0,
            helperActive: false,
            helperTimeLeft: 0,
            helperDamageBonus: 0,
            boboCoinBonus: 0,
            comboCount: 0,
            lastDestroyTime: 0,
            gameActive: false,
            gamePaused: false,
            achievements: {},
            shopItems: {},
            permanentBonuses: {},
            unlockedLocations: ['mercury'],
            boboSkin: 'default',
            dailyBonus: {
                lastClaimDate: null,
                currentDay: 1,
                totalClaimed: 0,
                streak: 0
            }
        };
    }
    
    console.log('💾 [GAME] gameState.coins:', window.gameState.coins);
    console.log('💾 [GAME] gameState.currentLocation:', window.gameState.currentLocation);
    console.log('✅ [GAME] Load successful, starting game...');
    
    // Обновляем UI
    if (window.UI) {
        if (window.UI.updateHUD) window.UI.updateHUD();
        if (window.UI.updateUpgradeButtons) window.UI.updateUpgradeButtons();
        if (window.UI.updateProgressBar) window.UI.updateProgressBar();
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
   createDamageText: (d, b, c) => UI.createDamageText(d, b, c),
    showComboText: (c, b, bl) => UI.showComboText(c, b, bl),
    showRewardText: (r, bl) => UI.showRewardText(r, bl),
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
