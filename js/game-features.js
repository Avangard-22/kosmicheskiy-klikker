 // js/game-features.js (v2.0)
(function() {
'use strict';

const CFG = window.GAME_CONFIG;
const UI = window.GAME_UI;
const getCore = () => window.GAME_CORE;

window.GAME_FEATURES = {
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

    applyUpgradePenalty: function() {
        const core = getCore();
        if (!window.gameState) return;

        if (core && core.getBonus && core.getBonus('isInvincible', false)) {
            console.log('🛡️ Неуязвимость активна. Штраф отменён!');
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

    activateHelper: function() {
        const core = getCore();
        if (!window.gameState || !core) return;

        if (window.gameState.helperActive && core.helperInterval) clearInterval(core.helperInterval);
        if (window.gameState.helperActive && core.helperTimer) clearInterval(core.helperTimer);

        window.gameState.helperActive = true;
        window.gameState.helperTimeLeft = 60000;
        window.gameState.boboCoinBonus = 0.2;

        core.createHelperElement();

        // ✅ Интервал с учётом permanent-бонуса helper_speed
        const interval = window.GAME_CORE?.permanentHelperInterval || 1500;

        core.helperInterval = setInterval(() => {
            if (window.gameState?.helperActive && core.currentBlock &&
                window.gameState.gameActive && !core.isGamePaused) {
                core.helperAttack();
            }
        }, interval);

        core.helperTimer = setInterval(() => {
            if (!window.gameState || !window.gameState.helperActive) {
                if (core.helperTimer) clearInterval(core.helperTimer);
                core.helperTimer = null;
                return;
            }
            window.gameState.helperTimeLeft -= 1000;
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

        // ✅ НОВОЕ: хук PerkSystem (каждый 4-й вызов Bobo даёт бонус)
        if (window.PerkSystem?.onBoboCall) window.PerkSystem.onBoboCall();

        if (typeof window.saveGame === 'function') window.saveGame();
    },

    // ═══════════════════════════════════════════════
    // 💰 ЕДИНЫЙ ИСТОЧНИК ЦЕН (используется и в покупке, и в UI)
    // ═══════════════════════════════════════════════
    getUpgradeCost: function(type) {
        if (!window.gameState) return 0;
        const planet = window.gameState.currentLocation || 'mercury';
        const costMult = CFG.planetCostMultipliers?.[planet] || 1.0;
        const gs = window.gameState;

        switch (type) {
            case 'clickPower':
                return Math.floor(CFG.costs.baseClickUpgradeCost * Math.pow(1.5, gs.clickUpgradeLevel || 0) * costMult);
            case 'helper': {
                const baseCost = Math.floor(CFG.costs.baseHelperUpgradeCost * Math.pow(1.4, gs.helperUpgradeLevel || 0));
                const actBonus = Math.floor((gs.helperActivations || 0) / 10);
                return Math.floor(baseCost * (1 + actBonus * 0.2) * costMult);
            }
            case 'critChance':
                return Math.floor(CFG.costs.baseCritChanceCost * Math.pow(1.3, gs.critChanceUpgradeLevel || 0) * costMult);
            case 'critMultiplier':
                return Math.floor(CFG.costs.baseCritMultiplierCost * Math.pow(1.25, gs.critMultiplierUpgradeLevel || 0) * costMult);
            case 'helperDamage':
                // ⚠️ Рост цены 1.8 → 1.5: цена растёт как урон Bobo (1.5^lvl)
                // Если хочешь старую цену — верни 1.8
                return Math.floor(CFG.costs.baseHelperDmgCost * Math.pow(1.5, gs.helperUpgradeLevel || 0) * costMult);
            default:
                return 0;
        }
    },

    // ═══════════════════════════════════════════════
    // 🎮 ЕДИНАЯ ПОКУПКА (вместо 5 дубликатов)
    // ═══════════════════════════════════════════════
    buyUpgrade: function(type) {
        const core = getCore();
        if (!window.gameState || !core) return;
        const gs = window.gameState;

        // Bobo уже активен — купить нельзя
        if (type === 'helper' && gs.helperActive) {
            if (window.showTooltip && window.translations) {
                window.showTooltip(window.translations[window.currentLanguage].tooltips.helperAlreadyActive || 'Bobo уже активен!');
                setTimeout(window.hideTooltip, 1500);
            }
            return;
        }

        // Достигнут потолок — не даём тратить кристаллы впустую
        if (type === 'critChance' && (gs.critChance || 0) >= (CFG.balanceConfig.critChanceCap || 1)) return;
        if (type === 'critMultiplier' && (gs.critMultiplier || 2) >= (CFG.balanceConfig.critMultiplierCap || 999)) return;

        const cost = this.getUpgradeCost(type);
        if (gs.coins < cost) return;
        gs.coins -= cost;

        const btnMap = {
            clickPower: 'upgradeClickBtn',
            helper: 'upgradeHelperBtn',
            critChance: 'upgradeCritChanceBtn',
            critMultiplier: 'upgradeCritMultBtn',
            helperDamage: 'upgradeHelperDmgBtn'
        };
        const btn = document.getElementById(btnMap[type]);

        switch (type) {
            case 'clickPower':
                gs.clickUpgradeLevel = (gs.clickUpgradeLevel || 0) + 1;
                gs.clickPower = core.calculateClickPower();
                break;
            case 'helper':
                gs.helperActivations = (gs.helperActivations || 0) + 1;
                this.activateHelper(); // сама показывает тултип «Bobo активирован»
                break;
            case 'critChance':
                gs.critChance = Math.min(CFG.balanceConfig.critChanceCap || 1, (gs.critChance || 0.001) + 0.001);
                gs.critChanceUpgradeLevel = (gs.critChanceUpgradeLevel || 0) + 1;
                break;
            case 'critMultiplier':
                gs.critMultiplier = Math.min(CFG.balanceConfig.critMultiplierCap || 999, (gs.critMultiplier || 2) + 0.2);
                gs.critMultiplierUpgradeLevel = (gs.critMultiplierUpgradeLevel || 0) + 1;
                break;
            case 'helperDamage':
                gs.helperUpgradeLevel = (gs.helperUpgradeLevel || 0) + 1;
                break;
        }

        // Метрики: Bobo → incrementHelpers (как в оригинале), остальные → incrementUpgrades
        if (type === 'helper') {
            if (window.achievementsSystem?.incrementHelpers) window.achievementsSystem.incrementHelpers(1);
        } else if (window.achievementsSystem?.incrementUpgrades) {
            window.achievementsSystem.incrementUpgrades(1);
        }

        UI.updateHUD();
        UI.updateUpgradeButtons();
        if (core.playSound) core.playSound('upgradeSound');

        if (btn) {
            const color = (type === 'critChance' || type === 'critMultiplier') ? '#FFD700' : '#4CAF50';
            btn.style.transform = 'scale(1.1)';
            btn.style.boxShadow = `0 0 20px ${color}`;
            setTimeout(() => { btn.style.transform = 'scale(1)'; btn.style.boxShadow = ''; }, 300);
        }

        // Тултипы (helper пропускаем — их показывает activateHelper)
        if (type !== 'helper' && window.showTooltip && window.formatString && window.translations) {
            const t = window.translations[window.currentLanguage].tooltips;
            let tip = null;
            if (type === 'clickPower') tip = window.formatString(t.clickPowerUpgrade, { power: Math.round(gs.clickPower) });
            else if (type === 'critChance') tip = window.formatString(t.critChanceUpgrade, { chance: (gs.critChance * 100).toFixed(1) });
            else if (type === 'critMultiplier') tip = window.formatString(t.critMultUpgrade, { mult: gs.critMultiplier.toFixed(1) });
            else if (type === 'helperDamage') tip = window.formatString(t.helperDmgUpgrade, { level: gs.helperUpgradeLevel });
            if (tip) { window.showTooltip(tip); setTimeout(window.hideTooltip, 1500); }
        }

        if (typeof window.saveGame === 'function') window.saveGame();
    },

    // ⚠️ ТОНКИЕ ОБЁРТКИ — ОБЯЗАТЕЛЬНЫ: их вызывают game-core.js (строки 1097–1101)!
    // Без них игра упадёт с «FEAT.buyClickPower is not a function»
    buyClickPower:    function() { return this.buyUpgrade('clickPower'); },
    buyHelper:        function() { return this.buyUpgrade('helper'); },
    buyCritChance:    function() { return this.buyUpgrade('critChance'); },
    buyCritMultiplier:function() { return this.buyUpgrade('critMultiplier'); },
    buyHelperDamage:  function() { return this.buyUpgrade('helperDamage'); }
};
})();
