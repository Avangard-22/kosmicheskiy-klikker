// Система магазина с временными бонусами
(function() {
'use strict';
// 🔹 Конфигурация магазина (15 бонусов)
const shopConfig = {
    timeWarp: { id: 'timeWarp', name: 'timeWarp', icon: 'fas fa-hourglass-half', baseCost: 250, duration: 30000, effect: 'Замедляет блоки на 50%', description: 'Блоки падают медленнее, давая больше времени на клики.', label: '⏳ Замедление', multiplier: 0.5, type: 'speed' },
    timeWarpPro: { id: 'timeWarpPro', name: 'timeWarpPro', icon: 'fas fa-hourglass-end', baseCost: 500, duration: 45000, effect: 'Замедляет блоки на 70%', description: 'Максимальное замедление. Блоки почти замирают в воздухе.', label: '⏱️ Замедление ++', multiplier: 0.3, type: 'speed' },
    speedBoost: { id: 'speedBoost', name: 'speedBoost', icon: 'fas fa-tachometer-alt', baseCost: 400, duration: 20000, effect: 'Ускоряет блоки на 100%', description: 'Для профи: блоки летят быстрее, но дают больше урона для прогресса.', label: '🏎️ Ускорение', multiplier: 2.0, type: 'speed' },
    crystalBoost: { id: 'crystalBoost', name: 'crystalBoost', icon: 'fas fa-gem', baseCost: 400, duration: 60000, effect: '+50% к кристаллам', description: 'Увеличивает награду за каждый разрушенный блок.', label: '💎 +50% кристаллов', multiplier: 1.5, type: 'reward' },
    crystalBoostPro: { id: 'crystalBoostPro', name: 'crystalBoostPro', icon: 'fas fa-gem', baseCost: 800, duration: 90000, effect: '+100% к кристаллам', description: 'Двойная добыча. Идеально для быстрого фарма валюты.', label: '💎 +100% кристаллов', multiplier: 2.0, type: 'reward' },
    luckyStrike: { id: 'luckyStrike', name: 'luckyStrike', icon: 'fas fa-dice', baseCost: 600, duration: 45000, effect: 'Удваивает шанс редких блоков', description: 'Золотые, радужные и загадочные блоки будут появляться чаще.', label: '🍀 Удача x2', multiplier: 2.0, type: 'luck' },
    powerSurge: { id: 'powerSurge', name: 'powerSurge', icon: 'fas fa-bolt', baseCost: 300, duration: 45000, effect: '+50% к силе удара', description: 'Ваши клики наносят значительно больше урона.', label: '⚡ Сила +50%', multiplier: 1.5, type: 'damage' },
    powerSurgePro: { id: 'powerSurgePro', name: 'powerSurgePro', icon: 'fas fa-bolt', baseCost: 600, duration: 60000, effect: '+100% к силе удара', description: 'Мощнейший заряд. Урон от кликов удваивается.', label: '⚡ Сила +100%', multiplier: 2.0, type: 'damage' },
    critChanceBoost: { id: 'critChanceBoost', name: 'critChanceBoost', icon: 'fas fa-star', baseCost: 700, duration: 30000, effect: 'Удваивает шанс крита', description: 'Критические удары будут срабатывать вдвое чаще.', label: '🎯 Шанс крита x2', multiplier: 2.0, type: 'critChance' },
    critMultBoost: { id: 'critMultBoost', name: 'critMultBoost', icon: 'fas fa-chart-line', baseCost: 900, duration: 30000, effect: '+50% к множителю крита', description: 'Каждый критический удар станет намного разрушительнее.', label: '💥 Крит x1.5', multiplier: 1.5, type: 'critMult' },
    comboExt: { id: 'comboExt', name: 'comboExt', icon: 'fas fa-link', baseCost: 500, duration: 60000, effect: 'Удваивает время комбо', description: 'Комбо-серия не сбрасывается так быстро, позволяя копить множитель.', label: '🔗 Комбо x2', multiplier: 2.0, type: 'combo' },
    blockWeaken: { id: 'blockWeaken', name: 'blockWeaken', icon: 'fas fa-user-injured', baseCost: 800, duration: 40000, effect: '-25% здоровья блоков', description: 'Блоки становятся хрупкими и быстрее разрушаются.', label: '🛡️ Блоки -25%', multiplier: 0.75, type: 'blockHealth' },
    coinMagnet: { id: 'coinMagnet', name: 'coinMagnet', icon: 'fas fa-magnet', baseCost: 1000, duration: 50000, effect: 'Автоматически собирает кристаллы', description: 'Дополнительный магнитный приток кристаллов к вашему балансу.', label: '🧲 Магнит', multiplier: 5, type: 'magnet' },
    autoClicker: { id: 'autoClicker', name: 'autoClicker', icon: 'fas fa-hands-helping', baseCost: 1200, duration: 30000, effect: 'Авто-урон 25% от силы клика', description: 'Автоматически наносит урон блокам каждую секунду.', label: '🤖 Авто-клик', multiplier: 0.25, type: 'autoClick' },
    invincible: { id: 'invincible', name: 'invincible', icon: 'fas fa-shield-alt', baseCost: 1500, duration: 15000, effect: 'Невосприимчивость к штрафам', description: 'Пропуск блока за экран не отнимет уровни ваших улучшений.', label: '🛡️ Без штрафов', multiplier: 1.0, type: 'invincible' }
};

// 🔹 Состояние магазина
let shopPanelVisible = false;
let updateInterval = null;
let activeBoosts = new Map(); // Ключ: id, Значение: { config, startTime, duration }

// 🔹 Инициализация
function init() {
    if (!window.gameState) {
        setTimeout(init, 200);
        return;
    }
    buildShopUI();
    attachShopEvents();
    restoreSavedBoosts();
    updateShopDisplay();
    startBoostLoop();
    console.log('✅ Shop System initialized');
}

// 🔹 Создание/восстановление UI магазина
function buildShopUI() {
    const panel = document.getElementById('shopPanel');
    if (!panel) return;
    panel.innerHTML = `<h3 data-tk="shop.title">🛒 Магазин</h3>`;
    Object.values(shopConfig).forEach(item => {
        const el = document.createElement('div');
        el.id = `shop-${item.id}`;
        el.className = 'shop-item';
        // Добавляем полное описание в тултип при наведении
        el.title = `${item.effect}\n${item.description || ''}`;
        
        el.innerHTML = `
            <i class="${item.icon}"></i>
            <div class="shop-item-info">
                <div class="shop-item-name">${item.label}</div>
                <div class="shop-cost">${item.baseCost}</div>
            </div>
        `;
        panel.appendChild(el);
    });
}

// 🔹 Привязка событий
function attachShopEvents() {
    const btn = document.getElementById('shopBtn');
    const panel = document.getElementById('shopPanel');
    if (!btn || !panel) return;
    btn.addEventListener('click', toggleShop);
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); toggleShop(); }, { passive: false });

    document.addEventListener('click', (e) => {
        if (shopPanelVisible && !panel.contains(e.target) && !btn.contains(e.target)) closeShop();
    });

    Object.keys(shopConfig).forEach(id => {
        const el = document.getElementById(`shop-${id}`);
        if (el) {
            el.addEventListener('click', () => purchaseItem(id));
            el.addEventListener('touchstart', (e) => { e.preventDefault(); purchaseItem(id); }, { passive: false });
        }
    });
}

