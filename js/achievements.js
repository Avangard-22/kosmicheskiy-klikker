// js/achievements.js - ДВУХУРОВНЕВАЯ СИСТЕМА (ЧИСТАЯ РАБОЧАЯ ВЕРСИЯ)
(function() {
    'use strict';

    // ═══════════════════════════════════════════════
    // 🌍 ЛОКАЦИОННЫЕ ДОСТИЖЕНИЯ
    // ═══════════════════════════════════════════════
    var planetAchievements = {
        mercury: {
            levels: [
                { id: 'm_first', target: 1, reward: 50, name: 'Первый камень Меркурия' },
                { id: 'm_blocks_100', target: 100, reward: 200, name: 'Разрушитель кратеров', metric: 'blocks' },
                { id: 'm_blocks_500', target: 500, reward: 500, name: 'Покоритель поверхности', metric: 'blocks' },
                { id: 'm_crits_50', target: 50, reward: 400, name: 'Точный удар в жаре', metric: 'crits' },
                { id: 'm_combo_15', target: 15, reward: 600, name: 'Ритм Меркурия', metric: 'combo' },
                { id: 'm_rare_5', target: 5, reward: 800, name: 'Охотник за аномалиями', metric: 'rare' },
                { id: 'm_complete', target: 1000, reward: 2000, name: '☿ Меркурий покорён!', metric: 'blocks', special: true }
            ],
            planet: 'mercury', icon: 'fas fa-sun', emoji: '☿', description: 'Исследование Меркурия'
        },
        venus: {
            levels: [
                { id: 'v_first', target: 1, reward: 75, name: 'Сквозь облака Венеры' },
                { id: 'v_blocks_250', target: 250, reward: 350, name: 'Борец с парниковым эффектом', metric: 'blocks' },
                { id: 'v_blocks_1000', target: 1000, reward: 800, name: 'Кислотный разрушитель', metric: 'blocks' },
                { id: 'v_crits_100', target: 100, reward: 600, name: 'Точность в тумане', metric: 'crits' },
                { id: 'v_combo_25', target: 25, reward: 1000, name: 'Вихрь Венеры', metric: 'combo' },
                { id: 'v_rare_10', target: 10, reward: 1500, name: 'Искатель артефактов', metric: 'rare' },
                { id: 'v_complete', target: 2500, reward: 3500, name: '♀ Венера покорена!', metric: 'blocks', special: true }
            ],
            planet: 'venus', icon: 'fas fa-cloud', emoji: '♀', description: 'Исследование Венеры'
        },
        earth: {
            levels: [
                { id: 'e_first', target: 1, reward: 100, name: 'Голубая планета' },
                { id: 'e_blocks_500', target: 500, reward: 500, name: 'Защитник Земли', metric: 'blocks' },
                { id: 'e_blocks_2500', target: 2500, reward: 1200, name: 'Страж атмосферы', metric: 'blocks' },
                { id: 'e_crits_200', target: 200, reward: 1000, name: 'Мастер гравитации', metric: 'crits' },
                { id: 'e_combo_35', target: 35, reward: 1800, name: 'Орбитальный ритм', metric: 'combo' },
                { id: 'e_rare_20', target: 20, reward: 2500, name: 'Коллекционер реликвий', metric: 'rare' },
                { id: 'e_complete', target: 5000, reward: 5000, name: '♁ Земля спасена!', metric: 'blocks', special: true }
            ],
            planet: 'earth', icon: 'fas fa-globe-americas', emoji: '🌍', description: 'Защита Земли'
        },
        mars: {
            levels: [
                { id: 'ma_first', target: 1, reward: 150, name: 'Красная пыль' },
                { id: 'ma_blocks_1000', target: 1000, reward: 800, name: 'Путник по каньонам', metric: 'blocks' },
                { id: 'ma_blocks_5000', target: 5000, reward: 2000, name: 'Покоритель Олимпа', metric: 'blocks' },
                { id: 'ma_crits_300', target: 300, reward: 1500, name: 'Марсианский снайпер', metric: 'crits' },
                { id: 'ma_combo_50', target: 50, reward: 2500, name: 'Шторм в пустыне', metric: 'combo' },
                { id: 'ma_rare_30', target: 30, reward: 3500, name: 'Археолог Марса', metric: 'rare' },
                { id: 'ma_complete', target: 10000, reward: 8000, name: '♂ Марс колонизирован!', metric: 'blocks', special: true }
            ],
            planet: 'mars', icon: 'fas fa-mountain', emoji: '♂', description: 'Колонизация Марса'
        },
        jupiter: {
            levels: [
                { id: 'j_first', target: 1, reward: 200, name: 'Газовый гигант' },
                { id: 'j_blocks_2500', target: 2500, reward: 1500, name: 'В буре Юпитера', metric: 'blocks' },
                { id: 'j_blocks_12000', target: 12000, reward: 4000, name: 'В сердце БКП', metric: 'blocks' },
                { id: 'j_crits_500', target: 500, reward: 2500, name: 'Молния Юпитера', metric: 'crits' },
                { id: 'j_combo_75', target: 75, reward: 4000, name: 'Вихрь гиганта', metric: 'combo' },
                { id: 'j_rare_50', target: 50, reward: 6000, name: 'Охотник за спутниками', metric: 'rare' },
                { id: 'j_complete', target: 25000, reward: 15000, name: '♃ Юпитер покорён!', metric: 'blocks', special: true }
            ],
            planet: 'jupiter', icon: 'fas fa-wind', emoji: '♃', description: 'Покорение Юпитера'
        },
        saturn: {
            levels: [
                { id: 's_first', target: 1, reward: 300, name: 'Властелин колец' },
                { id: 's_blocks_5000', target: 5000, reward: 2500, name: 'Скольжение по кольцам', metric: 'blocks' },
                { id: 's_blocks_25000', target: 25000, reward: 6000, name: 'Разрушитель ледяных глыб', metric: 'blocks' },
                { id: 's_crits_800', target: 800, reward: 4000, name: 'Точность сквозь кольца', metric: 'crits' },
                { id: 's_combo_100', target: 100, reward: 6000, name: 'Космический серфер', metric: 'combo' },
                { id: 's_rare_75', target: 75, reward: 9000, name: 'Коллекционер Титана', metric: 'rare' },
                { id: 's_complete', target: 50000, reward: 25000, name: '♄ Сатурн покорён!', metric: 'blocks', special: true }
            ],
            planet: 'saturn', icon: 'fas fa-ring', emoji: '♄', description: 'Исследование Сатурна'
        },
        uranus: {
            levels: [
                { id: 'u_first', target: 1, reward: 500, name: 'Ледяной гигант' },
                { id: 'u_blocks_10000', target: 10000, reward: 4000, name: 'Наклонный путь', metric: 'blocks' },
                { id: 'u_blocks_50000', target: 50000, reward: 10000, name: 'Холодная ярость', metric: 'blocks' },
                { id: 'u_crits_1200', target: 1200, reward: 6000, name: 'Замораживающий удар', metric: 'crits' },
                { id: 'u_combo_150', target: 150, reward: 9000, name: 'Метель Урана', metric: 'combo' },
                { id: 'u_rare_100', target: 100, reward: 15000, name: 'Ледяные кристаллы', metric: 'rare' },
                { id: 'u_complete', target: 100000, reward: 40000, name: '♅ Уран покорён!', metric: 'blocks', special: true }
            ],
            planet: 'uranus', icon: 'fas fa-snowflake', emoji: '♅', description: 'Исследование Урана'
        },
        neptune: {
            levels: [
                { id: 'n_first', target: 1, reward: 750, name: 'Синяя бездна' },
                { id: 'n_blocks_20000', target: 20000, reward: 6000, name: 'В ураганах Нептуна', metric: 'blocks' },
                { id: 'n_blocks_100000', target: 100000, reward: 15000, name: 'Повелитель ветров', metric: 'blocks' },
                { id: 'n_crits_2000', target: 2000, reward: 9000, name: 'Глубинный удар', metric: 'crits' },
                { id: 'n_combo_200', target: 200, reward: 14000, name: 'Шторм 2000 км/ч', metric: 'combo' },
                { id: 'n_rare_150', target: 150, reward: 22000, name: 'Сокровища Тритона', metric: 'rare' },
                { id: 'n_complete', target: 200000, reward: 75000, name: '♆ Нептун покорён!', metric: 'blocks', special: true }
            ],
            planet: 'neptune', icon: 'fas fa-water', emoji: '♆', description: 'Покорение Нептуна'
        },
        pluto: {
            levels: [
                { id: 'p_first', target: 1, reward: 1000, name: 'Граница системы' },
                { id: 'p_blocks_50000', target: 50000, reward: 10000, name: 'Путник пояса Койпера', metric: 'blocks' },
                { id: 'p_blocks_250000', target: 250000, reward: 30000, name: 'Тень Харона', metric: 'blocks' },
                { id: 'p_crits_3500', target: 3500, reward: 15000, name: 'Ледяное сердце', metric: 'crits' },
                { id: 'p_combo_300', target: 300, reward: 25000, name: 'Вечная мерзлота', metric: 'combo' },
                { id: 'p_rare_250', target: 250, reward: 40000, name: 'Секреты Плутона', metric: 'rare' },
                { id: 'p_complete', target: 500000, reward: 150000, name: '♇ Плутон покорён!', metric: 'blocks', special: true }
            ],
            planet: 'pluto', icon: 'fas fa-icicles', emoji: '♇', description: 'Покорение Плутона'
        }
    };

    // ═══════════════════════════════════════════════
    // 🏆 ГЛОБАЛЬНЫЕ ДОСТИЖЕНИЯ
    // ═══════════════════════════════════════════════
    var globalAchievements = {
        combatMastery: {
            levels: [
                { id: 'dmg_100k', target: 100000, reward: 1000, name: '100K урона' },
                { id: 'dmg_1m', target: 1000000, reward: 3000, name: '1M урона' },
                { id: 'dmg_10m', target: 10000000, reward: 10000, name: '10M урона' },
                { id: 'dmg_100m', target: 100000000, reward: 35000, name: '100M урона' },
                { id: 'dmg_1b', target: 1000000000, reward: 125000, name: '1B урона' },
                { id: 'dmg_10b', target: 10000000000, reward: 400000, name: 'Разрушитель миров 💥' }
            ],
            icon: 'fas fa-fist-raised', emoji: '⚔️', description: 'Общий урон'
        },
        resourceCollector: {
            levels: [
                { id: 'cry_10k', target: 10000, reward: 1000, name: '10K кристаллов' },
                { id: 'cry_100k', target: 100000, reward: 5000, name: '100K кристаллов' },
                { id: 'cry_1m', target: 1000000, reward: 20000, name: '1M кристаллов' },
                { id: 'cry_10m', target: 10000000, reward: 75000, name: '10M кристаллов' },
                { id: 'cry_100m', target: 100000000, reward: 300000, name: 'Магнат космоса 💎' }
            ],
            icon: 'fas fa-gem', emoji: '💰', description: 'Собрано кристаллов'
        },
        explorer: {
            levels: [
                { id: 'planets_1', target: 1, reward: 500, name: 'Первая планета' },
                { id: 'planets_3', target: 3, reward: 2000, name: 'Внутренние планеты' },
                { id: 'planets_5', target: 5, reward: 5000, name: 'Пояс астероидов' },
                { id: 'planets_7', target: 7, reward: 15000, name: 'Внешние планеты' },
                { id: 'planets_9', target: 9, reward: 50000, name: 'Покоритель СС 🌌' }
            ],
            icon: 'fas fa-rocket', emoji: '🚀', description: 'Посещено планет'
        },
        comboLegend: {
            levels: [
                { id: 'cmb_50', target: 50, reward: 1500, name: '50x комбо' },
                { id: 'cmb_100', target: 100, reward: 4000, name: '100x комбо' },
                { id: 'cmb_250', target: 250, reward: 12000, name: '250x комбо' },
                { id: 'cmb_500', target: 500, reward: 35000, name: '500x комбо' },
                { id: 'cmb_1000', target: 1000, reward: 125000, name: 'Легенда ритма 🔥' }
            ],
            icon: 'fas fa-fire', emoji: '🔥', description: 'Максимальное комбо'
        },
        critMaster: {
            levels: [
                { id: 'crit_1k', target: 1000, reward: 1000, name: '1K критов' },
                { id: 'crit_10k', target: 10000, reward: 6000, name: '10K критов' },
                { id: 'crit_100k', target: 100000, reward: 30000, name: '100K критов' },
                { id: 'crit_1m', target: 1000000, reward: 150000, name: 'Мастер точности ⚡' }
            ],
            icon: 'fas fa-crosshairs', emoji: '🎯', description: 'Критических ударов'
        },
        upgradeEnthusiast: {
            levels: [
                { id: 'up_10', target: 10, reward: 500, name: '10 улучшений' },
                { id: 'up_50', target: 50, reward: 3000, name: '50 улучшений' },
                { id: 'up_100', target: 100, reward: 10000, name: '100 улучшений' },
                { id: 'up_250', target: 250, reward: 35000, name: 'Архитектор силы 🔧' }
            ],
            icon: 'fas fa-chart-line', emoji: '🔧', description: 'Куплено улучшений'
        },
        helperCommander: {
            levels: [
                { id: 'help_5', target: 5, reward: 1500, name: '5 помощников' },
                { id: 'help_25', target: 25, reward: 7000, name: '25 помощников' },
                { id: 'help_100', target: 100, reward: 30000, name: 'Командир эскадры 🤖' }
            ],
            icon: 'fas fa-robot', emoji: '🤖', description: 'Активировано помощников'
        },
        boosterUser: {
            levels: [
                { id: 'boost_1', target: 1, reward: 500, name: 'Первый буст' },
                { id: 'boost_5', target: 5, reward: 1500, name: '5 бустов' },
                { id: 'boost_15', target: 15, reward: 4000, name: '15 бустов' },
                { id: 'boost_30', target: 30, reward: 10000, name: '30 бустов' },
                { id: 'boost_50', target: 50, reward: 25000, name: '50 бустов' },
                { id: 'boost_100', target: 100, reward: 75000, name: '100 бустов' }
            ],
            icon: 'fas fa-flask', emoji: '⚗️', description: 'Использовано бустов'
        },
        timeInvestor: {
            levels: [
                { id: 't_1h', target: 3600, reward: 1500, name: '1 час' },
                { id: 't_5h', target: 18000, reward: 7000, name: '5 часов' },
                { id: 't_10h', target: 36000, reward: 20000, name: '10 часов' },
                { id: 't_25h', target: 90000, reward: 75000, name: 'Преданный игрок ⏰' }
            ],
            icon: 'fas fa-clock', emoji: '⏱️', description: 'Время в игре'
        },
        rareHunter: {
            levels: [
                { id: 'r_10', target: 10, reward: 2000, name: '10 редких блоков' },
                { id: 'r_50', target: 50, reward: 8000, name: '50 редких блоков' },
                { id: 'r_200', target: 200, reward: 30000, name: '200 редких блоков' },
                { id: 'r_1000', target: 1000, reward: 150000, name: 'Легенда удачи ⭐' }
            ],
            icon: 'fas fa-star', emoji: '⭐', description: 'Разрушено редких блоков'
        },
        clickMaster: {
            levels: [
                { id: 'cl_1k', target: 1000, reward: 500, name: '1K кликов' },
                { id: 'cl_10k', target: 10000, reward: 3000, name: '10K кликов' },
                { id: 'cl_100k', target: 100000, reward: 15000, name: '100K кликов' },
                { id: 'cl_1m', target: 1000000, reward: 75000, name: '1M кликов' },
                { id: 'cl_10m', target: 10000000, reward: 250000, name: 'Легенда кликов 👆' }
            ],
            icon: 'fas fa-hand-pointer', emoji: '👆', description: 'Совершено кликов'
        }
    };

    var achievements = {};
    var key;
    for (key in planetAchievements) {
        if (planetAchievements.hasOwnProperty(key)) achievements[key] = planetAchievements[key];
    }
    for (key in globalAchievements) {
        if (globalAchievements.hasOwnProperty(key)) achievements[key] = globalAchievements[key];
    }

    var achievementsPanelVisible = false;
    var totalAchievements = 0;
    var unlockedAchievements = 0;
    var currentView = 'grid';
    var currentDetailCategory = null;
    var currentTab = 'planets';
    var saveDebounceTimer = null;

    var STAGES = {
        0: { name: 'Заблокировано', cls: 'stage-locked', icon: '🔒' },
        1: { name: 'Бронза', cls: 'stage-bronze', icon: '🥉' },
        2: { name: 'Серебро', cls: 'stage-silver', icon: '🥈' },
        3: { name: 'Золото', cls: 'stage-gold', icon: '🥇' },
        4: { name: 'Алмаз', cls: 'stage-diamond', icon: '💎' },
        5: { name: 'Мастер', cls: 'stage-master', icon: '👑' }
    };

    function formatNum(n) {
        if (n >= 1000000000) return (n / 1000000000).toFixed(1) + 'B';
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return String(n);
    }

    function calculateStage(catId) {
        var cat = achievements[catId];
        var gs = window.gameState;
        var catState = (gs && gs.achievements) ? gs.achievements[catId] : null;
        if (!cat || !catState) return { stage: 0, unlocked: 0, total: cat ? cat.levels.length : 0, pct: 0 };
        
        var unlocked = 0;
        for (var i = 0; i < cat.levels.length; i++) {
            var state = catState.levels[cat.levels[i].id];
            if (state && state.unlocked) unlocked++;
        }
        
        var total = cat.levels.length;
        var pct = total > 0 ? (unlocked / total) * 100 : 0;
        var stage = 0;
        if (pct >= 100) stage = 5;
        else if (pct >= 75) stage = 4;
        else if (pct >= 50) stage = 3;
        else if (pct >= 25) stage = 2;
        else if (pct > 0) stage = 1;
        
        return { stage: stage, unlocked: unlocked, total: total, pct: pct };
    }

    function debouncedSave() {
        if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
        saveDebounceTimer = setTimeout(function() {
            if (typeof window.saveGame === 'function') window.saveGame();
        }, 10000);
    }

    function injectStyles() {
        if (document.getElementById('achievement-new-styles')) return;
        var style = document.createElement('style');
        style.id = 'achievement-new-styles';
        var css = '';
        css += '.ach-tabs{display:flex;gap:8px;margin-bottom:12px;border-bottom:2px solid rgba(255,255,255,0.1);padding-bottom:8px}';
        css += '.ach-tab{flex:1;padding:10px;text-align:center;background:rgba(255,255,255,0.05);border-radius:8px;cursor:pointer;transition:all 0.2s;color:#aaa;font-weight:bold;font-family:Orbitron,sans-serif;font-size:0.9em}';
        css += '.ach-tab.active{background:linear-gradient(135deg,#4FC3F7,#2196F3);color:#fff;box-shadow:0 2px 8px rgba(33,150,243,0.4)}';
        css += '.ach-tab:hover:not(.active){background:rgba(255,255,255,0.1)}';
        css += '.ach-grid-container{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:12px;padding:10px 0}';
        css += '.ach-icon-card{aspect-ratio:1;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all 0.25s cubic-bezier(0.175,0.885,0.32,1.275);position:relative;overflow:hidden;padding:6px;min-height:100px}';
        css += '.ach-icon-card:hover{transform:translateY(-3px) scale(1.05)}';
        css += '.ach-icon-card:active{transform:scale(0.95)}';
        css += '.stage-locked{background:linear-gradient(135deg,#2a2a3a,#1a1a2a);border:2px solid #3a3a4a;opacity:0.6}';
        css += '.stage-bronze{background:linear-gradient(135deg,#cd7f32,#8b4513);border:2px solid #cd7f32;box-shadow:0 2px 8px rgba(205,127,50,0.3)}';
        css += '.stage-silver{background:linear-gradient(135deg,#e8e8e8,#a8a8a8);border:2px solid #c0c0c0;box-shadow:0 2px 10px rgba(192,192,192,0.4)}';
        css += '.stage-gold{background:linear-gradient(135deg,#ffd700,#daa520,#ffed4e);background-size:200% 200%;border:2px solid #ffd700;box-shadow:0 0 15px rgba(255,215,0,0.6);animation:goldShine 3s ease infinite}';
        css += '.stage-diamond{background:linear-gradient(135deg,#b9f2ff,#4fc3f7,#00bcd4,#b9f2ff);background-size:300% 300%;border:2px solid #00ffff;box-shadow:0 0 20px rgba(0,255,255,0.7);animation:diamondShine 4s ease infinite}';
        css += '.stage-master{background:linear-gradient(135deg,#ff00ff,#8b00ff,#00ffff,#ff00ff);background-size:300% 300%;border:2px solid #fff;box-shadow:0 0 25px rgba(255,0,255,0.8),0 0 40px rgba(139,0,255,0.5);animation:rainbowShift 3s ease infinite}';
        css += '@keyframes goldShine{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}';
        css += '@keyframes diamondShine{0%,100%{background-position:0% 0%}50%{background-position:100% 100%}}';
        css += '@keyframes rainbowShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}';
        css += '.ach-icon-emoji{font-size:2.2em;margin-bottom:4px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))}';
        css += '.stage-locked .ach-icon-emoji{filter:grayscale(100%) brightness(0.5)}';
        css += '.ach-icon-name{font-size:0.65em;color:#fff;text-align:center;font-weight:bold;text-shadow:0 1px 2px rgba(0,0,0,0.8);line-height:1.1;max-width:100%;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}';
        css += '.ach-icon-stage{font-size:0.6em;margin-top:2px;padding:1px 6px;border-radius:8px;background:rgba(0,0,0,0.4);color:#fff}';
        css += '.ach-icon-progress{position:absolute;bottom:0;left:0;right:0;height:4px;background:rgba(0,0,0,0.3)}';
        css += '.ach-icon-progress-fill{height:100%;background:linear-gradient(90deg,#4CAF50,#8BC34A);transition:width 0.5s ease}';
        css += '.ach-master-crown{position:absolute;top:-5px;right:-5px;font-size:1.5em;animation:crownBounce 2s ease infinite;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));z-index:2}';
        css += '@keyframes crownBounce{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-3px) rotate(10deg)}}';
        css += '.ach-detail-view{padding:10px 0}';
        css += '.ach-detail-header{display:flex;align-items:center;gap:15px;padding:15px;background:rgba(255,255,255,0.05);border-radius:12px;margin-bottom:15px}';
        css += '.ach-detail-icon{font-size:3em;width:80px;height:80px;display:flex;align-items:center;justify-content:center;border-radius:14px}';
        css += '.ach-detail-info{flex:1}';
        css += '.ach-detail-title{font-size:1.3em;color:#fff;font-weight:bold;margin-bottom:5px}';
        css += '.ach-detail-desc{font-size:0.85em;color:#aaa;margin-bottom:8px}';
        css += '.ach-detail-stats{font-size:0.9em;color:#4FC3F7;font-family:Orbitron,monospace}';
        css += '.ach-back-btn{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:8px 14px;border-radius:8px;cursor:pointer;font-family:Orbitron,sans-serif;font-size:0.85em;margin-bottom:10px;transition:all 0.2s}';
        css += '.ach-back-btn:hover{background:rgba(255,255,255,0.2)}';
        css += '.ach-levels-path{display:flex;flex-wrap:wrap;gap:8px;padding:10px 0}';
        css += '.ach-level-node{flex:1;min-width:70px;padding:10px 6px;border-radius:10px;text-align:center;position:relative;transition:all 0.2s}';
        css += '.ach-level-node.unlocked{background:linear-gradient(135deg,rgba(76,175,80,0.2),rgba(139,195,74,0.2));border:2px solid #4CAF50}';
        css += '.ach-level-node.current{background:linear-gradient(135deg,rgba(255,215,0,0.2),rgba(255,140,0,0.2));border:2px solid #FFD700;box-shadow:0 0 12px rgba(255,215,0,0.4)}';
        css += '.ach-level-node.locked{background:rgba(255,255,255,0.03);border:2px solid rgba(255,255,255,0.1);opacity:0.5}';
        css += '.ach-level-node.special{border-color:#FF6B9D!important;box-shadow:0 0 15px rgba(255,107,157,0.5)}';
        css += '.ach-level-target{font-size:0.9em;font-weight:bold;color:#fff;margin-bottom:3px;font-family:Orbitron,monospace}';
        css += '.ach-level-name{font-size:0.6em;color:#ccc;line-height:1.1}';
        css += '.ach-level-reward{font-size:0.6em;color:#FFD700;margin-top:3px}';
        css += '.ach-level-status{font-size:1.2em;margin-top:4px}';
        css += '.ach-current-progress{margin-top:15px;padding:12px;background:rgba(79,195,247,0.1);border-radius:10px;border:1px solid rgba(79,195,247,0.3)}';
        css += '.ach-current-progress-label{font-size:0.8em;color:#4FC3F7;margin-bottom:6px}';
        css += '.ach-current-progress-bar{height:8px;background:rgba(0,0,0,0.3);border-radius:4px;overflow:hidden}';
        css += '.ach-current-progress-fill{height:100%;background:linear-gradient(90deg,#4FC3F7,#2196F3);transition:width 0.5s ease}';
        css += '.ach-current-progress-text{font-size:0.75em;color:#fff;margin-top:4px;font-family:Orbitron,monospace}';
        css += '@media(max-width:480px){.ach-grid-container{grid-template-columns:repeat(3,1fr);gap:8px}.ach-icon-card{min-height:90px}.ach-icon-emoji{font-size:1.8em}.ach-icon-name{font-size:0.55em}.ach-level-node{min-width:60px;padding:8px 4px}.ach-tab{font-size:0.75em;padding:8px 4px}}';
        css += '@keyframes achSlideDown{from{top:-100px;opacity:0;transform:translateX(-50%) scale(0.8)}to{top:20%;opacity:1;transform:translateX(-50%) scale(1)}}';
        css += '@keyframes achSlideUp{from{top:20%;opacity:1;transform:translateX(-50%) scale(1)}to{top:-100px;opacity:0;transform:translateX(-50%) scale(0.8)}}';
        style.textContent = css;
        document.head.appendChild(style);
    }

    function init() {
        injectStyles();
        calculateTotalAchievements();
        createAchievementsPanel();
        setupEventHandlers();
        checkSavedAchievements();
        updateAchievementsDisplay();
        console.log('🏆 Achievements initialized. Total:', totalAchievements);
    }

    function calculateTotalAchievements() {
        totalAchievements = 0;
        for (var k in achievements) {
            if (achievements.hasOwnProperty(k)) {
                totalAchievements += achievements[k].levels.length;
            }
        }
    }

    function createAchievementsPanel() {
        var panel = document.getElementById('achievementsPanel');
        if (!panel) return;
        panel.innerHTML = '';
        
        var header = document.createElement('div');
        header.style.cssText = 'margin-bottom:15px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.1)';
        header.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><h3 style="margin:0;color:#FFD700;font-family:Orbitron,sans-serif">🏆 Достижения</h3><div style="text-align:right"><div id="achTotalCounter" style="font-size:1em;color:#fff;font-weight:bold">0/' + totalAchievements + '</div><div id="achTotalPct" style="font-size:0.75em;color:#aaa">0%</div></div></div><div style="height:8px;background:#333;border-radius:4px;overflow:hidden"><div id="achTotalBar" style="height:100%;width:0%;background:linear-gradient(90deg,#4CAF50,#8BC34A);border-radius:4px;transition:width 0.5s"></div></div>';
        panel.appendChild(header);

        var tabs = document.createElement('div');
        tabs.className = 'ach-tabs';
        tabs.innerHTML = '<div class="ach-tab active" id="achTabPlanets">🌍 Локации</div><div class="ach-tab" id="achTabGlobal">🏆 Общие</div>';
        panel.appendChild(tabs);

        var content = document.createElement('div');
        content.id = 'achContent';
        panel.appendChild(content);

        document.getElementById('achTabPlanets').addEventListener('click', function() { switchTab('planets'); });
        document.getElementById('achTabGlobal').addEventListener('click', function() { switchTab('global'); });

        renderGridView();
    }

    function switchTab(tab) {
        currentTab = tab;
        currentView = 'grid';
        var allTabs = document.querySelectorAll('.ach-tab');
        for (var i = 0; i < allTabs.length; i++) allTabs[i].classList.remove('active');
        document.getElementById(tab === 'planets' ? 'achTabPlanets' : 'achTabGlobal').classList.add('active');
        renderGridView();
    }

    function getFilteredCategories() {
        var result = [];
        for (var k in achievements) {
            if (achievements.hasOwnProperty(k)) {
                var cat = achievements[k];
                if (currentTab === 'planets') {
                    if (cat.planet !== undefined) result.push({ id: k, cat: cat });
                } else {
                    if (cat.planet === undefined) result.push({ id: k, cat: cat });
                }
            }
        }
        return result;
    }

    function renderGridView() {
        currentView = 'grid';
        var content = document.getElementById('achContent');
        if (!content) return;
        content.innerHTML = '';
        var grid = document.createElement('div');
        grid.className = 'ach-grid-container';
        var filtered = getFilteredCategories();

        for (var i = 0; i < filtered.length; i++) {
            var catId = filtered[i].id;
            var cat = filtered[i].cat;
            var info = calculateStage(catId);
            var stageInfo = STAGES[info.stage];

            var card = document.createElement('div');
            card.className = 'ach-icon-card ' + stageInfo.cls;
            card.setAttribute('data-cat-id', catId);

            var crown = info.stage === 5 ? '<div class="ach-master-crown">👑</div>' : '';
            var emoji = info.stage === 0 ? '🔒' : cat.emoji;
            card.innerHTML = crown + '<div class="ach-icon-emoji">' + emoji + '</div><div class="ach-icon-name">' + cat.description + '</div><div class="ach-icon-stage">' + stageInfo.icon + ' ' + info.unlocked + '/' + info.total + '</div><div class="ach-icon-progress"><div class="ach-icon-progress-fill" style="width:' + info.pct + '%"></div></div>';

            (function(id) {
                card.addEventListener('click', function() { showCategoryDetail(id); });
                card.addEventListener('touchstart', function(e) { e.preventDefault(); showCategoryDetail(id); }, { passive: false });
            })(catId);

            grid.appendChild(card);
        }

        if (filtered.length === 0) {
            content.innerHTML = '<div style="text-align:center;padding:30px;color:#888">Нет доступных достижений</div>';
        } else {
            content.appendChild(grid);
        }
    }

    function showCategoryDetail(catId) {
        currentView = 'detail';
        currentDetailCategory = catId;
        var content = document.getElementById('achContent');
        if (!content) return;
        var cat = achievements[catId];
        var gs = window.gameState && window.gameState.achievements ? window.gameState.achievements : {};
        var catState = gs[catId] || { progress: 0, levels: {} };
        var info = calculateStage(catId);
        var stageInfo = STAGES[info.stage];

        var currentLevelIdx = cat.levels.length;
        for (var i = 0; i < cat.levels.length; i++) {
            var st = catState.levels[cat.levels[i].id];
            if (!st || !st.unlocked) { currentLevelIdx = i; break; }
        }

        var emoji = info.stage === 0 ? '🔒' : cat.emoji;
        content.innerHTML = '<button class="ach-back-btn" id="achBackBtn">← Все достижения</button><div class="ach-detail-view"><div class="ach-detail-header"><div class="ach-detail-icon ' + stageInfo.cls + '"><span class="ach-icon-emoji" style="font-size:1em">' + emoji + '</span></div><div class="ach-detail-info"><div class="ach-detail-title">' + cat.description + '</div><div class="ach-detail-desc">Стадия: ' + stageInfo.icon + ' ' + stageInfo.name + '</div><div class="ach-detail-stats">Прогресс: ' + info.unlocked + '/' + info.total + ' (' + Math.round(info.pct) + '%)</div></div></div><div style="color:#aaa;font-size:0.85em;margin-bottom:10px">Уровни:</div><div class="ach-levels-path" id="achLevelsPath"></div><div class="ach-current-progress"><div class="ach-current-progress-label">📊 Текущий прогресс</div><div class="ach-current-progress-bar"><div class="ach-current-progress-fill" id="achCurrentFill"></div></div><div class="ach-current-progress-text" id="achCurrentText"></div></div></div>';

        var path = document.getElementById('achLevelsPath');
        for (var i = 0; i < cat.levels.length; i++) {
            var level = cat.levels[i];
            var state = catState.levels[level.id];
            var isUnlocked = state && state.unlocked;
            var isCurrent = i === currentLevelIdx;
            var statusClass = isUnlocked ? 'unlocked' : (isCurrent ? 'current' : 'locked');
            var statusIcon = isUnlocked ? '✅' : (isCurrent ? '🔄' : '🔒');
            var specialClass = level.special ? ' special' : '';

            var node = document.createElement('div');
            node.className = 'ach-level-node ' + statusClass + specialClass;
            node.innerHTML = '<div class="ach-level-target">' + formatNum(level.target) + '</div><div class="ach-level-name">' + level.name + '</div><div class="ach-level-reward">+' + formatNum(level.reward) + ' 💎</div><div class="ach-level-status">' + statusIcon + '</div>';
            path.appendChild(node);
        }

        updateCurrentProgressDisplay(catId);

        document.getElementById('achBackBtn').addEventListener('click', renderGridView);
        document.getElementById('achBackBtn').addEventListener('touchstart', function(e) { e.preventDefault(); renderGridView(); }, { passive: false });
    }

    function updateCurrentProgressDisplay(catId) {
        var cat = achievements[catId];
        var gs = window.gameState && window.gameState.achievements ? window.gameState.achievements : {};
        var catState = gs[catId] || { progress: 0, levels: {} };
        var currentLevel = null;
        var prevTarget = 0;
        for (var i = 0; i < cat.levels.length; i++) {
            var st = catState.levels[cat.levels[i].id];
            if (!st || !st.unlocked) { currentLevel = cat.levels[i]; break; }
            prevTarget = cat.levels[i].target;
        }

        var fillEl = document.getElementById('achCurrentFill');
        var textEl = document.getElementById('achCurrentText');
        if (!fillEl || !textEl) return;

        if (!currentLevel) {
            fillEl.style.width = '100%';
            textEl.textContent = '🏆 Все уровни пройдены! Итого: ' + (catState.progress || 0).toLocaleString();
        } else {
            var metric = currentLevel.metric;
            var currentProgress = metric ? (catState['progress_' + metric] || 0) : (catState.progress || 0);
            var range = currentLevel.target - prevTarget;
            var progress = currentProgress - prevTarget;
            var pct = Math.min(100, Math.max(0, (progress / range) * 100));
            fillEl.style.width = pct + '%';
            textEl.textContent = currentProgress.toLocaleString() + ' / ' + currentLevel.target.toLocaleString() + ' → ' + currentLevel.name + ' (' + Math.round(pct) + '%)';
        }
    }

    function setupEventHandlers() {
        var btn = document.getElementById('achievementsBtn');
        var panel = document.getElementById('achievementsPanel');
        if (!btn || !panel) return;
        btn.addEventListener('click', toggleAchievementsPanel);
        btn.addEventListener('touchstart', function(e) { e.preventDefault(); toggleAchievementsPanel(); }, { passive: false });

        document.addEventListener('click', function(e) {
            if (achievementsPanelVisible && !panel.contains(e.target) && !btn.contains(e.target)) {
                hideAchievementsPanel();
            }
        });
    }

    function toggleAchievementsPanel() {
        if (achievementsPanelVisible) hideAchievementsPanel();
        else showAchievementsPanel();
    }

    function showAchievementsPanel() {
        var panel = document.getElementById('achievementsPanel');
        if (!panel) return;
        panel.style.display = 'flex';
        achievementsPanelVisible = true;
        renderGridView();
        updateAchievementsDisplay();
        if (window.shopSystem && window.shopSystem.closeShop) window.shopSystem.closeShop();
        
        // ⏸️ Пауза игры
        if (window.GAME_CORE && window.GAME_CORE.pauseGame) {
            window.GAME_CORE.pauseGame();
        }
    }

    function hideAchievementsPanel() {
        var panel = document.getElementById('achievementsPanel');
        if (!panel) return;
        panel.style.display = 'none';
        achievementsPanelVisible = false;
        currentView = 'grid';
        
        // ▶️ Возобновление игры (если магазин закрыт)
        var shopPanel = document.getElementById('shopPanel');
        var isShopOpen = shopPanel && shopPanel.style.display === 'flex';
        if (!isShopOpen && window.GAME_CORE && window.GAME_CORE.resumeGame) {
            window.GAME_CORE.resumeGame();
        }
    }

    function updateProgress(categoryId, value, metric) {
        var gs = window.gameState;
        if (!gs || !gs.achievements) return;
        var catData = achievements[categoryId];
        if (!catData) return;
        if (!gs.achievements[categoryId]) {
            gs.achievements[categoryId] = { progress: 0, levels: {} };
        }
        var catState = gs.achievements[categoryId];

        // ✅ ВСЕГДА обновляем основной progress
        catState.progress = value;

        // ✅ Сохраняем progress_<metric> для локационных
        if (metric) {
            catState['progress_' + metric] = value;
        }

        for (var i = 0; i < catData.levels.length; i++) {
            var level = catData.levels[i];
            var state = catState.levels[level.id];
            if (!state || state.unlocked) continue;
            
            // Если у уровня есть метрика - проверяем соответствие
            if (level.metric && (!metric || level.metric !== metric)) continue;
            
            if (value >= level.target) unlockAchievement(categoryId, level.id);
        }

        updateAchievementsDisplay();
        debouncedSave();
    }

    function unlockAchievement(catId, levelId) {
        var gs = window.gameState;
        if (!gs || !gs.achievements) return;
        var catData = achievements[catId];
        if (!catData) return;
        var level = null;
        for (var i = 0; i < catData.levels.length; i++) {
            if (catData.levels[i].id === levelId) { level = catData.levels[i]; break; }
        }
        if (!level) return;
        var state = gs.achievements[catId] ? gs.achievements[catId].levels[levelId] : null;
        if (!state || state.unlocked) return;

        state.unlocked = true;
        state.progress = level.target;
        gs.coins += level.reward;
        unlockedAchievements++;

        updateAchievementsCounter();
        showAchievementNotification(catId, levelId);

        if (window.GAME_CORE && window.GAME_CORE.playSound) window.GAME_CORE.playSound('upgradeSound');
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        if (typeof window.saveGame === 'function') window.saveGame();
    }

    function showAchievementNotification(catId, levelId) {
        var catData = achievements[catId];
        if (!catData) return;
        var level = null;
        for (var i = 0; i < catData.levels.length; i++) {
            if (catData.levels[i].id === levelId) { level = catData.levels[i]; break; }
        }
        if (!level) return;

        var info = calculateStage(catId);
        var stageInfo = STAGES[info.stage];
        var stageUpMsg = info.stage > 0 ? '<div style="font-size:1em;color:#fff;margin-top:5px">' + stageInfo.icon + ' Стадия: ' + stageInfo.name + '</div>' : '';

        var notif = document.createElement('div');
        notif.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,rgba(255,215,0,0.95),rgba(255,140,0,0.95));color:#000;padding:15px 25px;border-radius:15px;z-index:2000;text-align:center;font-family:Orbitron,sans-serif;font-weight:bold;box-shadow:0 5px 25px rgba(255,215,0,0.5);animation:achSlideDown 0.5s ease-out;max-width:350px;width:90%;border:3px solid #fff';
        notif.innerHTML = '<div style="font-size:2em;margin-bottom:5px">' + catData.emoji + '</div><div style="font-size:1.4em;margin-bottom:5px">🏆 ДОСТИЖЕНИЕ!</div><div style="font-size:1.1em;margin-bottom:8px;color:#fff">' + level.name + '</div><div style="font-size:0.85em;margin-bottom:10px;color:#eee">' + catData.description + '</div><div style="font-size:1em;color:#FFD700">💎 +' + level.reward.toLocaleString() + '</div>' + stageUpMsg;
        document.body.appendChild(notif);
        setTimeout(function() {
            notif.style.animation = 'achSlideUp 0.5s ease-in forwards';
            setTimeout(function() { if (notif.parentNode) notif.parentNode.removeChild(notif); }, 500);
        }, 3000);
    }

    function updateAchievementsCounter() {
        var btn = document.getElementById('achievementsBtn');
        if (!btn) return;
        var span = btn.querySelector('#achievementsCount');
        if (!span) {
            span = document.createElement('span');
            span.id = 'achievementsCount';
            span.style.cssText = 'font-size:0.55em;margin-left:3px;position:absolute;bottom:2px;right:8px;font-weight:bold';
            btn.appendChild(span);
        }
        span.textContent = unlockedAchievements + '/' + totalAchievements;
    }

    function updateAchievementsDisplay() {
        var gs = window.gameState;
        if (!gs) return;
        unlockedAchievements = 0;
        for (var k in achievements) {
            if (achievements.hasOwnProperty(k)) {
                var catState = gs.achievements ? gs.achievements[k] : null;
                if (!catState) continue;
                var cat = achievements[k];
                for (var i = 0; i < cat.levels.length; i++) {
                    var state = catState.levels[cat.levels[i].id];
                    if (state && state.unlocked) unlockedAchievements++;
                }
            }
        }

        var totalCounter = document.getElementById('achTotalCounter');
        var totalPct = document.getElementById('achTotalPct');
        var totalBar = document.getElementById('achTotalBar');
        if (totalCounter) totalCounter.textContent = unlockedAchievements + '/' + totalAchievements;
        var pct = totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0;
        if (totalPct) totalPct.textContent = Math.round(pct) + '%';
        if (totalBar) totalBar.style.width = pct + '%';

        if (currentView === 'grid') {
            var filtered = getFilteredCategories();
            for (var i = 0; i < filtered.length; i++) {
                var catId = filtered[i].id;
                var card = document.querySelector('.ach-icon-card[data-cat-id="' + catId + '"]');
                if (!card) continue;
                var info = calculateStage(catId);
                var stageInfo = STAGES[info.stage];
                card.className = 'ach-icon-card ' + stageInfo.cls;
                var existingCrown = card.querySelector('.ach-master-crown');
                if (info.stage === 5 && !existingCrown) {
                    var crown = document.createElement('div');
                    crown.className = 'ach-master-crown';
                    crown.textContent = '👑';
                    card.appendChild(crown);
                } else if (info.stage !== 5 && existingCrown) {
                    existingCrown.remove();
                }
                var emojiEl = card.querySelector('.ach-icon-emoji');
                if (emojiEl) emojiEl.textContent = info.stage === 0 ? '🔒' : achievements[catId].emoji;
                var stageEl = card.querySelector('.ach-icon-stage');
                if (stageEl) stageEl.innerHTML = stageInfo.icon + ' ' + info.unlocked + '/' + info.total;
                var progressFill = card.querySelector('.ach-icon-progress-fill');
                if (progressFill) progressFill.style.width = info.pct + '%';
            }
        } else if (currentView === 'detail' && currentDetailCategory) {
            showCategoryDetail(currentDetailCategory);
        }

        updateAchievementsCounter();
    }

    function checkSavedAchievements() {
        var gs = window.gameState;
        if (!gs.achievements) gs.achievements = {};
        
        for (var k in achievements) {
            if (achievements.hasOwnProperty(k)) {
                var cat = achievements[k];
                if (!gs.achievements[k]) {
                    gs.achievements[k] = { progress: 0, levels: {} };
                }
                for (var i = 0; i < cat.levels.length; i++) {
                    var level = cat.levels[i];
                    if (!gs.achievements[k].levels[level.id]) {
                        gs.achievements[k].levels[level.id] = { unlocked: false, progress: 0 };
                    }
                }
            }
        }

        var gm = window.gameMetrics || {};

        function syncGlobal(cat, val) {
            if (val === undefined || !gs.achievements[cat]) return;
            gs.achievements[cat].progress = val;
            var levels = achievements[cat].levels;
            for (var i = 0; i < levels.length; i++) {
                if (levels[i].metric) continue;
                var st = gs.achievements[cat].levels[levels[i].id];
                if (st && !st.unlocked && val >= levels[i].target) {
                    st.unlocked = true;
                    st.progress = levels[i].target;
                }
            }
        }

        syncGlobal('combatMastery', gs.totalDamageDealt);
        syncGlobal('resourceCollector', gm.totalCoinsEarned);
        syncGlobal('explorer', gm.planetsVisited || 1);
        syncGlobal('comboLegend', gm.maxCombo);
        syncGlobal('critMaster', gm.totalCrits);
        syncGlobal('upgradeEnthusiast', gm.upgradesBought);
        syncGlobal('helperCommander', gm.helpersBought);
        syncGlobal('boosterUser', gm.boostersUsed);
        syncGlobal('timeInvestor', Math.floor((Date.now() - (gm.startTime || Date.now())) / 1000));
        syncGlobal('rareHunter', gm.rareBlocksDestroyed);
        syncGlobal('clickMaster', gm.totalClicks);

        for (var p in planetAchievements) {
            if (planetAchievements.hasOwnProperty(p)) {
                var stats = gm.planetStats ? gm.planetStats[p] : null;
                if (!stats || !gs.achievements[p]) continue;
                
                var catState = gs.achievements[p];
                if (stats.blocks !== undefined) {
                    catState.progress = stats.blocks;
                    catState.progress_blocks = stats.blocks;
                }
                if (stats.crits !== undefined) catState.progress_crits = stats.crits;
                if (stats.combo !== undefined) catState.progress_combo = stats.combo;
                if (stats.rare !== undefined) catState.progress_rare = stats.rare;

                var levels = achievements[p].levels;
                for (var i = 0; i < levels.length; i++) {
                    var st = catState.levels[levels[i].id];
                    if (!st) continue;
                    var metric = levels[i].metric || 'blocks';
                    var val = stats[metric] || 0;
                    if (!st.unlocked && val >= levels[i].target) {
                        st.unlocked = true;
                        st.progress = levels[i].target;
                    }
                }
            }
        }
    }

    window.achievementsSystem = {
        init: init,
        toggleAchievementsPanel: toggleAchievementsPanel,
        showAchievementsPanel: showAchievementsPanel,
        hideAchievementsPanel: hideAchievementsPanel,
        updateProgress: updateProgress,
        unlockAchievement: unlockAchievement,
        updateAchievementsDisplay: updateAchievementsDisplay,
        getUnlockedCount: function() { return unlockedAchievements; },
        getTotalCount: function() { return totalAchievements; },
        
        incrementPlanetBlocks: function(planet, c) {
            if (!c) c = 1;
            var gm = window.gameMetrics;
            if (!gm) gm = window.gameMetrics = {};
            if (!gm.planetStats) gm.planetStats = {};
            if (!gm.planetStats[planet]) gm.planetStats[planet] = { blocks: 0, crits: 0, combo: 0, rare: 0 };
            gm.planetStats[planet].blocks = (gm.planetStats[planet].blocks || 0) + c;
            updateProgress(planet, gm.planetStats[planet].blocks, 'blocks');
        },
        incrementPlanetCrits: function(planet, c) {
            if (!c) c = 1;
            var gm = window.gameMetrics;
            if (!gm || !gm.planetStats || !gm.planetStats[planet]) return;
            gm.planetStats[planet].crits = (gm.planetStats[planet].crits || 0) + c;
            updateProgress(planet, gm.planetStats[planet].crits, 'crits');
        },
        updatePlanetCombo: function(planet, combo) {
            var gm = window.gameMetrics;
            if (!gm || !gm.planetStats || !gm.planetStats[planet]) return;
            if (combo > (gm.planetStats[planet].combo || 0)) {
                gm.planetStats[planet].combo = combo;
                updateProgress(planet, combo, 'combo');
            }
        },
        incrementPlanetRareBlocks: function(planet, c) {
            if (!c) c = 1;
            var gm = window.gameMetrics;
            if (!gm || !gm.planetStats || !gm.planetStats[planet]) return;
            gm.planetStats[planet].rare = (gm.planetStats[planet].rare || 0) + c;
            updateProgress(planet, gm.planetStats[planet].rare, 'rare');
        },

        incrementTotalDamage: function(d) {
            var gs = window.gameState;
            if (!gs) gs = window.gameState = {};
            gs.totalDamageDealt = (gs.totalDamageDealt || 0) + d;
            updateProgress('combatMastery', gs.totalDamageDealt);
        },
        incrementCoinsEarned: function(a) {
            var gm = window.gameMetrics;
            if (!gm) gm = window.gameMetrics = {};
            gm.totalCoinsEarned = (gm.totalCoinsEarned || 0) + a;
            updateProgress('resourceCollector', gm.totalCoinsEarned);
        },
        updatePlanetProgress: function(lvl) {
            var gm = window.gameMetrics;
            if (!gm) gm = window.gameMetrics = {};
            gm.planetsVisited = Math.max(gm.planetsVisited || 0, lvl);
            updateProgress('explorer', gm.planetsVisited);
        },
        updateCombo: function(combo) {
            var gm = window.gameMetrics;
            if (!gm) gm = window.gameMetrics = {};
            if (combo > (gm.maxCombo || 0)) {
                gm.maxCombo = combo;
                updateProgress('comboLegend', combo);
            }
        },
        incrementCrits: function(c) {
            if (!c) c = 1;
            var gm = window.gameMetrics;
            if (!gm) gm = window.gameMetrics = {};
            gm.totalCrits = (gm.totalCrits || 0) + c;
            updateProgress('critMaster', gm.totalCrits);
        },
        incrementUpgrades: function(c) {
            if (!c) c = 1;
            var gm = window.gameMetrics;
            if (!gm) gm = window.gameMetrics = {};
            gm.upgradesBought = (gm.upgradesBought || 0) + c;
            updateProgress('upgradeEnthusiast', gm.upgradesBought);
        },
        incrementHelpers: function(c) {
            if (!c) c = 1;
            var gm = window.gameMetrics;
            if (!gm) gm = window.gameMetrics = {};
            gm.helpersBought = (gm.helpersBought || 0) + c;
            updateProgress('helperCommander', gm.helpersBought);
        },
        incrementBoosters: function(c) {
            if (!c) c = 1;
            var gm = window.gameMetrics;
            if (!gm) gm = window.gameMetrics = {};
            gm.boostersUsed = (gm.boostersUsed || 0) + c;
            updateProgress('boosterUser', gm.boostersUsed);
        },
        incrementRareBlocks: function(c) {
            if (!c) c = 1;
            var gm = window.gameMetrics;
            if (!gm) gm = window.gameMetrics = {};
            gm.rareBlocksDestroyed = (gm.rareBlocksDestroyed || 0) + c;
            updateProgress('rareHunter', gm.rareBlocksDestroyed);
        },
        incrementTotalClicks: function(c) {
            if (!c) c = 1;
            var gm = window.gameMetrics;
            if (!gm) gm = window.gameMetrics = {};
            gm.totalClicks = (gm.totalClicks || 0) + c;
            updateProgress('clickMaster', gm.totalClicks);
        }
    };

    function safeInit() {
        if (!document.getElementById('achievementsBtn')) { setTimeout(safeInit, 200); return; }
        if (!window.gameState) { setTimeout(safeInit, 200); return; }
        if (!window.GAME_CORE) { setTimeout(safeInit, 200); return; }
        init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { setTimeout(safeInit, 300); });
    } else {
        setTimeout(safeInit, 300);
    }
})();