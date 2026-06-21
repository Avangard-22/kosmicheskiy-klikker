/* ==========================================================================
   🚀 COSMIC CLICKER - GAME FEATURES & PROGRESSION (PRODUCTION READY)
   ========================================================================== */

(function() {
'use strict';

// Безопасный доступ к внешним модулям
const CFG = window.GAME_CONFIG;
const UI = window.GAME_UI;
const CORE = window.GAME_CORE;

window.GAME_FEATURES = {
    // --- Локальный менеджер потоков эффектов ---
    activeParticles: [],
    animationFrameId: null,

    /* ==========================================================================
       1. МАТЕМАТИЧЕСКАЯ СИСТЕМА АПГРЕЙДОВ (ЭКОНОМИКА)
       ========================================================================= */

    /**
     * Вспомогательный метод для проверки баланса и списания средств.
     * @param {number} cost - Стоимость улучшения
     * @returns {boolean} - Успешность транзакции
     */
    _purchase: function(cost) {
        if (!window.gameState || window.gameState.coins < cost) return false;
        window.gameState.coins -= cost;
        window.gameMetrics.upgradesBought = (window.gameMetrics.upgradesBought || 0) + 1;
        return true;
    },

    /**
     * Улучшение силы клика.
     */
    buyClickPower: function() {
        if (!CFG || !window.gameState) return;
        const currentLevel = window.gameState.clickUpgradeLevel || 0;
        const prices = CFG.upgradePrices.clickPower;
        
        // Экспоненциальный расчет стоимости: Cost = Base * (Multiplier^Level)
        const cost = Math.floor(prices.base * Math.pow(prices.multiplier, currentLevel));

        if (this._purchase(cost)) {
            window.gameState.clickUpgradeLevel = currentLevel + 1;
            // Перерасчет силы клика в ядре на основе нового уровня
            if (CORE && typeof CORE.calculateClickPower === 'function') {
                window.gameState.clickPower = CORE.calculateClickPower();
            }
            this._onUpgradeSuccess('clickSound');
        } else {
            this._onUpgradeFail();
        }
    },

    /**
     * Покупка / Улучшение робота-помощника (Bobo).
     */
    buyHelper: function() {
        if (!CFG || !window.gameState || !CORE) return;
        const currentLevel = window.gameState.helperUpgradeLevel || 0;
        const prices = CFG.upgradePrices.helper;
        const cost = Math.floor(prices.base * Math.pow(prices.multiplier, currentLevel));

        if (this._purchase(cost)) {
            window.gameState.helperUpgradeLevel = currentLevel + 1;
            window.gameMetrics.helpersBought = (window.gameMetrics.helpersBought || 0) + 1;

            // Если это первая покупка — инициализируем сущность Bobo в DOM
            if (!window.gameState.helperActive) {
                window.gameState.helperActive = true;
                CORE.createHelperElement();
                this.startHelperTimeline();
            } else if (CORE.helperElement) {
                // Визуальный буст при апгрейде уже активного помощника
                CORE.helperElement.classList.add('helper-upgraded');
                setTimeout(() => CORE.helperElement?.classList.remove('helper-upgraded'), 500);
            }

            this._onUpgradeSuccess('helperSound');
        } else {
            this._onUpgradeFail();
        }
    },

    /**
     * Улучшение шанса критического удара.
     */
    buyCritChance: function() {
        if (!CFG || !window.gameState) return;
        const currentLevel = window.gameState.critChanceUpgradeLevel || 0;
        const prices = CFG.upgradePrices.critChance;
        const cost = Math.floor(prices.base * Math.pow(prices.multiplier, currentLevel));

        // Ограничение прокачки до 50%, чтобы не ломать баланс
        if ((window.gameState.critChance || 0) >= 0.50) {
            if (window.showTooltip) window.showTooltip('Максимальный уровень достигнут!');
            return;
        }

        if (this._purchase(cost)) {
            window.gameState.critChanceUpgradeLevel = currentLevel + 1;
            // Линейный прирост шанса на 1.5% за уровень от базового 0.1%
            window.gameState.critChance = 0.001 + (window.gameState.critChanceUpgradeLevel * 0.015);
            this._onUpgradeSuccess('clickSound');
        } else {
            this._onUpgradeFail();
        }
    },

    /**
     * Улучшение множителя критического урона.
     */
    buyCritMultiplier: function() {
        if (!CFG || !window.gameState) return;
        const currentLevel = window.gameState.critMultiplierUpgradeLevel || 0;
        const prices = CFG.upgradePrices.critMultiplier;
        const cost = Math.floor(prices.base * Math.pow(prices.multiplier, currentLevel));

        if (this._purchase(cost)) {
            window.gameState.critMultiplierUpgradeLevel = currentLevel + 1;
            // Прирост множителя на +0.5x за каждый уровень
            window.gameState.critMultiplier = 2.0 + (window.gameState.critMultiplierUpgradeLevel * 0.5);
            this._onUpgradeSuccess('clickSound');
        } else {
            this._onUpgradeFail();
        }
    },

    /**
     * Улучшение чистого урона робота Bobo.
     */
    buyHelperDamage: function() {
        if (!CFG || !window.gameState) return;
        const currentLevel = window.gameState.helperDamageUpgradeLevel || 0;
        const prices = CFG.upgradePrices.helperDamage || { base: 250, multiplier: 1.45 };
        const cost = Math.floor(prices.base * Math.pow(prices.multiplier, currentLevel));

        if (this._purchase(cost)) {
            window.gameState.helperDamageUpgradeLevel = currentLevel + 1;
            // Бонус к урону Bobo (+25% за уровень)
            window.gameState.helperDamageBonus = currentLevel * 0.25;
            this._onUpgradeSuccess('helperSound');
        } else {
            this._onUpgradeFail();
        }
    },

    /**
     * Внутренние триггеры при успешной/неудачной покупке.
     */
    _onUpgradeSuccess: function(soundId) {
        if (CORE && typeof CORE.playSound === 'function') CORE.playSound(soundId);
        if (UI) {
            UI.updateHUD();
            UI.updateUpgradeButtons();
        }
        if (window.shopSystem?.updateShopDisplay) window.shopSystem.updateShopDisplay();
        if (typeof window.saveGame === 'function') window.saveGame();
    },

    _onUpgradeFail: function() {
        if (CORE && typeof CORE.playSound === 'function') CORE.playSound('errorSound');
        if (window.showTooltip && window.translations && window.currentLanguage) {
            window.showTooltip(window.translations[window.currentLanguage]['tooltips.insufficientCoins'] || 'Недостаточно кристаллов!');
            setTimeout(window.hideTooltip, 2000);
        }
    },

    /* ==========================================================================
       2. ЕДИНЫЙ ТАЙМЛАЙН АВТОМАТИЗАЦИИ (БЕЗ setInterval)
       ========================================================================== */

    /**
     * Запуск контролируемого цикла атаки и перемещения Bobo.
     * Заменяет разрозненные интервалы на предсказуемый менеджер потока.
     */
    startHelperTimeline: function() {
        if (!CORE) return;
        
        // Полностью очищаем старые потоки, исключая дублирование при перезапусках
        if (CORE.helperInterval) clearInterval(CORE.helperInterval);

        // Рассчитываем скорость атаки: базовая 1.5 сек, уменьшается с уровнем апгрейда
        const attackSpeed = Math.max(400, 1500 - (window.gameState.helperUpgradeLevel * 50));

        let ticksToMove = 0;

        CORE.helperInterval = setInterval(() => {
            if (!window.gameState?.gameActive || CORE.isGamePaused || !window.gameState.helperActive) return;

            // Атака астероида
            if (typeof CORE.helperAttack === 'function') {
                CORE.helperAttack();
            }

            // Рандомное перемещение Bobo каждые 3 цикла атаки (чтобы не прыгал слишком хаотично)
            ticksToMove++;
            if (ticksToMove >= 3) {
                if (typeof CORE.moveHelperToRandomPosition === 'function') {
                    CORE.moveHelperToRandomPosition();
                }
                ticksToMove = 0;
            }
        }, attackSpeed);
    },

    /* ==========================================================================
       3. СИСТЕМА ШТРАФОВ (ИГРОВОЙ ВЫЗОВ)
       ========================================================================== */

    /**
     * Снятие монет/уровня при упущенном блоке (астероид улетел).
     */
    applyUpgradePenalty: function() {
        if (!window.gameState || !CFG || !UI) return;
        if (CORE && CORE.isGamePaused) return;

        // Рассчитываем штраф на основе текущей локации
        const currentPlanet = window.gameState.currentLocation || 'mercury';
        const basePenalty = 15 * (1 + (CFG.astronomicalUnits[currentPlanet] * 2));
        const penalty = Math.floor(basePenalty * CFG.balanceConfig.penaltyMultiplier);

        // Списываем монеты вплоть до 0 (в минус уводить нельзя)
        window.gameState.coins = Math.max(0, window.gameState.coins - penalty);
        
        if (CORE && typeof CORE.playSound === 'function') CORE.playSound('penaltySound');
        
        // Текстовое уведомление о штрафе на экране
        this.spawnPenaltyOverlay(`-${penalty}`);
        
        UI.updateHUD();
        UI.updateUpgradeButtons();
    },

    spawnPenaltyOverlay: function(text) {
        const el = document.createElement('div');
        el.className = 'penalty-indicator';
        el.style.cssText = 'position:fixed;top:15%;left:50%;transform:translateX(-50%);color:#ff4444;font-size:2em;font-weight:bold;z-index:100;text-shadow:0 0 8px rgba(0,0,0,0.8);animation:fadeOutUp 1s forwards;pointer-events:none;';
        el.textContent = text;
        document.body.appendChild(el);
        setTimeout(() => el.parentNode?.removeChild(el), 1000);
    },

    /* ==========================================================================
       4. ВЫСОКОПРОИЗВОДИТЕЛЬНЫЕ ЭФФЕКТЫ (CANVAS PARTICLES)
       ========================================================================== */

    /**
     * Создание взрыва астероида. Генерирует массив частиц и запускает цикл на Core Canvas.
     * @param {HTMLElement} block - Уничтоженный DOM-элемент блока
     */
    createExplosion: function(block) {
        if (!CORE) return;
        
        // Инициализируем или подтягиваем Canvas из Ядра
        if (!CORE.effectsCanvas) {
            CORE.effectsCanvas = document.createElement('canvas');
            CORE.effectsCanvas.id = 'gameEffectsCanvas';
            CORE.effectsCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100dvh;z-index:13;pointer-events:none;';
            document.body.appendChild(CORE.effectsCanvas);
            CORE.effectsCtx = CORE.effectsCanvas.getContext('2d');
        }

        const canvas = CORE.effectsCanvas;
        const ctx = CORE.effectsCtx;

        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        const rect = block.getBoundingClientRect();
        const originX = rect.left + rect.width / 2;
        const originY = rect.top + rect.height / 2;

        // Извлекаем цвета блока для аутентичного взрыва
        const blockColor = block.style.backgroundColor || '#ffffff';

        // Генерируем 15-20 частиц под этот конкретный взрыв
        const particleCount = window.innerWidth < 768 ? 12 : 20;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 2;
            
            this.activeParticles.push({
                x: originX,
                y: originY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1, // Легкий импульс вверх
                radius: Math.random() * 3 + 2,
                color: blockColor,
                alpha: 1,
                decay: Math.random() * 0.03 + 0.015
            });
        }

        // Запускаем единый цикл рендеринга частиц, если он еще не запущен
        if (!this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame(() => this._renderParticles());
        }
    },

    /**
     * Внутренний цикл анимации частиц (Engine Render Loop)
     */
    _renderParticles: function() {
        const canvas = CORE.effectsCanvas;
        const ctx = CORE.effectsCtx;

        if (!canvas || !ctx || this.activeParticles.length === 0) {
            if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.animationFrameId = null;
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Мутируем и отрисовываем частицы с конца массива (безопасное удаление)
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];
            
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05; // Гравитация космической пыли
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                this.activeParticles.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 6;
            ctx.shadowColor = p.color;
            ctx.fill();
            ctx.restore();
        }

        // Продолжаем цикл, пока есть живые частицы
        if (this.activeParticles.length > 0) {
            this.animationFrameId = requestAnimationFrame(() => this._renderParticles());
        } else {
            this.animationFrameId = null;
        }
    }
};

})();
