// js/daily-bonus.js
(function() {
'use strict';

// ==========================================
// 🎁 КОНФИГУРАЦИЯ НАГРАД
// ==========================================
const REWARD_CONFIG = {
    baseCrystals: 100,
    milestoneRewards: {
        7:  { type: 'crystals', amount: 1000, name: '💎 Бонус недели: 1000 💎' },
        14: { type: 'crystals', amount: 2500, name: '💎 Бонус 2 недели: 2500 💎' },
        21: { type: 'crystals', amount: 5000, name: '💎 Бонус 3 недели: 5000 💎' },
        30: { type: 'crystals', amount: 15000, name: '👑 ГРАНД ФИНАЛ: 15000 💎!' }
    },
    boosterPool: ['timeWarp', 'crystalBoost', 'powerSurge'],
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
function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function getPlayerProgressMultiplier() {
    if (!window.gameState) return 1;
    const planetOrder = window.GAME_CONFIG?.planetOrder || ['mercury'];
    const currentIdx = planetOrder.indexOf(window.gameState.currentLocation);
    return 1 + (Math.max(0, currentIdx) * 0.15);
}

// ==========================================
// 🎲 ГЕНЕРАТОР НАГРАД
// ==========================================
function generateReward(dayNumber) {
    if (REWARD_CONFIG.milestoneRewards[dayNumber]) {
        return REWARD_CONFIG.milestoneRewards[dayNumber];
    }
    
    const seed = dayNumber * 9973;
    const rand = seededRandom(seed);
    const progressMult = getPlayerProgressMultiplier();
    const dayMult = 1 + (dayNumber * 0.03);
    
    if (rand < 0.60) {
        const amount = Math.floor(REWARD_CONFIG.baseCrystals * progressMult * dayMult);
        return { type: 'crystals', amount: amount, name: `${amount} 💎` };
    } else if (rand < 0.85) {
        const boosterIdx = Math.floor(seededRandom(seed + 1) * REWARD_CONFIG.boosterPool.length);
        const boostId = REWARD_CONFIG.boosterPool[boosterIdx];
        return { type: 'boost', boost: boostId, name: `⚡ ${getBoostName(boostId)}` };
    } else {
        const upgradeIdx = Math.floor(seededRandom(seed + 2) * REWARD_CONFIG.upgradePool.length);
        const upg = REWARD_CONFIG.upgradePool[upgradeIdx];
        return { type: 'upgrade', upgrade: upg.upgrade, levels: upg.levels, name: `🚀 ${upg.name}` };
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
    
    // ✅ ГАРАНТИРОВАННАЯ ИНИЦИАЛИЗАЦИЯ
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
    
    if (data.lastClaimDate === today) {
        showSmallNotification('⏰ Уже получено сегодня!', '#ff9800');
        return;
    }
    
    const now = Date.now();
    if (data.lastClaimTimestamp > 0) {
        const hoursSinceLastClaim = (now - data.lastClaimTimestamp) / (1000 * 60 * 60);
        if (hoursSinceLastClaim < 23) {
            const hoursLeft = Math.ceil(24 - hoursSinceLastClaim);
            showSmallNotification(`⏰ Подождите ещё ${hoursLeft} ч.`, '#ff9800');
            return;
        }
    }
    
    if (data.lastClaimDate) {
        const lastDate = new Date(data.lastClaimDate + 'T00:00:00Z');
        const todayDate = new Date(today + 'T00:00:00Z');
        const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
            data.streak = (data.streak || 0) + 1;
        } else if (daysDiff > 1) {
            data.streak = 1;
        }
    } else {
        data.streak = 1;
    }
    
    const dayNumber = data.totalClaimed + 1;
    const reward = generateReward(dayNumber);
    
    try {
        applyReward(reward);

        // ✅ Сброс счётчика "24 часа" (без сохранения!)
        if (window.gameMetrics && window.gameState) {
            if ((window.gameState.totalDamageDealt || 0) === 0 && window.gameState.achievementsV2) {
                let fallbackDamage = 0;
                let fallbackBlocks = 0;
                Object.values(window.gameState.achievementsV2).forEach(planetAch => {
                    const metrics = planetAch?.metrics || {};
                    fallbackDamage += metrics.damage?.progress || 0;
                    fallbackBlocks += (metrics.blocks?.progress || 0) + (metrics.rare?.progress || 0);
                });
                const recoveredValue = fallbackDamage > 0 ? fallbackDamage : fallbackBlocks;
                if (recoveredValue > 0) {
                    console.log('📅 [DAILY-BONUS] totalDamageDealt восстановлен:', recoveredValue);
                    window.gameState.totalDamageDealt = recoveredValue;
                }
            }

            if (!window.gameMetrics.dailyProgress) {
                window.gameMetrics.dailyProgress = { history: [] };
            }

            const dp = window.gameMetrics.dailyProgress;
            const totalDamage = window.gameState.totalDamageDealt || 0;

            if (dp.currentDayStart) {
                const yesterdayDamage = Math.max(0, totalDamage - (dp.dayStartDamage || 0));
                if (yesterdayDamage > 0) {
                    dp.history.push({
                        date: new Date(dp.currentDayStart).toISOString().split('T')[0],
                        timestamp: dp.currentDayStart,
                        damage: yesterdayDamage
                    });
                    if (dp.history.length > 7) {
                        dp.history = dp.history.slice(-7);
                    }
                }
            }

            dp.currentDayStart = Date.now();
            dp.dayStartDamage = totalDamage;
            console.log('📅 [DAILY-BONUS] Счётчик "24 часа" сброшен. dayStartDamage:', totalDamage);
        }
        
        // ✅ ОБНОВЛЯЕМ данные dailyBonus
        data.lastClaimDate = today;
        data.lastClaimTimestamp = now;
        data.totalClaimed = dayNumber;
        
        // ✅ КРИТИЧЕСКИ ВАЖНО: Принудительно вызываем сохранение СРАЗУ.
        // Авто-сохранение слишком медленное (3 сек задержка + 30 сек интервал), игрок может перезагрузить страницу раньше.
        console.log('💾 [DAILY-BONUS] Принудительно вызываем window.saveGame()...');
        if (typeof window.saveGame === 'function') {
            window.saveGame();
        }
        
        showRewardNotification(reward, dayNumber);
        
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
        
        console.log(`🎁 День ${dayNumber}: ${reward.name}`);
    } catch (e) {
        console.error(' [DAILY-BONUS] Ошибка при получении бонуса:', e);
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
            break;
    }
    
    if (window.UI?.updateHUD) window.UI.updateHUD();
    if (window.UI?.updateUpgradeButtons) window.UI.updateUpgradeButtons();
}

// ==========================================
// 🎨 UI
// ==========================================
function createBonusIcon() {
    if (document.getElementById('dailyBonusIcon')) return;
    
    const icon = document.createElement('div');
    icon.id = 'dailyBonusIcon';
    icon.style.cssText = `
        position: fixed; top: 20px; left: 20px;
        width: 60px; height: 60px;
        background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 140, 0, 0.3));
        border: 2px solid #FFD700;
        border-radius: 50%;
        cursor: pointer;
        display: none; 
        flex-direction: column;
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
    
    icon.addEventListener('click', () => {
        claimDailyBonus();
        updateIconDisplay();
    });
    icon.addEventListener('touchstart', (e) => {
        e.preventDefault();
        claimDailyBonus();
        updateIconDisplay();
    }, { passive: false });
    
    document.body.appendChild(icon);
    setInterval(updateIconDisplay, 1000);
}

function updateIconDisplay() {
    const data = window.gameState?.dailyBonus;
    const icon = document.getElementById('dailyBonusIcon');
    
    if (icon) {
        const isMainMenu = !window.gameState?.gameActive;
        icon.style.display = isMainMenu ? 'flex' : 'none';
    }
    
    if (!data) return;
    
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
        notif.style.opacity = '0';
        setTimeout(() => notif.parentNode?.removeChild(notif), 300);
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
    generateReward,
    getToday
};

// ✅ ПУЛЕНЕПРОБИВАЕМАЯ ИНИЦИАЛИЗАЦИЯ (НЕ ПЕРЕЗАПИСЫВАЕТ ОБЛАКО)
function init() {
    const ensureDailyBonus = () => {
        if (window.gameState) {
            if (!window.gameState.dailyBonus) {
                console.log('📅 [DAILY] Инициализация dailyBonus (первый запуск или старый сейв)');
                window.gameState.dailyBonus = {
                    lastClaimDate: null,
                    totalClaimed: 0,
                    streak: 0,
                    lastClaimTimestamp: 0
                };
            } else {
                console.log(' [DAILY] dailyBonus загружен из сохранения:', {
                    lastClaimDate: window.gameState.dailyBonus.lastClaimDate,
                    totalClaimed: window.gameState.dailyBonus.totalClaimed,
                    streak: window.gameState.dailyBonus.streak
                });
            }
            createBonusIcon();
            updateIconDisplay();
            return true;
        }
        return false;
    };

    if (ensureDailyBonus()) {
        console.log('✅ Daily bonus system initialized immediately');
        return;
    }
    
    if (window.EventBus) {
        console.log('⏳ [DAILY] Ждём save:ready...');
        window.EventBus.once('save:ready', () => {
            console.log('✅ [DAILY] save:ready получен, проверяем dailyBonus...');
            ensureDailyBonus();
        });
    } else {
        console.warn('️ [DAILY] EventBus недоступен, fallback на setTimeout');
        setTimeout(() => {
            if (!ensureDailyBonus()) {
                setTimeout(init, 500);
            }
        }, 500);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1000));
} else {
    setTimeout(init, 1000);
}

})();
