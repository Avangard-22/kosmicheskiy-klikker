// js/game-core.js (v2.0)
(function() {
'use strict';

const CFG = window.GAME_CONFIG;
const UI = window.GAME_UI;
const FEAT = window.GAME_FEATURES;

if (!window.gameState) {
    console.warn('⚠️ [CORE] gameState не инициализирован');
    window.gameState = {};
}
if (!window.gameMetrics) {
    console.warn('⚠️ [CORE] gameMetrics не инициализирован');
    window.gameMetrics = {};
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
    blockSpeed: CFG.isMobile ? 25 : 20,
    lastHapticTime: 0,

    // Permanent-множители (устанавливаются PerkSystem)
    permanentClickMult: 1,
    permanentBlockHpMult: 1,
    permanentRewardMult: 1,
    permanentHelperInterval: 1500,
    permanentStartBonus: 0,
    _intervalMultActive: false,

    getBonus: function(type, fallback = 1) {
        if (window.shopSystem && typeof window.shopSystem[type] === 'function') {
            return window.shopSystem[type]();
        }
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

    // ✅ Piecewise прогрессия силы удара
    calculateClickPower: function() {
        const lvl = window.gameState.clickUpgradeLevel || 0;
        const prog = CFG.balanceConfig.damageProgression;

        const baseAt = (n) => 1 + (n *
            Math.pow(prog.diminishingReturns, Math.min(n, prog.maxLevelEffect)) *
            Math.sqrt(n + 1) * prog.baseMultiplier);

        if (lvl <= 50) return baseAt(lvl);

        const at50 = baseAt(50);
        // 51..100: +1/ур
        const r1 = Math.min(Math.max(lvl - 50, 0), 50);
        // 101..500: +0.5/ур
        const r2 = Math.min(Math.max(lvl - 100, 0), 400);
        // 501+: +0.25/ур
        const r3 = Math.max(lvl - 500, 0);

        let power = at50 + r1 * 1.0 + r2 * 0.5 + r3 * 0.25;

        // Permanent-бонусы
        const perkMult = this.permanentClickMult || 1;
        const startAdd = (window.gameState?.planetDamageDealt === 0) ? (this.permanentStartBonus || 0) : 0;

        return Math.max(1, Math.round(power * perkMult + startAdd));
    },

    getCurrentSpeed: function() {
        if (!window.gameState) return this.blockSpeed;
        let speed = this.blockSpeed * (CFG.planetOrder.indexOf(window.gameState.currentLocation) < 3 ? 0.85 : 1);
        return speed * this.getBonus('getSpeedMultiplier', 1);
    },

    // Делегирует в CombatSystem
    calculateBlockHealth: function() {
        if (window.CombatSystem?.calculateBlockHealth) {
            return window.CombatSystem.calculateBlockHealth();
        }
        // Fallback
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
            block.innerHTML = `🌟<div style="font-size:0.35em;margin-top:1px;line-height:1.1">${rb.name}</div>`;
            this.announceRareBlock(rb.name);
        } else {
            const ci = Math.floor(Math.random() * theme.blockColors.length);
            block.style.background = `linear-gradient(135deg, ${theme.blockColors[ci]}, ${theme.blockColors[(ci + 1) % theme.blockColors.length]})`;
            block.style.boxShadow = `0 0 15px ${theme.blockColors[ci]}`;
            block.style.border = `2px solid ${theme.borderColor}`;
            block.textContent = this.currentBlockHealth;
        }

        block.addEventListener('click', () => this.hitBlock(block, window.gameState.clickPower, false));
        block.addEventListener('touchstart', (e) => { e.preventDefault(); this.hitBlock(block, window.gameState.clickPower, false); }, { passive: false });

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
        el.textContent = `🌟 ${name} блок! 🌟`;
        document.body.appendChild(el);
        el.addEventListener('animationend', () => {
            if (el.parentNode) el.parentNode.removeChild(el);
        });
    },

    animateBlock: function(block) {
        if (!window.gameState || !window.gameState.gameActive || this.currentBlock !== block) return;
        let pos = parseFloat(block.style.bottom) || 0;
        const move = () => {
            if (!window.gameState?.gameActive || this.currentBlock !== block) return;
            if (this.isGamePaused) {
                requestAnimationFrame(move);
                return;
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

    // ✅ Делегирование в CombatSystem + поддержка isAuto
    hitBlock: function(block, damage, isAuto = false) {
        if (!window.gameState?.gameActive || this.isGamePaused) return;

        // Тактильный отклик только для игрока (не для Бобо и не для автокликера)
        if (!isAuto) {
            const now = Date.now();
            if (!this.lastHapticTime || now - this.lastHapticTime > 150) {
                if (navigator.vibrate) navigator.vibrate(50);
                if (window.telegramHaptic) window.telegramHaptic.light();
                this.lastHapticTime = now;
                this.playSound('clickSound');
            }

            block.style.transform = 'translateX(-50%) scale(0.85)';
            setTimeout(() => { block.style.transform = 'translateX(-50%) scale(1)'; }, 100);
        }

        const result = window.CombatSystem.applyHit(damage, isAuto);

        this.createDamageText(result.damage, block, result.isCrit ? '#FFD700' : (isAuto ? '#69f0ae' : '#ff4444'));
        UI.checkLocationUpgrade();

        if (result.destroyed) {
            this.destroyBlock(block, isAuto);
        } else if (block) {
            block.textContent = Math.floor(this.currentBlockHealth || 0);
            this.updateCracks(block, this.currentBlockHealth || 0);
        }
    },

    // ✅ Делегирование в CombatSystem + поддержка isAuto
    destroyBlock: function(block, isAuto = false) {
        if (!window.gameState || !block) return;

        const result = window.CombatSystem.applyDestroy(block, isAuto);
        if (!result) return;

        // Комбо-текст (только для игрока)
        if (!isAuto && result.comboCount > 1) {
            this.showComboText(result.comboCount, result.comboBonus, block);
            this.playSound('comboSound');
        }

        UI.updateHUD();
        UI.updateUpgradeButtons();
        this.playSound('breakSound');
        this.showRewardText(result.reward, block);
        FEAT.createExplosion(block);

        const ga = document.getElementById('gameArea');
        if (ga?.contains(block)) ga.removeChild(block);
        this.currentBlock = null;
        this.currentBlockHealth = 0;
        setTimeout(() => { if (window.gameState?.gameActive) this.createMovingBlock(); }, 500);
    },

    createDamageText: function(dmg, block, col) {
        const r = block.getBoundingClientRect();
        const t = document.createElement('div');
        t.className = 'damage-text';
        t.textContent = `-${dmg}`;
        t.style.color = col;

        let l = r.left + r.width / 2;
        let tp = r.top;

        if (l < 50) l = 50;
        if (l > window.innerWidth - 50) l = window.innerWidth - 50;
        if (tp < 50) tp = 50;

        t.style.left = l + 'px';
        t.style.top = tp + 'px';

        document.body.appendChild(t);

        t.addEventListener('animationend', () => {
            if (t.parentNode) t.parentNode.removeChild(t);
        });
    },

    showComboText: function(c, b, block) {
        const r = block.getBoundingClientRect();
        const t = document.createElement('div');
        t.className = 'combo-text';
        t.textContent = window.formatString(window.translations[window.currentLanguage].tooltips.combo, { count: c, bonus: b });

        let l = r.left + r.width / 2;
        let tp = r.top;

        if (l < 75) l = 75;
        if (l > window.innerWidth - 75) l = window.innerWidth - 75;
        if (tp < 50) tp = 50;

        t.style.left = l + 'px';
        t.style.top = tp + 'px';

        document.body.appendChild(t);

        t.addEventListener('animationend', () => {
            if (t.parentNode) t.parentNode.removeChild(t);
        });
    },

    showRewardText: function(r, block) {
        const rct = block.getBoundingClientRect();
        const t = document.createElement('div');
        t.className = 'reward-text';
        t.textContent = window.formatString(window.translations[window.currentLanguage].tooltips.reward, { reward: r });
        let l = rct.left + rct.width / 2;
        let tp = rct.top + rct.height / 2;

        if (l < 60) l = 60;
        if (l > window.innerWidth - 60) l = window.innerWidth - 60;
        if (tp < 50) tp = 50;

        t.style.left = l + 'px';
        t.style.top = tp + 'px';

        document.body.appendChild(t);

        t.addEventListener('animationend', () => {
            if (t.parentNode) t.parentNode.removeChild(t);
        });
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

    initEffectCanvas: function() {
        if (!this.effectCanvas) {
            this.effectCanvas = document.createElement('canvas');
            this.effectCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100;';
            document.body.appendChild(this.effectCanvas);
            const resize = () => {
                this.effectCanvas.width = window.innerWidth;
                this.effectCanvas.height = window.innerHeight;
            };
            resize();
            window.addEventListener('resize', resize);
        }
    },

    createHelperEffect: function() {
        if (!this.currentBlock || !this.helperElement) return;
        this.initEffectCanvas();

        const br = this.currentBlock.getBoundingClientRect();
        const hr = this.helperElement.getBoundingClientRect();

        const sx = hr.left + hr.width / 2;
        const sy = hr.top + hr.height / 2;
        const ex = br.left + br.width / 2;
        const ey = br.top + br.height / 2;

        const cv = this.effectCanvas;
        const ctx = cv.getContext('2d');

        let st = Date.now();
        const an = () => {
            const el = Date.now() - st;
            const p = Math.min(el / 300, 1);

            ctx.clearRect(0, 0, cv.width, cv.height);

            if (p > 0) {
                const cx = sx + (ex - sx) * p;
                const cy = sy + (ey - sy) * p;

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

            if (p < 1) {
                requestAnimationFrame(an);
            } else {
                ctx.clearRect(0, 0, cv.width, cv.height);
            }
        };

        an();
        this.playSound('helperSound');
    },

    // ✅ Бобо использует CombatSystem с isAuto=true
    helperAttack: function() {
        if (!this.currentBlock || !window.gameState || !window.gameState.helperActive || !this.helperElement || this.isGamePaused) return;

        this.createHelperEffect();

        let dmg = window.gameState.clickPower *
                  (1 + (window.gameState.helperDamageBonus || 0)) *
                  (1 + (window.gameState.helperUpgradeLevel || 0) * 0.2) *
                  this.getBonus('getDamageMultiplier', 1);

        // Делегируем математику в CombatSystem с isAuto=true
        const result = window.CombatSystem.applyHit(dmg, true);

        this.createDamageText(result.damage, this.currentBlock, '#69f0ae');
        UI.checkLocationUpgrade();

        if (result.destroyed) {
            this.destroyBlock(this.currentBlock, true);
        } else {
            this.currentBlock.textContent = Math.floor(this.currentBlockHealth || 0);
            this.updateCracks(this.currentBlock, this.currentBlockHealth || 0);
        }

        // ✅ Хук перка Bobo hit
        if (window.PerkSystem?.onBoboHit) window.PerkSystem.onBoboHit();
    },

    // ✅ Новый setLocation с doReset
    setLocation: function(loc, doReset = false) {
        if (!window.gameState) return;
        const currentIdx = CFG.planetOrder.indexOf(window.gameState.currentLocation);
        const newIdx = CFG.planetOrder.indexOf(loc);
        if (newIdx < currentIdx || newIdx === currentIdx) return;

        if (doReset) {
            // ── Сброс боевых параметров ──
            window.gameState.clickUpgradeLevel = 0;
            window.gameState.clickPower = this.calculateClickPower();
            window.gameState.critChanceUpgradeLevel = 0;
            window.gameState.critChance = 0.001;
            window.gameState.critMultiplierUpgradeLevel = 0;
            window.gameState.critMultiplier = 2.0;
            window.gameState.helperUpgradeLevel = 0;
            window.gameState.helperDamageBonus = 0;
            window.gameState.helperActive = false;
            window.gameState.helperTimeLeft = 0;
            window.gameState.boboCoinBonus = 0;
            window.gameState.planetDamageDealt = 0;
            window.gameState.planetFirstBlockCleared = false;
            window.gameState.comboCount = 0;
            window.gameState.lastDestroyTime = 0;

            // ✅ Сброс мусорных счётчиков
            delete window.gameState._boboHitCounter;
            delete window.gameState._boboCallCounter;
            delete window.gameState._crystalIntervalStart;
            delete window.gameState._crystalIntervalActive;

            // Уничтожить Bobo
            if (this.helperInterval) clearInterval(this.helperInterval);
            if (this.helperTimer) clearInterval(this.helperTimer);
            if (this.helperElement?.parentNode) document.body.removeChild(this.helperElement);
            this.helperElement = null;
            this.helperInterval = null;
            this.helperTimer = null;

            // Сбросить автокликер магазина
            if (window.shopSystem?.stopAutoClicker) window.shopSystem.stopAutoClicker();

            // Событие для подписчиков
            if (window.EventBus) {
                window.EventBus.emit('game:planetTransition', {
                    from: window.gameState.currentLocation,
                    to: loc,
                    planetIndex: newIdx
                });
            }

            // Выдать permanent-бонус (кроме Меркурия)
            if (newIdx > 0 && window.PerkSystem?.activatePerk) {
                window.PerkSystem.activatePerk(newIdx);
            }

            // UI перехода
            this.showTransitionUI(loc, newIdx);
        }

        // Новая локация
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

        if (window.achievementsSystem) window.achievementsSystem.updatePlanetProgress(loc);
        if (window.EventBus) window.EventBus.emit('game:planetChanged', loc);
        UI.updateProgressBar();
        UI.updateHUD();
        UI.updateUpgradeButtons();
    },

    // ✅ Модалка перехода
    showTransitionUI: function(loc, idx) {
        const old = document.getElementById('transitionModal');
        if (old) old.remove();

        const info = CFG.locations[loc];
        const modal = document.createElement('div');
        modal.id = 'transitionModal';
        modal.className = 'transition-modal';
        modal.style.animation = 'modalEnter 0.4s ease-out';

        const bonus = (idx > 0 && window.PerkSystem?.getPerkForPlanet)
            ? window.PerkSystem.getPerkForPlanet(idx)
            : null;

        modal.innerHTML = `
            <h2 style="margin:0 0 8px;color:${info.borderColor}">${info.name}</h2>
            <div class="tm-description">🛡️ Параметры сброшены к базовым<br>Достижения сохранены</div>
            ${bonus ? `
            <div class="tm-perk-box">
                <div class="tm-perk-title">🌟 Постоянный бонус получен</div>
                <div class="tm-perk-name">${bonus.name}</div>
                <div style="color:#aaa;font-size:0.75em;margin-top:4px">${bonus.desc}</div>
            </div>` : ''}
            <div class="tm-darkmatter-box">
                <div class="tm-darkmatter-title">⚫ Тёмная материя</div>
                <div class="tm-darkmatter-desc">Таинственная субстанция, необходимая для скачков в дальний космос. Пригодится для преодоления пространственных разломов за пределами Солнечной системы.</div>
                <div class="tm-balance">💎 Баланс: <span id="tmCrystals">${Math.floor(window.gameState.coins).toLocaleString()}</span></div>
                <button id="convertDarkMatterBtn" class="tm-btn">⚫ Обменять всё на Тёмную материю</button>
            </div>
            <button id="closeTransitionBtn" class="tm-proceed-btn">Продолжить</button>
        `;

        document.body.appendChild(modal);

        document.getElementById('convertDarkMatterBtn').addEventListener('click', () => {
            this.convertCrystalsToDarkMatter();
            const el = document.getElementById('tmCrystals');
            if (el) el.textContent = Math.floor(window.gameState.coins).toLocaleString();
        });

        document.getElementById('closeTransitionBtn').addEventListener('click', () => modal.remove());
    },

    // ✅ Конвертация кристаллов в тёмную материю
    convertCrystalsToDarkMatter: function() {
        if (!window.gameState) return;
        const rate = 100000;
        const maxConvert = Math.floor(window.gameState.coins / rate);
        if (maxConvert <= 0) {
            if (window.showTooltip) {
                window.showTooltip('❌ Недостаточно кристаллов (нужно 100 000 за 1 ед.)');
                setTimeout(window.hideTooltip, 2000);
            }
            return;
        }
        const amount = maxConvert;
        window.gameState.coins -= amount * rate;
        window.gameState.darkMatter = (window.gameState.darkMatter || 0) + amount;
        if (typeof window.saveGame === 'function') window.saveGame();
        if (window.GAME_UI?.updateHUD) window.GAME_UI.updateHUD();
        if (window.showTooltip) {
            window.showTooltip(`⚫ +${amount} Тёмной материи (осталось 💎 ${Math.floor(window.gameState.coins).toLocaleString()})`);
            setTimeout(window.hideTooltip, 3000);
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

        // ✅ Применить перки
        if (window.PerkSystem?.applyAllPerks) window.PerkSystem.applyAllPerks();

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

        if (!window.gameState || Object.keys(window.gameState).length === 0) {
            window.gameState = {
                coins: 0,
                clickPower: 1,
                critChance: 0.001,
                critMultiplier: 2.0,
                currentLocation: 'mercury',
                totalDamageDealt: 0,
                planetDamageDealt: 0,
                planetFirstBlockCleared: false,
                darkMatter: 0,
                clickUpgradeLevel: 0,
                critChanceUpgradeLevel: 0,
                critMultiplierUpgradeLevel: 0,
                helperUpgradeLevel: 0,
                helperActivations: 0,
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
            console.log('🔄 [GAME] gameState инициализирован дефолтными значениями');
        }

        if (!window.gameMetrics || Object.keys(window.gameMetrics).length === 0) {
            window.gameMetrics = {
                startTime: 0,
                blocksDestroyed: 0,
                upgradesBought: 0,
                totalClicks: 0,
                totalCrits: 0,
                totalCoinsEarned: 0,
                helpersBought: 0,
                boostersUsed: 0,
                maxCombo: 0,
                rareBlocksDestroyed: 0,
                sessions: 0,
                planetStats: {}
            };
        }

        if (typeof window.cloudInit === 'function') {
            console.log('☁️ [GAME] cloudInit вызывается...');
            try {
                await window.cloudInit();
                console.log('☁️ [GAME] cloudInit завершён');
            } catch (e) {
                console.error('☁️ [GAME] cloudInit error:', e);
            }
        } else {
            console.warn('⚠️ [GAME] cloudInit function NOT found');
        }

        console.log('✅ [GAME] Load successful, starting game...');
        console.log('💾 [GAME] gameState.coins:', window.gameState.coins);
        console.log('⚫ [GAME] gameState.darkMatter:', window.gameState.darkMatter);
        console.log('🌟 [GAME] permanentBonuses:', window.gameState.permanentBonuses);

        UI.updateHUD();
        UI.updateUpgradeButtons();
        UI.updateProgressBar();
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

    // ✅ Кнопка таблицы лидеров на welcome screen
    const leaderboardBtn = document.getElementById('leaderboardBtnWelcome');
    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', () => {
            if (window.leaderboardSystem && window.leaderboardSystem.togglePanel) {
                window.leaderboardSystem.togglePanel();
            }
        });
        leaderboardBtn.addEventListener('touchstart', e => {
            e.preventDefault();
            if (window.leaderboardSystem && window.leaderboardSystem.togglePanel) {
                window.leaderboardSystem.togglePanel();
            }
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
            const txt = `🎮 Я нанёс ${Math.floor(window.gameState.totalDamageDealt).toLocaleString()} урона и собрал ${Math.floor(window.gameState.coins)} Кристаллов! 🌌`;
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
    if (window.EventBus) {
        window.EventBus.emit('core:ready');
    }
});
})();