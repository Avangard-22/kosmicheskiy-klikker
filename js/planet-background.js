// js/planet-background.js (v3.0 — гибридный фон)
(function() {
    'use strict';

    const canvas = document.getElementById('planetBackgroundCanvas');
    if (!canvas) {
        console.warn('⚠️ planet-background.js: Canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d', { 
        alpha: false,
        desynchronized: true
    });
    
    if (!ctx) {
        console.error('❌ planet-background.js: 2D context not supported');
        return;
    }

    const isMobile = window.GAME_CONFIG?.isMobile !== undefined 
        ? window.GAME_CONFIG.isMobile 
        : /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const getAdaptiveSettings = () => {
        const cores = navigator.hardwareConcurrency || 2;
        const isLowEnd = cores <= 4;
        return {
            speed: 5,
            density: isLowEnd ? 2 : 4,  // Уменьшили плотность (фон статичный)
            size: isMobile ? 4 : 5,
            smoothness: 5,
            particleCount: isLowEnd ? 50 : 100  // Меньше частиц
        };
    };

    const fixedSettings = getAdaptiveSettings();

    let animationId = null;
    let currentPlanet = 'mercury';
    let particles = [];
    let stars = [];
    let isPaused = false;
    let isInitialized = false;
    let lastFrameTime = 0;

    // ==========================================
    // 🖼️ КЭШИРОВАНИЕ СТАТИЧНЫХ ФОНОВ
    // ==========================================
    const backgroundCache = new Image();    const backgroundLoaded = {};

    /**
     * Генерирует статичный фон для планеты (один раз!)
     * Можно заменить на загрузку реальных изображений
     */
    function generateStaticBackground(planet) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        const planetData = getPlanetData(planet);
        if (!planetData) return null;

        // === ГЛУБОКИЙ КОСМОС (звёздное поле) ===
        const deepSpaceGradient = tempCtx.createRadialGradient(
            tempCanvas.width / 2, tempCanvas.height / 2, 0,
            tempCanvas.width / 2, tempCanvas.height / 2, tempCanvas.width
        );
        deepSpaceGradient.addColorStop(0, planetData.background[0]);
        deepSpaceGradient.addColorStop(0.5, planetData.background[1]);
        deepSpaceGradient.addColorStop(1, planetData.background[2]);
        
        tempCtx.fillStyle = deepSpaceGradient;
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // === ТУМАННОСТИ (статичные) ===
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * tempCanvas.width;
            const y = Math.random() * tempCanvas.height;
            const radius = Math.random() * 150 + 100;
            const color = planetData.colors[Math.floor(Math.random() * planetData.colors.length)];
            
            const nebulaGradient = tempCtx.createRadialGradient(x, y, 0, x, y, radius);
            nebulaGradient.addColorStop(0, color + '40');  // 25% opacity
            nebulaGradient.addColorStop(1, color + '00');  // 0% opacity
            
            tempCtx.fillStyle = nebulaGradient;
            tempCtx.beginPath();
            tempCtx.arc(x, y, radius, 0, Math.PI * 2);
            tempCtx.fill();
        }

        // === ДАЛЬНИЕ ЗВЁЗДЫ (статичные) ===
        for (let i = 0; i < 150; i++) {
            const x = Math.random() * tempCanvas.width;
            const y = Math.random() * tempCanvas.height;
            const radius = Math.random() * 1.5 + 0.5;
            const brightness = Math.random();            const starColor = `rgba(255, 255, 255, ${brightness * 0.8})`;
            
            tempCtx.fillStyle = starColor;
            tempCtx.beginPath();
            tempCtx.arc(x, y, radius, 0, Math.PI * 2);
            tempCtx.fill();
        }

        // === ПЛАНЕТАРНЫЕ ОСОБЕННОСТИ ===
        addPlanetSpecificFeatures(tempCtx, planet, tempCanvas.width, tempCanvas.height);

        return tempCanvas;
    }

    /**
     * Добавляет уникальные элементы для каждой планеты
     */
    function addPlanetSpecificFeatures(ctx, planet, width, height) {
        switch (planet) {
            case 'mercury':
                // Металлический блеск
                const mercuryGlow = ctx.createRadialGradient(width * 0.7, height * 0.3, 0, width * 0.7, height * 0.3, 200);
                mercuryGlow.addColorStop(0, 'rgba(255, 170, 51, 0.15)');
                mercuryGlow.addColorStop(1, 'rgba(255, 170, 51, 0)');
                ctx.fillStyle = mercuryGlow;
                ctx.fillRect(0, 0, width, height);
                break;

            case 'venus':
                // Оранжевые облака
                for (let i = 0; i < 8; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const radius = Math.random() * 100 + 50;
                    
                    const cloudGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                    cloudGradient.addColorStop(0, 'rgba(255, 136, 68, 0.2)');
                    cloudGradient.addColorStop(1, 'rgba(255, 136, 68, 0)');
                    
                    ctx.fillStyle = cloudGradient;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;

            case 'jupiter':
                // Полосы штормов
                for (let i = 0; i < 5; i++) {
                    const y = (height / 6) * (i + 1);                    const bandHeight = 30 + Math.random() * 40;
                    
                    const bandGradient = ctx.createLinearGradient(0, y - bandHeight/2, 0, y + bandHeight/2);
                    bandGradient.addColorStop(0, 'rgba(210, 180, 140, 0)');
                    bandGradient.addColorStop(0.5, 'rgba(210, 180, 140, 0.15)');
                    bandGradient.addColorStop(1, 'rgba(210, 180, 140, 0)');
                    
                    ctx.fillStyle = bandGradient;
                    ctx.fillRect(0, y - bandHeight/2, width, bandHeight);
                }
                break;

            case 'saturn':
                // Золотистое свечение колец
                const ringsGlow = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, 300);
                ringsGlow.addColorStop(0, 'rgba(240, 230, 140, 0)');
                ringsGlow.addColorStop(0.5, 'rgba(240, 230, 140, 0.1)');
                ringsGlow.addColorStop(1, 'rgba(240, 230, 140, 0)');
                
                ctx.fillStyle = ringsGlow;
                ctx.beginPath();
                ctx.ellipse(width/2, height/2, 300, 100, 0, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'neptune':
                // Глубокие синие вихри
                for (let i = 0; i < 3; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    
                    const swirlGradient = ctx.createRadialGradient(x, y, 0, x, y, 80);
                    swirlGradient.addColorStop(0, 'rgba(65, 105, 225, 0.25)');
                    swirlGradient.addColorStop(1, 'rgba(65, 105, 225, 0)');
                    
                    ctx.fillStyle = swirlGradient;
                    ctx.beginPath();
                    ctx.arc(x, y, 80, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
        }
    }

    function getPlanetData(planet) {
        const data = {
            mercury: {
                name: 'Меркурий',
                colors: ['#8c7b6b', '#a69b8f', '#5a524c', '#ffaa33'],
                background: ['#0a0503', '#1a0f0a', '#2c1d14'],                type: 'rocky'
            },
            venus: {
                name: 'Венера',
                colors: ['#e6b87e', '#d4a574', '#ff8844', '#b35900'],
                background: ['#1a0f05', '#2a1a0f', '#4a2c1a'],
                type: 'cloudy'
            },
            earth: {
                name: 'Земля',
                colors: ['#4a7b9d', '#5d8aa8', '#2e5a78', '#87ceeb'],
                background: ['#050a1a', '#0a1a2a', '#1a2a3a'],
                type: 'oceanic'
            },
            mars: {
                name: 'Марс',
                colors: ['#cd5c5c', '#a52a2a', '#8b4513', '#ff6347'],
                background: ['#1a0503', '#2a0f0a', '#4a1a14'],
                type: 'dusty'
            },
            jupiter: {
                name: 'Юпитер',
                colors: ['#d2b48c', '#bc8f8f', '#a0522d', '#ff7f50'],
                background: ['#1a150a', '#2a1f14', '#4a3728'],
                type: 'stormy'
            },
            saturn: {
                name: 'Сатурн',
                colors: ['#f0e68c', '#daa520', '#b8860b', '#ffd700'],
                background: ['#1a170a', '#2a2414', '#4a3c28'],
                type: 'ringed'
            },
            uranus: {
                name: 'Уран',
                colors: ['#afeeee', '#7fffd4', '#40e0d0', '#48d1cc'],
                background: ['#051a2a', '#0a1a2a', '#1a2a3a'],
                type: 'icy'
            },
            neptune: {
                name: 'Нептун',
                colors: ['#4169e1', '#0000cd', '#191970', '#1e90ff'],
                background: ['#05051a', '#0a0a2a', '#1a1a3a'],
                type: 'windy'
            },
            pluto: {
                name: 'Плутон',
                colors: ['#a9a9a9', '#696969', '#808080', '#d3d3d3'],
                background: ['#0a0a1a', '#1a1a2a', '#2a2a3a'],
                type: 'dwarf'
            }        };
        return data[planet];
    }

    // ==========================================
    // ⭐ КЛАСС ЧАСТИЦЫ (для переднего плана)
    // ==========================================
    class Particle {
        constructor(x, y, radius, color, velocity, type, speed) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.color = color;
            this.velocity = velocity;
            this.alpha = 1;
            this.type = type;
            this.speed = speed;
            this.twinkle = Math.random() * Math.PI * 2;
            this.twinkleSpeed = 0.02 + Math.random() * 0.03;
        }

        draw() {
            if (this.type === 'star') {
                const twinkleFactor = 0.6 + 0.4 * Math.sin(this.twinkle);
                ctx.globalAlpha = this.alpha * twinkleFactor;
            } else {
                ctx.globalAlpha = this.alpha;
            }

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        update() {
            this.x += this.velocity.x * this.speed;
            this.y += this.velocity.y * this.speed;
            this.twinkle += this.twinkleSpeed;

            // Wrap around
            if (this.x < -this.radius * 2) this.x = canvas.width + this.radius;
            else if (this.x > canvas.width + this.radius * 2) this.x = -this.radius;

            if (this.y < -this.radius * 2) this.y = canvas.height + this.radius;
            else if (this.y > canvas.height + this.radius * 2) this.y = -this.radius;
        }
    }
    // ==========================================
    // 🎨 ГЕНЕРАЦИЯ ЧАСТИЦ (передний план)
    // ==========================================
    function generateParticles() {
        particles = [];
        stars = [];

        // Ближние звёзды (мерцающие)
        const starCount = fixedSettings.particleCount;
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * 2 + 1;
            const color = '#ffffff';
            const speed = 0.3 + Math.random() * 0.2;
            stars.push(new Particle(x, y, radius, color, { x: 0, y: 0 }, 'star', speed));
        }

        // Плавающие частицы (пыль, астероиды)
        const particleCount = fixedSettings.density * 10;
        const planetData = getPlanetData(currentPlanet);
        
        for (let i = 0; i < particleCount; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * fixedSettings.size + 1;
            const color = planetData.colors[Math.floor(Math.random() * 3)];
            const speed = 0.2 + Math.random() * 0.3;
            const angle = Math.random() * Math.PI * 2;
            const velocity = {
                x: Math.cos(angle) * 0.3,
                y: Math.sin(angle) * 0.3
            };
            
            particles.push(new Particle(x, y, radius, color, velocity, 'dust', speed));
        }
    }

    // ==========================================
    // 🎬 ГЛАВНЫЙ ЦИКЛ АНИМАЦИИ
    // ==========================================
    function animate(timestamp) {
        if (document.hidden || isPaused) {
            animationId = requestAnimationFrame(animate);
            return;
        }

        const deltaTime = timestamp - lastFrameTime;
        lastFrameTime = timestamp;
        // 1. Рисуем статичный фон (один draw call!)
        if (backgroundLoaded[currentPlanet]) {
            ctx.drawImage(backgroundCache, 0, 0, canvas.width, canvas.height);
        }

        // 2. Рисуем частицы (передний план)
        stars.forEach(star => {
            star.update();
            star.draw();
        });

        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        animationId = requestAnimationFrame(animate);
    }

    // ==========================================
    // 🪐 УПРАВЛЕНИЕ ФОНАМИ
    // ==========================================
    function setCanvasSize() {
        if (!canvas) return;
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * pixelRatio;
        canvas.height = canvas.offsetHeight * pixelRatio;
        ctx.scale(pixelRatio, pixelRatio);
        canvas.cssWidth = canvas.offsetWidth;
        canvas.cssHeight = canvas.offsetHeight;
    }

    function loadPlanetBackground(planet) {
        console.log('🖼️ [BACKGROUND] Generating static background for:', planet);
        
        const bgCanvas = generateStaticBackground(planet);
        if (bgCanvas) {
            backgroundCache.src = bgCanvas.toDataURL('image/png');
            backgroundCache.onload = () => {
                backgroundLoaded[planet] = true;
                console.log('✅ [BACKGROUND] Static background loaded for:', planet);
            };
        }
    }

    function changePlanet(planet) {
        if (!getPlanetData(planet)) {
            console.warn('⚠️ planet-background.js: Unknown planet:', planet);
            return;
        }        if (currentPlanet === planet) return;

        console.log('🪐 Changing planet to:', planet);
        currentPlanet = planet;
        
        // Генерируем статичный фон (один раз)
        if (!backgroundLoaded[planet]) {
            loadPlanetBackground(planet);
        }
        
        // Пересоздаём частицы
        generateParticles();
    }

    function pause() { isPaused = true; }
    function resume() { isPaused = false; }
    function stop() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    // ==========================================
    // 🚀 ИНИЦИАЛИЗАЦИЯ
    // ==========================================
    function init() {
        if (isInitialized) return;

        setCanvasSize();
        
        // Генерируем фон для стартовой планеты
        loadPlanetBackground('mercury');
        generateParticles();

        window.addEventListener('resize', setCanvasSize);

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                pause();
            } else {
                resume();
                lastFrameTime = performance.now();
            }
        });

        window.addEventListener('planet:changed', (e) => {
            if (e.detail && e.detail.planet) {
                changePlanet(e.detail.planet);
            }        });

        lastFrameTime = performance.now();
        animationId = requestAnimationFrame(animate);

        isInitialized = true;
        console.log('✅ Planet Background System v3.0 initialized (HYBRID)');
    }

    // ==========================================
    // 🌐 PUBLIC API
    // ==========================================
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

    // Auto-start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 200));
    } else {
        setTimeout(init, 200);
    }

    window.addEventListener('beforeunload', () => stop());
})();
