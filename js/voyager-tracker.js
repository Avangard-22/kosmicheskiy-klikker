// js/voyager-tracker.js (v1.1 — Ready Gate)
(function() {
    'use strict';

    let isInitialized = false;

    const VOYAGER_DATA = {
        voyager1: {
            name: 'Вояджер-1', label: 'V1',
            launchDate: new Date('1977-09-05'),
            speedAUperYear: 3.6,
            color: '#4FC3F7',
            glowColor: 'rgba(79, 195, 247, 0.6)',
            position: { left: '60%', top: '48%' }
        },
        voyager2: {
            name: 'Вояджер-2', label: 'V2',
            launchDate: new Date('1977-08-20'),
            speedAUperYear: 3.25,
            color: '#81C784',
            glowColor: 'rgba(129, 199, 132, 0.6)',
            position: { right: '60%', top: '52%' }
        }
    };

    let updateInterval = null;

    function calculateCurrentDistance(voyager) {
        const now = new Date();
        const yearsElapsed = (now - voyager.launchDate) / (1000 * 60 * 60 * 24 * 365.25);
        return 1.0 + (yearsElapsed * voyager.speedAUperYear);
    }

    function formatDistance(au) {
        if (au >= 1000) return (au / 1000).toFixed(2) + 'K';
        if (au >= 100) return au.toFixed(1);
        return au.toFixed(2);
    }

    function injectStyles() {
        if (document.getElementById('voyager-tracker-styles')) return;
        const style = document.createElement('style');
        style.id = 'voyager-tracker-styles';
        style.textContent = `
            .voyager-hud-container {
                margin-top: 8px;
                padding-top: 6px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            .voyager-hud-title {
                font-size: 0.6em;
                color: #888;
                margin-bottom: 4px;
                text-align: center;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .voyager-hud-item {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 0.65em;
                margin-bottom: 3px;
                padding: 4px 6px;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 6px;
                border-left: 3px solid currentColor;
                cursor: pointer;
                transition: all 0.2s;
                user-select: none;
                -webkit-user-select: none;
            }
            .voyager-hud-item:hover,
            .voyager-hud-item.active {
                background: rgba(255, 255, 255, 0.08);
                transform: translateX(3px);
            }
            .voyager-hud-item:active {
                transform: translateX(3px) scale(0.98);
            }
            .voyager-hud-emoji { font-size: 1.2em; }
            .voyager-hud-label { flex: 1; font-weight: bold; }
            .voyager-hud-distance { font-weight: bold; font-family: 'Orbitron', monospace; }
            .voyager-hud-unit { opacity: 0.7; font-size: 0.9em; }
            .voyager-dot-container {
                position: fixed;
                z-index: 10;
                pointer-events: none;
            }
            .voyager-dot {
                position: relative;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: currentColor;
                box-shadow: 0 0 15px currentColor, 0 0 30px currentColor;
                animation: voyagerPulse 2.5s ease-in-out infinite;
            }
            .voyager-dot-ring {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 40px;
                height: 40px;
                border: 2px solid currentColor;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                opacity: 0.4;
                animation: voyagerRingPulse 2.5s ease-in-out infinite;
            }
            .voyager-dot-label {
                position: absolute;
                top: -22px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 11px;
                font-weight: bold;
                color: currentColor;
                text-shadow: 0 0 4px currentColor, 0 1px 2px rgba(0,0,0,0.8);
                font-family: 'Orbitron', monospace;
                white-space: nowrap;
            }
            .voyager-dot.highlight .voyager-dot {
                animation: voyagerHighlight 0.6s ease-out;
                box-shadow: 0 0 25px currentColor, 0 0 50px currentColor, 0 0 80px currentColor;
            }
            .voyager-dot.highlight .voyager-dot-ring {
                animation: voyagerRingExpand 0.8s ease-out forwards;
            }
            @keyframes voyagerPulse {
                0%, 100% { 
                    transform: scale(1);
                    box-shadow: 0 0 15px currentColor, 0 0 30px currentColor;
                }
                50% { 
                    transform: scale(1.2);
                    box-shadow: 0 0 20px currentColor, 0 0 40px currentColor;
                }
            }
            @keyframes voyagerRingPulse {
                0%, 100% { 
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 0.4;
                }
                50% { 
                    transform: translate(-50%, -50%) scale(1.3);
                    opacity: 0.1;
                }
            }
            @keyframes voyagerHighlight {
                0% { 
                    transform: scale(1);
                    box-shadow: 0 0 15px currentColor, 0 0 30px currentColor;
                }
                50% { 
                    transform: scale(1.8);
                    box-shadow: 0 0 40px currentColor, 0 0 80px currentColor, 0 0 120px currentColor;
                }
                100% { 
                    transform: scale(1);
                    box-shadow: 0 0 15px currentColor, 0 0 30px currentColor;
                }
            }
            @keyframes voyagerRingExpand {
                0% { 
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 0.8;
                }
                100% { 
                    transform: translate(-50%, -50%) scale(3);
                    opacity: 0;
                }
            }
            #voyager-tracer-svg {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 45;
                overflow: visible;
            }
            .tracer-line {
                stroke-dasharray: 8, 4;
                stroke-linecap: round;
                opacity: 0;
                transition: opacity 0.3s ease;
                filter: drop-shadow(0 0 4px currentColor);
            }
            .tracer-line.visible {
                opacity: 0.9;
                animation: tracerDash 1s linear infinite;
            }
            @keyframes tracerDash {
                to { stroke-dashoffset: -24; }
            }
            @media (max-width: 768px) {
                .voyager-dot {
                    width: 20px;
                    height: 20px;
                }
                .voyager-dot-ring {
                    width: 44px;
                    height: 44px;
                }
                .voyager-dot-label {
                    font-size: 12px;
                    top: -24px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function createHUD() {
        const hudLeft = document.getElementById('hud-left');
        if (!hudLeft || document.getElementById('voyager-hud-container')) return;

        const container = document.createElement('div');
        container.id = 'voyager-hud-container';
        container.className = 'voyager-hud-container';

        const title = document.createElement('div');
        title.className = 'voyager-hud-title';
        title.textContent = '🛰️ Вояджеры';
        container.appendChild(title);

        Object.keys(VOYAGER_DATA).forEach(key => {
            const voyager = VOYAGER_DATA[key];
            const distance = calculateCurrentDistance(voyager);

            const item = document.createElement('div');
            item.className = 'voyager-hud-item';
            item.id = `voyager-hud-${key}`;
            item.style.color = voyager.color;
            item.innerHTML = `
                <span class="voyager-hud-emoji">🛸</span>
                <span class="voyager-hud-label">${voyager.label}: </span>
                <span class="voyager-hud-distance" id="voyager-distance-${key}">${formatDistance(distance)}</span>
                <span class="voyager-hud-unit">AU</span>
            `;

            item.addEventListener('mouseenter', () => showTracer(key));
            item.addEventListener('mouseleave', () => hideTracer(key));
            item.addEventListener('touchstart', (e) => {
                e.preventDefault();
                showTracer(key);
                item.classList.add('active');
            }, { passive: false });
            item.addEventListener('touchend', () => {
                hideTracer(key);
                item.classList.remove('active');
            });

            container.appendChild(item);
        });

        hudLeft.appendChild(container);
    }

    function createDots() {
        document.querySelectorAll('.voyager-dot-container').forEach(el => el.remove());

        Object.keys(VOYAGER_DATA).forEach(key => {
            const voyager = VOYAGER_DATA[key];
            const container = document.createElement('div');
            container.className = 'voyager-dot-container';
            container.id = `voyager-dot-${key}`;
            container.style.color = voyager.color;
            Object.keys(voyager.position).forEach(prop => {
                container.style[prop] = voyager.position[prop];
            });
            container.innerHTML = `
                <div class="voyager-dot">
                    <div class="voyager-dot-ring"></div>
                    <div class="voyager-dot-label">${voyager.label}</div>
                </div>
            `;
            document.body.appendChild(container);
        });
    }

    function createTracerSVG() {
        if (document.getElementById('voyager-tracer-svg')) return;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'voyager-tracer-svg';
        svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
        svg.setAttribute('preserveAspectRatio', 'none');

        Object.keys(VOYAGER_DATA).forEach(key => {
            const voyager = VOYAGER_DATA[key];
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.id = `tracer-line-${key}`;
            line.setAttribute('class', 'tracer-line');
            line.setAttribute('stroke', voyager.color);
            line.setAttribute('stroke-width', '2');
            line.style.color = voyager.color;
            line.setAttribute('x1', '0');
            line.setAttribute('y1', '0');
            line.setAttribute('x2', '0');
            line.setAttribute('y2', '0');
            svg.appendChild(line);
        });

        document.body.appendChild(svg);
        
        window.addEventListener('resize', () => {
            svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
        });
    }

    function showTracer(voyagerKey) {
        const hudEl = document.getElementById(`voyager-hud-${voyagerKey}`);
        const dotEl = document.getElementById(`voyager-dot-${voyagerKey}`);
        const line = document.getElementById(`tracer-line-${voyagerKey}`);
        
        if (!hudEl || !dotEl || !line) return;
        
        const hudRect = hudEl.getBoundingClientRect();
        const dotRect = dotEl.getBoundingClientRect();
        
        const x1 = hudRect.right;
        const y1 = hudRect.top + hudRect.height / 2;
        const x2 = dotRect.left + dotRect.width / 2;
        const y2 = dotRect.top + dotRect.height / 2;
        
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.classList.add('visible');
        
        dotEl.classList.add('highlight');
    }

    function hideTracer(voyagerKey) {
        const line = document.getElementById(`tracer-line-${voyagerKey}`);
        const dotEl = document.getElementById(`voyager-dot-${voyagerKey}`);
        
        if (line) line.classList.remove('visible');
        if (dotEl) {
            setTimeout(() => {
                dotEl.classList.remove('highlight');
            }, 800);
        }
    }

    function updateDistances() {
        Object.keys(VOYAGER_DATA).forEach(key => {
            const voyager = VOYAGER_DATA[key];
            const distance = calculateCurrentDistance(voyager);
            const distanceEl = document.getElementById(`voyager-distance-${key}`);
            if (distanceEl) {
                distanceEl.textContent = formatDistance(distance);
            }
        });
    }

    function init() {
        if (isInitialized) {
            console.warn('⚠️ [Voyager] init() вызван повторно, пропускаем');
            return;
        }
        isInitialized = true;

        injectStyles();
        createHUD();
        createDots();
        createTracerSVG();
        
        if (updateInterval) clearInterval(updateInterval);
        updateInterval = setInterval(updateDistances, 10000);
        
        console.log('🛰️ Voyager Tracker v1.1 initialized (Ready Gate)');
    }

    window.voyagerTracker = {
        showTracer,
        hideTracer,
        getDistance: (key) => {
            const voyager = VOYAGER_DATA[key];
            return voyager ? calculateCurrentDistance(voyager) : 0;
        }
    };

    // ==========================================
    // 🚀 АВТОЗАПУСК (Ready Gate)
    // ==========================================
    function safeInit() {
        if (isInitialized) return;
        init();
        if (window.EventBus) {
            window.EventBus.moduleReady('voyager');
        }
    }

    if (window.EventBus) {
        window.EventBus.once('game:allReady', () => {
            console.log('[Voyager] game:allReady получен, запускаем safeInit');
            safeInit();
        });
    } else {
        console.warn('⚠️ [Voyager] EventBus не найден! Fallback');
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => setTimeout(safeInit, 100), { once: true });
        } else {
            setTimeout(safeInit, 100);
        }
    }

})();