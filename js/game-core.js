 // js/game-core.js
(function() {
'use strict';

const CFG = window.GAME_CONFIG;
const UI = window.GAME_UI;
const FEAT = window.GAME_FEATURES;
// ✅ БЕЗОПАСНЫЙ ГЕТТЕР: предотвращает краш, если game-features.js не загрузился
const getFeat = () => window.GAME_FEATURES || {};

// ❄️ ПРЕДОХРАНИТЕЛЬ: гарантируем, что у каждой планеты СВОЙ объект metrics
function isolateAchievementsV2(gs) {
    if (!gs || typeof gs.achievementsV2 !== 'object') return;
    let count = 0;
    for (const planet in gs.achievementsV2) {
        const entry = gs.achievementsV2[planet];
        if (!entry || typeof entry !== 'object') continue;
        entry.metrics = (entry.metrics && typeof entry.metrics === 'object')
            ? JSON.parse(JSON.stringify(entry.metrics)) // разрываем любую общую ссылку
            : {};
        count++;
    }
    if (count) console.log(`🧊 [CORE] achievementsV2 изолирован: ${count} планет с собственными метриками`);
}

// ✅ БЕЗОПАСНАЯ ИНИЦИАЛИЗАЦИЯ — только если save-system ещё не загрузился
// НЕ перезаписываем существующие данные!
if (!window.gameState) {
    console.warn('⚠️ [CORE] gameState не инициализирован, ждём save-system...');
    // НЕ создаём пустой объект — пусть save-system сам инициализирует
}
if (!window.gameMetrics) {
    console.warn('️ [CORE] gameMetrics не инициализирован, ждём save-system...');
}

window.GAME_CORE = {
    currentBlock: null,
    currentBlockHealth: 0,
    helperElement: null,
    helperInterval: null,
    helperTimer: null,
    helperPosition: { x: 0, y: 0 },
    isGamePaused: false,
    autoClickInterval: null,
    magnetInterval: null,
    blockSpeed: CFG.isMobile ? 60 : 20,
   deviceHealthMult: 1.0,  // ✅ НОВОЕ: множитель здоровья от детектора устройства
    lastHapticTime: 0,  // ✅ НОВОЕ: для throttling вибрации

    getBonus: function(type, fallback = 1) {
        if (window.shopSystem && typeof window.shopSystem[type] === 'function') return window.shopSystem[type]();
        return fallback;
    },

    playSound: function(id) {
        const s = document.getElementById(id);
        if (s) { s.currentTime = 0; s.play().catch(() => {}); }
    },

 pauseGame: function() {
     this.isGamePaused = true;
     if (window.gameState) window.gameState.gamePaused = true;
     const shopPanel = document.getElementById('shopPanel');
     if (shopPanel) { shopPanel.style.maxHeight = '65vh'; shopPanel.style.overflowY = 'auto'; }
     // ✅ НОВОЕ: Эмитируем событие паузы для random-events
     if (window.EventBus) window.EventBus.emit('game:paused');
 },
 resumeGame: function() {
     this.isGamePaused = false;
     if (window.gameState) window.gameState.gamePaused = false;
     // ✅ НОВОЕ: Эмитируем событие возобновления для random-events
     if (window.EventBus) window.EventBus.emit('game:resumed');
 },

// ✅ ИСПРАВЛЕНО: Ступенчатая прогрессия силы удара
// lvl 0:       1          (базовый урон)
// lvl 1-25:    +2 за уровень  (1 → 51)
// lvl 26-74:   +1 за уровень  (51 → 100)
// lvl 75+:     +0.5 за уровень (100 → ∞)
calculateClickPower: function() {
    const lvl = window.gameState.clickUpgradeLevel || 0;
    let power;
    if (lvl <= 0) power = 1;
    else if (lvl <= 25) power = 1 + lvl * 2;
    else if (lvl <= 74) power = 51 + (lvl - 25);
    else power = 100 + (lvl - 74) * 0.5;
    // ✅ НОВОЕ: Буст 30 дней — +5 к силе клика (daily-bonus.js)
    power += (window.dailyBonusSystem && window.dailyBonusSystem.isBoostActive()) ? 5 : 0;
    return power;
},

getCurrentSpeed: function() {
    if (!window.gameState) return this.blockSpeed;
    const planet = window.gameState.currentLocation || 'mercury';
    let speed = this.blockSpeed * (CFG.planetOrder.indexOf(planet) < 1 ? 0.85 : 1);
    // ✅ ЗЕРКАЛО СИМУЛЯТОРА: HP-рампа замедляет полёт блока с тем же коэффициентом,
    // иначе на поздних планетах killTime > flyTime на каждом блоке → стена пропусков
    const prof = (CFG.balanceConfig?.hpProfiles || {})[planet] || {};
    if (prof.rampNoDailyReset) {
        // Плутон/Гелиопауза: рампа без дневного сброса — считаем по блокам планеты
        const n = window.gameMetrics?.planetStats?.[planet]?.blocks || 0;
        const steps = Math.min(Math.floor(n / Number(prof.rampStep ?? 100)), Number(prof.rampMaxSteps ?? 30));
        if (steps > 0) speed /= (1 + steps * Number(prof.rampPerStep ?? 5) / 100);
    } else {
        const ramp = CFG.balanceConfig?.dailyRamp;
        if (ramp?.enabled) {
            const steps = Math.min(Math.floor((window.gameState.dailyBlocksDestroyed || 0) / Number(ramp.blocksPerStep || 100)), Number(ramp.maxSteps || 30));
            if (steps > 0) speed /= (1 + steps * Number(ramp.hpPercentPerStep ?? 5) / 100);
        }
    }
    return speed * this.getBonus('getSpeedMultiplier', 1);
},

// 🆕 v11: Базовый интервал атак Bobo с учётом «Ускорителя» (helperSpeedLevel)
// 1500 мс при 0 → 500 мс при 8 (пол 400 мс)
helperIntervalBase: function() {
    const lvl = Number(window.gameState?.helperSpeedLevel) || 0;
    return Math.max(400, Math.round(1500 / (1 + 0.25 * lvl)));
},

// ЧТО: Делегируем расчёт HP блока в единый CombatSystem

// КУДА: game-core.js → GAME_CORE.calculateBlockHealth()
// ЗАЧЕМ: Убираем дублирование формул. Теперь все изменения баланса в CombatSystem 
//        автоматически применяются в игре. Метод-обёртка сохранён для совместимости.
calculateBlockHealth: function() {
    if (window.CombatSystem && typeof window.CombatSystem.calculateBlockHealth === 'function') {
        // HP считается от урона игрока; множитель устройства уже учтён в формуле
        return window.CombatSystem.calculateBlockHealth();
    }
    return 80;
},

createMovingBlock: function() {
     if (!window.gameState || !window.gameState.gameActive || this.isGamePaused) return;
     const gameArea = document.getElementById('gameArea');
     if (!gameArea) return;
     if (this.currentBlock?.parentNode === gameArea) gameArea.removeChild(this.currentBlock);
     
     // 🛡️ ЗАЩИТНЫЙ СБРОС: если планета только что сменилась (planetDamageDealt === 0),
     // но dailyBlocksDestroyed > 0 (осталось от предыдущей планеты или увеличилось последним блоком),
     // сбрасываем его. Это гарантирует, что первый блок на новой планете всегда имеет низкий HP.
     if (window.gameState.planetDamageDealt === 0 && window.gameState.dailyBlocksDestroyed > 0) {
         window.gameState.dailyBlocksDestroyed = 0;
         console.log('🛡️ [CORE] dailyBlocksDestroyed сброшен в createMovingBlock (новая планета)');
     }
     
     this.currentBlockHealth = this.calculateBlockHealth();
        const block = document.createElement('div');
        block.className = 'moving-block';
        const size = (window.innerWidth < 768 ? 80 : 60);
        block.style.width = size + 'px';
        block.style.height = size + 'px';
        block.style.bottom = '0px';
        block.dataset.maxHealth = this.currentBlockHealth;

        const theme = CFG.locations[window.gameState.currentLocation];
        const rareType = this.getRareBlockType();

        if (rareType) {
            const rb = CFG.rareBlocks[rareType];
            block.classList.add(rb.className);
            this.currentBlockHealth = Math.floor(this.currentBlockHealth * rb.healthMultiplier);
            block.innerHTML = `🌟 <div style="font-size:0.35em;margin-top:1px;line-height:1.1;">${rb.name}</div>`;
            this.announceRareBlock(rb.name);
        } else {
            const ci = Math.floor(Math.random() * theme.blockColors.length);
            block.style.background = `linear-gradient(135deg, ${theme.blockColors[ci]}, ${theme.blockColors[(ci + 1) % theme.blockColors.length]})`;
            block.style.boxShadow = `0 0 15px ${theme.blockColors[ci]}`;
            block.style.border = `2px solid ${theme.borderColor}`;
            block.textContent = this.currentBlockHealth;
        }

        // ✅ Флаг для предотвращения двойного срабатывания на мобильных
let lastTouchTime = 0;

block.addEventListener('touchstart', (e) => {
    e.preventDefault();
    lastTouchTime = Date.now();
    this.hitBlock(block, window.gameState.clickPower, false);
}, { passive: false });

block.addEventListener('click', () => {
    // Игнорируем click, если был недавний touchstart (мобильные браузеры эмулируют click после touch)
    if (Date.now() - lastTouchTime < 500) return;
    this.hitBlock(block, window.gameState.clickPower, false);
});
        
       gameArea.appendChild(block);
this.currentBlock = block;
// ✅ НОВОЕ: Запоминаем время спавна для метрики speed
block.dataset.spawnTime = Date.now();
this.animateBlock(block);
},

    getRareBlockType: function() {
        // 🆕 v11: Звёздный компас — +40% к шансу редких за уровень (кап 4 → ×2.6)
        const compassLvl = Number(window.gameState?.compassLevel) || 0;
        const rand = Math.random(), luck = this.getBonus('getLuckMultiplier', 1) * (1 + 0.4 * compassLvl);
        let cum = 0;
        for (const [key, b] of Object.entries(CFG.rareBlocks)) {
            cum += b.chance * luck;
            if (rand <= cum) return key;
        }
        return null;
    },

 announceRareBlock: function(name) {
    const el = document.createElement('div');
    el.className = 'rare-block-announce';
    el.textContent = `🌟 ${name} блок! 🌟`;
    document.body.appendChild(el);
    
    el.addEventListener('animationend', () => {
        if (el.parentNode) el.parentNode.removeChild(el);
    });
},

animateBlock: function(block) {
    if (!window.gameState || !window.gameState.gameActive || this.currentBlock !== block) return;

    let pos = parseFloat(block.style.bottom) || 0;
    let lastTime = performance.now();

    // 🆕 v11.1: «верх поля» = нижний край Прогресс-бара.
    // Раньше блоки прятались за HUD и жили до innerHeight — с Гравитацией + Bobo
    // они «зависали» за экраном и дожидались разрушения. Теперь блок исчезает
    // на уровне прогресс-бара, а зона гравитации — в видимой части поля.
    const pbEl = document.getElementById('progressText') ||
                 document.getElementById('progressContainer') ||
                 document.getElementById('header');
    const fieldTopY = pbEl ? Math.ceil(pbEl.getBoundingClientRect().bottom) : 96;
    const fieldBottom = window.innerHeight;
    // 🆕 v11.2: высота видимого поля + запас на высоту блока.
    // Блок засчитывается как упущенный, когда ПОЛНОСТЬЮ скрылся за прогресс-баром
    // (плюс его корпус), а не в момент касания линии — меньше ложных миссов.
    const fieldHeight = Math.max(120, fieldBottom - fieldTopY);
    const blockSize = block.offsetHeight || (window.innerWidth < 768 ? 80 : 60);
    const escapePos = Math.max(60, fieldHeight + blockSize);
    // Зона гравитации — только в видимой части поля (у верха), не за экраном
    // СТАЛО (8% экрана, мин 40px — зона тоньше):
    const zoneH = Math.max(40, Math.round(fieldHeight * 0.08));;
    const zoneStart = fieldHeight - zoneH;

    const move = (now) => {
        // 1. Блок уничтожен или игра остановлена → ПРЕРЫВАЕМ цикл навсегда (НЕ зомби!)
        if (!window.gameState?.gameActive || this.currentBlock !== block) {
            return;   // ← вместо requestAnimationFrame(move)
        }

        // 2. Пауза → ждём, но блок ещё актуален, сбрасываем таймер
        if (this.isGamePaused) {
            lastTime = performance.now();
            requestAnimationFrame(move);
            return;
        }

        // 3. Защита от NaN
        if (!now) now = performance.now();
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        const speed = this.getCurrentSpeed() || 0;
        // 🆕 v11.1: Гравитация — замедление в зоне чуть ниже прогресс-бара (−10%/ур., кап 3)
        const gLvl = Number(window.gameState?.gravityLevel) || 0;
        const effSpeed = (gLvl > 0 && pos > zoneStart)
            ? speed * Math.max(0.1, 1 - 0.10 * gLvl)
            : speed;
        pos += effSpeed * dt;
        block.style.bottom = pos + 'px';

        // 4. Блок достиг уровня прогресс-бара → штраф + новый блок
        if (pos > escapePos) {
            if (getFeat().applyUpgradePenalty) getFeat().applyUpgradePenalty();
            if (window.gameMetrics) window.gameMetrics.currentCritStreak = 0;

            const gs = window.gameState;
            if (gs) {
                const planet = gs.currentLocation || 'mercury';
                const planetDamage = gs.planetDamageDealt || 0;
                const targetAU = CFG.PROGRESSION_CONFIG?.[planet]?.targetAU ||
                                 CFG.astronomicalUnits?.[planet] || 0.38710;
                const targetDamage = targetAU * (CFG.AU_TO_DAMAGE || 149597870.691);
                const progressPercent = targetDamage > 0 ? (planetDamage / targetDamage) * 100 : 0;

                if (!gs.skipPenaltyState) {
                    gs.skipPenaltyState = {
                        activated: false, skipCount: 0, rollbackCount: 0,
                        activationDistance: 0, totalRolledBack: 0
                    };
                }
                const state = gs.skipPenaltyState;

                if (!state.activated && progressPercent >= 30) {
                    state.activated = true;
                    state.activationDistance = planetDamage;
                }

                if (state.activated) {
                    state.skipCount++;
                    if (state.skipCount >= 6) {
                        const MAX_ROLLBACKS = 10;
                        const MAX_ROLLBACK_PERCENT = 0.5;
                        if (state.rollbackCount < MAX_ROLLBACKS) {
                            const maxRollback = state.activationDistance * MAX_ROLLBACK_PERCENT;
                            const remainingRollback = maxRollback - state.totalRolledBack;
                            if (remainingRollback > 0) {
                                const rollbackPercent = 5 + Math.random() * 10;
                                let rollbackAmount = planetDamage * (rollbackPercent / 100);
                                rollbackAmount = Math.min(rollbackAmount, remainingRollback);
                                gs.planetDamageDealt = Math.max(0, planetDamage - rollbackAmount);
                                state.totalRolledBack += rollbackAmount;
                                state.rollbackCount++;
                                if (window.GAME_UI?.updateProgressBar) window.GAME_UI.updateProgressBar();
                                this.showRollbackCard(rollbackPercent, rollbackAmount, state.rollbackCount, MAX_ROLLBACKS);
                            }
                        }
                        state.skipCount = 0;
                    }
                }
            }

            if (window.gameState?.gameActive) {
                setTimeout(() => this.createMovingBlock(), 500);
            }
            return; // ← НЕ вызываем requestAnimationFrame — новый блок создаст свою цепочку
        }

        // 5. Продолжаем анимацию
        requestAnimationFrame(move);
    };

    requestAnimationFrame(move);
},


// ЧТО: Делегируем математику урона/критов/метрик в CombatSystem.applyHit()
// КУДА: game-core.js → GAME_CORE.hitBlock()
// ЗАЧЕМ: Убираем дублирование логики урона. CombatSystem теперь ЕДИНСТВЕННЫЙ источник 
//        метрик (урон, клики, криты). Визуальные эффекты (damage text, звуки, вибрация) 
//        остаются здесь — они часть UX, а не баланса.
/**
 * Обрабатывает удар по блоку
 * @param {HTMLElement} block - DOM-элемент блока
 * @param {number} damage - Базовый урон (до применения бонусов)
 * @param {boolean} isAuto - true для Bobo/автокликера 
*/
hitBlock: function(block, damage, isAuto = false) {
    if (!window.gameState || !window.gameState.gameActive || this.isGamePaused) return;
    
    // ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Блокировка ударов по блоку с HP <= 0
    if (this.currentBlockHealth <= 0) {
        console.warn('⚠️ [CORE] Block already destroyed (HP <= 0), ignoring hit');
        return;
    }
    
// ── UX: Вибрация и звук (специфично для Core, не переносим) ──
// ✅ НОВОЕ: Вибрация ВСЕГДА срабатывает при ударе (независимо от звука)
if (navigator.vibrate) navigator.vibrate(30); // Короткая вибрация 30мс
if (window.telegramHaptic) window.telegramHaptic.light();
this.playSound('clickSound');
    
    // ── UX: Визуальная анимация удара ──
    block.style.transform = 'translateX(-50%) scale(0.85)';
    setTimeout(() => { block.style.transform = 'translateX(-50%) scale(1)'; }, 100);
    
    // ── ДЕЛЕГИРОВАНИЕ: CombatSystem считает урон, криты, обновляет метрики ──
    let hitResult;
    if (window.CombatSystem && typeof window.CombatSystem.applyHit === 'function') {
        hitResult = window.CombatSystem.applyHit(damage, isAuto);
    } else {
        // Fallback, если CombatSystem не готов (защита от race condition)
        hitResult = { destroyed: false, damage: Math.round(damage), isCrit: false };
        this.currentBlockHealth -= hitResult.damage;
        window.gameState.totalDamageDealt += hitResult.damage;
    }
    
    // ── UX: Визуальные эффекты на основе результата ──
    this.createDamageText(hitResult.damage, block, hitResult.isCrit ? '#FFD700' : '#ff4444');
    UI.checkLocationUpgrade();
    
    // ✅ НОВОЕ: Отслеживание серии критов (critStreak)
    if (!window.gameMetrics) window.gameMetrics = {};
    if (hitResult.isCrit) {
        window.gameMetrics.currentCritStreak = (window.gameMetrics.currentCritStreak || 0) + 1;
        const planet = window.gameState?.currentLocation;
        if (planet && window.achievementsSystem?.updatePlanetCritStreak) {
            window.achievementsSystem.updatePlanetCritStreak(planet, window.gameMetrics.currentCritStreak);
        }
    } else {
        window.gameMetrics.currentCritStreak = 0;
    }
    
    // ── Логика: разрушение или обновление блока ──
     if (hitResult.destroyed || this.currentBlockHealth <= 0) {
        console.log('💥 [CORE] Block destroyed! HP:', this.currentBlockHealth, 'isAuto:', isAuto);
        this.destroyBlock(block, isAuto);
    } else {
        // ✅ ИСПРАВЛЕНИЕ: Показываем минимум 0, а не отрицательное число
        block.textContent = Math.max(0, Math.floor(this.currentBlockHealth));
        this.updateCracks(block, this.currentBlockHealth);
    }
},

// ЧТО: Делегируем математику наград/комбо/метрик в CombatSystem.applyDestroy()
// КУДА: game-core.js → GAME_CORE.destroyBlock()
// ЗАЧЕМ: Убираем дублирование формул наград. CombatSystem теперь ЕДИНСТВЕННЫЙ источник 
//        расчёта монет и обновлений ачивок. UI-эффекты (взрыв, тексты, звуки) остаются здесь.
/**
 * Обрабатывает разрушение блока
 * @param {HTMLElement} block - DOM-элемент блока
 */
destroyBlock: function(block, isAuto = false) {
    if (!window.gameState) return;

    // ── ДЕЛЕГИРОВАНИЕ: CombatSystem — ЕДИНСТВЕННЫЙ источник награды, монет и метрик ──
    if (!window.CombatSystem || typeof window.CombatSystem.applyDestroy !== 'function') {
        console.error('❌ [CORE] CombatSystem.applyDestroy недоступен — награда не начислена');
        // не даём игре зависнуть: убираем блок и спавним новый
        const ga0 = document.getElementById('gameArea');
        if (ga0?.contains(block)) ga0.removeChild(block);
        this.currentBlock = null;
        this.currentBlockHealth = 0;
        setTimeout(() => { if (window.gameState?.gameActive) this.createMovingBlock(); }, 500);
        return;
    }
    const destroyResult = window.CombatSystem.applyDestroy(block, isAuto);
    if (!destroyResult) return;

    // ── UX: Комбо-текст (только если было комбо > 1) ──
    if (destroyResult.comboCount > 1 && destroyResult.comboBonus > 0) {
        this.showComboText(destroyResult.comboCount, destroyResult.comboBonus, block);
        this.playSound('comboSound');
    }
    
  // ── UX: Обновление интерфейса ──
UI.updateHUD();
UI.updateUpgradeButtons();
this.playSound('breakSound');

    this.showRewardText(destroyResult.reward || 0, block);
    // ✅ БЕЗОПАСНЫЙ ВЫЗОВ: предотвращает TypeError
    if (getFeat().createExplosion) getFeat().createExplosion(block);
    
    // ─ Очистка блока из DOM ──
    const ga = document.getElementById('gameArea');
    if (ga?.contains(block)) ga.removeChild(block);
    this.currentBlock = null;
    this.currentBlockHealth = 0;
    
    // ── Спавн нового блока ──
    setTimeout(() => { if (window.gameState?.gameActive) this.createMovingBlock(); }, 500);
},

    createDamageText: function(dmg, block, col) {
    const r = block.getBoundingClientRect();
    const t = document.createElement('div');
    t.className = 'damage-text';
    t.textContent = `-${window.formatNumber ? window.formatNumber(dmg) : dmg}`;
    t.style.color = col;
    
    let l = r.left + r.width / 2;
    let tp = r.top;
    
    if (l < 50) l = 50;
    if (l > window.innerWidth - 50) l = window.innerWidth - 50;
    if (tp < 50) tp = 50;
    
    t.style.left = l + 'px';
    t.style.top = tp + 'px';
    
    document.body.appendChild(t);
    
    t.addEventListener('animationend', () => {
        if (t.parentNode) t.parentNode.removeChild(t);
    });
},

    showComboText: function(c, b, block) {
    const r = block.getBoundingClientRect();
    const t = document.createElement('div');
    t.className = 'combo-text';
    const fmtBonus = window.formatNumber ? window.formatNumber(b) : b;
const comboKey = window.translations?.[window.currentLanguage]?.tooltips?.combo;
t.textContent = (comboKey && window.formatString)
    ? window.formatString(comboKey, { count: c, bonus: fmtBonus })
    : `COMBO x${c}! +${fmtBonus}`;
    
    let l = r.left + r.width / 2;
    let tp = r.top;
    
    if (l < 75) l = 75;
    if (l > window.innerWidth - 75) l = window.innerWidth - 75;
    if (tp < 50) tp = 50;
    
    t.style.left = l + 'px';
    t.style.top = tp + 'px';
    
    document.body.appendChild(t);
    
    t.addEventListener('animationend', () => {
        if (t.parentNode) t.parentNode.removeChild(t);
    });
},

showRewardText: function(r, block) {
    const rct = block.getBoundingClientRect();
    const t = document.createElement('div');
    t.className = 'reward-text';
    const fmtReward = window.formatNumber ? window.formatNumber(r) : r;
const rewardKey = window.translations?.[window.currentLanguage]?.tooltips?.reward;
t.textContent = (rewardKey && window.formatString)
    ? window.formatString(rewardKey, { reward: fmtReward })
    : `+${fmtReward} 💎`;
    
    let l = rct.left + rct.width / 2;
    let tp = rct.top + rct.height / 2;
    
    if (l < 60) l = 60;
    if (l > window.innerWidth - 60) l = window.innerWidth - 60;
    if (tp < 50) tp = 50;
    
    t.style.left = l + 'px';
    t.style.top = tp + 'px';
    
    document.body.appendChild(t);
    
    t.addEventListener('animationend', () => {
        if (t.parentNode) t.parentNode.removeChild(t);
    });
},

// ✅ НОВОЕ: Визуальная карточка отката за пропуски
showRollbackCard: function(percent, amount, currentRollback, maxRollbacks) {
    const card = document.createElement('div');
    
    const damageInAU = amount / (CFG.AU_TO_DAMAGE || 149597870.691);
    const auText = damageInAU >= 0.001 
        ? damageInAU.toFixed(3) + ' а.е.' 
        : Math.floor(amount).toLocaleString() + ' урона';
    
    card.style.cssText = `
        position: fixed;
        top: 25%;
        left: 50%;
        transform: translateX(-50%) scale(0.8);
        background: linear-gradient(135deg, rgba(244, 67, 54, 0.95), rgba(183, 28, 28, 0.95));
        color: #fff;
        padding: 20px 30px;
        border-radius: 15px;
        z-index: 10001;
        text-align: center;
        font-family: 'Orbitron', sans-serif;
        font-weight: bold;
        box-shadow: 0 10px 40px rgba(244, 67, 54, 0.8), 0 0 60px rgba(244, 67, 54, 0.4);
        border: 3px solid #fff;
        max-width: 350px;
        width: 90%;
        pointer-events: none;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;
    
    card.innerHTML = `
        <div style="font-size: 3em; margin-bottom: 8px; filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));">📉</div>
        <div style="font-size: 1.4em; margin-bottom: 8px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">ОТКАТ НАЗАД!</div>
        <div style="font-size: 0.9em; margin-bottom: 12px; opacity: 0.95;">Пропущено слишком много блоков</div>
        <div style="font-size: 1.3em; color: #ffeb3b; margin-bottom: 6px;">-${percent.toFixed(1)}%</div>
        <div style="font-size: 0.85em; opacity: 0.9;">Потеряно: ${auText}</div>
        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 0.75em; opacity: 0.85;">
            Откат ${currentRollback} из ${maxRollbacks}
        </div>
    `;
    
    document.body.appendChild(card);
    
    // Анимация появления
    requestAnimationFrame(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateX(-50%) scale(1)';
    });
    
    // Анимация исчезновения
    setTimeout(() => {
        card.style.transition = 'all 0.5s ease-in';
        card.style.opacity = '0';
        card.style.transform = 'translateX(-50%) scale(0.8) translateY(-30px)';
        setTimeout(() => {
            if (card.parentNode) card.parentNode.removeChild(card);
        }, 500);
    }, 2500);
    
    // Тактильный и звуковой фидбек
    if (this.playSound) this.playSound('penaltySound');
    if (window.telegramHaptic?.error) {
        window.telegramHaptic.error();
    } else if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
    }
},

    updateCracks: function(block, health) {
        if (!block) return;
        const ex = block.querySelector('.crack-overlay');
        if (ex) block.removeChild(ex);
        const max = parseInt(block.dataset.maxHealth), rat = 1 - (health / max);
        if (rat > 0.7) block.appendChild(Object.assign(document.createElement('div'), { className: 'crack-overlay crack-3' }));
        else if (rat > 0.4) block.appendChild(Object.assign(document.createElement('div'), { className: 'crack-overlay crack-2' }));
        else if (rat > 0.1) block.appendChild(Object.assign(document.createElement('div'), { className: 'crack-overlay crack-1' }));
    },

    createHelperElement: function() {
        if (this.helperElement?.parentNode) document.body.removeChild(this.helperElement);
        this.helperElement = document.createElement('div');
        this.helperElement.className = 'helper';
        document.body.appendChild(this.helperElement);
        this.moveHelperToRandomPosition();
        this.helperElement.style.opacity = '0';
        setTimeout(() => { if (this.helperElement) this.helperElement.style.opacity = '1'; }, 100);
        
        // ✅ НОВОЕ: Метрика bobo (активация помощника)
        const planet = window.gameState?.currentLocation;
        if (planet && window.achievementsSystem?.incrementPlanetBobo) {
            window.achievementsSystem.incrementPlanetBobo(planet);
        }
    },

    moveHelperToRandomPosition: function() {
        if (!this.helperElement) return;
        let t = { left: window.innerWidth / 2, top: window.innerHeight / 2 };
        if (this.currentBlock) t = this.currentBlock.getBoundingClientRect();
        for (let i = 0; i < 20; i++) {
            const rx = Math.random() * (window.innerWidth - 60) + 30,
                  ry = Math.random() * (window.innerHeight - 120) + 60;
            const dist = Math.sqrt(Math.pow(rx - (t.left + t.width / 2), 2) + Math.pow(ry - (t.top + t.height / 2), 2));
            if (dist > 150 && rx > 60 && rx < window.innerWidth - 60 && ry > 100 && ry < window.innerHeight - 60) {
                this.helperPosition = { x: rx, y: ry };
                break;
            }
        }
        this.helperElement.style.left = this.helperPosition.x + 'px';
        this.helperElement.style.top = this.helperPosition.y + 'px';
    },

initEffectCanvas: function() {
    if (!this.effectCanvas) {
        this.effectCanvas = document.createElement('canvas');
        this.effectCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100;';
        document.body.appendChild(this.effectCanvas);
        
        const resize = () => {
            this.effectCanvas.width = window.innerWidth;
            this.effectCanvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);
    }
},

  createHelperEffect: function() {
    if (!this.currentBlock || !this.helperElement) return;
    
    // Инициализируем глобальный canvas, если ещё не создан
    this.initEffectCanvas();
    
    const br = this.currentBlock.getBoundingClientRect();
    const hr = this.helperElement.getBoundingClientRect();
    
    const sx = hr.left + hr.width / 2;
    const sy = hr.top + hr.height / 2;
    const ex = br.left + br.width / 2;
    const ey = br.top + br.height / 2;
    
    const cv = this.effectCanvas;
    const ctx = cv.getContext('2d');
    
    let st = Date.now();
    const an = () => {
        const el = Date.now() - st;
        const p = Math.min(el / 300, 1);
        
        ctx.clearRect(0, 0, cv.width, cv.height);
        
        if (p > 0) {
            const cx = sx + (ex - sx) * p;
            const cy = sy + (ey - sy) * p;
            
            const g = ctx.createLinearGradient(sx, sy, cx, cy);
            g.addColorStop(0, 'rgba(105, 240, 174, 0.9)');
            g.addColorStop(0.7, 'rgba(105, 240, 174, 0.5)');
            g.addColorStop(1, 'rgba(105, 240, 174, 0)');
            
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(cx, cy);
            ctx.lineWidth = 4 + (4 * (1 - p));
            ctx.strokeStyle = g;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(cx, cy, 8 * (1 - p), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(105, 240, 174, ${0.7 * (1 - p)})`;
            ctx.fill();
        }
        
        if (p < 1) {
            requestAnimationFrame(an);
        } else {
            ctx.clearRect(0, 0, cv.width, cv.height);
        }
    };
    
    an();
    this.playSound('helperSound');
},

// ЧТО: Делегируем математику авто-атаки Bobo в CombatSystem.applyHit()
// КУДА: game-core.js → GAME_CORE.helperAttack()
// ЗАЧЕМ: Bobo теперь использует ту же формулу урона, что и ручной клик. 
//        Флаг isAuto=true предотвращает начисление кликов/комбо за авто-атаку.
helperAttack: function() {
    if (!this.currentBlock || !window.gameState || !window.gameState.helperActive || !this.helperElement || this.isGamePaused) return;
    
    // ── UX: Визуальный эффект лазера Bobo ──
    this.createHelperEffect();
    
    // ── Расчёт базового урона Bobo (его собственная формула) ──
    const baseDmg = window.gameState.clickPower 
        * (1 + (window.gameState.helperDamageBonus || 0)) 
        * (1 + (window.gameState.helperUpgradeLevel || 0) * 0.2);
    
    // ── ДЕЛЕГИРОВАНИЕ: CombatSystem применяет урон как авто-атаку ──
    let hitResult;
    if (window.CombatSystem && typeof window.CombatSystem.applyHit === 'function') {
        hitResult = window.CombatSystem.applyHit(baseDmg, true); // isAuto = true
    } else {
        // Fallback
        hitResult = { destroyed: false, damage: Math.round(baseDmg), isCrit: false };
        this.currentBlockHealth -= hitResult.damage;
        window.gameState.totalDamageDealt += hitResult.damage;
    }

 // ── UX: Визуальные эффекты (зелёный цвет для Bobo) ──
this.createDamageText(hitResult.damage, this.currentBlock, '#69f0ae');
UI.checkLocationUpgrade();

// ✅ НОВОЕ: Метрика boboDmg (урон нанесённый Bobo на планете)
const planet = window.gameState?.currentLocation;
if (planet && window.achievementsSystem?.incrementPlanetBoboDamage) {
    window.achievementsSystem.incrementPlanetBoboDamage(planet, hitResult.damage || 0);
}
    
    // ── Логика: разрушение или обновление блока ──
    if (hitResult.destroyed) {
        this.destroyBlock(this.currentBlock, true); // ✅ Передаём isAuto=true
    } else {
        this.currentBlock.textContent = Math.floor(this.currentBlockHealth);
        this.updateCracks(this.currentBlock, this.currentBlockHealth);
    }
},

// ═══════════════════════════════════════════════════
// 🔄 ОБЩИЙ СБРОС СОСТОЯНИЯ ПЛАНЕТЫ (Врата + Телепорт)
// Вынесено из doTeleport, чтобы ЛЮБОЙ переход — кнопка,
// developer-режим, консоль — гарантированно сбрасывал прокачку.
// ═══════════════════════════════════════════════════
resetPlanetState: function(gs, endedPlanet, freezeAchievements) {
// 1. Прогресс планеты + HP-рампа
gs.planetDamageDealt = 0;
gs.planetFirstBlockCleared = false;
gs.dailyBlocksDestroyed = 0;
gs.skipPenaltyState = null;
gs.comboCount = 0;
gs.lastDestroyTime = 0;
     // 2. Апгрейды (клик/крит/Bobo) — ВОТ ЧТО ПРОПАДАЛО ПРИ ВРАТАХ
   gs.clickUpgradeLevel = 0;
    gs.critChanceUpgradeLevel = 0;
    gs.critMultiplierUpgradeLevel = 0;
    gs.helperUpgradeLevel = 0;
    gs.helperActivations = 0;
    // 🆕 v11: новые апгрейды — планетарные (сброс как у остальных при Вратах)
    gs.helperSpeedLevel = 0;
    gs.resonanceLevel = 0;
    gs.gravityLevel = 0;
    gs.anchorLevel = 0;
    gs.compassLevel = 0;
    gs.helperDamageBonus = 0;
    gs.boboCoinBonus = 0;
    gs.critChance = 0.001;
    gs.critMultiplier = 2.0;
    gs.clickPower = this.calculateClickPower();
// 3. ❄️ ВРАТА: метрики старой планеты ЗАМОРАЖИВАЕМ (не сбрасываем!)
if (freezeAchievements && endedPlanet && gs.achievementsV2 && gs.achievementsV2[endedPlanet]) {
    gs.achievementsV2[endedPlanet].frozen = true;
    console.log(`   ❄️ achievementsV2.${endedPlanet} заморожен (разблокировано: ${gs.achievementsV2[endedPlanet].totalUnlocked})`);
}
// ✅ СЛОЙ B: сброс трекинга стиля и флага «кольца» на новом проходе
gs._styleTotalDmg = 0; gs._styleBoboDmg = 0; gs._styleCrits = 0; gs._ringBlock = false;
if (window.gameMetrics) window.gameMetrics.currentCritStreak = 0;
},

    setLocation: function(loc) {
        if (!window.gameState) return;
        if (CFG.planetOrder.indexOf(loc) < CFG.planetOrder.indexOf(window.gameState.currentLocation)) return;
        
        const oldPlanet = window.gameState.currentLocation;
        const isNewPlanet = oldPlanet !== loc;
            
        // ✅ НОВОЕ (BoC): Защита врат — переход без оплаты BoC запрещён
   if (isNewPlanet) {
      const Econ = window.GameEconomy;
      const run = window.gameState.runNumber || 1;
      // ✅ v3: цена врат растёт с раном (ранние ×(1+floor(r/2)), после Сатурна — фикс)
      const gate = (typeof Econ?.gateForRun === 'function')
          ? Econ.gateForRun(loc, run)
          : (Econ?.gateFor(loc) || 0);
         // ✅ Врата уже открыты (локация разлочена) — повторная оплата при возврате НЕ взимается
         const alreadyUnlocked = (window.gameState.unlockedLocations || []).indexOf(loc) !== -1;
         if (gate > 0 && !alreadyUnlocked) {
                let paid = false;
                if (Econ?.payGate) {
                    const result = Econ.payGate(gate);
                    paid = !!(result === true || (result && result.success));
                } else if ((window.gameState.bocLiquid || 0) >= gate) {
                    window.gameState.bocLiquid -= gate;
                    paid = true;
                }
                if (!paid) {
                    console.warn(`🚪 [BOC] Врата ${loc}: нужно ${gate} BoC, есть ${Math.floor(window.gameState.bocLiquid || 0)}`);
                    if (window.PlanetComplete?.show && window.gameState._planetCompleteShown !== oldPlanet) {
                        window.PlanetComplete.show();
                    }
                    return;
                }
            }
        }
        
             // ✅ Запоминаем открытые Врата: оплаченная локация попадает в unlockedLocations
     if (isNewPlanet && (window.gameState.unlockedLocations || (window.gameState.unlockedLocations = ['mercury'])).indexOf(loc) === -1) {
         window.gameState.unlockedLocations.push(loc);
     }
     window.gameState.currentLocation = loc;
        
        // ✅ Сброс серии критов при смене планеты
        if (window.gameMetrics) {
            window.gameMetrics.currentCritStreak = 0;
        }
        
if (isNewPlanet) {
    // ✅ ЛЕЧЕБНАЯ АРХИТЕКТУРА: единый сброс (прогресс + HP-рампа + АПГРЕЙДЫ + ачивки)
            
// ❄️ + заморозка ачивок старой планеты для просмотра ←/→
this.resetPlanetState(window.gameState, oldPlanet, true);
// Множитель телепорта не переносится на новую планету; стек локации чистый
window.gameState.teleportMult = 1;
window.gameState._tpStacks = window.gameState._tpStacks || {};
window.gameState._tpStacks[loc] = [];
    window.gameState.planetTeleports = 0;
    window.gameState._planetCompleteShown = null;
     console.log(`🔄 [CORE] ${oldPlanet} → ${loc}: прогресс, HP-рампа, апгрейды и метрики сброшены`);
            
            if (window.gameState._isLocationChange) {
                window.gameState._isLocationChange = false;
            }
            
        // Инициализируем новую планету ИЛИ размораживаем пройденную
        if (!window.gameState.achievementsV2[loc]) {
            window.gameState.achievementsV2[loc] = {
                rank: 0,
                totalUnlocked: 0,
                metrics: {},
                masterUnlocked: false
            };
            console.log(`   ✓ achievementsV2.${loc} инициализирован`);
        } else if (window.gameState.achievementsV2[loc].frozen) {
            // 🔥 Возврат на пройденную (телепорт назад / новый РАН): счёт продолжается
            window.gameState.achievementsV2[loc].frozen = false;
            console.log(`   🔥 achievementsV2.${loc} разморожен — метрики продолжаются`);
        }
            
            // Обновляем UI
            if (window.GAME_UI?.updateProgressBar) window.GAME_UI.updateProgressBar();
            if (window.AchievementsV2?.UI?.updateAchievementsButton) {
                window.AchievementsV2.UI.updateAchievementsButton();
            }
            
            // Сохраняем
            if (typeof window.saveGame === 'function') window.saveGame();
        } // ← закрывает if (isNewPlanet)

        // ❗❗❗ ВСЁ ЧТО НИЖЕ — ВНУТРИ setLocation (НЕ ЗАКРЫВАЕМ ЕЁ РАНЬШЕ ВРЕМЕНИ!)
        const gameTitle = document.getElementById('gameTitle');
        const header = document.getElementById('header');
        if (gameTitle && window.applyTranslation) window.applyTranslation(gameTitle, `gameTitle.${loc}`);
        if (header) header.style.borderColor = CFG.locations[loc].borderColor;
        if (window.planetBackground?.setPlanet) window.planetBackground.setPlanet(loc);
        
        const ann = document.getElementById('levelAnnounce');
        if (ann) {
            ann.textContent = CFG.locations[loc].name;
            ann.style.color = CFG.locations[loc].color;
            ann.style.opacity = "1";
            setTimeout(() => { ann.style.opacity = "0"; }, 2000);
        }
        
        if (window.achievementsSystem) window.achievementsSystem.updatePlanetProgress(loc);
        if (window.EventBus) {
            window.EventBus.emit('game:planetChanged', loc);
        }
        UI.updateProgressBar();
    }, // ← закрывает setLocation (обязательно с запятой!)

    startGame: function(reset = true) {
        console.log('🚀 Start, reset =', reset);
     if (reset) {
         if (typeof window.resetGame === 'function') window.resetGame();
     } else {
         window.gameState.clickPower = this.calculateClickPower();
     }
     isolateAchievementsV2(window.gameState);

        this.isGamePaused = false;
        if (window.gameState) window.gameState.gamePaused = false;
        window.gameState.helperActive = false;
        window.gameState.helperTimeLeft = 0;
        window.gameState.boboCoinBonus = 0;

        if (this.helperInterval) { clearInterval(this.helperInterval); this.helperInterval = null; }
        if (this.helperTimer) { clearInterval(this.helperTimer); this.helperTimer = null; }
        if (this.helperElement?.parentNode) document.body.removeChild(this.helperElement);
        this.helperElement = null;
        if (this.autoClickInterval) { clearInterval(this.autoClickInterval); this.autoClickInterval = null; }
        if (this.magnetInterval) { clearInterval(this.magnetInterval); this.magnetInterval = null; }

        const ga = document.getElementById('gameArea');
        if (ga) ga.innerHTML = "";
        const ws = document.getElementById('welcomeScreen'),
              gs = document.getElementById('gameOverScreen');
        if (ws) ws.style.display = "none";
        if (gs) gs.style.display = "none";

        window.gameState.gameActive = true;
        window.gameState.comboCount = 0;
        window.gameState.lastDestroyTime = 0;

        if (reset) {
            window.gameMetrics.startTime = Date.now();
            window.gameMetrics.blocksDestroyed = 0;
            window.gameMetrics.upgradesBought = 0;
            window.gameMetrics.totalClicks = 0;
            window.gameMetrics.totalCrits = 0;
            window.gameMetrics.totalCoinsEarned = 0;
            window.gameMetrics.helpersBought = 0;
            window.gameMetrics.boostersUsed = 0;
            window.gameMetrics.maxCombo = 0;
        } else {
            window.gameMetrics.startTime = Date.now();
        }

        UI.updateHUD();
        UI.updateUpgradeButtons();
UI.updateProgressBar();
this.setLocation(window.gameState.currentLocation);
if (window.shopSystem?.updateShopDisplay) window.shopSystem.updateShopDisplay();
if (window.achievementsSystem?.updateAchievementsDisplay) window.achievementsSystem.updateAchievementsDisplay();

// ✅ НОВОЕ: Таймер времени на планете (каждые 10 секунд)
if (this._planetTimeInterval) clearInterval(this._planetTimeInterval);
this._planetTimeInterval = setInterval(() => {
    const planet = window.gameState?.currentLocation;
    if (planet && window.achievementsSystem?.updatePlanetTime) {
        window.achievementsSystem.updatePlanetTime(planet, 10);
    }
}, 10000);

setTimeout(() => this.createMovingBlock(), 500);
},

    /**
     * ✅ ИСПРАВЛЕНО: continueGame теперь работает ТОЛЬКО с облаком
     * - Убран вызов window.loadGame() (он больше не нужен)
     * - cloudInit сам загружает данные из облака
     * - gameState инициализируется дефолтными значениями до cloudInit
     */
    continueGame: async function() {
        console.log('🔄 [GAME] Starting continueGame...');

        // ✅ Инициализируем gameState дефолтными значениями
        // (на случай, если облако пустое — игра начнётся с нуля)
        if (!window.gameState || Object.keys(window.gameState).length === 0) {
         window.gameState = {
             coins: 0,
             clickPower: 1,
             critChance: 0.001,
             critMultiplier: 2.0,
             currentLocation: 'mercury',
             totalDamageDealt: 0,
         planetDamageDealt: 0,  // ✅ НОВОЕ: Урон на текущей планете
             clickUpgradeLevel: 0,
             critChanceUpgradeLevel: 0,
             critMultiplierUpgradeLevel: 0,
             helperUpgradeLevel: 0,
             helperActivations: 0,
             helperActive: false,
             helperTimeLeft: 0,
             helperDamageBonus: 0,
             boboCoinBonus: 0,
             comboCount: 0,
             lastDestroyTime: 0,
             gameActive: false,
             gamePaused: false,
             achievements: {},
             shopItems: {},
             permanentBonuses: {},
             unlockedLocations: ['mercury'],
             boboSkin: 'default',
             dailyBonus: {
                 lastClaimDate: null,
                 currentDay: 1,
                 totalClaimed: 0,
                 streak: 0
             },
             // ✅ НОВОЕ: Система достижений v2
             achievementsV2: {
                 mercury: { rank: 0, totalUnlocked: 0, metrics: {}, masterUnlocked: false }
             }
         };
            console.log('🔄 [GAME] gameState инициализирован дефолтными значениями');
        }

        if (!window.gameMetrics || Object.keys(window.gameMetrics).length === 0) {
            window.gameMetrics = {
                startTime: 0,
                blocksDestroyed: 0,
                upgradesBought: 0,
                totalClicks: 0,
                totalCrits: 0,
                totalCoinsEarned: 0,
                helpersBought: 0,
                boostersUsed: 0,
                maxCombo: 0,
                rareBlocksDestroyed: 0,
                sessions: 0
            };
        }

        // ✅ Загружаем из облака (асинхронно)
        // cloudInit сам вызывает loadGame() внутри себя
        if (typeof window.cloudInit === 'function') {
            console.log('☁️ [GAME] cloudInit вызывается...');
            try {
                await window.cloudInit();
                console.log('☁️ [GAME] cloudInit завершён');
            } catch (e) {
                console.error('☁️ [GAME] cloudInit error:', e);
            }
     } else {
         console.warn('⚠️ [GAME] cloudInit function NOT found');
     }
     isolateAchievementsV2(window.gameState); // ✅ после облака — ссылки разорваны
     // ✅ Запускаем игру с загруженными данными
        console.log('✅ [GAME] Load successful, starting game...');
        console.log('💾 [GAME] gameState.coins:', window.gameState.coins);
        console.log('💾 [GAME] gameState.currentLocation:', window.gameState.currentLocation);

        UI.updateHUD();
        UI.updateUpgradeButtons();
        UI.updateProgressBar();
        this.setLocation(window.gameState.currentLocation);
        this.startGame(false);

        if (window.showTooltip && window.formatString) {
            const t = window.formatString('Игра загружена! Кристаллы: {coins}', {
                coins: Math.floor(window.gameState.coins || 0).toLocaleString()
            });
            window.showTooltip(t);
            setTimeout(window.hideTooltip, 3000);
        }
    },

    restartGame: function() {
        this.startGame(true);
    },

 // ✅ НОВОЕ: список локаций для фарм-телепорта (только НАЗАД, включая текущую)
 getFarmDestinations: function() {
     const gs = window.gameState;
     if (!gs) return [];
     const order = CFG.planetOrder || [];
     const currentIdx = order.indexOf(gs.currentLocation);
     return order.slice(0, currentIdx + 1).map(id => ({
         id: id,
         name: CFG.locations[id]?.name || id,
         emoji: CFG.locations[id]?.emoji || '🪐',
         color: CFG.locations[id]?.color || '#fff',
         isCurrent: id === gs.currentLocation
     }));
 },

    // ✅ НОВОЕ (BoC): ТЕЛЕПОРТ — повторный проход той же планеты с множителем дохода
    // Сброс: planetDamageDealt + метрики планеты + апгрейды (клик/крит/Bobo) + ачивки планеты.
    // Сохраняются: bocEarned (престиж) + кристаллы + bocLiquid + teleportMult.
    // Множитель 1.5–5.0 (шаг 0.25), новый ЗАМЕНЯЕТ старый (не стакается).
    doTeleport: function(previewMult, targetPlanet) {
     if (!window.gameState) return;
     const gs = window.gameState;

     // ✅ НОВОЕ: фарм-телепорт с выбором точки — прыжок НАЗАД на пройденную локацию
     // (Врата туда уже открыты, оплата не нужна)
     const order = CFG.planetOrder || [];
     let planet = gs.currentLocation;
     if (targetPlanet && order.indexOf(targetPlanet) !== -1 &&
         order.indexOf(targetPlanet) <= order.indexOf(planet)) {
         planet = targetPlanet;
         gs.currentLocation = planet;
         // 🔥 Фарм-прыжок на пройденную планету: размораживаем её метрики
         if (gs.achievementsV2?.[planet]?.frozen) {
             gs.achievementsV2[planet].frozen = false;
             console.log(`🔥 [TELEPORT] achievementsV2.${planet} разморожен — фарм продолжает метрики`);
         }
         if (window.planetBackground?.setPlanet) window.planetBackground.setPlanet(planet);
         if (window.GAME_UI?.updateProgressBar) window.GAME_UI.updateProgressBar();
         if (window.achievementsSystem) window.achievementsSystem.updatePlanetProgress(planet);
         console.log(`🎯 [TELEPORT] выбрана точка фарма: ${planet}`);
     }

        // 1. Множитель (переданный из экрана или дефолт)
        let mult = previewMult;
        if (!mult) {
            const TP = window.GameEconomy?.CFG?.teleport || { min: 1.5, max: 5.0, step: 0.25 };
            const steps = Math.round((TP.max - TP.min) / TP.step);
            mult = TP.min + Math.floor(Math.random() * (steps + 1)) * TP.step;
        }
  
// ✅ 2–3. Единый сброс: прогресс + HP-рампа + апгрейды
// (ачивки НЕ трогаем: freezeAchievements = false, это та же локация)
this.resetPlanetState(gs, planet, false);
// ✅ НОВОЕ: множители телепортов СУММИРУЮТСЯ в пределах локации (FIFO, ≤5 стаков на локацию за РАН)
// 🆕 v11: Квантовый якорь — +1 слот стека и +5 к капу за уровень (кап 5 → 10 слотов / кап 45)
const anchorLvl = Number(gs.anchorLevel) || 0;
const stackLimit = 5 + anchorLvl;
const multCap = 20 + 5 * anchorLvl;
gs._tpStacks = gs._tpStacks || {};
const stackArr = (gs._tpStacks[planet] = gs._tpStacks[planet] || []);
stackArr.push(mult);
if (stackArr.length > stackLimit) stackArr.shift();
gs.teleportMult = Number(Math.min(multCap, stackArr.reduce((s, x) => s + x, 0)).toFixed(2));
gs.planetTeleports = (gs.planetTeleports || 0) + 1;
gs._farmRunsOnPlanet = (gs._farmRunsOnPlanet || 0) + 1; // 🏭 истощение жилы: кэшбэк ×0.6 за фарм-проход

        // 5. Очистка блоков / Bobo / таймеров
        this.currentBlock = null;
        this.currentBlockHealth = 0;
        if (this.helperInterval) { clearInterval(this.helperInterval); this.helperInterval = null; }
        if (this.helperTimer) { clearInterval(this.helperTimer); this.helperTimer = null; }
        if (this.helperElement?.parentNode) document.body.removeChild(this.helperElement);
        this.helperElement = null;
        if (this.autoClickInterval) { clearInterval(this.autoClickInterval); this.autoClickInterval = null; }
        if (this.magnetInterval) { clearInterval(this.magnetInterval); this.magnetInterval = null; }
        const ga = document.getElementById('gameArea');
        if (ga) ga.innerHTML = "";

        // 6. Перезапуск той же планеты БЕЗ полного сброса (reset=false!)
        gs._planetCompleteShown = null;
        this.startGame(false);

        // 7. Сохранение
        if (typeof window.saveGame === 'function') window.saveGame();
        console.log(
            `⚡ [TELEPORT] ${planet}: ×${mult.toFixed(2)}`
            + ` · телепортов: ${gs.planetTeleports}`
        );

        return { mult };
    },

    initEventHandlers: function() {
        const langBtn = document.getElementById('langBtn-welcome');
        if (langBtn) {
            langBtn.addEventListener('click', window.switchLanguage);
            langBtn.addEventListener('touchstart', e => { e.preventDefault(); window.switchLanguage(); }, { passive: false });
        }

        // ✅ БЕЗОПАСНАЯ КНОПКА "НОВАЯ ИГРА" (Долгое нажатие 5 секунд)
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            let holdTimer = null;
            let animationFrame = null;
            let holdStartTime = 0;
            const HOLD_DURATION = 5000; // 5 секунд
            const originalText = startBtn.innerText || startBtn.textContent;
            const originalBg = startBtn.style.backgroundColor || '';

            const startHold = (e) => {
                if (e.type === 'touchstart') e.preventDefault();
                holdStartTime = Date.now();
                startBtn.classList.add('holding-reset');
                if (window.telegramHaptic) window.telegramHaptic.light();

                holdTimer = setTimeout(() => {
                    startBtn.innerText = 'Сброс...';
                    if (window.telegramHaptic) window.telegramHaptic.heavy();
                    
                    // Выполняем сброс игры
                    const ws = document.getElementById('welcomeScreen');
                    if (ws) ws.style.display = "none";
                    this.startGame(true);
                    
                    cancelHold(); // Очищаем таймеры после успешного сброса
                }, HOLD_DURATION);

                updateCountdown();
            };

            const cancelHold = () => {
                if (holdTimer) {
                    clearTimeout(holdTimer);
                    holdTimer = null;
                }
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                }
                startBtn.classList.remove('holding-reset');
                startBtn.innerText = originalText;
                startBtn.style.backgroundColor = originalBg;
            };

            const updateCountdown = () => {
                if (!holdTimer) return;
                const elapsed = Date.now() - holdStartTime;
                const remaining = Math.ceil((HOLD_DURATION - elapsed) / 1000);
                
                if (remaining > 0 && remaining <= 5) {
                    startBtn.innerText = `Уверены? Держите ${remaining}с...`;
                    // Вибрация на последних 3-х секундах для тактильного отсчета
                    if (remaining <= 3 && window.telegramHaptic) {
                        window.telegramHaptic.medium();
                    }
                }
                
                if (holdTimer) {
                    animationFrame = requestAnimationFrame(updateCountdown);
                }
            };

            // Привязываем события для мыши и тач-экранов
            startBtn.addEventListener('mousedown', startHold);
            startBtn.addEventListener('touchstart', startHold, { passive: false });
            startBtn.addEventListener('mouseup', cancelHold);
            startBtn.addEventListener('mouseleave', cancelHold);
            startBtn.addEventListener('touchend', cancelHold);
            startBtn.addEventListener('touchcancel', cancelHold);
        }

        const contBtn = document.getElementById('continueBtn');
        if (contBtn) {
            contBtn.addEventListener('click', () => {
                const ws = document.getElementById('welcomeScreen');
                if (ws) ws.style.display = "none";
                this.continueGame();
            });
            contBtn.addEventListener('touchstart', e => {
                e.preventDefault();
                const ws = document.getElementById('welcomeScreen');
                if (ws) ws.style.display = "none";
                this.continueGame();
            }, { passive: false });
        }

        const add = (id, fn) => {
            const b = document.getElementById(id);
            if (b) {
                b.addEventListener('click', fn);
                b.addEventListener('touchstart', e => { e.preventDefault(); fn(); }, { passive: false });
            }
        };

        add('upgradeClickBtn', () => FEAT.buyClickPower());
        add('upgradeHelperBtn', () => FEAT.buyHelper());
        add('upgradeCritChanceBtn', () => FEAT.buyCritChance());
        add('upgradeCritMultBtn', () => FEAT.buyCritMultiplier());
        add('upgradeHelperDmgBtn', () => FEAT.buyHelperDamage());
        add('upgradeBoboSpeedBtn', () => FEAT.buyBoboSpeed());
        add('upgradeResonanceBtn', () => FEAT.buyResonance());
        add('upgradeGravityBtn', () => FEAT.buyGravity());
        add('upgradeAnchorBtn', () => FEAT.buyAnchor());
        add('upgradeCompassBtn', () => FEAT.buyCompass());

        add('shareBtn', () => {
            if (!window.gameState) return;
            const txt = `🎮 Я нанес ${Math.floor(window.gameState.totalDamageDealt).toLocaleString()} урона и собрал ${Math.floor(window.gameState.coins)} Кристаллов! 🌌`;
            if (navigator.share) {
                navigator.share({ title: 'Космический Кликер', text: txt }).then(() => {
                    window.gameState.coins += 50;
                    UI.updateHUD();
                    UI.updateUpgradeButtons();
                    if (typeof window.saveGame === 'function') window.saveGame();
                });
            }
        });

