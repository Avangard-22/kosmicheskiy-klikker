// js/random-events.js (v2.0)
// ═══════════════════════════════════════════════════
// 🌠 СИСТЕМА СЛУЧАЙНЫХ СОБЫТИЙ НА ЛОКАЦИИ
// ЧТО: Астероиды (1 клик) и Кометы (2 клика) пролетают через экран
// ЗАЧЕМ: Редкие сюрпризы (2-30 мин), оживление геймплея, доп. награды
// ИНТЕГРАЦИЯ: Работает параллельно с game-core, не влияет на блоки
// ═══════════════════════════════════════════════════
(function() {
'use strict';

const CFG = window.GAME_CONFIG;

// ─────────────────────────────────────────────────────
// ⚙️ КОНФИГУРАЦИЯ СОБЫТИЙ
// ─────────────────────────────────────────────────────
const EVENTS_CONFIG = {
    // Интервал появления: случайный от MIN до MAX миллисекунд
    minIntervalMs: 2 * 60 * 1000,   // 2 минуты
    maxIntervalMs: 30 * 60 * 1000,  // 30 минут
    
    // Вероятность типа события при срабатывании таймера
    asteroidWeight: 60,  // 60% шанс астероида
    cometWeight: 40,     // 40% шанс кометы
    
    // Астероид: кристаллы (1 клик)
    asteroid: {
        minCrystals: 500,
        maxCrystals: 2000,
        speed: { min: 2, max: 5 },
        size: { min: 40, max: 70 },
        color: '#a0826d',
        glowColor: 'rgba(255, 200, 100, 0.6)',
        emoji: '🪨'
    },
    
    // Комета: бафф (2 клика)
    comet: {
        speed: { min: 3, max: 6 },
        size: { min: 50, max: 80 },
        headColor: '#4fc3f7',
        emoji: '☄️',
        
        buffs: [
            {
                type: 'damage_boost',
                name: { ru: '⚡ Усиление урона', en: '⚡ Damage Boost', zh: '⚡ 伤害增强' },
                durationMs: 180000,
                valueMin: 1.5,
                valueMax: 3.0,
                weight: 50
            },
            {
                type: 'crystal_boost',
                name: { ru: '💰 Кристальный дождь', en: '💰 Crystal Rain', zh: '💰 水晶雨' },
                durationMs: 0,
                valueMin: 50,
                valueMax: 500,
                weight: 50
            }
        ]
    }
};

// ─────────────────────────────────────────────────────
// 🎲 УТИЛИТЫ
// ─────────────────────────────────────────────────────
function rand(min, max) { return min + Math.random() * (max - min); }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }

function pickWeighted(items) {
    const total = items.reduce((s, i) => s + (i.weight || 1), 0);
    let roll = Math.random() * total;
    for (const item of items) {
        roll -= (item.weight || 1);
        if (roll <= 0) return item;
    }
    return items[items.length - 1];
}

function getRandomInterval() {
    return rand(EVENTS_CONFIG.minIntervalMs, EVENTS_CONFIG.maxIntervalMs);
}

// ─────────────────────────────────────────────────────
// 🖼️ CANVAS ДЛЯ СОБЫТИЙ
// ─────────────────────────────────────────────────────
let eventCanvas = null;
let eventCtx = null;
let activeEvents = [];
let nextEventTimer = null;
let animationId = null;
let isPaused = false;

function initCanvas() {
    if (eventCanvas) return;
    eventCanvas = document.createElement('canvas');
    eventCanvas.id = 'randomEventsCanvas';
    // ✅ ИСПРАВЛЕНО: pointer-events:none чтобы клики проходили к блокам
    // Обработчики вешаем на document, не на canvas
    eventCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:150;';
    document.body.appendChild(eventCanvas);
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    eventCtx = eventCanvas.getContext('2d');
    console.log('🌠 [EVENTS] Canvas initialized');
}

function resizeCanvas() {
    if (!eventCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    eventCanvas.width = window.innerWidth * dpr;
    eventCanvas.height = window.innerHeight * dpr;
    eventCanvas.style.width = window.innerWidth + 'px';
    eventCanvas.style.height = window.innerHeight + 'px';
    if (eventCtx) eventCtx.scale(dpr, dpr);
}

// ─────────────────────────────────────────────────────
// 🪨 КЛАСС: АСТЕРОИД (1 клик)
// ─────────────────────────────────────────────────────
class AsteroidEvent {
    constructor() {
        const cfg = EVENTS_CONFIG.asteroid;
        this.type = 'asteroid';
        this.size = rand(cfg.size.min, cfg.size.max);
        this.speed = rand(cfg.speed.min, cfg.speed.max);
        this.crystals = randInt(cfg.minCrystals, cfg.maxCrystals);
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = rand(-0.03, 0.03);
        this.alive = true;
        this.clicked = false;
        
        // Случайная траектория
        const side = Math.floor(Math.random() * 4);
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        switch (side) {
            case 0: this.x = rand(this.size, w - this.size); this.y = -this.size; this.vx = rand(-1, 1); this.vy = this.speed; break;
            case 1: this.x = w + this.size; this.y = rand(this.size, h - this.size); this.vx = -this.speed; this.vy = rand(-1, 1); break;
            case 2: this.x = rand(this.size, w - this.size); this.y = h + this.size; this.vx = rand(-1, 1); this.vy = -this.speed; break;
            case 3: this.x = -this.size; this.y = rand(this.size, h - this.size); this.vx = this.speed; this.vy = rand(-1, 1); break;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        
        const margin = this.size * 2;
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (this.x < -margin || this.x > w + margin || this.y < -margin || this.y > h + margin) {
            this.alive = false;
        }
    }
    
    draw(ctx) {
        if (!this.alive || this.clicked) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = EVENTS_CONFIG.asteroid.glowColor;
        
        ctx.fillStyle = EVENTS_CONFIG.asteroid.color;
        ctx.beginPath();
        const points = 7;
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const r = this.size / 2 * (0.7 + 0.3 * Math.sin(i * 2.7));
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.font = `${this.size * 0.5}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(EVENTS_CONFIG.asteroid.emoji, 0, 0);
        
        ctx.restore();
    }
    
hitTest(clientX, clientY) {
    if (!this.alive || this.clicked) return false;
    // ✅ Координаты уже в viewport space (совпадают с this.x, this.y)
    const dx = clientX - this.x;
    const dy = clientY - this.y;
    const hitRadius = this.size / 2 + 20; // ✅ Увеличенный хитбокс для удобства
    return (dx * dx + dy * dy) <= hitRadius * hitRadius;
}
    
// ✅ 1 КЛИК — мгновенный сбор
collect() {
    if (this.clicked) return;
    this.clicked = true;
    this.alive = false;
    
    // 🌌 УЧИТЫВАЕМ КОЭФФИЦИЕНТ ПЛАНЕТЫ (баланс)
    const planetIndex = CFG.planetOrder.indexOf(window.gameState?.currentLocation || 'mercury');
    const planetMultiplier = 1 + (planetIndex * 0.1);
    const crystals = Math.floor(this.crystals * planetMultiplier);
    
    if (window.gameState) {
        window.gameState.coins = (window.gameState.coins || 0) + crystals;
    }
    
    // ✅ НОВОЕ: Учитываем кристаллы от астероида в метриках достижений
    if (window.achievementsSystem) {
        const planet = window.gameState?.currentLocation;
        // Глобальная метрика "Всего заработано кристаллов"
        if (window.achievementsSystem.incrementCoinsEarned) {
            window.achievementsSystem.incrementCoinsEarned(crystals);
        }
        // Планетарная метрика "Заработано кристаллов" (на текущей планете)
        if (planet && window.achievementsSystem.incrementPlanetCrystals) {
            window.achievementsSystem.incrementPlanetCrystals(planet, crystals);
        }
    }
    
    const fmt = window.formatNumber ? window.formatNumber(crystals) : crystals;
showFloatingText(`+${fmt} 💎`, this.x, this.y, '#FFD700', 1.3);
    
    // 🌠 С НЕБОЛЬШИМ ШАНСОМ (10%) ДОБАВЛЯЕМ ВРЕМЕННЫЕ БУСТЫ
    if (Math.random() < 0.1) {
        const boostType = Math.floor(Math.random() * 3);
        
        switch (boostType) {
            // 🔥 БУСТ 1: Усиление урона на 100% на 1-3 минуты
            case 0:
                const duration = rand(60000, 180000); // 1-3 минуты
                activateDamageBuff(2, duration);
                showFloatingText('⚡ Усиление урона x2!', this.x, this.y - 30, '#4FC3F7', 1.2);
                break;
                
// 🤖 БУСТ 2: Активация Bobo с ускоренной стрельбой
case 1:
    const duration2 = rand(60000, 180000); // 1-3 минуты
    const interval = Math.floor(rand(500, 1000)); // 0.5-1 сек между выстрелами
    const gs = window.gameState;
    const core = window.GAME_CORE;
    
    if (gs && core) {
        // Сохраняем оригинальные значения для восстановления
        const originalInterval = gs.permanentHelperInterval || 1500;
        const wasActive = gs.helperActive;
        const originalTimeLeft = gs.helperTimeLeft || 0;
        
        // ✅ Устанавливаем ускоренный интервал
        gs.permanentHelperInterval = interval;
        
        if (!wasActive) {
            // ── Bobo НЕ был активен: АКТИВИРУЕМ его ──
            if (window.GAME_FEATURES?.activateHelper) {
                window.GAME_FEATURES.activateHelper();
                console.log(`☄️ [EVENTS] Bobo activated by asteroid! Interval: ${interval}ms for ${(duration2/1000).toFixed(0)}s`);
            }
        } else {
            // ── Bobo УЖЕ активен: перезапускаем интервал и продлеваем время ──
            
            // Останавливаем текущий интервал стрельбы
            if (core.helperInterval) {
                clearInterval(core.helperInterval);
                core.helperInterval = null;
            }
            
            // Создаём новый интервал с ускоренной стрельбой
            core.helperInterval = setInterval(() => {
                if (gs.helperActive && core.currentBlock &&
                    gs.gameActive && !core.isGamePaused) {
                    core.helperAttack();
                }
            }, interval);
            
            // Продлеваем время работы Bobo на duration2
            gs.helperTimeLeft = Math.max(gs.helperTimeLeft || 0, duration2);
            
            console.log(`☄️ [EVENTS] Bobo boosted! Interval: ${interval}ms for ${(duration2/1000).toFixed(0)}s`);
        }
        
        // ⏰ Через duration2 восстанавливаем оригинальный интервал
        setTimeout(() => {
            // Проверяем, что буст ещё не был перезаписан другим бустом
            if (gs.permanentHelperInterval === interval) {
                gs.permanentHelperInterval = originalInterval;
                
                // Если Bobo всё ещё активен — перезапускаем интервал с оригинальной скоростью
                if (gs.helperActive && core.helperInterval) {
                    clearInterval(core.helperInterval);
                    core.helperInterval = setInterval(() => {
                        if (gs.helperActive && core.currentBlock &&
                            gs.gameActive && !core.isGamePaused) {
                            core.helperAttack();
                        }
                    }, originalInterval);
                }
                
                console.log(`☄️ [EVENTS] Bobo boost expired. Interval restored to ${originalInterval}ms`);
            }
        }, duration2);
        
        showFloatingText(`🤖 Bobo x${(1500/interval).toFixed(1)}!\n(${(duration2/1000).toFixed(0)}с)`, this.x, this.y - 30, '#4FC3F7', 1.2);
    }
    break;
                
// 💰 БУСТ 3: Случайный бонус (+10% до +150%) к ТЕКУЩЕМУ бонусу Bobo
case 2: {
    const duration3 = rand(60000, 180000); // 1-3 минуты
    const originalBonus = window.gameState?.boboCoinBonus || 0;
    
    // ✅ Генерируем случайный бонус от 10% до 150% (0.10 - 1.50)
    const randomBoost = Math.floor(rand(10, 151)) / 100;
    const newBonus = originalBonus + randomBoost;
    window.gameState.boboCoinBonus = newBonus;
    
    // ⏰ Через duration3 восстанавливаем исходный бонус
    setTimeout(() => {
        // Проверяем что буст ещё активен (не был перезаписан другим бустом)
        if (window.gameState?.boboCoinBonus === newBonus) {
            window.gameState.boboCoinBonus = originalBonus;
            console.log(`💰 [EVENTS] Bobo crystal boost expired. Restored to ${(originalBonus * 100).toFixed(0)}%`);
        }
    }, duration3);
    
    // 🎨 Отображаем реальный процент бонуса
    const percentDisplay = Math.round(randomBoost * 100);
    const durationSec = Math.round(duration3 / 1000);
    showFloatingText(
        `💰 Bobo +${percentDisplay}%!\n(${durationSec}с)`,
        this.x, this.y - 30, '#4FC3F7', 1.2
    );
    
    console.log(`💰 [EVENTS] Bobo crystal boost: +${percentDisplay}% (was ${(originalBonus*100).toFixed(0)}% → now ${(newBonus*100).toFixed(0)}%) for ${durationSec}s`);
    break;
}
        }
    }
    
    if (window.GAME_CORE?.playSound) window.GAME_CORE.playSound('upgradeSound');
    if (window.telegramHaptic?.success) window.telegramHaptic.success();
    else if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    
    if (window.GAME_UI?.updateHUD) window.GAME_UI.updateHUD();
    if (typeof window.saveGame === 'function') window.saveGame();
    
    console.log(`🪨 [EVENTS] Asteroid collected! +${crystals} 💎`);
}
}

// ─────────────────────────────────────────────────────
// ☄️ КЛАСС: КОМЕТА (1 клик — как астероид, но даёт бафф)
// ─────────────────────────────────────────────────────
class CometEvent {
    constructor() {
        const cfg = EVENTS_CONFIG.comet;
        this.type = 'comet';
        this.size = rand(cfg.size.min, cfg.size.max);
        this.speed = rand(cfg.speed.min, cfg.speed.max);
        this.alive = true;
        this.clicked = false;
        this.buff = pickWeighted(cfg.buffs);
        this.buffValue = rand(this.buff.valueMin, this.buff.valueMax);
        
        if (this.buff.type === 'crystal_boost') {
            this.buffValue = Math.round(this.buffValue);
        } else {
            this.buffValue = Math.round(this.buffValue * 10) / 10;
        }
        
        // Траектория по диагонали
        const w = window.innerWidth;
        const h = window.innerHeight;
        const direction = Math.random() > 0.5 ? 1 : -1;
        
        if (direction > 0) {
            this.x = -this.size; 
            this.y = rand(-this.size, h * 0.3);
            this.vx = this.speed; 
            this.vy = this.speed * rand(0.3, 0.8);
        } else {
            this.x = w + this.size; 
            this.y = rand(-this.size, h * 0.3);
            this.vx = -this.speed; 
            this.vy = this.speed * rand(0.3, 0.8);
        }
        
        this.trail = [];
    }
    
    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 20) this.trail.shift();
        
        this.x += this.vx;
        this.y += this.vy;
        
        const margin = this.size * 2 + 120;
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        if (this.x < -margin || this.x > w + margin || this.y > h + margin) {
            this.alive = false;
        }
    }
    
    draw(ctx) {
        if (!this.alive || this.clicked) return;
        const cfg = EVENTS_CONFIG.comet;
        
        // Хвост
        if (this.trail.length > 1) {
            ctx.save();
            for (let i = 0; i < this.trail.length - 1; i++) {
                const alpha = (i / this.trail.length) * 0.6;
                const width = (i / this.trail.length) * (this.size * 0.4);
                ctx.beginPath();
                ctx.moveTo(this.trail[i].x, this.trail[i].y);
                ctx.lineTo(this.trail[i + 1].x, this.trail[i + 1].y);
                ctx.strokeStyle = `rgba(79, 195, 247, ${alpha})`;
                ctx.lineWidth = width;
                ctx.lineCap = 'round';
                ctx.stroke();
            }
            ctx.restore();
        }
        
        // Голова кометы
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = 20;
        ctx.shadowColor = cfg.headColor;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.font = `${this.size * 0.5}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cfg.emoji, 0, 0);
        ctx.restore();
    }
    
hitTest(clientX, clientY) {
    if (!this.alive || this.clicked) return false;
    // ✅ Координаты уже в viewport space
    const dx = clientX - this.x;
    const dy = clientY - this.y;
    const hitRadius = this.size / 2 + 25; // ✅ Ещё больший хитбокс (кометы быстрые!)
    return (dx * dx + dy * dy) <= hitRadius * hitRadius;
}
    
    // ✅ 1 КЛИК — мгновенная активация баффа (как у астероида)
    collect() {
        if (this.clicked) return;
        this.clicked = true;
        this.alive = false;
        
        const lang = window.currentLanguage || 'ru';
        const buffName = this.buff.name[lang] || this.buff.name.en;
        
        if (this.buff.type === 'damage_boost') {
            activateDamageBuff(this.buffValue, this.buff.durationMs);
            showFloatingText(`${buffName}\nx${this.buffValue} (${Math.round(this.buff.durationMs / 1000)}с)`, this.x, this.y, '#4FC3F7', 1.2);
            console.log(`☄️ [EVENTS] Comet: Damage x${this.buffValue} for ${this.buff.durationMs / 1000}s`);
        } else if (this.buff.type === 'crystal_boost') {
            activateCrystalBuff(this.buffValue);
            showFloatingText(`${buffName}\n+${this.buffValue}% 💎`, this.x, this.y, '#FFD700', 1.2);
            console.log(`☄️ [EVENTS] Comet: +${this.buffValue}% crystals on next block`);
        }
        
        if (window.GAME_CORE?.playSound) window.GAME_CORE.playSound('comboSound');
        if (window.telegramHaptic?.success) window.telegramHaptic.success();
        else if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
    }
}

// ─────────────────────────────────────────────────────
// 💫 ПЛАВАЮЩИЙ ТЕКСТ
// ─────────────────────────────────────────────────────
function showFloatingText(text, x, y, color, scale) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `
        position: fixed; left: ${x}px; top: ${y}px;
        transform: translate(-50%, -50%) scale(${scale || 1});
        color: ${color || '#fff'};
        font-family: 'Orbitron', sans-serif; font-weight: bold; font-size: 1.1em;
        text-shadow: 0 0 8px ${color || '#fff'}, 2px 2px 4px rgba(0,0,0,0.8);
        pointer-events: none; z-index: 100; white-space: pre-line; text-align: center;
        transition: all 1.5s ease-out; opacity: 1;
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
        el.style.transform = `translate(-50%, calc(-50% - 80px)) scale(${(scale || 1) * 0.8})`;
        el.style.opacity = '0';
    });
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1500);
}

// ─────────────────────────────────────────────────────
// ⚡ БАФФЫ ОТ КОМЕТ
// ─────────────────────────────────────────────────────
let damageBuffTimer = null;
let damageBuffMultiplier = 1;
let crystalBuffPercent = 0;

function activateDamageBuff(multiplier, durationMs) {
    if (damageBuffTimer) clearTimeout(damageBuffTimer);
    damageBuffMultiplier = multiplier;
    updateBuffIndicator();
    damageBuffTimer = setTimeout(() => {
        damageBuffMultiplier = 1;
        damageBuffTimer = null;
        updateBuffIndicator();
        console.log('⚡ [EVENTS] Damage buff expired');
    }, durationMs);
}

function activateCrystalBuff(percent) {
    crystalBuffPercent = percent;
    updateBuffIndicator();
}

function consumeCrystalBuff(baseReward) {
    if (crystalBuffPercent <= 0) return baseReward;
    const bonus = Math.floor(baseReward * (crystalBuffPercent / 100));
    crystalBuffPercent = 0;
    updateBuffIndicator();
    console.log(`💰 [EVENTS] Crystal buff applied: +${bonus}`);
    return baseReward + bonus;
}

function updateBuffIndicator() {
    let indicator = document.getElementById('eventBuffIndicator');
    const hasDamageBuff = damageBuffMultiplier > 1;
    const hasCrystalBuff = crystalBuffPercent > 0;
    
    if (!hasDamageBuff && !hasCrystalBuff) {
        if (indicator) indicator.style.display = 'none';
        return;
    }
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'eventBuffIndicator';
        indicator.style.cssText = 'position:fixed;top:70px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:40;pointer-events:none;';
        document.body.appendChild(indicator);
    }
    
    indicator.style.display = 'flex';
    indicator.innerHTML = '';
    
    if (hasDamageBuff) {
        const badge = document.createElement('div');
        badge.style.cssText = 'background:rgba(79,195,247,0.2);border:1px solid #4FC3F7;border-radius:8px;padding:4px 10px;font-size:0.7em;color:#4FC3F7;font-family:Orbitron,monospace;font-weight:bold;backdrop-filter:blur(4px);animation:dailyPulse 2s infinite;';
        badge.textContent = `⚡ x${damageBuffMultiplier}`;
        indicator.appendChild(badge);
    }
    if (hasCrystalBuff) {
        const badge = document.createElement('div');
        badge.style.cssText = 'background:rgba(255,215,0,0.2);border:1px solid #FFD700;border-radius:8px;padding:4px 10px;font-size:0.7em;color:#FFD700;font-family:Orbitron,monospace;font-weight:bold;backdrop-filter:blur(4px);animation:dailyPulse 2s infinite;';
        badge.textContent = `💰 +${crystalBuffPercent}%`;
        indicator.appendChild(badge);
    }
}

// ─────────────────────────────────────────────────────
// 🎮 СПАВН СОБЫТИЙ (случайный интервал 2-30 мин)
// ─────────────────────────────────────────────────────
function scheduleNextEvent() {
    if (nextEventTimer) clearTimeout(nextEventTimer);
    
    const interval = getRandomInterval();
    const minutes = (interval / 60000).toFixed(1);
    console.log(`🌠 [EVENTS] Next event in ${minutes} min`);
    
    nextEventTimer = setTimeout(() => {
        if (!isPaused && window.gameState?.gameActive) {
            spawnRandomEvent();
        }
        // Планируем следующее событие независимо от того, появилось ли текущее
        scheduleNextEvent();
    }, interval);
}

function spawnRandomEvent() {
    const totalWeight = EVENTS_CONFIG.asteroidWeight + EVENTS_CONFIG.cometWeight;
    const roll = Math.random() * totalWeight;
    
    if (roll < EVENTS_CONFIG.asteroidWeight) {
        activeEvents.push(new AsteroidEvent());
        console.log('🪨 [EVENTS] Asteroid spawned!');
    } else {
        activeEvents.push(new CometEvent());
        console.log('☄️ [EVENTS] Comet spawned!');
    }
}

// ─────────────────────────────────────────────────────
// 🔄 ИГРОВОЙ ЦИКЛ
// ─────────────────────────────────────────────────────
function gameLoop() {
    if (!eventCtx || !eventCanvas) return;
    
    const w = window.innerWidth;
    const h = window.innerHeight;
    eventCtx.clearRect(0, 0, w, h);
    
    if (!isPaused && window.gameState?.gameActive) {
        for (let i = activeEvents.length - 1; i >= 0; i--) {
            const evt = activeEvents[i];
            evt.update();
            evt.draw(eventCtx);
            if (!evt.alive) activeEvents.splice(i, 1);
        }
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

// ─────────────────────────────────────────────────────
// 👆 ОБРАБОТКА КЛИКОВ
// ─────────────────────────────────────────────────────
function handlePointerDown(e) {
    if (isPaused || !window.gameState?.gameActive) return;
    
    // ✅ ИСПРАВЛЕНО: Получаем координаты клика относительно viewport
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    
    if (clientX === undefined || clientY === undefined) return;
    
    // Проверяем попадание по активным событиям
    for (let i = activeEvents.length - 1; i >= 0; i--) {
        const evt = activeEvents[i];
        if (evt.hitTest(clientX, clientY)) {
            // ✅ Попадание! Останавливаем всплытие чтобы клик не дошел до блоков
            e.preventDefault();
            e.stopPropagation();
            evt.collect();
            console.log(`🎯 [EVENTS] Hit! Type: ${evt.type}`);
            return; // Обрабатываем только одно событие за клик
        }
    }
    // Если не попали ни по одному событию — ничего не делаем, 
    // событие всплывает дальше к игровым блокам
}

// ─────────────────────────────────────────────────────
// ⏸️ ПАУЗА / ВОЗОБНОВЛЕНИЕ
// ─────────────────────────────────────────────────────
function pause() {
    isPaused = true;
    if (nextEventTimer) clearTimeout(nextEventTimer);
}

function resume() {
    isPaused = false;
    scheduleNextEvent();
}

// ─────────────────────────────────────────────────────
// 🚀 ИНИЦИАЛИЗАЦИЯ
// ─────────────────────────────────────────────────────
function init() {
    initCanvas();
    
    // ✅ ИСПРАВЛЕНО: Вешаем обработчики на document, а не на canvas
    // Это позволяет ловить клики даже когда canvas имеет pointer-events:none
    document.addEventListener('pointerdown', handlePointerDown, { capture: true });
    document.addEventListener('touchstart', (e) => {
        // Не preventDefault здесь — это блокирует все клики!
        // preventDefault вызывается в handlePointerDown только при попадании
        handlePointerDown(e);
    }, { capture: true, passive: false });
    
    if (window.EventBus) {
        window.EventBus.on('game:paused', pause);
        window.EventBus.on('game:resumed', resume);
    }
    scheduleNextEvent();
    gameLoop();
    console.log('🌠 Random Events v2.0 initialized (clickable events)');
}

// ─────────────────────────────────────────────────────
// 🌐 ПУБЛИЧНЫЙ API
// ─────────────────────────────────────────────────────
window.RandomEvents = {
    init,
    pause,
    resume,
    getDamageMultiplier: () => damageBuffMultiplier,
    consumeCrystalBuff,
    // Для отладки
    spawnAsteroid: () => activeEvents.push(new AsteroidEvent()),
    spawnComet: () => activeEvents.push(new CometEvent()),
    getActiveCount: () => activeEvents.length
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 800));
} else {
    setTimeout(init, 800);
}

})();