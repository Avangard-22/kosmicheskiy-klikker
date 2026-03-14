// Система магазина с временными бонусами
(function() {
    'use strict';
    
    const shopItems = {
        timeWarp: {
            id: 'timeWarp',
            name: 'timeWarp',
            icon: 'fas fa-hourglass-half',
            baseCost: 250,
            duration: 30000,
            effect: 'Замедляет движение блоков на 50%',
            multiplier: 0.5
        },
        crystalBoost: {
            id: 'crystalBoost',
            name: 'crystalBoost',
            icon: 'fas fa-gem',
            baseCost: 400,
            duration: 60000,
            effect: 'Увеличивает награду за кристаллы на 50%',
            multiplier: 1.5
        },
        powerSurge: {
            id: 'powerSurge',
            name: 'powerSurge',
            icon: 'fas fa-bolt',
            baseCost: 300,
            duration: 45000,
            effect: 'Увеличивает силу удара на 50%',
            multiplier: 1.5
        }
    };
    
    let shopPanelVisible = false;
    let updateInterval = null;
    
    // ✅ Инициализация магазина
    function init() {
        if (!window.gameState) {
            console.warn('⚠️ shop.js: gameState не инициализирован, ожидаем...');
            setTimeout(init, 200);
            return;
        }
        
        createShopPanel();
        setupEventHandlers();
        updateShopDisplay();
        
        // ✅ Запуск таймера для обновления состояния активных бонусов
        startUpdateLoop();
        
        console.log('✅ Shop System initialized');
    }
    
    // ✅ Запуск цикла обновления бустов
    function startUpdateLoop() {
        if (updateInterval) clearInterval(updateInterval);
        
        updateInterval = setInterval(() => {
            updateActiveBonuses();
        }, 1000);
    }
    
    // ✅ Остановка цикла обновления
    function stopUpdateLoop() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }
    
    // ✅ Создание панели магазина
    function createShopPanel() {
        const shopContainer = document.getElementById('shopContainer');
        if (!shopContainer) return;
        
        const shopBtn = document.getElementById('shopBtn');
        const shopPanel = document.getElementById('shopPanel');
        
        if (!shopBtn || !shopPanel) return;
        
        // ✅ Добавляем обработчики для элементов магазина
        Object.values(shopItems).forEach(item => {
            const shopItem = document.getElementById(`shop${capitalizeFirstLetter(item.name)}`);
            if (shopItem) {
                shopItem.addEventListener('click', () => purchaseItem(item.id));
                shopItem.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    purchaseItem(item.id);
                }, { passive: false });
            }
        });
    }
    
    // ✅ Настройка обработчиков событий
    function setupEventHandlers() {
        const shopBtn = document.getElementById('shopBtn');
        const shopPanel = document.getElementById('shopPanel');
        
        if (shopBtn && shopPanel) {
            shopBtn.addEventListener('click', toggleShopPanel);
            shopBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                toggleShopPanel();
            }, { passive: false });
            
            // ✅ Закрытие панели при клике вне ее
            document.addEventListener('click', (e) => {
                if (shopPanelVisible &&
                    !shopPanel.contains(e.target) &&
                    !shopBtn.contains(e.target)) {
                    hideShopPanel();
                }
            });
        }
    }
    
    // ✅ Переключение видимости панели магазина
    function toggleShopPanel() {
        const shopPanel = document.getElementById('shopPanel');
        if (!shopPanel) return;
        
        if (shopPanelVisible) {
            hideShopPanel();
        } else {
            showShopPanel();
            
            // ✅ Скрываем панель достижений если она открыта
            if (window.achievementsSystem && typeof window.achievementsSystem.hideAchievementsPanel === 'function') {
                window.achievementsSystem.hideAchievementsPanel();
            }
        }
    }
    
    function showShopPanel() {
        const shopPanel = document.getElementById('shopPanel');
        if (shopPanel) {
            shopPanel.style.display = 'flex';
            shopPanelVisible = true;
            updateShopDisplay();
        }
    }
    
    function hideShopPanel() {
        const shopPanel = document.getElementById('shopPanel');
        if (shopPanel) {
            shopPanel.style.display = 'none';
            shopPanelVisible = false;
        }
    }
    
    // ✅ Покупка предмета
    function purchaseItem(itemId) {
        const item = shopItems[itemId];
        if (!item) {
            console.warn(`⚠️ shop.js: Предмет ${itemId} не найден`);
            return;
        }
        
        const gameState = window.gameState;
        if (!gameState) {
            showItemTooltip('Ошибка: игра не инициализирована!');
            return;
        }
        
        // ✅ Инициализируем shopItems если их нет
        if (!gameState.shopItems) {
            gameState.shopItems = {};
        }
        if (!gameState.shopItems[itemId]) {
            gameState.shopItems[itemId] = { purchased: false, active: false, timeLeft: 0 };
        }
        
        // ✅ Проверяем, активен ли уже этот бонус
        if (gameState.shopItems[itemId].active) {
            showItemTooltip(`Бонус "${getItemName(itemId)}" уже активен!`);
            if (window.telegramHaptic) window.telegramHaptic.warning();
            return;
        }
        
        // ✅ Проверяем достаточно ли кристаллов
        if (gameState.coins < item.baseCost) {
            showItemTooltip(`Недостаточно кристаллов! Нужно: ${item.baseCost}`);
            if (window.telegramHaptic) window.telegramHaptic.error();
            
            // ✅ Визуальный эффект ошибки
            const shopItemElement = document.getElementById(`shop${capitalizeFirstLetter(itemId)}`);
            if (shopItemElement) {
                shopItemElement.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    shopItemElement.style.animation = '';
                }, 500);
            }
            return;
        }
        
        // ✅ Списание кристаллов
        gameState.coins -= item.baseCost;
        gameState.shopItems[itemId].purchased = true;
        gameState.shopItems[itemId].active = true;
        gameState.shopItems[itemId].timeLeft = item.duration;
        
        // ✅ Увеличиваем счетчик использованных бустов
        if (!window.gameMetrics) window.gameMetrics = {};
        window.gameMetrics.boostersUsed = (window.gameMetrics.boostersUsed || 0) + 1;
        
        // ✅ Обновляем достижения
        if (window.achievementsSystem && typeof window.achievementsSystem.incrementBoosters === 'function') {
            try {
                window.achievementsSystem.incrementBoosters(1);
            } catch (e) {
                console.warn('⚠️ shop.js: achievementsSystem.incrementBoosters error:', e);
            }
        }
        
        // ✅ Обновляем отображение
        if (typeof window.updateHUD === 'function') window.updateHUD();
        if (typeof window.updateUpgradeButtons === 'function') window.updateUpgradeButtons();
        updateShopDisplay();
        
        // ✅ Показываем уведомление
        showItemTooltip(`Бонус "${getItemName(itemId)}" активирован на ${Math.floor(item.duration / 1000)} секунд!`);
        
        // ✅ Визуальный эффект покупки
        const shopItemElement = document.getElementById(`shop${capitalizeFirstLetter(itemId)}`);
        if (shopItemElement) {
            shopItemElement.style.transform = 'scale(1.1)';
            shopItemElement.style.boxShadow = '0 0 15px #4CAF50';
            setTimeout(() => {
                shopItemElement.style.transform = 'scale(1)';
                shopItemElement.style.boxShadow = '';
            }, 300);
            
            // ✅ Эффект частиц при покупке
            showPurchaseEffect(itemId, shopItemElement);
        }
        
        // ✅ Haptic Feedback для Telegram
        if (window.telegramHaptic) window.telegramHaptic.success();
        else if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        
        // ✅ Сохраняем игру
        if (typeof window.saveGame === 'function') window.saveGame();
        
        // ✅ Запускаем звук покупки
        playSound('upgradeSound');
        
        console.log(`✅ Shop: Purchased ${itemId}`);
    }
    
    // ✅ Эффект частиц при покупке
    function showPurchaseEffect(itemId, element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                width: 8px;
                height: 8px;
                background: #FFD700;
                border-radius: 50%;
                pointer-events: none;
                z-index: 2000;
            `;
            
            document.body.appendChild(particle);
            
            const angle = (Math.PI * 2 / 10) * i;
            const distance = 50 + Math.random() * 30;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
            ], {
                duration: 500,
                easing: 'ease-out'
            }).onfinish = () => {
                if (particle.parentNode) particle.remove();
            };
        }
    }
    
    // ✅ Применение эффекта предмета (для справки)
    function applyItemEffect(itemId) {
        const item = shopItems[itemId];
        const gameState = window.gameState;
        
        switch(itemId) {
            case 'timeWarp':
                // Эффект применяется в функции getCurrentSpeed() в game-logic.js
                break;
            case 'crystalBoost':
                // Эффект применяется в функции destroyBlock() в game-logic.js
                break;
            case 'powerSurge':
                // Эффект применяется в функциях hitBlock() и helperAttack() в game-logic.js
                break;
        }
    }
    
    // ✅ Обновление активных бонусов
    function updateActiveBonuses() {
        const gameState = window.gameState;
        if (!gameState || !gameState.shopItems) return;
        
        let updated = false;
        let anyActive = false;
        
        Object.keys(shopItems).forEach(itemId => {
            if (gameState.shopItems[itemId] && gameState.shopItems[itemId].active) {
                anyActive = true;
                gameState.shopItems[itemId].timeLeft -= 1000;
                
                if (gameState.shopItems[itemId].timeLeft <= 0) {
                    gameState.shopItems[itemId].active = false;
                    gameState.shopItems[itemId].timeLeft = 0;
                    updated = true;
                    
                    // ✅ Уведомление об окончании бонуса
                    showItemTooltip(`Бонус "${getItemName(itemId)}" закончился!`);
                    
                    // ✅ Виброотдача для Telegram
                    if (window.telegramHaptic) window.telegramHaptic.warning();
                    else if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
                }
            }
        });
        
        if (updated) {
            updateShopDisplay();
            if (typeof window.updateHUD === 'function') window.updateHUD();
            if (typeof window.updateUpgradeButtons === 'function') window.updateUpgradeButtons();
            if (typeof window.saveGame === 'function') window.saveGame();
        }
        
        // ✅ Обновляем индикатор активных бустов в реальном времени
        if (anyActive) {
            updateActiveBoostsUI();
        }
    }
    
    // ✅ Обновление индикатора активных бустов
    function updateActiveBoostsUI() {
        const container = document.getElementById('activeBoosts');
        if (!container || !window.gameState?.shopItems) return;
        
        const active = Object.entries(window.gameState.shopItems)
            .filter(([_, item]) => item && item.active)
            .map(([key, item]) => {
                const config = shopItems[key];
                if (!config) return '';
                const timeLeft = Math.ceil(item.timeLeft / 1000);
                return `
                    <div class="boost-badge" data-boost="${key}" style="
                        display: flex;
                        align-items: center;
                        gap: 5px;
                        padding: 5px 10px;
                        background: rgba(76, 175, 80, 0.3);
                        border-radius: 15px;
                        border: 1px solid #4CAF50;
                        color: #fff;
                        font-size: 0.8em;
                        margin-right: 5px;
                    ">
                        <i class="${config.icon}"></i>
                        <span>${timeLeft}с</span>
                    </div>
                `;
            }).join('');
        
        if (container) {
            container.innerHTML = active || '';
            container.style.display = active ? 'flex' : 'none';
        }
    }
    
    // ✅ Обновление отображения магазина
    function updateShopDisplay() {
        const gameState = window.gameState;
        if (!gameState || !gameState.shopItems) return;
        
        Object.keys(shopItems).forEach(itemId => {
            const shopItem = document.getElementById(`shop${capitalizeFirstLetter(itemId)}`);
            if (!shopItem) return;
            
            const item = shopItems[itemId];
            const itemState = gameState.shopItems[itemId] || { purchased: false, active: false, timeLeft: 0 };
            
            // ✅ Обновляем стоимость
            const costElement = shopItem.querySelector('.shop-cost');
            if (costElement) {
                if (itemState.active) {
                    const timeLeft = Math.ceil(itemState.timeLeft / 1000);
                    costElement.textContent = `${timeLeft}с`;
                    costElement.style.color = '#4CAF50';
                } else {
                    costElement.textContent = item.baseCost;
                    
                    // ✅ Подсвечиваем если не хватает кристаллов
                    if (gameState.coins < item.baseCost) {
                        costElement.style.color = '#f44336';
                    } else {
                        costElement.style.color = '#FFD54F';
                    }
                }
            }
            
            // ✅ Обновляем состояние
            if (itemState.active) {
                shopItem.classList.add('active');
                shopItem.classList.remove('disabled');
            } else if (gameState.coins < item.baseCost) {
                shopItem.classList.add('disabled');
                shopItem.classList.remove('active');
            } else {
                shopItem.classList.remove('active', 'disabled');
            }
        });
        
        // ✅ Обновляем переводы
        updateTranslations();
    }
    
    // ✅ Обновление переводов
    function updateTranslations() {
        const shopPanel = document.getElementById('shopPanel');
        if (!shopPanel) return;
        
        const title = shopPanel.querySelector('h3');
        if (title && typeof window.applyTranslation === 'function') {
            window.applyTranslation(title, 'shop.title');
        }
        
        Object.keys(shopItems).forEach(itemId => {
            const shopItem = document.getElementById(`shop${capitalizeFirstLetter(itemId)}`);
            if (!shopItem) return;
            
            const span = shopItem.querySelector('span');
            if (span && typeof window.applyTranslation === 'function') {
                window.applyTranslation(span, `shop.${itemId}`);
            }
        });
    }
    
    // ✅ Получение имени предмета
    function getItemName(itemId) {
        const translations = window.translations?.[window.currentLanguage];
        if (translations && translations.shop && translations.shop[itemId]) {
            return translations.shop[itemId].trim();
        }
        return shopItems[itemId]?.effect || itemId;
    }
    
    // ✅ Получение модификатора скорости блоков (для timeWarp)
    function getSpeedMultiplier() {
        const gameState = window.gameState;
        if (gameState?.shopItems?.timeWarp?.active) {
            return shopItems.timeWarp.multiplier;
        }
        return 1.0;
    }
    
    // ✅ Получение модификатора награды (для crystalBoost)
    function getRewardMultiplier() {
        const gameState = window.gameState;
        if (gameState?.shopItems?.crystalBoost?.active) {
            return shopItems.crystalBoost.multiplier;
        }
        return 1.0;
    }
    
    // ✅ Получение модификатора урона (для powerSurge)
    function getDamageMultiplier() {
        const gameState = window.gameState;
        if (gameState?.shopItems?.powerSurge?.active) {
            return shopItems.powerSurge.multiplier;
        }
        return 1.0;
    }
    
    // ✅ Показ всплывающей подсказки
    function showItemTooltip(text) {
        if (typeof window.showTooltip === 'function') {
            window.showTooltip(text);
            setTimeout(() => {
                if (typeof window.hideTooltip === 'function') {
                    window.hideTooltip();
                }
            }, 2000);
        } else {
            console.log('Tooltip:', text);
        }
    }
    
    // ✅ Вспомогательная функция
    function capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // ✅ Воспроизведение звука
    function playSound(soundId) {
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => {
                // ✅ Тихая ошибка для автовоспроизведения
            });
        }
    }
    
    // ✅ Обертка для updateHUD
    function updateHUD() {
        if (typeof window.updateHUD === 'function') {
            window.updateHUD();
        }
    }
    
    // ✅ Обертка для updateUpgradeButtons
    function updateUpgradeButtons() {
        if (typeof window.updateUpgradeButtons === 'function') {
            window.updateUpgradeButtons();
        }
    }
    
    // ✅ Очистка при закрытии
    function cleanup() {
        stopUpdateLoop();
        shopPanelVisible = false;
    }
    
    // ✅ Экспорт функций
    window.shopSystem = {
        init,
        toggleShopPanel,
        showShopPanel,
        hideShopPanel,
        updateShopDisplay,
        updateTranslations,
        getSpeedMultiplier,
        getRewardMultiplier,
        getDamageMultiplier,
        getItemName,
        cleanup,
        purchaseItem
    };
    
    // ✅ Инициализация при загрузке
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                if (document.getElementById('shopBtn')) {
                    init();
                }
            }, 200);
        });
    } else {
        setTimeout(() => {
            if (document.getElementById('shopBtn')) {
                init();
            }
        }, 200);
    }
    
    // ✅ Обработчик закрытия страницы
    window.addEventListener('beforeunload', () => {
        cleanup();
    });
    
    console.log('🛒 Shop System loaded');
})();