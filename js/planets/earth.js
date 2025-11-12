// === ФОНОВЫЕ АНИМАЦИИ: ЗЕМЛЯ (снег) ===
function initEarth() {
    snowflakes = [];
    for (let i = 0; i < 80; i++) {
        snowflakes.push({
            x: Math.random() * iceCanvas.width,
            y: Math.random() * -iceCanvas.height,
            size: Math.random() * 5 + 2,
            speed: Math.random() * 2 + 0.5,
            sway: Math.random() * 0.03,
            swaySpeed: Math.random() * 0.05 + 0.02
        });
    }
}

function animateEarth() {
    const ctx = iceCanvas.getContext('2d');
    ctx.fillStyle = 'rgba(13, 71, 161, 0.05)';
    ctx.fillRect(0, 0, iceCanvas.width, iceCanvas.height);
    snowflakes.forEach(f => {
        f.y += f.speed;
        f.x += Math.sin(f.y * f.swaySpeed) * f.sway;
        if (f.y > iceCanvas.height) {
            f.y = -10;
            f.x = Math.random() * iceCanvas.width;
            f.speed = Math.random() * 2 + 0.5;
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
    });
    if (currentPlanet === 'earth') {
        requestAnimationFrame(animateEarth);
    }
}
