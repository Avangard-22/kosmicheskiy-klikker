// js/game-ui.js
(function() {
'use strict';

const CFG = window.GAME_CONFIG;

// ✅ ИСПРАВЛЕНО: Используем готовую конфигурацию из game-config.js
// PROGRESSION_CONFIG уже содержит targetAU и nextLocation
const LOC_REQ = CFG.PROGRESSION_CONFIG;

// ==========================================
// ✅ НОВОЕ: OBJECT POOLING ДЛЯ ТЕКСТОВЫХ ЭФФЕКТОВ
// Решает проблему утечки памяти и Layout Thrashing
// ==========================================
const TEXT_POOL_SIZE = 30;
const textPool = [];
let textPoolIndex = 0;

/**
 * Инициализация пула текстовых элементов
 */
function initTextPool() {
    if (textPool.length > 0) return;

    for (let i = 0; i < TEXT_POOL_SIZE; i++) {
        const el = document.createElement('div');
        el.style.cssText = `
            position: absolute;
            pointer-events: none;
            z-index: 15;
            opacity: 0;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.9);
            -webkit-text-stroke: 1px #000000;
            transition: none;
            font-family: 'Orbitron', monospace;
        `;
        document.body.appendChild(el);
        textPool.push({
            element: el,
            active: false,
            animationId: null,
            timeoutId: null
        });
    }
    console.log('✅ [UI] Text pool initialized:', TEXT_POOL_SIZE, 'elements');
}

/**
 * Получить свободный элемент из пула
 */
function getTextElement() {
    initTextPool();

    // Ищем неактивный элемент
    for (let i = 0; i < textPool.length; i++) {
        const idx = (textPoolIndex + i) % textPool.length;
        if (!textPool[idx].active) {
            textPoolIndex = (idx + 1) % textPool.length;
            return textPool[idx];
        }
    }

    // Все заняты — используем следующий по кругу и отменяем анимацию
    const item = textPool[textPoolIndex];
    textPoolIndex = (textPoolIndex + 1) % textPool.length;

    if (item.animationId) cancelAnimationFrame(item.animationId);
    if (item.timeoutId) clearTimeout(item.timeoutId);

    return item;
}

/**
 * Освободить элемент обратно в пул
 */
function releaseTextElement(item) {
    if (!item) return;
    item.active = false;
    item.animationId = null;
    item.timeoutId = null;
    item.element.style.opacity = '0';
}

window.GAME_UI = {
    
    // ==========================================
    // HUD И КНОПКИ
    // ==========================================
    
    updateHUD: function() {
        if (!window.gameState) return;
        
        const el = (id) => document.getElementById(id);
        
        const coinsEl = el('coins-value');
        if (coinsEl) coinsEl.textContent = Math.floor(window.gameState.coins).toLocaleString();
        
        const powerEl = el('clickPower-value');
        if (powerEl) powerEl.textContent = Math.round(window.gameState.clickPower);
        
        const critChanceEl = el('critChance-value');
        if (critChanceEl) critChanceEl.textContent = `${(window.gameState.critChance * 100).toFixed(1)}%`;
        
        const critMultEl = el('critMultiplier-value');
        if (critMultEl) critMultEl.textContent = `x${window.gameState.critMultiplier.toFixed(1)}`;
    },

    updateUpgradeButtons: function() {
        if (!window.gameState) return;
        
        const setBtn = (id, cost, title) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            
            const costEl = btn.querySelector('.upgrade-cost');
            if (costEl) costEl.textContent = cost.toLocaleString();
            
            const avail = window.gameState.coins >= cost;
            btn.className = `upgrade-btn ${avail ? 'btn-available' : 'btn-unavailable'}`;
            btn.title = title;
            btn.style.opacity = avail ? '1' : '0.7';
        };
        
        // Сила удара
        setBtn(
            'upgradeClickBtn',
            Math.floor(CFG.costs.baseClickUpgradeCost * Math.pow(1.5, window.gameState.clickUpgradeLevel)),
            'Увеличить силу удара'
        );
        
        // ✅ BOBO (с блокировкой во время активности + таймер)
        const baseHelperCost = Math.floor(CFG.costs.baseHelperUpgradeCost * Math.pow(1.4, window.gameState.helperUpgradeLevel));
        const activationBonus = Math.floor((window.gameState.helperActivations || 0) / 10);
        const helperCost = Math.floor(baseHelperCost * (1 + activationBonus * 0.2));
        
        const helperBtn = document.getElementById('upgradeHelperBtn');
        if (helperBtn) {
            const costEl = helperBtn.querySelector('.upgrade-cost');
            
            // ✅ Если Bobo активен — блокируем кнопку и показываем таймер
            if (window.gameState.helperActive && window.gameState.helperTimeLeft > 0) {
                const seconds = Math.ceil(window.gameState.helperTimeLeft / 1000);
                if (costEl) costEl.textContent = seconds + 'с';
                helperBtn.className = 'upgrade-btn btn-unavailable';
                helperBtn.title = 'Bobo активен: ' + seconds + 'с';
                helperBtn.style.opacity = '0.6';
            } else {
                // Обычная логика: проверяем наличие кристаллов
                const avail = window.gameState.coins >= helperCost;
                if (costEl) costEl.textContent = helperCost.toLocaleString();
                helperBtn.className = 'upgrade-btn ' + (avail ? 'btn-available' : 'btn-unavailable');
                helperBtn.title = 'Активировать Bobo';
                helperBtn.style.opacity = avail ? '1' : '0.7';
            }
        }
        
        // Шанс крита
        setBtn(
            'upgradeCritChanceBtn',
            Math.floor(CFG.costs.baseCritChanceCost * Math.pow(1.3, window.gameState.critChanceUpgradeLevel)),
            'Увеличить шанс крита'
        );
        
        // Множитель крита
        setBtn(
            'upgradeCritMultBtn',
            Math.floor(CFG.costs.baseCritMultiplierCost * Math.pow(1.25, window.gameState.critMultiplierUpgradeLevel)),
            'Увеличить множитель крита'
        );
        
        // Урон Bobo
        setBtn(
            'upgradeHelperDmgBtn',
            Math.floor(CFG.costs.baseHelperDmgCost * Math.pow(1.8, window.gameState.helperUpgradeLevel)),
            'Увеличить урон Bobo'
        );
    },

    // ==========================================
    // ПРОГРЕСС-БАР И ЛОКАЦИИ
    // ==========================================
    
    updateProgressBar: function() {
        if (!window.gameState) return;
        
        const req = LOC_REQ[window.gameState.currentLocation];
        if (!req) return;
        
        const cur = window.gameState.totalDamageDealt / CFG.AU_TO_DAMAGE;
        const pct = Math.min(100, (cur / req.targetAU) * 100);
        
        const bar = document.getElementById('progressBar');
        const txt = document.getElementById('progressText');
        
        if (bar) bar.style.width = pct + '%';
        
        if (txt && window.applyTranslation) {
            window.applyTranslation(txt, 'progressText', {
                current: cur.toFixed(5),
                target: req.targetAU.toFixed(5),
                percent: pct.toFixed(1)
            });
        } else if (txt) {
            txt.textContent = `Прогресс: ${cur.toFixed(5)} / ${req.targetAU.toFixed(5)} а.е. (${pct.toFixed(1)}%)`;
        }
    },

    checkLocationUpgrade: function() {
        if (!window.gameState) return;
        
        const req = LOC_REQ[window.gameState.currentLocation];
        if (!req || !req.nextLocation) return;
        
        const cur = window.gameState.totalDamageDealt / CFG.AU_TO_DAMAGE;
        
        if (cur >= req.targetAU) {
            if (window.GAME_CORE && window.GAME_CORE.setLocation) {
                window.GAME_CORE.setLocation(req.nextLocation);
            }
            
            if (window.showTooltip && window.translations && window.formatString) {
                const tooltipText = window.formatString(
                    window.translations[window.currentLanguage].locationProgress.unlocked,
                    { location: CFG.locations[req.nextLocation].name }
                );
                window.showTooltip(tooltipText);
                setTimeout(window.hideTooltip, 3000);
            }
        }
        
        this.updateProgressBar();
    },

    // ==========================================
    // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
    // ==========================================
    
    createDamageText: function(dmg, block, color) {
    if (!block) return;

    const item = getTextElement();
    const el = item.element;

    // Настройка элемента
    el.className = 'damage-text';
    el.textContent = `-${dmg}`;
    el.style.color = color;
    el.style.fontSize = 'clamp(1em, 4vw, 1.1em)';
    el.style.textAlign = 'center';
    el.style.maxWidth = '100px';

    const r = block.getBoundingClientRect();
    let l = r.left + r.width / 2;
    let tp = r.top;
    if (l < 50) l = 50;
    if (l > window.innerWidth - 50) l = window.innerWidth - 50;
    if (tp < 50) tp = 50;

    el.style.left = l + 'px';
    el.style.top = tp + 'px';
    el.style.opacity = '1';

    item.active = true;

    let opacity = 1;
    let currentY = tp;

    const animate = () => {
        opacity -= 0.02;
        currentY -= 2;

        el.style.opacity = opacity;
        el.style.top = currentY + 'px';

        if (opacity > 0) {
            item.animationId = requestAnimationFrame(animate);
        } else {
            releaseTextElement(item);
        }
    };

    item.animationId = requestAnimationFrame(animate);
},

   showComboText: function(count, bonus, block) {
    if (!block) return;

    const item = getTextElement();
    const el = item.element;

    el.className = 'combo-text';
    el.style.fontSize = 'clamp(1.4em, 5vw, 1.8em)';
    el.style.color = '#FFD700';
    el.style.textAlign = 'center';
    el.style.maxWidth = '150px';

    if (window.formatString && window.translations) {
        el.textContent = window.formatString(
            window.translations[window.currentLanguage].tooltips.combo,
            { count: count, bonus: bonus }
        );
    } else {
        el.textContent = `COMBO x${count}! +${bonus}`;
    }

    const r = block.getBoundingClientRect();
    let l = r.left + r.width / 2;
    let tp = r.top;
    if (l < 75) l = 75;
    if (l > window.innerWidth - 75) l = window.innerWidth - 75;
    if (tp < 50) tp = 50;

    el.style.left = l + 'px';
    el.style.top = tp + 'px';
    el.style.opacity = '1';

    item.active = true;

    item.timeoutId = setTimeout(() => {
        releaseTextElement(item);
    }, 1000);
},

    showRewardText: function(amount, block) {
    if (!block) return;

    const item = getTextElement();
    const el = item.element;

    el.className = 'reward-text';
    el.style.fontSize = 'clamp(1.1em, 4vw, 1.3em)';
    el.style.color = '#FFFFFF';
    el.style.textAlign = 'center';
    el.style.maxWidth = '120px';

    if (window.formatString && window.translations) {
        el.textContent = window.formatString(
            window.translations[window.currentLanguage].tooltips.reward,
            { reward: amount }
        );
    } else {
        el.textContent = `+${amount} 💎`;
    }

    const rct = block.getBoundingClientRect();
    let l = rct.left + rct.width / 2;
    let tp = rct.top + rct.height / 2;
    if (l < 60) l = 60;
    if (l > window.innerWidth - 60) l = window.innerWidth - 60;
    if (tp < 50) tp = 50;

    el.style.left = l + 'px';
    el.style.top = tp + 'px';
    el.style.opacity = '1';

    item.active = true;

    item.timeoutId = setTimeout(() => {
        releaseTextElement(item);
    }, 1500);
},

    updateCracks: function(block, health) {
        if (!block) return;
        
        const ex = block.querySelector('.crack-overlay');
        if (ex) block.removeChild(ex);
        
        const max = parseInt(block.dataset.maxHealth) || 1;
        const rat = 1 - (health / max);
        
        let crackClass = null;
        if (rat > 0.7) crackClass = 'crack-overlay crack-3';
        else if (rat > 0.4) crackClass = 'crack-overlay crack-2';
        else if (rat > 0.1) crackClass = 'crack-overlay crack-1';
        
        if (crackClass) {
            const crack = document.createElement('div');
            crack.className = crackClass;
            block.appendChild(crack);
        }
    },

    announceRareBlock: function(name) {
        const el = document.createElement('div');
        el.className = 'rare-block-announce';
        el.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:1.8em;font-weight:bold;color:gold;z-index:50;text-shadow:0 0 10px black;animation:fadeInOut 2s;pointer-events:none;';
        el.textContent = `🌟 ${name} блок! 🌟`;
        document.body.appendChild(el);
        setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 2000);
    }
};

})();
