// === ФОНОВЫЕ АНИМАЦИИ: МАРС (био) ===
function initMars() {
    bioDots = [];
    for (let i = 0; i < 50; i++) {
        bioDots.push({
            x: Math.random() * bioCanvas.width,
            y: Math.random() * bioCanvas.height,
            size: Math.random() * 4 + 1,
            speedX: (Math.random() - 0.5) * 1.5,
            speedY: (Math.random() - 0.5) * 1.5,
            color: `hsl(${Math.random() * 60 + 90}, 70%, 60%)`,
            directionChange: Math.random() * 0.02 + 0.01,
            changeCounter: 0
        });
    }
}

function animateMars() {
    const ctx = bioCanvas.getContext('2d');
    ctx.fillStyle = 'rgba(27, 94, 32, 0.05)';
    ctx.fillRect(0, 0, bioCanvas.width, bioCanvas.height);
    bioDots.forEach(d => {
        d.changeCounter++;
        if (d.changeCounter > 60) {
            d.speedX += (Math.random() - 0.5) * d.directionChange;
            d.speedY += (Math.random() - 0.5) * d.directionChange;
            d.changeCounter = 0;
        }
        d.speedX = Math.max(-1.5, Math.min(1.5, d.speedX));
        d.speedY = Math.max(-1.5, Math.min(1.5, d.speedY));
        d.x += d.speedX;
        d.y += d.speedY;
        if (d.x < 0 || d.x > bioCanvas.width) d.speedX *= -1;
        if (d.y < 0 || d.y > bioCanvas.height) d.speedY *= -1;
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
    });
    if (currentPlanet === 'mars') {
        requestAnimationFrame(animateMars);
    }
}
