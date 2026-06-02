// js/save-system.js
(function() {
'use strict';
const SAVE_KEY = 'cosmicClickerSave';
const AUTO_SAVE_INTERVAL = 30000;
const CLOUD_SYNC_COOLDOWN = 5000;

let autoSaveTimer = null;
let lastCloudSync = 0;
let isSyncing = false;

const DEFAULT_GAME_STATE = {
    coins: 0, clickPower: 1, critChance: 0.001, critMultiplier: 2.0,
    currentLocation: 'mercury', totalDamageDealt: 0, clickUpgradeLevel: 0,
    critChanceUpgradeLevel: 0, critMultiplierUpgradeLevel: 0, helperUpgradeLevel: 0,
    helperActivations: 0, helperActive: false, helperTimeLeft: 0, helperDamageBonus: 0,
    boboCoinBonus: 0, comboCount: 0, lastDestroyTime: 0, gameActive: false,
    gamePaused: false, achievements: {}, shopItems: {}, permanentBonuses: {},
    unlockedLocations: ['mercury'], boboSkin: 'default'
};

const DEFAULT_GAME_METRICS = {
    startTime: 0, blocksDestroyed: 0, upgradesBought: 0, totalClicks: 0,
    totalCrits: 0, totalCoinsEarned: 0, helpersBought: 0, boostersUsed: 0,
    maxCombo: 0, rareBlocksDestroyed: 0, sessions: 0
};

function deepMerge(defaults, saved) {
    const result = Object.assign({}, defaults);
    for (const key in saved) {
        if (saved.hasOwnProperty(key) && key in defaults) {
            if (typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key]) &&
                typeof saved[key] === 'object' && saved[key] !== null && !Array.isArray(saved[key])) {
                result[key] = deepMerge(defaults[key], saved[key]);
            } else {
                result[key] = saved[key];
                }
            }
        }
    return result;
}

function extractCloudData() {
    if (!window.gameState) return null;
    const planetOrder = window.GAME_CONFIG?.planetOrder || ['mercury'];
    const currentLevel = planetOrder.indexOf(window.gameState.currentLocation) + 1;
    const unlocked = [];
    for (let i = 0; i <= planetOrder.indexOf(window.gameState.currentLocation); i++) unlocked.push(planetOrder[i]);
    const username = window.telegramUser?.username || window.telegramUser?.first_name || 'Anonymous';
    return {
        crystals: Math.floor(window.gameState.coins || 0),
        level: currentLevel,
        score: Math.floor(window.gameState.totalDamageDealt || 0),
        unlocked_locations: unlocked,
        bobo_skin: window.gameState.boboSkin || 'default',
        username: username
    };
}

function applyCloudData(cloudData) {
    if (!cloudData || !window.gameState) return;
    const planetOrder = window.GAME_CONFIG?.planetOrder || ['mercury'];
    if ((cloudData.crystals || 0) > (window.gameState.coins || 0)) window.gameState.coins = cloudData.crystals;
    const currentLevel = planetOrder.indexOf(window.gameState.currentLocation) + 1;
    if ((cloudData.level || 1) > currentLevel && planetOrder[cloudData.level - 1]) window.gameState.currentLocation = planetOrder[cloudData.level - 1];
    if ((cloudData.score || 0) > (window.gameState.totalDamageDealt || 0)) window.gameState.totalDamageDealt = cloudData.score;
    if (cloudData.bobo_skin) window.gameState.boboSkin = cloudData.bobo_skin;
}

window.saveGame = function() {
    try {
        if (!window.gameState || !window.gameMetrics) return false;
        const saveData = { version: 2, timestamp: Date.now(), gameState: window.gameState, gameMetrics: window.gameMetrics };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        showSaveIndicator('💾', 'Сохранено');
        cloudSaveAsync();
        return true;
    } catch (e) { console.error('❌ Ошибка сохранения:', e); return false; }
};

async function cloudSaveAsync() {
    if (!window.telegramCloud) return;
    const now = Date.now();
    if (now - lastCloudSync < CLOUD_SYNC_COOLDOWN || isSyncing) return;
    isSyncing = true;
    try {
        const cloudData = extractCloudData();
        if (cloudData) {
            const result = await window.telegramCloud.saveProgress(cloudData);
            if (result?.success) {
                lastCloudSync = now;
                showSaveIndicator('☁️', 'Синхронизировано', '#4CAF50');
            }
        }
    } catch (e) { console.warn('⚠️ Облачная синхронизация:', e); }
    finally { isSyncing = false; }
}

