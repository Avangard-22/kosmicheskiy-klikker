// js/game-features.js
(function() {
'use strict';

const CFG = window.GAME_CONFIG;
const UI = window.GAME_UI;

const getCore = () => window.GAME_CORE;

window.GAME_FEATURES = {

    // ==========================================
    // 💥 ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
    // ==========================================
    
    createExplosion: function(block) {
        if (!block) return;
        
        const rect = block.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
       const sz = CFG.isMobile ? 150 : 200;

        const ex = document.createElement('div');
        ex.className = 'explosion';
        ex.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:${sz}px;height:${sz}px;pointer-events:none;z-index:15;`;
        document.body.appendChild(ex);

        const cnt = sz === 150 ? 20 : 25;
        const colors = CFG.locations[window.gameState?.currentLocation || 'mercury']?.blockColors || ['#fff'];

        for (let i = 0; i < cnt; i++) {
            const p = document.createElement('div');
            p.className = 'explosion-particle';
            const pSize = sz === 150 ? 10 : 12;
            p.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:${pSize}px;height:${pSize}px;`;
            p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            const a = Math.random() * Math.PI * 2;
            const d = 50 + Math.random() * 100;
            p.style.setProperty('--tx', Math.cos(a) * d + 'px');
            p.style.setProperty('--ty', Math.sin(a) * d + 'px');
            
            document.body.appendChild(p);
            setTimeout(() => p.parentNode?.removeChild(p), 800);
        }
        setTimeout(() => ex.parentNode?.removeChild(ex), 600);
    },

    // ==========================================
    // ⚠️ СИСТЕМА ШТРАФОВ
    // ==========================================
    
    applyUpgradePenalty: function() {
        const core = getCore();
        if (!window.gameState) return;
        
        if (core && core.getBonus && core.getBonus('isInvincible', false)) {
            console.log("🛡️ Неуязвимость активна. Штраф отменён!");
            return;
        }

        const upgrades = [
            { n: 'Сила удара', g: () => window.gameState.clickUpgradeLevel, s: v => { window.gameState.clickUpgradeLevel = v; } },
            { n: 'Шанс крита', g: () => window.gameState.critChanceUpgradeLevel, s: v => { 
                window.gameState.critChanceUpgradeLevel = v; 
                window.gameState.critChance = Math.max(0.001, 0.001 + v * 0.001); 
            }},
            { n: 'Множитель крита', g: () => window.gameState.critMultiplierUpgradeLevel, s: v => { 
                window.gameState.critMultiplierUpgradeLevel = v; 
                window.gameState.critMultiplier = Math.max(2, 2 + v * 0.2); 
            }},
            { n: 'Урон Bobo', g: () => window.gameState.helperUpgradeLevel, s: v => { window.gameState.helperUpgradeLevel = v; } }
        ];

        const u = upgrades[Math.floor(Math.random() * upgrades.length)];
        const pct = CFG.balanceConfig.penaltyMin + Math.random() * (CFG.balanceConfig.penaltyMax - CFG.balanceConfig.penaltyMin);
        const cur = u.g();
        
        if (cur <= 0) return;

        u.s(Math.max(0, Math.floor(cur * (1 - pct))));
        
        if (core && core.calculateClickPower) {
            window.gameState.clickPower = core.calculateClickPower();
        }

        const pan = document.getElementById('penaltyAnnounce');
        if (pan) {
            pan.innerHTML = `<div style="font-size:1.5em;color:#ff6b6b;font-weight:bold;">⚠️ ШТРАФ!</div><div style="font-size:1.1em;color:#fff;margin:10px 0;">${u.n} -${Math.round(pct * 100)}%</div>`;
            pan.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,rgba(255,107,107,0.95),rgba(255,68,68,0.95));color:#fff;padding:30px 40px;border-radius:15px;z-index:2000;text-align:center;font-family:Orbitron,sans-serif;box-shadow:0 10px 40px rgba(255,107,107,0.5);border:3px solid #ff4444;opacity:1;display:block;';
            setTimeout(() => { pan.style.opacity = '0'; setTimeout(() => pan.style.display = 'none', 500); }, 2500);
        }

        if (core && core.playSound) core.playSound('penaltySound');
        if (window.telegramHaptic) window.telegramHaptic.error();
        else if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

        UI.updateHUD();
        UI.updateUpgradeButtons();
        if (typeof window.saveGame === 'function') window.saveGame();
    },

    // ==========================================
    // 🤖 ПОМОЩНИК (BOBO)
    // ==========================================
    
    activateHelper: function() {
        const core = getCore();
        if (!window.gameState || !core) return;

        if (window.gameState.helperActive && core.helperInterval) clearInterval(core.helperInterval);
        if (window.gameState.helperActive && core.helperTimer) clearInterval(core.helperTimer);

        window.gameState.helperActive = true;
        window.gameState.helperTimeLeft = 60000;
        window.gameState.boboCoinBonus = 0.2;

        core.createHelperElement();

        core.helperInterval = setInterval(() => {
            if (window.gameState?.helperActive && core.currentBlock && window.gameState.gameActive && !core.isGamePaused) {
                core.helperAttack();
            }
        }, 1500);

        core.helperTimer = setInterval(() => {
            if (!window.gameState || !window.gameState.helperActive) {
                if (core.helperTimer) clearInterval(core.helperTimer);
                core.helperTimer = null;
                return;
            }

            window.gameState.helperTimeLeft -= 1000;
            
            // ✅ Обновляем UI каждую секунду (для таймера на кнопке)
            UI.updateUpgradeButtons();

            if (window.gameState.helperTimeLeft <= 0) {
                window.gameState.helperActive = false;
                if (core.helperInterval) { clearInterval(core.helperInterval); core.helperInterval = null; }
                if (core.helperTimer) { clearInterval(core.helperTimer); core.helperTimer = null; }
                window.gameState.boboCoinBonus = 0;

                if (core.helperElement) {
                    core.helperElement.style.opacity = '0';
                    setTimeout(() => {
                        if (core.helperElement?.parentNode) document.body.removeChild(core.helperElement);
                        core.helperElement = null;
                    }, 300);
                }

                UI.updateUpgradeButtons();
                UI.updateHUD();
                
                if (window.showTooltip && window.translations) {
                    window.showTooltip(window.translations[window.currentLanguage].tooltips.helperEnd);
                    setTimeout(window.hideTooltip, 1500);
                }
            }
        }, 1000);

        UI.updateUpgradeButtons();
        UI.updateHUD();

        if (window.showTooltip && window.translations) {
            window.showTooltip(window.translations[window.currentLanguage].tooltips.helperAvailable);
            setTimeout(window.hideTooltip, 2500);
        }

        if (typeof window.saveGame === 'function') window.saveGame();
    },

    // ==========================================
    // 🛒 ПОКУПКА УЛУЧШЕНИЙ
    // ==========================================
    
    buyClickPower: function() {
        const core = getCore();
        if (!window.gameState || !core) return;

        if (window.gameState.clickUpgradeLevel === undefined) window.gameState.clickUpgradeLevel = 0;

        const cost = Math.floor(CFG.costs.baseClickUpgradeCost * Math.pow(1.5, window.gameState.clickUpgradeLevel));

        if (window.gameState.coins >= cost) {
            window.gameState.coins -= cost;
            window.gameState.clickUpgradeLevel++;
            window.gameState.clickPower = core.calculateClickPower();
           
            if (window.achievementsSystem) window.achievementsSystem.incrementUpgrades(1);

            UI.updateHUD();
            UI.updateUpgradeButtons();
            if (core.playSound) core.playSound('upgradeSound');

            const btn = document.getElementById('upgradeClickBtn');
            if (btn) {
                btn.style.transform = 'scale(1.1)';
                btn.style.boxShadow = '0 0 20px #4CAF50';
                setTimeout(() => { btn.style.transform = 'scale(1)'; btn.style.boxShadow = ''; }, 300);
            }

            if (window.showTooltip && window.formatString && window.translations) {
                window.showTooltip(window.formatString(window.translations[window.currentLanguage].tooltips.clickPowerUpgrade, { power: Math.round(window.gameState.clickPower) }));
                setTimeout(window.hideTooltip, 1500);
            }
            if (typeof window.saveGame === 'function') window.saveGame();
        }
    },

    buyHelper: function() {
        const core = getCore();
        if (!window.gameState || !core) return;

        // ✅ Проверка: если Bobo активен — не даём купить повторно
        if (window.gameState.helperActive) {
            if (window.showTooltip && window.translations) {
                window.showTooltip(window.translations[window.currentLanguage].tooltips.helperAlreadyActive || 'Bobo уже активен!');
                setTimeout(window.hideTooltip, 1500);
            }
            return;
        }

        const baseCost = Math.floor(CFG.costs.baseHelperUpgradeCost * Math.pow(1.4, window.gameState.helperUpgradeLevel || 0));
        const actBonus = Math.floor((window.gameState.helperActivations || 0) / 10);
        const cost = Math.floor(baseCost * (1 + actBonus * 0.2));

        if (window.gameState.coins >= cost) {
            window.gameState.coins -= cost;
            window.gameState.helperActivations = (window.gameState.helperActivations || 0) + 1;
            
            if (window.achievementsSystem) window.achievementsSystem.incrementHelpers(1);

            const btn = document.getElementById('upgradeHelperBtn');
            if (btn) {
                btn.style.transform = 'scale(1.1)';
                btn.style.boxShadow = '0 0 20px #4CAF50';
                setTimeout(() => { btn.style.transform = 'scale(1)'; btn.style.boxShadow = ''; }, 300);
            }

            this.activateHelper();
            UI.updateHUD();
            UI.updateUpgradeButtons();
            if (typeof window.saveGame === 'function') window.saveGame();
        }
    },

    buyCritChance: function() {
        const core = getCore();
        if (!window.gameState || !core) return;

        if (window.gameState.critChanceUpgradeLevel === undefined) window.gameState.critChanceUpgradeLevel = 0;
        const cost = Math.floor(CFG.costs.baseCritChanceCost * Math.pow(1.3, window.gameState.critChanceUpgradeLevel));

        if (window.gameState.coins >= cost) {
            window.gameState.coins -= cost;
            window.gameState.critChance = Math.min(1.0, window.gameState.critChance + 0.001);
            window.gameState.critChanceUpgradeLevel++;
            
            window.gameMetrics.upgradesBought = (window.gameMetrics.upgradesBought || 0) + 1;
            if (window.achievementsSystem) window.achievementsSystem.incrementUpgrades(1);

            UI.updateHUD();
            UI.updateUpgradeButtons();
            if (core.playSound) core.playSound('upgradeSound');

            const btn = document.getElementById('upgradeCritChanceBtn');
            if (btn) {
                btn.style.transform = 'scale(1.1)';
                btn.style.boxShadow = '0 0 20px #FFD700';
                setTimeout(() => { btn.style.transform = 'scale(1)'; btn.style.boxShadow = ''; }, 300);
            }

            if (window.showTooltip && window.formatString && window.translations) {
                window.showTooltip(window.formatString(window.translations[window.currentLanguage].tooltips.critChanceUpgrade, { chance: (window.gameState.critChance * 100).toFixed(1) }));
                setTimeout(window.hideTooltip, 1500);
            }
            if (typeof window.saveGame === 'function') window.saveGame();
        }
    },

    buyCritMultiplier: function() {
        const core = getCore();
        if (!window.gameState || !core) return;

        if (window.gameState.critMultiplierUpgradeLevel === undefined) window.gameState.critMultiplierUpgradeLevel = 0;
        const cost = Math.floor(CFG.costs.baseCritMultiplierCost * Math.pow(1.25, window.gameState.critMultiplierUpgradeLevel));

        if (window.gameState.coins >= cost) {
            window.gameState.coins -= cost;
            window.gameState.critMultiplier += 0.2;
            window.gameState.critMultiplierUpgradeLevel++;
            
            if (window.achievementsSystem) window.achievementsSystem.incrementUpgrades(1);

            UI.updateHUD();
            UI.updateUpgradeButtons();
            if (core.playSound) core.playSound('upgradeSound');

            const btn = document.getElementById('upgradeCritMultBtn');
            if (btn) {
                btn.style.transform = 'scale(1.1)';
                btn.style.boxShadow = '0 0 20px #FFD700';
                setTimeout(() => { btn.style.transform = 'scale(1)'; btn.style.boxShadow = ''; }, 300);
            }

            if (window.showTooltip && window.formatString && window.translations) {
                window.showTooltip(window.formatString(window.translations[window.currentLanguage].tooltips.critMultUpgrade, { mult: window.gameState.critMultiplier.toFixed(1) }));
                setTimeout(window.hideTooltip, 1500);
            }
            if (typeof window.saveGame === 'function') window.saveGame();
        }
    },

    buyHelperDamage: function() {
        const core = getCore();
        if (!window.gameState || !core) return;

        if (window.gameState.helperUpgradeLevel === undefined) window.gameState.helperUpgradeLevel = 0;
        const cost = Math.floor(CFG.costs.baseHelperDmgCost * Math.pow(1.8, window.gameState.helperUpgradeLevel));

        if (window.gameState.coins >= cost) {
            window.gameState.coins -= cost;
            window.gameState.helperUpgradeLevel++;
            
            window.gameMetrics.upgradesBought = (window.gameMetrics.upgradesBought || 0) + 1;
            if (window.achievementsSystem) window.achievementsSystem.incrementUpgrades(1);

            UI.updateHUD();
            UI.updateUpgradeButtons();
            if (core.playSound) core.playSound('upgradeSound');

            const btn = document.getElementById('upgradeHelperDmgBtn');
            if (btn) {
                btn.style.transform = 'scale(1.1)';
                btn.style.boxShadow = '0 0 20px #4CAF50';
                setTimeout(() => { btn.style.transform = 'scale(1)'; btn.style.boxShadow = ''; }, 300);
            }

            if (window.showTooltip && window.formatString && window.translations) {
                window.showTooltip(window.formatString(window.translations[window.currentLanguage].tooltips.helperDmgUpgrade, { level: window.gameState.helperUpgradeLevel }));
                setTimeout(window.hideTooltip, 1500);
            }
            if (typeof window.saveGame === 'function') window.saveGame();
        }
    }
};

})();
