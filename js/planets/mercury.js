// === ФОНОВЫЕ АНИМАЦИИ: МЕРКУРИЙ (звёзды) ===
function initMercury() {
    stars = [];
    for (let i = 0; i < 150; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5;
        const distance = Math.random() * Math.max(starsCanvas.width, starsCanvas.height) * 0.8;
        stars.push({
            x: starsCanvas.width / 2 + Math.cos(angle) * distance,
            y: starsCanvas.height / 2 + Math.sin(angle) * distance,
            size: Math.random() * 3 + 0.5,
            speed: speed,
            angle: angle,
            opacity: Math.random() * 0.8 + 0.2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        });
    }
}

function animateMercury() {
    const ctx = starsCanvas.getContext('2d');
    ctx.fillStyle = 'rgba(11, 11, 29, 0.1)';
    ctx.fillRect(0, 0, starsCanvas.width, starsCanvas.height);
    const centerX = starsCanvas.width / 2;
    const centerY = starsCanvas.height / 2;
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        star.x += star.vx;
        star.y += star.vy;
        if (star.x < -50 || star.x > starsCanvas.width + 50 || 
            star.y < -50 || star.y > starsCanvas.height + 50) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5;
            star.x = centerX;
            star.y = centerY;
            star.vx = Math.cos(angle) * speed;
            star.vy = Math.sin(angle) * speed;
            star.size = Math.random() * 3 + 0.5;
            star.opacity = Math.random() * 0.8 + 0.2;
        }
        ctx.globalAlpha = star.opacity;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (currentPlanet === 'mercury') {
        requestAnimationFrame(animateMercury);
    }
}
