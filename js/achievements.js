// js/achievements.js (v2.0) — Генератор + фиксы
(function() {
'use strict';

// ═══════════════════════════════════════════════
// 🌍 ГЕНЕРАТОР ЛОКАЦИОННЫХ ДОСТИЖЕНИЙ
// ═══════════════════════════════════════════════
const PLANET_INFO = {
    mercury:  { ic:'fas fa-sun',            em:'☿',  desc:'Исследование Меркурия', n:['Меркурия','кратеров','жаре','аномалий'], final:'☿ Меркурий покорён!' },
    venus:    { ic:'fas fa-cloud',          em:'♀',  desc:'Исследование Венеры',   n:['Венеры','облаков','тумане','артефактов'], final:'♀ Венера покорена!' },
    earth:    { ic:'fas fa-globe-americas', em:'🌍', desc:'Защита Земли',          n:['Земли','океанов','атмосфере','реликвий'], final:'🌍 Земля спасена!' },
    mars:     { ic:'fas fa-mountain',       em:'♂',  desc:'Колонизация Марса',     n:['Марса','каньонов','пустыне','тайн'], final:'♂ Марс колонизирован!' },
    jupiter:  { ic:'fas fa-wind',           em:'♃',  desc:'Покорение Юпитера',     n:['Юпитера','вихрей','буре','спутников'], final:'♃ Юпитер покорён!' },
    saturn:   { ic:'fas fa-ring',           em:'♄',  desc:'Исследование Сатурна',  n:['Сатурна','колец','льду','Титана'], final:'♄ Сатурн покорён!' },
    uranus:   { ic:'fas fa-snowflake',      em:'♅',  desc:'Исследование Урана',    n:['Урана','метели','холоде','кристаллов'], final:'♅ Уран покорён!' },
    neptune:  { ic:'fas fa-water',          em:'♆',  desc:'Покорение Нептуна',     n:['Нептуна','глубин','урагане','Тритона'], final:'♆ Нептун покорён!' },
    pluto:    { ic:'fas fa-icicles',        em:'♇',  desc:'Исследование Плутона',  n:['Плутона','мерзлоте','тени','секретов'], final:'♇ Плутон покорён!' }
};

// Префиксы как в исходнике — для совместимости со старыми сохранениями
const PLANET_PREFIX = { mercury:'m', venus:'v', earth:'e', mars:'ma', jupiter:'j', saturn:'s', uranus:'u', neptune:'n', pluto:'p' };

// Шкалы целей (масштабируются по индексу планеты)
const BLOCK_SCALE  = [1, 25, 100, 350, 1000, 3500, 12000, 30000, 80000, 250000, 700000];
const CRIT_SCALE   = [10, 30, 80, 200, 500, 1200, 3000, 6000];
const COMBO_SCALE  = [5, 15, 35, 80, 180, 400, 800];
const RARE_SCALE   = [3, 10, 25, 65, 160, 400];

const BLOCK_NAMES = ['Первые следы','Исследователь','Картограф','Разрушитель','Покоритель','Завоеватель','Титан','Легенда','Мифический','Бессмертный','Всевышний'];
const CRIT_NAMES  = ['Точный удар','Снайпер','Молниеносный','Безжалостный','Разящий','Легенда крита','Бог крита','Всевышний крити'];
const COMBO_NAMES = ['Ритм','Вихрь','Шторм','Цунами','Лавина','Апокалипсис','Конец света'];
const RARE_NAMES  = ['Искатель','Коллекционер','Охотник','Археолог','Расхититель','Бог удачи'];

// Детерминированный jitter (±10%) — числа варьируются, но стабильны между сессиями
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

function planetScale(idx) { return Math.pow(1.62, idx); }

function planetLevels(planet, idx) {
    const info = PLANET_INFO[planet];
    const pre  = PLANET_PREFIX[planet];
    const s    = planetScale(idx);
    const seed = planet + ':';
    const L = [];

    // 1) First touch
    L.push({
        id: pre + '_first', target: 1, reward: 25 * (idx + 1),
        name: 'Первое касание ' + info.n[0]
    });

    // 2) Blocks (11 уровней)
    BLOCK_SCALE.forEach((t, i) => {
        const target = Math.max(1, Math.round(t * s * jit(seed + 'b' + i, 0.10)));
        L.push({
            id: pre + '_b' + i, target, reward: Math.round(40 + target * 1.4),
            metric: 'blocks',
            name: (i === 0 ? 'Первый камень' : (BLOCK_NAMES[i-1] || BLOCK_NAMES[BLOCK_NAMES.length-1])) + ' ' + info.n[1]
        });
    });

    // 3) Crits (8 уровней)
    CRIT_SCALE.forEach((t, i) => {
        const target = Math.max(1, Math.round(t * s * jit(seed + 'c' + i, 0.10)));
        L.push({
            id: pre + '_c' + i, target, reward: Math.round(60 + target * 3),
            metric: 'crits',
            name: (CRIT_NAMES[i] || CRIT_NAMES[CRIT_NAMES.length-1]) + ' в ' + info.n[2]
        });
    });

    // 4) Combos (7 уровней)
    COMBO_SCALE.forEach((t, i) => {
        const target = Math.max(1, Math.round(t * s * jit(seed + 'co' + i, 0.10)));
        L.push({
            id: pre + '_co' + i, target, reward: Math.round(80 + target * 5),
            metric: 'combo',
            name: (COMBO_NAMES[i] || COMBO_NAMES[COMBO_NAMES.length-1]) + ' ' + info.n[0]
        });
    });

    // 5) Rares (6 уровней)
    RARE_SCALE.forEach((t, i) => {
        const target = Math.max(1, Math.round(t * s * jit(seed + 'r' + i, 0.10)));
        L.push({
            id: pre + '_r' + i, target, reward: Math.round(150 + target * 80),
            metric: 'rare',
            name: (RARE_NAMES[i] || RARE_NAMES[RARE_NAMES.length-1]) + ' ' + info.n[3]
        });
    });

    // 6) Финальный special
    const lastBlocks = L.filter(x => x.metric === 'blocks').pop();
    L.push({
        id: pre + '_done',
        target: Math.round(lastBlocks.target * 2.5 * jit(seed + 'done', 0.05)),
        reward: Math.round(lastBlocks.target * 0.4),
        metric: 'blocks', special: true,
        name: info.final
    });

    return L;
}

var planetAchievements = {};
(window.GAME_CONFIG?.planetOrder || ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune','pluto'])
    .forEach(function(planet, idx) {
        planetAchievements[planet] = {
            planet: planet,
            icon:   PLANET_INFO[planet].ic,
            emoji:  PLANET_INFO[planet].em,
            description: PLANET_INFO[planet].desc,
            levels: planetLevels(planet, idx)
        };
    });

// ═══════════════════════════════════════════════
// 🏆 ГЕНЕРАТОР ОБЩИХ ДОСТИЖЕНИЙ
// ═══════════════════════════════════════════════
const GLOBAL_DEFS = [
    { id:'combatMastery',     em:'⚔️', ic:'fas fa-fist-raised',  desc:'Общий урон',
      targets:[100000, 1000000, 10000000, 100000000, 1000000000, 10000000000],
      rewards:[1000, 3000, 12000, 40000, 130000, 450000],
      names:['100K урона','1M урона','10M урона','100M урона','1B урона','Разрушитель миров 💥'] },
    { id:'resourceCollector', em:'💰', ic:'fas fa-gem',            desc:'Собрано кристаллов',
      targets:[10000, 100000, 1000000, 10000000, 100000000],
      rewards:[1000, 5000, 20000, 75000, 300000],
      names:['10K 💎','100K 💎','1M 💎','10M 💎','Магнат космоса 💎'] },
    { id:'explorer',          em:'🚀', ic:'fas fa-rocket',         desc:'Посещено планет',
      targets:[1, 3, 5, 7, 9],
      rewards:[500, 2000, 5000, 15000, 60000],
      names:['Первая планета','Внутренние планеты','Пояс астероидов','Внешние планеты','Покоритель СС 🌌'] },
    { id:'comboLegend',       em:'🔥', ic:'fas fa-fire',           desc:'Максимальное комбо',
      targets:[50, 100, 250, 500, 1000, 2500],
      rewards:[1500, 4000, 12000, 35000, 125000, 400000],
      names:['50x','100x','250x','500x','1000x','Легенда ритма 🔥'] },
    { id:'critMaster',        em:'🎯', ic:'fas fa-crosshairs',    desc:'Критических ударов',
      targets:[1000, 5000, 25000, 100000, 500000],
      rewards:[1000, 6000, 35000, 150000, 600000],
      names:['1K критов','5K критов','25K критов','100K критов','Мастер точности ⚡'] },
    { id:'upgradeEnthusiast', em:'🔧', ic:'fas fa-chart-line',    desc:'Куплено улучшений',
      targets:[10, 30, 100, 250, 600, 1500],
      rewards:[500, 2500, 10000, 35000, 100000, 350000],
      names:['10 улучшений','30 улучшений','100 улучшений','250 улучшений','600 улучшений','Архитектор силы 🔧'] },
    { id:'helperCommander',   em:'🤖', ic:'fas fa-robot',          desc:'Активировано помощников',
      targets:[5, 25, 100, 500],
      rewards:[1500, 7000, 30000, 150000],
      names:['5 помощников','25 помощников','100 помощников','Командир эскадры 🤖'] },
    { id:'boosterUser',       em:'⚗️', ic:'fas fa-flask',          desc:'Использовано бустов',
      targets:[1, 5, 15, 30, 60, 120],
      rewards:[500, 1500, 5000, 12000, 35000, 90000],
      names:['Первый буст','5 бустов','15 бустов','30 бустов','60 бустов','100 бустов'] },
    { id:'timeInvestor',      em:'⏱️', ic:'fas fa-clock',          desc:'Время в игре (сек)',
      targets:[3600, 18000, 36000, 90000, 180000],
      rewards:[1500, 7000, 20000, 75000, 250000],
      names:['1 час','5 часов','10 часов','25 часов','Преданный игрок ⏰'] },
    { id:'rareHunter',        em:'⭐', ic:'fas fa-star',           desc:'Редких блоков',
      targets:[10, 50, 200, 1000, 5000],
      rewards:[2000, 8000, 30000, 150000, 600000],
      names:['10 редких','50 редких','200 редких','1000 редких','Легенда удачи ⭐'] },
    { id:'clickMaster',       em:'👆', ic:'fas fa-hand-pointer',   desc:'Совершено кликов',
      targets:[1000, 10000, 100000, 1000000, 10000000],
      rewards:[500, 3000, 15000, 75000, 250000],
      names:['1K кликов','10K кликов','100K кликов','1M кликов','Легенда кликов 👆'] }
];

var globalAchievements = {};
GLOBAL_DEFS.forEach(function(def) {
    var levels = def.targets.map(function(t, i) {
        return {
            id: def.id + '_l' + i,
            target: Math.max(1, Math.round(t * jit(def.id + ':g' + i, 0.05))),
            reward: Math.round((def.rewards[i] || Math.round(t * 0.04)) * jit(def.id + ':r' + i, 0.05)),
            name: def.names[i] || (def.desc + ' ' + t)
        };
    });
    globalAchievements[def.id] = {
        icon: def.ic,
        emoji: def.em,
        description: def.desc,
        levels: levels
    };
});

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

// ЧТО: Тело функции заменено на ранний выход — стили перенесены в styles.css
// КУДА: achievements.js → injectStyles()
// ЗАЧЕМ: Сохраняем вызов функции (init() её вызывает), но она больше не инжектирует
//        стили. Все классы (.ach-tab, .ach-icon-card, .stage-gold, etc.) теперь в styles.css.
function injectStyles() {
    // Стили перенесены в styles.css — секция "ACHIEVEMENTS EXTENDED"
    // Функция сохранена для совместимости с init()
    return;
}

function init() {
    injectStyles();
    calculateTotalAchievements();
    createAchievementsPanel();
    setupEventHandlers();
    checkSavedAchievements();
    updateAchievementsDisplay();
    console.log('🏆 Achievements v2.0 initialized. Total:', totalAchievements);
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

        // ✅ ИСПРАВЛЕНО: stopPropagation для защиты от закрытия панели
        (function(id) {
            card.addEventListener('click', function(e) {
                e.stopPropagation();
                showCategoryDetail(id);
            });
            card.addEventListener('touchstart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showCategoryDetail(id);
            }, { passive: false });
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

    // ✅ ИСПРАВЛЕНО: stopPropagation на кнопке назад
    function backSafe() {
        currentView = 'grid';
        renderGridView();
    }
    document.getElementById('achBackBtn').addEventListener('click', function(e) {
        e.stopPropagation();
        backSafe();
    });
    document.getElementById('achBackBtn').addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        backSafe();
    }, { passive: false });
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

    // ✅ ИСПРАВЛЕНО: composedPath для надёжности
    document.addEventListener('click', function(e) {
        if (!achievementsPanelVisible) return;
        var path = (e.composedPath && e.composedPath()) || [e.target];
        var inside = false;
        for (var i = 0; i < path.length; i++) {
            if (path[i] === panel || path[i] === btn) { inside = true; break; }
        }
        if (!inside) hideAchievementsPanel();
    });
}

function toggleAchievementsPanel() {
    if (achievementsPanelVisible) hideAchievementsPanel();
    else showAchievementsPanel();
}

function showAchievementsPanel() {
    // ✅ Обновляем время в игре при открытии панели
    updateTimePlayed();
    
    var panel = document.getElementById('achievementsPanel');
    if (!panel) return;
    panel.style.display = 'flex';
    achievementsPanelVisible = true;
    renderGridView();
    updateAchievementsDisplay();
    if (window.shopSystem && window.shopSystem.closeShop) window.shopSystem.closeShop();

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

    var shopPanel = document.getElementById('shopPanel');
    var isShopOpen = shopPanel && shopPanel.style.display === 'flex';
    if (!isShopOpen && window.GAME_CORE && window.GAME_CORE.resumeGame) {
        window.GAME_CORE.resumeGame();
    }
}

/**
 * Обновляет прогресс категории достижений
 * @param {string} categoryId - ID категории ('mercury', 'combatMastery', ...)
 * @param {number} value - Текущее значение метрики
 * @param {string} [metric] - Тип метрики ('blocks', 'crits', 'combo', 'rare')
 */
function updateProgress(categoryId, value, metric) {
    var gs = window.gameState;
    if (!gs || !gs.achievements) return;
    var catData = achievements[categoryId];
    if (!catData) return;
    
    if (!gs.achievements[categoryId]) {
        gs.achievements[categoryId] = { progress: 0, levels: {} };
    }
    var catState = gs.achievements[categoryId];
    catState.progress = value;
    if (metric) {
        catState['progress_' + metric] = value;
    }
    
    for (var i = 0; i < catData.levels.length; i++) {
        var level = catData.levels[i];
        var state = catState.levels[level.id];
        if (!state || state.unlocked) continue;
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

    // ✅ Гарантируем planetStats
    if (!gm.planetStats) gm.planetStats = {};

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
    syncGlobal('explorer', (gm.visitedPlanets && gm.visitedPlanets.length) || 0);
    syncGlobal('comboLegend', gm.maxCombo);
    syncGlobal('critMaster', gm.totalCrits);
    syncGlobal('upgradeEnthusiast', gm.upgradesBought);
    syncGlobal('helperCommander', gm.helpersBought);
    syncGlobal('boosterUser', gm.boostersUsed);
   // Считаем общее время: сохранённое + текущая сессия
const sessionTime = Math.floor((Date.now() - (gm.startTime || Date.now())) / 1000);
const totalTime = (gm.totalTimePlayed || 0) + sessionTime;
syncGlobal('timeInvestor', totalTime);
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
    updateTimePlayed: updateTimePlayed,  // ← ДОБАВИТЬ
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
        if (!gm || !gm.planetStats) return;
        if (!gm.planetStats[planet]) gm.planetStats[planet] = { blocks: 0, crits: 0, combo: 0, rare: 0 };
        gm.planetStats[planet].crits = (gm.planetStats[planet].crits || 0) + c;
        updateProgress(planet, gm.planetStats[planet].crits, 'crits');
    },
    updatePlanetCombo: function(planet, combo) {
        var gm = window.gameMetrics;
        if (!gm || !gm.planetStats) return;
        if (!gm.planetStats[planet]) gm.planetStats[planet] = { blocks: 0, crits: 0, combo: 0, rare: 0 };
        if (combo > (gm.planetStats[planet].combo || 0)) {
            gm.planetStats[planet].combo = combo;
            updateProgress(planet, combo, 'combo');
        }
    },
    incrementPlanetRareBlocks: function(planet, c) {
        if (!c) c = 1;
        var gm = window.gameMetrics;
        if (!gm || !gm.planetStats) return;
        if (!gm.planetStats[planet]) gm.planetStats[planet] = { blocks: 0, crits: 0, combo: 0, rare: 0 };
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
    updatePlanetProgress: function(planet) {
        var gm = window.gameMetrics;
        if (!gm) gm = window.gameMetrics = {};
        if (!gm.visitedPlanets) gm.visitedPlanets = [];

        if (gm.visitedPlanets.indexOf(planet) === -1) {
            gm.visitedPlanets.push(planet);
            gm.planetsVisited = gm.visitedPlanets.length;
            updateProgress('explorer', gm.planetsVisited);
        }
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
/**
 * Обновляет время в игре (вызывается при сохранении и открытии панели)
 */
function updateTimePlayed() {
    if (!window.gameMetrics) return;
    const gm = window.gameMetrics;
    const sessionTime = Math.floor((Date.now() - (gm.startTime || Date.now())) / 1000);
    const totalTime = (gm.totalTimePlayed || 0) + sessionTime;
    
    // Обновляем достижение
    if (window.gameState?.achievements?.timeInvestor) {
        var catState = window.gameState.achievements.timeInvestor;
        catState.progress = totalTime;
        
        // Проверяем разблокировки
        var levels = achievements.timeInvestor.levels;
        for (var i = 0; i < levels.length; i++) {
            var st = catState.levels[levels[i].id];
            if (st && !st.unlocked && totalTime >= levels[i].target) {
                st.unlocked = true;
                st.progress = levels[i].target;
            }
        }
    }
}

// ЧТО: Замена хаотичного setTimeout на гарантированную синхронизацию через EventBus
// КУДА: achievements.js → safeInit()
// ЗАЧЕМ: Вместо многократных проверок "а может уже появилось?" мы ждём два события:
//        1. save:ready — gameState инициализирован
//        2. core:ready — game-core готов к работе
//        Это гарантирует, что achievements.js запустится в правильный момент.
function safeInit() {
    // Проверяем наличие DOM-элемента кнопки
    if (!document.getElementById('achievementsBtn')) {
        document.addEventListener('DOMContentLoaded', () => setTimeout(safeInit, 100));
        return;
    }
    
    // Если gameState и GAME_CORE уже есть — запускаем сразу
    if (window.gameState && Object.keys(window.gameState).length > 0 && window.GAME_CORE) {
        console.log('✅ [ACHIEVEMENTS] Все зависимости готовы, инициализируем');
        init();
        return;
    }
    
    // Иначе ждём события save:ready и core:ready
    if (window.EventBus) {
        console.log('⏳ [ACHIEVEMENTS] Ждём save:ready и core:ready...');
        
        let saveReady = false;
        let coreReady = false;
        
        const tryInit = () => {
            if (saveReady && coreReady) {
                console.log('✅ [ACHIEVEMENTS] Оба события получены, инициализируем');
                init();
            }
        };
        
        window.EventBus.once('save:ready', () => {
            console.log('📡 [ACHIEVEMENTS] save:ready получен');
            saveReady = true;
            tryInit();
        });
        
        window.EventBus.once('core:ready', () => {
            console.log('📡 [ACHIEVEMENTS] core:ready получен');
            coreReady = true;
            tryInit();
        });
    } else {
        // Fallback: если EventBus недоступен
        console.warn('⚠️ [ACHIEVEMENTS] EventBus недоступен, fallback на setTimeout');
        setTimeout(safeInit, 200);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(safeInit, 100));
} else {
    setTimeout(safeInit, 100);
}
})();