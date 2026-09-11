// js/leaderboard.js (v3.0 — сервер считает всё)
(function() {
'use strict';

const Leaderboard = {
    config: { submitInterval: 30000, maxEntries: 50 },
    
    // ✅ Whitelist валидных планет (защита от XSS через level)
    _validPlanets: new Set([
        'mercury', 'venus', 'earth', 'mars', 'jupiter',
        'saturn', 'uranus', 'neptune', 'pluto', 'heliopause'
    ]),
    
    currentPeriod: 'time',
    currentBlockPeriod: 'total',
    currentDistancePeriod: 'total',
    modalVisible: false,
    lastSubmitTime: 0,

    // ═══════════════════════════════════════
    // Форматирование значений для отображения
    // ═══════════════════════════════════════
    formatDistance: function(num, period) {
        if (!num || num <= 0) return '0';
        if (period === 'blocks') {
            if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
            return Math.floor(num).toLocaleString();
        }
        if (period === 'distance') {
            if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M км';
            if (num >= 1000) return (num / 1000).toFixed(2) + 'K км';
            return Math.floor(num).toLocaleString() + ' км';
        }
        if (period === 'time') {
            const hours = Math.floor(num / 3600);
            const minutes = Math.floor((num % 3600) / 60);
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        return Math.floor(num).toLocaleString();
    },

    // ═══════════════════════════════════════
    // Абсолютные тоталы для отправки на сервер
    // ═══════════════════════════════════════
getAbsoluteTotals: function() {
    const gs = window.gameState;
    if (!gs) return { blocks: 0, distance: 0, time: 0 };

    let blocks = 0, time = 0;
    const ps = window.gameMetrics?.planetStats || {};
    Object.values(ps).forEach(p => {
        blocks += (p.blocks || 0);        // planetStats не подвержен копипасте
        time   += (p.timePlayed || 0);
    });

    const distance = gs.totalDamageDealt || 0;
    return { blocks: Math.floor(blocks), distance: Math.floor(distance), time: Math.floor(time) };
},
    // ═══════════════════════════════════════
    // Отправка на сервер (каждые 30 сек)
    // ═══════════════════════════════════════
isSubmitting: false, // поле в объекте Leaderboard

submitToLeaderboard: async function() {
    if (!window.telegramCloud?.isAvailable) return;
    if (this.isSubmitting) return; // ✅ защита от race condition
    
    const now = Date.now();
    if (now - this.lastSubmitTime < this.config.submitInterval) return;

    const gs = window.gameState;
    if (!gs) return;

    const username = window.getTelegramUsername ? window.getTelegramUsername() : 'Anonymous';
    const userId = window.getUserId ? window.getUserId() : null;
    if (!userId) return;

    this.isSubmitting = true;
    try {
        const totals = this.getAbsoluteTotals();
        console.log('🏆 [LB] Отправка:', totals);

        const result = await window.telegramCloud.submitLeaderboard({
            blocks: totals.blocks,
            distance: totals.distance,
            time: totals.time,
            username: username,
            userId: userId,
            level: gs.currentLocation || 'mercury'
        });

        if (result?.success) {
            this.lastSubmitTime = now;
            console.log('✅ [LB] Отправлено');
        }
    } catch (e) {
        console.warn('⚠️ [LB] Ошибка отправки:', e);
    } finally {
        this.isSubmitting = false;
    }
},

    // ═══════════════════════════════════════
    // Загрузка с сервера
    // ═══════════════════════════════════════
    fetchLeaderboard: async function(period, subPeriod) {
        if (!window.telegramCloud?.isAvailable) {
            return { success: false, data: [], error: 'Cloud unavailable' };
        }
        try {
            return await window.telegramCloud.getLeaderboard(period, this.config.maxEntries, subPeriod);
        } catch (e) {
            console.warn('⚠️ [LB] Ошибка загрузки:', e);
            return { success: false, data: [], error: e.message };
        }
    },

    // ═══════════════════════════════════════
    // СТИЛИ (без изменений)
    // ═══════════════════════════════════════
    injectStyles: function() {
        if (document.getElementById('leaderboard-styles')) return;
        const style = document.createElement('style');
        style.id = 'leaderboard-styles';
        style.textContent = `
            .leaderboard-btn {
                background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,140,0,0.2));
                border: 2px solid rgba(255,215,0,0.4);
                color: #FFD700;
                padding: 12px 20px;
                border-radius: 12px;
                cursor: pointer;
                font-family: 'Orbitron', sans-serif;
                font-size: 1em;
                font-weight: bold;
                margin-top: 10px;
                width: 100%;
                transition: all 0.2s;
            }
.lb-entry.is-me {
    background: rgba(79,195,247,0.15) !important;
    border-color: rgba(79,195,247,0.5) !important;
    box-shadow: 0 0 12px rgba(79,195,247,0.3);
}
.lb-entry.is-me .lb-name { color: #4FC3F7; }
.lb-entry.is-me .lb-distance { color: #81D4FA; }
            .leaderboard-btn:hover { background: linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,140,0,0.3)); transform: scale(1.02); }
            .leaderboard-btn:active { transform: scale(0.98); }
            .lb-modal {
                position: fixed; top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 92vw; max-width: 500px; max-height: 85vh;
                background: rgba(10, 8, 20, 0.98);
                border-radius: 16px; padding: 16px;
                border: 2px solid rgba(255,215,0,0.3);
                box-shadow: 0 10px 60px rgba(0,0,0,0.8);
                z-index: 3000; display: none;
                flex-direction: column; gap: 10px;
                backdrop-filter: blur(10px);
                font-family: system-ui, sans-serif;
                overflow: hidden;
            }
            .lb-modal.active { display: flex; }
            .lb-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); }
            .lb-title { margin: 0; color: #FFD700; font-family: 'Orbitron', sans-serif; font-size: 1.2em; }
            .lb-close { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 1em; display: flex; align-items: center; justify-content: center; }
            .lb-close:hover { background: rgba(244,67,54,0.3); }
            .lb-tabs { display: flex; gap: 6px; margin-bottom: 12px; }
            .lb-tab { flex: 1; padding: 10px 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; cursor: pointer; text-align: center; color: #aaa; font-weight: bold; font-family: 'Orbitron', sans-serif; font-size: 0.85em; transition: all 0.2s; }
            .lb-tab:hover { background: rgba(255,255,255,0.1); color: #fff; }
            .lb-tab.active { background: linear-gradient(135deg, #FFD700, #FF8C00); color: #000; border-color: #FFD700; box-shadow: 0 2px 8px rgba(255,215,0,0.4); }
            .lb-subtabs { display: flex; gap: 4px; margin-bottom: 12px; padding: 0 4px; }
            .lb-subtab { flex: 1; padding: 8px 6px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; cursor: pointer; text-align: center; color: #888; font-weight: bold; font-family: 'Orbitron', sans-serif; font-size: 0.75em; transition: all 0.2s; }
            .lb-subtab:hover { background: rgba(255,255,255,0.08); color: #fff; }
            .lb-subtab.active { background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,140,0,0.2)); color: #FFD700; border-color: rgba(255,215,0,0.4); box-shadow: 0 2px 6px rgba(255,215,0,0.2); }
            .lb-list { display: flex; flex-direction: column; gap: 6px; min-height: 200px; max-height: 60vh; overflow-y: auto; padding-right: 5px; }
            .lb-list::-webkit-scrollbar { width: 6px; }
            .lb-list::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 3px; }
            .lb-list::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.3); border-radius: 3px; }
            .lb-loading { text-align: center; padding: 30px; color: #aaa; }
            .lb-empty { text-align: center; padding: 30px; color: #666; }
            .lb-entry { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; transition: all 0.2s; }
            .lb-rank { font-size: 1.5em; width: 40px; text-align: center; font-family: 'Orbitron', sans-serif; font-weight: bold; }
            .lb-entry.top-1 .lb-rank { color: #FFD700; }
            .lb-entry.top-2 .lb-rank { color: #C0C0C0; }
            .lb-entry.top-3 .lb-rank { color: #CD7F32; }
            .lb-rank-number { color: #4FC3F7; font-size: 1.1em; }
            .lb-info { flex: 1; min-width: 0; }
            .lb-name { font-size: 0.9em; color: #fff; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .lb-level { font-size: 0.7em; color: #aaa; font-family: 'Orbitron', monospace; margin-top: 2px; }
            .lb-distance { font-size: clamp(0.75em, 2.5vw, 0.95em); color: #FFD700; font-weight: bold; font-family: 'Orbitron', monospace; text-align: right; white-space: nowrap; max-width: 40%; overflow: hidden; text-overflow: ellipsis; }
            .lb-my-position { margin-top: 10px; padding: 8px 12px; background: linear-gradient(135deg, rgba(79,195,247,0.15), rgba(33,150,243,0.1)); border: 1px solid rgba(79,195,247,0.3); border-radius: 10px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
            .lb-my-position-label { font-size: 0.75em; color: #4FC3F7; font-family: 'Orbitron', sans-serif; line-height: 1.2; }
            .lb-my-position-value { font-size: 1em; color: #fff; font-weight: bold; font-family: 'Orbitron', monospace; line-height: 1.2; }
            @keyframes lbSlideIn { from { opacity: 0; transform: translate(-50%, -45%) scale(0.95); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
            .lb-modal.active { animation: lbSlideIn 0.3s ease-out; }
        `;
        document.head.appendChild(style);
    },

    // ═══════════════════════════════════════
    // МОДАЛЬНОЕ ОКНО (с A11y: Focus Trap + Escape)
    // ═══════════════════════════════════════
    
    // Ссылки на обработчики для корректного removeEventListener
    _escHandler: null,
    _focusTrapHandler: null,
    _ownsPause: false,
    _previousFocus: null, // элемент, который имел фокус до открытия модалки

    createModal: function() {
        if (document.getElementById('leaderboardModal')) return;

        const modal = document.createElement('div');
        modal.id = 'leaderboardModal';
        modal.className = 'lb-modal';
        
        // ✅ A11y: ARIA-атрибуты для модального окна
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'lbTitle');

        modal.innerHTML = `
            <div class="lb-header">
                <h3 class="lb-title" id="lbTitle">🏆 Таблица лидеров</h3>
                <button class="lb-close" id="lbCloseBtn" type="button" aria-label="Закрыть таблицу лидеров">✕</button>
            </div>
            <div class="lb-tabs" role="tablist" aria-label="Периоды лидерборда">
                <button class="lb-tab" role="tab" aria-selected="false" data-period="blocks">Блоков<br><small style="font-size:0.7em;opacity:0.7">уничтожено</small></button>
                <button class="lb-tab" role="tab" aria-selected="false" data-period="distance">Расстояние<br><small style="font-size:0.7em;opacity:0.7">в км</small></button>
                <button class="lb-tab active" role="tab" aria-selected="true" data-period="time">Время<br><small style="font-size:0.7em;opacity:0.7">в игре</small></button>
            </div>
            <div class="lb-subtabs" id="lbBlockSubtabs" style="display:none;" role="tablist">
                <button class="lb-subtab" role="tab" aria-selected="false" data-block-period="daily">Сутки</button>
                <button class="lb-subtab" role="tab" aria-selected="false" data-block-period="weekly">7 дней</button>
                <button class="lb-subtab active" role="tab" aria-selected="true" data-block-period="total">Всё время</button>
            </div>
            <div class="lb-subtabs" id="lbDistanceSubtabs" style="display:none;" role="tablist">
                <button class="lb-subtab" role="tab" aria-selected="false" data-distance-period="daily">Сутки</button>
                <button class="lb-subtab" role="tab" aria-selected="false" data-distance-period="weekly">7 дней</button>
                <button class="lb-subtab active" role="tab" aria-selected="true" data-distance-period="total">Всё время</button>
            </div>
            <div class="lb-list" id="lbList" role="list" aria-live="polite" aria-label="Список лидеров">
                <div class="lb-loading" role="status">⏳ Загрузка...</div>
            </div>
            <div class="lb-my-position" id="lbMyPosition" style="display:none;">
                <div>
                    <div class="lb-my-position-label">Ваша позиция</div>
                    <div class="lb-my-position-value" id="lbMyRank">#—</div>
                </div>
                <div>
                    <div class="lb-my-position-label">Ваш результат</div>
                    <div class="lb-my-position-value" id="lbMyDistance">0</div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // ─── Базовые обработчики ───
        const closeBtn = document.getElementById('lbCloseBtn');
        closeBtn.addEventListener('click', () => this.hideModal());
        closeBtn.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            this.hideModal(); 
        }, { passive: false });

        modal.querySelectorAll('.lb-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchPeriod(tab.dataset.period));
            tab.addEventListener('touchstart', (e) => { 
                e.preventDefault(); 
                this.switchPeriod(tab.dataset.period); 
            }, { passive: false });
        });

        const blockSubtabs = document.getElementById('lbBlockSubtabs');
        if (blockSubtabs) {
            blockSubtabs.querySelectorAll('.lb-subtab').forEach(tab => {
                tab.addEventListener('click', () => this.switchBlockPeriod(tab.dataset.blockPeriod));
                tab.addEventListener('touchstart', (e) => { 
                    e.preventDefault(); 
                    this.switchBlockPeriod(tab.dataset.blockPeriod); 
                }, { passive: false });
            });
        }

        const distanceSubtabs = document.getElementById('lbDistanceSubtabs');
        if (distanceSubtabs) {
            distanceSubtabs.querySelectorAll('.lb-subtab').forEach(tab => {
                tab.addEventListener('click', () => this.switchDistancePeriod(tab.dataset.distancePeriod));
                tab.addEventListener('touchstart', (e) => { 
                    e.preventDefault(); 
                    this.switchDistancePeriod(tab.dataset.distancePeriod); 
                }, { passive: false });
            });
        }

        // Закрытие по клику на фон
        modal.addEventListener('click', (e) => { 
            if (e.target === modal) this.hideModal(); 
        });

        // ✅ A11y: Focus Trap — Tab не выходит за пределы модалки
        this._focusTrapHandler = (e) => {
            if (e.key !== 'Tab') return;
            
            const focusableSelectors = [
                'button:not([disabled])',
                '[href]',
                'input:not([disabled])',
                'select:not([disabled])',
                'textarea:not([disabled])',
                '[tabindex]:not([tabindex="-1"])'
            ].join(', ');
            
            const focusableElements = modal.querySelectorAll(focusableSelectors);
            if (focusableElements.length === 0) return;
            
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey) {
                // Shift+Tab: если на первом элементе → переходим на последний
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                // Tab: если на последнем элементе → переходим на первый
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        };
        modal.addEventListener('keydown', this._focusTrapHandler);
    },

    showModal: async function() {
        this.injectStyles();
        this.createModal();
        
        const modal = document.getElementById('leaderboardModal');
        if (!modal) return;
        
        // ✅ A11y: запоминаем элемент, который имел фокус до открытия
        this._previousFocus = document.activeElement;
        
        modal.classList.add('active');
        this.modalVisible = true;
        
        // ✅ Патч 3: Условная пауза игры
        const core = window.GAME_CORE;
        if (core?.pauseGame && core.gameActive && !core.isPaused?.()) {
            core.pauseGame();
            this._ownsPause = true;
        }
        
        // ✅ A11y: Обработчик Escape
        this._escHandler = (e) => {
            if (e.key === 'Escape' && this.modalVisible) {
                this.hideModal();
            }
        };
        document.addEventListener('keydown', this._escHandler);
        
        // ✅ A11y: автофокус на кнопку закрытия (первый интерактивный элемент)
        const closeBtn = document.getElementById('lbCloseBtn');
        if (closeBtn) {
            // Небольшая задержка, чтобы CSS-анимация не мешала фокусу
            setTimeout(() => closeBtn.focus(), 50);
        }
        
        await this.loadAndRender(this.currentPeriod);
    },

       hideModal: function() {
        const modal = document.getElementById('leaderboardModal');
        if (modal) modal.classList.remove('active');
        this.modalVisible = false;
        
        // ✅ Патч 3: Снимаем с паузы ТОЛЬКО если мы сами её ставили
        if (this._ownsPause && window.GAME_CORE?.resumeGame) {
            window.GAME_CORE.resumeGame();
            this._ownsPause = false;
        }
        
        // ✅ A11y: убираем глобальный обработчик Escape
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler);
            this._escHandler = null;
        }
        
        // ✅ A11y: возвращаем фокус на элемент, который был активен до открытия
        if (this._previousFocus && typeof this._previousFocus.focus === 'function') {
            setTimeout(() => {
                try { this._previousFocus.focus(); } catch (e) {}
            }, 50);
            this._previousFocus = null;
        }
    },

    // ✅ Патч 8: Алиас для обратной совместимости с tutorial.js и внешними модулями
    // tutorial.js вызывает Leaderboard.close?.() — без этого метода туториал "зависает"
    close: function() {
        this.hideModal();
    },

    switchPeriod: async function(period) {
        this.currentPeriod = period;
        document.querySelectorAll('.lb-tab').forEach(t => {
            const isActive = t.dataset.period === period;
            t.classList.toggle('active', isActive);
            // ✅ A11y: обновляем aria-selected
            t.setAttribute('aria-selected', isActive.toString());
        });

        const blockSubtabs = document.getElementById('lbBlockSubtabs');
        const distanceSubtabs = document.getElementById('lbDistanceSubtabs');
        if (blockSubtabs) blockSubtabs.style.display = period === 'blocks' ? 'flex' : 'none';
        if (distanceSubtabs) distanceSubtabs.style.display = period === 'distance' ? 'flex' : 'none';

        let subPeriod;
        if (period === 'blocks') subPeriod = this.currentBlockPeriod;
        else if (period === 'distance') subPeriod = this.currentDistancePeriod;

        await this.loadAndRender(period, subPeriod);
    },

    switchBlockPeriod: async function(period) {
        this.currentBlockPeriod = period;
        const subtabs = document.getElementById('lbBlockSubtabs');
        if (subtabs) subtabs.querySelectorAll('.lb-subtab').forEach(t => {
            const isActive = t.dataset.blockPeriod === period;
            t.classList.toggle('active', isActive);
            t.setAttribute('aria-selected', isActive.toString());
        });
        await this.loadAndRender('blocks', period);
    },

    switchDistancePeriod: async function(period) {
        this.currentDistancePeriod = period;
        const subtabs = document.getElementById('lbDistanceSubtabs');
        if (subtabs) subtabs.querySelectorAll('.lb-subtab').forEach(t => {
            const isActive = t.dataset.distancePeriod === period;
            t.classList.toggle('active', isActive);
            t.setAttribute('aria-selected', isActive.toString());
        });
        await this.loadAndRender('distance', period);
    },
    // ═══════════════════════════════════════
    // ОТРИСОВКА (УПРОЩЕНА — сервер даёт всё)
    // ═══════════════════════════════════════
    loadAndRender: async function(period, subPeriod) {
        const list = document.getElementById('lbList');
        list.innerHTML = '<div class="lb-loading">⏳ Загрузка...</div>';

        console.log('🔍 [LB] Загрузка:', period, subPeriod);

        const result = await this.fetchLeaderboard(period, subPeriod);
        console.log('🔍 [LB] Результат:', result);

        if (!result?.success || !result.data || result.data.length === 0) {
            list.innerHTML = '<div class="lb-empty"> Пока нет данных<br><span style="font-size:0.8em;color:#666">Станьте первым!</span></div>';
            document.getElementById('lbMyPosition').style.display = 'none';
            return;
        }

        const entries = result.data;
        const myUserId = window.getUserId ? window.getUserId() : null;
        let html = '';

        const planetEmojis = {
            mercury: '☿', venus: '♀', earth: '', mars: '♂',
            jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: ''
        };

        entries.forEach((entry, idx) => {
            const rank = idx + 1;
            const isMe = myUserId && String(entry.userId) === String(myUserId);

            let rankClass = '';
            let rankDisplay = '';
            if (rank === 1) { rankClass = 'top-1'; rankDisplay = '👑'; }
            else if (rank === 2) { rankClass = 'top-2'; rankDisplay = '🥈'; }
            else if (rank === 3) { rankClass = 'top-3'; rankDisplay = '🥉'; }
            else { rankDisplay = `<span class="lb-rank-number">#${rank}</span>`; }

            if (isMe) rankClass += ' is-me';

            const val = entry[period] || 0;
            const formatted = this.formatDistance(val, period);
            const emoji = planetEmojis[entry.level] || '🪐';

const VALID_PLANETS = new Set([
    'mercury', 'venus', 'earth', 'mars', 'jupiter',
    'saturn', 'uranus', 'neptune', 'pluto', 'heliopause'
]);

// Внутри forEach:
const rawLevel = entry.level || 'mercury';
const safeLevel = VALID_PLANETS.has(rawLevel) ? rawLevel : 'mercury';

html += `
    <div class="lb-entry ${rankClass}">
        <div class="lb-rank">${rankDisplay}</div>
        <div class="lb-info">
            <div class="lb-name">${this.escapeHtml(entry.username || 'Anonymous')}</div>
            <div class="lb-level">${emoji} ${safeLevel}</div>
        </div>
        <div class="lb-distance">${formatted}</div>
    </div>
`;
        });

        list.innerHTML = html;

        // ── Моя позиция (данные от сервера) ──
        const myPosBlock = document.getElementById('lbMyPosition');
        myPosBlock.style.display = 'flex';

        if (result.myRank > 0) {
            document.getElementById('lbMyRank').textContent = `#${result.myRank}`;
            document.getElementById('lbMyRank').style.color = '#4FC3F7';
        } else {
            document.getElementById('lbMyRank').textContent = 'вне топ-50';
            document.getElementById('lbMyRank').style.color = '#999';
        }

        document.getElementById('lbMyDistance').textContent = this.formatDistance(result.myScore || 0, period);
    },

    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // ═══════════════════════════════════════
    // 🚀 ИНИЦИАЛИЗАЦИЯ (с защитой от дублирования)
    // ═══════════════════════════════════════
    init: function() {
        this.injectStyles();
        this.createModal();

        // ✅ Патч 7: защита от дублирования интервалов при повторном init()
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }

        this._intervalId = setInterval(() => {
            if (window.gameState?.gameActive) {
                this.submitToLeaderboard();
            }
        }, this.config.submitInterval);

        // ✅ Патч 6: подписка на оба события EventBus
        if (window.EventBus) {
            // Удаляем старые подписки, если они были (защита от дублей)
            if (this._onSaveReady) window.EventBus.off('save:ready', this._onSaveReady);
            if (this._onSaveCompleted) window.EventBus.off('save:completed', this._onSaveCompleted);

            this._onSaveReady = () => this.submitToLeaderboard();
            this._onSaveCompleted = () => this.submitToLeaderboard();

            window.EventBus.on('save:ready', this._onSaveReady);
            window.EventBus.on('save:completed', this._onSaveCompleted);
        }

        console.log('🏆 Leaderboard v3.1 initialized (server-side ranking)');
    },

    // ═══════════════════════════════════════
    // 🗑️ УНИЧТОЖЕНИЕ МОДУЛЯ (очистка всех ресурсов)
    // ═══════════════════════════════════════
    destroy: function() {
        // 1. Останавливаем интервал отправки
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }

        // 2. Отписываемся от EventBus
        if (window.EventBus) {
            if (this._onSaveReady) {
                window.EventBus.off('save:ready', this._onSaveReady);
                this._onSaveReady = null;
            }
            if (this._onSaveCompleted) {
                window.EventBus.off('save:completed', this._onSaveCompleted);
                this._onSaveCompleted = null;
            }
        }

        // 3. Убираем глобальный обработчик Escape (из Патча 4)
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler);
            this._escHandler = null;
        }

        // 4. Убираем focus trap (из Патча 4)
        const modal = document.getElementById('leaderboardModal');
        if (modal && this._focusTrapHandler) {
            modal.removeEventListener('keydown', this._focusTrapHandler);
            this._focusTrapHandler = null;
        }

        // 5. Удаляем DOM-элементы модалки и стилей
        if (modal) modal.remove();
        const styles = document.getElementById('leaderboard-styles');
        if (styles) styles.remove();

        // 6. Сбрасываем состояние
        this.modalVisible = false;
        this._ownsPause = false;
        this._previousFocus = null;
        this.lastSubmitTime = 0;

        console.log('🗑️ [LB] Leaderboard destroyed — all resources cleaned up');
    }
};

window.Leaderboard = Leaderboard;

// ═══════════════════════════════════════
// 🚪 АВТОЗАПУСК С ЗАЩИТОЙ ОТ ПОВТОРНОЙ ИНИЦИАЛИЗАЦИИ
// ═══════════════════════════════════════
(function autoInit() {
    // Если модуль уже был инициализирован — уничтожаем старый перед перезапуском
    if (window.Leaderboard && window.Leaderboard._intervalId) {
        console.warn('⚠️ [LB] Re-initialization detected, destroying previous instance');
        window.Leaderboard.destroy();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(() => Leaderboard.init(), 300));
    } else {
        setTimeout(() => Leaderboard.init(), 300);
    }
})();
