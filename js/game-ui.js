// game-ui.js
(function() {
'use strict';
const CFG = window.GAME_CONFIG;
const LOC_REQ = CFG.planetOrder.reduce((acc, planet, index) => {
    acc[planet] = {
        targetAU: CFG.astronomicalUnits[planet],
        nextLocation: CFG.planetOrder[index + 1] || null
    };
    return acc;
}, {});

window.GAME_UI = {
    updateHUD: function() {
        if (!window.gameState) return;
        const el = id => document.getElementById(id);
        if (el('coins-value')) el('coins-value').textContent = Math.floor(window.gameState.coins).toLocaleString();
        if (el('clickPower-value')) el('clickPower-value').textContent = Math.round(window.gameState.clickPower);
        if (el('critChance-value')) el('critChance-value').textContent = `${(window.gameState.critChance * 100).toFixed(1)}%`;
        if (el('critMultiplier-value')) el('critMultiplier-value').textContent = `x${window.gameState.critMultiplier.toFixed(1)}`;
    },

    updateUpgradeButtons: function() {
        if (!window.gameState) return;
        const setBtn = (id, cost, title) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.querySelector('.upgrade-cost').textContent = cost.toLocaleString();
            const avail = window.gameState.coins >= cost;
            btn.className = `upgrade-btn ${avail ? 'btn-available' : 'btn-unavailable'}`;
            btn.title = title;
        };
        
        setBtn('upgradeClickBtn', Math.floor(CFG.costs.baseClickUpgradeCost * Math.pow(1.5, window.gameState.clickUpgradeLevel)), 'Увеличить силу удара');
        
        const baseHelperCost = Math.floor(CFG.costs.baseHelperUpgradeCost * Math.pow(1.4, window.gameState.helperUpgradeLevel));
        const activationBonus = Math.floor((window.gameState.helperActivations || 0) / 10);
        const helperCost = Math.floor(baseHelperCost * (1 + activationBonus * 0.2));
        setBtn('upgradeHelperBtn', helperCost, 'Активировать Bobo');
        
        setBtn('upgradeCritChanceBtn', Math.floor(CFG.costs.baseCritChanceCost * Math.pow(1.3, window.gameState.critChanceUpgradeLevel)), 'Увеличить шанс крита');
        setBtn('upgradeCritMultBtn', Math.floor(CFG.costs.baseCritMultiplierCost * Math.pow(1.25, window.gameState.critMultiplierUpgradeLevel)), 'Увеличить множитель крита');
        setBtn('upgradeHelperDmgBtn', Math.floor(CFG.costs.baseHelperDmgCost * Math.pow(1.8, window.gameState.helperUpgradeLevel)), 'Увеличить урон Bobo');
    },

    updateProgressBar: function() {
        if (!window.gameState) return;
        const req = LOC_REQ[window.gameState.currentLocation];
        const cur = window.gameState.totalDamageDealt / CFG.AU_TO_DAMAGE;
        const pct = Math.min(100, (cur / req.targetAU) * 100);
        const bar = document.getElementById('progressBar');
        const txt = document.getElementById('progressText');
        if (bar) bar.style.width = pct + '%';
        if (txt) window.applyTranslation(txt, 'progressText', { current: cur.toFixed(5), target: req.targetAU.toFixed(5), percent: pct.toFixed(1) });
    },

    checkLocationUpgrade: function() {
        if (!window.gameState) return;
        const req = LOC_REQ[window.gameState.currentLocation];
        const cur = window.gameState.totalDamageDealt / CFG.AU_TO_DAMAGE;
        if (req.nextLocation && cur >= req.targetAU) {
            window.GAME_CORE.setLocation(req.nextLocation);
            const tooltipText = window.formatString(window.translations[window.currentLanguage].locationProgress.unlocked, { location: CFG.locations[req.nextLocation].name });
            if (window.showTooltip) window.showTooltip(tooltipText);
            setTimeout(window.hideTooltip, 3000);
        }
        this.updateProgressBar();
    }
};
})();