window.loadGame = function() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        const saveData = JSON.parse(raw);
        if (!saveData?.gameState || !saveData?.gameMetrics) return false;
        window.gameState = deepMerge(DEFAULT_GAME_STATE, saveData.gameState);
        window.gameMetrics = deepMerge(DEFAULT_GAME_METRICS, saveData.gameMetrics);
        window.gameMetrics.sessions = (window.gameMetrics.sessions || 0) + 1;
        window.gameState.gameActive = false;
        window.gameState.gamePaused = false;
        window.gameState.helperActive = false;
        window.gameState.helperTimeLeft = 0;
        window.gameState.boboCoinBonus = 0;
        window.gameState.comboCount = 0;
        return true;
    } catch (e) { console.error('❌ Ошибка загрузки:', e); return false; }
};

window.cloudInit = async function() {
    if (!window.telegramCloud) { console.log('ℹ️ Telegram Cloud не инициализирован'); return; }
    try {
        console.log('☁️ Инициализация облачной синхронизации...');
        const result = await window.telegramCloud.loadProgress();
        if (!result?.success || !result.data) {
            console.log('☁️ Облако пустое, отправляем локальные данные');
            await cloudSaveAsync();
            return;
        }
        const cloudData = result.data;
        const planetOrder = window.GAME_CONFIG?.planetOrder || ['mercury'];
        const currentLevel = planetOrder.indexOf(window.gameState.currentLocation) + 1;
        const cloudWins = (cloudData.crystals || 0) > (window.gameState.coins || 0) || (cloudData.level || 1) > currentLevel;
        
        if (cloudWins) {
            console.log('☁️ Применяем облачные данные:', cloudData);
            applyCloudData(cloudData);
            if (window.UI?.updateHUD) window.UI.updateHUD();
            if (window.showTooltip) {
                window.showTooltip('☁️ Данные восстановлены из облака!');
                setTimeout(() => window.hideTooltip && window.hideTooltip(), 2500);
            }
        } else {
            console.log('☁️ Локальные данные актуальнее');
            await cloudSaveAsync();
        }
    } catch (e) { console.warn('⚠️ cloudInit error:', e); }
};

window.resetGame = function() {
    window.gameState = Object.assign({}, DEFAULT_GAME_STATE);
    window.gameMetrics = Object.assign({}, DEFAULT_GAME_METRICS);
    window.gameMetrics.startTime = Date.now();
    window.gameMetrics.sessions = 1;
    localStorage.removeItem(SAVE_KEY);
    if (window.telegramCloud?.saveProgress) {
        window.telegramCloud.saveProgress({ crystals: 0, level: 1, score: 0, unlocked_locations: ['mercury'], bobo_skin: 'default' }).catch(() => {});
    }
};

window.hasSave = function() { return localStorage.getItem(SAVE_KEY) !== null; };

function showSaveIndicator(icon = '💾', text = 'Сохранено', color = '#4CAF50') {
    let indicator = document.getElementById('saveIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'saveIndicator';
        indicator.style.cssText = 'position:fixed;top:20px;right:20px;padding:8px 16px;background:rgba(0,0,0,0.85);color:#4CAF50;border-radius:8px;font-size:0.9em;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;font-family:Orbitron,sans-serif;';
        document.body.appendChild(indicator);
    }
    indicator.textContent = `${icon} ${text}`;
    indicator.style.color = color;
    indicator.style.opacity = '1';
    clearTimeout(indicator._hideTimer);
    indicator._hideTimer = setTimeout(() => { indicator.style.opacity = '0'; }, 1500);
}

function startAutoSave() {
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    autoSaveTimer = setInterval(() => {
        if (window.gameState?.gameActive) window.saveGame();
    }, AUTO_SAVE_INTERVAL);
}

function init() {
    if (!window.gameState) window.gameState = Object.assign({}, DEFAULT_GAME_STATE);
    else window.gameState = deepMerge(DEFAULT_GAME_STATE, window.gameState);
    if (!window.gameMetrics) window.gameMetrics = Object.assign({}, DEFAULT_GAME_METRICS);
    else window.gameMetrics = deepMerge(DEFAULT_GAME_METRICS, window.gameMetrics);
    startAutoSave();
    window.addEventListener('beforeunload', () => { if (window.gameState?.gameActive) window.saveGame(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && window.gameState?.gameActive) window.saveGame(); });
    console.log('💾 Save System initialized');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();
