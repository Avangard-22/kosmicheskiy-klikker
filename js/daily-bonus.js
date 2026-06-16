// js/daily-bonus.js
(function() {
'use strict';

const dailyRewards = [
    { day: 1, type: 'crystals', amount: 100, icon: '💎', name: '100 Кристаллов' },
    { day: 2, type: 'crystals', amount: 150, icon: '💎', name: '150 Кристаллов' },
    { day: 3, type: 'crystals', amount: 200, icon: '💎', name: '200 Кристаллов' },
    { day: 4, type: 'boost', boost: 'timeWarp', icon: '⏳', name: 'Искажение времени' },
    { day: 5, type: 'crystals', amount: 300, icon: '💎', name: '300 Кристаллов' },
    { day: 6, type: 'boost', boost: 'crystalBoost', icon: '💰', name: 'Усилитель кристаллов' },
    { day: 7, type: 'crystals', amount: 500, icon: '🎁', name: 'Бонус недели: 500 💎' },
    { day: 8, type: 'crystals', amount: 400, icon: '💎', name: '400 Кристаллов' },
    { day: 9, type: 'boost', boost: 'powerSurge', icon: '⚡', name: 'Скачок силы' },
    { day: 10, type: 'crystals', amount: 500, icon: '💎', name: '500 Кристаллов' },
    { day: 11, type: 'upgrade', upgrade: 'clickPower', levels: 2, icon: '👊', name: '+2 уровня Силы' },
    { day: 12, type: 'crystals', amount: 600, icon: '💎', name: '600 Кристаллов' },
    { day: 13, type: 'boost', boost: 'crystalBoost', icon: '💰', name: 'Усилитель кристаллов' },
    { day: 14, type: 'crystals', amount: 1000, icon: '🎁', name: 'Бонус 2 недели: 1K 💎' },
    { day: 15, type: 'crystals', amount: 800, icon: '💎', name: '800 Кристаллов' },
    { day: 16, type: 'upgrade', upgrade: 'critChance', levels: 3, icon: '🎯', name: '+3 уровня Крита' },
    { day: 17, type: 'crystals', amount: 900, icon: '💎', name: '900 Кристаллов' },
    { day: 18, type: 'boost', boost: 'powerSurge', icon: '⚡', name: 'Скачок силы' },
    { day: 19, type: 'crystals', amount: 1000, icon: '💎', name: '1000 Кристаллов' },
    { day: 20, type: 'upgrade', upgrade: 'helperDamage', levels: 2, icon: '🤖', name: '+2 уровня Bobo' },
    { day: 21, type: 'crystals', amount: 2000, icon: '🎁', name: 'Бонус 3 недели: 2K 💎' },
    { day: 22, type: 'crystals', amount: 1500, icon: '💎', name: '1500 Кристаллов' },
    { day: 23, type: 'boost', boost: 'timeWarp', icon: '⏳', name: 'Искажение времени' },
    { day: 24, type: 'crystals', amount: 2000, icon: '💎', name: '2000 Кристаллов' },
    { day: 25, type: 'upgrade', upgrade: 'critMultiplier', levels: 3, icon: '⭐', name: '+3 уровня Множителя' },
    { day: 26, type: 'crystals', amount: 2500, icon: '💎', name: '2500 Кристаллов' },
    { day: 27, type: 'boost', boost: 'crystalBoost', icon: '💰', name: 'Усилитель кристаллов' },
    { day: 28, type: 'crystals', amount: 3000, icon: '💎', name: '3000 Кристаллов' },
    { day: 29, type: 'upgrade', upgrade: 'all', levels: 5, icon: '🚀', name: '+5 ко всем улучшениям' },
    { day: 30, type: 'crystals', amount: 10000, icon: '👑', name: 'ГРАНД ФИНАЛ: 10K 💎!' }
];

let dailyBonusData = {
    lastClaimDate: null,
    currentDay: 1,
    totalClaimed: 0,
    streak: 0
};

let timerInterval = null;
let iconCreated = false;

function init() {
    loadDailyBonusData();
    createBonusIcon();
    startTimer();
    console.log('✅ Daily bonus system initialized');
}

function loadDailyBonusData() {
    try {
        // ✅ Приоритет 1: из gameState (из облака)
        if (window.gameState && window.gameState.dailyBonus && 
            window.gameState.dailyBonus.lastClaimDate !== undefined) {
            dailyBonusData = {
                lastClaimDate: window.gameState.dailyBonus.lastClaimDate || null,
                currentDay: window.gameState.dailyBonus.currentDay || 1,
                totalClaimed: window.gameState.dailyBonus.totalClaimed || 0,
                streak: window.gameState.dailyBonus.streak || 0
            };
            console.log('✅ dailyBonusData загружен из gameState (облако):', dailyBonusData);
            return;
        }
                  
            // Синхронизируем в gameState
            if (window.gameState) {
                window.gameState.dailyBonus = { ...dailyBonusData };
            }
        }
    } catch (e) {
        console.error('❌ Ошибка загрузки ежедневного бонуса:', e);
        resetDailyBonus();
    }
}

function saveDailyBonusData() {
    try {
        localStorage.setItem('cosmicDailyBonus', JSON.stringify(dailyBonusData));
        
        // ✅ Сохраняем в gameState для облачной синхронизации
        if (window.gameState) {
            window.gameState.dailyBonus = { ...dailyBonusData };
            console.log('💾 dailyBonusData сохранён в gameState для облака');
        }
    } catch (e) {
        console.error('❌ Ошибка сохранения ежедневного бонуса:', e);
    }
}

function resetDailyBonus() {
    dailyBonusData = { lastClaimDate: null, currentDay: 1, totalClaimed: 0, streak: 0 };
    saveDailyBonusData();
}

function checkDailyBonus() {
    updateTimerDisplay();
    updateWelcomeButton();
}

/**
 * 🎨 Создание иконки бонуса в рабочей зоне
 */
function updateWelcomeButton() {
    const btn = document.getElementById('dailyBonusWelcomeBtn');
    if (!btn) return;

    const today = new Date().toDateString();
    const isAvailable = dailyBonusData.lastClaimDate !== today && dailyBonusData.currentDay <= 30;

    if (isAvailable) {
        btn.classList.add('available');
        btn.classList.remove('claimed');
    } else {
        btn.classList.remove('available');
        btn.classList.add('claimed');
    }
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    const timerEl = document.getElementById('dailyBonusTimer');
    if (!timerEl) return;

    const today = new Date().toDateString();
    const isAvailable = dailyBonusData.lastClaimDate !== today && dailyBonusData.currentDay <= 30;

    if (isAvailable) {
        timerEl.textContent = '✅ Доступно!';
        timerEl.style.color = '#4CAF50';
        return;
    }

    if (dailyBonusData.currentDay > 30) {
        timerEl.textContent = '🎉 Завершено';
        timerEl.style.color = '#FFD700';
        return;
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    timerEl.style.color = '#4FC3F7';
}

function injectStyles() {
    if (document.getElementById('daily-bonus-welcome-styles')) return;

    const style = document.createElement('style');
    style.id = 'daily-bonus-welcome-styles';
    style.textContent = `
        .daily-bonus-container {
            margin: 20px 0;
            display: flex;
            justify-content: center;
        }

        .daily-bonus-welcome-btn {
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 140, 0, 0.2));
            border: 2px solid #FFD700;
            border-radius: 15px;
            padding: 15px 30px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            min-width: 200px;
            box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
        }

        .daily-bonus-welcome-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
        }

        .daily-bonus-welcome-btn:active {
            transform: scale(0.95);
        }

        .daily-bonus-welcome-btn.available {
            animation: dailyBonusPulse 2s infinite;
        }

        .daily-bonus-welcome-btn.claimed {
            opacity: 0.6;
            border-color: #666;
            background: rgba(100, 100, 100, 0.2);
        }

        .daily-bonus-icon {
            font-size: 3em;
            filter: drop-shadow(0 2px 8px rgba(255, 215, 0, 0.6));
        }

        .daily-bonus-label {
            color: #FFD700;
            font-family: 'Orbitron', sans-serif;
            font-weight: bold;
            font-size: 1em;
        }

        .daily-bonus-timer {
            font-family: 'Orbitron', monospace;
            font-size: 0.9em;
            font-weight: bold;
        }

        @keyframes dailyBonusPulse {
            0%, 100% { 
                transform: scale(1); 
                box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
            }
            50% { 
                transform: scale(1.05); 
                box-shadow: 0 6px 25px rgba(255, 215, 0, 0.6);
            }
        }

        .daily-bonus-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            z-index: 3000;
            display: none;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .daily-bonus-modal.visible {
            display: flex;
            opacity: 1;
        }

        .daily-bonus-modal-content {
            background: linear-gradient(135deg, rgba(20, 20, 40, 0.98), rgba(10, 10, 30, 0.98));
            border: 3px solid #FFD700;
            border-radius: 20px;
            padding: 25px;
            width: 90%;
            max-width: 600px;
            max-height: 85vh;
            overflow-y: auto;
            box-shadow: 0 0 50px rgba(255, 215, 0, 0.4);
            position: relative;
            transform: scale(0.9);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .daily-bonus-modal.visible .daily-bonus-modal-content {
            transform: scale(1);
        }

        .daily-bonus-close-btn {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #fff;
            font-size: 1.5em;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .daily-bonus-close-btn:hover {
            background: rgba(255, 0, 0, 0.3);
        }

        .daily-bonus-modal-title {
            text-align: center;
            color: #FFD700;
            font-size: 1.6em;
            margin: 0 0 15px 0;
            font-family: 'Orbitron', sans-serif;
        }

        .daily-bonus-streak {
            text-align: center;
            color: #fff;
            font-size: 1em;
            margin-bottom: 20px;
            padding: 12px;
            background: rgba(255, 215, 0, 0.1);
            border-radius: 10px;
            border: 1px solid rgba(255, 215, 0, 0.3);
        }

        .daily-bonus-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
            gap: 12px;
            margin-bottom: 20px;
        }

        .daily-bonus-cell {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 12px 8px;
            text-align: center;
            border: 2px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s;
            cursor: default;
        }

        .daily-bonus-cell.claimed {
            opacity: 0.5;
            filter: grayscale(100%);
            border-color: #4CAF50;
        }

        .daily-bonus-cell.current {
            border: 2px solid #FFD700;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
            animation: dailyBonusPulse 2s infinite;
            background: rgba(255, 215, 0, 0.1);
        }

        .daily-bonus-cell.locked {
            opacity: 0.4;
        }

        .daily-bonus-cell-icon {
            font-size: 2em;
            margin-bottom: 5px;
        }

        .daily-bonus-cell-day {
            font-size: 0.75em;
            color: #FFD700;
            font-weight: bold;
            margin-bottom: 3px;
        }

        .daily-bonus-cell-name {
            font-size: 0.65em;
            color: #fff;
            line-height: 1.2;
        }

        .daily-bonus-claim-btn {
            width: 100%;
            padding: 15px 30px;
            font-size: 1.2em;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-family: 'Orbitron', sans-serif;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.5);
            transition: all 0.2s;
            min-height: 50px;
        }

        .daily-bonus-claim-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(76, 175, 80, 0.6);
        }

        .daily-bonus-claim-btn:active:not(:disabled) {
            transform: scale(0.98);
        }

        .daily-bonus-claim-btn:disabled {
            background: #666;
            cursor: not-allowed;
            opacity: 0.6;
        }

        @media (max-width: 480px) {
            .daily-bonus-grid {
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
            }
            .daily-bonus-cell {
                padding: 10px 6px;
            }
            .daily-bonus-cell-icon {
                font-size: 1.6em;
            }
            .daily-bonus-cell-name {
                font-size: 0.6em;
            }
            .daily-bonus-welcome-btn {
                min-width: 160px;
                padding: 12px 20px;
            }
            .daily-bonus-icon {
                font-size: 2.5em;
            }
        }

        @keyframes dailyBonusSlideDown {
            from { top: -100px; opacity: 0; transform: translateX(-50%) scale(0.8); }
            to { top: 20%; opacity: 1; transform: translateX(-50%) scale(1); }
        }
    `;
    document.head.appendChild(style);
}

function setupEventHandlers() {
    const welcomeBtn = document.getElementById('dailyBonusWelcomeBtn');
    const closeBtn = document.getElementById('dailyBonusCloseBtn');
    const claimBtn = document.getElementById('dailyBonusClaimBtn');
    const modal = document.getElementById('dailyBonusModal');

    if (welcomeBtn) {
        welcomeBtn.addEventListener('click', showModal);
        welcomeBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            showModal();
        }, { passive: false });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', hideModal);
        closeBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            hideModal();
        }, { passive: false });
    }

    if (claimBtn) {
        claimBtn.addEventListener('click', claimDailyBonus);
        claimBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            claimDailyBonus();
        }, { passive: false });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal();
        });
    }
}