add('saveBtn', () => { if (typeof window.saveGame === 'function') window.saveGame(); });
// ✅ НОВОЕ: Кнопка лидерборда
add('leaderboardBtn', () => { if (window.Leaderboard?.showModal) window.Leaderboard.showModal(); });

        const tips = {
            upgradeClickBtn: 'tooltips.upgradeClick',
            upgradeHelperBtn: 'tooltips.upgradeHelper',
            upgradeCritChanceBtn: 'tooltips.upgradeCritChance',
            upgradeCritMultBtn: 'tooltips.upgradeCritMult',
            upgradeHelperDmgBtn: 'tooltips.upgradeHelperDmg',
            // 🆕 v11
            upgradeBoboSpeedBtn: 'tooltips.upgradeBoboSpeed',
            upgradeResonanceBtn: 'tooltips.upgradeResonance',
            upgradeGravityBtn: 'tooltips.upgradeGravity',
            upgradeAnchorBtn: 'tooltips.upgradeAnchor',
            upgradeCompassBtn: 'tooltips.upgradeCompass'
        };
        Object.entries(tips).forEach(([id, tk]) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('mouseenter', () => {
                    if (window.showTooltip && window.translations) {
                        window.showTooltip(window.translations[window.currentLanguage][tk]);
                    }
                });
                btn.addEventListener('mouseleave', () => {
                    if (window.hideTooltip) window.hideTooltip();
                });
            }
        });

        window.addEventListener('resize', () => {
        if (this.helperElement) this.moveHelperToRandomPosition();
    });
 }
};

