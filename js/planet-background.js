// js/planet-background.js (v2.3 — Ready Gate + защита от двойной инициализации)
(function() {
    'use strict';

    // ✅ Флаг защиты от двойной инициализации модуля
    let isModuleInitialized = false;

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
            density: isLowEnd ? 3 : 5,
            size: isMobile ? 4 : 5,
            smoothness: 5,
            nebulaIntensity: isLowEnd ? 2 : 3,
            starDensity: isLowEnd ? 1 : 2,
            maxParticles: isLowEnd ? 100 : 200,
            deepSpaceStars: isLowEnd ? 150 : 300
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
    let lastFrameTime = 0;

    // ==========================================
    // 🌌 СТАТИЧНЫЙ ФОН ГЛУБОКОГО КОСМОСА
    // ==========================================
    let deepSpaceCanvas = null;
    let deepSpaceStars = [];

    function generateDeepSpaceBackground() {
        deepSpaceCanvas = document.createElement('canvas');
        deepSpaceCanvas.width = canvas.width;
        deepSpaceCanvas.height = canvas.height;
        const deepCtx = deepSpaceCanvas.getContext('2d');

        const data = planetData[currentPlanet];
        if (!data) return;

        const gradient = deepCtx.createRadialGradient(
            deepSpaceCanvas.width / 2, deepSpaceCanvas.height / 2, 0,
            deepSpaceCanvas.width / 2, deepSpaceCanvas.height / 2, deepSpaceCanvas.width * 0.8
        );
        gradient.addColorStop(0, data.background[0]);
        gradient.addColorStop(0.5, data.background[1]);
        gradient.addColorStop(1, data.background[2]);
        
        deepCtx.fillStyle = gradient;
        deepCtx.fillRect(0, 0, deepSpaceCanvas.width, deepSpaceCanvas.height);

        for (let i = 0; i < 3; i++) {
            const x = Math.random() * deepSpaceCanvas.width;
            const y = Math.random() * deepSpaceCanvas.height;
            const radius = Math.random() * 200 + 100;
            const color = data.colors[Math.floor(Math.random() * data.colors.length)];
            
            const nebulaGradient = deepCtx.createRadialGradient(x, y, 0, x, y, radius);
            nebulaGradient.addColorStop(0, color + '25');
            nebulaGradient.addColorStop(1, color + '00');
            
            deepCtx.fillStyle = nebulaGradient;
            deepCtx.beginPath();            deepCtx.arc(x, y, radius, 0, Math.PI * 2);
            deepCtx.fill();
        }

        addPlanetSpecificFeatures(deepCtx, currentPlanet, deepSpaceCanvas.width, deepSpaceCanvas.height);

        const staticStarCount = fixedSettings.deepSpaceStars;
        deepSpaceStars = [];
        const starColors = ['#ffffff', '#f8f8ff', '#e6e6fa', '#fffacd', '#f0f8ff'];
        
        for (let i = 0; i < staticStarCount; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * 1.0 + 0.3;
            const color = starColors[Math.floor(Math.random() * starColors.length)];
            
            const starParticle = new Particle(x, y, radius, color, { x: 0, y: 0 }, 'star', 0);
            starParticle.twinkleSpeed = 0.01 + Math.random() * 0.02;
            
            deepSpaceStars.push(starParticle);
        }

        console.log(`🌌 [BACKGROUND] Deep space context & ${staticStarCount} optimized stars initialized`);
    }

    function addPlanetSpecificFeatures(ctx, planet, width, height) {
        const data = planetData[planet];
        
        switch (planet) {
            case 'mercury':
                const mercuryGlow = ctx.createRadialGradient(width * 0.7, height * 0.3, 0, width * 0.7, height * 0.3, 200);
                mercuryGlow.addColorStop(0, 'rgba(255, 170, 51, 0.1)');
                mercuryGlow.addColorStop(1, 'rgba(255, 170, 51, 0)');
                ctx.fillStyle = mercuryGlow;
                ctx.fillRect(0, 0, width, height);
                break;

            case 'venus':
                for (let i = 0; i < 5; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const radius = Math.random() * 100 + 50;
                    
                    const cloudGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                    cloudGradient.addColorStop(0, 'rgba(255, 136, 68, 0.15)');
                    cloudGradient.addColorStop(1, 'rgba(255, 136, 68, 0)');
                    
                    ctx.fillStyle = cloudGradient;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);                    ctx.fill();
                }
                break;

            case 'jupiter':
                for (let i = 0; i < 4; i++) {
                    const y = (height / 5) * (i + 1);
                    const bandHeight = 25 + Math.random() * 30;
                    
                    const bandGradient = ctx.createLinearGradient(0, y - bandHeight/2, 0, y + bandHeight/2);
                    bandGradient.addColorStop(0, 'rgba(210, 180, 140, 0)');
                    bandGradient.addColorStop(0.5, 'rgba(210, 180, 140, 0.1)');
                    bandGradient.addColorStop(1, 'rgba(210, 180, 140, 0)');
                    
                    ctx.fillStyle = bandGradient;
                    ctx.fillRect(0, y - bandHeight/2, width, bandHeight);
                }
                break;

            case 'saturn':
                const ringsGlow = ctx.createRadialGradient(width/2, height/2, 80, width/2, height/2, 250);
                ringsGlow.addColorStop(0, 'rgba(240, 230, 140, 0)');
                ringsGlow.addColorStop(0.5, 'rgba(240, 230, 140, 0.08)');
                ringsGlow.addColorStop(1, 'rgba(240, 230, 140, 0)');
                
                ctx.fillStyle = ringsGlow;
                ctx.beginPath();                
                ctx.ellipse(width/2, height/2, 250, 80, 0, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'neptune':
                for (let i = 0; i < 2; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    
                    const swirlGradient = ctx.createRadialGradient(x, y, 0, x, y, 60);
                    swirlGradient.addColorStop(0, 'rgba(65, 105, 225, 0.2)');
                    swirlGradient.addColorStop(1, 'rgba(65, 105, 225, 0)');
                    
                    ctx.fillStyle = swirlGradient;
                    ctx.beginPath();
                    ctx.arc(x, y, 60, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
        }
    }

    // ==========================================    // 🚀 СИСТЕМА КЭШИРОВАНИЯ СПРАЙТОВ
    // ==========================================
    const spriteCache = new Map();
    const MAX_CACHE_SIZE = 500;

    function createStarSprite(radius, color) {
        const key = `star_${radius.toFixed(1)}_${color}`;
        if (spriteCache.has(key)) return spriteCache.get(key);

        const size = Math.ceil(radius * 4);
        const offscreen = document.createElement('canvas');
        offscreen.width = size;
        offscreen.height = size;
        const offCtx = offscreen.getContext('2d');

        offCtx.shadowBlur = radius * 2;
        offCtx.shadowColor = color;
        offCtx.fillStyle = color;
        offCtx.beginPath();
        offCtx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
        offCtx.fill();

        if (spriteCache.size >= MAX_CACHE_SIZE) {
            const firstKey = spriteCache.keys().next().value;
            spriteCache.delete(firstKey);
        }

        spriteCache.set(key, offscreen);
        return offscreen;
    }

    function createParticleSprite(type, radius, color) {
        const key = `${type}_${radius.toFixed(1)}_${color}`;
        if (spriteCache.has(key)) return spriteCache.get(key);

        const size = Math.ceil(radius * 4);
        const offscreen = document.createElement('canvas');
        offscreen.width = size;
        offscreen.height = size;
        const offCtx = offscreen.getContext('2d');

        offCtx.translate(size / 2, size / 2);

        switch (type) {
            case 'ice':
                offCtx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3;
                    const ix = Math.cos(angle) * radius;
                    const iy = Math.sin(angle) * radius;                    if (i === 0) offCtx.moveTo(ix, iy);
                    else offCtx.lineTo(ix, iy);                
                }
                offCtx.closePath();
                offCtx.fillStyle = color;
                offCtx.fill();
                break;

            case 'ring':
                offCtx.beginPath();
                offCtx.ellipse(0, 0, radius, radius / 3, 0, 0, Math.PI * 2);
                offCtx.fillStyle = color;
                offCtx.fill();
                break;

            case 'crystal':
                offCtx.beginPath();
                offCtx.moveTo(0, -radius);
                offCtx.lineTo(radius / 2, 0);
                offCtx.lineTo(0, radius);
                offCtx.lineTo(-radius / 2, 0);
                offCtx.closePath();
                offCtx.fillStyle = color;
                offCtx.fill();
                break;

            default:
                offCtx.beginPath();
                offCtx.arc(0, 0, radius, 0, Math.PI * 2);
                offCtx.fillStyle = color;
                offCtx.fill();
        }

        if (spriteCache.size >= MAX_CACHE_SIZE) {
            const firstKey = spriteCache.keys().next().value;
            spriteCache.delete(firstKey);
        }

        spriteCache.set(key, offscreen);
        return offscreen;
    }

    function createNebulaSprite(radius, color) {
        const key = `nebula_${radius.toFixed(1)}_${color}`;
        if (spriteCache.has(key)) return spriteCache.get(key);

        const size = Math.ceil(radius * 2);
        const offscreen = document.createElement('canvas');
        offscreen.width = size;
        offscreen.height = size;        const offCtx = offscreen.getContext('2d');
        const gradient = offCtx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, radius);
        gradient.addColorStop(0, color + 'aa');
        gradient.addColorStop(1, color + '00');
        offCtx.fillStyle = gradient;
        offCtx.beginPath();
        offCtx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
        offCtx.fill();

        if (spriteCache.size >= MAX_CACHE_SIZE) {
            const firstKey = spriteCache.keys().next().value;
            spriteCache.delete(firstKey);
        }

        spriteCache.set(key, offscreen);
        return offscreen;
    }

    // ==========================================
    // 📊 ДАННЫЕ ПЛАНЕТ
    // ==========================================
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
            background: ['#2a1f14', '#4a3728', '#6b4f3c'],            type: 'stormy'
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

    // ==========================================
    // 🎨 КЛАСС ЧАСТИЦЫ (ОПТИМИЗИРОВАННЫЙ)
    // ==========================================
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
            
            this.sprite = null;
            if (type === 'star') {
                this.sprite = createStarSprite(radius, color);            } else if (type === 'nebula') {                
                this.sprite = createNebulaSprite(radius, color);
            } else {
                this.sprite = createParticleSprite(type, radius, color);
            }
        }

        draw() {
            if (this.sprite) {
                const size = this.sprite.width;
                const halfSize = size / 2;

                if (this.type === 'star') {
                    const twinkleFactor = 0.7 + 0.3 * Math.sin(this.twinkle);
                    ctx.globalAlpha = this.alpha * twinkleFactor;
                    ctx.drawImage(this.sprite, this.x - halfSize, this.y - halfSize);
                    ctx.globalAlpha = 1;
                } else if (this.type === 'nebula') {
                    ctx.globalAlpha = this.alpha;
                    ctx.drawImage(this.sprite, this.x - halfSize, this.y - halfSize);
                    ctx.globalAlpha = 1;
                } else if (this.type === 'ice' || this.type === 'ring' || this.type === 'crystal') {
                    ctx.save();
                    ctx.globalAlpha = this.alpha;
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation);
                    ctx.drawImage(this.sprite, -halfSize, -halfSize);
                    ctx.restore();
                } else {
                    const pulseFactor = 0.8 + 0.2 * Math.sin(this.pulse);
                    const scaledSize = size * pulseFactor;
                    ctx.globalAlpha = this.alpha;
                    ctx.drawImage(this.sprite, this.x - scaledSize / 2, this.y - scaledSize / 2, scaledSize, scaledSize);
                    ctx.globalAlpha = 1;
                }
            }
        }

        update() {
            const parallaxSpeed = parallaxSettings.baseSpeed * this.parallaxFactor;
            this.x += parallaxSettings.directionX * parallaxSpeed;
            this.y += parallaxSettings.directionY * parallaxSpeed;

            const smoothFactor = fixedSettings.smoothness / 10;
            this.velocity.x *= (1 - smoothFactor * 0.05);
            this.velocity.y *= (1 - smoothFactor * 0.05);

            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.rotation += this.rotationSpeed;            this.pulse += 0.05;            
            this.twinkle += this.twinkleSpeed;

            const radius2 = this.radius * 2;
            if (this.x < -radius2) this.x = canvas.width + radius2;
            else if (this.x > canvas.width + radius2) this.x = -radius2;

            if (this.y < -radius2) this.y = canvas.height + radius2;
            else if (this.y > canvas.height + radius2) this.y = -radius2;
        }
    }

    // ==========================================
    // ⭐ ГЕНЕРАЦИЯ ЗВЁЗД (передний план)
    // ==========================================
    function generateStars() {
        const starCount = fixedSettings.starDensity * 50;
        stars = [];
        const starColors = ['#ffffff', '#f8f8ff', '#e6e6fa', '#fffacd', '#f0f8ff'];
        
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * 1.5 + 0.5;
            const color = starColors[Math.floor(Math.random() * starColors.length)];
            stars.push(new Particle(x, y, radius, color, { x: 0, y: 0 }, 'star', parallaxSettings.layers.stars));
        }
    }

    // ==========================================
    // 🌫️ ГЕНЕРАЦИЯ ТУМАННОСТЕЙ
    // ==========================================
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

    // ==========================================
    // 🪐 ГЕНЕРАТОРЫ ПЛАНЕТ    // ==========================================    
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
        for (let i = 0; i < count; i++) {            const x = Math.random() * canvas.width;            
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
        specialElements.push(new Particle(canvas.width * 0.7, canvas.height * 0.5, 50, data.colors[3], { x: -0.1 * fixedSettings.speed / 5, y: 0 }, 'spot', parallaxSettings.layers.special));
    }

    function generateSaturn() {
        const data = planetData.saturn;
        particles = [];
        const ringCount = fixedSettings.density * 10;
        for (let i = 0; i < ringCount; i++) {
            const angle = Math.random() * Math.PI * 2;            const distance = 100 + Math.random() * 150;            
            const x = canvas.width / 2 + Math.cos(angle) * distance;
            const y = canvas.height / 2 + Math.sin(angle) * distance;
            const radius = Math.random() * fixedSettings.size * 2 + 5;
            const color = data.colors[Math.floor(Math.random() * data.colors.length)];
            const speedValue = (Math.random() * 0.3 + 0.1) * fixedSettings.speed / 5;
            const orbitalAngle = angle + Math.PI / 2;
            particles.push(new Particle(x, y, radius, color, { x: Math.cos(orbitalAngle) * speedValue, y: Math.sin(orbitalAngle) * speedValue }, 'ring', parallaxSettings.layers.particles));
        }
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
            const dx = x - cx, dy = y - cy;            const dist = Math.sqrt(dx * dx + dy * dy);            
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

    const genMap = {
        mercury: generateMercury,
        venus: generateVenus,
        earth: generateEarth,
        mars: generateMars,
        jupiter: generateJupiter,
        saturn: generateSaturn,
        uranus: generateUranus,
        neptune: generateNeptune,        pluto: generatePluto    
    };

    // ==========================================
    // 🎬 АНИМАЦИЯ (ОПТИМИЗИРОВАННАЯ)
    // ==========================================
    function animateParticles() {
        if (deepSpaceCanvas) {
            ctx.drawImage(deepSpaceCanvas, 0, 0);
        }
        
        deepSpaceStars.forEach(s => {
            s.update();
            s.draw();
        });
        
        nebulae.forEach(n => {
            n.update();
            n.draw();
        });
        
        stars.forEach(s => {
            s.update();
            s.draw();
        });
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        specialElements.forEach(e => {
            e.update();
            e.draw();
        });
    }

    function animate(timestamp) {
        if (document.hidden || isPaused) {
            animationId = requestAnimationFrame(animate);
            return;
        }

        const deltaTime = timestamp - lastFrameTime;
        lastFrameTime = timestamp;
        const safeDeltaTime = Math.min(deltaTime, 100);
        time += safeDeltaTime * 0.001;

        animateParticles();
        animationId = requestAnimationFrame(animate);    }

    // ==========================================
    // 🪐 УПРАВЛЕНИЕ ФОНАМИ
    // ==========================================
    function generatePlanetBackground() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        particles = [];
        specialElements = [];
        nebulae = [];
        stars = [];

        // ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: очистка кэша при смене планеты
        spriteCache.clear();

        generateDeepSpaceBackground();
        generateStars();
        generateNebulae();

        const generator = genMap[currentPlanet];
        if (generator) generator();

        lastFrameTime = performance.now();
        animationId = requestAnimationFrame(animate);
    }

    function changePlanet(planet) {
        if (!planetData[planet]) {
            console.warn('⚠️ planet-background.js: Unknown planet:', planet);
            return;
        }
        if (currentPlanet === planet) return;
        
        console.log('🪐 Changing planet to:', planet);
        currentPlanet = planet;
        generatePlanetBackground();
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
    // 🚀 ИНИЦИАЛИЗАЦИЯ И РЕЗАЙЗ
    // ==========================================
    function setCanvasSize() {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const pixelRatio = window.devicePixelRatio || 1;
        
        canvas.width = rect.width * pixelRatio;
        canvas.height = rect.height * pixelRatio;
        
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        if (isInitialized) {
            generatePlanetBackground();
        }
    }

    function init() {
        if (isInitialized) {
            console.warn('⚠️ [Background] init() вызван повторно, пропускаем');
            return;
        }

        setCanvasSize();
        generatePlanetBackground();

        window.addEventListener('resize', setCanvasSize);

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                pause();
            } else {
                resume();
                lastFrameTime = performance.now();
            }
        });

        // ✅ ИСПРАВЛЕНО: слушаем game:planetChanged вместо planet:changed
        // для совместимости с game-core.js
        if (window.EventBus) {
            window.EventBus.on('game:planetChanged', function(planet) {
                changePlanet(planet);
            });
        }

        isInitialized = true;
        console.log('✅ Planet Background System v2.3 initialized (Ready Gate + spriteCache fix)');    }

    // ✅ Экспорт API
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

    // ==========================================
    // 🚀 АВТОЗАПУСК (Ready Gate)
    // ==========================================

    function safeInit() {
        // ✅ Защита от повторного вызова
        if (isModuleInitialized) return;
        isModuleInitialized = true;
        
        init();
        
        // ✅ РЕГИСТРАЦИЯ ГОТОВНОСТИ
        if (window.EventBus) {
            window.EventBus.moduleReady('background');
        }
    }

    // ✅ ОСНОВНАЯ ЛОГИКА: используем Ready Gate если EventBus доступен
    if (window.EventBus) {
        window.EventBus.once('game:allReady', () => {
            console.log('[Background] game:allReady получен, запускаем safeInit');
            safeInit();
        });
    } else {
        // 🆘 FALLBACK: если EventBus не загрузился
        console.warn('⚠️ [Background] EventBus не найден! Используем fallback инициализацию');
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => setTimeout(safeInit, 200), { once: true });
        } else {
            setTimeout(safeInit, 200);
        }
    }

    window.addEventListener('beforeunload', () => stop());
})();
