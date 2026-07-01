// js/planet-background.js
(function() {
    'use strict';

    const canvas = document.getElementById('planetBackgroundCanvas');
    if (!canvas) {
        console.warn('⚠️ planet-background.js: Canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('❌ planet-background.js: 2D context not supported');
        return;
    }

   // ✅ ИСПРАВЛЕНО: Используем единый флаг из конфига
// Fallback на проверку, если конфиг вдруг не загружен (хотя не должен)
const isMobile = window.GAME_CONFIG?.isMobile !== undefined 
    ? window.GAME_CONFIG.isMobile 
    : /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // ✅ Адаптивные настройки производительности
    const getAdaptiveSettings = () => {
        const cores = navigator.hardwareConcurrency || 2;
        const isLowEnd = cores <= 4;
        return {
            speed: 5,
            density: isLowEnd ? 3 : 5,
            size: isMobile ? 4 : 5,
            smoothness: 5,
            nebulaIntensity: isLowEnd ? 2 : 3,
            starDensity: isLowEnd ? 1 : 2,
            maxParticles: isLowEnd ? 100 : 200
        };
    };

    const parallaxSettings = {
        baseSpeed: 0.2,
        directionX: -1,
        directionY: 1,
        layers: { stars: 0.3, nebulae: 0.5, particles: 0.8, special: 1.0 }
    };

    const fixedSettings = getAdaptiveSettings();

    let animationId = null;
    let currentPlanet = 'mercury';
    let time = 0;
    let particles = [];
    let specialElements = [];
    let nebulae = [];
    let stars = [];
    let isPaused = false;
    let isInitialized = false;

    // ✅ Данные планет
    const planetData = {
        mercury: {
            name: 'Меркурий',
            colors: ['#8c7b6b', '#a69b8f', '#5a524c', '#ffaa33', '#ffcc66', '#d9b382', '#bf9e75'],
            background: ['#1a0f0a', '#2c1d14', '#4a3527'],
            type: 'rocky'
        },
        venus: {
            name: 'Венера',
            colors: ['#e6b87e', '#d4a574', '#ff8844', '#b35900', '#ff9966', '#e68a53', '#cc7a3d'],
            background: ['#2a1a0f', '#4a2c1a', '#6b3f20'],
            type: 'cloudy'
        },
        earth: {
            name: 'Земля',
            colors: ['#4a7b9d', '#5d8aa8', '#2e5a78', '#87ceeb', '#a8d5e5', '#6baed6', '#3c8dbc'],
            background: ['#0a1a2a', '#1a2a3a', '#2a3a4a'],
            type: 'oceanic'
        },
        mars: {
            name: 'Марс',
            colors: ['#cd5c5c', '#a52a2a', '#8b4513', '#ff6347', '#e2583e', '#c14533', '#a33226'],
            background: ['#2a0f0a', '#4a1a14', '#6b251e'],
            type: 'dusty'
        },
        jupiter: {
            name: 'Юпитер',
            colors: ['#d2b48c', '#bc8f8f', '#a0522d', '#ff7f50', '#e67347', '#cc663d', '#b35933'],
            background: ['#2a1f14', '#4a3728', '#6b4f3c'],
            type: 'stormy'
        },
        saturn: {
            name: 'Сатурн',
            colors: ['#f0e68c', '#daa520', '#b8860b', '#ffd700', '#e6c347', '#ccaa3d', '#b39233'],
            background: ['#2a2414', '#4a3c28', '#6b543c'],
            type: 'ringed'
        },
        uranus: {
            name: 'Уран',
            colors: ['#afeeee', '#7fffd4', '#40e0d0', '#48d1cc', '#3dc4bf', '#32b7b2', '#27aaa5'],
            background: ['#0a1a2a', '#1a2a3a', '#2a3a4a'],
            type: 'icy'
        },
        neptune: {
            name: 'Нептун',
            colors: ['#4169e1', '#0000cd', '#191970', '#1e90ff', '#1a7feb', '#166fd7', '#125fc3'],
            background: ['#0a0a2a', '#1a1a3a', '#2a2a4a'],
            type: 'windy'
        },
        pluto: {
            name: 'Плутон',
            colors: ['#a9a9a9', '#696969', '#808080', '#d3d3d3', '#c0c0c0', '#b0b0b0', '#9e9e9e'],
            background: ['#1a1a2a', '#2a2a3a', '#3a3a4a'],
            type: 'dwarf'
        }
    };

    // ✅ Установка размера canvas
    function setCanvasSize() {
        if (!canvas) return;
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * pixelRatio;
        canvas.height = canvas.offsetHeight * pixelRatio;
        ctx.scale(pixelRatio, pixelRatio);
    }

    // ✅ Класс частицы
    class Particle {
        constructor(x, y, radius, color, velocity, type, parallaxFactor = 1) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.color = color;
            this.velocity = velocity;
            this.alpha = 1;
            this.type = type;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.02;
            this.pulse = Math.random() * Math.PI * 2;
            this.twinkle = Math.random() * Math.PI * 2;
            this.twinkleSpeed = 0.05 + Math.random() * 0.05;
            this.parallaxFactor = parallaxFactor;
        }

        draw() {
            ctx.save();

            if (this.type === 'star') {
                const twinkleFactor = 0.7 + 0.3 * Math.sin(this.twinkle);
                ctx.globalAlpha = this.alpha * twinkleFactor;
            } else if (this.type === 'ice') {
                ctx.globalAlpha = this.alpha;
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3;
                    const ix = Math.cos(angle) * this.radius;
                    const iy = Math.sin(angle) * this.radius;
                    if (i === 0) ctx.moveTo(ix, iy);
                    else ctx.lineTo(ix, iy);
                }
                ctx.closePath();
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.restore();
                return;
            } else {
                ctx.globalAlpha = this.alpha;
            }

            ctx.translate(this.x, this.y);

            if (this.type === 'ring') {
                ctx.rotate(this.rotation);
                ctx.beginPath();
                ctx.ellipse(0, 0, this.radius, this.radius / 3, 0, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            } else if (this.type === 'nebula') {
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
                gradient.addColorStop(0, this.color + 'aa');
                gradient.addColorStop(1, this.color + '00');
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            } else if (this.type === 'crystal') {
                ctx.rotate(this.rotation);
                ctx.beginPath();
                ctx.moveTo(0, -this.radius);
                ctx.lineTo(this.radius / 2, 0);
                ctx.lineTo(0, this.radius);
                ctx.lineTo(-this.radius / 2, 0);
                ctx.closePath();
                ctx.fillStyle = this.color;
                ctx.fill();
            } else {
                const pulseFactor = 0.8 + 0.2 * Math.sin(this.pulse);
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * pulseFactor, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }

            ctx.restore();
        }

        update() {
            this.draw();

            const parallaxSpeed = parallaxSettings.baseSpeed * this.parallaxFactor;
            this.x += parallaxSettings.directionX * parallaxSpeed;
            this.y += parallaxSettings.directionY * parallaxSpeed;

            const smoothFactor = fixedSettings.smoothness / 10;
            this.velocity.x *= (1 - smoothFactor * 0.05);
            this.velocity.y *= (1 - smoothFactor * 0.05);

            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.rotation += this.rotationSpeed;
            this.pulse += 0.05;
            this.twinkle += this.twinkleSpeed;

            // Wrap around screen
            if (this.x < -this.radius * 2) this.x = canvas.width + this.radius;
            else if (this.x > canvas.width + this.radius * 2) this.x = -this.radius;

            if (this.y < -this.radius * 2) this.y = canvas.height + this.radius;
            else if (this.y > canvas.height + this.radius * 2) this.y = -this.radius;
        }
    }

    // ✅ Отрисовка фона
    function drawBackground() {
        const data = planetData[currentPlanet];
        if (!data) return;
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, data.background[0]);
        gradient.addColorStop(0.5, data.background[1]);
        gradient.addColorStop(1, data.background[2]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // ✅ Генерация звёзд
    function generateStars() {
        const starCount = fixedSettings.starDensity * 50;
        stars = [];
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * 1.5 + 0.5;
            const starColors = ['#ffffff', '#f8f8ff', '#e6e6fa', '#fffacd', '#f0f8ff'];
            const color = starColors[Math.floor(Math.random() * starColors.length)];
            stars.push(new Particle(x, y, radius, color, { x: 0, y: 0 }, 'star', parallaxSettings.layers.stars));
        }
    }

    // ✅ Генерация туманностей
    function generateNebulae() {
        const nebulaCount = fixedSettings.nebulaIntensity;
        nebulae = [];
        const data = planetData[currentPlanet];
        if (!data) return;
        for (let i = 0; i < nebulaCount; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const aspectRatio = canvas.width / canvas.height;
            const radius = Math.random() * 200 + (aspectRatio > 1 ? 80 : 120);
            const color = data.colors[Math.floor(Math.random() * data.colors.length)];
            nebulae.push(new Particle(x, y, radius, color, { x: (Math.random() - 0.5) * 0.05, y: (Math.random() - 0.5) * 0.05 }, 'nebula', parallaxSettings.layers.nebulae));
        }
    }

    // === ГЕНЕРАТОРЫ ПЛАНЕТ ===

    function generateMercury() {
        const data = planetData.mercury;
        const count = fixedSettings.density * 15;
        particles = [];
        for (let i = 0; i < count; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * fixedSettings.size * 2 + 1;
            const color = data.colors[Math.floor(Math.random() * data.colors.length)];
            const speedValue = (Math.random() * 0.5 + 0.1) * fixedSettings.speed / 5;
            const angle = Math.random() * Math.PI * 2;
            particles.push(new Particle(x, y, radius, color, { x: Math.cos(angle) * speedValue, y: Math.sin(angle) * speedValue }, 'rock', parallaxSettings.layers.particles));
        }
        specialElements = [];
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * 20 + 10;
            specialElements.push(new Particle(x, y, radius, data.colors[3], { x: 0, y: 0 }, 'sun', parallaxSettings.layers.special));
        }
    }

    function generateVenus() {
        const data = planetData.venus;
        const count = fixedSettings.density * 20;
        particles = [];
        const cx = canvas.width / 2, cy = canvas.height / 2;
        for (let i = 0; i < count; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * fixedSettings.size * 3 + 5;
            const color = data.colors[Math.floor(Math.random() * data.colors.length)];
            const speedValue = (Math.random() * 0.3 + 0.1) * fixedSettings.speed / 5;
            const dx = x - cx, dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) + Math.PI / 2;
            particles.push(new Particle(x, y, radius, color, {
                x: Math.cos(angle) * speedValue * (dist / 100),
                y: Math.sin(angle) * speedValue * (dist / 100)
            }, 'cloud', parallaxSettings.layers.particles));
        }
        specialElements = [];
    }

    function generateEarth() {
        const data = planetData.earth;
        const count = fixedSettings.density * 25;
        particles = [];
        for (let i = 0; i < count; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * fixedSettings.size * 2 + 2;
            const color = data.colors[Math.floor(Math.random() * data.colors.length)];
            const speedValue = (Math.random() * 0.5 + 0.2) * fixedSettings.speed / 5;
            const angle = Math.random() > 0.5 ? Math.PI / 2 + (Math.random() - 0.5) * 0.5 : -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
            particles.push(new Particle(x, y, radius, color, { x: Math.cos(angle) * speedValue, y: Math.sin(angle) * speedValue }, 'water', parallaxSettings.layers.particles));
        }
        specialElements = [];
    }

    function generateMars() {
        const data = planetData.mars;
        const count = fixedSettings.density * 30;
        particles = [];
        for (let i = 0; i < count; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * fixedSettings.size + 1;
            const color = data.colors[Math.floor(Math.random() * data.colors.length)];
            const speedValue = (Math.random() * 1 + 0.5) * fixedSettings.speed / 5;
            const angle = Math.random() * Math.PI * 2;
            particles.push(new Particle(x, y, radius, color, { x: Math.cos(angle) * speedValue, y: Math.sin(angle) * speedValue }, 'dust', parallaxSettings.layers.particles));
        }
        specialElements = [];
    }

    function generateJupiter() {
        const data = planetData.jupiter;
        const count = fixedSettings.density * 15;
        particles = [];
        for (let i = 0; i < count; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * fixedSettings.size * 4 + 10;
            const color = data.colors[Math.floor(Math.random() * data.colors.length)];
            const speedValue = (Math.random() * 0.2 + 0.1) * fixedSettings.speed / 5;
            const direction = Math.random() > 0.5 ? 1 : -1;
            particles.push(new Particle(x, y, radius, color, { x: speedValue * direction, y: 0 }, 'storm', parallaxSettings.layers.particles));
        }
        specialElements = [];
        // Большое красное пятно
        specialElements.push(new Particle(canvas.width * 0.7, canvas.height * 0.5, 50, data.colors[3], { x: -0.1 * fixedSettings.speed / 5, y: 0 }, 'spot', parallaxSettings.layers.special));
    }

    function generateSaturn() {
        const data = planetData.saturn;
        particles = [];
        // Кольца
        const ringCount = fixedSettings.density * 10;
        for (let i = 0; i < ringCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 150;
            const x = canvas.width / 2 + Math.cos(angle) * distance;
            const y = canvas.height / 2 + Math.sin(angle) * distance;
            const radius = Math.random() * fixedSettings.size * 2 + 5;
            const color = data.colors[Math.floor(Math.random() * data.colors.length)];
            const speedValue = (Math.random() * 0.3 + 0.1) * fixedSettings.speed / 5;
            const orbitalAngle = angle + Math.PI / 2;
            particles.push(new Particle(x, y, radius, color, { x: Math.cos(orbitalAngle) * speedValue, y: Math.sin(orbitalAngle) * speedValue }, 'ring', parallaxSettings.layers.particles));
        }
        // Облака
        const cloudCount = fixedSettings.density * 5;
        for (let i = 0; i < cloudCount; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * fixedSettings.size * 3 + 5;
            const color = data.colors[Math.floor(Math.random() * data.colors.length)];
            const speedValue = (Math.random() * 0.2 + 0.1) * fixedSettings.speed / 5;
            const angle = Math.random() * Math.PI * 2;
            particles.push(new Particle(x, y, radius, color, { x: Math.cos(angle) * speedValue, y: Math.sin(angle) * speedValue }, 'cloud', parallaxSettings.layers.particles));
        }
        specialElements = [];
    }

    function generateUranus() {
        const data = planetData.uranus;
        const count = fixedSettings.density * 20;
        particles = [];
        for (let i = 0; i < count; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * fixedSettings.size * 2 + 3;
            const color = data.colors[Math.floor(Math.random() * data.colors.length)];
            const speedValue = (Math.random() * 0.2 + 0.05) * fixedSettings.speed / 5;
            const angle = Math.random() * Math.PI * 2;
            particles.push(new Particle(x, y, radius, color, { x: Math.cos(angle) * speedValue, y: Math.sin(angle) * speedValue }, 'ice', parallaxSettings.layers.particles));
        }
        specialElements = [];
    }

    function generateNeptune() {
        const data = planetData.neptune;
        const count = fixedSettings.density * 25;
        particles = [];
        const cx = canvas.width / 2, cy = canvas.height / 2;
        for (let i = 0; i < count; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * fixedSettings.size + 2;
            const color = data.colors[Math.floor(Math.random() * data.colors.length)];
            const speedValue = (Math.random() * 0.8 + 0.3) * fixedSettings.speed / 5;
            const dx = x - cx, dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) + Math.PI / 2;
            particles.push(new Particle(x, y, radius, color, {
                x: Math.cos(angle) * speedValue * (1 + dist / 200),
                y: Math.sin(angle) * speedValue * (1 + dist / 200)
            }, 'wind', parallaxSettings.layers.particles));
        }
        specialElements = [];
        for (let i = 0; i < 3; i++) {
            const x = canvas.width * (0.2 + i * 0.3);
            const y = canvas.height * 0.5;
            const radius = 30 + Math.random() * 20;
            specialElements.push(new Particle(x, y, radius, data.colors[2], { x: 0.2 * fixedSettings.speed / 5, y: 0 }, 'spot', parallaxSettings.layers.special));
        }
    }

    function generatePluto() {
        const data = planetData.pluto;
        const count = fixedSettings.density * 20;
        particles = [];
        for (let i = 0; i < count; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * fixedSettings.size * 1.5 + 2;
            const color = data.colors[Math.floor(Math.random() * data.colors.length)];
            const speedValue = (Math.random() * 0.3 + 0.1) * fixedSettings.speed / 5;
            const angle = Math.random() * Math.PI * 2;
            const vel = { x: Math.cos(angle) * speedValue, y: Math.sin(angle) * speedValue };
            if (i % 3 === 0) particles.push(new Particle(x, y, radius, color, vel, 'ice', parallaxSettings.layers.particles));
            else if (i % 3 === 1) particles.push(new Particle(x, y, radius, color, vel, 'crystal', parallaxSettings.layers.particles));
            else particles.push(new Particle(x, y, radius, color, vel, 'rock', parallaxSettings.layers.particles));
        }
        specialElements = [];
        for (let i = 0; i < 3; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * 30 + 20;
            specialElements.push(new Particle(x, y, radius, data.colors[3], { x: (Math.random() - 0.5) * 0.1, y: (Math.random() - 0.5) * 0.1 }, 'ice', parallaxSettings.layers.special));
        }
    }

    // ✅ Карта генераторов
    const genMap = {
        mercury: generateMercury,
        venus: generateVenus,
        earth: generateEarth,
        mars: generateMars,
        jupiter: generateJupiter,
        saturn: generateSaturn,
        uranus: generateUranus,
        neptune: generateNeptune,
        pluto: generatePluto
    };

    // ✅ Анимация частиц
    function animateParticles() {
        drawBackground();
        nebulae.forEach(n => n.update());
        stars.forEach(s => s.update());
        particles.forEach(p => p.update());
        specialElements.forEach(e => e.update());
    }

    // ✅ Главный цикл анимации
    function animate() {
        if (isPaused) {
            animationId = requestAnimationFrame(animate);
            return;
        }
        time += 0.01;
        animateParticles();
        animationId = requestAnimationFrame(animate);
    }

    // ✅ Генерация фона планеты
    function generatePlanetBackground() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        particles = [];
        specialElements = [];
        nebulae = [];
        stars = [];

        generateStars();
        generateNebulae();

        const generator = genMap[currentPlanet];
        if (generator) generator();

        animate();
    }

    // ✅ Смена планеты (без dispatchEvent — предотвращает рекурсию!)
    function changePlanet(planet) {
        if (!planetData[planet]) {
            console.warn('⚠️ planet-background.js: Unknown planet:', planet);
            return;
        }
        if (currentPlanet === planet) return; // Не перерисовываем если та же планета

        console.log('🪐 Changing planet to:', planet);
        currentPlanet = planet;
        generatePlanetBackground();
    }

    // ✅ Пауза / Возобновление / Остановка
    function pause() { isPaused = true; }
    function resume() { isPaused = false; }
    function stop() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    // ✅ Инициализация
    function init() {
        if (isInitialized) return;

        setCanvasSize();
        generatePlanetBackground();

        window.addEventListener('resize', setCanvasSize);

        // Поддержка вкладки в фоне
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) pause();
            else resume();
        });

        // ✅ Слушаем событие смены планеты от game-core.js
        // НЕ вызываем dispatchEvent внутри changePlanet — это ключевое исправление!
        window.addEventListener('planet:changed', (e) => {
            if (e.detail && e.detail.planet) {
                changePlanet(e.detail.planet);
            }
        });

        isInitialized = true;
        console.log('✅ Planet Background System initialized');
    }

    // ✅ Экспорт публичного API
    window.planetBackground = {
        init: init,
        setPlanet: changePlanet,
        setCanvasSize: setCanvasSize,
        pause: pause,
        resume: resume,
        stop: stop,
        getCurrentPlanet: () => currentPlanet,
        isPaused: () => isPaused
    };

    // Автоинициализация
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 200));
    } else {
        setTimeout(init, 200);
    }

    // Очистка при закрытии страницы
    window.addEventListener('beforeunload', () => stop());
})();