// ✅ НОВОЕ: Применяем настройки детектора устройства (с задержкой, чтобы дождаться инициализации DeviceDetector)
(function applyDeviceSettings() {
    function tryApply() {
        if (window.DeviceDetector && typeof window.DeviceDetector.getGameSettings === 'function') {
            const settings = window.DeviceDetector.getGameSettings();
            if (settings.blockSpeed) {
                window.GAME_CORE.blockSpeed = settings.blockSpeed;
                console.log('📱 [CORE] blockSpeed applied from DeviceDetector:', settings.blockSpeed);
            }
            if (settings.blockHealth) {
                window.GAME_CORE.deviceHealthMult = settings.blockHealth;
                console.log('📱 [CORE] blockHealth multiplier applied:', settings.blockHealth);
            }
        } else {
            // Повторяем через 300мс если DeviceDetector ещё не готов
            setTimeout(tryApply, 300);
        }
    }
    setTimeout(tryApply, 500);
})();

window.gameFunctions = {
    startGame: () => window.GAME_CORE.startGame(true),
    continueGame: () => window.GAME_CORE.continueGame(),
    restartGame: () => window.GAME_CORE.restartGame(),
    pauseGame: () => window.GAME_CORE.pauseGame(),
    resumeGame: () => window.GAME_CORE.resumeGame(),
    updateHUD: () => UI.updateHUD(),
    updateUpgradeButtons: () => UI.updateUpgradeButtons(),
    updateProgressBar: () => UI.updateProgressBar(),
    checkLocationUpgrade: () => UI.checkLocationUpgrade(),
    createDamageText: (d, b, c) => window.GAME_CORE.createDamageText(d, b, c),
    showComboText: (c, b, bl) => window.GAME_CORE.showComboText(c, b, bl),
    showRewardText: (r, bl) => window.GAME_CORE.showRewardText(r, bl),
    createExplosion: bl => { if (getFeat().createExplosion) getFeat().createExplosion(bl); },
    playSound: id => window.GAME_CORE.playSound(id),
    hitBlock: (b, d) => window.GAME_CORE.hitBlock(b, d),
    destroyBlock: bl => window.GAME_CORE.destroyBlock(bl),
    createMovingBlock: () => window.GAME_CORE.createMovingBlock(),
    setLocation: loc => window.GAME_CORE.setLocation(loc),
    applyUpgradePenalty: () => { if (getFeat().applyUpgradePenalty) getFeat().applyUpgradePenalty(); },
    calculateClickPower: () => window.GAME_CORE.calculateClickPower()
};

