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
        
        // ✅ Приоритет 2: из localStorage
        const saved = localStorage.getItem('cosmicDailyBonus');
        if (saved) {
            dailyBonusData = JSON.parse(saved);
            console.log('✅ dailyBonusData загружен из localStorage:', dailyBonusData);
            
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

/**
 * 🎨 Создание иконки бонуса в рабочей зоне
 */
function createBonusIcon() {
    if (iconCreated) return;
    
    const icon = document.createElement('div');
    icon.id = 'dailyBonusIcon';
    icon.style.cssText = `
        position: fixed;
        bottom: 120px;     /* ✅ Левый нижний угол */
        left: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 140, 0, 0.3));
        border: 2px solid #FFD700;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
        font-family: 'Orbitron', sans-serif;
    `;
    
    icon.innerHTML = `
        <div id="dailyBonusDay" style="font-size: 0.65em; color: #FFD700; font-weight: bold; margin-bottom: 2px;">День 1</div>
        <div id="dailyBonusTimer" style="font-size: 0.5em; color: #fff; font-weight: bold;">00:00:00</div>
    `;
    
    icon.addEventListener('click', claimDailyBonus);
    icon.addEventListener('touchstart', (e) => {
        e.preventDefault();
        claimDailyBonus();
    }, { passive: false });
    
    document.body.appendChild(icon);
    iconCreated = true;
    console.log('✅ Daily bonus icon created at bottom-left');
}
    
    // Клик
    icon.addEventListener('click', claimDailyBonus);
    
    // Touch для мобильных
    icon.addEventListener('touchstart', (e) => {
        e.preventDefault();
        claimDailyBonus();
    }, { passive: false });
    
    document.body.appendChild(icon);
    iconCreated = true;
    console.log('✅ Daily bonus icon created');
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        updateIconDisplay();
    }, 1000);
}

function updateIconDisplay() {
    const dayEl = document.getElementById('dailyBonusDay');
    const timerEl = document.getElementById('dailyBonusTimer');
    const icon = document.getElementById('dailyBonusIcon');
    
    if (!dayEl || !timerEl || !icon) return;

    const today = new Date().toDateString();
    const isAvailable = dailyBonusData.lastClaimDate !== today && dailyBonusData.currentDay <= 30;

    dayEl.textContent = `День ${dailyBonusData.currentDay}`;

    if (isAvailable) {
        timerEl.textContent = '✅';
        timerEl.style.color = '#4CAF50';
        icon.style.borderColor = '#4CAF50';
        icon.style.animation = 'dailyBonusPulse 2s infinite';
    } else if (dailyBonusData.currentDay > 30) {
        timerEl.textContent = '🎉';
        timerEl.style.color = '#FFD700';
        icon.style.borderColor = '#FFD700';
        icon.style.animation = 'none';
    } else {
        updateTimerDisplay();
        icon.style.borderColor = '#FFD700';
        icon.style.animation = 'none';
    }
}

function updateTimerDisplay() {
    const timerEl = document.getElementById('dailyBonusTimer');
    if (!timerEl) return;

    const today = new Date().toDateString();
    const isAvailable = dailyBonusData.lastClaimDate !== today && dailyBonusData.currentDay <= 30;

    if (isAvailable) {
        timerEl.textContent = '✅';
        timerEl.style.color = '#4CAF50';
        return;
    }

    if (dailyBonusData.currentDay > 30) {
        timerEl.textContent = '🎉';
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

/**
 * 🎁 Получение бонуса
 */
function claimDailyBonus() {
    const today = new Date().toDateString();

    if (dailyBonusData.lastClaimDate === today) {
        showSmallNotification('⏰ Уже получено сегодня!', '#ff9800');
        return;
    }

    if (dailyBonusData.currentDay > 30) {
        showSmallNotification('🎉 Цикл завершён!', '#4CAF50');
        return;
    }

    const reward = dailyRewards[dailyBonusData.currentDay - 1];

    // ✅ БЛОКИРУЕМ синхронизацию
    if (typeof window.lockSync === 'function') {
        window.lockSync();
        console.log('🔒 [BONUS] Синхронизация заблокирована');
    }

    try {
        applyReward(reward);

        dailyBonusData.lastClaimDate = today;
        dailyBonusData.streak++;
        dailyBonusData.totalClaimed++;
        if (dailyBonusData.currentDay < 30) dailyBonusData.currentDay++;

        saveDailyBonusData();
        updateIconDisplay();
        showRewardNotification(reward);

        const sound = document.getElementById('upgradeSound');
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }

        if (window.telegramHaptic?.success) {
            window.telegramHaptic.success();
        } else if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }

        // ✅ Сохраняем игру
        if (typeof window.saveGame === 'function') {
            console.log('💾 [BONUS] Сохранение после получения бонуса...');
            window.saveGame();
        }
    } finally {
        // ✅ РАЗБЛОКИРУЕМ синхронизацию
        setTimeout(() => {
            if (typeof window.unlockSync === 'function') {
                window.unlockSync();
                console.log('🔓 [BONUS] Синхронизация разблокирована');
            }
        }, 300);
    }
}