// 🔹 Управление видимостью и паузой
function toggleShop() {
    if (shopPanelVisible) closeShop();
    else openShop();
}
function openShop() {
    const panel = document.getElementById('shopPanel');
    if (!panel) return;
    panel.style.display = 'flex';
    // ✅ Добавлен скролл
    panel.style.maxHeight = '65vh';
    panel.style.overflowY = 'auto';
    panel.style.scrollbarWidth = 'thin';
    panel.style.scrollbarColor = '#4CAF50 #222';
    
    shopPanelVisible = true;
    updateShopDisplay();
    // 🛑 Пауза игры и фона
    if (window.planetBackground) window.planetBackground.pause();
    if (window.gameFunctions && window.gameFunctions.pauseGame) window.gameFunctions.pauseGame();

    // Скрываем другие панели
    if (window.achievementsSystem && window.achievementsSystem.hideAchievementsPanel) window.achievementsSystem.hideAchievementsPanel();
}
function closeShop() {
    const panel = document.getElementById('shopPanel');
    if (!panel) return;
    panel.style.display = 'none';
    shopPanelVisible = false;
    // ▶️ Возобновление
    if (window.planetBackground) window.planetBackground.resume();
    if (window.gameFunctions && window.gameFunctions.resumeGame) window.gameFunctions.resumeGame();
}

