// === ФОНОВЫЕ АНИМАЦИИ: ВЕНЕРА (лава) ===
function initVenus() {
    lavaParticles = [];
    for (let i = 0; i < 60; i++) {
        lavaParticles.push({
            x: Math.random() * lavaCanvas.width,
            y: lavaCanvas.height + Math.random() * 100,
            size: Math.random() * 8 + 3,
            speed: Math.random() * 3 + 1,
            color: `hsl(${Math.random() * 20 + 10}, 80%, ${Math.random() * 30 + 50}%)`,
            sway: (Math.random() - 0.5) * 0.5
        });
    }
}

function animateVenus() {
    const ctx = lavaCanvas.getContext('2d');
    ctx.fillStyle = 'rgba(62, 39, 35, 0.1)';
    ctx.fillRect(0, 0, lavaCanvas.width, lavaCanvas.height);
    lavaParticles.forEach(p => {
        p.y -= p.speed;
        p.x += p.sway;
        if (p.y < -20) {
            p.y = lavaCanvas.height + 20;
            p.x = Math.random() * lavaCanvas.width;
            p.speed = Math.random() * 3 + 1;
            p.sway = (Math.random() - 0.5) * 0.5;
        }
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    if (currentPlanet === 'venus') {
        requestAnimationFrame(animateVenus);
    }
}
