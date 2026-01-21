// Планетарный фон с эффектом параллакса
(function() {
  const canvas = document.getElementById('planetBackgroundCanvas');
  const ctx = canvas.getContext('2d');
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  const parallaxSettings = {
    baseSpeed: 0.2,
    directionX: -1,
    directionY: 1,
    layers: {
      stars: 0.3,
      nebulae: 0.5,
      particles: 0.8,
      special: 1.0
    }
  };
  
  const fixedSettings = {
    speed: 5,
    density: 5,
    size: 5,
    smoothness: 5,
    nebulaIntensity: 3,
    starDensity: 2
  };
  
  let animationId = null;
  let currentPlanet = 'mercury';
  let time = 0;
  let particles = [];
  let specialElements = [];
  let nebulae = [];
  let stars = [];
  
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
  
  function setCanvasSize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    if (isMobile) {
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * pixelRatio;
      canvas.height = canvas.offsetHeight * pixelRatio;
      ctx.scale(pixelRatio, pixelRatio);
    }
  }
  
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
      this.lifetime = 1;
      this.maxLifetime = 1;
      this.parallaxFactor = parallaxFactor;
    }
    
    draw() {
      ctx.save();
      if (this.type === 'star') {
        const twinkleFactor = 0.7 + 0.3 * Math.sin(this.twinkle);
        ctx.globalAlpha = this.alpha * twinkleFactor * this.lifetime;
      } else if (this.type === 'ice') {
        ctx.globalAlpha = this.alpha * this.lifetime;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const x = Math.cos(angle) * this.radius;
          const y = Math.sin(angle) * this.radius;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
        return;
      } else {
        ctx.globalAlpha = this.alpha * this.lifetime;
      }
      
      ctx.translate(this.x, this.y);
      if (this.type === 'ring') {
        ctx.rotate(this.rotation);
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius/3, 0, 0, Math.PI * 2);
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
        ctx.lineTo(this.radius/2, 0);
        ctx.lineTo(0, this.radius);
        ctx.lineTo(-this.radius/2, 0);
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
      
      if (this.x < -this.radius * 2) {
        this.x = canvas.width + this.radius;
      } else if (this.x > canvas.width + this.radius * 2) {
        this.x = -this.radius;
      }
      if (this.y < -this.radius * 2) {
        this.y = canvas.height + this.radius;
      } else if (this.y > canvas.height + this.radius * 2) {
        this.y = -this.radius;
      }
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
      const velocity = { x: 0, y: 0 };
      stars.push(new Particle(x, y, radius, color, velocity, 'star', parallaxSettings.layers.stars));
    }
  }
  
  function generateNebulae() {
    const nebulaCount = fixedSettings.nebulaIntensity;
    nebulae = [];
    for (let i = 0; i < nebulaCount; i++) {
      const aspectRatio = canvas.width / canvas.height;
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 200 + (aspectRatio > 1 ? 80 : 120);
      const planetColors = planetData[currentPlanet].colors;
      const color = planetColors[Math.floor(Math.random() * planetColors.length)];
      const velocity = { x: (Math.random() - 0.5) * 0.05, y: (Math.random() - 0.5) * 0.05 };
      nebulae.push(new Particle(x, y, radius, color, velocity, 'nebula', parallaxSettings.layers.nebulae));
    }
  }
  
  function generateMercury() {
    const particleCount = fixedSettings.density * 15;
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * fixedSettings.size * 2 + 1;
      const color = planetData.mercury.colors[Math.floor(Math.random() * planetData.mercury.colors.length)];
      const speedValue = (Math.random() * 0.5 + 0.1) * fixedSettings.speed / 5;
      const angle = Math.random() * Math.PI * 2;
      const velocity = { x: Math.cos(angle) * speedValue, y: Math.sin(angle) * speedValue };
      particles.push(new Particle(x, y, radius, color, velocity, 'rock', parallaxSettings.layers.particles));
    }
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 20 + 10;
      const color = planetData.mercury.colors[3];
      const velocity = { x: 0, y: 0 };
      specialElements.push(new Particle(x, y, radius, color, velocity, 'sun', parallaxSettings.layers.special));
    }
  }
  
  function generateVenus() {
    const particleCount = fixedSettings.density * 20;
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * fixedSettings.size * 3 + 5;
      const color = planetData.venus.colors[Math.floor(Math.random() * planetData.venus.colors.length)];
      const speedValue = (Math.random() * 0.3 + 0.1) * fixedSettings.speed / 5;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) + Math.PI / 2;
      const velocity = {
        x: Math.cos(angle) * speedValue * (distance / 100),
        y: Math.sin(angle) * speedValue * (distance / 100)
      };
      particles.push(new Particle(x, y, radius, color, velocity, 'cloud', parallaxSettings.layers.particles));
    }
  }
  
  function generateEarth() {
    const particleCount = fixedSettings.density * 25;
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * fixedSettings.size * 2 + 2;
      const color = planetData.earth.colors[Math.floor(Math.random() * planetData.earth.colors.length)];
      const speedValue = (Math.random() * 0.5 + 0.2) * fixedSettings.speed / 5;
      const angle = Math.random() > 0.5 ? 
        Math.PI / 2 + (Math.random() - 0.5) * 0.5 : 
        -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      const velocity = { x: Math.cos(angle) * speedValue, y: Math.sin(angle) * speedValue };
      particles.push(new Particle(x, y, radius, color, velocity, 'water', parallaxSettings.layers.particles));
    }
  }
  
  function generateMars() {
    const particleCount = fixedSettings.density * 30;
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * fixedSettings.size + 1;
      const color = planetData.mars.colors[Math.floor(Math.random() * planetData.mars.colors.length)];
      const speedValue = (Math.random() * 1 + 0.5) * fixedSettings.speed / 5;
      const angle = Math.random() * Math.PI * 2;
      const velocity = { x: Math.cos(angle) * speedValue, y: Math.sin(angle) * speedValue };
      particles.push(new Particle(x, y, radius, color, velocity, 'dust', parallaxSettings.layers.particles));
    }
  }
  
  function generateJupiter() {
    const particleCount = fixedSettings.density * 15;
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * fixedSettings.size * 4 + 10;
      const color = planetData.jupiter.colors[Math.floor(Math.random() * planetData.jupiter.colors.length)];
      const speedValue = (Math.random() * 0.2 + 0.1) * fixedSettings.speed / 5;
      const direction = Math.random() > 0.5 ? 1 : -1;
      const velocity = { x: speedValue * direction, y: 0 };
      particles.push(new Particle(x, y, radius, color, velocity, 'storm', parallaxSettings.layers.particles));
    }
    const x = canvas.width * 0.7;
    const y = canvas.height * 0.5;
    const radius = 50;
    const color = planetData.jupiter.colors[3];
    const velocity = { x: -0.1 * fixedSettings.speed / 5, y: 0 };
    specialElements.push(new Particle(x, y, radius, color, velocity, 'spot', parallaxSettings.layers.special));
  }
  
  function generateSaturn() {
    const particleCount = fixedSettings.density * 10;
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 150;
      const x = canvas.width / 2 + Math.cos(angle) * distance;
      const y = canvas.height / 2 + Math.sin(angle) * distance;
      const radius = Math.random() * fixedSettings.size * 2 + 5;
      const color = planetData.saturn.colors[Math.floor(Math.random() * planetData.saturn.colors.length)];
      const speedValue = (Math.random() * 0.3 + 0.1) * fixedSettings.speed / 5;
      const orbitalAngle = angle + Math.PI / 2;
      const velocity = { x: Math.cos(orbitalAngle) * speedValue, y: Math.sin(orbitalAngle) * speedValue };
      particles.push(new Particle(x, y, radius, color, velocity, 'ring', parallaxSettings.layers.particles));
    }
    for (let i = 0; i < fixedSettings.density * 5; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * fixedSettings.size * 3 + 5;
      const color = planetData.saturn.colors[Math.floor(Math.random() * planetData.saturn.colors.length)];
      const speedValue = (Math.random() * 0.2 + 0.1) * fixedSettings.speed / 5;
      const angle = Math.random() * Math.PI * 2;
      const velocity = { x: Math.cos(angle) * speedValue, y: Math.sin(angle) * speedValue };
      particles.push(new Particle(x, y, radius, color, velocity, 'cloud', parallaxSettings.layers.particles));
    }
  }
  
  function generateUranus() {
    const particleCount = fixedSettings.density * 20;
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * fixedSettings.size * 2 + 3;
      const color = planetData.uranus.colors[Math.floor(Math.random() * planetData.uranus.colors.length)];
      const speedValue = (Math.random() * 0.2 + 0.05) * fixedSettings.speed / 5;
      const angle = Math.random() * Math.PI * 2;
      const velocity = { x: Math.cos(angle) * speedValue, y: Math.sin(angle) * speedValue };
      particles.push(new Particle(x, y, radius, color, velocity, 'ice', parallaxSettings.layers.particles));
    }
  }
  
  function generateNeptune() {
    const particleCount = fixedSettings.density * 25;
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * fixedSettings.size + 2;
      const color = planetData.neptune.colors[Math.floor(Math.random() * planetData.neptune.colors.length)];
      const speedValue = (Math.random() * 0.8 + 0.3) * fixedSettings.speed / 5;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) + Math.PI / 2;
      const velocity = {
        x: Math.cos(angle) * speedValue * (1 + distance / 200),
        y: Math.sin(angle) * speedValue * (1 + distance / 200)
      };
      particles.push(new Particle(x, y, radius, color, velocity, 'wind', parallaxSettings.layers.particles));
    }
    for (let i = 0; i < 3; i++) {
      const x = canvas.width * (0.2 + i * 0.3);
      const y = canvas.height * 0.5;
      const radius = 30 + Math.random() * 20;
      const color = planetData.neptune.colors[2];
      const velocity = { x: 0.2 * fixedSettings.speed / 5, y: 0 };
      specialElements.push(new Particle(x, y, radius, color, velocity, 'spot', parallaxSettings.layers.special));
    }
  }
  
  function generatePluto() {
    const particleCount = fixedSettings.density * 20;
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * fixedSettings.size * 1.5 + 2;
      const color = planetData.pluto.colors[Math.floor(Math.random() * planetData.pluto.colors.length)];
      const speedValue = (Math.random() * 0.3 + 0.1) * fixedSettings.speed / 5;
      const angle = Math.random() * Math.PI * 2;
      const velocity = { x: Math.cos(angle) * speedValue, y: Math.sin(angle) * speedValue };
      if (i % 3 === 0) {
        particles.push(new Particle(x, y, radius, color, velocity, 'ice', parallaxSettings.layers.particles));
      } else if (i % 3 === 1) {
        particles.push(new Particle(x, y, radius, color, velocity, 'crystal', parallaxSettings.layers.particles));
      } else {
        particles.push(new Particle(x, y, radius, color, velocity, 'rock', parallaxSettings.layers.particles));
      }
    }
    for (let i = 0; i < 3; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 30 + 20;
      const color = planetData.pluto.colors[3];
      const velocity = { x: (Math.random() - 0.5) * 0.1, y: (Math.random() - 0.5) * 0.1 };
      specialElements.push(new Particle(x, y, radius, color, velocity, 'ice', parallaxSettings.layers.special));
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
    time += 0.01;
    animateParticles();
    animationId = requestAnimationFrame(animate);
  }
  
  function generatePlanetBackground() {
    if (animationId) cancelAnimationFrame(animationId);
    
    particles = [];
    specialElements = [];
    nebulae = [];
    stars = [];
    
    generateStars();
    generateNebulae();
    
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
    
    genMap[currentPlanet]();
    animate();
  }
  
  function changePlanet(planet) {
    currentPlanet = planet;
    generatePlanetBackground();
  }
  
  function init() {
    setCanvasSize();
    generatePlanetBackground();
    window.addEventListener('resize', setCanvasSize);
  }
  
  window.planetBackground = {
    init: init,
    setPlanet: changePlanet,
    setCanvasSize: setCanvasSize
  };
})();