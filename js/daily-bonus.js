// js/daily-bonus.js
(function() {
'use strict';

// ============================================
// КОНФИГУРАЦИЯ НАГРАД НА 30 ДНЕЙ
// ============================================
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

// ============================================
// СОСТОЯНИЕ БОНУСА
// ============================================
let dailyBonusData = {
    lastClaimDate: null,  // ✅ Формат: "YYYY-MM-DD" (UTC)
    currentDay: 1,
    totalClaimed: 0,
    streak: 0
};

let timerInterval = null;
let iconCreated = false;

// ============================================
// 🌍 UTC УТИЛИТЫ (ГЛОБАЛЬНАЯ СИНХРОНИЗАЦИЯ)
// ============================================

/**
 * Получить текущую дату в UTC формате "YYYY-MM-DD"
 * ✅ Используется для глобальной синхронизации между устройствами
 */
function getUTCToday() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Получить миллисекунды до следующей полуночи UTC
 * ✅ Используется для таймера обратного отсчёта
 */
function getUTCMsToMidnight() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow - now;
}

/**
 * Форматировать миллисекунды в "HH:MM:SS"
 */
function formatTime(ms) {
    if (ms <= 0) return '00:00:00';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ============================================
// 🚀 ИНИЦИАЛИЗАЦИЯ
// ============================================

function init() {
    console.log('🎁 [BONUS] Инициализация системы ежедневных бонусов...');
    loadDailyBonusData();
    createBonusIcon();
    updateIconDisplay();
    startTimer();
    console.log('✅ [BONUS] Система инициализирована');
    console.log('🎁 [BONUS] Текущая UTC дата:', getUTCToday());
    console.log('🎁 [BONUS] dailyBonusData:', dailyBonusData);
}

// ============================================
// 📥 ЗАГРУЗКА ДАННЫХ
// ============================================

/**
 * Загрузка данных бонуса
 * ✅ Приоритет 1: gameState (из облака)
 * ✅ Приоритет 2: localStorage (резерв)
 */
function loadDailyBonusData() {
    try {
        // ✅ Приоритет 1: из gameState (синхронизировано через облако)
        if (window.gameState && window.gameState.dailyBonus && 
            window.gameState.dailyBonus.lastClaimDate !== undefined) {
            dailyBonusData = {
                lastClaimDate: window.gameState.dailyBonus.lastClaimDate || null,
                currentDay: window.gameState.dailyBonus.currentDay || 1,
                totalClaimed: window.gameState.dailyBonus.totalClaimed || 0,
                streak: window.gameState.dailyBonus.streak || 0
            };
            console.log('✅ [BONUS] Загружено из gameState (облако):', dailyBonusData);
            
            // Синхронизируем в localStorage для резерва
            localStorage.setItem('cosmicDailyBonus', JSON.stringify(dailyBonusData));
            return;
        }
        
        // ✅ Приоритет 2: из localStorage
        const saved = localStorage.getItem('cosmicDailyBonus');
        if (saved) {
            dailyBonusData = JSON.parse(saved);
            console.log('✅ [BONUS] Загружено из localStorage:', dailyBonusData);
            
            // Синхронизируем в gameState
            if (window.gameState) {
                window.gameState.dailyBonus = { ...dailyBonusData };
            }
        } else {
            console.log('ℹ️ [BONUS] Сохранение не найдено, используем дефолт');
        }
    } catch (e) {
        console.error('❌ [BONUS] Ошибка загрузки:', e);
        resetDailyBonus();
    }
}

/**
 * Сохранение данных бонуса
 * ✅ Сохраняем в localStorage И в gameState (для облачной синхронизации)
 */
function saveDailyBonusData() {
    try {
        // Сохраняем локально
        localStorage.setItem('cosmicDailyBonus', JSON.stringify(dailyBonusData));
        
        // ✅ Сохраняем в gameState для облачной синхронизации
        if (window.gameState) {
            window.gameState.dailyBonus = { ...dailyBonusData };
            console.log('💾 [BONUS] Сохранено в gameState для облака:', dailyBonusData);
        }
    } catch (e) {
        console.error('❌ [BONUS] Ошибка сохранения:', e);
    }
}

function resetDailyBonus() {
    dailyBonusData = { lastClaimDate: null, currentDay: 1, totalClaimed: 0, streak: 0 };
    saveDailyBonusData();
}

// ============================================
// 🎨 СОЗДАНИЕ ИКОНКИ
// ============================================

function createBonusIcon() {
    if (iconCreated) return;
    
    const icon = document.createElement('div');
    icon.id = 'dailyBonusIcon';
    icon.style.cssText = `
        position: fixed;
        top: 130px;
        right: 20px;
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
    
    // Клик
    icon.addEventListener('click', claimDailyBonus);
    
    // Touch для мобильных
    icon.addEventListener('touchstart', (e) => {
        e.preventDefault();
        claimDailyBonus();
    }, { passive: false });
    
    document.body.appendChild(icon);
    iconCreated = true;
    console.log('✅ [BONUS] Иконка создана');
}

// ============================================
// ⏱️ ТАЙМЕР
// ============================================

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    // Обновляем сразу
    updateIconDisplay();
    
    // Затем каждую секунду
    timerInterval = setInterval(() => {
        updateIconDisplay();
    }, 1000);
    
    console.log('⏱️ [BONUS] Таймер запущен');
}

/**
 * Обновление отображения иконки
 * ✅ Вызывается каждую секунду
 */
function updateIconDisplay() {
    const dayEl = document.getElementById('dailyBonusDay');
    const timerEl = document.getElementById('dailyBonusTimer');
    const icon = document.getElementById('dailyBonusIcon');
    
    if (!dayEl || !timerEl || !icon) return;

    // ✅ Используем UTC дату для глобальной синхронизации
    const todayUTC = getUTCToday();
    const isAvailable = dailyBonusData.lastClaimDate !== todayUTC && dailyBonusData.currentDay <= 30;

    // Всегда обновляем номер дня
    dayEl.textContent = `День ${dailyBonusData.currentDay}`;

    if (dailyBonusData.currentDay > 30) {
        // Цикл завершён
        timerEl.textContent = '🎉';
        timerEl.style.color = '#FFD700';
        icon.style.borderColor = '#FFD700';
        icon.style.animation = 'none';
    } else if (isAvailable) {
        // Бонус доступен - показываем галочку
        timerEl.textContent = '✅';
        timerEl.style.color = '#4CAF50';
        icon.style.borderColor = '#4CAF50';
        icon.style.animation = 'dailyBonusPulse 2s infinite';
    } else {
        // Бонус уже получен сегодня - показываем таймер до полуночи UTC
        const msToMidnight = getUTCMsToMidnight();
        timerEl.textContent = formatTime(msToMidnight);
        timerEl.style.color = '#4FC3F7';
        icon.style.borderColor = '#FFD700';
        icon.style.animation = 'none';
    }
}

// ============================================
// 🎁 ПОЛУЧЕНИЕ БОНУСА
// ============================================

/**
 * Получение ежедневного бонуса
 * ✅ Блокируем синхронизацию на время применения
 */
function claimDailyBonus() {
    // ✅ Используем UTC дату
    const todayUTC = getUTCToday();
    
    console.log('🎁 [BONUS] Попытка получения бонуса...');
    console.log('🎁 [BONUS] Сегодня (UTC):', todayUTC);
    console.log('🎁 [BONUS] Последний раз получен:', dailyBonusData.lastClaimDate);

    if (dailyBonusData.lastClaimDate === todayUTC) {
        showSmallNotification('⏰ Уже получено сегодня!', '#ff9800');
        return;
    }

    if (dailyBonusData.currentDay > 30) {
        showSmallNotification('🎉 Цикл завершён!', '#4CAF50');
        return;
    }

    const reward = dailyRewards[dailyBonusData.currentDay - 1];
    console.log('🎁 [BONUS] Награда:', reward.name);

    // ✅ БЛОКИРУЕМ синхронизацию
    if (typeof window.lockSync === 'function') {
        window.lockSync();
        console.log('🔒 [BONUS] Синхронизация заблокирована');
    }

    try {
        // Применяем награду
        applyReward(reward);

        // ✅ Сохраняем дату в UTC формате
        dailyBonusData.lastClaimDate = todayUTC;
        dailyBonusData.streak++;
        dailyBonusData.totalClaimed++;
        if (dailyBonusData.currentDay < 30) dailyBonusData.currentDay++;

        // Сохраняем данные
        saveDailyBonusData();
        updateIconDisplay();
        
        // Показываем уведомление
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

        // ✅ Сохраняем игру (синхронизация заблокирована, race condition невозможен)
        if (typeof window.saveGame === 'function') {
            console.log('💾 [BONUS] Сохранение после получения бонуса...');
            window.saveGame();
        }
        
        console.log('✅ [BONUS] Бонус получен успешно!');
    } catch (e) {
        console.error('❌ [BONUS] Ошибка получения бонуса:', e);
    } finally {
        // ✅ РАЗБЛОКИРУЕМ синхронизацию через 300мс
        setTimeout(() => {
            if (typeof window.unlockSync === 'function') {
                window.unlockSync();
                console.log('🔓 [BONUS] Синхронизация разблокирована');
            }
        }, 300);
    }
}

// ============================================
// 🎯 ПРИМЕНЕНИЕ НАГРАДЫ
// ============================================

function applyReward(reward) {
    if (!window.gameState) {
        console.warn('⚠️ [BONUS] gameState не инициализирован');
        return;
    }
    if (!window.gameState.shopItems) window.gameState.shopItems = {};

    switch (reward.type) {
        case 'crystals':
            window.gameState.coins = (window.gameState.coins || 0) + reward.amount;
            console.log(`💎 [BONUS] +${reward.amount} кристаллов, итого: ${window.gameState.coins}`);
            break;
            
        case 'boost':
            const duration = window.shopSystem?.config?.[reward.boost]?.duration || getBoostDuration(reward.boost);
            if (!window.gameState.shopItems[reward.boost]) {
                window.gameState.shopItems[reward.boost] = { purchased: false, active: false, timeLeft: 0 };
            }
            window.gameState.shopItems[reward.boost].active = true;
            window.gameState.shopItems[reward.boost].timeLeft = duration;
            window.gameState.shopItems[reward.boost].purchased = true;
            console.log(`⚡ [BONUS] Активирован бустер ${reward.boost} на ${duration}мс`);
            if (window.shopSystem?.updateShopDisplay) window.shopSystem.updateShopDisplay();
            break;
            
        case 'upgrade':
            if (reward.upgrade === 'all') {
                window.gameState.clickUpgradeLevel = (window.gameState.clickUpgradeLevel || 0) + reward.levels;
                window.gameState.critChanceUpgradeLevel = (window.gameState.critChanceUpgradeLevel || 0) + reward.levels;
                window.gameState.critMultiplierUpgradeLevel = (window.gameState.critMultiplierUpgradeLevel || 0) + reward.levels;
                window.gameState.helperUpgradeLevel = (window.gameState.helperUpgradeLevel || 0) + reward.levels;
                console.log(`🚀 [BONUS] +${reward.levels} ко ВСЕМ улучшениям`);
            } else if (reward.upgrade === 'clickPower') {
                window.gameState.clickUpgradeLevel = (window.gameState.clickUpgradeLevel || 0) + reward.levels;
                console.log(`👊 [BONUS] +${reward.levels} к силе клика`);
            } else if (reward.upgrade === 'critChance') {
                window.gameState.critChanceUpgradeLevel = (window.gameState.critChanceUpgradeLevel || 0) + reward.levels;
                window.gameState.critChance = Math.min(1.0, 0.001 + window.gameState.critChanceUpgradeLevel * 0.001);
                console.log(`🎯 [BONUS] +${reward.levels} к шансу крита`);
            } else if (reward.upgrade === 'critMultiplier') {
                window.gameState.critMultiplierUpgradeLevel = (window.gameState.critMultiplierUpgradeLevel || 0) + reward.levels;
                window.gameState.critMultiplier = 2.0 + window.gameState.critMultiplierUpgradeLevel * 0.2;
                console.log(`⭐ [BONUS] +${reward.levels} к множителю крита`);
            } else if (reward.upgrade === 'helperDamage') {
                window.gameState.helperUpgradeLevel = (window.gameState.helperUpgradeLevel || 0) + reward.levels;
                console.log(`🤖 [BONUS] +${reward.levels} к уровню Bobo`);
            }
            if (window.gameFunctions?.calculateClickPower) {
                window.gameState.clickPower = window.gameFunctions.calculateClickPower();
            }
            break;
    }

    // Обновляем UI
    if (window.UI?.updateHUD) window.UI.updateHUD();
    if (window.UI?.updateUpgradeButtons) window.UI.updateUpgradeButtons();
    if (window.gameFunctions?.updateHUD) window.gameFunctions.updateHUD();
    if (window.gameFunctions?.updateUpgradeButtons) window.gameFunctions.updateUpgradeButtons();
}

function getBoostDuration(boostId) {
    const durations = { timeWarp: 30000, crystalBoost: 60000, powerSurge: 45000 };
    return durations[boostId] || 30000;
}

// ============================================
// 💬 УВЕДОМЛЕНИЯ
// ============================================

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

// ============================================
// 🎨 CSS АНИМАЦИЯ
// ============================================

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

// ============================================
// ЭКСПОРТ СИСТЕМЫ
// ============================================

window.dailyBonusSystem = {
    init,
    claimDailyBonus,
    resetDailyBonus,
    getProgress: () => ({
        currentDay: dailyBonusData.currentDay,
        totalClaimed: dailyBonusData.totalClaimed,
        streak: dailyBonusData.streak,
        lastClaimDate: dailyBonusData.lastClaimDate
    }),
    getUTCToday: getUTCToday
};

// ============================================
// 🚀 ЗАПУСК
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1000));
} else {
    setTimeout(init, 1000);
}

})();