function showModal() {
    const modal = document.getElementById('dailyBonusModal');
    if (!modal) return;

    updateModalContent();
    modal.classList.add('visible');
    modalVisible = true;
}

function hideModal() {
    const modal = document.getElementById('dailyBonusModal');
    if (!modal) return;

    modal.classList.remove('visible');
    modalVisible = false;
}

function updateModalContent() {
    const grid = document.getElementById('dailyBonusGrid');
    const streakInfo = document.getElementById('dailyBonusStreak');
    const claimBtn = document.getElementById('dailyBonusClaimBtn');

    if (!grid || !streakInfo || !claimBtn) return;

    grid.innerHTML = '';
    streakInfo.textContent = `🔥 Серия: ${dailyBonusData.streak} дн. | ✅ Получено: ${dailyBonusData.totalClaimed}/30`;

    dailyRewards.forEach((reward, index) => {
        const day = index + 1;
        const cell = document.createElement('div');
        cell.className = 'daily-bonus-cell';

        const isClaimed = dailyBonusData.currentDay > day;
        const isCurrent = dailyBonusData.currentDay === day;

        if (isClaimed) {
            cell.classList.add('claimed');
            cell.innerHTML = `
                <div class="daily-bonus-cell-icon">✅</div>
                <div class="daily-bonus-cell-day">День ${day}</div>
            `;
        } else if (isCurrent) {
            cell.classList.add('current');
            cell.innerHTML = `
                <div class="daily-bonus-cell-icon">${reward.icon}</div>
                <div class="daily-bonus-cell-day">День ${day}</div>
                <div class="daily-bonus-cell-name">${reward.name}</div>
            `;
        } else {
            cell.classList.add('locked');
            cell.innerHTML = `
                <div class="daily-bonus-cell-icon">🔒</div>
                <div class="daily-bonus-cell-day">День ${day}</div>
            `;
        }

        grid.appendChild(cell);
    });

    const today = new Date().toDateString();
    const isAvailable = dailyBonusData.lastClaimDate !== today && dailyBonusData.currentDay <= 30;

    if (isAvailable) {
        claimBtn.disabled = false;
        claimBtn.textContent = ` Получить: ${dailyRewards[dailyBonusData.currentDay - 1].name}`;
    } else {
        claimBtn.disabled = true;
        claimBtn.textContent = dailyBonusData.currentDay > 30 ? '🎉 Цикл завершён!' : '✅ Уже получено сегодня';
    }
}

