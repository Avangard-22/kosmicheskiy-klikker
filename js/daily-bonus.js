// js/daily-bonus.js
(function() {
'use strict';

const dailyRewards = [
    { day: 1, type: 'crystals', amount: 100, icon: '💎', name: '100 Кристаллов' },
    // ... (остальные награды без изменений)
];

let dailyBonusData = {
    lastClaimDate: null,
    currentDay: 1,
    totalClaimed: 0,
    streak: 0,
    lastClaimTimestamp: 0  // ✅ НОВОЕ: timestamp последнего получения
};

let timerInterval = null;
let iconCreated = false;
let serverTimeOffset = 0;  // ✅ НОВОЕ: разница между сервером и клиентом

// ==========================================
// ⏰ СИНХРОНИЗАЦИЯ СЕРВЕРНОГО ВРЕМЕНИ
// ==========================================

/**
 * ✅ НОВОЕ: Получение серверного времени
 * Вызывается при загрузке игры
 */
async function syncServerTime() {
    try {
        const clientTime = Date.now();
        
        // ✅ Вариант 1: Запрос к вашему бэкенду (рекомендуется)
        // const response = await fetch('https://your-api.com/api/time');
        // const data = await response.json();
        // const serverTime = data.timestamp;
        
        // ✅ Вариант 2: Использование Telegram API (если в Telegram)
        if (window.telegramCloud && window.telegramCloud.isAvailable) {
            // Делаем запрос к облаку и измеряем время отклика
            const startTime = Date.now();
            await window.telegramCloud.loadProgress().catch(() => {});
            const endTime = Date.now();
            
            // Приблизительное серверное время (середина между отправкой и получением)
            const serverTime = startTime + (endTime - startTime) / 2;
            serverTimeOffset = serverTime - clientTime;
            
            console.log('⏰ [BONUS] Server time synced. Offset:', serverTimeOffset, 'ms');
            return;
        }
        
        // ✅ Вариант 3: Fallback — используем время из gameState (если загружено из облака)
        if (window.gameState && window.gameState.dailyBonus && window.gameState.dailyBonus.lastClaimTimestamp) {
            // Используем timestamp из последнего сохранения
            serverTimeOffset = 0; // Приближённо
            console.log('⏰ [BONUS] Using gameState timestamp');
            return;
        }
        
        console.warn('⚠️ [BONUS] Server time sync not available');
    } catch (e) {
        console.error('❌ [BONUS] Error syncing server time:', e);
    }
}

/**
 * ✅ НОВОЕ: Получение текущего серверного времени
 */
function getServerTime() {
    return Date.now() + serverTimeOffset;
}

/**
 * ✅ НОВОЕ: Получение даты по серверному времени
 */
function getServerDate() {
    return new Date(getServerTime()).toDateString();
}

// ==========================================
// 💾 ЗАГРУЗКА И СОХРАНЕНИЕ
// ==========================================

function init() {
    // ✅ Синхронизируем время перед инициализацией
    syncServerTime().then(() => {
        loadDailyBonusData();
        createBonusIcon();
        startTimer();
        console.log('✅ Daily bonus system initialized with server time protection');
    });
}

function loadDailyBonusData() {
    try {
        // ✅ Приоритет 1: из gameState.dailyBonus (из облака)
        if (window.gameState && window.gameState.dailyBonus) {
            dailyBonusData = {
                lastClaimDate: window.gameState.dailyBonus.lastClaimDate || null,
                currentDay: window.gameState.dailyBonus.currentDay || 1,
                totalClaimed: window.gameState.dailyBonus.totalClaimed || 0,
                streak: window.gameState.dailyBonus.streak || 0,
                lastClaimTimestamp: window.gameState.dailyBonus.lastClaimTimestamp || 0  // ✅ Загружаем timestamp
            };
            console.log('✅ [BONUS] Loaded from gameState.dailyBonus:', dailyBonusData);
            
            // Сохраняем в localStorage для резерва
            localStorage.setItem('cosmicDailyBonus', JSON.stringify(dailyBonusData));
            return;
        }
        
        // ✅ Приоритет 2: из localStorage
        const saved = localStorage.getItem('cosmicDailyBonus');
        if (saved) {
            dailyBonusData = JSON.parse(saved);
            console.log('✅ [BONUS] Loaded from localStorage:', dailyBonusData);
            
            // Синхронизируем в gameState
            if (window.gameState) {
                window.gameState.dailyBonus = { ...dailyBonusData };
            }
        } else {
            console.log('ℹ️ [BONUS] No save found, using default');
        }
    } catch (e) {
        console.error('❌ [BONUS] Error loading:', e);
        resetDailyBonus();
    }
}

function saveDailyBonusData() {
    try {
        // ✅ Добавляем timestamp последнего сохранения
        dailyBonusData.lastSaveTimestamp = getServerTime();
        
        // Сохраняем локально
        localStorage.setItem('cosmicDailyBonus', JSON.stringify(dailyBonusData));
        
        // ✅ ВАЖНО: Сохраняем в gameState для облачной синхронизации
        if (window.gameState) {
            if (!window.gameState.dailyBonus) {
                window.gameState.dailyBonus = {};
            }
            window.gameState.dailyBonus = { ...dailyBonusData };
            console.log('💾 [BONUS] Saved to gameState.dailyBonus:', window.gameState.dailyBonus);
        }
    } catch (e) {
        console.error('❌ [BONUS] Error saving:', e);
    }
}

function resetDailyBonus() {
    dailyBonusData = { 
        lastClaimDate: null, 
        currentDay: 1, 
        totalClaimed: 0, 
        streak: 0,
        lastClaimTimestamp: 0  // ✅ Сбрасываем timestamp
    };
    saveDailyBonusData();
}

// ==========================================
// 🎨 UI ФУНКЦИИ (без изменений)
// ==========================================

function createBonusIcon() {
    if (iconCreated) return;
    const icon = document.createElement('div');
    icon.id = 'dailyBonusIcon';
    icon.style.cssText = `position: fixed; top: 180px; right: 20px; width: 60px; height: 60px; background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 140, 0, 0.3)); border: 2px solid #FFD700; border-radius: 50%; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1000; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4); font-family: 'Orbitron', sans-serif;`;
    icon.innerHTML = `<div id="dailyBonusDay" style="font-size: 0.65em; color: #FFD700; font-weight: bold; margin-bottom: 2px;">День 1</div><div id="dailyBonusTimer" style="font-size: 0.5em; color: #fff; font-weight: bold;">00:00:00</div>`;
    
    icon.addEventListener('click', claimDailyBonus);
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

    // ✅ ИСПОЛЬЗУЕМ серверное время вместо клиентского
    const serverDate = getServerDate();
    const isAvailable = dailyBonusData.lastClaimDate !== serverDate && dailyBonusData.currentDay <= 30;

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
    
    // ✅ ИСПОЛЬЗУЕМ серверное время
    const serverDate = getServerDate();
    const isAvailable = dailyBonusData.lastClaimDate !== serverDate && dailyBonusData.currentDay <= 30;

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

    // ✅ Рассчитываем время до следующего дня по серверному времени
    const now = new Date(getServerTime());
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

// ==========================================
// 🎁 ПОЛУЧЕНИЕ БОНУСА (С ЗАЩИТОЙ)
// ==========================================

/**
 * ✅ ИСПРАВЛЕНО: Защита от тайм-тревела
 */
function claimDailyBonus() {
    // ✅ ИСПОЛЬЗУЕМ серверное время вместо клиентского
    const serverDate = getServerDate();
    const serverTimestamp = getServerTime();
    
    console.log('🎁 [BONUS] Claim attempt...');
    console.log('🎁 [BONUS] Server date (UTC):', serverDate);
    console.log('🎁 [BONUS] Server timestamp:', serverTimestamp);
    console.log('🎁 [BONUS] Last claim date:', dailyBonusData.lastClaimDate);
    console.log('🎁 [BONUS] Last claim timestamp:', dailyBonusData.lastClaimTimestamp);
    
    // ✅ ПРОВЕРКА 1: Уже получено сегодня (по серверному времени)
    if (dailyBonusData.lastClaimDate === serverDate) {
        console.log('⚠️ [BONUS] Already claimed today!');
        showSmallNotification('⏰ Уже получено сегодня!', '#ff9800');
        return;
    }
    
    // ✅ ПРОВЕРКА 2: Минимальный интервал между получениями (24 часа)
    if (dailyBonusData.lastClaimTimestamp > 0) {
        const timeSinceLastClaim = serverTimestamp - dailyBonusData.lastClaimTimestamp;
        const minInterval = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
        
        if (timeSinceLastClaim < minInterval) {
            const hoursLeft = Math.ceil((minInterval - timeSinceLastClaim) / (1000 * 60 * 60));
            console.log('⚠️ [BONUS] Too early! Hours left:', hoursLeft);
            showSmallNotification(`⏰ Подождите ещё ${hoursLeft} ч.`, '#ff9800');
            return;
        }
    }
    
    if (dailyBonusData.currentDay > 30) {
        showSmallNotification('🎉 Цикл завершён!', '#4CAF50');
        return;
    }
    
    const reward = dailyRewards[dailyBonusData.currentDay - 1];
    console.log('🎁 [BONUS] Reward:', reward.name);
    
    // ✅ БЛОКИРУЕМ синхронизацию
    if (typeof window.lockSync === 'function') {
        window.lockSync();
        console.log('🔒 [BONUS] Sync locked');
    }
    
    try {
        // Применяем награду
        applyReward(reward);
        
        // ✅ Обновляем данные с серверным временем
        dailyBonusData.lastClaimDate = serverDate;
        dailyBonusData.lastClaimTimestamp = serverTimestamp;  // ✅ Сохраняем timestamp
        dailyBonusData.streak++;
        dailyBonusData.totalClaimed++;
        if (dailyBonusData.currentDay < 30) dailyBonusData.currentDay++;
        
        console.log('🎁 [BONUS] New data:', dailyBonusData);
        
        // Сохраняем
        saveDailyBonusData();
        updateIconDisplay();
        showRewardNotification(reward);
        
        // Звук
        const sound = document.getElementById('upgradeSound');
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
        
        // Тактильная отдача
        if (window.telegramHaptic?.success) {
            window.telegramHaptic.success();
        } else if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
        
        // ✅ Сохраняем игру
        if (typeof window.saveGame === 'function') {
            console.log('💾 [BONUS] Calling saveGame()...');
            window.saveGame();
        }
    } finally {
        // ✅ РАЗБЛОКИРУЕМ синхронизацию
        setTimeout(() => {
            if (typeof window.unlockSync === 'function') {
                window.unlockSync();
                console.log('🔓 [BONUS] Sync unlocked');
            }
        }, 300);
    }
}

// ==========================================
// 🎁 ПРИМЕНЕНИЕ НАГРАДЫ (без изменений)
// ==========================================

function applyReward(reward) {
    if (!window.gameState) {
        console.warn('⚠️ [BONUS] gameState not initialized');
        return;
    }
    if (!window.gameState.shopItems) window.gameState.shopItems = {};
    
    switch (reward.type) {
        case 'crystals':
            window.gameState.coins += reward.amount;
            console.log(`💎 [BONUS] +${reward.amount} crystals`);
            break;
        case 'boost':
            const duration = window.shopSystem?.config?.[reward.boost]?.duration || getBoostDuration(reward.boost);
            if (!window.gameState.shopItems[reward.boost]) {
                window.gameState.shopItems[reward.boost] = { purchased: false, active: false, timeLeft: 0 };
            }
            window.gameState.shopItems[reward.boost].active = true;
            window.gameState.shopItems[reward.boost].timeLeft = duration;
            window.gameState.shopItems[reward.boost].purchased = true;
            console.log(`⚡ [BONUS] Boost activated: ${reward.boost}`);
            if (window.shopSystem?.updateShopDisplay) window.shopSystem.updateShopDisplay();
            break;
        case 'upgrade':
            if (reward.upgrade === 'all') {
                window.gameState.clickUpgradeLevel += reward.levels;
                window.gameState.critChanceUpgradeLevel += reward.levels;
                window.gameState.critMultiplierUpgradeLevel += reward.levels;
                window.gameState.helperUpgradeLevel += reward.levels;
                console.log(`🚀 [BONUS] +${reward.levels} to ALL upgrades`);
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
    notif.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: ${color || '#4CAF50'}; color: #fff; padding: 12px 20px; border-radius: 10px; z-index: 10000; text-align: center; font-family: 'Orbitron', sans-serif; font-weight: bold; font-size: 0.9em; box-shadow: 0 4px 20px rgba(0,0,0,0.5); border: 2px solid #fff; opacity: 0; transition: opacity 0.3s; pointer-events: none;`;
    document.body.appendChild(notif);
    setTimeout(() => { notif.style.opacity = '1'; }, 10);
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => { if (notif.parentNode) notif.parentNode.removeChild(notif); }, 300);
    }, 1500);
}

function showRewardNotification(reward) {
    const notif = document.createElement('div');
    notif.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(135deg, rgba(255,215,0,0.95), rgba(255,140,0,0.95)); color: #000; padding: 15px 25px; border-radius: 12px; z-index: 10000; text-align: center; font-family: 'Orbitron', sans-serif; font-weight: bold; box-shadow: 0 6px 30px rgba(255,215,0,0.6); border: 3px solid #fff; opacity: 0; transition: opacity 0.3s; pointer-events: none; max-width: 280px;`;
    notif.innerHTML = `<div style="font-size:2em;margin-bottom:8px;">${reward.icon}</div><div style="font-size:1em;margin-bottom:5px;">🎁 День ${dailyBonusData.totalClaimed}/30</div><div style="font-size:0.9em;color:#fff;">${reward.name}</div>`;
    document.body.appendChild(notif);
    setTimeout(() => { notif.style.opacity = '1'; }, 10);
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => { if (notif.parentNode) notif.parentNode.removeChild(notif); }, 300);
    }, 2000);
}

// CSS анимация
const style = document.createElement('style');
style.textContent = `@keyframes dailyBonusPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } } #dailyBonusIcon:hover { transform: scale(1.1); } #dailyBonusIcon:active { transform: scale(0.95); }`;
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