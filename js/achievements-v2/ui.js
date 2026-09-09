// js/achievements-v2/ui.js (v2.1 — с защитой от отсутствия переводов и форматированием)
(function() {
'use strict';

console.log('🎨 [ACH-V2] UI module loading...');

let currentView = 'grid';
let currentMetric = null;
let paginationOffset = 0;
let panelVisible = false;
let viewPlanetId = null; // ← какая планета открыта в панели (null = текущая)
const PLANET_ORDER = () => (window.GAME_CONFIG?.planetOrder ||
    ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune','pluto','heliopause']);
function getViewPlanetId() {
    if (viewPlanetId && PLANET_ORDER().indexOf(viewPlanetId) !== -1) return viewPlanetId;
    return window.gameState?.currentLocation || 'mercury';
}
function shiftViewPlanet(dir) {
    const order = PLANET_ORDER();
    const idx = order.indexOf(getViewPlanetId());
    viewPlanetId = order[Math.max(0, Math.min(order.length - 1, idx + dir))];
    currentView = 'grid'; currentMetric = null; paginationOffset = 0;
    renderGridView();
}

// ═══════════════════════════════════════════════
// 🔢 ФОРМАТИРОВАНИЕ ЧИСЕЛ
// ═══════════════════════════════════════════════
const AU_TO_DAMAGE = window.GAME_CONFIG?.AU_TO_DAMAGE || 149597870.691;

function formatNumber(num, useAU = false) {
    if (num === undefined || num === null) return '0';
    
    // Если включен режим а.е. или число больше 1 а.е.
    if (useAU || num >= AU_TO_DAMAGE) {
        const au = num / AU_TO_DAMAGE;
        if (au >= 1000000000) return (au / 1000000000).toFixed(2) + 'B а.е.';
        if (au >= 1000000) return (au / 1000000).toFixed(2) + 'M а.е.';
        if (au >= 1000) return (au / 1000).toFixed(2) + 'K а.е.';
        return au.toFixed(4) + ' а.е.';
    }
    
    // Обычное форматирование
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return Math.floor(num).toLocaleString();
}

// ═══════════════════════════════════════════════
// 📊 ПОДСЧЁТ ДОСТИЖЕНИЙ (для кнопки 🏆)
// ═══════════════════════════════════════════════
function updateAchievementsButton() {
    const btn = document.getElementById('achievementsCount');
    if (!btn) return;
    
    const gs = window.gameState;
    if (!gs || !gs.achievementsV2) {
        btn.textContent = '';
        return;
    }

    // ✅ Компактный формат: 201 | 1.5K (тиры достижений бездонные — дробь X/Y бессмысленна)
    const fmtCompact = n => n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : String(n);

    const currentLocation = gs.currentLocation || 'mercury';
    let currentUnlocked = 0;
    let totalUnlocked = 0;

    // Один проход по всем планетам (порядок из конфига, не хардкод)
    PLANET_ORDER().forEach(planet => {
        const pa = gs.achievementsV2[planet];
        if (!pa) return;
        const n = Object.values(pa.metrics || {}).reduce((s, m) => s + (m.level || 0), 0)
            + (pa.masterUnlocked ? 1 : 0);
        totalUnlocked += n;
        if (planet === currentLocation) currentUnlocked = n;
    });

    btn.textContent = fmtCompact(currentUnlocked);
    btn.title = `🏆 На ${currentLocation}: ${currentUnlocked} | Всего по всем планетам: ${totalUnlocked}`;
}

// ═══════════════════════════════════════════════
// 🛡️ БЕЗОПАСНЫЙ ПЕРЕВОД (без спама в консоль)
// ═══════════════════════════════════════════════
const t = (key, fallback) => {
    if (typeof window.getTranslation === 'function') {
        try {
            const translated = window.getTranslation(key);
            if (translated && translated !== key) {
                return translated;
            }
        } catch (e) {
            // Игнорируем ошибки
        }
    }
    return fallback || key;
};

// ═══════════════════════════════════════════════
// 🎨 СТИЛИ
// ═══════════════════════════════════════════════
function injectStyles() {
    if (document.getElementById('ach-v2-styles')) return;
    const style = document.createElement('style');
    style.id = 'ach-v2-styles';
    style.textContent = `
        #achievementsPanel { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 92vw; max-width: 500px; max-height: 85vh; background: rgba(10, 8, 20, 0.96); border-radius: 16px; padding: 16px; border: 2px solid rgba(255,215,0,0.2); box-shadow: 0 10px 60px rgba(0,0,0,0.7); display: none; flex-direction: column; gap: 10px; backdrop-filter: blur(10px); z-index: 2000; overflow-y: auto; font-family: system-ui, sans-serif; }
        .ach-v2-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .ach-v2-title { margin: 0; color: #FFD700; font-family: 'Orbitron', sans-serif; font-size: 1.1em; }
        .ach-v2-rank-badge { padding: 4px 8px; background: rgba(255,215,0,0.15); border: 1px solid rgba(255,215,0,0.3); border-radius: 6px; font-size: 0.75em; color: #FFD700; font-family: 'Orbitron', sans-serif; }
        .ach-v2-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); gap: 8px; padding: 5px 0; }
        .ach-v2-card { aspect-ratio: 1; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s; position: relative; overflow: hidden; padding: 5px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); }
        .ach-v2-card:hover { transform: scale(1.05); border-color: #FFD700; }
        .ach-v2-card-emoji { font-size: 1.8em; margin-bottom: 3px; }
        .ach-v2-card-name { font-size: 0.6em; color: #fff; text-align: center; line-height: 1.1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
        .ach-v2-card-level { font-size: 0.55em; margin-top: 2px; padding: 1px 5px; border-radius: 4px; background: rgba(0,0,0,0.5); color: #4FC3F7; font-family: monospace; }
        .ach-v2-card-progress { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: rgba(0,0,0,0.4); }
        .ach-v2-card-progress-fill { height: 100%; background: linear-gradient(90deg,#4CAF50,#8BC34A); transition: width 0.3s; }
        .ach-v2-back-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8em; margin-bottom: 8px; }
        .ach-v2-notification { position: fixed; top: 20%; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #FFD700, #FF8C00); color: #000; padding: 15px 20px; border-radius: 12px; z-index: 10001; text-align: center; font-weight: bold; box-shadow: 0 5px 20px rgba(0,0,0,0.5); animation: slideDown 0.4s ease-out; }
        @keyframes slideDown { from { top: -50px; opacity: 0; } to { top: 20%; opacity: 1; } }
        .ach-v2-detail-header { display:flex; align-items:center; gap:12px; padding:12px; background:rgba(255,255,255,0.05); border-radius:10px; margin-bottom:12px; }
        .ach-v2-detail-icon { font-size:2.5em; width:60px; height:60px; display:flex; align-items:center; justify-content:center; border-radius:10px; background:rgba(255,215,0,0.1); }
        .ach-v2-detail-info { flex:1; }
        .ach-v2-detail-title { font-size:1.1em; color:#fff; font-weight:bold; margin-bottom:4px; }
        .ach-v2-detail-stats { font-size:0.8em; color:#4FC3F7; font-family:'Orbitron',monospace; }
        .ach-v2-levels-list { display:flex; flex-direction:column; gap:6px; max-height:400px; overflow-y:auto; padding:10px 0; }
        .ach-v2-levels-list::-webkit-scrollbar { width: 6px; }
        .ach-v2-levels-list::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .ach-v2-levels-list::-webkit-scrollbar-thumb { background: #4FC3F7; border-radius: 3px; }
        .ach-v2-level-node { display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:8px; transition: all 0.2s; }
        .ach-v2-level-node.unlocked { background: linear-gradient(135deg,rgba(76,175,80,0.15),rgba(139,195,74,0.1)); border:1px solid #4CAF50; }
        .ach-v2-level-node.current { background: linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,140,0,0.1)); border:1px solid #FFD700; box-shadow: 0 0 10px rgba(255,215,0,0.3); }
        .ach-v2-level-node.locked { background: rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); opacity: 0.6; }
        .ach-v2-level-status { font-size:1.2em; width:30px; text-align:center; }
        .ach-v2-level-info { flex:1; }
        .ach-v2-level-name { font-size:0.85em; color:#fff; font-weight:bold; margin-bottom:2px; }
        .ach-v2-level-target { font-size:0.7em; color:#aaa; font-family:'Orbitron',monospace; }
        .ach-v2-level-reward { font-size:0.75em; color:#FFD700; font-weight:bold; padding:2px 8px; background:rgba(255,215,0,0.15); border-radius:6px; }
        .ach-v2-pagination { display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.1); }
        .ach-v2-back-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8em; margin-bottom: 8px; } .ach-v2-nav-btn { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,215,0,0.35); color: #FFD700; border-radius: 8px; padding: 6px 11px; cursor: pointer; font-size: 1em; font-weight: bold; } .ach-v2-nav-btn:disabled { opacity: 0.25; cursor: not-allowed; }
        .ach-v2-pagination-btn:hover { background:rgba(255,255,255,0.2); }
        .ach-v2-pagination-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .ach-v2-pagination-info { font-size:0.75em; color:#aaa; font-family:'Orbitron',monospace; }
    `;
    document.head.appendChild(style);
}

// ═══════════════════════════════════════════════
// 🔌 ПРИВЯЗКА К КНОПКЕ
// ═══════════════════════════════════════════════
function attachButtonListener() {
    const btn = document.getElementById('achievementsBtn');
    if (!btn) {
        setTimeout(attachButtonListener, 500);
        return;
    }
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        togglePanel();
    });
    btn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        togglePanel();
    }, { passive: false });
}

