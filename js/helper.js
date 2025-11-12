// === ПОМОЩНИК ===
function activateHelper() {
    if (helperActive) return;
    helperActive = true;
    helperTimeLeft = helperDuration;
    gameMetrics.upgradesBought++;
    helperInterval = setInterval(() => {
        if (helperActive && currentBlock && gameActive) {
            helperAttack();
        }
    }, 1500);
    const helperTimer = setInterval(() => {
        if (!helperActive) {
            clearInterval(helperTimer);
            return;
        }
        helperTimeLeft -= 1000;
        updateHelperTimer();
        if (helperTimeLeft <= 0) {
            helperActive = false;
            clearInterval(helperInterval);
            clearInterval(helperTimer);
            updateHelperTimer();
            updateUpgradeButtons();
            showTooltip('Помощник закончил работу!');
            setTimeout(hideTooltip, 1500);
        }
    }, 1000);
    updateUpgradeButtons();
    playSound('helperSound');
    showTooltip('Помощник активирован на 1 минуту!');
    setTimeout(hideTooltip, 1500);
}

function helperAttack() {
    if (!currentBlock || !helperActive) return;
    createHelperEffect();

    // --- ТОЧНАЯ ЛОГИКА ИЗ ИСХОДНОГО КОДА ---
    const damage = Math.floor(clickPower * helperDamageMultiplier);
    currentBlockHealth -= damage;
    gameMetrics.totalClicks++;
    createDamageText(damage, currentBlock, false);
    currentBlock.textContent = currentBlockHealth; // Обновляем текст
    updateCracks(currentBlock, currentBlockHealth);
    updateHUD();

    // Проверяем разрушение СРАЗУ после обновления текста
    if (currentBlockHealth <= 0) {
        destroyBlock(currentBlock, currentLevelOnPlanet);
    }
    // ---
}

function createHelperEffect() {
    if (!currentBlock) return;
    const blockRect = currentBlock.getBoundingClientRect();
    const helperX = blockRect.left + Math.random() * blockRect.width;
    const helperY = blockRect.top - 50;
    const helper = document.createElement('div');
    helper.className = 'helper';
    helper.style.left = helperX + 'px';
    helper.style.top = helperY + 'px';
    document.body.appendChild(helper);
    const beam = document.createElement('div');
    beam.className = 'helper-beam';
    beam.style.left = (helperX + 20) + 'px';
    beam.style.top = (helperY + 40) + 'px';
    document.body.appendChild(beam);
    setTimeout(() => {
        if (helper.parentNode) document.body.removeChild(helper);
        if (beam.parentNode) document.body.removeChild(beam);
    }, 1000);
}

function updateHelperTimer() {
    if (helperTimerDisplay) {
        if (helperActive) {
            const seconds = Math.ceil(helperTimeLeft / 1000);
            helperTimerDisplay.textContent = `Помощник: ${seconds}с`;
        } else {
            helperTimerDisplay.textContent = `Помощник: —`;
        }
    }
}
