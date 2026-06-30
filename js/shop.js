// js/shop.js (v2.0) — КАРТОЧНЫЙ UI как в Достижениях
(function() {
'use strict';
const CFG = window.GAME_CONFIG;

// === КОНФИГУРАЦИЯ МАГАЗИНА ===
const shopConfig = {
    timeWarp: {
        id: 'timeWarp',
        name: 'Искажение времени',
        desc: 'Блоки движутся на 50% медленнее',
        cost: 500,
        duration: 30000,
        icon: 'fas fa-hourglass-half',
        emoji: '⏳'
    },
    crystalBoost: {
        id: 'crystalBoost',
        name: 'Усилитель кристаллов',
        desc: '+100% к наградам за блоки',
        cost: 800,
        duration: 60000,
        icon: 'fas fa-gem',
        emoji: '💰'
    },
    powerSurge: {
        id: 'powerSurge',
        name: 'Скачок силы',
        desc: '+200% к силе клика',
        cost: 1000,
        duration: 45000,
        icon: 'fas fa-bolt',
        emoji: '⚡'
    },
    luckyCharm: {
        id: 'luckyCharm',
        name: 'Талисман удачи',
        desc: '+50% шанс редких блоков',
        cost: 1200,
        duration: 60000,
        icon: 'fas fa-clover',
        emoji: '🍀'
    },
    invincible: {
        id: 'invincible',
        name: 'Неуязвимость',
        desc: 'Защита от штрафов за пропуск блока',
        cost: 1500,
        duration: 45000,
        icon: 'fas fa-shield-alt',
        emoji: '🛡️'
    },
    autoClicker: {
        id: 'autoClicker',
        name: 'Авто-кликер',
        desc: 'Автоматический клик каждые 0.5 сек',
        cost: 2000,
        duration: 30000,
        icon: 'fas fa-robot',
        emoji: ''
    }
};

// Активные бусты
let activeBoosts = {};
let boostTimers = {};
let shopPanelVisible = false;
const _lastPurchase = {};

// === ИНИЦИАЛИЗАЦИЯ ===
function init() {
    createShopUI();
    loadActiveBoosts();
    startBoostTimers();
    console.log('🛒 Shop System v2.0 initialized (card UI)');
}

// === СОЗДАНИЕ UI — КАРТОЧНАЯ СЕТКА ===
function createShopUI() {
    const btn = document.getElementById('shopBtn');
    const panel = document.getElementById('shopPanel');
    if (!btn || !panel) return;

    btn.addEventListener('click', toggleShop);
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        toggleShop();
    }, { passive: false });

    // ✅ НОВЫЙ КАРТОЧНЫЙ UI — идентично достижениям
    panel.innerHTML = `
        <div class="shop-header">
            <h3 class="shop-title"> Магазин бонусов</h3>
            <button class="shop-close-btn" id="shopCloseBtn" aria-label="Закрыть">×</button>
        </div>
        <div class="shop-balance">💎 Баланс: <span id="shopBalanceValue">0</span></div>
        <div class="shop-grid" id="shopGrid"></div>
    `;

    const grid = panel.querySelector('#shopGrid');
    Object.values(shopConfig).forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'shop-card';
        card.id = `shop-card-${item.id}`;
        card.dataset.id = item.id;
        card.style.setProperty('--idx', idx);

        card.innerHTML = `
            <div class="shop-card-icon">
                <i class="${item.icon}"></i>
                <div class="shop-card-emoji">${item.emoji}</div>
            </div>
            <div class="shop-card-name">${item.name}</div>
            <div class="shop-card-desc">${item.desc}</div>
            <div class="shop-card-cost">${item.cost} </div>
            <div class="shop-card-timer" hidden></div>
        `;

        card.addEventListener('click', () => purchaseItem(item.id));
        card.addEventListener('touchstart', (e) => {
            e.preventDefault();
            purchaseItem(item.id);
        }, { passive: false });

        grid.appendChild(card);
    });

    document.getElementById('shopCloseBtn').addEventListener('click', closeShop);
    document.getElementById('shopCloseBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        closeShop();
    }, { passive: false });

    document.addEventListener('click', (e) => {
        if (shopPanelVisible &&
            !panel.contains(e.target) &&
            !btn.contains(e.target)) {
            closeShop();
        }
    });
}

// === УПРАВЛЕНИЕ МАГАЗИНОМ ===
function toggleShop() {
    if (shopPanelVisible) closeShop();
    else openShop();
}

function openShop() {
    const panel = document.getElementById('shopPanel');
    if (!panel) return;

    panel.style.display = 'flex';
    shopPanelVisible = true;
    updateShopDisplay();

    if (window.GAME_CORE && window.GAME_CORE.pauseGame) {
        window.GAME_CORE.pauseGame();
    }

    if (window.achievementsSystem && window.achievementsSystem.hideAchievementsPanel) {
        window.achievementsSystem.hideAchievementsPanel();
    }
}

function closeShop() {
    const panel = document.getElementById('shopPanel');
    if (!panel) return;

    panel.style.display = 'none';
    shopPanelVisible = false;

    if (window.GAME_CORE && window.GAME_CORE.resumeGame) {
        window.GAME_CORE.resumeGame();
    }
}