// ═══════════════════════════════════════════════
// 📦 ЛОГИКА ПАНЕЛИ
// ═══════════════════════════════════════════════
function getCurrentPlanetModule() {
const planet = getViewPlanetId(); // ← просматриваемая планета, а не только текущая
    // ✅ Используем фабрику вместо жёсткого маппинга
    if (window.AchievementsV2?.PlanetFactory) {
        return window.AchievementsV2.PlanetFactory.get(planet);
    }
    // Fallback
    return window.AchievementsV2?.Mercury;
}

function renderGridView() {
    currentView = 'grid';
    const panel = document.getElementById('achievementsPanel');
    if (!panel) return;
    
    const module = getCurrentPlanetModule();
    if (!module) {
        panel.innerHTML = '<div style="color:#f44336;text-align:center;padding:20px;">⚠️ Модуль Mercury не загружен</div>';
        return;
    }
    
    const info = module.getPlanetInfo();
    const metrics = module.getMetricDefinitions();
    const achState = window.gameState?.achievementsV2?.[info.id] || { rank: 0, totalUnlocked: 0, metrics: {}, masterUnlocked: false };
 const rankInfo = module.calculateRank(achState.totalUnlocked);
 const viewedId = getViewPlanetId();
 const currentId = window.gameState?.currentLocation || 'mercury';
 const isFrozen = viewedId !== currentId || !!achState.frozen;
 const order = PLANET_ORDER();
 const idx = order.indexOf(viewedId);
 let html = `
     <div class="ach-v2-header">
         <button class="ach-v2-nav-btn" id="achV2PrevPlanet" ${idx > 0 ? '' : 'disabled'}>←</button>
         <div style="flex:1;text-align:center;">
             <h3 class="ach-v2-title">${info.emoji} ${t(info.nameKey, info.id.toUpperCase())}</h3>
             <div style="font-size:0.7em;color:${isFrozen ? '#4FC3F7' : '#9ef01a'};">${isFrozen ? '❄️ замороженный прогресс' : '▶️ текущая планета'}</div>
         </div>
         <button class="ach-v2-nav-btn" id="achV2NextPlanet" ${idx < order.length - 1 ? '' : 'disabled'}>→</button>
         <div class="ach-v2-rank-badge">${rankInfo.title.ru || rankInfo.title.en}</div>
     </div>
     <div class="ach-v2-grid">
 `;
    
    metrics.forEach(metric => {
        const metricState = achState.metrics[metric.id] || { level: 0, progress: 0 };
        const progress = module.getCardProgress(metric.id, metricState.progress);
        html += `
            <div class="ach-v2-card" data-metric="${metric.id}">
                <div class="ach-v2-card-emoji">${metric.emoji}</div>
                <div class="ach-v2-card-name">${t(metric.nameKey, metric.fallback)}</div>
                <div class="ach-v2-card-level">Ур.${metricState.level}</div>
                <div class="ach-v2-card-progress">
                    <div class="ach-v2-card-progress-fill" style="width: ${progress.percent}%"></div>
                </div>
            </div>
        `;
    });
    
 const masterState = achState.masterUnlocked;
const masterName = t(`achievements.${info.id}.master`, `${info.emoji} ${info.id.toUpperCase()} покорён!`);
 html += `
     <div class="ach-v2-card master" data-metric="master" style="border-color: #FFD700; background: linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,140,0,0.1));">
         <div class="ach-v2-card-emoji">👑</div>
         <div class="ach-v2-card-name">${masterName}</div>
            <div class="ach-v2-card-level">${masterState ? '✅' : '🔒'}</div>
            <div class="ach-v2-card-progress">
                <div class="ach-v2-card-progress-fill" style="width: ${masterState ? 100 : 0}%"></div>
            </div>
        </div>
    `;
    
    html += '</div>';
panel.innerHTML = html;
// Обновляем кнопку достижений после рендера
updateAchievementsButton();
// ←/→ листают локации
panel.querySelector('#achV2PrevPlanet')?.addEventListener('click', e => { e.stopPropagation(); shiftViewPlanet(-1); });
panel.querySelector('#achV2NextPlanet')?.addEventListener('click', e => { e.stopPropagation(); shiftViewPlanet(1); });
panel.querySelectorAll('.ach-v2-card').forEach(card => {
        card.addEventListener('click', function(e) {
            e.stopPropagation();
            showDetailView(this.dataset.metric);
        });
    });
}

