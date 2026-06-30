// js/leaderboard.js (v1.0)
(function() {
    'use strict';

    let lbPanelVisible = false;
    let lbCurrentPeriod = 'day';
    let lbLoading = false;
    let lbCache = {}; // кэш по периодам
function init() {
    const btn = document.getElementById('leaderboardBtn');
    const welcomeBtn = document.getElementById('leaderboardBtnWelcome');
    const panel = document.getElementById('leaderboardPanel');
    if (!panel) return;

    // Основная кнопка (в игре)
    if (btn) {
        btn.addEventListener('click', togglePanel);
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            togglePanel();
        }, { passive: false });
    }

    // ✅ Кнопка на welcome screen
    if (welcomeBtn) {
        welcomeBtn.addEventListener('click', togglePanel);
        welcomeBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            togglePanel();
        }, { passive: false });

        document.getElementById('lbCloseBtn').addEventListener('click', closePanel);

        document.querySelectorAll('.lb-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                lbCurrentPeriod = this.dataset.period;
                if (lbPanelVisible) fetchLeaderboard(true);
            });
        });

        // Закрытие по клику вне панели
        document.addEventListener('click', function(e) {
            const path = (e.composedPath && e.composedPath()) || [e.target];
            let inside = false;
            for (let i = 0; i < path.length; i++) {
                if (path[i] === panel || path[i] === btn) { inside = true; break; }
            }
            if (lbPanelVisible && !inside) closePanel();
        });

        console.log('🏆 Leaderboard initialized');
    }

    function togglePanel() {
        if (lbPanelVisible) closePanel();
        else openPanel();
    }

    function openPanel() {
        lbPanelVisible = true;
        document.getElementById('leaderboardPanel').style.display = 'block';

        // Закрыть другие панели
        if (window.achievementsSystem?.hideAchievementsPanel) {
            window.achievementsSystem.hideAchievementsPanel();
        }
        if (window.shopSystem?.closeShop) window.shopSystem.closeShop();
        if (window.GAME_CORE?.pauseGame) window.GAME_CORE.pauseGame();

        fetchLeaderboard(false);
    }

    function closePanel() {
        lbPanelVisible = false;
        document.getElementById('leaderboardPanel').style.display = 'none';
        if (window.GAME_CORE?.resumeGame) window.GAME_CORE.resumeGame();
    }

    async function fetchLeaderboard(forceRefresh) {
        if (lbLoading) return;

        // Проверяем кэш (актуален 60 секунд)
        const cacheKey = lbCurrentPeriod;
        if (!forceRefresh && lbCache[cacheKey] &&
            (Date.now() - lbCache[cacheKey].ts < 60000)) {
            renderLeaderboard(lbCache[cacheKey].data);
            return;
        }

        lbLoading = true;
        document.getElementById('lbLoading').style.display = 'block';
        document.getElementById('lbBody').innerHTML = '';
        document.getElementById('lbMyPosition').textContent = '';

        try {
            const sortField = lbCurrentPeriod === 'day' ? 'dayDamage' :
                              lbCurrentPeriod === 'week' ? 'weekDamage' : 'monthDamage';

            if (window.telegramCloud?.getLeaderboard) {
                const result = await window.telegramCloud.getLeaderboard({
                    limit: 50,
                    sortBy: sortField,
                    period: lbCurrentPeriod
                });

                if (result?.success && result.data) {
                    lbCache[cacheKey] = { data: result.data, ts: Date.now() };
                    renderLeaderboard(result.data);
                } else {
                    showEmpty('Нет данных за этот период');
                }
            } else {
                showEmpty('Сервер недоступен');
            }
        } catch (e) {
            console.error('❌ Leaderboard error:', e);
            showEmpty('Ошибка загрузки');
        } finally {
            lbLoading = false;
            document.getElementById('lbLoading').style.display = 'none';
        }
    }

    function showEmpty(msg) {
        document.getElementById('lbBody').innerHTML =
            `<tr><td colspan="5" style="text-align:center;color:#888;padding:20px">${msg}</td></tr>`;
    }

    function renderLeaderboard(entries) {
        const tbody = document.getElementById('lbBody');
        tbody.innerHTML = '';

        const keys = {
            day:   { damageKey: 'dayDamage',   auKey: 'dayAU' },
            week:  { damageKey: 'weekDamage',  auKey: 'weekAU' },
            month: { damageKey: 'monthDamage', auKey: 'monthAU' }
        };
        const k = keys[lbCurrentPeriod];
        const AU_TO_DAMAGE = window.GAME_CONFIG?.AU_TO_DAMAGE || 149597870.691;
        const locations = window.GAME_CONFIG?.locations || {};
        const myUsername = (typeof window.getTelegramUsername === 'function')
            ? window.getTelegramUsername()
            : (window.telegramUser?.username || '');

        let myRank = -1;

        entries.forEach((entry, i) => {
            const tr = document.createElement('tr');
            const dmg = entry[k.damageKey] || 0;
            const au = dmg / AU_TO_DAMAGE;
            const planetName = locations[entry.currentLocation]?.name || entry.currentLocation || '—';
            const username = entry.username || 'Anon';
            const isMine = username === myUsername;

            if (isMine) {
                myRank = i + 1;
                tr.className = 'lb-mine';
            }

            tr.innerHTML = `
                <td class="lb-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1)}</td>
                <td class="lb-name">${escapeHtml(username)}${isMine ? ' (вы)' : ''}</td>
                <td class="lb-planet">${planetName}</td>
                <td class="lb-distance">${au.toFixed(5)} а.е.</td>
                <td class="lb-damage">${formatDamage(dmg)}</td>
            `;
            tbody.appendChild(tr);
        });

        // Моя позиция внизу
        const myPosEl = document.getElementById('lbMyPosition');
        if (myRank > 0) {
            myPosEl.textContent = `📍 Ваша позиция: #${myRank}`;
            myPosEl.style.display = 'block';
        } else if (myUsername) {
            myPosEl.textContent = `📍 Вы пока не в топ-50`;
            myPosEl.style.display = 'block';
        } else {
            myPosEl.style.display = 'none';
        }
    }

    function formatDamage(n) {
        if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
        if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
        if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
        return String(n);
    }

    function escapeHtml(s) {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    // Автозапуск
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();