// === ПОКУПКА ===
function purchaseItem(boostId) {
    const item = shopConfig[boostId];
    if (!item || !window.gameState) return;

    // Защита от дабл-тапа
    const now = Date.now();
    if (_lastPurchase[boostId] && (now - _lastPurchase[boostId]) < 400) return;
    _lastPurchase[boostId] = now;

    if (activeBoosts[boostId] && activeBoosts[boostId].active) {
        showNotification('⚠️ Бонус уже активен!', '#ff9800');
        return;
    }

    if (window.gameState.coins < item.cost) {
        showNotification('❌ Недостаточно кристаллов!', '#f44336');
        // ✅ Анимация тряски карточки
        const errCard = document.getElementById(`shop-card-${boostId}`);
        if (errCard) {
            errCard.classList.add('shake');
            setTimeout(() => errCard.classList.remove('shake'), 500);
        }
        return;
    }

    window.gameState.coins -= item.cost;

    if (!window.gameState.shopItems) window.gameState.shopItems = {};
    window.gameState.shopItems[boostId] = {
        purchased: true,
        active: true,
        timeLeft: item.duration
    };

    activeBoosts[boostId] = { active: true, timeLeft: item.duration };

    startBoostTimer(boostId);

     if (window.achievementsSystem) {
        window.achievementsSystem.incrementBoosters(1);
    }

    if (window.EventBus) {
        window.EventBus.emit('shop:itemPurchased', { id: boostId, item: item });
    }

    if (boostId === 'autoClicker') {
        startAutoClicker();
    }

    updateShopDisplay();
    updateActiveBoostsHUD();
    if (window.GAME_UI) {
        window.GAME_UI.updateHUD();
        window.GAME_UI.updateUpgradeButtons();
    }

    if (window.GAME_CORE && window.GAME_CORE.playSound) {
        window.GAME_CORE.playSound('upgradeSound');
    }
    if (window.telegramHaptic) window.telegramHaptic.success();
    else if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    showNotification(`✅ ${item.name} активирован!`, '#4CAF50');

    // ✅ Анимация успешной покупки
    const succCard = document.getElementById(`shop-card-${boostId}`);
    if (succCard) {
        succCard.classList.add('bought');
        setTimeout(() => succCard.classList.remove('bought'), 800);
    }

    if (typeof window.saveGame === 'function') window.saveGame();
}

// === ТАЙМЕРЫ БУСТОВ ===
function startBoostTimers() {
    if (!window.gameState || !window.gameState.shopItems) return;

    Object.entries(window.gameState.shopItems).forEach(([id, data]) => {
        if (data && data.active && data.timeLeft > 0) {
            activeBoosts[id] = { active: true, timeLeft: data.timeLeft };
            startBoostTimer(id);
        }
    });

    updateActiveBoostsHUD();
}

function startBoostTimer(boostId) {
    if (boostTimers[boostId]) clearInterval(boostTimers[boostId]);

    boostTimers[boostId] = setInterval(() => {
        if (!activeBoosts[boostId] || !activeBoosts[boostId].active) {
            clearInterval(boostTimers[boostId]);
            delete boostTimers[boostId];
            return;
        }

        activeBoosts[boostId].timeLeft -= 1000;

        if (window.gameState?.shopItems?.[boostId]) {
            window.gameState.shopItems[boostId].timeLeft = activeBoosts[boostId].timeLeft;
        }

        if (activeBoosts[boostId].timeLeft <= 0) {
            deactivateBoost(boostId);
        }

        updateActiveBoostsHUD();
        updateShopDisplay();
    }, 1000);
}

function deactivateBoost(boostId) {
    if (boostTimers[boostId]) {
        clearInterval(boostTimers[boostId]);
        delete boostTimers[boostId];
    }

    activeBoosts[boostId] = { active: false, timeLeft: 0 };

    if (window.gameState?.shopItems?.[boostId]) {
        window.gameState.shopItems[boostId].active = false;
        window.gameState.shopItems[boostId].timeLeft = 0;
    }

    if (boostId === 'autoClicker') {
        stopAutoClicker();
    }

    if (window.EventBus) {
        window.EventBus.emit('shop:itemExpired', { id: boostId });
    }

    updateShopDisplay();
    updateActiveBoostsHUD();

    const item = shopConfig[boostId];
    if (item) {
        showNotification(`⏰ ${item.name} завершился`, '#ff9800');
    }

    if (typeof window.saveGame === 'function') window.saveGame();
}

// === АВТО-КЛИКЕР ===
let autoClickInterval = null;

function startAutoClicker() {
    stopAutoClicker();
    autoClickInterval = setInterval(() => {
        if (window.GAME_CORE && window.GAME_CORE.currentBlock &&
            window.gameState?.gameActive &&
            !window.GAME_CORE.isGamePaused) {
            window.GAME_CORE.hitBlock(window.GAME_CORE.currentBlock,
                                      window.gameState.clickPower, true);
        }
    }, 500);
}