// 🔹 Покупка предмета
function purchaseItem(itemId) {
    const item = shopConfig[itemId];
    if (!item || !window.gameState) return;
    if (!window.gameState.shopItems) window.gameState.shopItems = {};
    if (!window.gameState.shopItems[itemId]) window.gameState.shopItems[itemId] = { purchased: false, active: false, timeLeft: 0 };

    // Проверки
    if (window.gameState.shopItems[itemId].active) return showToast(`Бонус "${item.label}" уже активен!`, 'warning');
    if (window.gameState.coins < item.baseCost) return showToast(`Недостаточно кристаллов! Нужно: ${item.baseCost}`, 'error');

    // Списание и активация
    window.gameState.coins -= item.baseCost;
    const startTime = Date.now();
    activeBoosts.set(itemId, { config: item, startTime, duration: item.duration });
    window.gameState.shopItems[itemId] = { purchased: true, active: true, timeLeft: item.duration };

    // UI и фидбек
    showToast(`Бонус "${item.label}" активирован на ${Math.floor(item.duration/1000)}с!`, 'success');
    triggerHaptic('success');
    if (window.updateHUD) window.updateHUD();
    if (window.updateUpgradeButtons) window.updateUpgradeButtons();
    updateShopDisplay();
    if (window.saveGame) window.saveGame();
    console.log(`✅ Shop: Purchased ${itemId}`);
}

// 🔹 Цикл обновления бустов (каждые 500мс)
function startBoostLoop() {
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(updateBoosts, 500);
}
function updateBoosts() {
    if (!window.gameState?.shopItems) return;
    let updated = false;
    activeBoosts.forEach((data, id) => {
        const elapsed = Date.now() - data.startTime;
        const timeLeft = data.duration - elapsed;

        if (timeLeft <= 0) {
            // Истечение
            activeBoosts.delete(id);
            window.gameState.shopItems[id] = { purchased: true, active: false, timeLeft: 0 };
            showToast(`Бонус "${shopConfig[id]?.label}" закончился!`, 'warning');
            triggerHaptic('warning');
            updated = true;
        } else {
            // Обновление таймера в gameState (для автосохранения)
            window.gameState.shopItems[id].timeLeft = timeLeft;
        }
    });

    if (updated) {
        updateShopDisplay();
        if (window.updateHUD) window.updateHUD();
        if (window.updateUpgradeButtons) window.updateUpgradeButtons();
        if (window.saveGame) window.saveGame();
    }
    updateActiveBoostsUI();
}

// 🔹 Восстановление бустов из сохранения
function restoreSavedBoosts() {
    if (!window.gameState?.shopItems) return;
    Object.keys(window.gameState.shopItems).forEach(id => {
        const saved = window.gameState.shopItems[id];
        if (saved.active && saved.timeLeft > 0 && shopConfig[id]) {
            const duration = shopConfig[id].duration;
            const elapsed = duration - saved.timeLeft;
            activeBoosts.set(id, {
                config: shopConfig[id],
                startTime: Date.now() - elapsed,
                duration: duration
            });
        }
    });
}

