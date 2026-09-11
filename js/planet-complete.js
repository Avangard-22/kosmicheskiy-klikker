// js/planet-complete.js
// 🌌 Экран завершения планеты: BoC + кэшбек + телепорт
(function () {
    'use strict';

    const GAME = () => window.GAME_CONFIG || {};
    let activeCleanup = null;

const DEFAULT_ECONOMY = {
    convertRate: 1000000,
    reserve: 500000,
    cashbackRate: 0.05,

        gates: {
            venus: 20,
            earth: 30,
            mars: 45,
            jupiter: 75,
            saturn: 250,
            uranus: 700,
            neptune: 1100,
         pluto: 2000,
         heliopause: 7500
     },
     teleport: {
            min: 1.5,
            max: 5.0,
            step: 0.25
        }
    };

    // Добавьте локальную функцию, если ещё не определена
    function formatBoC(value) {
        const numberValue = Number(value) || 0;
        if (numberValue >= 1000) return (numberValue / 1000).toFixed(2) + 'K';
        if (numberValue >= 1) return numberValue.toFixed(2).replace(/\.?0+$/, '');
        if (numberValue > 0) return numberValue.toFixed(6).replace(/\.?0+$/, '');
        return '0';
    }

    // Читаем GameEconomy динамически, а не один раз при загрузке файла.
    function economyConfig() {
        const source = window.GameEconomy?.CFG || {};

        const convertRate = Number(source.convertRate);
        const reserve = Number(source.reserve);
        const cashbackRate = Number(source.cashbackRate);

        const teleportSource = source.teleport || {};
        const teleport = {
            min: Number.isFinite(Number(teleportSource.min))
                ? Number(teleportSource.min)
                : DEFAULT_ECONOMY.teleport.min,
            max: Number.isFinite(Number(teleportSource.max))
                ? Number(teleportSource.max)
                : DEFAULT_ECONOMY.teleport.max,
            step: Number.isFinite(Number(teleportSource.step)) &&
                   Number(teleportSource.step) > 0
                ? Number(teleportSource.step)
                : DEFAULT_ECONOMY.teleport.step
        };

        return {
            convertRate: Number.isFinite(convertRate) && convertRate > 0
                ? convertRate
                : DEFAULT_ECONOMY.convertRate,

            reserve: Number.isFinite(reserve) && reserve >= 0
                ? reserve
                : DEFAULT_ECONOMY.reserve,

cashbackRate: Number.isFinite(cashbackRate)
    ? Math.max(0, Math.min(1, cashbackRate))
    : DEFAULT_ECONOMY.cashbackRate,

         gates: Object.assign(
             {},
             DEFAULT_ECONOMY.gates,
             source.gates || {}
         ),
         teleport
        };
    }

    function number(value, fallback = 0) {
        const result = Number(value);
        return Number.isFinite(result) ? result : fallback;
    }

    function formatNumber(value) {
        return Math.floor(number(value)).toLocaleString('ru-RU');
    }

    function gateFor(planet) {
        const cfg = economyConfig();
        return Math.max(0, number(cfg.gates?.[planet], 0));
    }

    function rollTeleportMultFallback() {
        const cfg = economyConfig();
        const min = cfg.teleport.min;
        const max = cfg.teleport.max;
        const step = cfg.teleport.step;
        const steps = Math.max(0, Math.round((max - min) / step));

        return min + Math.floor(Math.random() * (steps + 1)) * step;
    }

    /*
     * Важно:
     * Не вызываем rollTeleportMult() при открытии экрана.
     * GAME_CORE.doTeleport() может сгенерировать другой множитель.
     * Поэтому на экране показывается диапазон, а уведомление после нажатия
     * показывает фактический множитель из gameState.teleportMult.
     */

 // ✅ НОВОЕ: список точек фарм-телепорта (только НАЗАД, врата уже открыты)
 function getDestinations(state) {
     if (typeof window.GAME_CORE?.getFarmDestinations === 'function') {
         return window.GAME_CORE.getFarmDestinations();
     }
     const cfg = GAME();
     const order = cfg.planetOrder || [];
     const currentIdx = order.indexOf(state?.currentLocation);
     return order.slice(0, Math.max(0, currentIdx + 1)).map(id => ({
         id: id,
         name: cfg.locations?.[id]?.name || id,
         emoji: cfg.locations?.[id]?.emoji || '🪐',
         isCurrent: id === state?.currentLocation
     }));
 }
 function payGate(amount, opts) {
        const value = Math.max(0, number(amount));

        if (value <= 0) {
            return { success: true };
        }

        const economy = window.GameEconomy;

        if (typeof economy?.payGate === 'function') {
          const result = economy.payGate(value, opts);

            if (result === true) {
                return { success: true };
            }

            if (result && typeof result === 'object') {
                return {
                    success: result.success === true,
                    ...result
                };
            }

            return { success: false };
        }

        const state = window.gameState;
        if (!state) return { success: false };

        const liquid = number(state.bocLiquid);
        if (liquid < value) {
            return { success: false };
        }

        state.bocLiquid = liquid - value;
        return { success: true };
    }

    /*
     * Расчёт состояния врат.
     * Врата считаются строго через единый источник — GameEconomy.gateForRun
     * (тот же вызов использует game-core.js при реальной оплате), с учётом
     * номера престиж-рана из state.runNumber.
     * Если модуль экономики вдруг не загружен — защитный фолбэк на локальную
     * gateFor() (базовые врата, без ран-скейлинга) + предупреждение в лог.
     */
    function computeGate(nextPlanet, state = window.gameState) {
        const run = Math.max(1, Math.floor(number(state?.runNumber, 1)));

        let gateBoC = 0;
        if (nextPlanet) {
            const econ = window.GameEconomy;
            if (typeof econ?.gateForRun === 'function') {
                gateBoC = number(econ.gateForRun(nextPlanet, run), 0);
            } else {
                // ⚠️ Расходимость не должна встречаться: game-economy.js грузится раньше.
                console.warn('⚠️ [PLANET] GameEconomy.gateForRun недоступен — фолбэк на базовые врата без учёта рана');
                gateBoC = gateFor(nextPlanet);
            }
        }

        const isHelio = nextPlanet === 'heliopause';
        const liquid = Math.max(0, number(state?.bocLiquid));
        const reserve = Math.max(0, number(state?.bocReserve));   // 🏦 переходящий остаток
        const available = isHelio ? liquid + reserve : liquid;    // обычные врата — только рановый BoC

        return {
            gateBoC,
            liquid,
            reserve,
            available,
            needBoC: Math.max(0, gateBoC - available),
            canAfford: gateBoC === 0 || available >= gateBoC
        };
    }

    /*
     * Выполняет автоконвертацию и оплату врат.
     * Возвращает false, если операция не удалась.
     */
function payGateAndReturnResult(nextPlanet) {
    const state = window.gameState;

    if (!state) {
        return {
            success: false,
            reason: 'no-state'
        };
    }

    const gate = computeGate(nextPlanet, state);

    if (!gate.canAfford) {
        return {
            success: false,
            reason: 'not-enough',
            gate
        };
    }

const payment = payGate(gate.gateBoC, { heliopause: nextPlanet === 'heliopause' });

    if (!payment.success) {
        return {
            success: false,
            reason: 'payment-failed',
            gate
        };
    }

    return {
        success: true,
        gate,
        spent: gate.gateBoC
    };
}

    // ═══════════════════════════════════════════════════════════════════════
    // ДАННЫЕ ПЛАНЕТ
    // ═══════════════════════════════════════════════════════════════════════

    const PLANET_PHOTOS = {
        mercury: [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Mercury_in_true_color.jpg/640px-Mercury_in_true_color.jpg',
            'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=600&q=70'
        ],
        venus: [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Venus-real-color.jpg/640px-Venus-real-color.jpg',
            'https://images.unsplash.com/photo-1614313913007-2d4b8b6d7a4f?w=600&q=70'
        ],
        earth: [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/640px-The_Earth_seen_from_Apollo_17.jpg',
            'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=600&q=70'
        ],
        mars: [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/OSIRIS_Mars_true_color.jpg/640px-OSIRIS_Mars_true_color.jpg',
            'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600&q=70'
        ],
        jupiter: [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg/640px-Jupiter_and_its_shrunken_Great_Red_Spot.jpg',
            'https://images.unsplash.com/photo-1614314107768-6018061b5b72?w=600&q=70'
        ],
        saturn: [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Saturn_during_Equinox.jpg/640px-Saturn_during_Equinox.jpg',
            'https://images.unsplash.com/photo-1614313905487-3e2f0c8a8e2b?w=600&q=70'
        ],
        uranus: [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Uranus2.jpg/640px-Uranus2.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Uranus_-_Voyager_2.jpg/640px-Uranus_-_Voyager_2.jpg'
        ],
        neptune: [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Neptune_-_Voyager_2.jpg/640px-Neptune_-_Voyager_2.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Neptune_Full.jpg/640px-Neptune_Full.jpg'
        ],
        pluto: [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Pluto_in_True_Color_-_High-Res.jpg/640px-Pluto_in_True_Color_-_High-Res.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/NH-Pluto-in-true-color_1.jpg/640px-NH-Pluto-in-true-color_1.jpg'
        ]
    };

    const PLANET_FACTS = {
        mercury: '☿ Меркурий — ближайшая к Солнцу планета. День длится 2 года, а ночью температура падает до −180°C.',
        venus: '♀ Венера — самая горячая планета (+465°C). Вращается в обратную сторону, а её сутки длиннее года.',
        earth: '♁ Земля — единственная известная планета с жизнью. 71% поверхности покрыто океанами.',
        mars: '♂ Марс — «Красная планета». Здесь находится самый высокий вулкан Солнечной системы — Олимп (21 км).',
        jupiter: '♃ Юпитер — крупнейшая планета. Внутрь поместилось бы 1300 Земель.',
        saturn: '♄ Сатурн — планета с кольцами изо льда и камня. Плотность меньше воды — он бы плавал!',
        uranus: '♅ Уран — ледяной гигант, вращается «лёжа на боку» из-за наклона оси 98°.',
        neptune: '♆ Нептун — самая ветреная планета: порывы до 2100 км/ч.',
        pluto: '♇ Плутон — карликовая планета. Его сердце из азотного льда — «Томбо Регио».'
    };

    // ═══════════════════════════════════════════════════════════════════════
    // СТИЛИ
    // ═══════════════════════════════════════════════════════════════════════

    function injectStyles() {
        if (document.getElementById('planet-complete-styles')) return;

        const style = document.createElement('style');
        style.id = 'planet-complete-styles';

        style.textContent = `
            #planetCompleteOverlay {
                position: fixed;
                inset: 0;
                z-index: 3000;
                background: rgba(5, 4, 12, 0.98);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                padding: 20px 16px;
                overflow-y: auto;
                font-family: 'Orbitron', system-ui, sans-serif;
                color: #fff;
            }

            .pc-title {
                font-size: 1.2em;
                color: #FFD700;
                text-align: center;
                margin: 6px 0 2px;
            }

            .pc-subtitle {
                font-size: 0.75em;
                color: #aaa;
                text-align: center;
                margin-bottom: 14px;
            }

            .pc-slider {
                position: relative;
                width: min(92vw, 420px);
                height: 190px;
                border-radius: 14px;
                overflow: hidden;
                margin-bottom: 14px;
                border: 2px solid rgba(255, 215, 0, 0.3);
            }

            .pc-slider img {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                opacity: 0;
                transition: opacity 0.6s;
            }

            .pc-slider img.active {
                opacity: 1;
            }

            .pc-dots {
                display: flex;
                gap: 6px;
                justify-content: center;
                margin-bottom: 12px;
            }

            .pc-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.25);
                cursor: pointer;
            }

            .pc-dot.active {
                background: #FFD700;
            }

            .pc-fact {
                font-size: 0.8em;
                color: #cfd8dc;
                text-align: center;
                line-height: 1.5;
                margin-bottom: 16px;
                max-width: 400px;
            }

            .pc-gate-box {
                width: min(92vw, 400px);
                background: rgba(255, 215, 0, 0.06);
                border: 1px solid rgba(255, 215, 0, 0.2);
                border-radius: 12px;
                padding: 12px;
                margin-bottom: 14px;
                text-align: center;
                font-size: 0.8em;
            }

            .pc-gate-title {
                color: #FFD700;
                margin-bottom: 6px;
                font-weight: bold;
            }

            .pc-gate-cost {
                font-size: 1.1em;
                color: #fff;
            }

            .pc-gate-cost b {
                color: #FFD700;
            }

            .pc-gate-cashback {
                font-size: 0.8em;
                color: #4CAF50;
                margin-top: 5px;
            }

            .pc-gate-cashback b {
                color: #7CFC00;
            }

            .pc-gate-status {
                margin-top: 8px;
                font-size: 0.78em;
                line-height: 1.4;
            }

            .pc-gate-status.ok {
                color: #4CAF50;
            }

            .pc-gate-status.nok {
                color: #f44336;
            }

            .pc-buttons {
                display: flex;
                flex-direction: column;
                gap: 10px;
                width: min(92vw, 400px);
                margin-bottom: 10px;
            }

            .pc-btn {
                width: 100%;
                padding: 14px;
                border-radius: 12px;
                border: none;
                font-family: 'Orbitron', sans-serif;
                font-weight: bold;
                font-size: 0.95em;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
                text-align: center;
            }

            .pc-btn:hover:not(:disabled) {
                transform: scale(1.03);
            }

            .pc-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }

            .pc-btn-primary {
                background: linear-gradient(135deg, #FFD700, #FF8C00);
                color: #000;
                box-shadow: 0 4px 20px rgba(255, 215, 0, 0.4);
            }

            .pc-btn-teleport {
                background: rgba(124, 77, 255, 0.2);
                color: #b388ff;
                border: 1px solid rgba(124, 77, 255, 0.5);
            }

            .pc-btn-teleport:hover:not(:disabled) {
                background: rgba(124, 77, 255, 0.35);
            }

         .pc-teleport-mult {
             color: #b388ff;
             font-size: 0.75em;
             margin-top: 4px;
         }
         .pc-dest-grid {
             display: flex;
             flex-wrap: wrap;
             gap: 8px;
             justify-content: center;
             margin-top: 8px;
         }
         .pc-dest-btn {
             padding: 10px 12px;
             border-radius: 10px;
             border: 1px solid rgba(124, 77, 255, 0.5);
             background: rgba(124, 77, 255, 0.15);
             color: #d0c4ff;
             font-family: 'Orbitron', sans-serif;
             font-size: 0.75em;
             font-weight: bold;
             cursor: pointer;
             transition: transform 0.2s, background 0.2s;
         }
         .pc-dest-btn:hover { transform: scale(1.05); background: rgba(124, 77, 255, 0.3); }
         .pc-dest-btn.current { border-color: #FFD700; color: #FFD700; background: rgba(255, 215, 0, 0.12); }

          .pc-dest-grid {
             display: flex;
             flex-wrap: wrap;
             gap: 8px;
             justify-content: center;
             margin-top: 8px;
         }
         .pc-dest-btn {
             padding: 10px 12px;
             border-radius: 10px;
             border: 1px solid rgba(124, 77, 255, 0.5);
             background: rgba(124, 77, 255, 0.15);
             color: #d0c4ff;
             font-family: 'Orbitron', sans-serif;
             font-size: 0.75em;
             font-weight: bold;
             cursor: pointer;
             transition: transform 0.2s, background 0.2s;
         }
         .pc-dest-btn:hover { transform: scale(1.05); background: rgba(124, 77, 255, 0.3); }
         .pc-dest-btn.current { border-color: #FFD700; color: #FFD700; background: rgba(255, 215, 0, 0.12); }
         .pc-error {
                width: min(92vw, 400px);
                color: #ff8a80;
                background: rgba(244, 67, 54, 0.12);
                border: 1px solid rgba(244, 67, 54, 0.35);
                border-radius: 10px;
                padding: 10px;
                margin-bottom: 12px;
                text-align: center;
                font-size: 0.75em;
            }

            .pc-note {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(124, 77, 255, 0.94);
                color: #fff;
                padding: 16px 24px;
                border-radius: 14px;
                font-family: 'Orbitron', sans-serif;
                font-size: 1.05em;
                z-index: 5000;
                text-align: center;
                box-shadow: 0 0 30px rgba(124, 77, 255, 0.5);
            }
        `;

        document.head.appendChild(style);
    }

    function buildSlider(planet) {
        const photos = PLANET_PHOTOS[planet] || [];
        if (!photos.length) return '';

        const images = photos.map((url, index) => `
            <img
                src="${url}"
                alt="Фото ${planet}"
                loading="lazy"
                class="${index === 0 ? 'active' : ''}"
                onerror="this.style.display='none'"
            >
        `).join('');

        const dots = photos.map((_, index) => `
            <div
                class="pc-dot ${index === 0 ? 'active' : ''}"
                data-idx="${index}"
                role="button"
                aria-label="Фото ${index + 1}"
            ></div>
        `).join('');

        return `
            <div class="pc-slider" id="pcSlider">${images}</div>
            <div class="pc-dots" id="pcDots">${dots}</div>
        `;
    }

    function showError(overlay, text) {
        if (!overlay) return;

        const previous = overlay.querySelector('.pc-error');
        if (previous) previous.remove();

        const error = document.createElement('div');
        error.className = 'pc-error';
        error.textContent = text;

        const buttons = overlay.querySelector('.pc-buttons');
        if (buttons) {
            overlay.insertBefore(error, buttons);
        } else {
            overlay.appendChild(error);
        }
    }

    function updateHud() {
        if (window.GAME_UI?.updateHUD) {
            window.GAME_UI.updateHUD();
        }

        if (window.GAME_UI?.updateProgressBar) {
            window.GAME_UI.updateProgressBar();
        }

        if (window.GAME_UI?.updateUpgradeButtons) {
            window.GAME_UI.updateUpgradeButtons();
        }
    }

    function showTeleportNote(multiplier) {
        const value = number(multiplier, 1);
        const note = document.createElement('div');
        note.className = 'pc-note';

        note.innerHTML = `
            ⚡ ТЕЛЕПОРТ<br>
            <span style="font-size:0.8em;color:#b388ff;">
                Множитель: ×${value.toFixed(2)}
            </span><br>
            <span style="font-size:0.6em;color:#d0c4ff;">
                Кристаллы ×${value.toFixed(2)} на повторном проходе
            </span>
        `;

        document.body.appendChild(note);

        setTimeout(() => {
            if (note.parentNode) {
                note.parentNode.removeChild(note);
            }
        }, 2500);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ПОКАЗ ЭКРАНА
    // ═══════════════════════════════════════════════════════════════════════

    function showPlanetComplete() {
        const state = window.gameState;
        if (!state) return;

        const existing = document.getElementById('planetCompleteOverlay');
        if (existing) return;

        injectStyles();

        const planet = state.currentLocation;
        const cfg = GAME();

        const progression = cfg.PROGRESSION_CONFIG?.[planet];
        const next = progression?.nextLocation || null;
        const nextName = next
            ? (cfg.locations?.[next]?.name || next)
            : null;

        // Не показываем один и тот же экран повторно.
        if (state._planetCompleteShown === planet) {
            return;
        }

        state._planetCompleteShown = planet;

        const economy = economyConfig();
        const gate = computeGate(next, state);
        const previewTeleportMult = rollTeleportMultFallback();

        const overlay = document.createElement('div');
        overlay.id = 'planetCompleteOverlay';

               overlay.innerHTML = `
            <div class="pc-title">🌌 Планета покорена!</div>
            <div class="pc-subtitle">
                ${cfg.locations?.[planet]?.name || planet} — 100%
            </div>

            ${buildSlider(planet)}

            <div class="pc-fact">
                ${PLANET_FACTS[planet] || ''}
            </div>

            ${next ? `
                <div class="pc-gate-box">
                    <div class="pc-gate-title">
                        🚪 Врата на ${nextName}
                    </div>
                    <div class="pc-gate-cost">
                        Стоимость: <b>${formatNumber(gate.gateBoC)} BoC</b>
                    </div>
${next === 'heliopause' ? `
    <div class="pc-gate-cashback">
        🏦 Переходящий остаток: <b>${formatBoC(gate.reserve)} BoC</b>
        · ран: ${formatBoC(gate.liquid)} BoC
    </div>` : ''}
                    <div class="pc-gate-status ${gate.canAfford ? 'ok' : 'nok'}">
                        ${
                            gate.canAfford
                                ? `✅ BoC достаточно для открытия врат`
                                : `❌ Не хватает ${formatBoC(gate.needBoC)} BoC. Зарабатывайте BoC за счёт кэшбэка (5% от трат).`
                        }
                    </div>
                    ${!gate.canAfford ? `
                        <div style="margin-top:8px;font-size:0.78em;color:#b388ff;">
                            ⚡ Выбери, откуда начать повторный проход:
                        </div>
                        <div class="pc-dest-grid" id="pcDestGrid">
                            ${getDestinations(state).map(d => `
                                <button class="pc-dest-btn ${d.isCurrent ? 'current' : ''}" data-dest="${d.id}">
                                    ${d.emoji} ${d.name}${d.isCurrent ? ' · текущая' : ''}
                                </button>
                            `).join('')}
                        </div>
                        <div class="pc-gate-cashback">
                            Врата пройденных локаций уже открыты — возврат вперёд бесплатен.
                        </div>
                    ` : ''}
                </div>
                <div class="pc-buttons">
                    <button
                        class="pc-btn pc-btn-primary"
                        id="pcGoNext"
                        ${gate.canAfford ? '' : 'disabled'}
                    >
                        🚪 Открыть Врата на ${nextName}
                        (${formatNumber(gate.gateBoC)} BoC)
                    </button>
                    <button class="pc-btn pc-btn-teleport" id="pcTeleport">
                        ⚡ Телепорт — начать заново с бонусом
                        <div class="pc-teleport-mult">
                            Гарантированный множитель дохода:
                            ×${previewTeleportMult.toFixed(2)}
                        </div>
                    </button>
                </div>
            ` : `
                <div class="pc-gate-box">
                    <div class="pc-gate-title">
                        🌌 Край Солнечной системы
                    </div>
                    <div class="pc-gate-status ok">
                        Продолжайте накапливать BoC для престижа
                    </div>
                    <div class="pc-gate-cashback">
                        Ваш баланс: <b>${formatBoC(gate.liquid)} BoC</b>
                    </div>
                </div>
                <div class="pc-buttons">
                    <button class="pc-btn pc-btn-primary" id="pcGoNext">
                        🌌 Продолжить полёт
                    </button>
                    <button class="pc-btn pc-btn-teleport" id="pcTeleport">
                        ⚡ Телепорт — повторить проход
                        <div class="pc-teleport-mult">
                            Гарантированный множитель дохода:
                            ×${previewTeleportMult.toFixed(2)}
                        </div>
                    </button>
                </div>
            `}
        `;

        document.body.appendChild(overlay);

        if (window.GAME_CORE?.pauseGame) {
            window.GAME_CORE.pauseGame();
        }

     let processing = false;
     let activationReady = false; // ✅ 3с задержка активации кнопок
     let delayTimer = null;
     let slideIndex = 0;
     let slideInterval = null;

        const images = overlay.querySelectorAll('.pc-slider img');
        const dots = overlay.querySelectorAll('.pc-dot');

        function showSlide(index) {
            if (!images.length) return;

            slideIndex = (index + images.length) % images.length;

            images.forEach((image, current) => {
                image.classList.toggle('active', current === slideIndex);
            });

            dots.forEach((dot, current) => {
                dot.classList.toggle('active', current === slideIndex);
            });
        }

        if (images.length > 1) {
            slideInterval = setInterval(() => {
                showSlide(slideIndex + 1);
            }, 4000);
        }

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                showSlide(number(dot.dataset.idx));
            });
        });

     function cleanup() {
         if (slideInterval) {
             clearInterval(slideInterval);
             slideInterval = null;
         }
         if (delayTimer) {
             clearInterval(delayTimer);
             delayTimer = null;
         }
         if (delayTimer) {
             clearInterval(delayTimer);
             delayTimer = null;
         }

            const current = document.getElementById('planetCompleteOverlay');
            if (current?.parentNode) {
                current.parentNode.removeChild(current);
            }

            if (activeCleanup === cleanup) {
                activeCleanup = null;
            }
        }

        activeCleanup = cleanup;

        // ═══════════════════════════════════════════════════════════════════
        // ПЕРЕХОД НА СЛЕДУЮЩУЮ ПЛАНЕТУ
        // ═══════════════════════════════════════════════════════════════════

     overlay.querySelector('#pcGoNext')?.addEventListener('click', () => {
         if (processing || !activationReady) return;
         processing = true;

            const button = overlay.querySelector('#pcGoNext');
            if (button) button.disabled = true;

            // Финальная планета: просто закрываем экран и продолжаем игру.
            if (!next) {
                cleanup();

                if (window.GAME_CORE?.resumeGame) {
                    window.GAME_CORE.resumeGame();
                }

                updateHud();

                if (typeof window.saveGame === 'function') {
                    window.saveGame();
                }

                return;
            }

            const oldLocation = state.currentLocation;

            state._isLocationChange = true;
            state._planetCompleteShown = null;

            // ⚠️ Оплата врат теперь ТОЛЬКО в setLocation (через GameEconomy.payGate).
            // Здесь ничего не списываем заранее — иначе двойное списание.
            if (window.GAME_CORE?.setLocation) {
                window.GAME_CORE.setLocation(next);
            }

            // setLocation сам отклонит переход, если BoC не хватает (ничего не списано).
            if (state.currentLocation !== next) {
                state._planetCompleteShown = oldLocation;

                processing = false;
                if (button) button.disabled = false;

                updateHud();

                const latest = computeGate(next);
                showError(
                    overlay,
                    `Недостаточно BoC для перехода: нужно ${formatNumber(latest.needBoC)} BoC.`
                );

                return;
            }

            console.log(
                `🚀 [PLANET] Переход выполнен: ` +
                `${oldLocation} → ${next}`
            );

            cleanup();

            if (window.GAME_CORE?.resumeGame) {
                window.GAME_CORE.resumeGame();
            }

            updateHud();

            if (typeof window.saveGame === 'function') {
                window.saveGame();
            }
        });

        // ═══════════════════════════════════════════════════════════════════
        // ТЕЛЕПОРТ
        // ═══════════════════════════════════════════════════════════════════
        // ✅ НОВОЕ: фарм-телепорт с выбором точки старта (только назад)
     overlay.querySelectorAll('.pc-dest-btn').forEach(btn => {
         btn.addEventListener('click', () => {
             if (processing || !activationReady) return;
             processing = true;
             const dest = btn.dataset.dest;
             cleanup();
             if (typeof window.GAME_CORE?.doTeleport === 'function') {
                 window.GAME_CORE.doTeleport(previewTeleportMult, dest);
             } else {
                 state.currentLocation = dest;
                 state.teleportMult = previewTeleportMult;
             }
             state._planetCompleteShown = null;
             updateHud();
             showTeleportNote(state.teleportMult || previewTeleportMult);
             if (typeof window.saveGame === 'function') window.saveGame();
             console.log(`⚡ [BOC] Фарм-телепорт на ${dest} · ×${(state.teleportMult || previewTeleportMult).toFixed(2)}`);
         });
     });
     overlay.querySelector('#pcTeleport')?.addEventListener('click', () => {
         if (processing || !activationReady) return;
         processing = true;

            const button = overlay.querySelector('#pcTeleport');
            if (button) button.disabled = true;

            cleanup();

            let actualMultiplier = 0;

            if (typeof window.GAME_CORE?.doTeleport === 'function') {
                window.GAME_CORE.doTeleport(previewTeleportMult);
                actualMultiplier = previewTeleportMult;
            } else {
                actualMultiplier = previewTeleportMult;
                const currentPlanet = state.currentLocation;

                state.teleportMult = actualMultiplier;
                state.planetTeleports =
                    number(state.planetTeleports, 0) + 1;
                state.planetDamageDealt = 0;
                state.planetFirstBlockCleared = false;
state._planetCompleteShown = null;
state.skipPenaltyState = null;
state.dailyBlocksDestroyed = 0; // ✅ рампа сбрасывается при телепорте
state.clickUpgradeLevel = 0;
                state.critChanceUpgradeLevel = 0;
                state.critMultiplierUpgradeLevel = 0;
                state.helperUpgradeLevel = 0;

                state.clickPower = 1;
                state.critChance = 0.001;
                state.critMultiplier = 2.0;
                state.helperActive = false;
                state.helperTimeLeft = 0;
                state.boboCoinBonus = 0;

                   // ✅ Вместо ручного сброса достижений — единая точка
                //    (сбрасывает и achievementsV2, и planetStats, ставит _teleportReset)
                if (typeof window.resetPlanetProgress === 'function') {
                    window.resetPlanetProgress(currentPlanet);
                }

                if (window.GAME_CORE?.startGame) {
                    window.GAME_CORE.startGame(false);
                }
            }

            if (!Number.isFinite(actualMultiplier) || actualMultiplier <= 0) {
                actualMultiplier = number(
                    state.teleportMult,
                    rollTeleportMultFallback()
                );
            }

            state.teleportMult = actualMultiplier;

            updateHud();

            showTeleportNote(actualMultiplier);

            if (typeof window.saveGame === 'function') {
                window.saveGame();
            }

            console.log(
                `⚡ [BOC] Телепорт выполнен: ` +
                `планета ${state.currentLocation}, ` +
                `множитель ×${actualMultiplier.toFixed(2)}`
            );
        });

     // ✅ НОВОЕ: 3-секундная задержка активации ВСЕХ кнопок (анти-мисклик)
     const actionButtons = overlay.querySelectorAll('.pc-btn, .pc-dest-btn');
     const gateBtn = overlay.querySelector('#pcGoNext');
     const gateLogicallyDisabled = gateBtn ? gateBtn.disabled : false;
     actionButtons.forEach(b => { b.disabled = true; });
     const note = document.createElement('div');
     note.className = 'pc-gate-status nok';
     note.style.margin = '6px auto 0';
     note.style.textAlign = 'center';
     const buttonsBox = overlay.querySelector('.pc-buttons');
     if (buttonsBox && buttonsBox.parentNode) buttonsBox.parentNode.insertBefore(note, buttonsBox);
     note.textContent = '🔒 Кнопки активируются через 3.0 с…';
     const delayStart = Date.now();
     delayTimer = setInterval(() => {
         const left = 3000 - (Date.now() - delayStart);
         if (left <= 0) {
             clearInterval(delayTimer);
             delayTimer = null;
             activationReady = true;
             if (note.parentNode) note.parentNode.removeChild(note);
             actionButtons.forEach(b => {
                 // восстанавливаем ЛОГИЧЕСКОЕ состояние: врата остаются disabled, если BoC не хватает
                 if (b.id === 'pcGoNext') b.disabled = gateLogicallyDisabled;
                 else b.disabled = false;
             });
         } else {
             note.textContent = `🔒 Кнопки активируются через ${(left / 1000).toFixed(1)} с…`;
         }
     }, 100);
     console.log(
         `🌌 [PLANET-COMPLETE] Экран показан: ` +
         `${planet} → ${next || '—'} · ` +
         `врата ${formatNumber(gate.gateBoC)} BoC · ` +
         `задержка активации кнопок 3 с`
     );
    }

    function closeOverlay() {
        if (typeof activeCleanup === 'function') {
            activeCleanup();
            return;
        }

        const overlay = document.getElementById('planetCompleteOverlay');
        if (overlay?.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }

    window.PlanetComplete = {
        show: showPlanetComplete,
        close: closeOverlay,
        computeGate
    };

    console.log(
        `🌌 [PLANET-COMPLETE] загружен. ` +
        `GameEconomy: ${window.GameEconomy ? 'ДА ✅' : 'НЕТ — дефолты'}`
    );
})();
