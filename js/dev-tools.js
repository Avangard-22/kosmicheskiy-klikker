// js/dev-tools.js (ТОЛЬКО ДЛЯ РАЗРАБОТКИ)
// ═══════════════════════════════════════════════════
// 🛠️ DEV TOOLS — Инструменты для быстрого тестирования
// ЧТО: Консольные команды + плавающая панель для разработчиков
// ЗАЧЕМ: Тестировать достижения, метрики, переходы без ручного прохождения
// ВНИМАНИЕ: Не подключать в production!
// ═══════════════════════════════════════════════════
(function() {
'use strict';

// ─── ЦВЕТОВАЯ СХЕМА ПАНЕЛИ ───
const PANEL_STYLE = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 300px;
    background: rgba(20, 10, 40, 0.95);
    border: 2px solid #FFD700;
    border-radius: 12px;
    padding: 15px;
    z-index: 99999;
    font-family: 'Orbitron', sans-serif;
    color: #fff;
    box-shadow: 0 10px 40px rgba(255, 215, 0, 0.3);
    backdrop-filter: blur(10px);
    max-height: 85vh;
    overflow-y: auto;
`;

const BTN_STYLE = `
    width: 100%;
    padding: 8px 12px;
    margin: 3px 0;
    background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,140,0,0.2));
    border: 1px solid rgba(255,215,0,0.5);
    border-radius: 6px;
    color: #FFD700;
    cursor: pointer;
    font-size: 0.75em;
    font-family: 'Orbitron', monospace;
    transition: all 0.2s;
    text-align: left;