// ЧТО: Обёртка инициализации в функцию, которая ждёт события 'save:ready'
// КУДА: game-core.js → DOMContentLoaded handler
// ЗАЧЕМ: Гарантирует, что initEventHandlers() запустится ТОЛЬКО после того,
//        как save-system.js инициализирует gameState. Убирает race condition.
function onGameReady() {
isolateAchievementsV2(window.gameState);
window.GAME_CORE.initEventHandlers();
    UI.updateHUD();
    UI.updateUpgradeButtons();
    if (window.gameState?.currentLocation) window.GAME_CORE.setLocation(window.gameState.currentLocation);
    if (window.updateLanguageFlag) window.updateLanguageFlag();
    if (window.updateContinueButton) window.updateContinueButton();
    
    // ✅ Сигнализируем другим модулям о готовности
    if (window.EventBus) {
        window.EventBus.emit('core:ready');
        console.log('📡 [CORE] Эмитировано событие core:ready');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Если gameState уже есть — запускаем сразу
    if (window.gameState && Object.keys(window.gameState).length > 0) {
        console.log('✅ [CORE] gameState уже доступен, запускаем инициализацию');
        onGameReady();
    } else if (window.EventBus) {
        // Иначе ждём события save:ready
        console.log('⏳ [CORE] Ждём save:ready...');
        window.EventBus.once('save:ready', () => {
            console.log('✅ [CORE] save:ready получен, запускаем инициализацию');
            onGameReady();
        });
    } else {
        // Fallback: если EventBus недоступен, используем старый способ
        console.warn('⚠️ [CORE] EventBus недоступен, fallback на прямую инициализацию');
        onGameReady();
    }
});

})();
