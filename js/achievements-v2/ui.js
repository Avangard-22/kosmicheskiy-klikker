 // js/achievements-v2/ui.js (v2.3 — с фиксами от Kimi)
(function() {
'use strict';

console.log('🎨 [ACH-V2] UI module loading...');

let currentView = 'grid';
let currentMetric = null;
let paginationOffset = 0;
let panelVisible = false;

// ═══════════════════════════════════════════════
// 🔢 ФОРМАТИРОВАНИЕ ЧИСЕЛ
// ═══════════════════════════════════════════════
const AU_TO_DAMAGE = window.GAME_CONFIG?.AU_TO_DAMAGE || 149597870.691;

function formatNumber(num, useAU = false) {
    if (num === undefined || num === null) return '0';
    if (useAU || num >= AU_TO_DAMAGE) {
        const au = num / AU_TO_DAMAGE;
        if (au >= 1000000000) return (au / 1000000000).toFixed(2) + 'B а.е.';
        if (au >= 1000000) return (au / 1000000).toFixed(2) + 'M а.е.';
        if (au >= 1000) return (au / 1000).toFixed(2) + 'K а.е.';
        return au.toFixed(4) + ' а.е.';
    }
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return Math.floor(num).toLocaleString();
}

// ✅ ФИКС 8: Динамический маппинг эмодзи планет
const PLANET_EMOJIS = {
    mercury: '☿', venus: '♀', earth: '🌍', mars: '♂',
    jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇'
};

// ═══════════════════════════════════════════════
// 📊 ПОДСЧЁТ ДОСТИЖЕНИЙ (для кнопки 🏆)
// ═══════════════════════════════════════════════
function updateAchievementsButton() {
    const btn = document.getElementById('achievementsCount');
    if (!btn) return;
    const gs = window.gameState;
    if (!gs || !gs.achievementsV2) {
        btn.textContent = '0/0';
        return;
    }
    const currentLocation = gs.currentLocation || 'mercury';
    const currentAch = gs.achievementsV2[currentLocation];
    const currentUnlocked = currentAch ? 
        Object.values(currentAch.metrics).reduce((sum, m) => sum + (m.level || 0), 0) + (currentAch.masterUnlocked ? 1 : 0) : 0;
    
    let totalUnlocked = 0;
    let totalPossible = 0;
    const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    
    // ✅ ФИКС 5: Динамический подсчёт вместо магической константы 110
    planets.forEach(planet => {
        const planetAch = gs.achievementsV2[planet];
        const module = window.AchievementsV2?.PlanetFactory?.get(planet);
        
        if (planetAch && module) {
            Object.values(planetAch.metrics).forEach(m => {
                totalUnlocked += (m.level || 0);
            });
            if (planetAch.masterUnlocked) totalUnlocked++;
            
            // Динамический подсчёт возможных достижений
            const metricCount = module.getMetricDefinitions().length;
            totalPossible += metricCount * 100 + 1; // ~100 уровней на метрику + мастер
        } else {
            // Fallback: 12 метрик × 100 + 1 мастер
            totalPossible += 1201;
        }
    });
    
    btn.textContent = `${currentUnlocked}/${totalPossible}`;
    btn.title = `На ${currentLocation}: ${currentUnlocked} | Всего разблокировано: ${totalUnlocked}`;
}

// ═══════════════════════════════════════════════
// 🛡️ БЕЗОПАСНЫЙ ПЕРЕВОД
// ═══════════════════════════════════════════════
const t = (key, fallback) => {
    if (typeof window.getTranslation === 'function') {
        try {
            const translated = window.getTranslation(key);
            if (translated && translated !== key) return translated;
        } catch (e) {}
    }
    return fallback || key;
};

// ✅ ФИКС 9: УДАЛЕНА функция injectStyles() — стили уже в styles.css

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
    const planet = window.gameState?.currentLocation || 'mercury';
    
    if (window.AchievementsV2?.PlanetFactory) {
        return window.AchievementsV2.PlanetFactory.get(planet);
    }
    
    const modules = { mercury: window.AchievementsV2?.Mercury };
    return modules[planet] || window.AchievementsV2?.Mercury;
}

function renderGridView() {
    currentView = 'grid';
    const panel = document.getElementById('achievementsPanel');
    if (!panel) return;
    const module = getCurrentPlanetModule();
    if (!module) {
        panel.innerHTML = '<div style="color:#f44336;text-align:center;padding:20px;">⚠️ Модуль планеты не загружен</div>';
        return;
    }
    const info = module.getPlanetInfo();
    const metrics = module.getMetricDefinitions();
    const achState = window.gameState?.achievementsV2?.[info.id] || { rank: 0, totalUnlocked: 0, metrics: {}, masterUnlocked: false };
    const rankInfo = module.calculateRank(achState.totalUnlocked);
    
    let html = `
        <div class="ach-v2-header">
            <h3 class="ach-v2-title">${info.emoji} ${t(info.nameKey, info.id.toUpperCase())}</h3>
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
    html += `
        <div class="ach-v2-card master" data-metric="master" style="border-color: #FFD700; background: linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,140,0,0.1));">
            <div class="ach-v2-card-emoji">👑</div>
            <div class="ach-v2-card-name">${t('achievements.mercury.levels.m_complete', 'Мастер-достижение')}</div>
            <div class="ach-v2-card-level">${masterState ? '✅' : '🔒'}</div>
            <div class="ach-v2-card-progress">
                <div class="ach-v2-card-progress-fill" style="width: ${masterState ? 100 : 0}%"></div>
            </div>
        </div>
    `;
    html += '</div>';
    panel.innerHTML = html;
    updateAchievementsButton();
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
    const masterState = window.gameState?.achievementsV2?.[planetInfo.id]?.masterUnlocked || false;
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
    panel.style.display = 'flex';
    panelVisible = true;
    renderGridView();
    if (window.shopSystem && window.shopSystem.closeShop) {
        window.shopSystem.closeShop();
    }
    if (window.GAME_CORE && window.GAME_CORE.pauseGame) {
        window.GAME_CORE.pauseGame();
    }
    updateAchievementsButton();
}

function hidePanel() {
    const panel = document.getElementById('achievementsPanel');
    if (!panel) return;
    panel.style.display = 'none';
    panelVisible = false;
    currentView = 'grid';
    var shopPanel = document.getElementById('shopPanel');
    var isShopOpen = shopPanel && shopPanel.style.display === 'flex';
    if (!isShopOpen && window.GAME_CORE && window.GAME_CORE.resumeGame) {
        window.GAME_CORE.resumeGame();
    }
    updateAchievementsButton();
}

// ═══════════════════════════════════════════════
// 🎧 ГЛОБАЛЬНЫЕ СОБЫТИЯ
// ═══════════════════════════════════════════════
function setupEventListeners() {
    const panel = document.getElementById('achievementsPanel');
    const btn = document.getElementById('achievementsBtn');
    
    if (!panel || !btn) {
        console.warn('⚠️ [ACH-V2] Panel or button not found for global listeners!');
        return;
    }

    document.addEventListener('click', function(e) {
        if (!panelVisible) return;
        const clickedOnPanel = panel.contains(e.target);
        const clickedOnBtn = btn.contains(e.target);
        if (!clickedOnPanel && !clickedOnBtn) {
            hidePanel();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && panelVisible) {
            hidePanel();
        }
    });
    
    console.log('✅ [ACH-V2] Global event listeners setup complete');
}

// ═══════════════════════════════════════════════
// 🎉 ПОДПИСКА НА СОБЫТИЯ ДОСТИЖЕНИЙ
// ═══════════════════════════════════════════════
function setupAchievementEvents() {
    if (!window.EventBus) {
        console.warn('⚠️ [ACH-V2] EventBus not found, retrying in 500ms...');
        setTimeout(setupAchievementEvents, 500);
        return;
    }
    
    window.EventBus.on('achievement:v2:unlocked', function(data) {
        console.log('🎉 [ACH-V2] Achievement unlocked:', data);
        showAchievementCard(data);
        updateAchievementsButton();
    });
    
    window.EventBus.on('achievement:v2:masterUnlocked', function(data) {
        console.log('👑 [ACH-V2] Master achievement:', data);
        showMasterAchievementCard(data);
        updateAchievementsButton();
    });
    
    window.EventBus.on('achievement:v2:rankChanged', function(data) {
        console.log('⭐ [ACH-V2] Rank changed:', data);
        updateAchievementsButton();
    });
    
    window.EventBus.on('game:planetChanged', function() {
        updateAchievementsButton();
    });
    
    console.log('✅ [ACH-V2] Achievement events subscribed');
}

// ═══════════════════════════════════════════════
// 🎨 ВИЗУАЛИЗАЦИЯ ПОЛУЧЕНИЯ ДОСТИЖЕНИЙ
// ═══════════════════════════════════════════════
function showAchievementCard(data) {
    const card = document.createElement('div');
    card.style.cssText = `
        position: fixed;
        top: 15%;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, rgba(255,215,0,0.95), rgba(255,140,0,0.95));
        color: #000;
        padding: 15px 25px;
        border-radius: 15px;
        z-index: 10001;
        text-align: center;
        font-family: 'Orbitron', sans-serif;
        font-weight: bold;
        box-shadow: 0 5px 25px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.4);
        animation: achCardSlide 0.5s ease-out;
        max-width: 350px;
        width: 90%;
        border: 3px solid #fff;
        pointer-events: none;
    `;

    // ✅ ФИКС 8: Динамический маппинг вместо хардкода
    const planetEmoji = PLANET_EMOJIS[data.planet] || '🪐';

    card.innerHTML = `
        <div style="font-size:2.5em;margin-bottom:5px">${planetEmoji}</div>
        <div style="font-size:1.4em;margin-bottom:5px">🏆 ДОСТИЖЕНИЕ!</div>
        <div style="font-size:1.1em;margin-bottom:8px;color:#fff">${data.level.nameFallback}</div>
        <div style="font-size:0.85em;margin-bottom:10px;color:#eee">Уровень ${data.tier + 1}</div>
        <div style="font-size:1.2em;color:#FFD700">💎 +${data.reward.toLocaleString()}</div>
    `;

    document.body.appendChild(card);

    setTimeout(() => {
        card.style.transition = 'all 0.5s ease-in';
        card.style.opacity = '0';
        card.style.transform = 'translateX(-50%) translateY(-50px)';
        setTimeout(() => {
            if (card.parentNode) card.parentNode.removeChild(card);
        }, 500);
    }, 3000);
}

function showMasterAchievementCard(data) {
    const card = document.createElement('div');
    card.style.cssText = `
        position: fixed;
        top: 10%;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, rgba(255,215,0,1), rgba(255,140,0,1));
        color: #000;
        padding: 20px 30px;
        border-radius: 20px;
        z-index: 10002;
        text-align: center;
        font-family: 'Orbitron', sans-serif;
        font-weight: bold;
        box-shadow: 0 10px 40px rgba(255,215,0,1), 0 0 60px rgba(255,215,0,0.6);
        animation: achCardSlide 0.5s ease-out;
        max-width: 400px;
        width: 90%;
        border: 4px solid #fff;
        pointer-events: none;
    `;

    card.innerHTML = `
        <div style="font-size:3em;margin-bottom:10px">👑</div>
        <div style="font-size:1.6em;margin-bottom:10px">ПЛАНЕТА ПОКОРЕНА!</div>
        <div style="font-size:1.2em;margin-bottom:15px;color:#fff">${data.achievement.nameFallback}</div>
        <div style="font-size:1.4em;color:#FFD700">💎 +${data.achievement.reward.toLocaleString()}</div>
    `;

    document.body.appendChild(card);

    setTimeout(() => {
        card.style.transition = 'all 0.5s ease-in';
        card.style.opacity = '0';
        card.style.transform = 'translateX(-50%) translateY(-50px)';
        setTimeout(() => {
            if (card.parentNode) card.parentNode.removeChild(card);
        }, 500);
    }, 4000);
}

// ═══════════════════════════════════════════════
// 🚀 ИНИЦИАЛИЗАЦИЯ
// ═══════════════════════════════════════════════
function init() {
    console.log('🚀 [ACH-V2] UI init starting...');
    
    // ✅ ФИКС 9: injectStyles() удалена — стили уже в styles.css
    
    attachButtonListener();
    setupEventListeners();
    setTimeout(setupAchievementEvents, 500);
    setTimeout(updateAchievementsButton, 300);
    console.log('✅ [ACH-V2] UI init complete');
}

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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 200));
} else {
    setTimeout(init, 200);
}
})();