`;

// ─── УТИЛИТЫ ───
function log(msg, color = '#4FC3F7') {
    console.log(`%c🛠️ [DEV] ${msg}`, `color: ${color}; font-weight: bold;`);
}

function safe(fn) {
    try { fn(); } catch (e) { log(`Ошибка: ${e.message}`, '#ff4444'); }
}

function getAUToDamage() {
    return window.GAME_CONFIG?.AU_TO_DAMAGE || 149597870.691;
}

// ─── ОСНОВНЫЕ КОМАНДЫ ───

/**
 * Добавить кристаллы
 */
function addCrystals(amount = 1000000) {
    safe(() => {
        const gs = window.gameState;
        if (!gs) return log('gameState не доступен', '#ff4444');
        gs.coins = (gs.coins || 0) + amount;
        if (window.GAME_UI?.updateHUD) window.GAME_UI.updateHUD();
        if (window.GAME_UI?.updateUpgradeButtons) window.GAME_UI.updateUpgradeButtons();
        if (window.shopSystem?.updateShopDisplay) window.shopSystem.updateShopDisplay();
        if (typeof window.saveGame === 'function') window.saveGame();
        log(`+${amount.toLocaleString()} 💎 (всего: ${gs.coins.toLocaleString()})`, '#4CAF50');
    });
}

/**
 * Установить прогресс AU (0-100%)
 */
function setProgress(percent = 50) {
    safe(() => {
        const gs = window.gameState;
        if (!gs) return;
        const planet = gs.currentLocation || 'mercury';
        const targetAU = window.GAME_CONFIG?.astronomicalUnits?.[planet] || 0.38710;
        const targetDamage = targetAU * getAUToDamage() * 0.999;
        const newDamage = Math.floor(targetDamage * (percent / 100));
        gs.planetDamageDealt = newDamage;
        if (window.GAME_UI?.updateProgressBar) window.GAME_UI.updateProgressBar();
        if (typeof window.saveGame === 'function') window.saveGame();
        log(`Прогресс ${planet}: ${percent}% (${(newDamage / getAUToDamage()).toFixed(5)} AU)`, '#4FC3F7');
    });
}

/**
 * Протестировать конкретную метрику
 */
function setMetric(metric, value) {
    safe(() => {
        const gm = window.gameMetrics || (window.gameMetrics = {});
        const gs = window.gameState;
        if (!gs) return;
        const planet = gs.currentLocation || 'mercury';
        if (!gm.planetStats) gm.planetStats = {};
        if (!gm.planetStats[planet]) gm.planetStats[planet] = {};
        
        const mapping = {
            blocks: 'blocks',
            crits: 'crits',
            combo: 'combo',
            rare: 'rare',
            crystals: 'crystalsEarned',
            bobo: 'boboActivations',
            boboDmg: 'boboDamage',
            boboCrystals: 'boboCrystalsEarned',
            time: 'timePlayed',
            speed: 'fastestBlock',
            critStreak: 'maxCritStreak',
            upgrades: 'upgrades',
            damage: 'damageDealt'
        };
        
        const field = mapping[metric];
        if (!field) {
            log(`Неизвестная метрика: ${metric}. Доступные: ${Object.keys(mapping).join(', ')}`, '#ff4444');
            return;
        }
        
        gm.planetStats[planet][field] = value;
        
        // Обновляем достижение через PlanetFactory
        if (window.AchievementsV2?.PlanetFactory) {
            const module = window.AchievementsV2.PlanetFactory.get(planet);
            if (module && metric !== 'damage') {
                module.updateMetricProgress(metric, value);
            }
        }
        
        log(`${planet}.${metric} = ${value}`, '#4CAF50');
    });
}

/**
 * Протестировать ВСЕ 12 метрик Меркурия
 */
function testAllMetrics() {
    safe(() => {
        log('🚀 Тестирование всех 12 метрик...', '#FFD700');
        
        const testValues = {
            blocks: 100,
            crits: 50,
            combo: 20,
            rare: 15,
            crystals: 50000,
            bobo: 10,
            boboDmg: 50000,
            boboCrystals: 10000,
            time: 600,
            speed: 5000,
            critStreak: 10,
            upgrades: 20
        };
        
        for (const [metric, value] of Object.entries(testValues)) {
            setMetric(metric, value);
        }
        
        log('✅ Все метрики протестированы!', '#4CAF50');
    });
}

/**
 * Сбросить прогресс текущей планеты
 */
function resetPlanet() {
    safe(() => {
        const gs = window.gameState;
        if (!gs) return;
        const planet = gs.currentLocation || 'mercury';
        
        gs.planetDamageDealt = 0;
        if (gs.achievementsV2?.[planet]) {
            gs.achievementsV2[planet] = { rank: 0, totalUnlocked: 0, metrics: {}, masterUnlocked: false };
        }
        if (window.gameMetrics?.planetStats?.[planet]) {
            window.gameMetrics.planetStats[planet] = {};
        }
        
        if (window.GAME_UI?.updateProgressBar) window.GAME_UI.updateProgressBar();
        if (window.AchievementsV2?.UI?.updateAchievementsButton) {
            window.AchievementsV2.UI.updateAchievementsButton();
        }
        if (typeof window.saveGame === 'function') window.saveGame();
        log(`Прогресс ${planet} сброшен`, '#ff9800');
    });
}

/**
 * Проверить мастер-достижение планеты
 */
function testMasterAchievement() {
    safe(() => {
        const gs = window.gameState;
        if (!gs) return;
        const planet = gs.currentLocation || 'mercury';
        const targetAU = window.GAME_CONFIG?.astronomicalUnits?.[planet] || 0.38710;
        const targetDamage = targetAU * getAUToDamage() * 0.999;
        
        gs.planetDamageDealt = targetDamage;
        
        if (window.AchievementsV2?.PlanetFactory) {
            const module = window.AchievementsV2.PlanetFactory.get(planet);
            if (module) module.checkMasterAchievement(targetDamage);
        }
        
        log(`Мастер-достижение ${planet} проверено!`, '#FFD700');
    });
}

/**
 * Перейти на планету (с обходом защиты от даунгрейда)
 */
function gotoPlanet(planet) {
    safe(() => {
        if (!window.GAME_CORE?.setLocation) {
            log('GAME_CORE.setLocation не доступен', '#ff4444');
            return;
        }
        
        const validPlanets = window.GAME_CONFIG?.planetOrder || [];
        if (!validPlanets.includes(planet)) {
            log(`Неверная планета: ${planet}. Доступные: ${validPlanets.join(', ')}`, '#ff4444');
            return;
        }
        
        const gs = window.gameState;
        if (!gs) {
            log('gameState не доступен', '#ff4444');
            return;
        }
        
        // ⚠️ ОБХОД ЗАЩИТЫ: Временно убираем проверку индекса
        const originalCurrentLocation = gs.currentLocation;
        
        // Принудительно устанавливаем новую планету
        gs.currentLocation = planet;
        gs.planetDamageDealt = 0; // Сбрасываем прогресс-бар
        
        // Разблокируем планету если нужно
        if (!gs.unlockedLocations.includes(planet)) {
            gs.unlockedLocations.push(planet);
        }
        
        // Вызываем setLocation для обновления UI
        // (setLocation имеет защиту, поэтому обновляем вручную)
        if (window.GAME_UI?.updateProgressBar) window.GAME_UI.updateProgressBar();
        if (window.GAME_UI?.updateHUD) window.GAME_UI.updateHUD();
        
        // Обновляем заголовок
        const gameTitle = document.getElementById('gameTitle');
        if (gameTitle && window.applyTranslation) {
            window.applyTranslation(gameTitle, `gameTitle.${planet}`);
        }
        
        // Обновляем цвет бордера
        const header = document.getElementById('header');
        const locationConfig = window.GAME_CONFIG?.locations?.[planet];
        if (header && locationConfig) {
            header.style.borderColor = locationConfig.borderColor;
        }
        
        // Показываем объявление
        const ann = document.getElementById('levelAnnounce');
        if (ann && locationConfig) {
            ann.textContent = locationConfig.name;
            ann.style.color = locationConfig.color;
            ann.style.opacity = "1";
            setTimeout(() => { ann.style.opacity = "0"; }, 2000);
        }
        
        // Обновляем фон планеты
        if (window.planetBackground?.setPlanet) {
            window.planetBackground.setPlanet(planet);
        }
        
        // Обновляем достижения
        if (window.achievementsSystem?.updatePlanetProgress) {
            window.achievementsSystem.updatePlanetProgress(planet);
        }
        
        // Отправляем событие смены планеты
        if (window.EventBus) {
            window.EventBus.emit('game:planetChanged', planet);
        }
        
        // Сохраняем
        if (typeof window.saveGame === 'function') window.saveGame();
        
        log(`✅ Переход на ${planet} (AU: ${locationConfig?.au || 'N/A'})`, '#4CAF50');
    });
}

/**
 * Быстрый тур по всем планетам (задержка 1 сек между переходами)
 */
function tourAllPlanets() {
    safe(() => {
        const planets = window.GAME_CONFIG?.planetOrder || [];
        if (planets.length === 0) {
            log('Список планет пуст', '#ff4444');
            return;
        }
        
        log(`🚀 Начинаем тур по ${planets.length} планетам...`, '#FFD700');
        
        planets.forEach((planet, index) => {
            setTimeout(() => {
                gotoPlanet(planet);
                if (index === planets.length - 1) {
                    log('✅ Тур завершён!', '#4CAF50');
                }
            }, index * 1000); // 1 секунда между переходами
        });
    });
}

/**
 * Разблокировать все планеты
 */
function unlockAllPlanets() {
    safe(() => {
        const gs = window.gameState;
        if (!gs) return;
        const planets = window.GAME_CONFIG?.planetOrder || [];
        gs.unlockedLocations = [...planets];
        if (typeof window.saveGame === 'function') window.saveGame();
        log(`🔓 Разблокировано ${planets.length} планет`, '#4CAF50');
    });
}

/**
 * Установить конкретный урон на планете (в AU)
 */
function setDamageInAU(auValue) {
    safe(() => {
        const gs = window.gameState;
        if (!gs) return;
        const damage = auValue * getAUToDamage();
        gs.planetDamageDealt = damage;
        if (window.GAME_UI?.updateProgressBar) window.GAME_UI.updateProgressBar();
        if (typeof window.saveGame === 'function') window.saveGame();
        log(`Урон установлен: ${auValue} AU (${damage.toLocaleString()} damage)`, '#4FC3F7');
    });
}

/**
 * Симулировать активацию Bobo
 */
function simulateBobo() {
    safe(() => {
        const gs = window.gameState;
        if (!gs) return;
        const planet = gs.currentLocation || 'mercury';
        
        if (window.achievementsSystem?.incrementPlanetBobo) {
            window.achievementsSystem.incrementPlanetBobo(planet);
        }
        if (window.achievementsSystem?.incrementPlanetBoboDamage) {
            window.achievementsSystem.incrementPlanetBoboDamage(planet, 5000);
        }
        if (window.achievementsSystem?.incrementPlanetBoboCrystals) {
            window.achievementsSystem.incrementPlanetBoboCrystals(planet, 1000);
        }
        
        log('🤖 Bobo активирован (тест)', '#69f0ae');
    });
}

/**
 * Вызвать случайное событие (для теста комет/астероидов)
 */
function spawnAsteroid() {
    if (window.RandomEvents?.spawnAsteroid) {
        window.RandomEvents.spawnAsteroid();
        log('🪨 Астероид создан', '#a0826d');
    } else {
        log('RandomEvents не доступен', '#ff4444');
    }
}

function spawnComet() {
    if (window.RandomEvents?.spawnComet) {
        window.RandomEvents.spawnComet();
        log('☄️ Комета создана', '#4FC3F7');
    } else {
        log('RandomEvents не доступен', '#ff4444');
    }
}

// ─── СОЗДАНИЕ ПЛАВАЮЩЕЙ ПАНЕЛИ ───
function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'devToolsPanel';
    panel.style.cssText = PANEL_STYLE;
    
    const title = document.createElement('div');
    title.style.cssText = 'color: #FFD700; font-size: 1em; font-weight: bold; margin-bottom: 10px; text-align: center; border-bottom: 1px solid rgba(255,215,0,0.3); padding-bottom: 8px;';
    title.innerHTML = '🛠️ DEV TOOLS <span style="font-size: 0.7em; color: #aaa;">(разработка)</span>';
    panel.appendChild(title);
    
    const btn = (text, fn) => {
        const b = document.createElement('button');
        b.innerHTML = text;
        b.style.cssText = BTN_STYLE;
        b.onmouseover = () => b.style.background = 'linear-gradient(135deg, rgba(255,215,0,0.4), rgba(255,140,0,0.4))';
        b.onmouseout = () => b.style.background = 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,140,0,0.2))';
        b.onclick = fn;
        panel.appendChild(b);
    };
    
    // Кнопки
    const section = (title) => {
        const s = document.createElement('div');
        s.style.cssText = 'color: #FFD700; font-size: 0.7em; margin-top: 10px; margin-bottom: 3px; border-top: 1px solid rgba(255,215,0,0.2); padding-top: 5px;';
        s.textContent = title;
        panel.appendChild(s);
    };
    
    section('💎 ЭКОНОМИКА');
    btn('➕ +1,000,000 кристаллов', () => addCrystals(1000000));
    btn('➕ +10,000,000 кристаллов', () => addCrystals(10000000));
    
    section('📊 ПРОГРЕСС');
    btn('📍 Прогресс 50%', () => setProgress(50));
    btn('📍 Прогресс 90%', () => setProgress(90));
    btn('📍 Прогресс 99%', () => setProgress(99));
    btn('💥 Урон 0.1 AU', () => setDamageInAU(0.1));
    btn('💥 Урон 0.5 AU', () => setDamageInAU(0.5));
    btn('👑 Тест Мастер-достижения', testMasterAchievement);
    btn('🔄 Сброс планеты', resetPlanet);
    
    section('🧪 МЕТРИКИ (12 шт)');
    btn('🚀 Тест ВСЕХ 12 метрик', testAllMetrics);
    btn('🤖 Симуляция Bobo', simulateBobo);
    
    section('🌍 ПЛАНЕТЫ (9 шт)');
    btn('☿ Меркурий (0.387 AU)', () => gotoPlanet('mercury'));
    btn('♀ Венера (0.723 AU)', () => gotoPlanet('venus'));
    btn('♁ Земля (1.000 AU)', () => gotoPlanet('earth'));
    btn('♂ Марс (1.524 AU)', () => gotoPlanet('mars'));
    btn('♃ Юпитер (5.203 AU)', () => gotoPlanet('jupiter'));
    btn('♄ Сатурн (9.537 AU)', () => gotoPlanet('saturn'));
    btn('♅ Уран (19.191 AU)', () => gotoPlanet('uranus'));
    btn('♆ Нептун (30.069 AU)', () => gotoPlanet('neptune'));
    btn('♇ Плутон (39.482 AU)', () => gotoPlanet('pluto'));
    btn('🚀 Тур по всем планетам', tourAllPlanets);
    btn('🔓 Разблокировать все', unlockAllPlanets);
    
    section('🌠 СОБЫТИЯ');
    btn('🪨 Создать астероид', spawnAsteroid);
    btn('☄️ Создать комету', spawnComet);
    
    // Кнопка закрытия
    const close = document.createElement('button');
    close.innerHTML = '✕ Закрыть';
    close.style.cssText = BTN_STYLE + 'margin-top: 10px; background: rgba(244,67,54,0.3); border-color: #f44336; color: #fff;';
    close.onclick = () => { panel.style.display = 'none'; };
    panel.appendChild(close);
    
    // Делаем панель перетаскиваемой
    let isDragging = false, offsetX = 0, offsetY = 0;
    title.style.cursor = 'move';
    title.onmousedown = (e) => {
        isDragging = true;
        const rect = panel.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        panel.style.bottom = 'auto';
        panel.style.right = 'auto';
    };
    document.onmousemove = (e) => {
        if (!isDragging) return;
        panel.style.left = (e.clientX - offsetX) + 'px';
        panel.style.top = (e.clientY - offsetY) + 'px';
    };
    document.onmouseup = () => isDragging = false;
    
    document.body.appendChild(panel);
    log('Панель создана. Перетаскивайте за заголовок.', '#4CAF50');
}

// ─── ЭКСПОРТ В ГЛОБАЛЬНЫЙ ОБЪЕКТ ───
window.DevTools = {
    addCrystals,
    setProgress,
    setDamageInAU,
    setMetric,
    testAllMetrics,
    resetPlanet,
    testMasterAchievement,
    gotoPlanet,
    gotoMercury: () => gotoPlanet('mercury'),
    gotoVenus: () => gotoPlanet('venus'),
    gotoEarth: () => gotoPlanet('earth'),
    gotoMars: () => gotoPlanet('mars'),
    gotoJupiter: () => gotoPlanet('jupiter'),
    gotoSaturn: () => gotoPlanet('saturn'),
    gotoUranus: () => gotoPlanet('uranus'),
    gotoNeptune: () => gotoPlanet('neptune'),
    gotoPluto: () => gotoPlanet('pluto'),
    tourAllPlanets,
    simulateBobo,
    spawnAsteroid,
    spawnComet,
    unlockAllPlanets,
    showPanel: createPanel,
    hidePanel: () => {
        const p = document.getElementById('devToolsPanel');
        if (p) p.style.display = 'none';
    }
};

// ─── АВТОИНИЦИАЛИЗАЦИЯ ───
function init() {
    console.log('%c🛠️ Dev Tools загружены!', 'color: #FFD700; font-size: 1.2em; font-weight: bold;');
    console.log('%cДоступные команды:', 'color: #4FC3F7;');
    console.log('%c  DevTools.addCrystals(1000000)', 'color: #aaa;');
    console.log('%c  DevTools.gotoVenus()', 'color: #aaa;');
    console.log('%c  DevTools.tourAllPlanets()', 'color: #aaa;');
    console.log('%c  DevTools.testAllMetrics()', 'color: #aaa;');
    console.log('%c  DevTools.showPanel()', 'color: #4CAF50; font-weight: bold;');
    
    // Автоматически показываем панель через 2 секунды
    setTimeout(() => {
        if (!document.getElementById('devToolsPanel')) {
            createPanel();
        }
    }, 2000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();