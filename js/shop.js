// Система магазина с временными бонусами
(function() {
  const shopItems = {
    timeWarp: {
      id: 'timeWarp',
      name: 'timeWarp',
      icon: 'fas fa-hourglass-half',
      baseCost: 250,
      duration: 30000, // 30 секунд
      effect: 'Замедляет движение блоков на 50%',
      multiplier: 0.5
    },
    crystalBoost: {
      id: 'crystalBoost',
      name: 'crystalBoost',
      icon: 'fas fa-gem',
      baseCost: 400,
      duration: 60000, // 1 минута
      effect: 'Увеличивает награду за кристаллы на 50%',
      multiplier: 1.5
    },
    powerSurge: {
      id: 'powerSurge',
      name: 'powerSurge',
      icon: 'fas fa-bolt',
      baseCost: 300,
      duration: 45000, // 45 секунд
      effect: 'Увеличивает силу удара на 50%',
      multiplier: 1.5
    }
  };
  
  let shopPanelVisible = false;
  
  // Инициализация магазина
  function init() {
    createShopPanel();
    setupEventHandlers();
    updateShopDisplay();
    
    // Запуск таймера для обновления состояния активных бонусов
    setInterval(updateActiveBonuses, 1000);
  }
  
  // Создание панели магазина
  function createShopPanel() {
    const shopContainer = document.getElementById('shopContainer');
    if (!shopContainer) return;
    
    // Убедимся, что кнопка и панель существуют
    const shopBtn = document.getElementById('shopBtn');
    const shopPanel = document.getElementById('shopPanel');
    
    if (!shopBtn || !shopPanel) return;
    
    // Добавляем обработчики для элементов магазина
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
  
  // Настройка обработчиков событий
  function setupEventHandlers() {
    const shopBtn = document.getElementById('shopBtn');
    const shopPanel = document.getElementById('shopPanel');
    
    if (shopBtn && shopPanel) {
      shopBtn.addEventListener('click', toggleShopPanel);
      shopBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        toggleShopPanel();
      }, { passive: false });
      
      // Закрытие панели при клике вне ее
      document.addEventListener('click', (e) => {
        if (shopPanelVisible && 
            !shopPanel.contains(e.target) && 
            !shopBtn.contains(e.target)) {
          hideShopPanel();
        }
      });
    }
  }
  
  // Переключение видимости панели магазина
  function toggleShopPanel() {
    const shopPanel = document.getElementById('shopPanel');
    if (!shopPanel) return;
    
    if (shopPanelVisible) {
      hideShopPanel();
    } else {
      showShopPanel();
      
      // Скрываем панель достижений если она открыта
      if (window.achievementsSystem) {
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
  
  // Покупка предмета
  function purchaseItem(itemId) {
  const item = shopItems[itemId];
  if (!item) return;
  const gameState = window.gameState;
  if (!gameState) return; // защита
    
    // Инициализируем shopItems если их нет
    if (!gameState.shopItems) {
      gameState.shopItems = {};
    }
    if (!gameState.shopItems[itemId]) {
      gameState.shopItems[itemId] = { purchased: false, active: false, timeLeft: 0 };
    }
    // Добавляем экспорт pause/resume
window.shopSystem = {
  init,
  toggleShopPanel,
  showShopPanel,
  hideShopPanel,
  updateShopDisplay,
  updateTranslations,
  getSpeedMultiplier,
  getItemName
};
    // Проверяем, активен ли уже этот бонус
    if (gameState.shopItems[itemId].active) {
      showItemTooltip(`Бонус "${getItemName(itemId)}" уже активен!`);
      return;
    }
    
    // Проверяем достаточно ли кристаллов
    if (gameState.coins < item.baseCost) {
      showItemTooltip(`Недостаточно кристаллов! Нужно: ${item.baseCost}`);
      return;
    }
    
    // Списание кристаллов
    gameState.coins -= item.baseCost;
    gameState.shopItems[itemId].purchased = true;
    gameState.shopItems[itemId].active = true;
    gameState.shopItems[itemId].timeLeft = item.duration;
    
    // Увеличиваем счетчик использованных бустов
    if (!window.gameMetrics) window.gameMetrics = {};
    window.gameMetrics.boostersUsed = (window.gameMetrics.boostersUsed || 0) + 1;
    
    // Обновляем достижения
    if (window.achievementsSystem && window.achievementsSystem.incrementBoosters) {
      window.achievementsSystem.incrementBoosters(1);
    }
    
    // Обновляем отображение
    updateHUD();
    updateUpgradeButtons();
    updateShopDisplay();
    
    // Показываем уведомление
    showItemTooltip(`Бонус "${getItemName(itemId)}" активирован на ${Math.floor(item.duration / 1000)} секунд!`);
    
    // Визуальный эффект покупки
    const shopItemElement = document.getElementById(`shop${capitalizeFirstLetter(itemId)}`);
    if (shopItemElement) {
      shopItemElement.style.transform = 'scale(1.1)';
      shopItemElement.style.boxShadow = '0 0 15px #4CAF50';
      setTimeout(() => {
        shopItemElement.style.transform = 'scale(1)';
        shopItemElement.style.boxShadow = '';
      }, 300);
    }
    
    // Сохраняем игру
    window.saveGame();
    
    // Запускаем звук покупки
    playSound('upgradeSound');
  }
  
  // Применение эффекта предмета
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
  
  // Обновление активных бонусов
  function updateActiveBonuses() {
    const gameState = window.gameState;
    if (!gameState.shopItems) return;
    
    let updated = false;
    
    Object.keys(shopItems).forEach(itemId => {
      if (gameState.shopItems[itemId] && gameState.shopItems[itemId].active) {
        gameState.shopItems[itemId].timeLeft -= 1000;
        
        if (gameState.shopItems[itemId].timeLeft <= 0) {
          gameState.shopItems[itemId].active = false;
          gameState.shopItems[itemId].timeLeft = 0;
          updated = true;
          
          // Уведомление об окончании бонуса
          showItemTooltip(`Бонус "${getItemName(itemId)}" закончился!`);
        }
      }
    });
    
    if (updated) {
      updateShopDisplay();
      window.saveGame();
    }
  }
  
  // Обновление отображения магазина
  function updateShopDisplay() {
    const gameState = window.gameState;
    if (!gameState.shopItems) return;
    
    Object.keys(shopItems).forEach(itemId => {
      const shopItem = document.getElementById(`shop${capitalizeFirstLetter(itemId)}`);
      if (!shopItem) return;
      
      const item = shopItems[itemId];
      const itemState = gameState.shopItems[itemId] || { purchased: false, active: false, timeLeft: 0 };
      
      // Обновляем стоимость
      const costElement = shopItem.querySelector('.shop-cost');
      if (costElement) {
        if (itemState.active) {
          const timeLeft = Math.ceil(itemState.timeLeft / 1000);
          costElement.textContent = `${timeLeft}с`;
          costElement.style.color = '#4CAF50';
        } else {
          costElement.textContent = item.baseCost;
          
          // Подсвечиваем если не хватает кристаллов
          if (gameState.coins < item.baseCost) {
            costElement.style.color = '#f44336';
          } else {
            costElement.style.color = '#FFD54F';
          }
        }
      }
      
      // Обновляем состояние
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
    
    // Обновляем переводы
    updateTranslations();
  }
  
  // Обновление переводов
  function updateTranslations() {
    const shopPanel = document.getElementById('shopPanel');
    if (!shopPanel) return;
    
    const title = shopPanel.querySelector('h3');
    if (title) window.applyTranslation(title, 'shop.title');
    
    Object.keys(shopItems).forEach(itemId => {
      const shopItem = document.getElementById(`shop${capitalizeFirstLetter(itemId)}`);
      if (!shopItem) return;
      
      const span = shopItem.querySelector('span');
      if (span) {
        window.applyTranslation(span, `shop.${itemId}`);
      }
    });
  }
  
  // Получение имени предмета
  function getItemName(itemId) {
    const translations = window.translations[window.currentLanguage];
    if (translations && translations.shop && translations.shop[itemId]) {
      return translations.shop[itemId];
    }
    return shopItems[itemId]?.effect || itemId;
  }
  
  // Показ всплывающей подсказки
  function showItemTooltip(text) {
    if (window.showTooltip) {
      window.showTooltip(text);
      setTimeout(window.hideTooltip, 2000);
    }
  }
  
  // Вспомогательная функция
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(e => {});
    }
  }
  
  function updateHUD() {
    if (window.updateHUD) window.updateHUD();
  }
  
  function updateUpgradeButtons() {
    if (window.updateUpgradeButtons) window.updateUpgradeButtons();
  }
  
  // Получение модификатора скорости блоков (для timeWarp)
  function getSpeedMultiplier() {
    const gameState = window.gameState;
    if (gameState.shopItems && gameState.shopItems.timeWarp && gameState.shopItems.timeWarp.active) {
      return shopItems.timeWarp.multiplier;
    }
    return 1.0;
  }
  
  // Экспорт функций
  window.shopSystem = {
    init,
    toggleShopPanel,
    showShopPanel,
    hideShopPanel,
    updateShopDisplay,
    updateTranslations,
    getSpeedMultiplier,
    getItemName
  };
  
  // Инициализация при загрузке
  document.addEventListener('DOMContentLoaded', function() {
    // Небольшая задержка для гарантии загрузки других модулей
    setTimeout(() => {
      if (document.getElementById('shopBtn')) {
        init();
      }
    }, 100);
  });
})();