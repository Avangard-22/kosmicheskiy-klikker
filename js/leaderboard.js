// js/leaderboard.js
// ═══════════════════════════════════════════════════
// 🏆 ТАБЛИЦА ЛИДЕРОВ С ПРИВЯЗКОЙ К DAILY BONUS
// ЧТО: Отслеживает прогресс за 24ч, 7 дней и всё время
// ЗАЧЕМ: Мотивация игроков соревноваться друг с другом
// ИНТЕГРАЦИЯ: Работает с daily-bonus.js и telegram-integration.js
// ══════════════════════════════════════════════════
(function() {
'use strict';

const Leaderboard = {
    // ── Настройки ──
    config: {
        submitInterval: 30000,  // Отправка каждые 30 секунд
        maxEntries: 50,         // Максимум записей в топе
        periods: ['daily', 'weekly', 'global']
    },
    
    // ── Состояние ──
    currentPeriod: 'global',
    modalVisible: false,
    cachedData: { daily: null, weekly: null, global: null },
    
// ═══════════════════════════════════════════════
// 🔢 ФОРМАТИРОВАНИЕ РАССТОЯНИЯ
// ═══════════════════════════════════════════════
formatDistance: function(num, period = 'global') {
    if (!num || num <= 0) return '0';
    
    const AU_TO_DAMAGE = window.GAME_CONFIG?.AU_TO_DAMAGE || 149597870.691;
    
    // Для 24 часов и 7 дней — показываем в а.е. с точностью
    if (period === 'daily' || period === 'weekly') {
        const au = num / AU_TO_DAMAGE;
        
        if (period === 'daily') {
            // 24 часа: точность до 6 знаков (0.000001 а.е.)
            if (au < 0.000001) return '< 0.000001 а.е.';
            if (au < 0.001) return au.toFixed(6) + ' а.е.';
            if (au < 1) return au.toFixed(4) + ' а.е.';
            if (au < 1000) return au.toFixed(2) + ' а.е.';
            return au.toFixed(1) + ' а.е.';
        } else {
            // 7 дней: точность до 4 знаков
            if (au < 0.0001) return '< 0.0001 а.е.';
            if (au < 0.01) return au.toFixed(4) + ' а.е.';
            if (au < 1) return au.toFixed(3) + ' а.е.';
            if (au < 1000) return au.toFixed(2) + ' а.е.';
            return au.toFixed(1) + ' а.е.';
        }
    }
    
    // Для "Всё время" — километры с сокращениями
    const km = num / 1000; // переводим из метров в км
    
    if (km >= 1000000000) {
        return (km / 1000000000).toFixed(2) + 'B км';
    }
    if (km >= 1000000) {
        return (km / 1000000).toFixed(2) + 'M км';
    }
    if (km >= 1000) {
        return (km / 1000).toFixed(2) + 'K км';
    }
    if (km >= 100) {
        return km.toFixed(1) + ' км';
    }
    return Math.floor(km).toLocaleString() + ' км';
},
    
    // ═══════════════════════════════════════════════
    //  ПОДСЧЁТ РАССТОЯНИЯ ПО ПЕРИОДАМ
    // ═══════════════════════════════════════════════
    calculateDistances: function() {
        const gs = window.gameState;
        const gm = window.gameMetrics;
        if (!gs || !gm) return { daily: 0, weekly: 0, global: 0 };
        
        const totalDamage = gs.totalDamageDealt || 0;
        const dailyProgress = gm.dailyProgress || {
            currentDayStart: Date.now(),
            dayStartDamage: 0,
            history: []
        };
        
        // ── За сегодня (24ч от активации daily bonus) ──
        const daily = Math.max(0, totalDamage - (dailyProgress.dayStartDamage || 0));
        
        // ── За 7 дней (сумма истории + сегодня) ──
        let weekly = daily;
        const history = dailyProgress.history || [];
        const now = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        history.forEach(day => {
            if (day.timestamp && (now - day.timestamp) <= sevenDaysMs) {
                weekly += (day.damage || 0);
            }
        });
        
        // ── Общее расстояние (всё время) ──
        const global = totalDamage;
        
        return { daily, weekly, global };
    },
    
    // ═══════════════════════════════════════════════
    // 🔄 ОБНОВЛЕНИЕ ИСТОРИИ ДНЕЙ
    // ══════════════════════════════════════════════
    updateDailyHistory: function() {
        const gm = window.gameMetrics;
        if (!gm) return;
        
        if (!gm.dailyProgress) {
            gm.dailyProgress = {
                currentDayStart: Date.now(),
                dayStartDamage: window.gameState?.totalDamageDealt || 0,
                history: []
            };
            return;
        }
        
        // Проверяем, не прошёл ли день (24ч с currentDayStart)
        const dayMs = 24 * 60 * 60 * 1000;
        const now = Date.now();
        const elapsed = now - gm.dailyProgress.currentDayStart;
        
        if (elapsed >= dayMs) {
            // Сохраняем вчерашний день в историю
            const yesterdayDamage = (window.gameState?.totalDamageDealt || 0) - (gm.dailyProgress.dayStartDamage || 0);
            gm.dailyProgress.history.push({
                date: new Date(gm.dailyProgress.currentDayStart).toISOString().split('T')[0],
                timestamp: gm.dailyProgress.currentDayStart,
                damage: Math.max(0, yesterdayDamage)
            });
            
            // Оставляем только последние 7 дней
            if (gm.dailyProgress.history.length > 7) {
                gm.dailyProgress.history = gm.dailyProgress.history.slice(-7);
            }
            
            // Начинаем новый день
            gm.dailyProgress.currentDayStart = now;
            gm.dailyProgress.dayStartDamage = window.gameState?.totalDamageDealt || 0;
            
            console.log('📅 [LEADERBOARD] Новый день начался, вчерашний прогресс:', yesterdayDamage);
        }
    },
    
    // ═══════════════════════════════════════════════
    // 📤 ОТПРАВКА РЕЗУЛЬТАТОВ В ОБЛАКО
    // ═══════════════════════════════════════════════
    lastSubmitTime: 0,
    
    submitToLeaderboard: async function() {
        if (!window.telegramCloud?.isAvailable) return;
        const now = Date.now();
        if (now - this.lastSubmitTime < this.config.submitInterval) return;
        
        const distances = this.calculateDistances();
        const username = window.getTelegramUsername ? window.getTelegramUsername() : 'Anonymous';
        const userId = window.getUserId ? window.getUserId() : null;
        
        try {
            const result = await window.telegramCloud.submitLeaderboard({
                daily: Math.floor(distances.daily),
                weekly: Math.floor(distances.weekly),
                global: Math.floor(distances.global),
                username: username,
                userId: userId,
                level: window.gameState?.currentLocation || 'mercury'
            });
            
            if (result?.success) {
                this.lastSubmitTime = now;
                console.log('🏆 [LEADERBOARD] Результат отправлен:', distances);
            }
        } catch (e) {
            console.warn('⚠️ [LEADERBOARD] Ошибка отправки:', e);
        }
    },
    
    // ═══════════════════════════════════════════════
    //  ЗАГРУЗКА ТОП ИЗ ОБЛАКА
    // ═══════════════════════════════════════════════
    fetchLeaderboard: async function(period = 'global') {
        if (!window.telegramCloud?.isAvailable) {
            return { success: false, data: [], error: 'Cloud unavailable' };
        }
        
        try {
            const result = await window.telegramCloud.getLeaderboard(period, this.config.maxEntries);
            return result;
        } catch (e) {
            console.warn('️ [LEADERBOARD] Ошибка загрузки:', e);
            return { success: false, data: [], error: e.message };
        }
    },
    
    // ═══════════════════════════════════════════════
    //  РЕНДЕР UI
    // ══════════════════════════════════════════════
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
            .leaderboard-btn:hover { background: linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,140,0,0.3)); transform: scale(1.02); }
            .leaderboard-btn:active { transform: scale(0.98); }
            
            .lb-modal {
                position: fixed;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 92vw; max-width: 500px; max-height: 85vh;
                background: rgba(10, 8, 20, 0.98);
                border-radius: 16px;
                padding: 16px;
                border: 2px solid rgba(255,215,0,0.3);
                box-shadow: 0 10px 60px rgba(0,0,0,0.8);
                z-index: 3000;
                display: none;
                flex-direction: column;
                gap: 10px;
                backdrop-filter: blur(10px);
                overflow-y: auto;
                font-family: system-ui, sans-serif;
            }
            .lb-modal.active { display: flex; }
            
            .lb-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            .lb-title { margin: 0; color: #FFD700; font-family: 'Orbitron', sans-serif; font-size: 1.2em; }
            .lb-close { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 1em; display: flex; align-items: center; justify-content: center; }
            .lb-close:hover { background: rgba(244,67,54,0.3); }
            
            .lb-tabs {
                display: flex;
                gap: 6px;
                margin-bottom: 12px;
            }
            .lb-tab {
                flex: 1;
                padding: 10px 8px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                cursor: pointer;
                text-align: center;
                color: #aaa;
                font-weight: bold;
                font-family: 'Orbitron', sans-serif;
                font-size: 0.85em;
                transition: all 0.2s;
            }
            .lb-tab:hover { background: rgba(255,255,255,0.1); color: #fff; }
            .lb-tab.active {
                background: linear-gradient(135deg, #FFD700, #FF8C00);
                color: #000;
                border-color: #FFD700;
                box-shadow: 0 2px 8px rgba(255,215,0,0.4);
            }
            
            .lb-list { display: flex; flex-direction: column; gap: 6px; min-height: 200px; }
            .lb-loading { text-align: center; padding: 30px; color: #aaa; }
            .lb-empty { text-align: center; padding: 30px; color: #666; }
            
            .lb-entry {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 12px;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 10px;
                transition: all 0.2s;
            }
            .lb-entry.top-1 { background: linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,140,0,0.1)); border-color: #FFD700; box-shadow: 0 0 10px rgba(255,215,0,0.3); }
            .lb-entry.top-2 { background: linear-gradient(135deg, rgba(192,192,192,0.15), rgba(150,150,150,0.1)); border-color: #C0C0C0; }
            .lb-entry.top-3 { background: linear-gradient(135deg, rgba(205,127,50,0.15), rgba(160,100,40,0.1)); border-color: #CD7F32; }
            .lb-entry.is-me { background: linear-gradient(135deg, rgba(79,195,247,0.2), rgba(33,150,243,0.15)); border-color: #4FC3F7; box-shadow: 0 0 10px rgba(79,195,247,0.3); }
            
            .lb-rank {
                font-size: 1.5em;
                width: 40px;
                text-align: center;
                font-family: 'Orbitron', sans-serif;
                font-weight: bold;
            }
            .lb-entry.top-1 .lb-rank { color: #FFD700; }
            .lb-entry.top-2 .lb-rank { color: #C0C0C0; }
            .lb-entry.top-3 .lb-rank { color: #CD7F32; }
            .lb-rank-number { color: #4FC3F7; font-size: 1.1em; }
            
            .lb-info { flex: 1; min-width: 0; }
            .lb-name { font-size: 0.9em; color: #fff; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .lb-level { font-size: 0.7em; color: #aaa; font-family: 'Orbitron', monospace; margin-top: 2px; }
            
            .lb-distance {
                font-size: 0.9em;
                color: #FFD700;
                font-weight: bold;
                font-family: 'Orbitron', monospace;
                text-align: right;
                white-space: nowrap;
            }
            
            .lb-my-position {
                margin-top: 12px;
                padding: 12px;
                background: linear-gradient(135deg, rgba(79,195,247,0.15), rgba(33,150,243,0.1));
                border: 1px solid rgba(79,195,247,0.3);
                border-radius: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .lb-my-position-label { font-size: 0.8em; color: #4FC3F7; font-family: 'Orbitron', sans-serif; }
            .lb-my-position-value { font-size: 1.1em; color: #fff; font-weight: bold; font-family: 'Orbitron', monospace; }
            
            @keyframes lbSlideIn {
                from { opacity: 0; transform: translate(-50%, -45%) scale(0.95); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            .lb-modal.active { animation: lbSlideIn 0.3s ease-out; }
        `;
        document.head.appendChild(style);
    },
    
    createModal: function() {
        if (document.getElementById('leaderboardModal')) return;
        const modal = document.createElement('div');
        modal.id = 'leaderboardModal';
        modal.className = 'lb-modal';
        modal.innerHTML = `
            <div class="lb-header">
                <h3 class="lb-title">🏆 Таблица лидеров</h3>
                <button class="lb-close" id="lbCloseBtn">✕</button>
            </div>
            <div class="lb-tabs">
                <button class="lb-tab" data-period="daily">24 часа</button>
                <button class="lb-tab" data-period="weekly">7 дней</button>
                <button class="lb-tab active" data-period="global">Всё время</button>
            </div>
            <div class="lb-list" id="lbList">
                <div class="lb-loading">⏳ Загрузка...</div>
            </div>
            <div class="lb-my-position" id="lbMyPosition" style="display:none;">
                <div>
                    <div class="lb-my-position-label">Ваша позиция</div>
                    <div class="lb-my-position-value" id="lbMyRank">#—</div>
                </div>
                <div>
                    <div class="lb-my-position-label">Ваше расстояние</div>
                    <div class="lb-my-position-value" id="lbMyDistance">0 а.е.</div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('lbCloseBtn').addEventListener('click', () => this.hideModal());
        document.getElementById('lbCloseBtn').addEventListener('touchstart', (e) => {
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
        
        // Закрытие по клику вне модалки
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideModal();
        });
    },
    
    showModal: async function() {
        this.injectStyles();
        this.createModal();
        const modal = document.getElementById('leaderboardModal');
        modal.classList.add('active');
        this.modalVisible = true;
        
        if (window.GAME_CORE?.pauseGame) window.GAME_CORE.pauseGame();
        
        await this.loadAndRender(this.currentPeriod);
    },
    
    hideModal: function() {
        const modal = document.getElementById('leaderboardModal');
        if (modal) modal.classList.remove('active');
        this.modalVisible = false;
        
        if (window.GAME_CORE?.resumeGame) window.GAME_CORE.resumeGame();
    },
    
    switchPeriod: async function(period) {
        this.currentPeriod = period;
        document.querySelectorAll('.lb-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.period === period);
        });
        await this.loadAndRender(period);
    },
    
    loadAndRender: async function(period) {
        const list = document.getElementById('lbList');
        list.innerHTML = '<div class="lb-loading">⏳ Загрузка...</div>';
        
        const result = await this.fetchLeaderboard(period);
        
        if (!result?.success || !result.data || result.data.length === 0) {
            list.innerHTML = '<div class="lb-empty">📭 Пока нет данных<br><span style="font-size:0.8em;color:#666">Станьте первым!</span></div>';
            document.getElementById('lbMyPosition').style.display = 'none';
            return;
        }
        
        const entries = result.data;
        const myUserId = window.getUserId ? window.getUserId() : null;
        const myUsername = window.getTelegramUsername ? window.getTelegramUsername() : 'Anonymous';
        
        let html = '';
        let myPosition = null;
        let myDistance = 0;
        
        const planetEmojis = {
            mercury: '', venus: '♀', earth: '', mars: '♂',
            jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇', heliosphere: '🌌'
        };
        
        entries.forEach((entry, idx) => {
            const rank = idx + 1;
            const isMe = (myUserId && entry.userId == myUserId) || 
                         (!myUserId && entry.username === myUsername);
            
            let rankClass = '';
            let rankDisplay = '';
            if (rank === 1) { rankClass = 'top-1'; rankDisplay = '👑'; }
            else if (rank === 2) { rankClass = 'top-2'; rankDisplay = '🥈'; }
            else if (rank === 3) { rankClass = 'top-3'; rankDisplay = '🥉'; }
            else { rankClass = ''; rankDisplay = `<span class="lb-rank-number">#${rank}</span>`; }
            
            if (isMe) {
                rankClass += ' is-me';
                myPosition = rank;
                myDistance = entry[period] || 0;
            }
            
            const distance = entry[period] || 0;
            const planetEmoji = planetEmojis[entry.level] || '🪐';
            
            html += `
                <div class="lb-entry ${rankClass}">
                    <div class="lb-rank">${rankDisplay}</div>
                    <div class="lb-info">
                        <div class="lb-name">${this.escapeHtml(entry.username || 'Anonymous')}</div>
                        <div class="lb-level">${planetEmoji} ${entry.level || 'mercury'}</div>
                    </div>
                    <div class="lb-distance">${this.formatDistance(distance)}</div>
                </div>
            `;
        });
        
        list.innerHTML = html;
        
        // Показываем свою позицию
        const myPosBlock = document.getElementById('lbMyPosition');
        const distances = this.calculateDistances();
        const myDist = distances[period] || 0;
        
        if (myPosition || myDist > 0) {
            myPosBlock.style.display = 'flex';
            document.getElementById('lbMyRank').textContent = myPosition ? `#${myPosition}` : '—';
            document.getElementById('lbMyDistance').textContent = this.formatDistance(myDist);
        } else {
            myPosBlock.style.display = 'none';
        }
    },
    
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // ═══════════════════════════════════════════════
    // 🚀 ИНИЦИАЛИЗАЦИЯ
    // ═══════════════════════════════════════════════
    init: function() {
        this.injectStyles();
        this.createModal();
        this.updateDailyHistory();
        
        // Автоотправка каждые 30 секунд во время игры
        setInterval(() => {
            if (window.gameState?.gameActive) {
                this.updateDailyHistory();
                this.submitToLeaderboard();
            }
        }, this.config.submitInterval);
        
        // Подписка на события
        if (window.EventBus) {
            // Отправка при сохранении
            window.EventBus.on('save:completed', () => {
                this.submitToLeaderboard();
            });
        }
        
        console.log('🏆 Leaderboard initialized');
    }
};

// ── Экспорт ──
window.Leaderboard = Leaderboard;

// ── Автозапуск ──
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => Leaderboard.init(), 300));
} else {
    setTimeout(() => Leaderboard.init(), 300);
}

})();