// 🔹 Обновление UI магазина
function updateShopDisplay() {
    if (!window.gameState?.shopItems) return;
    Object.keys(shopConfig).forEach(id => {
        const el = document.getElementById(`shop-${id}`);
        if (!el) return;
        const item = shopConfig[id];
        const state = window.gameState.shopItems[id] || { active: false, timeLeft: 0 };
        const costEl = el.querySelector('.shop-cost');
        if (state.active && activeBoosts.has(id)) {
            const timeLeft = Math.ceil(activeBoosts.get(id).duration - (Date.now() - activeBoosts.get(id).startTime));
            costEl.textContent = `${timeLeft}с`;
            costEl.style.color = '#4CAF50';
            el.classList.add('active');
            el.classList.remove('disabled');
        } else {
            costEl.textContent = item.baseCost;
            costEl.style.color = window.gameState.coins < item.baseCost ? '#f44336' : '#FFD54F';
            el.classList.remove('active');
            el.classList.toggle('disabled', window.gameState.coins < item.baseCost);
        }
    });
}

// 🔹 UI активных бустов (в HUD)
function updateActiveBoostsUI() {
    const container = document.getElementById('activeBoosts');
    if (!container) return;
    const boosts = [];
    activeBoosts.forEach((data, id) => {
        const timeLeft = Math.ceil((data.duration - (Date.now() - data.startTime)) / 1000);
        if (timeLeft > 0) {
            boosts.push(`
                <div class="boost-badge" style="display:flex;align-items:center;gap:5px;padding:5px 10px;background:rgba(76,175,80,0.3);border-radius:15px;border:1px solid #4CAF50;color:#fff;font-size:0.8em;margin-right:5px;">
                    <i class="${data.config.icon}"></i> <span>${timeLeft}с</span>
                </div>`);
        }
    });
    container.innerHTML = boosts.join('');
    container.style.display = boosts.length ? 'flex' : 'none';
}

// 🔹 Единый расчёт множителей
function getMultiplier(type) {
    let mult = 1.0;
    activeBoosts.forEach((data) => {
        if (data.config.type === type) {
            const elapsed = Date.now() - data.startTime;
            if (elapsed < data.duration) mult *= data.config.multiplier;
        }
    });
    return mult;
}

// 🔹 Вспомогательные функции
function showToast(text, type) {
    const msg = document.createElement('div');
    msg.style.cssText = `position:fixed;top:20%;left:50%;transform:translateX(-50%);background:${type==='success'?'#4CAF50':type==='error'?'#f44336':'#FF9800'};color:#fff;padding:10px 20px;border-radius:8px;z-index:9999;font-family:Orbitron;font-weight:bold;box-shadow:0 5px 15px rgba(0,0,0,0.5);opacity:0;transition:opacity 0.3s;`;
    msg.textContent = text;
    document.body.appendChild(msg);
    requestAnimationFrame(() => { msg.style.opacity = '1'; setTimeout(() => { msg.style.opacity = '0'; setTimeout(() => msg.remove(), 300); }, 2000); });
}
function triggerHaptic(type) {
    if (window.telegramHaptic && window.telegramHaptic[type]) window.telegramHaptic[type]();
    else if (navigator.vibrate) navigator.vibrate(type === 'success' ? [50, 50, 50] : [100, 50, 100]);
}

// 🔹 Экспорт API (ИСПРАВЛЕНО: добавлены все необходимые методы)
window.shopSystem = {
    init,
    toggleShop,
    openShop,
    closeShop,
    updateShopDisplay,
    purchaseItem,
    // ✅ Экспортируем конкретные методы, которые ожидает game-logic.js
    getSpeedMultiplier: () => getMultiplier('speed'),
    getRewardMultiplier: () => getMultiplier('reward'),
    getDamageMultiplier: () => getMultiplier('damage'),
    getCritChanceMultiplier: () => getMultiplier('critChance'),
    getCritMultMultiplier: () => getMultiplier('critMult'),
    getComboMultiplier: () => getMultiplier('combo'),
    getBlockHealthMultiplier: () => getMultiplier('blockHealth'),
    getLuckMultiplier: () => getMultiplier('luck'),
    getAutoClickMultiplier: () => getMultiplier('autoClick'),
    // Для бонусов-флагов (invincible, magnet) используем проверку наличия в Map
    isInvincible: () => activeBoosts.has('invincible'),
    hasMagnet: () => activeBoosts.has('coinMagnet'),
    config: shopConfig
};

// Запуск
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
else setTimeout(init, 300);
})();