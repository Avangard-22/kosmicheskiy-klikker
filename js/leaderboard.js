// js/leaderboard.js
// ═══════════════════════════════════════════════════
// 🏆 ТАБЛИЦА ЛИДЕРОВ С ПРИВЯЗКОЙ К DAILY BONUS
// ЧТО: Отслеживает прогресс за 24ч, 7 дней и всё время
// ЗАЧЕМ: Мотивация игроков соревноваться друг с другом
// ИНТЕГРАЦИЯ: Работает с daily-bonus.js и telegram-integration.js
// ══════════════════════════════════════════════════
// js/leaderboard.js (v2.0 — отслеживание ВСЕХ игроков)
(function() {
'use strict';

const Leaderboard = {
    config: {
        submitInterval: 30000,
        maxEntries: 50,
        mainPeriods: ['blocks', 'distance', 'time'],
        blockSubPeriods: ['daily', 'weekly', 'total'] // Под-периоды для блоков
    },
    
    currentPeriod: 'time',
    currentBlockPeriod: 'total', // Текущий под-период для блоков
    modalVisible: false,
    
    formatDistance: function(num, period = 'time') {
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
    
    calculateDistances: function(period = 'total') {
        const gs = window.gameState;
        const gm = window.gameMetrics;
        
        // ✅ Для "24 часа" и "7 дней" используем dailyProgress
        if (period === 'daily' || period === 'weekly') {
            if (!gm || !gm.dailyProgress) return { blocks: 0, distance: 0, time: 0 };
            
            const totalDamage = gs?.totalDamageDealt || 0;
            const dp = gm.dailyProgress;
            
            // За сегодня
            const todayDamage = Math.max(0, totalDamage - (dp.dayStartDamage || 0));
            
            if (period === 'daily') {
                return { 
                    blocks: Math.floor(todayDamage), // 1 урон = 1 блок (упрощенно)
                    distance: Math.floor(todayDamage), // 1 урон = 1 км
                    time: 0 // Время за сегодня не считаем
                };
            }
            
            // За 7 дней (сумма истории + сегодня)
            let weeklyDamage = todayDamage;
            const now = Date.now();
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
            
            if (dp.history && Array.isArray(dp.history)) {
                dp.history.forEach(day => {
                    if (day.timestamp && (now - day.timestamp) <= sevenDaysMs) {
                        weeklyDamage += (day.damage || 0);
                    }
                });
            }
            
            return { 
                blocks: Math.floor(weeklyDamage),
                distance: Math.floor(weeklyDamage),
                time: 0
            };
        }
        
        // ✅ Для "Всё время" используем gameState.totalDamageDealt (источник правды)
        const totalDamage = gs?.totalDamageDealt || 0;
        
        // Для времени используем gameMetrics.planetStats
        let totalTime = 0;
        if (gm && gm.planetStats) {
            Object.values(gm.planetStats).forEach(planet => {
                totalTime += (planet.timePlayed || 0);
            });
        }
        
        // Для блоков используем achievementsV2 (там есть разделение blocks/rare)
        let totalBlocks = 0;
        const achV2 = gs?.achievementsV2;
        if (achV2) {
            Object.values(achV2).forEach(planetAch => {
                const metrics = planetAch?.metrics || {};
                totalBlocks += (metrics.blocks?.progress || 0) + (metrics.rare?.progress || 0);
            });
        }
        
        return { 
            blocks: Math.floor(totalBlocks),
            distance: Math.floor(totalDamage), // ✅ 1 урон = 1 км
            time: Math.floor(totalTime)
        };
    },
    
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
        
        const dayMs = 24 * 60 * 60 * 1000;
        const now = Date.now();
        const elapsed = now - gm.dailyProgress.currentDayStart;
        
        if (elapsed >= dayMs) {
            const yesterdayDamage = (window.gameState?.totalDamageDealt || 0) - (gm.dailyProgress.dayStartDamage || 0);
            gm.dailyProgress.history.push({
                date: new Date(gm.dailyProgress.currentDayStart).toISOString().split('T')[0],
                timestamp: gm.dailyProgress.currentDayStart,
                damage: Math.max(0, yesterdayDamage)
            });
            
            if (gm.dailyProgress.history.length > 7) {
                gm.dailyProgress.history = gm.dailyProgress.history.slice(-7);
            }
            
            gm.dailyProgress.currentDayStart = now;
            gm.dailyProgress.dayStartDamage = window.gameState?.totalDamageDealt || 0;
            
            console.log('📅 [LEADERBOARD] Новый день начался');
        }
    },
    
    lastSubmitTime: 0,
    
    submitToLeaderboard: async function() {
        if (!window.telegramCloud?.isAvailable) return;
        const now = Date.now();
        if (now - this.lastSubmitTime < this.config.submitInterval) return;
        
        const distances = this.calculateDistances();
        const username = window.getTelegramUsername ? window.getTelegramUsername() : 'Anonymous';
        const userId = window.getUserId ? window.getUserId() : null;
        
        // ✅ ВАЖНО: Проверяем, что userId есть (каждый игрок имеет уникальный ID)
        if (!userId) {
            console.warn('⚠️ [LEADERBOARD] userId не найден, пропускаем отправку');
            return;
        }
        
        console.log('🏆 [LEADERBOARD] Отправка результатов:', {
            userId,
            username,
            blocks: distances.blocks,
            distance: distances.distance,
            time: distances.time
        });
        
        try {
            const result = await window.telegramCloud.submitLeaderboard({
                blocks: distances.blocks,
                distance: distances.distance,
                time: distances.time,
                username: username,
                userId: userId,
                level: window.gameState?.currentLocation || 'mercury'
            });
            
            if (result?.success) {
                this.lastSubmitTime = now;
                console.log('✅ [LEADERBOARD] Результат отправлен');
            }
        } catch (e) {
            console.warn('⚠️ [LEADERBOARD] Ошибка отправки:', e);
        }
    },
    
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
                font-family: system-ui, sans-serif;
                overflow: hidden; /* ✅ Убираем скролл с модалки */
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
            
            .lb-tabs { display: flex; gap: 6px; margin-bottom: 12px; }
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
                        .lb-subtabs { 
                display: flex; 
                gap: 4px; 
                margin-bottom: 12px;
                padding: 0 4px;
            }
            
                .lb-subtab {
                flex: 1;
                padding: 8px 6px;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 6px;
                cursor: pointer;
                text-align: center;
                color: #888;
                font-weight: bold;
                font-family: 'Orbitron', sans-serif;
                font-size: 0.75em;
                transition: all 0.2s;
            }
            .lb-subtab:hover { background: rgba(255,255,255,0.08); color: #fff; }
            .lb-subtab.active {
                background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,140,0,0.2));
                color: #FFD700;
                border-color: rgba(255,215,0,0.4);
                box-shadow: 0 2px 6px rgba(255,215,0,0.2);
            }
                
                .lb-list { 
                display: flex; 
                flex-direction: column; 
                gap: 6px; 
                min-height: 200px;
                max-height: 60vh; /* ✅ Ограничиваем высоту */
                overflow-y: auto; /* ✅ Добавляем скролл */
                padding-right: 5px; /* ✅ Отступ для скролла */
            }
            
            /* ✅ Стилизация скроллбара */
            .lb-list::-webkit-scrollbar {
                width: 6px;
            }
            .lb-list::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.05);
                border-radius: 3px;
            }
            .lb-list::-webkit-scrollbar-thumb {
                background: rgba(255,215,0,0.3);
                border-radius: 3px;
            }
            .lb-list::-webkit-scrollbar-thumb:hover {
                background: rgba(255,215,0,0.5);
            }
            .lb-loading { text-align: center; padding: 30px; color: #aaa; }
            .lb-empty { text-align: center; padding: 30px; color: #666; }
            
            .lb-entry {
                display: flex;
                align-items: center;
                gap: 10px; /* ✅ Уменьшили отступ */
                padding: 8px 10px; /* ✅ Уменьшили padding */
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 10px;
                transition: all 0.2s;
            }
            .lb-rank { 
                font-size: 1.3em; /* ✅ Уменьшили размер */
                width: 35px; /* ✅ Уменьшили ширину */
                text-align: center; 
                font-family: 'Orbitron', sans-serif; 
                font-weight: bold; 
            }
            .lb-info { flex: 1; min-width: 0; }
            .lb-name { 
                font-size: 0.85em; /* ✅ Уменьшили шрифт */
                color: #fff; 
                font-weight: bold; 
                white-space: nowrap; 
                overflow: hidden; 
                text-overflow: ellipsis;
                line-height: 1.3;
            }
            .lb-level { 
                font-size: 0.65em; /* ✅ Уменьшили шрифт */
                color: #aaa; 
                font-family: 'Orbitron', monospace; 
                margin-top: 2px;
                line-height: 1.2;
            }
            .lb-distance {
                font-size: clamp(0.7em, 2vw, 0.85em); /* ✅ Уменьшили шрифт */
                color: #FFD700;
                font-weight: bold;
                font-family: 'Orbitron', monospace;
                text-align: right;
                white-space: nowrap;
                max-width: 40%;
                overflow: hidden;
                text-overflow: ellipsis;
                line-height: 1.2;
            }
            
            .lb-rank { font-size: 1.5em; width: 40px; text-align: center; font-family: 'Orbitron', sans-serif; font-weight: bold; }
            .lb-entry.top-1 .lb-rank { color: #FFD700; }
            .lb-entry.top-2 .lb-rank { color: #C0C0C0; }
            .lb-entry.top-3 .lb-rank { color: #CD7F32; }
            .lb-rank-number { color: #4FC3F7; font-size: 1.1em; }
            
            .lb-info { flex: 1; min-width: 0; }
            .lb-name { font-size: 0.9em; color: #fff; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .lb-level { font-size: 0.7em; color: #aaa; font-family: 'Orbitron', monospace; margin-top: 2px; }
            
            .lb-distance {
                font-size: clamp(0.75em, 2.5vw, 0.95em);
                color: #FFD700;
                font-weight: bold;
                font-family: 'Orbitron', monospace;
                text-align: right;
                white-space: nowrap;
                max-width: 40%;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .lb-my-position {
                margin-top: 10px;
                padding: 8px 12px;
                background: linear-gradient(135deg, rgba(79,195,247,0.15), rgba(33,150,243,0.1));
                border: 1px solid rgba(79,195,247,0.3);
                border-radius: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-shrink: 0; /* ✅ Не сжимается */
            }
            .lb-my-position-label { 
                font-size: 0.75em; /* ✅ Уменьшили шрифт */
                color: #4FC3F7; 
                font-family: 'Orbitron', sans-serif;
                line-height: 1.2;
            }
            .lb-my-position-value { 
                font-size: 1em; /* ✅ Уменьшили шрифт */
                color: #fff; 
                font-weight: bold; 
                font-family: 'Orbitron', monospace;
                line-height: 1.2;
            }
            
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
        
        // Создаем HTML структуру
        modal.innerHTML = `
            <div class="lb-header">
                <h3 class="lb-title">🏆 Таблица лидеров</h3>
                <button class="lb-close" id="lbCloseBtn">✕</button>
            </div>
            <div class="lb-tabs">
                <button class="lb-tab" data-period="blocks">Блоков<br><small style="font-size:0.7em;opacity:0.7">уничтожено</small></button>
                <button class="lb-tab" data-period="distance">Расстояние<br><small style="font-size:0.7em;opacity:0.7">в км</small></button>
                <button class="lb-tab active" data-period="time">Время<br><small style="font-size:0.7em;opacity:0.7">в игре</small></button>
            </div>
            
            <div class="lb-subtabs" id="lbBlockSubtabs" style="display:none;">
                <button class="lb-subtab" data-block-period="daily">24 часа</button>
                <button class="lb-subtab" data-block-period="weekly">7 дней</button>
                <button class="lb-subtab active" data-block-period="total">Всё время</button>
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
                    <div class="lb-my-position-label">Ваш результат</div>
                    <div class="lb-my-position-value" id="lbMyDistance">0</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // ✅ Добавляем обработчики событий ПРОГРАММНО
        const closeBtn = document.getElementById('lbCloseBtn');
        closeBtn.addEventListener('click', () => this.hideModal());
        closeBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.hideModal();
        }, { passive: false });
        
        // Главные табы
        modal.querySelectorAll('.lb-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchPeriod(tab.dataset.period));
            tab.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.switchPeriod(tab.dataset.period);
            }, { passive: false });
        });
        
        // ✅ Под-табы для блоков
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
        
        // Обновляем главные табы
        document.querySelectorAll('.lb-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.period === period);
        });
        
        // Показываем/скрываем под-табы только для "blocks"
        const subtabs = document.getElementById('lbBlockSubtabs');
        if (subtabs) {
            subtabs.style.display = period === 'blocks' ? 'flex' : 'none';
        }
        
        // Определяем какой под-период использовать
        const blockPeriod = period === 'blocks' ? this.currentBlockPeriod : undefined;
        
        await this.loadAndRender(period, blockPeriod);
    },
        switchBlockPeriod: async function(period) {
        this.currentBlockPeriod = period;
        
        // Обновляем активный под-таб
        const subtabs = document.getElementById('lbBlockSubtabs');
        if (subtabs) {
            subtabs.querySelectorAll('.lb-subtab').forEach(t => {
                t.classList.toggle('active', t.dataset.blockPeriod === period);
            });
        }
        
        // Перезагружаем таблицу с новым периодом
        await this.loadAndRender('blocks', period);
    },
 loadAndRender: async function(period, blockPeriod = 'total') {
        const list = document.getElementById('lbList');
        list.innerHTML = '<div class="lb-loading">⏳ Загрузка...</div>';
        
        const displayPeriod = period === 'blocks' ? blockPeriod : period;
        console.log(' [LEADERBOARD] Загрузка периода:', period, 'под-период:', blockPeriod);
        
        const result = await this.fetchLeaderboard(period);
        
        console.log('🔍 [LEADERBOARD] Результат:', result);
        
        if (!result?.success || !result.data || result.data.length === 0) {
            list.innerHTML = '<div class="lb-empty">📭 Пока нет данных<br><span style="font-size:0.8em;color:#666">Станьте первым!</span></div>';
            document.getElementById('lbMyPosition').style.display = 'none';
            return;
        }
        
        const entries = result.data;
        const myUserId = window.getUserId ? window.getUserId() : null;
        const myUsername = window.getTelegramUsername ? window.getTelegramUsername() : 'Anonymous';
        
        console.log('🔍 [LEADERBOARD] Текущий пользователь:', { userId: myUserId, username: myUsername });
        
        let html = '';
        let myPosition = null;
        let myDistance = 0;
        
        const planetEmojis = {
            mercury: '☿', venus: '♀', earth: '🌍', mars: '♂',
            jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: ''
        };
        
        entries.forEach((entry, idx) => {
            const rank = idx + 1;
            
            // ✅ ВАЖНО: Сравниваем userId как строки
            const isMe = myUserId && String(entry.userId) === String(myUserId);
            
            let rankClass = '';
            let rankDisplay = '';
            if (rank === 1) { rankClass = 'top-1'; rankDisplay = '👑'; }
            else if (rank === 2) { rankClass = 'top-2'; rankDisplay = '🥈'; }
            else if (rank === 3) { rankClass = 'top-3'; rankDisplay = '🥉'; }
            else { rankClass = ''; rankDisplay = `<span class="lb-rank-number">#${rank}</span>`; }
            
            if (isMe) {
                rankClass += ' is-me';
                myPosition = rank;
                myDistance = entry[period] || 0; // ✅ Сохраняем результат
                console.log('🔍 [LEADERBOARD] Найдён мой результат:', myDistance, 'для периода:', period);
            }
            
            const distance = entry[period] || 0;
            const planetEmoji = planetEmojis[entry.level] || '🪐';
            
            const formattedDistance = this.formatDistance(distance, period);
            
            html += `
                <div class="lb-entry ${rankClass}">
                    <div class="lb-rank">${rankDisplay}</div>
                    <div class="lb-info">
                        <div class="lb-name">${this.escapeHtml(entry.username || 'Anonymous')}</div>
                        <div class="lb-level">${planetEmoji} ${entry.level || 'mercury'}</div>
                    </div>
                    <div class="lb-distance">${formattedDistance}</div>
                </div>
            `;
        });
        
        list.innerHTML = html;
        
        // ✅ Обновляем блок "Ваша позиция"
        const myPosBlock = document.getElementById('lbMyPosition');
        myPosBlock.style.display = 'flex';
        
        if (myPosition) {
            document.getElementById('lbMyRank').textContent = `#${myPosition}`;
            document.getElementById('lbMyRank').style.color = '#4FC3F7';
        } else {
            document.getElementById('lbMyRank').textContent = 'вне топ-50';
            document.getElementById('lbMyRank').style.color = '#999';
        }
        
        // ✅ Обновляем "Ваш результат"
        // Мы уже нашли myDistance из записи таблицы лидеров (entry[period])
        // Используем его, так как сервер возвращает корректные данные для time и distance
        
        // Исключение: для блоков с под-периодами (daily/weekly) сервер пока возвращает total,
        // поэтому для них используем локальный расчет.
        if (period === 'blocks' && (blockPeriod === 'daily' || blockPeriod === 'weekly')) {
            const localDistances = this.calculateDistances(blockPeriod);
            document.getElementById('lbMyDistance').textContent = this.formatDistance(localDistances.blocks, 'blocks');
        } else {
            // Для time, distance и blocks-total используем данные, которые уже пришли с сервера
            console.log('🔍 [LEADERBOARD] Отображаем результат из таблицы:', myDistance, 'формат:', this.formatDistance(myDistance, period));
            document.getElementById('lbMyDistance').textContent = this.formatDistance(myDistance, period);
        }
    },
    
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    init: function() {
        this.injectStyles();
        this.createModal();
        this.updateDailyHistory();
        
        setInterval(() => {
            if (window.gameState?.gameActive) {
                this.updateDailyHistory();
                this.submitToLeaderboard();
            }
        }, this.config.submitInterval);
        
        if (window.EventBus) {
            window.EventBus.on('save:completed', () => {
                this.submitToLeaderboard();
            });
        }
        
        console.log('🏆 Leaderboard initialized (tracking ALL players)');
    }
};

window.Leaderboard = Leaderboard;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => Leaderboard.init(), 300));
} else {
    setTimeout(() => Leaderboard.init(), 300);
}

})();
