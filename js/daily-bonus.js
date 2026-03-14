// Система ежедневных бонусов (30 дней)
(function() {
    'use strict';
    
    // ✅ Конфигурация наград на 30 дней
    const dailyRewards = [
        // Неделя 1: Базовые награды
        { day: 1, type: 'crystals', amount: 100, icon: '💎', name: '100 Кристаллов' },
        { day: 2, type: 'crystals', amount: 150, icon: '💎', name: '150 Кристаллов' },
        { day: 3, type: 'crystals', amount: 200, icon: '💎', name: '200 Кристаллов' },
        { day: 4, type: 'boost', boost: 'timeWarp', icon: '⏳', name: 'Искажение времени' },
        { day: 5, type: 'crystals', amount: 300, icon: '💎', name: '300 Кристаллов' },
        { day: 6, type: 'boost', boost: 'crystalBoost', icon: '💰', name: 'Усилитель кристаллов' },
        { day: 7, type: 'crystals', amount: 500, icon: '🎁', name: 'Недельный бонус: 500 Кристаллов' },
        
        // Неделя 2: Улучшенные награды
        { day: 8, type: 'crystals', amount: 400, icon: '💎', name: '400 Кристаллов' },
        { day: 9, type: 'boost', boost: 'powerSurge', icon: '⚡', name: 'Скачок силы' },
        { day: 10, type: 'crystals', amount: 500, icon: '💎', name: '500 Кристаллов' },
        { day: 11, type: 'upgrade', upgrade: 'clickPower', levels: 2, icon: '👊', name: '+2 уровня Силы' },
        { day: 12, type: 'crystals', amount: 600, icon: '💎', name: '600 Кристаллов' },
        { day: 13, type: 'boost', boost: 'crystalBoost', icon: '💰', name: 'Усилитель кристаллов' },
        { day: 14, type: 'crystals', amount: 1000, icon: '🎁', name: 'Бонус 2 недели: 1000 Кристаллов' },
        
        // Неделя 3: Ценные награды
        { day: 15, type: 'crystals', amount: 800, icon: '💎', name: '800 Кристаллов' },
        { day: 16, type: 'upgrade', upgrade: 'critChance', levels: 3, icon: '🎯', name: '+3 уровня Крита' },
        { day: 17, type: 'crystals', amount: 900, icon: '💎', name: '900 Кристаллов' },
        { day: 18, type: 'boost', boost: 'powerSurge', icon: '⚡', name: 'Скачок силы' },
        { day: 19, type: 'crystals', amount: 1000, icon: '💎', name: '1000 Кристаллов' },
        { day: 20, type: 'upgrade', upgrade: 'helperDamage', levels: 2, icon: '🤖', name: '+2 уровня Bobo' },
        { day: 21, type: 'crystals', amount: 2000, icon: '🎁', name: 'Бонус 3 недели: 2000 Кристаллов' },
        
        // Неделя 4: Премиум награды
        { day: 22, type: 'crystals', amount: 1500, icon: '💎', name: '1500 Кристаллов' },
        { day: 23, type: 'boost', boost: 'timeWarp', icon: '⏳', name: 'Искажение времени' },
        { day: 24, type: 'crystals', amount: 2000, icon: '💎', name: '2000 Кристаллов' },
        { day: 25, type: 'upgrade', upgrade: 'critMultiplier', levels: 3, icon: '⭐', name: '+3 уровня Множителя' },
        { day: 26, type: 'crystals', amount: 2500, icon: '💎', name: '2500 Кристаллов' },
        { day: 27, type: 'boost', boost: 'crystalBoost', icon: '💰', name: 'Усилитель кристаллов' },
        { day: 28, type: 'crystals', amount: 3000, icon: '💎', name: '3000 Кристаллов' },
        
        // Финальные награды
        { day: 29, type: 'upgrade', upgrade: 'all', levels: 5, icon: '🚀', name: '+5 ко всем улучшениям' },
        { day: 30, type: 'crystals', amount: 10000, icon: '👑', name: 'ГРАНД ФИНАЛ: 10000 Кристаллов!' }
    ];
    
    // ✅ Состояние системы
    let dailyBonusData = {
        lastClaimDate: null,
        currentDay: 1,
        totalClaimed: 0,
        streak: 0
    };
    
    // ✅ Инициализация
    function init() {
        loadDailyBonusData();
        createDailyBonusUI();
        checkDailyBonus();
    }
    
    // ✅ Загрузка данных
    function loadDailyBonusData() {
        const saved = localStorage.getItem('cosmicDailyBonus');
        if (saved) {
            try {
                dailyBonusData = JSON.parse(saved);
            } catch (e) {
                console.error('Ошибка загрузки ежедневного бонуса:', e);
                resetDailyBonus();
            }
        }
    }
    
    // ✅ Сохранение данных
    function saveDailyBonusData() {
        localStorage.setItem('cosmicDailyBonus', JSON.stringify(dailyBonusData));
    }
    
    // ✅ Сброс прогресса
    function resetDailyBonus() {
        dailyBonusData = {
            lastClaimDate: null,
            currentDay: 1,
            totalClaimed: 0,
            streak: 0
        };
        saveDailyBonusData();
    }
    
    // ✅ Проверка доступности бонуса
    function checkDailyBonus() {
        const today = new Date().toDateString();
        
        if (dailyBonusData.lastClaimDate !== today) {
            // Бонус доступен
            showDailyBonusButton();
        } else {
            // Уже получен сегодня
            hideDailyBonusButton();
        }
    }
    
    // ✅ Создание UI
    function createDailyBonusUI() {
        // Кнопка в HUD
        const dailyBonusBtn = document.createElement('button');
        dailyBonusBtn.id = 'dailyBonusBtn';
        dailyBonusBtn.innerHTML = '🎁';
        dailyBonusBtn.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            width: 50px;
            height: 50px;
            border: none;
            border-radius: 10px;
            font-size: 1.5em;
            cursor: pointer;
            z-index: 30;
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #000;
            box-shadow: 0 4px 15px rgba(255, 215, 0, 0.5);
            transition: all 0.2s;
            animation: dailyBonusPulse 2s infinite;
        `;
        dailyBonusBtn.addEventListener('click', showDailyBonusPanel);
        dailyBonusBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            showDailyBonusPanel();
        }, { passive: false });
        document.body.appendChild(dailyBonusBtn);
        
        // Панель бонусов
        const panel = document.createElement('div');
        panel.id = 'dailyBonusPanel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            background: linear-gradient(135deg, rgba(20, 20, 40, 0.98), rgba(10, 10, 30, 0.98));
            border: 3px solid #FFD700;
            border-radius: 20px;
            padding: 20px;
            z-index: 2000;
            display: none;
            flex-direction: column;
            overflow-y: auto;
            box-shadow: 0 0 50px rgba(255, 215, 0, 0.3);
        `;
        
        // Заголовок
        const title = document.createElement('h3');
        title.textContent = '🎁 Ежедневный Бонус';
        title.style.cssText = `
            text-align: center;
            color: #FFD700;
            font-size: 1.5em;
            margin: 0 0 15px 0;
            font-family: 'Orbitron', sans-serif;
        `;
        panel.appendChild(title);
        
        // Информация о стрике
        const streakInfo = document.createElement('div');
        streakInfo.id = 'dailyBonusStreak';
        streakInfo.style.cssText = `
            text-align: center;
            color: #fff;
            font-size: 1em;
            margin-bottom: 15px;
            padding: 10px;
            background: rgba(255, 215, 0, 0.1);
            border-radius: 10px;
        `;
        panel.appendChild(streakInfo);
        
        // Сетка наград
        const grid = document.createElement('div');
        grid.id = 'dailyBonusGrid';
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
            gap: 10px;
            margin-bottom: 20px;
        `;
        panel.appendChild(grid);
        
        // Кнопка получения
        const claimBtn = document.createElement('button');
        claimBtn.id = 'dailyBonusClaimBtn';
        claimBtn.textContent = '🎁 Получить награду';
        claimBtn.style.cssText = `
            padding: 15px 30px;
            font-size: 1.1em;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-family: 'Orbitron', sans-serif;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.5);
            transition: all 0.2s;
        `;
        claimBtn.addEventListener('click', claimDailyBonus);
        panel.appendChild(claimBtn);
        
        // Кнопка закрытия
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            color: #fff;
            font-size: 1.5em;
            cursor: pointer;
            z-index: 10;
        `;
        closeBtn.addEventListener('click', hideDailyBonusPanel);
        panel.appendChild(closeBtn);
        
        document.body.appendChild(panel);
        
        // Добавляем CSS анимации
        if (!document.getElementById('daily-bonus-animations')) {
            const style = document.createElement('style');
            style.id = 'daily-bonus-animations';
            style.textContent = `
                @keyframes dailyBonusPulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 4px 15px rgba(255, 215, 0, 0.5); }
                    50% { transform: scale(1.05); box-shadow: 0 6px 20px rgba(255, 215, 0, 0.7); }
                }
                .daily-bonus-claimed {
                    opacity: 0.5;
                    filter: grayscale(100%);
                }
                .daily-bonus-current {
                    border: 2px solid #FFD700;
                    box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
                    animation: dailyBonusPulse 1s infinite;
                }
                .daily-bonus-locked {
                    opacity: 0.3;
                }
            `;
            document.head.appendChild(style);
        }
        
        updateDailyBonusGrid();
    }
    
    // ✅ Обновление сетки наград
    function updateDailyBonusGrid() {
        const grid = document.getElementById('dailyBonusGrid');
        const streakInfo = document.getElementById('dailyBonusStreak');
        const claimBtn = document.getElementById('dailyBonusClaimBtn');
        
        if (!grid || !streakInfo || !claimBtn) return;
        
        grid.innerHTML = '';
        
        // Обновляем информацию о стрике
        streakInfo.textContent = `Текущая серия: ${dailyBonusData.streak} дней | Всего получено: ${dailyBonusData.totalClaimed}/30`;
        
        // Создаём ячейки для каждого дня
        dailyRewards.forEach((reward, index) => {
            const day = index + 1;
            const cell = document.createElement('div');
            cell.style.cssText = `
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
                padding: 10px;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s;
            `;
            
            // Статус награды
            const isClaimed = dailyBonusData.currentDay > day;
            const isCurrent = dailyBonusData.currentDay === day;
            const isLocked = dailyBonusData.currentDay < day;
            
            if (isClaimed) {
                cell.classList.add('daily-bonus-claimed');
                cell.innerHTML = `
                    <div style="font-size: 1.5em;">✅</div>
                    <div style="font-size: 0.7em; color: #888;">День ${day}</div>
                `;
            } else if (isCurrent) {
                cell.classList.add('daily-bonus-current');
                cell.innerHTML = `
                    <div style="font-size: 1.5em;">${reward.icon}</div>
                    <div style="font-size: 0.7em; color: #FFD700;">День ${day}</div>
                    <div style="font-size: 0.65em; color: #fff; margin-top: 3px;">${reward.name}</div>
                `;
            } else {
                cell.classList.add('daily-bonus-locked');
                cell.innerHTML = `
                    <div style="font-size: 1.5em;">🔒</div>
                    <div style="font-size: 0.7em; color: #888;">День ${day}</div>
                `;
            }
            
            grid.appendChild(cell);
        });
        
        // Обновляем кнопку получения
        const today = new Date().toDateString();
        if (dailyBonusData.lastClaimDate === today || dailyBonusData.currentDay > 30) {
            claimBtn.disabled = true;
            claimBtn.style.background = '#666';
            claimBtn.style.cursor = 'not-allowed';
            claimBtn.textContent = dailyBonusData.currentDay > 30 ? '🎉 Цикл завершён!' : '✅ Уже получено';
        } else {
            claimBtn.disabled = false;
            claimBtn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            claimBtn.style.cursor = 'pointer';
            const currentReward = dailyRewards[dailyBonusData.currentDay - 1];
            claimBtn.textContent = `🎁 Получить: ${currentReward.name}`;
        }
    }
    
    // ✅ Показ кнопки бонуса
    function showDailyBonusButton() {
        const btn = document.getElementById('dailyBonusBtn');
        if (btn) {
            btn.style.display = 'block';
            btn.style.animation = 'dailyBonusPulse 2s infinite';
        }
    }
    
    // ✅ Скрытие кнопки бонуса
    function hideDailyBonusButton() {
        const btn = document.getElementById('dailyBonusBtn');
        if (btn) {
            btn.style.display = 'none';
            btn.style.animation = 'none';
        }
    }
    
    // ✅ Показ панели бонусов
    function showDailyBonusPanel() {
        const panel = document.getElementById('dailyBonusPanel');
        if (panel) {
            panel.style.display = 'flex';
            updateDailyBonusGrid();
        }
    }
    
    // ✅ Скрытие панели бонусов
    function hideDailyBonusPanel() {
        const panel = document.getElementById('dailyBonusPanel');
        if (panel) {
            panel.style.display = 'none';
        }
    }
    
    // ✅ Получение бонуса
    function claimDailyBonus() {
        const today = new Date().toDateString();
        
        // Проверка: уже получено сегодня
        if (dailyBonusData.lastClaimDate === today) {
            alert('Вы уже получили ежедневный бонус сегодня!');
            return;
        }
        
        // Проверка: цикл завершён
        if (dailyBonusData.currentDay > 30) {
            alert('Поздравляем! Вы завершили полный цикл ежедневных бонусов!');
            return;
        }
        
        // Получаем текущую награду
        const reward = dailyRewards[dailyBonusData.currentDay - 1];
        
        // Применяем награду
        applyReward(reward);
        
        // Обновляем данные
        dailyBonusData.lastClaimDate = today;
        dailyBonusData.streak++;
        dailyBonusData.totalClaimed++;
        
        // Переход к следующему дню
        if (dailyBonusData.currentDay < 30) {
            dailyBonusData.currentDay++;
        }
        
        // Сохраняем
        saveDailyBonusData();
        
        // Обновляем UI
        updateDailyBonusGrid();
        hideDailyBonusButton();
        
        // Уведомление
        showRewardNotification(reward);
        
        // Звук
        playSound('upgradeSound');
        
        // Виброотдача
        if (window.telegramHaptic) {
            window.telegramHaptic.success();
        } else if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
        
        // Сохранение игры
        if (window.saveGame) {
            window.saveGame();
        }
    }
    
    // ✅ Применение награды
    function applyReward(reward) {
        if (!window.gameState) return;
        
        switch (reward.type) {
            case 'crystals':
                window.gameState.coins += reward.amount;
                break;
                
            case 'boost':
                if (!window.gameState.shopItems) {
                    window.gameState.shopItems = {
                        timeWarp: { purchased: false, active: false, timeLeft: 0 },
                        crystalBoost: { purchased: false, active: false, timeLeft: 0 },
                        powerSurge: { purchased: false, active: false, timeLeft: 0 }
                    };
                }
                if (window.gameState.shopItems[reward.boost]) {
                    window.gameState.shopItems[reward.boost].active = true;
                    window.gameState.shopItems[reward.boost].timeLeft = getBoostDuration(reward.boost);
                    window.gameState.shopItems[reward.boost].purchased = true;
                }
                break;
                
            case 'upgrade':
                if (reward.upgrade === 'all') {
                    window.gameState.clickUpgradeLevel += reward.levels;
                    window.gameState.critChanceUpgradeLevel += reward.levels;
                    window.gameState.critMultiplierUpgradeLevel += reward.levels;
                    window.gameState.helperUpgradeLevel += reward.levels;
                } else if (reward.upgrade === 'clickPower') {
                    window.gameState.clickUpgradeLevel += reward.levels;
                } else if (reward.upgrade === 'critChance') {
                    window.gameState.critChanceUpgradeLevel += reward.levels;
                    window.gameState.critChance = Math.min(1.0, 0.001 + window.gameState.critChanceUpgradeLevel * 0.001);
                } else if (reward.upgrade === 'critMultiplier') {
                    window.gameState.critMultiplierUpgradeLevel += reward.levels;
                    window.gameState.critMultiplier = 2.0 + window.gameState.critMultiplierUpgradeLevel * 0.2;
                } else if (reward.upgrade === 'helperDamage') {
                    window.gameState.helperUpgradeLevel += reward.levels;
                }
                // Пересчитываем силу клика
                if (window.calculateClickPower) {
                    window.gameState.clickPower = window.calculateClickPower();
                }
                break;
        }
        
        // Обновляем HUD
        if (window.updateHUD) {
            window.updateHUD();
        }
        if (window.updateUpgradeButtons) {
            window.updateUpgradeButtons();
        }
    }
    
    // ✅ Получение длительности буста
    function getBoostDuration(boostId) {
        const durations = {
            timeWarp: 30000,
            crystalBoost: 60000,
            powerSurge: 45000
        };
        return durations[boostId] || 30000;
    }
    
    // ✅ Уведомление о награде
    function showRewardNotification(reward) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.95), rgba(255, 140, 0, 0.95));
            color: #000;
            padding: 20px 30px;
            border-radius: 15px;
            z-index: 3000;
            text-align: center;
            font-family: 'Orbitron', sans-serif;
            font-weight: bold;
            box-shadow: 0 10px 40px rgba(255, 215, 0, 0.5);
            border: 3px solid #fff;
            animation: dailyBonusSlideDown 0.5s ease-out;
            max-width: 90%;
            width: 400px;
        `;
        
        notification.innerHTML = `
            <div style="font-size: 2em; margin-bottom: 10px;">${reward.icon}</div>
            <div style="font-size: 1.3em; margin-bottom: 5px;">🎁 ЕЖЕДНЕВНЫЙ БОНУС!</div>
            <div style="font-size: 1.1em; margin-bottom: 10px;">День ${dailyBonusData.totalClaimed}/30</div>
            <div style="font-size: 1.2em; color: #fff;">${reward.name}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transition = 'all 0.5s ease-in';
            notification.style.top = '-100px';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }, 3000);
        
        // Добавляем CSS анимации
        if (!document.getElementById('daily-bonus-notify-animations')) {
            const style = document.createElement('style');
            style.id = 'daily-bonus-notify-animations';
            style.textContent = `
                @keyframes dailyBonusSlideDown {
                    from { top: -100px; opacity: 0; transform: translateX(-50%) scale(0.8); }
                    to { top: 20%; opacity: 1; transform: translateX(-50%) scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // ✅ Звук
    function playSound(soundId) {
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }
    
    // ✅ Проверка при загрузке страницы
    function checkOnLoad() {
        const today = new Date().toDateString();
        
        // Проверка пропуска дней
        if (dailyBonusData.lastClaimDate) {
            const lastDate = new Date(dailyBonusData.lastClaimDate);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
            
            // Если пропустили больше 1 дня — сбрасываем стрик
            if (diffDays > 1) {
                dailyBonusData.streak = 0;
                // Не сбрасываем прогресс дней, только стрик
            }
        }
        
        saveDailyBonusData();
    }
    
    // ✅ Публичный API
    window.dailyBonusSystem = {
        init,
        claimDailyBonus,
        showDailyBonusPanel,
        hideDailyBonusPanel,
        resetDailyBonus,
        getProgress: () => ({
            currentDay: dailyBonusData.currentDay,
            totalClaimed: dailyBonusData.totalClaimed,
            streak: dailyBonusData.streak
        })
    };
    
    // ✅ Инициализация при загрузке
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                init();
                checkOnLoad();
            }, 500);
        });
    } else {
        setTimeout(() => {
            init();
            checkOnLoad();
        }, 500);
    }
})();