function showDetailView(metric) {
    if (metric === 'master') {
        showMasterDetail();
        return;
    }
    currentView = 'detail';
    currentMetric = metric;
    paginationOffset = 0;
    renderDetailView();
}

function renderDetailView() {
    const panel = document.getElementById('achievementsPanel');
    if (!panel || !currentMetric) return;
    
    const module = getCurrentPlanetModule();
    if (!module) return;
    
    const planetInfo = module.getPlanetInfo();
    const metricDef = module.getMetricDefinitions().find(m => m.id === currentMetric);
    const metricState = window.gameState?.achievementsV2?.[planetInfo.id]?.metrics?.[currentMetric] || { level: 0, progress: 0 };
    
    const startTier = Math.max(0, metricState.level - 10 + paginationOffset);
    const levels = module.generateLevels(currentMetric, startTier, 20);
    
    let html = `
        <button class="ach-v2-back-btn" id="achV2BackBtn">← Назад</button>
        <div class="ach-v2-detail-header">
            <div class="ach-v2-detail-icon">${metricDef.emoji}</div>
            <div class="ach-v2-detail-info">
                <div class="ach-v2-detail-title">${t(metricDef.nameKey, metricDef.fallback)}</div>
                <div class="ach-v2-detail-stats">
                    Уровень: ${metricState.level} | Прогресс: ${formatNumber(metricState.progress, metricState.progress >= AU_TO_DAMAGE)}
                </div>
            </div>
        </div>
        <div class="ach-v2-levels-list">
    `;
    
    levels.forEach(level => {
        const isUnlocked = level.tier < metricState.level;
        const isCurrent = level.tier === metricState.level;
        const statusClass = isUnlocked ? 'unlocked' : (isCurrent ? 'current' : 'locked');
        const statusIcon = isUnlocked ? '✅' : (isCurrent ? '🔄' : '🔒');
        
        html += `
            <div class="ach-v2-level-node ${statusClass}">
                <div class="ach-v2-level-status">${statusIcon}</div>
                <div class="ach-v2-level-info">
                    <div class="ach-v2-level-name">${t(level.nameKey, level.nameFallback)}</div>
                    <div class="ach-v2-level-target">Цель: ${formatNumber(level.target, level.target >= AU_TO_DAMAGE)}</div>
                </div>
                <div class="ach-v2-level-reward">+${level.reward} 💎</div>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="ach-v2-pagination">
            <button class="ach-v2-pagination-btn" id="achV2PrevBtn" ${startTier === 0 ? 'disabled' : ''}>← Назад</button>
            <div class="ach-v2-pagination-info">Уровни ${startTier + 1}–${startTier + 20}</div>
            <button class="ach-v2-pagination-btn" id="achV2NextBtn">Вперёд →</button>
        </div>
    `;
    
    panel.innerHTML = html;
    
    document.getElementById('achV2BackBtn').addEventListener('click', function(e) {
        e.stopPropagation();
        currentView = 'grid';
        renderGridView();
    });
    document.getElementById('achV2PrevBtn').addEventListener('click', function(e) {
        e.stopPropagation();
        if (paginationOffset > -10) { paginationOffset -= 10; renderDetailView(); }
    });
    document.getElementById('achV2NextBtn').addEventListener('click', function(e) {
        e.stopPropagation();
        paginationOffset += 10;
        renderDetailView();
    });
}

function showMasterDetail() {
const panel = document.getElementById('achievementsPanel');
if (!panel) return;
const module = getCurrentPlanetModule();
if (!module) return;
const master = module.getMasterAchievement();
const planetInfo = module.getPlanetInfo();
const masterState = window.gameState?.achievementsV2?.[planetInfo.id]?.masterUnlocked || false;  // ✅ ДИНАМИЧЕСКИ
    
    let html = `
        <button class="ach-v2-back-btn" id="achV2BackBtn">← Назад</button>
        <div class="ach-v2-detail-header" style="border: 2px solid #FFD700; background: rgba(255,215,0,0.1);">
            <div class="ach-v2-detail-icon">👑</div>
            <div class="ach-v2-detail-info">
                <div class="ach-v2-detail-title" style="color: #FFD700;">${t(master.nameKey, master.nameFallback)}</div>
                <div class="ach-v2-detail-stats" style="color: #fff;">${masterState ? '✅ Выполнено!' : `Цель: ${formatNumber(master.target, true)} урона`}</div>
            </div>
        </div>
        <div style="padding:20px;text-align:center;color:#aaa;">
            <p>Финальное достижение планеты.</p>
            <p>Разблокируется при достижении <strong>99.99%</strong> прогресса AU.</p>
            <p style="color:#FFD700;font-size:1.2em;margin-top:20px;">Награда: +${formatNumber(master.reward)} 💎</p>
        </div>
    `;
    panel.innerHTML = html;
    
    document.getElementById('achV2BackBtn').addEventListener('click', function(e) {
        e.stopPropagation();
        currentView = 'grid';
        renderGridView();
    });
}

// ═══════════════════════════════════════════════
// 🔄 УПРАВЛЕНИЕ ПАНЕЛЬЮ
// ═══════════════════════════════════════════════
function togglePanel() {
    if (panelVisible) hidePanel();
    else showPanel();
}

function showPanel() {
const panel = document.getElementById('achievementsPanel');
if (!panel) return;
viewPlanetId = null; // открываемся на текущей планете
panel.style.display = 'flex';
    panelVisible = true;
    renderGridView();
    
    // ✅ Закрываем магазин если открыт
    if (window.shopSystem && window.shopSystem.closeShop) {
        window.shopSystem.closeShop();
    }
    
    // ✅ Вызываем паузу (как в старом achievements.js)
    if (window.GAME_CORE && window.GAME_CORE.pauseGame) {
        window.GAME_CORE.pauseGame();
    }
    
    // ✅ Обновляем кнопку достижений
    updateAchievementsButton();
}

function hidePanel() {
    const panel = document.getElementById('achievementsPanel');
    if (!panel) return;
    
    panel.style.display = 'none';
    panelVisible = false;
    currentView = 'grid';
    
    // ✅ Проверяем, не открыт ли магазин
    var shopPanel = document.getElementById('shopPanel');
    var isShopOpen = shopPanel && shopPanel.style.display === 'flex';
    
    // ✅ Возобновляем игру (как в старом achievements.js)
    if (!isShopOpen && window.GAME_CORE && window.GAME_CORE.resumeGame) {
        window.GAME_CORE.resumeGame();
    }
    
    // ✅ Обновляем кнопку достижений при закрытии
    updateAchievementsButton();
}

// ═══════════════════════════════════════════════
// 🎧 ГЛОБАЛЬНЫЕ СОБЫТИЯ (только клик вне панели и Escape)
// ═══════════════════════════════════════════════
function setupEventListeners() {
    const panel = document.getElementById('achievementsPanel');
    const btn = document.getElementById('achievementsBtn');
    
    if (!panel || !btn) {
        console.warn('⚠️ [ACH-V2] Panel or button not found for global listeners!');
        return;
    }

    // ✅ Закрытие по клику вне панели
    document.addEventListener('click', function(e) {
        if (!panelVisible) return;
        const clickedOnPanel = panel.contains(e.target);
        const clickedOnBtn = btn.contains(e.target);
        if (!clickedOnPanel && !clickedOnBtn) {
            hidePanel();
        }
    });
    
    // ✅ Закрытие по клавише Escape
 document.addEventListener('keydown', function(e) {
     if (!panelVisible) return;
     if (e.key === 'Escape') { hidePanel(); return; }
     if (e.key === 'ArrowLeft')  { shiftViewPlanet(-1); }
     if (e.key === 'ArrowRight') { shiftViewPlanet(1); }
 });
    
    console.log('✅ [ACH-V2] Global event listeners setup complete');
}

// ═══════════════════════════════════════════════
// 🎨 ВИЗУАЛИЗАЦИЯ ПОЛУЧЕНИЯ ДОСТИЖЕНИЙ
// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// 🎨 КОМПАКТНЫЕ ТОСТЫ ДОСТИЖЕНИЙ (v2.2)
// ЧТО: стек справа сверху, ≤3 штук, 2.5с, не перекрывает центр поля
// ═══════════════════════════════════════════════
function getToastStack() {
    let stack = document.getElementById('achToastStack');
    if (!stack) {
        stack = document.createElement('div');
        stack.id = 'achToastStack';
               // ✅ v2.3: по центру сверху — появление заметно, центр поля не перекрыт
        stack.style.cssText = 'position:fixed;top:88px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;gap:6px;align-items:center;z-index:10001;pointer-events:none;max-width:92vw;';
        document.body.appendChild(stack);
    }
    return stack;
}

function makeToast(html, accent) {
    const stack = getToastStack();
    const card = document.createElement('div');
    card.style.cssText = `background:linear-gradient(135deg, rgba(255,215,0,0.92), rgba(255,140,0,0.92));color:#000;padding:6px 10px;border-radius:10px;border:2px solid ${accent || '#fff'};font-family:'Orbitron',sans-serif;font-weight:bold;text-align:left;max-width:230px;box-shadow:0 4px 14px rgba(255,215,0,0.45);animation:achCardSlide 0.4s ease-out;pointer-events:none;`;
    card.innerHTML = html;
    stack.appendChild(card);
    while (stack.children.length > 3) stack.removeChild(stack.firstChild); // ≤3 одновременно
    setTimeout(() => {
        card.style.transition = 'all 0.4s ease-in';
        card.style.opacity = '0';
        card.style.transform = 'translateX(40px)';
        setTimeout(() => { if (card.parentNode) card.parentNode.removeChild(card); }, 400);
    }, 2500);
}

// ✅ v2.3: имя из переводов по nameKey (payload может быть плоским)
function trName(key, fallback) {
    const t = window.translations?.[window.currentLanguage || 'ru'];
    if (!t || !key) return fallback;
    if (t[key]) return t[key];                       // плоский ключ
    let node = t;                                    // вложенный ach.planet.metric
    for (const p of String(key).split('.')) { node = node?.[p]; if (!node) break; }
    return node || fallback;
}

// ✅ v2.2: ищем определение метрики так же, как это делает сетка карточек
function lookupMetricDef(data) {
    const d = data || {};
    const a = d.achievement || d;
    const planetId = d.planetId || d.planet || a.planetId || a.planet || window.gameState?.currentLocation;
    const metricId = d.metricId || d.metric || a.metricId || a.metric || a.id;
    const nameKey = a.nameKey || d.nameKey;
    try {
        const order = window.GAME_CONFIG?.planetOrder || [];
        const planets = [planetId].concat(order.filter(p => p !== planetId));
        for (const pid of planets) {
            const module = window.AchievementsV2?.PlanetFactory?.get?.(pid);
            if (!module || typeof module.getMetricDefinitions !== 'function') continue;
            const defs = module.getMetricDefinitions() || [];
            let hit = null;
            if (metricId) hit = defs.find(m => m && m.id === metricId);
            if (!hit && nameKey) hit = defs.find(m => m && m.nameKey === nameKey);
            if (hit) return hit;
        }
    } catch (e) {}
    return null;
}

function showAchievementCard(data) {
    const d = data || {};
    const a = d.achievement || d; // ✅ платим и плоскому payload
    const def = lookupMetricDef(d);                       // ✅ иконка/имя из карточки
    const emoji = a.emoji || (def && def.emoji) || '🏆';
    const name = trName(a.nameKey || (def && def.nameKey), a.nameFallback || a.name || (def && def.fallback) || 'Достижение!');
    const reward = Number(a.reward ?? d.reward ?? 0);
    const tier = Number(a.tier ?? d.tier ?? 0);
    makeToast(
        `<div style="display:flex;align-items:center;gap:10px;text-align:left;">` +
        `<div style="font-size:2em;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));">${emoji}</div>` +
        `<div style="flex:1;min-width:0;">` +
        `<div style="font-size:1.02em;line-height:1.15;font-weight:bold;">${name}</div>` +
        `<div style="font-size:0.72em;opacity:0.85;">Уровень ${tier + 1}</div>` +
        `<div style="font-size:0.85em;color:#7a4a00;">💎 +${reward.toLocaleString()}</div>` +
        `</div></div>`
    );
}

function showMasterAchievementCard(data) {
    const d = data || {};
    const a = d.achievement || d;
    const planetId = d.planetId || d.planet || a.planetId || a.planet || window.gameState?.currentLocation;
    let planetEmoji = '👑';
    try {
        const info = window.AchievementsV2?.PlanetFactory?.get?.(planetId)?.getPlanetInfo?.();
        if (info && info.emoji) planetEmoji = info.emoji;   // ✅ иконка планеты как в карточке мастера
    } catch (e) {}
    const name = trName(a.nameKey, a.nameFallback || a.name || '');
    const reward = Number(a.reward ?? d.reward ?? 0);
    makeToast(
        `<div style="display:flex;align-items:center;gap:10px;text-align:left;">` +
        `<div style="font-size:2em;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));">${planetEmoji}</div>` +
        `<div style="flex:1;min-width:0;">` +
        `<div style="font-size:1.1em;line-height:1.15;font-weight:bold;">👑 ПЛАНЕТА ПОКОРЕНА!</div>` +
        `<div style="font-size:0.78em;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.4);">${name}</div>` +
        `<div style="font-size:0.9em;color:#7a4a00;">💎 +${reward.toLocaleString()}</div>` +
        `</div></div>`,
        '#FFD700'
    );
}

// ═══════════════════════════════════════════════
// 🎉 ПОДПИСКА НА СОБЫТИЯ ДОСТИЖЕНИЙ (для попапов и счетчика)
// ═══════════════════════════════════════════════
function setupAchievementEvents() {
    if (!window.EventBus) {
        console.warn('⚠️ [ACH-V2] EventBus not found, retrying in 500ms...');
        setTimeout(setupAchievementEvents, 500);
        return;
    }
    
    // При получении обычного достижения
    window.EventBus.on('achievement:v2:unlocked', function(data) {
        console.log('🎉 [ACH-V2] Achievement unlocked:', data);
        showAchievementCard(data);
        updateAchievementsButton(); // ✅ Обновляем счетчик мгновенно!
    });
    
    // При покорении планеты
    window.EventBus.on('achievement:v2:masterUnlocked', function(data) {
        console.log('👑 [ACH-V2] Master achievement:', data);
        showMasterAchievementCard(data);
        updateAchievementsButton();
    });
    
    // При смене ранга
    window.EventBus.on('achievement:v2:rankChanged', function(data) {
        console.log('⭐ [ACH-V2] Rank changed:', data);
        updateAchievementsButton();
    });
    
    // При смене планеты тоже обновляем счетчик
    window.EventBus.on('game:planetChanged', function() {
        updateAchievementsButton();
    });
    
    console.log('✅ [ACH-V2] Achievement events subscribed');
}

// ═══════════════════════════════════════════════
// 🚀 ИНИЦИАЛИЗАЦИЯ
// ═══════════════════════════════════════════════
function init() {
    console.log('🚀 [ACH-V2] UI init starting...');
    injectStyles();
    
    // 1. Вешаем клик ТОЛЬКО здесь (чтобы не было дубликатов)
    attachButtonListener(); 
    
    // 2. Глобальные слушатели (клик вне панели, Escape)
    setupEventListeners();      
    
    // 3. Подписка на EventBus для всплывающих карточек и живого счетчика
    setTimeout(setupAchievementEvents, 500); 
    
    // 4. Первичная отрисовка счетчика на кнопке
    setTimeout(updateAchievementsButton, 300); 
    
    console.log('✅ [ACH-V2] UI init complete');
}

// ───────────────────────────────────────────────
// 🌐 ПУБЛИЧНЫЙ API
// ───────────────────────────────────────────────
window.AchievementsV2 = window.AchievementsV2 || {};
window.AchievementsV2.UI = {
    init,
    showPanel,
    hidePanel,
    togglePanel,
    renderGridView,
    renderDetailView,
    updateAchievementsButton
};

// Автоинициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 200));
} else {
    setTimeout(init, 200);
}
})();