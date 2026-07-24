// js/daily-bonus.js
(function() {
'use strict';

// ==========================================
// 🎁  КОНФИГУРАЦИЯ НАГРАД
// ==========================================
const REWARD_CONFIG = {
    baseCrystals: 100,
    // Фиксированные "золотые" дни (предсказуемые награды)
    milestoneRewards: {
        7:  { type: 'crystals', amount: 1000, name: '💎 Бонус недели: 1000 💎' },
        14: { type: 'crystals', amount: 2500, name: '💎 Бонус 2 недели: 2500 💎' },
        21: { type: 'crystals', amount: 5000, name: '💎 Бонус 3 недели: 5000 💎' },
        30: { type: 'crystals', amount: 15000, name: '👑 ГРАНД ФИНАЛ: 15000 💎!' }
    },
    // Пул бустеров для случайных наград
    boosterPool: ['timeWarp', 'crystalBoost', 'powerSurge'],
    // Пул апгрейдов для случайных наград
    upgradePool: [
        { upgrade: 'clickPower', levels: 2, name: '+2 уровня Силы' },
        { upgrade: 'critChance', levels: 3, name: '+3 уровня Крита' },
        { upgrade: 'critMultiplier', levels: 2, name: '+2 уровня Множителя' },
        { upgrade: 'helperDamage', levels: 2, name: '+2 уровня Bobo' }
    ]
};

// ==========================================
// 🔐 ДЕТЕРМИНИРОВАННЫЙ RANDOM (seed-based)
// ==========================================
/**
 * Простой seeded random — награда на день X всегда одинаковая
 * Это защищает от "перезагрузки страницы"
 */
function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

/**
 * Вычисляет силу игрока (прогрессия)
 */
function getPlayerProgressMultiplier() {
    if (!window.gameState) return 1;
    
    const planetOrder = window.GAME_CONFIG?.planetOrder || ['mercury'];
    const currentIdx = planetOrder.indexOf(window.gameState.currentLocation);
    
    // +15% за каждую открытую планету
    return 1 + (Math.max(0, currentIdx) * 0.15);}

// ==========================================
// 🎲 ГЕНЕРАТОР НАГРАД
// ==========================================
function generateReward(dayNumber) {
    // 1. Фиксированные "золотые" дни
    if (REWARD_CONFIG.milestoneRewards[dayNumber]) {
        return REWARD_CONFIG.milestoneRewards[dayNumber];
    }
    
    // 2. Детерминированный random на основе дня
    const seed = dayNumber * 9973; // простое число для лучшего распределения
    const rand = seededRandom(seed);
    
    // 3. Масштабирование с прогрессом игрока
    const progressMult = getPlayerProgressMultiplier();
    const dayMult = 1 + (dayNumber * 0.03); // +3% за каждый день
    
    // 4. Выбор типа награды (веса: 60% кристаллы, 25% бустер, 15% апгрейд)
    if (rand < 0.60) {
        // Кристаллы
        const amount = Math.floor(REWARD_CONFIG.baseCrystals * progressMult * dayMult);
        return {
            type: 'crystals',
            amount: amount,
            name: `${amount} 💎`
        };
    } else if (rand < 0.85) {
        // Бустер (выбираем детерминированно)
        const boosterIdx = Math.floor(seededRandom(seed + 1) * REWARD_CONFIG.boosterPool.length);
        const boostId = REWARD_CONFIG.boosterPool[boosterIdx];
        return {
            type: 'boost',
            boost: boostId,
            name: `⚡ ${getBoostName(boostId)}`
        };
    } else {
        // Апгрейд
        const upgradeIdx = Math.floor(seededRandom(seed + 2) * REWARD_CONFIG.upgradePool.length);
        const upg = REWARD_CONFIG.upgradePool[upgradeIdx];
        return {
            type: 'upgrade',
            upgrade: upg.upgrade,
            levels: upg.levels,
            name: `🚀 ${upg.name}`
        };
    }
}
function getBoostName(boostId) {
    const names = {
        timeWarp: 'Искажение времени',
        crystalBoost: 'Усилитель кристаллов',
        powerSurge: 'Скачок силы'
    };
    return names[boostId] || boostId;
}

// ==========================================
// 📅 ISO-ДАТЫ (защита от тайм-тревела)
// ==========================================
const getToday = () => new Date().toISOString().split('T')[0];

// ==========================================
// 🎁 ПОЛУЧЕНИЕ БОНУСА
// ==========================================
function claimDailyBonus() {
    if (!window.gameState) return;
    
    // Инициализация
    if (!window.gameState.dailyBonus) {
        window.gameState.dailyBonus = {
            lastClaimDate: null,
            totalClaimed: 0,
            streak: 0,
            lastClaimTimestamp: 0
        };
    }
    
    const today = getToday();
    const data = window.gameState.dailyBonus;
    
    // Проверка: уже получено сегодня
    if (data.lastClaimDate === today) {
        showSmallNotification('⏰ Уже получено сегодня!', '#ff9800');
        return;
    }
    
    // Проверка: минимальный интервал 24 часа (защита от читеров)
    const now = Date.now();
    if (data.lastClaimTimestamp > 0) {
        const hoursSinceLastClaim = (now - data.lastClaimTimestamp) / (1000 * 60 * 60);
        if (hoursSinceLastClaim < 23) { // 23 часа — небольшой допуск
            const hoursLeft = Math.ceil(24 - hoursSinceLastClaim);
            showSmallNotification(`⏰ Подождите ещё ${hoursLeft} ч.`, '#ff9800');
            return;
        }
    }
        // Обновляем streak (серия дней подряд)
    if (data.lastClaimDate) {
        const lastDate = new Date(data.lastClaimDate + 'T00:00:00Z');
        const todayDate = new Date(today + 'T00:00:00Z');
        const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
            data.streak = (data.streak || 0) + 1;
        } else if (daysDiff > 1) {
            data.streak = 1; // Серия прервана
        }
    } else {
        data.streak = 1;
    }
    
    // Генерируем награду (детерминированно!)
    const dayNumber = data.totalClaimed + 1;
    const reward = generateReward(dayNumber);
    
    // Блокируем синхронизацию
    if (typeof window.lockSync === 'function') window.lockSync();
    
    try {
        // Применяем награду
        applyReward(reward);

// ✅ НОВОЕ: Фиксируем начало нового игрового дня для лидерборда
if (window.gameMetrics) {
    if (!window.gameMetrics.dailyProgress) {
        window.gameMetrics.dailyProgress = { history: [] };
    }
    
    // Сохраняем прогресс за предыдущий день
    if (window.gameMetrics.dailyProgress.currentDayStart && window.gameState) {
        const yesterdayDamage = (window.gameState.totalDamageDealt || 0) - (window.gameMetrics.dailyProgress.dayStartDamage || 0);
        
        // ✅ НОВОЕ: Считаем блоки за день через achievementsV2
        let yesterdayBlocks = 0;
        if (window.gameState.achievementsV2) {
            Object.values(window.gameState.achievementsV2).forEach(planetAch => {
                const metrics = planetAch?.metrics || {};
                yesterdayBlocks += (metrics.blocks?.progress || 0) + (metrics.rare?.progress || 0);
            });
            // Вычитаем блоки, которые уже были на момент прошлой активации
            yesterdayBlocks = Math.max(0, yesterdayBlocks - (window.gameMetrics.dailyProgress.dayStartBlocks || 0));
        }
        
        window.gameMetrics.dailyProgress.history.push({
            date: new Date().toISOString().split('T')[0],
            timestamp: Date.now(),
            damage: Math.max(0, yesterdayDamage),
            blocks: yesterdayBlocks // ✅ Сохраняем блоки за день
        });
        
        // Оставляем только 7 дней
        if (window.gameMetrics.dailyProgress.history.length > 7) {
            window.gameMetrics.dailyProgress.history = window.gameMetrics.dailyProgress.history.slice(-7);
        }
    }
    
    // Начинаем новый день - сбрасываем счётчики
    window.gameMetrics.dailyProgress.currentDayStart = Date.now();
    window.gameMetrics.dailyProgress.dayStartDamage = window.gameState?.totalDamageDealt || 0;
    
    // ✅ Сохраняем текущее количество блоков как точку отсчёта
    if (window.gameState.achievementsV2) {
        let currentBlocks = 0;
        Object.values(window.gameState.achievementsV2).forEach(planetAch => {
            const metrics = planetAch?.metrics || {};
            currentBlocks += (metrics.blocks?.progress || 0) + (metrics.rare?.progress || 0);
        });
        window.gameMetrics.dailyProgress.dayStartBlocks = currentBlocks;
    }
    
    console.log(' [DAILY-BONUS] Новый игровой день начался для лидерборда');
}
        
        // Обновляем данные
        data.lastClaimDate = today;
        data.lastClaimTimestamp = now;
        data.totalClaimed = dayNumber;
        
        // Сохраняем
        if (typeof window.saveGame === 'function') window.saveGame();
        
        // Уведомления
        showRewardNotification(reward, dayNumber);
        
        // Звук и вибрация
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
        
        console.log(`🎁 День ${dayNumber}: ${reward.name}`);    } finally {
        setTimeout(() => {
            if (typeof window.unlockSync === 'function') window.unlockSync();
        }, 300);
    }
}

// ==========================================
// 💰 ПРИМЕНЕНИЕ НАГРАДЫ
// ==========================================
function applyReward(reward) {
    if (!window.gameState) return;
    if (!window.gameState.shopItems) window.gameState.shopItems = {};
    
    switch (reward.type) {
        case 'crystals':
            window.gameState.coins = (window.gameState.coins || 0) + reward.amount;
            break;
            
        case 'boost':
            const duration = window.shopSystem?.config?.[reward.boost]?.duration || 30000;
            if (!window.gameState.shopItems[reward.boost]) {
                window.gameState.shopItems[reward.boost] = { purchased: false, active: false, timeLeft: 0 };
            }
            window.gameState.shopItems[reward.boost].active = true;
            window.gameState.shopItems[reward.boost].timeLeft = duration;
            window.gameState.shopItems[reward.boost].purchased = true;
            if (window.shopSystem?.updateShopDisplay) window.shopSystem.updateShopDisplay();
            break;
            
        case 'upgrade':
            if (reward.upgrade === 'clickPower') {
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
            if (typeof window.syncDailyProgress === 'function') {
    window.syncDailyProgress();
}
            break;
    }
    
    if (window.UI?.updateHUD) window.UI.updateHUD();
    if (window.UI?.updateUpgradeButtons) window.UI.updateUpgradeButtons();}

// ==========================================
// 🎨 UI
// ==========================================
function createBonusIcon() {
    if (document.getElementById('dailyBonusIcon')) return;
    
    const icon = document.createElement('div');
    icon.id = 'dailyBonusIcon';
    icon.style.cssText = `
        position: fixed; top: 180px; right: 20px;
        width: 60px; height: 60px;
        background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 140, 0, 0.3));
        border: 2px solid #FFD700;
        border-radius: 50%;
        cursor: pointer;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
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
    
    // Запускаем таймер
    setInterval(updateIconDisplay, 1000);
}

function updateIconDisplay() {
    const data = window.gameState?.dailyBonus;
    const icon = document.getElementById('dailyBonusIcon');
    
    // ✅ ПОКАЗЫВАЕМ КНОПКУ ТОЛЬКО ВО ВРЕМЯ ИГРЫ
    if (icon) {
        const isGameActive = window.gameState?.gameActive === true;
        icon.style.display = isGameActive ? 'flex' : 'none';
    }
    
    if (!data || !icon) return;
    
    const dayEl = document.getElementById('dailyBonusDay');
    const timerEl = document.getElementById('dailyBonusTimer');
    if (!dayEl || !timerEl) return;

    const today = getToday();
    const dayNumber = (data.totalClaimed || 0) + 1;
    const now = Date.now();

    const dateChanged = data.lastClaimDate !== today;
    const timePassed = data.lastClaimTimestamp > 0 
        ? (now - data.lastClaimTimestamp) / (1000 * 60 * 60) >= 23 
        : true;
    
    const isAvailable = dateChanged && timePassed;

    dayEl.textContent = `День ${dayNumber}`;

    if (isAvailable) {
        timerEl.textContent = '✅';
        timerEl.style.color = '#4CAF50';
        icon.style.borderColor = '#4CAF50';
        icon.style.animation = 'dailyBonusPulse 2s infinite';
    } else if (data.streak > 30) {
        timerEl.textContent = '🎉';
        timerEl.style.color = '#FFD700';
        icon.style.borderColor = '#FFD700';
        icon.style.animation = 'none';
    } else {
        if (data.lastClaimTimestamp > 0) {
            const minInterval = 23 * 60 * 60 * 1000;
            const timeSinceLastClaim = now - data.lastClaimTimestamp;
            const timeLeft = Math.max(0, minInterval - timeSinceLastClaim);
            
            const totalMinutesLeft = Math.floor(timeLeft / (1000 * 60));
            const hoursLeft = Math.floor(totalMinutesLeft / 60);
            const minutesLeft = totalMinutesLeft % 60;
            
            let timerText = hoursLeft > 0 ? `${hoursLeft}ч ${String(minutesLeft).padStart(2, '0')}м` : `${minutesLeft}м`;
            timerEl.textContent = timerText;
        } else {
            timerEl.textContent = '00ч 00м';
        }
        
        timerEl.style.color = '#FF9800';
        icon.style.borderColor = '#FF9800';
        icon.style.animation = 'none';
    }
}

function showSmallNotification(text, color) {
    const notif = document.createElement('div');
    notif.textContent = text;
    notif.style.cssText = `
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: ${color || '#4CAF50'};
        color: #fff; padding: 12px 20px;
        border-radius: 10px; z-index: 10000;
        text-align: center;
        font-family: 'Orbitron', sans-serif;
        font-weight: bold; font-size: 0.9em;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        border: 2px solid #fff;
        opacity: 0; transition: opacity 0.3s;
        pointer-events: none;
    `;
    document.body.appendChild(notif);
    setTimeout(() => { notif.style.opacity = '1'; }, 10);
    setTimeout(() => {
        notif.style.opacity = '0';        setTimeout(() => notif.parentNode?.removeChild(notif), 300);
    }, 1500);
}

function showRewardNotification(reward, dayNumber) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(255,215,0,0.95), rgba(255,140,0,0.95));
        color: #000; padding: 15px 25px;
        border-radius: 12px; z-index: 10000;
        text-align: center;
        font-family: 'Orbitron', sans-serif;
        font-weight: bold;
        box-shadow: 0 6px 30px rgba(255,215,0,0.6);
        border: 3px solid #fff;
        opacity: 0; transition: opacity 0.3s;
        pointer-events: none; max-width: 280px;
    `;
    notif.innerHTML = `
        <div style="font-size:1em;margin-bottom:5px;">🎁 День ${dayNumber}</div>
        <div style="font-size:1.1em;color:#fff;">${reward.name}</div>
    `;
    document.body.appendChild(notif);
    setTimeout(() => { notif.style.opacity = '1'; }, 10);
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => notif.parentNode?.removeChild(notif), 300);
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

// ==========================================
// 🚀 ЭКСПОРТ И АВТОЗАПУСК
// ==========================================
window.dailyBonusSystem = {
    claimDailyBonus,
    generateReward, // для отладки    getToday
};

// ЧТО: Замена хаотичного setTimeout на гарантированную синхронизацию через EventBus
// КУДА: daily-bonus.js → init()
// ЗАЧЕМ: Вместо гадания "через 500мс gameState появится?" мы подписываемся
//        на событие save:ready и инициализируемся ТОЛЬКО когда gameState гарантированно есть.
function init() {
    // Если gameState уже есть — запускаем сразу
    if (window.gameState && Object.keys(window.gameState).length > 0) {
        createBonusIcon();
        updateIconDisplay();
        console.log('✅ Daily bonus system initialized (procedural)');
        return;
    }
    
    // Иначе ждём события save:ready
    if (window.EventBus) {
        console.log('⏳ [DAILY] Ждём save:ready...');
        window.EventBus.once('save:ready', () => {
            console.log('✅ [DAILY] save:ready получен, инициализируем Daily Bonus');
            createBonusIcon();
            updateIconDisplay();
        });
    } else {
        // Fallback: если EventBus недоступен
        console.warn('⚠️ [DAILY] EventBus недоступен, fallback на setTimeout');
        setTimeout(init, 500);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1000));
} else {
    setTimeout(init, 1000);
}

})();
