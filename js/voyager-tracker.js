// js/voyager-tracker.js
(function() {
    'use strict';

    const VOYAGER_DATA = {
        voyager1: {
            name: 'Вояджер-1',
            label: 'V1',
            launchDate: new Date('1977-09-05'),
            speedAUperYear: 3.6,
            color: '#4FC3F7',
            glowColor: 'rgba(79, 195, 247, 0.6)',
            position: { left: '60%', top: '48%' } // Слева от центральной зоны
        },
        voyager2: {
            name: 'Вояджер-2',
            label: 'V2',
            launchDate: new Date('1977-08-20'),
            speedAUperYear: 3.25,
            color: '#81C784',
            glowColor: 'rgba(129, 199, 132, 0.6)',
            position: { right: '60%', top: '52%' } // Справа от центральной зоны
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

// ЧТО: Тело функции заменено на ранний выход — стили перенесены в styles.css
// КУДА: voyager-tracker.js → injectStyles()
// ЗАЧЕМ: Сохраняем вызов функции (init() её вызывает), но она больше не инжектирует
//        стили. Все классы (.voyager-hud-item, .voyager-dot, etc.) теперь в styles.css.
function injectStyles() {
    // Стили перенесены в styles.css — секция "VOYAGER TRACKER"
    // Функция сохранена для совместимости с init()
    return;
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

            // Обработчики для трассировки
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
        // Удаляем старые точки если есть
        document.querySelectorAll('.voyager-dot-container').forEach(el => el.remove());

        Object.keys(VOYAGER_DATA).forEach(key => {
            const voyager = VOYAGER_DATA[key];

            const container = document.createElement('div');
            container.className = 'voyager-dot-container';
            container.id = `voyager-dot-${key}`;
            container.style.color = voyager.color;

            // Применяем позицию
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
        
        // Обновляем viewBox при ресайзе
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
        
        if (line) {
            line.classList.remove('visible');
        }
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
        injectStyles();
        createHUD();
        createDots();
        createTracerSVG();
        
        updateInterval = setInterval(updateDistances, 10000);
        
        console.log('🛰️ Voyager Tracker initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.voyagerTracker = {
        showTracer,
        hideTracer,
        getDistance: (key) => {
            const voyager = VOYAGER_DATA[key];
            return voyager ? calculateCurrentDistance(voyager) : 0;
        }
    };
})();