function applyReward(reward) {
    if (!window.gameState) {
        console.warn('⚠️ [BONUS] gameState не инициализирован');
        return;
    }
    if (!window.gameState.shopItems) window.gameState.shopItems = {};

    switch (reward.type) {
        case 'crystals':
            window.gameState.coins += reward.amount;
            console.log(`💎 [BONUS] +${reward.amount} кристаллов`);
            break;
        case 'boost':
            const duration = window.shopSystem?.config?.[reward.boost]?.duration || getBoostDuration(reward.boost);
            if (!window.gameState.shopItems[reward.boost]) {
                window.gameState.shopItems[reward.boost] = { purchased: false, active: false, timeLeft: 0 };
            }
            window.gameState.shopItems[reward.boost].active = true;
            window.gameState.shopItems[reward.boost].timeLeft = duration;
            window.gameState.shopItems[reward.boost].purchased = true;
            console.log(`⚡ [BONUS] Активирован бустер ${reward.boost}`);
            if (window.shopSystem?.updateShopDisplay) window.shopSystem.updateShopDisplay();
            break;
        case 'upgrade':
            if (reward.upgrade === 'all') {
                window.gameState.clickUpgradeLevel += reward.levels;
                window.gameState.critChanceUpgradeLevel += reward.levels;
                window.gameState.critMultiplierUpgradeLevel += reward.levels;
                window.gameState.helperUpgradeLevel += reward.levels;
                console.log(`🚀 [BONUS] +${reward.levels} ко ВСЕМ улучшениям`);
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

    if (window.UI?.updateHUD) window.UI.updateHUD();
    if (window.UI?.updateUpgradeButtons) window.UI.updateUpgradeButtons();
}

function getBoostDuration(boostId) {
    const durations = { timeWarp: 30000, crystalBoost: 60000, powerSurge: 45000 };
    return durations[boostId] || 30000;
}

function showSmallNotification(text, color) {
    const notif = document.createElement('div');
    notif.textContent = text;
    notif.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: ${color || '#4CAF50'}; color: #fff;
        padding: 12px 20px; border-radius: 10px; z-index: 10000;
        text-align: center; font-family: 'Orbitron', sans-serif; font-weight: bold;
        font-size: 0.9em; box-shadow: 0 4px 20px rgba(0,0,0,0.5); border: 2px solid #fff;
        opacity: 0; transition: opacity 0.3s; pointer-events: none;
    `;
    document.body.appendChild(notif);
    setTimeout(() => { notif.style.opacity = '1'; }, 10);
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => { if (notif.parentNode) notif.parentNode.removeChild(notif); }, 300);
    }, 1500);
}

function showRewardNotification(reward) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(255,215,0,0.95), rgba(255,140,0,0.95));
        color: #000; padding: 15px 25px; border-radius: 12px; z-index: 10000;
        text-align: center; font-family: 'Orbitron', sans-serif; font-weight: bold;
        box-shadow: 0 6px 30px rgba(255,215,0,0.6); border: 3px solid #fff;
        opacity: 0; transition: opacity 0.3s; pointer-events: none; max-width: 280px;
    `;
    notif.innerHTML = `
        <div style="font-size:2em;margin-bottom:8px;">${reward.icon}</div>
        <div style="font-size:1em;margin-bottom:5px;">🎁 День ${dailyBonusData.totalClaimed}/30</div>
        <div style="font-size:0.9em;color:#fff;">${reward.name}</div>
    `;
    document.body.appendChild(notif);
    setTimeout(() => { notif.style.opacity = '1'; }, 10);
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => { if (notif.parentNode) notif.parentNode.removeChild(notif); }, 300);
    }, 2000);
}

// CSS анимация
const style = document.createElement('style');
style.textContent = `
    @keyframes dailyBonusPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    #dailyBonusIcon:hover { transform: scale(1.1); }
    #dailyBonusIcon:active { transform: scale(0.95); }
`;
document.head.appendChild(style);

window.dailyBonusSystem = {
    init,
    claimDailyBonus,
    resetDailyBonus,
    getProgress: () => ({
        currentDay: dailyBonusData.currentDay,
        totalClaimed: dailyBonusData.totalClaimed,
        streak: dailyBonusData.streak
    })
};

// ✅ Запуск с задержкой (ждём загрузки gameState из облака)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => { init(); }, 1000));
} else {
    setTimeout(() => { init(); }, 1000);
}
})();