function stopAutoClicker() {
    if (autoClickInterval) {
        clearInterval(autoClickInterval);
        autoClickInterval = null;
    }
}

// === ЗАГРУЗКА АКТИВНЫХ БУСТОВ ===
function loadActiveBoosts() {
    if (!window.gameState || !window.gameState.shopItems) return;

    Object.entries(window.gameState.shopItems).forEach(([id, data]) => {
        if (data && data.active && data.timeLeft > 0) {
            activeBoosts[id] = { active: true, timeLeft: data.timeLeft };

            if (id === 'autoClicker') {
                startAutoClicker();
            }
        }
    });
}

// === ОБНОВЛЕНИЕ UI КАРТОЧЕК ===
function formatTime(s) {
    if (s >= 60) return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
    return `${s}с`;
}

function updateShopDisplay() {
    Object.values(shopConfig).forEach(item => {
        const card = document.getElementById(`shop-card-${item.id}`);
        if (!card) return;

        const isActive = activeBoosts[item.id] && activeBoosts[item.id].active;
        const canAfford = window.gameState && window.gameState.coins >= item.cost;

        card.classList.remove('active', 'disabled');

        const costEl = card.querySelector('.shop-card-cost');
        const timerEl = card.querySelector('.shop-card-timer');

        if (isActive) {
            card.classList.add('active');
            const total = activeBoosts[item.id].timeLeft || 0;
            const pct = Math.max(0, Math.min(100, (total / item.duration) * 100));
            const secs = Math.ceil(total / 1000);

            if (costEl) costEl.textContent = 'Активно';
            if (timerEl) {
                timerEl.hidden = false;
                timerEl.innerHTML = `<span class="shop-card-timer-bar"><span style="width:${pct}%"></span></span>${formatTime(secs)}`;
            }
        } else if (!canAfford) {
            card.classList.add('disabled');
            if (costEl) costEl.textContent = `${item.cost} 💎`;
            if (timerEl) timerEl.hidden = true;
        } else {
            if (costEl) costEl.textContent = `${item.cost} 💎`;
            if (timerEl) timerEl.hidden = true;
        }
    });

    // Баланс в шапке
    const bal = document.getElementById('shopBalanceValue');
    if (bal) bal.textContent = Math.floor(window.gameState?.coins || 0).toLocaleString();
}

// === HUD АКТИВНЫХ БУСТОВ ===
function updateActiveBoostsHUD() {
    const container = document.getElementById('activeBoosts');
    if (!container) return;

    const activeList = Object.entries(activeBoosts)
        .filter(([_, data]) => data.active && data.timeLeft > 0);

    if (activeList.length === 0) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    container.style.display = 'flex';
    container.innerHTML = '';

    activeList.forEach(([id, data]) => {
        const item = shopConfig[id];
        if (!item) return;

        const secs = Math.ceil(data.timeLeft / 1000);
        const badge = document.createElement('div');
        badge.style.cssText = `
            background: rgba(0,0,0,0.7);
            border: 1px solid #4CAF50;
            border-radius: 8px;
            padding: 4px 8px;
            font-size: 0.7em;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 4px;
            backdrop-filter: blur(4px);
        `;
        badge.innerHTML = `<i class="${item.icon}" style="color:#4CAF50;"></i> ${secs}с`;
        container.appendChild(badge);
    });
}

// === УВЕДОМЛЕНИЯ ===
function showNotification(text, color) {
    const notif = document.createElement('div');
    notif.textContent = text;
    notif.style.cssText = `
        position: fixed;
        top: 15%;
        left: 50%;
        transform: translateX(-50%);
        background: ${color || '#4CAF50'};
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-family: 'Orbitron', sans-serif;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        pointer-events: none;
    `;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.transition = 'opacity 0.5s';
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 500);
    }, 2000);
}

})();

// === ПУБЛИЧНЫЙ API ===
window.shopSystem = {
    init: init,
    toggleShop: toggleShop,
    openShop: openShop,
    closeShop: closeShop,
    updateShopDisplay: updateShopDisplay,
    purchaseItem: purchaseItem,
    stopAutoClicker: stopAutoClicker,
    config: shopConfig,

    getSpeedMultiplier: () => (activeBoosts.timeWarp?.active) ? 0.5 : 1,
    getRewardMultiplier: () => (activeBoosts.crystalBoost?.active) ? 2 : 1,
    getDamageMultiplier: () => (activeBoosts.powerSurge?.active) ? 3 : 1,
    getCritChanceMultiplier: () => 1,
    getCritMultMultiplier: () => 1,
    getComboMultiplier: () => 1,
    getBlockHealthMultiplier: () => 1,
    getLuckMultiplier: () => (activeBoosts.luckyCharm?.active) ? 1.5 : 1,
    getAutoClickMultiplier: () => (activeBoosts.autoClicker?.active) ? 2 : 1,
    isInvincible: () => !!(activeBoosts.invincible?.active),
    hasMagnet: () => false,
    hasAutoClick: () => !!(activeBoosts.autoClicker?.active)
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 400));
} else {
    setTimeout(init, 400);
}
})();