function claimDailyBonus() {
    const today = new Date().toDateString();

    if (dailyBonusData.lastClaimDate === today) {
        showNotification('⏰ Вы уже получили бонус сегодня!', '#ff9800');
        return;
    }

    if (dailyBonusData.currentDay > 30) {
        showNotification('🎉 Цикл бонусов завершён!', '#4CAF50');
        return;
    }

    const reward = dailyRewards[dailyBonusData.currentDay - 1];
    applyReward(reward);

    dailyBonusData.lastClaimDate = today;
    dailyBonusData.streak++;
    dailyBonusData.totalClaimed++;
    if (dailyBonusData.currentDay < 30) dailyBonusData.currentDay++;

    saveDailyBonusData();
    updateModalContent();
    updateWelcomeButton();
    showRewardNotification(reward);

    const sound = document.getElementById('upgradeSound');
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }

    if (window.telegramHaptic && window.telegramHaptic.success) {
        window.telegramHaptic.success();
    } else if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }

    if (typeof window.saveGame === 'function') window.saveGame();
}

function applyReward(reward) {
    if (!window.gameState) return;
    if (!window.gameState.shopItems) window.gameState.shopItems = {};

    switch (reward.type) {
        case 'crystals':
            window.gameState.coins += reward.amount;
            break;
        case 'boost':
            const duration = window.shopSystem?.config?.[reward.boost]?.duration || getBoostDuration(reward.boost);
            if (!window.gameState.shopItems[reward.boost]) {
                window.gameState.shopItems[reward.boost] = { purchased: false, active: false, timeLeft: 0 };
            }
            window.gameState.shopItems[reward.boost].active = true;
            window.gameState.shopItems[reward.boost].timeLeft = duration;
            window.gameState.shopItems[reward.boost].purchased = true;
            if (window.shopSystem?.updateShopDisplay) window.shopSystem.updateShopDisplay();
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
            if (window.gameFunctions?.calculateClickPower) {
                window.gameState.clickPower = window.gameFunctions.calculateClickPower();
            }
            break;
    }

    if (window.gameFunctions) {
        if (window.gameFunctions.updateHUD) window.gameFunctions.updateHUD();
        if (window.gameFunctions.updateUpgradeButtons) window.gameFunctions.updateUpgradeButtons();
    }
}

