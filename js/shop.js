// js/shop.js
(function() {
    'use strict';

    const CFG = window.GAME_CONFIG;

    // === КОНФИГУРАЦИЯ МАГАЗИНА ===
    const shopConfig = {
        timeWarp: {
            id: 'timeWarp',
            name: '⏳ Искажение времени',
            desc: 'Блоки движутся на 50% медленнее',
            cost: 500,
            duration: 30000, // 30 сек
            icon: 'fas fa-hourglass-half'
        },
        crystalBoost: {
            id: 'crystalBoost',
            name: '💰 Усилитель кристаллов',
            desc: '+100% к наградам за блоки',
            cost: 800,
            duration: 60000, // 60 сек
            icon: 'fas fa-gem'
        },
        powerSurge: {
            id: 'powerSurge',
            name: '⚡ Скачок силы',
            desc: '+200% к силе клика',
            cost: 1000,
            duration: 45000, // 45 сек
            icon: 'fas fa-bolt'
        },
        luckyCharm: {
            id: 'luckyCharm',
            name: '🍀 Талисман удачи',
            desc: '+50% шанс редких блоков',
            cost: 1200,
            duration: 60000,
            icon: 'fas fa-clover'
        },
        invincible: {
            id: 'invincible',
            name: '🛡️ Неуязвимость',
            desc: 'Защита от штрафов за пропуск блока',
            cost: 1500,
            duration: 45000,
            icon: 'fas fa-shield-alt'
        },
        autoClicker: {
            id: 'autoClicker',
            name: '🤖 Авто-кликер',
            desc: 'Автоматический клик каждые 0.5 сек',
            cost: 2000,
            duration: 30000,
            icon: 'fas fa-robot'
        }
    };

    // Активные бусты: { boostId: { active: true, timeLeft: ms } }
    let activeBoosts = {};
    let boostTimers = {};
    let shopPanelVisible = false;

    // === ИНИЦИАЛИЗАЦИЯ ===
    function init() {
        createShopUI();
        loadActiveBoosts();
        startBoostTimers();

        // Подписка на события
        if (window.EventBus) {
            window.EventBus.on('game:paused', () => {
                // Можно добавить логику при паузе
            });
        }

        console.log('🛒 Shop System initialized');
    }

    // === СОЗДАНИЕ UI ===
    function createShopUI() {
        const btn = document.getElementById('shopBtn');
        const panel = document.getElementById('shopPanel');

        if (!btn || !panel) return;

        // Обработчики кнопки магазина
        btn.addEventListener('click', toggleShop);
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            toggleShop();
        }, { passive: false });

        // Генерация элементов магазина
        panel.innerHTML = '<h3>🛒 Магазин бонусов</h3>';

        Object.values(shopConfig).forEach(item => {
            const el = document.createElement('div');
            el.className = 'shop-item';
            el.id = `shop-item-${item.id}`;
            el.innerHTML = `
                <i class="${item.icon}"></i>
                <div style="flex:1;">
                    <div style="font-weight:bold;font-size:0.9em;">${item.name}</div>
                    <div style="font-size:0.7em;color:#aaa;margin-top:2px;">${item.desc}</div>
                    <div style="font-size:0.65em;color:#4FC3F7;margin-top:2px;">⏱ ${item.duration / 1000} сек</div>
                </div>
                <div class="shop-cost">${item.cost} 💎</div>
            `;

            el.addEventListener('click', () => purchaseItem(item.id));
            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                purchaseItem(item.id);
            }, { passive: false });

            panel.appendChild(el);
        });

        // Закрытие по клику вне панели
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

        // Пауза игры
        if (window.GAME_CORE && window.GAME_CORE.pauseGame) {
            window.GAME_CORE.pauseGame();
        }

        // Закрываем панель достижений если открыта
        if (window.achievementsSystem && window.achievementsSystem.hideAchievementsPanel) {
            window.achievementsSystem.hideAchievementsPanel();
        }
    }

    function closeShop() {
        const panel = document.getElementById('shopPanel');
        if (!panel) return;

        panel.style.display = 'none';
        shopPanelVisible = false;

        // Возобновление игры
        if (window.GAME_CORE && window.GAME_CORE.resumeGame) {
            window.GAME_CORE.resumeGame();
        }
    }

    // === ПОКУПКА ===
    function purchaseItem(boostId) {
        const item = shopConfig[boostId];
        if (!item || !window.gameState) return;

        // Проверка: уже активен
        if (activeBoosts[boostId] && activeBoosts[boostId].active) {
            showNotification('⚠️ Бонус уже активен!', '#ff9800');
            return;
        }

        // Проверка: достаточно ли кристаллов
        if (window.gameState.coins < item.cost) {
            showNotification('❌ Недостаточно кристаллов!', '#f44336');
            // Анимация тряски
            const el = document.getElementById(`shop-item-${boostId}`);
            if (el) {
                el.style.animation = 'shake 0.5s';
                setTimeout(() => el.style.animation = '', 500);
            }
            return;
        }

        // Покупка
        window.gameState.coins -= item.cost;

        // Инициализация состояния буста
        if (!window.gameState.shopItems) window.gameState.shopItems = {};
        window.gameState.shopItems[boostId] = {
            purchased: true,
            active: true,
            timeLeft: item.duration
        };

        // Активируем локально
        activeBoosts[boostId] = { active: true, timeLeft: item.duration };

        // Запускаем таймер
        startBoostTimer(boostId);

        // Обновляем метрики
        window.gameMetrics.boostersUsed = (window.gameMetrics.boostersUsed || 0) + 1;
        if (window.achievementsSystem) {
            window.achievementsSystem.incrementBoosters(1);
        }

        // EventBus уведомление
        if (window.EventBus) {
            window.EventBus.emit('shop:itemPurchased', { id: boostId, item: item });
        }

        // Специальная логика для авто-кликера
        if (boostId === 'autoClicker') {
            startAutoClicker();
        }

        // Обновляем UI
        updateShopDisplay();
        updateActiveBoostsHUD();
        if (window.GAME_UI) {
            window.GAME_UI.updateHUD();
            window.GAME_UI.updateUpgradeButtons();
        }

        // Звук и вибрация
        if (window.GAME_CORE && window.GAME_CORE.playSound) {
            window.GAME_CORE.playSound('upgradeSound');
        }
        if (window.telegramHaptic) window.telegramHaptic.success();
        else if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        showNotification(`✅ ${item.name} активирован!`, '#4CAF50');

        // Сохранение
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

            // Синхронизируем с gameState
            if (window.gameState && window.gameState.shopItems && window.gameState.shopItems[boostId]) {
                window.gameState.shopItems[boostId].timeLeft = activeBoosts[boostId].timeLeft;
            }

            // Буст закончился
            if (activeBoosts[boostId].timeLeft <= 0) {
                deactivateBoost(boostId);
            }

            updateActiveBoostsHUD();
        }, 1000);
    }

    function deactivateBoost(boostId) {
        if (boostTimers[boostId]) {
            clearInterval(boostTimers[boostId]);
            delete boostTimers[boostId];
        }

        activeBoosts[boostId] = { active: false, timeLeft: 0 };

        if (window.gameState && window.gameState.shopItems && window.gameState.shopItems[boostId]) {
            window.gameState.shopItems[boostId].active = false;
            window.gameState.shopItems[boostId].timeLeft = 0;
        }

        // Остановка авто-кликера
        if (boostId === 'autoClicker') {
            stopAutoClicker();
        }

        // EventBus
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
                window.gameState && window.gameState.gameActive &&
                !window.GAME_CORE.isGamePaused) {
                window.GAME_CORE.hitBlock(window.GAME_CORE.currentBlock, window.gameState.clickPower);
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

                // Восстанавливаем авто-кликер
                if (id === 'autoClicker') {
                    startAutoClicker();
                }
            }
        });
    }

    // === ОБНОВЛЕНИЕ UI МАГАЗИНА ===
    function updateShopDisplay() {
        Object.values(shopConfig).forEach(item => {
            const el = document.getElementById(`shop-item-${item.id}`);
            if (!el) return;

            const isActive = activeBoosts[item.id] && activeBoosts[item.id].active;
            const canAfford = window.gameState && window.gameState.coins >= item.cost;

            el.classList.remove('active', 'disabled');

            if (isActive) {
                el.classList.add('active');
                const timeLeft = activeBoosts[item.id].timeLeft;
                const secs = Math.ceil(timeLeft / 1000);
                const costEl = el.querySelector('.shop-cost');
                if (costEl) costEl.textContent = `⏱ ${secs}с`;
            } else if (!canAfford) {
                el.classList.add('disabled');
                const costEl = el.querySelector('.shop-cost');
                if (costEl) costEl.textContent = `${item.cost} 💎`;
            } else {
                const costEl = el.querySelector('.shop-cost');
                if (costEl) costEl.textContent = `${item.cost} 💎`;
            }
        });
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
            color: #fff;
            padding: 10px 20px;
            border-radius: 10px;
            z-index: 3000;
            font-family: 'Orbitron', sans-serif;
            font-weight: bold;
            font-size: 0.9em;
            box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            animation: achSlideDown 0.3s ease-out;
            pointer-events: none;
        `;
        document.body.appendChild(notif);

        setTimeout(() => {
            notif.style.transition = 'opacity 0.3s';
            notif.style.opacity = '0';
            setTimeout(() => { if (notif.parentNode) notif.parentNode.removeChild(notif); }, 300);
        }, 2000);
    }

    // === ПУБЛИЧНЫЙ API (для getBonus из GAME_CORE) ===
    window.shopSystem = {
        init: init,
        toggleShop: toggleShop,
        openShop: openShop,
        closeShop: closeShop,
        updateShopDisplay: updateShopDisplay,
        purchaseItem: purchaseItem,
        config: shopConfig,

        // Методы для GAME_CORE.getBonus()
        getSpeedMultiplier: () => {
            return (activeBoosts.timeWarp && activeBoosts.timeWarp.active) ? 0.5 : 1;
        },
        getRewardMultiplier: () => {
            return (activeBoosts.crystalBoost && activeBoosts.crystalBoost.active) ? 2 : 1;
        },
        getDamageMultiplier: () => {
            return (activeBoosts.powerSurge && activeBoosts.powerSurge.active) ? 3 : 1;
        },
        getCritChanceMultiplier: () => 1,
        getCritMultMultiplier: () => 1,
        getComboMultiplier: () => 1,
        getBlockHealthMultiplier: () => 1,
        getLuckMultiplier: () => {
            return (activeBoosts.luckyCharm && activeBoosts.luckyCharm.active) ? 1.5 : 1;
        },
        getAutoClickMultiplier: () => {
            return (activeBoosts.autoClicker && activeBoosts.autoClicker.active) ? 2 : 1;
        },
        isInvincible: () => {
            return !!(activeBoosts.invincible && activeBoosts.invincible.active);
        },
        hasMagnet: () => false,
        hasAutoClick: () => {
            return !!(activeBoosts.autoClicker && activeBoosts.autoClicker.active);
        }
    };

    // Автоинициализация
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 400));
    } else {
        setTimeout(init, 400);
    }
})();