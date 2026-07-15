// js/achievements-v2/planet-factory.js
// ═══════════════════════════════════════════════════
// 🏭 ФАБРИКА ПЛАНЕТ — Универсальный движок достижений v2
// ЧТО: Создаёт полноценный модуль достижений из конфига.
// ЗАЧЕМ: Чтобы добавить новую планету, нужен ТОЛЬКО конфиг (~20 строк).
//        Вся логика (генерация, ранги, сохранение) едина для всех.
// ═══════════════════════════════════════════════════
(function() {
'use strict';

// ─────────────────────────────────────────────────────
// 🔢 УТИЛИТЫ (детерминизм + римские цифры)
// ─────────────────────────────────────────────────────
function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0);
}

function jit(seed, pct) {
    return 1 + ((hashStr(seed) % 1000) / 1000 - 0.5) * 2 * pct;
}

function toRoman(num) {
    if (num <= 0) return String(num);
    const lookup = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
    let roman = '';
    for (const i in lookup) { while (num >= lookup[i]) { roman += i; num -= lookup[i]; } }
    return roman;
}

// ─────────────────────────────────────────────────────
// 🎖️ РАНГИ (единые для всех планет)
// ─────────────────────────────────────────────────────
const RANKS = [
    { threshold: 1,    title: { ru: '✨ Искра',       en: '✨ Spark',          zh: '✨ 火花' },     bonus: null },
    { threshold: 10,   title: { ru: '🌟 Созвездие',   en: '🌟 Constellation',  zh: '🌟 星座' },   bonus: { type: 'clickPower', value: 0.01 } },
    { threshold: 50,   title: { ru: '🌌 Галактика',   en: '🌌 Galaxy',         zh: '🌌 星系' },   bonus: { type: 'coinsMult', value: 0.02 } },
    { threshold: 100,  title: { ru: '🌫️ Туманность',  en: '🌫️ Nebula',         zh: '🌫️ 星云' },   bonus: { type: 'critChance', value: 0.003 } },
    { threshold: 250,  title: { ru: '💥 Сверхновая',  en: '💥 Supernova',      zh: '💥 超新星' }, bonus: { type: 'comboMult', value: 0.05 } },
    { threshold: 500,  title: { ru: '🕳️ Чёрная дыра', en: '🕳️ Black Hole',     zh: '🕳️ 黑洞' },   bonus: { type: 'damageMult', value: 0.07 } },
    { threshold: 1000, title: { ru: '⚛️ Кварк',       en: '⚛️ Quark',           zh: '⚛️ 夸克' },   bonus: { type: 'rareChance', value: 0.10 } }
];

function calculateRank(totalUnlocked) {
    let currentRank = RANKS[0];
    let nextThreshold = RANKS[1]?.threshold || null;
    
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (totalUnlocked >= RANKS[i].threshold) {
            currentRank = RANKS[i];
            nextThreshold = RANKS[i + 1]?.threshold || null;
            break;
        }
    }
    
    if (totalUnlocked >= 1000) {
        const extraRanks = Math.floor((totalUnlocked - 1000) / 100);
        const legendNum = extraRanks + 1;
        nextThreshold = 1000 + (extraRanks + 1) * 100;
        currentRank = {
            threshold: 1000 + extraRanks * 100,
            title: {
                ru: `👑 Легенда ${toRoman(legendNum)}`,
                en: `👑 Legend ${toRoman(legendNum)}`,
                zh: `👑 传奇 ${toRoman(legendNum)}`
            },
            bonus: { type: 'allMult', value: 0.01 * legendNum }
        };
    }
    
    return { rank: totalUnlocked, title: currentRank.title, bonus: currentRank.bonus, nextThreshold };
}