function getBoostDuration(boostId) {
    const durations = { timeWarp: 30000, crystalBoost: 60000, powerSurge: 45000 };
    return durations[boostId] || 30000;
}

function showNotification(text, color) {
    const notif = document.createElement('div');
    notif.textContent = text;
    notif.style.cssText = `
        position: fixed; top: 20%; left: 50%; transform: translateX(-50%);
        background: ${color || '#4CAF50'}; color: #fff;
        padding: 15px 25px; border-radius: 12px; z-index: 4000;
        text-align: center; font-family: 'Orbitron', sans-serif; font-weight: bold;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5); border: 2px solid #fff;
        animation: dailyBonusSlideDown 0.5s ease-out;
        max-width: 90%; width: 350px; pointer-events: none;
    `;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.transition = 'opacity 0.5s';
        notif.style.opacity = '0';
        setTimeout(() => { if (notif.parentNode) notif.parentNode.removeChild(notif); }, 500);
    }, 2500);
}

function showRewardNotification(reward) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed; top: 20%; left: 50%; transform: translateX(-50%);
        background: linear-gradient(135deg, rgba(255,215,0,0.95), rgba(255,140,0,0.95));
        color: #000; padding: 20px 30px; border-radius: 15px; z-index: 4000;
        text-align: center; font-family: 'Orbitron', sans-serif; font-weight: bold;
        box-shadow: 0 10px 40px rgba(255,215,0,0.5); border: 3px solid #fff;
        animation: dailyBonusSlideDown 0.5s ease-out; max-width: 90%; width: 400px;
    `;
    notif.innerHTML = `
        <div style="font-size:2em;margin-bottom:10px;">${reward.icon}</div>
        <div style="font-size:1.3em;margin-bottom:5px;">🎁 ЕЖЕДНЕВНЫЙ БОНУС!</div>
        <div style="font-size:1.1em;margin-bottom:10px;">День ${dailyBonusData.totalClaimed}/30</div>
        <div style="font-size:1.2em;color:#fff;">${reward.name}</div>
    `;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.transition = 'all 0.5s ease-in';
        notif.style.top = '-100px';
        notif.style.opacity = '0';
        setTimeout(() => { if (notif.parentNode) notif.parentNode.removeChild(notif); }, 500);
    }, 3000);
}

function checkOnLoad() {
    const today = new Date().toDateString();
    if (dailyBonusData.lastClaimDate) {
        const lastDate = new Date(dailyBonusData.lastClaimDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) dailyBonusData.streak = 0;
    }
    saveDailyBonusData();
}

window.dailyBonusSystem = {
    init,
    claimDailyBonus,
    showModal,
    hideModal,
    resetDailyBonus,
    getProgress: () => ({
        currentDay: dailyBonusData.currentDay,
        totalClaimed: dailyBonusData.totalClaimed,
        streak: dailyBonusData.streak
    })
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => { init(); checkOnLoad(); }, 500));
} else {
    setTimeout(() => { init(); checkOnLoad(); }, 500);
}
})();
