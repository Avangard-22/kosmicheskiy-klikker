// Система сохранения игры
(function() {
    'use strict';
    
    let isInitialized = false;
    let autoSaveInterval = null;
    const AUTO_SAVE_INTERVAL = 30000; // 30 секунд
    
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
        helperActivations: 0,
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
    
    function init() {
        if (isInitialized) return;
        
        const saved = localStorage.getItem('cosmicBlocksSave');
        if (saved) {
            try {
                loadGameFromStorage();
            } catch (e) {
                console.error('Ошибка загрузки сохранения:', e);
                resetGame();
            }
        } else {
            window.gameState = JSON.parse(JSON.stringify(defaultGameState));
            window.gameMetrics = JSON.parse(JSON.stringify(defaultGameMetrics));
        }
        
        isInitialized = true;
        console.log('✅ Система сохранения инициализирована');
        
        // ✅ Запуск автосохранения
        startAutoSave();
        
        // ✅ Обработчик закрытия страницы
        window.addEventListener('beforeunload', function() {
            if (window.gameState && window.gameState.gameActive) {
                window.saveGame();
            }
        });
        
        // ✅ Обработчик видимости вкладки
        document.addEventListener('visibilitychange', function() {
            if (document.hidden && window.gameState && window.gameState.gameActive) {
                window.saveGame();
            }
        });
    }
    
    function loadGameFromStorage() {
        const saved = localStorage.getItem('cosmicBlocksSave');
        if (!saved) return false;
        
        const data = JSON.parse(saved);
        const saveAge = Date.now() - (data.timestamp || 0);
        const maxSaveAge = 30 * 24 * 60 * 60 * 1000;
        
        if (saveAge > maxSaveAge) {
            console.log('Сохранение устарело');
            localStorage.removeItem('cosmicBlocksSave');
            return false;
        }
        
        if (data.gameState) {
            window.gameState = JSON.parse(JSON.stringify(defaultGameState));
            for (const key in data.gameState) {
                if (key === 'shopItems' || key === 'achievements') {
                    window.gameState[key] = JSON.parse(JSON.stringify(
                        data.gameState[key] || defaultGameState[key]
                    ));
                } else if (data.gameState.hasOwnProperty(key)) {
                    window.gameState[key] = data.gameState[key];
                }
            }
        }
        
        if (data.gameMetrics) {
            window.gameMetrics = JSON.parse(JSON.stringify(defaultGameMetrics));
            Object.assign(window.gameMetrics, data.gameMetrics);
            window.gameMetrics.sessions = (window.gameMetrics.sessions || 0) + 1;
        } else {
            window.gameMetrics = JSON.parse(JSON.stringify(defaultGameMetrics));
        }
        
        console.log('✅ Игра загружена:', {
            coins: window.gameState.coins,
            damage: window.gameState.totalDamageDealt,
            location: window.gameState.currentLocation
        });
        
        return true;
    }
    
    window.saveGame = function() {
        if (!window.gameState || !window.gameMetrics) {
            console.error('Не удалось сохранить: gameState или gameMetrics не определены');
            return false;
        }
        
        try {
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
            
            if (typeof window.updateContinueButton === 'function') {
                window.updateContinueButton();
            }
            
            // ✅ Показываем индикатор сохранения
            showSaveIndicator('saved');
            
            return true;
        } catch (e) {
            console.error('❌ Ошибка сохранения:', e);
            showSaveIndicator('error');
            return false;
        }
    };
    
    window.loadGame = function() {
        try {
            return loadGameFromStorage();
        } catch (e) {
            console.error('❌ Ошибка загрузки:', e);
            return false;
        }
    };
    
    window.resetGame = function() {
        window.gameState = JSON.parse(JSON.stringify(defaultGameState));
        window.gameMetrics = JSON.parse(JSON.stringify(defaultGameMetrics));
        window.gameMetrics.startTime = Date.now();
        window.gameMetrics.sessions = 1;
        localStorage.removeItem('cosmicBlocksSave');
        console.log('🔄 Игра сброшена');
        return true;
    };
    
    window.updateContinueButton = function() {
        const continueBtn = document.getElementById('continueBtn');
        if (!continueBtn) return;
        
        const hasSave = localStorage.getItem('cosmicBlocksSave') !== null;
        
        if (hasSave) {
            continueBtn.className = 'btn save-available';
            continueBtn.title = 'Продолжить сохраненную игру';
            
            try {
                const saved = localStorage.getItem('cosmicBlocksSave');
                if (saved) {
                    const data = JSON.parse(saved);
                    const timeAgo = Math.floor((Date.now() - data.timestamp) / (1000 * 60));
                    let timeText;
                    
                    if (timeAgo < 1) timeText = 'только что';
                    else if (timeAgo < 60) timeText = timeAgo + ' мин назад';
                    else if (timeAgo < 1440) timeText = Math.floor(timeAgo / 60) + ' ч назад';
                    else timeText = Math.floor(timeAgo / 1440) + ' д назад';
                    
                    continueBtn.title = 'Продолжить игру (' + timeText + ')';
                }
            } catch (e) {}
        } else {
            continueBtn.className = 'btn no-save';
            continueBtn.title = 'Нет сохраненной игры';
        }
    };
    
    // ✅ Автосохранение каждые 30 секунд
    function startAutoSave() {
        if (autoSaveInterval) clearInterval(autoSaveInterval);
        
        autoSaveInterval = setInterval(function() {
            if (window.gameState && window.gameState.gameActive) {
                window.saveGame();
                console.log('🔄 Автосохранение выполнено');
            }
        }, AUTO_SAVE_INTERVAL);
        
        console.log('⏱️ Автосохранение запущено (каждые 30 сек)');
    }
    
    // ✅ Индикатор сохранения
    function showSaveIndicator(status) {
        let indicator = document.getElementById('saveIndicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'saveIndicator';
            indicator.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 8px 16px; background: rgba(0, 0, 0, 0.8); color: #4CAF50; border-radius: 8px; font-size: 0.9em; z-index: 9999; opacity: 0; transition: opacity 0.3s; pointer-events: none;';
            document.body.appendChild(indicator);
        }
        
        const messages = {
            saving: '💾 Сохранение...',
            saved: '✅ Сохранено',
            error: '❌ Ошибка сохранения'
        };
        
        indicator.textContent = messages[status] || '';
        indicator.style.opacity = '1';
        indicator.style.color = status === 'error' ? '#f44336' : '#4CAF50';
        
        if (status !== 'saving') {
            setTimeout(function() {
                indicator.style.opacity = '0';
            }, 2000);
        }
    }
    
    // ✅ Инициализация при загрузке
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }
    
    // ✅ Debug интерфейс
    window.debugSaveSystem = {
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
                        размер: saved.length + ' байт'
                    });
                } catch (e) {
                    console.error('Ошибка парсинга сохранения:', e);
                }
            }
        },
        
        checkState: function() {
            console.log('=== ТЕКУЩЕЕ СОСТОЯНИЕ ===');
            console.log('gameState:', window.gameState);
            console.log('gameMetrics:', window.gameMetrics);
        },
        
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
})();