// ─────────────────────────────────────────────────────
// 🏭 СОЗДАНИЕ МОДУЛЯ ПЛАНЕТЫ
// ─────────────────────────────────────────────────────
function createPlanetModule(config, nameTemplates) {
    
    // ⚙️ Генератор уровней
    function generateLevel(metric, tier) {
        const cfg = config.metrics[metric];
        if (!cfg) return null;
        
        const seed = `${config.id}:${metric}:${tier}`;
        let target;
        if (cfg.type === 'record_min') {
            target = Math.max(1000, Math.round(cfg.base * Math.pow(cfg.growth, tier) * jit(seed, 0.10)));
        } else {
            target = Math.max(1, Math.round(cfg.base * Math.pow(cfg.growth, tier) * jit(seed, 0.10)));
        }
        
        const reward = Math.max(1, Math.round(cfg.rewardBase * Math.pow(cfg.rewardGrowth, tier) * jit(seed + ':r', 0.05)));
        const tmpl = nameTemplates[metric] || { key: `ach.${config.id}.${metric}`, fallback: `${metric} {N}` };
        
        return {
            id: `${config.prefix}_${metric}_t${tier}`,
            tier, target, reward,
            nameKey: tmpl.key,
            nameFallback: tmpl.fallback.replace('{N}', tier + 1),
            metric, metricType: cfg.type, emoji: cfg.emoji
        };
    }
    
    function generateLevels(metric, fromTier, count) {
        const levels = [];
        for (let i = 0; i < count; i++) {
            const level = generateLevel(metric, fromTier + i);
            if (level) levels.push(level);
        }
        return levels;
    }
    
    function isLevelComplete(metric, tier, currentValue) {
        const level = generateLevel(metric, tier);
        if (!level) return false;
        if (level.metricType === 'record_min') return currentValue > 0 && currentValue <= level.target;
        return currentValue >= level.target;
    }
    
    function getCardProgress(metric, currentValue) {
        let tier = 0, totalUnlocked = 0;
        while (true) {
            if (isLevelComplete(metric, tier, currentValue)) { totalUnlocked++; tier++; }
            else break;
            if (tier > 10000) break;
        }
        const currentLevel = generateLevel(metric, tier);
        const prevLevel = tier > 0 ? generateLevel(metric, tier - 1) : null;
        let percent = 0;
        if (currentLevel) {
            const prevTarget = prevLevel ? prevLevel.target : 0;
            const range = currentLevel.target - prevTarget;
            const progress = currentValue - prevTarget;
            percent = Math.min(100, Math.max(0, (progress / range) * 100));
        } else { percent = 100; }
        return { currentTier: tier, currentLevel, percent, totalUnlocked };
    }
    
    // 🏆 Мастер-достижение
    function getMasterAchievement() {
        const AU_TO_DAMAGE = window.GAME_CONFIG?.AU_TO_DAMAGE || 149597870.691;
        const masterTarget = Math.round(config.masterAU * AU_TO_DAMAGE * 0.999);
        return {
            id: `${config.prefix}_master`, tier: -1, target: masterTarget, reward: 5000,
            nameKey: `ach.${config.id}.master`,
            nameFallback: `${config.emoji} ${config.id.toUpperCase()} покорён!`,
            metric: 'planetDamage', metricType: 'cumulative', isMaster: true, emoji: '👑'
        };
    }
    
    // 💾 Обновление прогресса (с начислением кристаллов)
    function updateMetricProgress(metric, newValue) {
        if (!window.gameState) return;
        if (!window.gameState.achievementsV2) window.gameState.achievementsV2 = {};
        if (!window.gameState.achievementsV2[config.id]) {
            window.gameState.achievementsV2[config.id] = { rank: 0, totalUnlocked: 0, metrics: {}, masterUnlocked: false };
        }
        const planet = window.gameState.achievementsV2[config.id];
        if (!planet.metrics[metric]) planet.metrics[metric] = { level: 0, progress: 0 };
        
        const state = planet.metrics[metric];
        state.progress = newValue;
        
        let unlockedAny = false;
        let totalReward = 0;
        
        while (isLevelComplete(metric, state.level, newValue)) {
            const level = generateLevel(metric, state.level);
            if (!level) break;
            
            state.level++;
            planet.totalUnlocked++;
            unlockedAny = true;
            totalReward += level.reward;
            
            console.log(`🏆 [ACH-V2] ${config.id}.${metric} tier ${state.level - 1} unlocked! +${level.reward} 💎`);
            
            if (window.EventBus) {
                window.EventBus.emit('achievement:v2:unlocked', {
                    planet: config.id, metric, tier: state.level - 1, level, reward: level.reward
                });
            }
        }
        
        // ✅ КРИТИЧЕСКИ ВАЖНО: Начисление кристаллов и обновление UI
        if (totalReward > 0) {
            window.gameState.coins = (window.gameState.coins || 0) + totalReward;
            if (window.achievementsSystem?.incrementCoinsEarned) window.achievementsSystem.incrementCoinsEarned(totalReward);
            if (window.GAME_UI?.updateHUD) window.GAME_UI.updateHUD();
            if (window.GAME_UI?.updateUpgradeButtons) window.GAME_UI.updateUpgradeButtons();
            if (window.shopSystem?.updateShopDisplay) window.shopSystem.updateShopDisplay();
            if (window.GAME_CORE?.playSound) window.GAME_CORE.playSound('upgradeSound');
            if (window.telegramHaptic?.success) window.telegramHaptic.success();
            else if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
            if (typeof window.saveGame === 'function') window.saveGame();
        }
        
        if (unlockedAny) {
            planet.rank = planet.totalUnlocked;
            if (window.EventBus) {
                window.EventBus.emit('achievement:v2:rankChanged', { planet: config.id, rank: planet.rank });
            }
        }
    }
    
    function checkMasterAchievement(currentPlanetDamage) {
        if (!window.gameState?.achievementsV2?.[config.id]) return;
        const planet = window.gameState.achievementsV2[config.id];
        if (planet.masterUnlocked) return;
        
        const master = getMasterAchievement();
        if (currentPlanetDamage >= master.target) {
            planet.masterUnlocked = true;
            planet.totalUnlocked++;
            planet.rank = planet.totalUnlocked;
            
            window.gameState.coins = (window.gameState.coins || 0) + master.reward;
            if (window.achievementsSystem?.incrementCoinsEarned) window.achievementsSystem.incrementCoinsEarned(master.reward);
            if (window.GAME_UI?.updateHUD) window.GAME_UI.updateHUD();
            if (window.GAME_CORE?.playSound) window.GAME_CORE.playSound('upgradeSound');
            if (window.telegramHaptic?.success) window.telegramHaptic.success();
            if (typeof window.saveGame === 'function') window.saveGame();
            
            console.log(`👑 [ACH-V2] MASTER: ${master.nameFallback}! +${master.reward} 💎`);
            if (window.EventBus) {
                window.EventBus.emit('achievement:v2:masterUnlocked', { planet: config.id, achievement: master });
            }
        }
    }
    
    function getMetricDefinitions() {
        return Object.entries(config.metrics).map(([id, cfg]) => ({
            id, emoji: cfg.emoji,
            nameKey: nameTemplates[id]?.key || `ach.metric.${id}`,
            fallback: nameTemplates[id]?.fallback || id,
            type: cfg.type
        }));
    }
    
    // ── Возвращаем готовый модуль ──
    return {
        config,
        generateLevel, generateLevels, getMasterAchievement, getMetricDefinitions,
        isLevelComplete, getCardProgress, calculateRank,
        updateMetricProgress, checkMasterAchievement,
        getPlanetInfo: function() {
            return {
                id: config.id, emoji: config.emoji,
                nameKey: config.nameKey, descKey: config.descKey,
                scale: config.scale, masterAU: config.masterAU,
                metricCount: Object.keys(config.metrics).length
            };
        }
    };
}

// ─────────────────────────────────────────────────────
// 🌐 РЕЕСТР ПЛАНЕТ + ПУБЛИЧНЫЙ API
// ─────────────────────────────────────────────────────
const planets = {};

window.AchievementsV2 = window.AchievementsV2 || {};
window.AchievementsV2.PlanetFactory = {
    create: function(config, nameTemplates) {
        const module = createPlanetModule(config, nameTemplates);
        planets[config.id] = module;
        // Экспортируем как AchievementsV2.Mercury, AchievementsV2.Venus и т.д.
        const capitalizedName = config.id.charAt(0).toUpperCase() + config.id.slice(1);
        window.AchievementsV2[capitalizedName] = module;
        console.log(`🪐 [ACH-V2] Planet "${config.id}" registered via Factory`);
        return module;
    },
    get: function(planetId) {
        return planets[planetId] || null;
    },
    getAll: function() {
        return planets;
    }
};

console.log('🏭 [ACH-V2] Planet Factory initialized');
})();
