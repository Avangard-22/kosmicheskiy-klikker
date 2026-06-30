// js/combat-system.js
(function() {
    'use strict';
    
    const CFG = window.GAME_CONFIG;

    window.CombatSystem = {
        /**
         * Рассчитывает урон по блоку (чистая математика)
         * @param {number} baseDamage - Базовый урон (clickPower)
         * @returns {{ finalDamage: number, isCrit: boolean }}
         */
        calculateHit: function(baseDamage) {
            if (!window.gameState) return { finalDamage: 0, isCrit: false };

            const getBonus = window.GAME_CORE?.getBonus || ((t, f) => f);
            
            let damage = baseDamage * getBonus('getDamageMultiplier', 1);
            let isCrit = false;

            let critChance = window.gameState.critChance * getBonus('getCritChanceMultiplier', 1);
            let critMult = window.gameState.critMultiplier * getBonus('getCritMultMultiplier', 1);
            
            // Ограничиваем шанс крита 100%
            critChance = Math.min(1.0, critChance);

            if (Math.random() < critChance) {
                damage = Math.round(damage * critMult);
                isCrit = true;
            } else {
                damage = Math.round(damage);
            }

            return { finalDamage: damage, isCrit: isCrit };
        },

        /**
         * Обрабатывает удар по блоку
         * Обновляет gameState/gameMetrics, но НЕ трогает DOM
         * @param {HTMLElement} block - DOM-элемент блока (для передачи в UI позже)
         * @param {number} baseDamage - Базовый урон
         * @returns {{ destroyed: boolean, damage: number, isCrit: boolean, block: HTMLElement }}
         */
        hit: function(block, baseDamage) {
    if (!window.gameState || !window.gameState.gameActive || window.GAME_CORE?.isGamePaused) {
        return { destroyed: false, damage: 0, isCrit: false, block: block };
    }

    // ✅ ИСПРАВЛЕНО: Вибрация, звук и анимация — ответственность game-core.js
    // CombatSystem занимается ТОЛЬКО математикой боя
    // (визуальный и тактильный отклик делегируется в game-core)

    // Расчёт урона (чистая математика)
    const result = this.calculateHit(baseDamage);

    // Обновляем метрики
    if (result.isCrit) {
        window.gameMetrics.totalCrits = (window.gameMetrics.totalCrits || 0) + 1;
    }
    window.gameMetrics.totalClicks = (window.gameMetrics.totalClicks || 0) + 1;

    // Применяем урон к состоянию
    if (window.GAME_CORE) {
        window.GAME_CORE.currentBlockHealth -= result.finalDamage;
    }
    window.gameState.totalDamageDealt += result.finalDamage;

    // Проверяем разрушение
    const destroyed = window.GAME_CORE?.currentBlockHealth <= 0;

    return { 
        destroyed: destroyed, 
        damage: result.finalDamage, 
        isCrit: result.isCrit,
        block: block
    };
},

        /**
         * Рассчитывает награду за разрушение блока
         * @param {HTMLElement} block - DOM-элемент блока
         * @returns {{ reward: number, comboCount: number, comboBonus: number, isRare: boolean }}
         */
        calculateDestroyReward: function(block) {
            if (!window.gameState) return { reward: 0, comboCount: 0, comboBonus: 0, isRare: false };

            const getBonus = window.GAME_CORE?.getBonus || ((t, f) => f);
            const now = Date.now();
            const win = /Android|webOS|iPhone/i.test(navigator.userAgent) ? 1500 : 2000;

            // Комбо
            window.gameState.comboCount = (now - (window.gameState.lastDestroyTime || 0) < win)
                ? (window.gameState.comboCount || 0) + 1
                : 1;
            window.gameState.lastDestroyTime = now;

            // Базовая награда
            const au = CFG.astronomicalUnits[window.gameState.currentLocation] || 0;
            let reward = Math.floor((25 + au * 100) * CFG.balanceConfig.rewardMultiplier);

            // Рандомный множитель
            const range = CFG.balanceConfig.randomBonusRange;
            reward = Math.floor(reward * (range.min + Math.random() * (range.max - range.min)));

            // Бонус Bobo
            if (window.gameState.boboCoinBonus > 0) {
                reward = Math.floor(reward * (1 + window.gameState.boboCoinBonus));
            }

            // Множитель из магазина
            reward = Math.floor(reward * getBonus('getRewardMultiplier', 1));

            // Редкие блоки
            let isRare = false;
            for (const k in CFG.rareBlocks) {
                if (block?.classList.contains(CFG.rareBlocks[k].className)) {
                    reward = Math.floor(reward * CFG.rareBlocks[k].multiplier);
                    isRare = true;
                    break;
                }
            }

            // Комбо-бонус
            let comboBonus = 0;
            if (window.gameState.comboCount > 1) {
                const comboMult = CFG.balanceConfig.comboMultiplier * getBonus('getComboMultiplier', 1);
                comboBonus = Math.floor(reward * (window.gameState.comboCount * comboMult));
                reward += comboBonus;
            }

            return {
                reward: reward,
                comboCount: window.gameState.comboCount,
                comboBonus: comboBonus,
                isRare: isRare
            };
        },

        /**
         * Обрабатывает полное разрушение блока
         * Обновляет состояние, но визуализацию делегирует в core/ui
         * @param {HTMLElement} block - DOM-элемент блока
         * @returns {{ reward: number, comboCount: number, comboBonus: number, isRare: boolean }}
         */
        destroy: function(block) {
            if (!window.gameState) return null;

            const result = this.calculateDestroyReward(block);

            // Начисляем кристаллы
            window.gameState.coins += result.reward;
            window.gameMetrics.blocksDestroyed = (window.gameMetrics.blocksDestroyed || 0) + 1;
            window.gameMetrics.totalCoinsEarned = (window.gameMetrics.totalCoinsEarned || 0) + result.reward;

            // Обновляем maxCombo
            if (result.comboCount > (window.gameMetrics.maxCombo || 0)) {
                window.gameMetrics.maxCombo = result.comboCount;
            }

            // Сбрасываем состояние текущего блока в core
            if (window.GAME_CORE) {
                window.GAME_CORE.currentBlock = null;
                window.GAME_CORE.currentBlockHealth = 0;
            }

            return result;
        }
    };

    console.log('⚔️ CombatSystem initialized');
})();
