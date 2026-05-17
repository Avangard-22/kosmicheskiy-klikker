// js/shop.js
(function() {
'use strict';

// 🔹 Конфигурация бонусов
const shopConfig = {
    timeWarp: { id: 'timeWarp', name: 'Замедление времени', icon: 'fas fa-hourglass-half', baseCost: 250, duration: 30000, effect: 'Блоки движутся на 50% медленнее', desc: 'Дает больше времени на реакцию.', type: 'speed', multiplier: 0.5 },
    timeWarpPro: { id: 'timeWarpPro', name: 'Замедление ++', icon: 'fas fa-hourglass-end', baseCost: 500, duration: 45000, effect: 'Блоки движутся на 70% медленнее', desc: 'Максимальное замедление.', type: 'speed', multiplier: 0.3 },
    crystalBoost: { id: 'crystalBoost', name: 'Усилитель кристаллов', icon: 'fas fa-gem', baseCost: 400, duration: 60000, effect: '+50% к награде', desc: 'Двойной профит с блоков.', type: 'reward', multiplier: 1.5 },
    crystalBoostPro: { id: 'crystalBoostPro', name: 'Усилитель ++', icon: 'fas fa-gem', baseCost: 800, duration: 90000, effect: '+100% к награде', desc: 'Утраивает добычу.', type: 'reward', multiplier: 2.0 },
    powerSurge: { id: 'powerSurge', name: 'Сила удара', icon: 'fas fa-bolt', baseCost: 300, duration: 45000, effect: '+50% к урону', desc: 'Мощные клики.', type: 'damage', multiplier: 1.5 },
    powerSurgePro: { id: 'powerSurgePro', name: 'Сила удара ++', icon: 'fas fa-bolt', baseCost: 600, duration: 60000, effect: '+100% к урону', desc: 'Урон х2.', type: 'damage', multiplier: 2.0 },
    luckyStrike: { id: 'luckyStrike', name: 'Удача', icon: 'fas fa-dice', baseCost: 600, duration: 45000, effect: 'x2 шанс редких блоков', desc: 'Золотые блоки чаще.', type: 'luck', multiplier: 2.0 },
    critChanceBoost: { id: 'critChanceBoost', name: 'Шанс крита', icon: 'fas fa-star', baseCost: 700, duration: 30000, effect: 'x2 шанс крита', desc: 'Криты бьют чаще.', type: 'critChance', multiplier: 2.0 },
    critMultBoost: { id: 'critMultBoost', name: 'Множитель крита', icon: 'fas fa-chart-line', baseCost: 900, duration: 30000, effect: '+50% множ. крита', desc: 'Криты бьют больнее.', type: 'critMult', multiplier: 1.5 },
    comboExt: { id: 'comboExt', name: 'Мастер комбо', icon: 'fas fa-link', baseCost: 500, duration: 60000, effect: 'Комбо не сбрасывается', desc: 'Удваивает время комбо.', type: 'combo', multiplier: 2.0 },
    blockWeaken: { id: 'blockWeaken', name: 'Ослабление', icon: 'fas fa-user-injured', baseCost: 800, duration: 40000, effect: '-25% здоровья блоков', desc: 'Блоки лопаются быстрее.', type: 'blockHealth', multiplier: 0.75 },
    invincible: { id: 'invincible', name: 'Неуязвимость', icon: 'fas fa-shield-alt', baseCost: 1500, duration: 15000, effect: 'Нет штрафов', desc: 'Пропуск блока безопасен.', type: 'invincible', multiplier: 1.0 },
    coinMagnet: { id: 'coinMagnet', name: 'Магнит', icon: 'fas fa-magnet', baseCost: 1000, duration: 50000, effect: 'Авто-сбор +5/сек', desc: 'Пассивный доход.', type: 'magnet', multiplier: 5 },
    autoClicker: { id: 'autoClicker', name: 'Авто-кликер', icon: 'fas fa-hands-helping', baseCost: 1200, duration: 30000, effect: 'Авто-урон 25%', desc: 'Стреляет сам.', type: 'autoClick', multiplier: 0.25 }
};

let isShopOpen = false;
let updateInterval = null;
let activeBoosts = new Map(); // Хранит активные бусты: { config, startTime, duration }

// 🔹 Инициализация
function init() {
    if (!window.gameState) { setTimeout(init, 200); return; }
    buildShopUI();
    attachEvents();
    restoreSavedBoosts();
    startUpdateLoop();
    console.log('✅ Shop System (Modal) Initialized');
}

// 🔹 Создание UI Модального окна
function buildShopUI() {
    // Создаем HTML структуру модалки
    const modalHtml = `
        <div id="shopModal" class="shop-modal">
            <div class="shop-modal-content">
                <div class="shop-modal-header">
                    <div class="shop-modal-title">🛒 Магазин Бонусов</div>
                    <button id="shopCloseBtn" class="shop-close-btn">✕</button>
                </div>
                <div id="shopItemsContainer"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const container = document.getElementById('shopItemsContainer');
    
    // Генерируем строки для каждого бонуса
    Object.values(shopConfig).forEach(item => {
        const row = document.createElement('div');
        row.className = 'shop-item-row';
        row.id = `shop-row-${item.id}`;
        row.innerHTML = `
            <div class="shop-item-icon"><i class="${item.icon}"></i></div>
            <div class="shop-item-info">
                <span class="shop-item-name">${item.name}</span>
                <span class="shop-item-desc">${item.desc}</span>
            </div>
            <div class="shop-item-cost" id="cost-${item.id}">${item.baseCost}💎</div>
        `;
        container.appendChild(row);
    });
}

// 🔹 Привязка событий
function attachEvents() {
    // Кнопка в HUD (предполагаем, что она уже есть в HTML, как в прошлом шаге)
    const shopBtn = document.getElementById('shopBtn');
    const modal = document.getElementById('shopModal');
    const closeBtn = document.getElementById('shopCloseBtn');

    if (shopBtn && modal) {
        shopBtn.addEventListener('click', toggleShop);
        shopBtn.addEventListener('touchstart', (e) => { e.preventDefault(); toggleShop(); }, { passive: false });
        
        // Закрытие по кнопке крестика
        if (closeBtn) {
            closeBtn.addEventListener('click', closeShop);
        }

        // Закрытие по клику на затемненный фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeShop();
        });
    }

    // Обработка кликов по строкам товаров
    const container = document.getElementById('shopItemsContainer');
    if (container) {
        container.addEventListener('click', (e) => {
            const row = e.target.closest('.shop-item-row');
            if (row) {
                const id = row.id.replace('shop-row-', '');
                purchaseItem(id);
            }
        });
    }
}

// 🔹 Логика Открытия/Закрытия
function toggleShop() {
    isShopOpen ? closeShop() : openShop();
}

function openShop() {
    const modal = document.getElementById('shopModal');
    if (!modal) return;
    
    modal.classList.add('visible');
    isShopOpen = true;
    updateShopDisplay(); // Обновить цены при открытии
    
    // Пауза игры
    if (window.planetBackground) window.planetBackground.pause();
    if (window.gameFunctions?.pauseGame) window.gameFunctions.pauseGame();
    
    // Скрыть достижения если открыты
    if (window.achievementsSystem?.hideAchievementsPanel) window.achievementsSystem.hideAchievementsPanel();
}

function closeShop() {
    const modal = document.getElementById('shopModal');
    if (!modal) return;
    
    modal.classList.remove('visible');
    isShopOpen = false;
    
    // Возобновление игры
    if (window.planetBackground) window.planetBackground.resume();
    if (window.gameFunctions?.resumeGame) window.gameFunctions.resumeGame();
}

// 🔹 Покупка предмета
function purchaseItem(itemId) {
    const item = shopConfig[itemId];
    if (!item || !window.gameState) return;
    
    // Инициализация структуры если нет
    if (!window.gameState.shopItems) window.gameState.shopItems = {};
    if (!window.gameState.shopItems[itemId]) window.gameState.shopItems[itemId] = { active: false, timeLeft: 0 };

    // Проверка: активен ли уже
    if (window.gameState.shopItems[itemId].active) {
        showToast(`"${item.name}" уже работает!`, 'warning');
        return;
    }

    // Проверка: хватает ли денег
    if (window.gameState.coins < item.baseCost) {
        showToast(`Нужно ${item.baseCost} 💎`, 'error');
        // Визуальный эффект ошибки (тряска)
        const row = document.getElementById(`shop-row-${itemId}`);
        if (row) {
            row.style.animation = 'shake 0.3s';
            setTimeout(() => row.style.animation = '', 300);
        }
        return;
    }

    // Списание
    window.gameState.coins -= item.baseCost;
    
    // Активация
    const startTime = Date.now();
    activeBoosts.set(itemId, { config: item, startTime, duration: item.duration });
    window.gameState.shopItems[itemId] = { active: true, timeLeft: item.duration }; // timeLeft для сохранения

    showToast(`✅ ${item.name} активирован!`, 'success');
    updateShopDisplay();
    if (window.updateHUD) window.updateHUD();
    if (window.saveGame) window.saveGame();
    
    // Вибрация
    if (window.telegramHaptic) window.telegramHaptic.success();
}

// 🔹 Цикл обновления таймеров
function startUpdateLoop() {
    if (updateInterval) clearInterval(updateInterval);
    // Обновляем таймеры 5 раз в секунду для плавности
    updateInterval = setInterval(updateBoosts, 200);
}

function updateBoosts() {
    if (!window.gameState?.shopItems) return;
    const now = Date.now();
    let changed = false;

    activeBoosts.forEach((data, id) => {
        const elapsed = now - data.startTime;
        const timeLeft = data.duration - elapsed;

        if (timeLeft <= 0) {
            // Бонус истек
            activeBoosts.delete(id);
            if (window.gameState.shopItems[id]) {
                window.gameState.shopItems[id].active = false;
                window.gameState.shopItems[id].timeLeft = 0;
            }
            showToast(`⏳ ${data.config.name} закончился`, 'warning');
            changed = true;
        } else {
            // Обновляем timeLeft для сохранения
            if (window.gameState.shopItems[id]) {
                window.gameState.shopItems[id].timeLeft = timeLeft;
            }
        }
    });

    // Если что-то изменилось (закончилось), обновляем интерфейс полностью
    if (changed) {
        updateShopDisplay();
        if (window.updateHUD) window.updateHUD();
        if (window.saveGame) window.saveGame();
    } else {
        // Иначе обновляем только текст таймеров (чтобы цифры бежали)
        updateTimerDisplays();
    }
}

// 🔹 Восстановление после перезагрузки
function restoreSavedBoosts() {
    if (!window.gameState?.shopItems) return;
    const now = Date.now();
    Object.entries(window.gameState.shopItems).forEach(([id, state]) => {
        if (state.active && state.timeLeft > 0 && shopConfig[id]) {
            const elapsed = shopConfig[id].duration - state.timeLeft;
            activeBoosts.set(id, { config: shopConfig[id], startTime: now - elapsed, duration: shopConfig[id].duration });
        }
    });
}

// 🔹 Обновление интерфейса магазина
function updateShopDisplay() {
    if (!window.gameState?.shopItems) return;

    Object.keys(shopConfig).forEach(id => {
        const row = document.getElementById(`shop-row-${id}`);
        const costEl = document.getElementById(`cost-${id}`);
        if (!row || !costEl) return;

        const item = shopConfig[id];
        const state = window.gameState.shopItems[id] || { active: false };
        const isActive = activeBoosts.has(id);

        if (isActive) {
            // Если активно - показываем таймер
            const data = activeBoosts.get(id);
            const timeLeftSec = Math.ceil((data.duration - (Date.now() - data.startTime)) / 1000);
            
            costEl.textContent = `${timeLeftSec}с`;
            costEl.style.color = '#4CAF50';
            row.classList.add('active');
            row.classList.remove('disabled');
        } else {
            // Если не активно - показываем цену
            costEl.textContent = `${item.baseCost}💎`;
            costEl.style.color = window.gameState.coins < item.baseCost ? '#ff4444' : '#FFD700';
            row.classList.remove('active');
            row.classList.toggle('disabled', window.gameState.coins < item.baseCost);
        }
    });
}

// 🔹 Обновление ТОЛЬКО цифр таймеров (оптимизация)
function updateTimerDisplays() {
    if (!window.gameState?.shopItems) return;
    const now = Date.now();

    Object.keys(shopConfig).forEach(id => {
        if (activeBoosts.has(id)) {
            const data = activeBoosts.get(id);
            const timeLeftSec = Math.ceil((data.duration - (now - data.startTime)) / 1000);
            const costEl = document.getElementById(`cost-${id}`);
            if (costEl) costEl.textContent = `${timeLeftSec}с`;
        }
    });
}

// 🔹 Уведомления
function showToast(text, type) {
    // Простой toast
    const msg = document.createElement('div');
    msg.textContent = text;
    msg.style.cssText = `
        position: fixed; top: 15%; left: 50%; transform: translateX(-50%);
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#FF9800'};
        color: white; padding: 12px 24px; border-radius: 8px; z-index: 4000;
        font-weight: bold; box-shadow: 0 5px 15px rgba(0,0,0,0.5); opacity: 0; transition: opacity 0.3s;
        font-family: 'Orbitron', sans-serif;
    `;
    document.body.appendChild(msg);
    requestAnimationFrame(() => msg.style.opacity = '1');
    setTimeout(() => {
        msg.style.opacity = '0';
        setTimeout(() => msg.remove(), 300);
    }, 2000);
}

// 🔹 Экспорт API для game-logic.js
window.shopSystem = {
    init,
    getSpeedMultiplier: () => {
        let m = 1; activeBoosts.forEach(d => { if(d.config.type==='speed' && Date.now()-d.startTime<d.duration) m*=d.config.multiplier; }); return m;
    },
    getRewardMultiplier: () => {
        let m = 1; activeBoosts.forEach(d => { if(d.config.type==='reward' && Date.now()-d.startTime<d.duration) m*=d.config.multiplier; }); return m;
    },
    getDamageMultiplier: () => {
        let m = 1; activeBoosts.forEach(d => { if(d.config.type==='damage' && Date.now()-d.startTime<d.duration) m*=d.config.multiplier; }); return m;
    },
    getCritChanceMultiplier: () => {
        let m = 1; activeBoosts.forEach(d => { if(d.config.type==='critChance' && Date.now()-d.startTime<d.duration) m*=d.config.multiplier; }); return m;
    },
    getCritMultMultiplier: () => {
        let m = 1; activeBoosts.forEach(d => { if(d.config.type==='critMult' && Date.now()-d.startTime<d.duration) m*=d.config.multiplier; }); return m;
    },
    getComboMultiplier: () => {
        let m = 1; activeBoosts.forEach(d => { if(d.config.type==='combo' && Date.now()-d.startTime<d.duration) m*=d.config.multiplier; }); return m;
    },
    getBlockHealthMultiplier: () => {
        let m = 1; activeBoosts.forEach(d => { if(d.config.type==='blockHealth' && Date.now()-d.startTime<d.duration) m*=d.config.multiplier; }); return m;
    },
    getLuckMultiplier: () => {
        let m = 1; activeBoosts.forEach(d => { if(d.config.type==='luck' && Date.now()-d.startTime<d.duration) m*=d.config.multiplier; }); return m;
    },
    getAutoClickMultiplier: () => {
        let m = 1; activeBoosts.forEach(d => { if(d.config.type==='autoClick' && Date.now()-d.startTime<d.duration) m*=d.config.multiplier; }); return m;
    },
    getMagnetValue: () => {
        let v = 0; activeBoosts.forEach(d => { if(d.config.type==='magnet' && Date.now()-d.startTime<d.duration) v+=d.config.multiplier; }); return v;
    },
    isInvincible: () => {
        let r = false; activeBoosts.forEach(d => { if(d.config.type==='invincible' && Date.now()-d.startTime<d.duration) r=true; }); return r;
    },
    hasAutoClick: () => {
        let r = false; activeBoosts.forEach(d => { if(d.config.type==='autoClick' && Date.now()-d.startTime<d.duration) r=true; }); return r;
    },
    hasMagnet: () => {
        let r = false; activeBoosts.forEach(d => { if(d.config.type==='magnet' && Date.now()-d.startTime<d.duration) r=true; }); return r;
    },
    config: shopConfig
};

// Запуск
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
else setTimeout(init, 300);

})();