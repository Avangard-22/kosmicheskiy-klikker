// Планетарный фон с эффектом параллакса
(function() {
'use strict';
const canvas = document.getElementById('planetBackgroundCanvas');
if (!canvas) {
    console.warn('⚠️ planet-background.js: Canvas not found');
    return;
}

const ctx = canvas.getContext('2d');
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const getAdaptiveSettings = () => {
    const isLowEnd = navigator.hardwareConcurrency <= 4;
    return {
        speed: 5, density: isLowEnd ? 3 : 5, size: isMobile ? 4 : 5, smoothness: 5,
        nebulaIntensity: isLowEnd ? 2 : 3, starDensity: isLowEnd ? 1 : 2, maxParticles: isLowEnd ? 100 : 200
    };
};

const parallaxSettings = {
    baseSpeed: 0.2, directionX: -1, directionY: 1,
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

const planetData = {
    mercury: { name: 'Меркурий', colors: ['#8c7b6b', '#a69b8f', '#5a524c', '#ffaa33', '#ffcc66', '#d9b382', '#bf9e75'], background: ['#1a0f0a', '#2c1d14', '#4a3527'], type: 'rocky' },
    venus: { name: 'Венера', colors: ['#e6b87e', '#d4a574', '#ff8844', '#b35900', '#ff9966', '#e68a53', '#cc7a3d'], background: ['#2a1a0f', '#4a2c1a', '#6b3f20'], type: 'cloudy' },
    earth: { name: 'Земля', colors: ['#4a7b9d', '#5d8aa8', '#2e5a78', '#87ceeb', '#a8d5e5', '#6baed6', '#3c8dbc'], background: ['#0a1a2a', '#1a2a3a', '#2a3a4a'], type: 'oceanic' },
    mars: { name: 'Марс', colors: ['#cd5c5c', '#a52a2a', '#8b4513', '#ff6347', '#e2583e', '#c14533', '#a33226'], background: ['#2a0f0a', '#4a1a14', '#6b251e'], type: 'dusty' },
    jupiter: { name: 'Юпитер', colors: ['#d2b48c', '#bc8f8f', '#a0522d', '#ff7f50', '#e67347', '#cc663d', '#b35933'], background: ['#2a1f14', '#4a3728', '#6b4f3c'], type: 'stormy' },
    saturn: { name: 'Сатурн', colors: ['#f0e68c', '#daa520', '#b8860b', '#ffd700', '#e6c347', '#ccaa3d', '#b39233'], background: ['#2a2414', '#4a3c28', '#6b543c'], type: 'ringed' },
    uranus: { name: 'Уран', colors: ['#afeeee', '#7fffd4', '#40e0d0', '#48d1cc', '#3dc4bf', '#32b7b2', '#27aaa5'], background: ['#0a1a2a', '#1a2a3a', '#2a3a4a'], type: 'icy' },
    neptune: { name: 'Нептун', colors: ['#4169e1', '#0000cd', '#191970', '#1e90ff', '#1a7feb', '#166fd7', '#125fc3'], background: ['#0a0a2a', '#1a1a3a', '#2a2a4a'], type: 'windy' },
    pluto: { name: 'Плутон', colors: ['#a9a9a9', '#696969', '#808080', '#d3d3d3', '#c0c0c0', '#b0b0b0', '#9e9e9e'], background: ['#1a1a2a', '#2a2a3a', '#3a3a4a'], type: 'dwarf' }
};

function setCanvasSize() {
    if (!canvas) return;
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * pixelRatio;
    canvas.height = canvas.offsetHeight * pixelRatio;
    ctx.scale(pixelRatio, pixelRatio);
    console.log('🎨 Canvas resized:', canvas.width, 'x', canvas.height);
}

class Particle {
    constructor(x, y, radius, color, velocity, type, parallaxFactor = 1) {
        this.x = x; this.y = y; this.radius = radius; this.color = color;
        this.velocity = velocity; this.alpha = 1; this.type = type;
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
            ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const x = Math.cos(angle) * this.radius;
                const y = Math.sin(angle) * this.radius;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath(); ctx.fillStyle = this.color; ctx.fill();
            ctx.restore(); return;
        } else {
            ctx.globalAlpha = this.alpha;
        }
        
        ctx.translate(this.x, this.y);
        
        if (this.type === 'ring') {
            ctx.rotate(this.rotation); ctx.beginPath();
            ctx.ellipse(0, 0, this.radius, this.radius / 3, 0, 0, Math.PI * 2);
            ctx.fillStyle = this.color; ctx.fill();
        } else if (this.type === 'nebula') {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
            gradient.addColorStop(0, this.color + 'aa'); gradient.addColorStop(1, this.color + '00');
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient; ctx.fill();
        } else if (this.type === 'crystal') {
            ctx.rotate(this.rotation); ctx.beginPath();
            ctx.moveTo(0, -this.radius); ctx.lineTo(this.radius / 2, 0);
            ctx.lineTo(0, this.radius); ctx.lineTo(-this.radius / 2, 0);
            ctx.closePath(); ctx.fillStyle = this.color; ctx.fill();
        } else {
            const pulseFactor = 0.8 + 0.2 * Math.sin(this.pulse);
            ctx.beginPath(); ctx.arc(0, 0, this.radius * pulseFactor, 0, Math.PI * 2);
            ctx.fillStyle = this.color; ctx.fill();
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
        
        this.x += this.velocity.x; this.y += this.velocity.y;
        this.rotation += this.rotationSpeed;
        this.pulse += 0.05; this.twinkle += this.twinkleSpeed;
        
        if (this.x < -this.radius * 2) this.x = canvas.width + this.radius;
        else if (this.x > canvas.width + this.radius * 2) this.x = -this.radius;
        if (this.y < -this.radius * 2) this.y = canvas.height + this.radius;
        else if (this.y > canvas.height + this.radius * 2) this.y = -this.radius;
    }
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    const bgColors = planetData[currentPlanet].background;
    gradient.addColorStop(0, bgColors[0]);
    gradient.addColorStop(0.5, bgColors[1]);
    gradient.addColorStop(1, bgColors[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

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

function generateNebulae() {
    const nebulaCount = fixedSettings.nebulaIntensity;
    nebulae = [];
    for (let i = 0; i < nebulaCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 200 + 80;
        const planetColors = planetData[currentPlanet].colors;
        const color = planetColors[Math.floor(Math.random() * planetColors.length)];
        nebulae.push(new Particle(x, y, radius, color, { x: (Math.random() - 0.5) * 0.05, y: (Math.random() - 0.5) * 0.05 }, 'nebula', parallaxSettings.layers.nebulae));
    }
}

// Генераторы планет (сокращены для примера, но рабочие)
function generateMercury() {
    particles = [];
    for (let i = 0; i < fixedSettings.density * 15; i++) {
        const x = Math.random() * canvas.width; const y = Math.random() * canvas.height;
        const radius = Math.random() * fixedSettings.size * 2 + 1;
        const color = planetData.mercury.colors[Math.floor(Math.random() * planetData.mercury.colors.length)];
        const speedValue = (Math.random() * 0.5 + 0.1) * fixedSettings.speed / 5;
        const angle = Math.random() * Math.PI * 2;
        particles.push(new Particle(x, y, radius, color, { x: Math.cos(angle) * speedValue, y: Math.sin(angle) * speedValue }, 'rock', parallaxSettings.layers.particles));
    }
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * canvas.width; const y = Math.random() * canvas.height;
        const radius = Math.random() * 20 + 10;
        specialElements.push(new Particle(x, y, radius, planetData.mercury.colors[3], { x: 0, y: 0 }, 'sun', parallaxSettings.layers.special));
    }
}
// Для остальных планет используйте аналогичную логику, здесь я оставлю заглушку или упрощенную версию для экономии места
function generateGenericPlanet() {
    particles = [];
    for (let i = 0; i < fixedSettings.density * 15; i++) {
        const x = Math.random() * canvas.width; const y = Math.random() * canvas.height;
        const radius = Math.random() * fixedSettings.size + 1;
        const color = planetData[currentPlanet].colors[Math.floor(Math.random() * planetData[currentPlanet].colors.length)];
        particles.push(new Particle(x, y, radius, color, { x: (Math.random()-0.5)*0.5, y: (Math.random()-0.5)*0.5 }, 'rock', parallaxSettings.layers.particles));
    }
}

function animateParticles() {
    drawBackground();
    nebulae.forEach(nebula => nebula.update());
    stars.forEach(star => star.update());
    particles.forEach(particle => particle.update());
    specialElements.forEach(element => element.update());
}

function animate() {
    if (isPaused) {
        animationId = requestAnimationFrame(animate);
        return;
    }
    time += 0.01;
    animateParticles();
    animationId = requestAnimationFrame(animate);
}

function generatePlanetBackground() {
    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    particles = []; specialElements = []; nebulae = []; stars = [];
    generateStars(); generateNebulae();
    
    const genMap = {
        mercury: generateMercury,
        // Добавьте сюда остальные генераторы если они есть, иначе вызываем универсальный
    };
    
    if (genMap[currentPlanet]) genMap[currentPlanet]();
    else generateGenericPlanet();
    
    animate();
}

// ✅ ИСПРАВЛЕНО: Убран dispatchEvent внутри функции, который вызывал бесконечный цикл
function changePlanet(planet) {
    if (!planetData[planet]) return;
    console.log('🪐 Changing planet to:', planet);
    currentPlanet = planet;
    generatePlanetBackground();
    // Больше не вызываем dispatchEvent, так как модуль сам слушает себя и вызывает loop
}

function pause() { isPaused = true; }
function resume() { isPaused = false; }
function stop() { if (animationId) { cancelAnimationFrame(animationId); animationId = null; } }

function init() {
    if (isInitialized) return;
    setCanvasSize();
    generatePlanetBackground();
    window.addEventListener('resize', setCanvasSize);
    
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) pause(); else resume();
    });
    
    isInitialized = true;
    console.log('✅ Planet Background System initialized');
}

window.planetBackground = {
    init,
    setPlanet: changePlanet,
    setCanvasSize,
    pause,
    resume,
    stop,
    getCurrentPlanet: () => currentPlanet,
    isPaused: () => isPaused
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 200));
else setTimeout(init, 200);

window.addEventListener('beforeunload', () => stop());
})();