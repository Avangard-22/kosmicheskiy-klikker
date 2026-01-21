// Система сохранения игры
(function() {
  // Инициализация только при полной загрузке страницы
  let isInitialized = false;
  
  // Базовая структура состояния игры
  const defaultGameState = {
    coins: 0,
    totalDamageDealt: 0,
    clickPower: 1,
    clickUpgradeLevel: 0,
    currentLocation: 'mercury',
    critChance: 0.001,
    critMultiplier: 2.0,
    helperDamageBonus: 0.3,
    helperUpgradeLevel: 0,
    boboCoinBonus: 0,
    critChanceUpgradeLevel: 0,
    critMultiplierUpgradeLevel: 0,
    gameActive: false,
    helperActive: false,
    helperTimeLeft: 0,
    comboCount: 0,
    lastDestroyTime: 0,
    shopItems: {
      timeWarp: { purchased: false, active: false, timeLeft: 0 },
      crystalBoost: { purchased: false, active: false, timeLeft: 0 },
      powerSurge: { purchased: false, active: false, timeLeft: 0 }
    },
    achievements: {}
  };
  
  const defaultGameMetrics = {
    startTime: Date.now(),
    blocksDestroyed: 0,
    upgradesBought: 0,
    totalClicks: 0,
    sessions: 1,
    totalCrits: 0,
    totalCoinsEarned: 0,
    helpersBought: 0,
    boostersUsed: 0,
    maxCombo: 0
  };
  
  // Отложенная инициализация
  function init() {
    if (isInitialized) return;
    
    // Проверяем, есть ли сохранение
    const saved = localStorage.getItem('cosmicBlocksSave');
    if (saved) {
      try {
        loadGameFromStorage();
      } catch (e) {
        console.error('Ошибка загрузки сохранения:', e);
        resetGame();
      }
    } else {
      // Нет сохранения - используем значения по умолчанию
      window.gameState = Object.assign({}, defaultGameState);
      window.gameMetrics = Object.assign({}, defaultGameMetrics);
    }
    
    isInitialized = true;
    console.log('✅ Система сохранения инициализирована');
  }
  
  function loadGameFromStorage() {
    const saved = localStorage.getItem('cosmicBlocksSave');
    if (!saved) return false;
    
    const data = JSON.parse(saved);
    
    // Проверка на устаревание (30 дней)
    const saveAge = Date.now() - (data.timestamp || 0);
    const maxSaveAge = 30 * 24 * 60 * 60 * 1000;
    
    if (saveAge > maxSaveAge) {
      console.log('Сохранение устарело');
      localStorage.removeItem('cosmicBlocksSave');
      return false;
    }
    
    // Восстанавливаем состояние игры
    if (data.gameState) {
      // Начинаем с дефолтных значений
      window.gameState = Object.assign({}, defaultGameState);
      
      // Копируем сохраненные значения
      for (const key in data.gameState) {
        if (key === 'shopItems' || key === 'achievements') {
          // Для вложенных объектов делаем глубокое копирование
          window.gameState[key] = JSON.parse(JSON.stringify(data.gameState[key] || defaultGameState[key]));
        } else if (data.gameState.hasOwnProperty(key)) {
          window.gameState[key] = data.gameState[key];
        }
      }
    }
    
    // Восстанавливаем метрики
    if (data.gameMetrics) {
      window.gameMetrics = Object.assign({}, defaultGameMetrics, data.gameMetrics);
      window.gameMetrics.sessions = (window.gameMetrics.sessions || 0) + 1;
    } else {
      window.gameMetrics = Object.assign({}, defaultGameMetrics);
    }
    
    console.log('✅ Игра загружена:', {
      coins: window.gameState.coins,
      damage: window.gameState.totalDamageDealt,
      location: window.gameState.currentLocation
    });
    
    return true;
  }
  
  // Функция сохранения игры
  window.saveGame = function() {
    try {
      if (!window.gameState || !window.gameMetrics) {
        console.error('Не удалось сохранить: gameState или gameMetrics не определены');
        return false;
      }
      
      const saveData = {
        gameState: JSON.parse(JSON.stringify(window.gameState)),
        gameMetrics: JSON.parse(JSON.stringify(window.gameMetrics)),
        timestamp: Date.now(),
        version: '1.0'
      };
      
      localStorage.setItem('cosmicBlocksSave', JSON.stringify(saveData));
      
      console.log('💾 Игра сохранена:', {
        coins: window.gameState.coins,
        damage: window.gameState.totalDamageDealt,
        location: window.gameState.currentLocation
      });
      
      // Обновляем кнопку продолжения
      if (typeof window.updateContinueButton === 'function') {
        window.updateContinueButton();
      }
      
      return true;
    } catch (e) {
      console.error('❌ Ошибка сохранения:', e);
      return false;
    }
  };
  
  // Функция загрузки игры
  window.loadGame = function() {
    try {
      return loadGameFromStorage();
    } catch (e) {
      console.error('❌ Ошибка загрузки:', e);
      return false;
    }
  };
  
  // Функция сброса игры
  window.resetGame = function() {
    window.gameState = Object.assign({}, defaultGameState);
    window.gameMetrics = Object.assign({}, defaultGameMetrics);
    window.gameMetrics.startTime = Date.now();
    window.gameMetrics.sessions = 1;
    
    localStorage.removeItem('cosmicBlocksSave');
    
    console.log('🔄 Игра сброшена');
    
    return true;
  };
  
  // Функция обновления кнопки продолжения
  window.updateContinueButton = function() {
    const continueBtn = document.getElementById('continueBtn');
    if (!continueBtn) return;
    
    const hasSave = localStorage.getItem('cosmicBlocksSave') !== null;
    
    if (hasSave) {
      continueBtn.className = 'btn save-available';
      continueBtn.title = 'Продолжить сохраненную игру';
      
      // Показываем информацию о сохранении
      try {
        const saved = localStorage.getItem('cosmicBlocksSave');
        if (saved) {
          const data = JSON.parse(saved);
          const saveTime = new Date(data.timestamp);
          const timeAgo = Math.floor((Date.now() - data.timestamp) / (1000 * 60));
          
          let timeText;
          if (timeAgo < 1) timeText = 'только что';
          else if (timeAgo < 60) timeText = `${timeAgo} мин назад`;
          else if (timeAgo < 1440) timeText = `${Math.floor(timeAgo / 60)} ч назад`;
          else timeText = `${Math.floor(timeAgo / 1440)} д назад`;
          
          continueBtn.title = `Продолжить игру (${timeText})`;
        }
      } catch (e) {
        // Игнорируем ошибки
      }
    } else {
      continueBtn.className = 'btn no-save';
      continueBtn.title = 'Нет сохраненной игры';
    }
  };
  
  // Инициализация при полной загрузке
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM уже загружен
    setTimeout(init, 100);
  }
})();
// Дебаг-функции
window.debugSaveSystem = {
  // Проверить наличие сохранения
  checkSave: function() {
    const saved = localStorage.getItem('cosmicBlocksSave');
    console.log('=== ПРОВЕРКА СОХРАНЕНИЯ ===');
    console.log('Ключ сохранения:', saved ? 'Найден' : 'Не найден');
    
    if (saved) {
      try {
        const data = JSON.parse(saved);
        console.log('Данные сохранения:', {
          версия: data.version || 'нет',
          время: new Date(data.timestamp).toLocaleString(),
          кристаллы: data.gameState?.coins,
          урон: data.gameState?.totalDamageDealt,
          планета: data.gameState?.currentLocation,
          размер: `${saved.length} байт`
        });
      } catch (e) {
        console.error('Ошибка парсинга сохранения:', e);
      }
    }
  },
  
  // Проверить текущее состояние
  checkState: function() {
    console.log('=== ТЕКУЩЕЕ СОСТОЯНИЕ ===');
    console.log('gameState:', window.gameState);
    console.log('gameMetrics:', window.gameMetrics);
  },
  
  // Очистить все сохранения
  clearAll: function() {
    if (confirm('Очистить ВСЕ сохранения игры?')) {
      localStorage.removeItem('cosmicBlocksSave');
      localStorage.removeItem('gameMetrics');
      console.log('🗑️ Все сохранения очищены');
      if (typeof window.updateContinueButton === 'function') {
        window.updateContinueButton();
      }
    }
  }
};