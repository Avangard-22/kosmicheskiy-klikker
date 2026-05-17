// game-features.js
(function() {
'use strict';
const CFG = window.GAME_CONFIG;
const UI = window.GAME_UI;

window.GAME_FEATURES = {

createExplosion: function(block) {
    if (!block) return;
    const rect = block.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const sz = /Android|webOS|iPhone/i.test(navigator.userAgent) ? 150 : 200;
    
    const ex = document.createElement('div');
    ex.className = 'explosion';
    ex.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:${sz}px;height:${sz}px;`;
    document.body.appendChild(ex);
    
    const cnt = sz === 150 ? 20 : 25;
    for (let i = 0; i < cnt; i++) {
        const p = document.createElement('div');
        p.className = 'explosion-particle';
        p.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:${sz===150?10:12}px;height:${sz===150?10:12}px;`;
        p.style.backgroundColor = CFG.locations[window.gameState.currentLocation].blockColors[Math.floor(Math.random()*4)];
        const a = Math.random() * Math.PI * 2;
        const d = 50 + Math.random() * 100;
        p.style.setProperty('--tx', Math.cos(a)*d + 'px');
        p.style.setProperty('--ty', Math.sin(a)*d + 'px');
        document.body.appendChild(p);
        setTimeout(() => p.parentNode?.removeChild(p), 800);
    }
    setTimeout(() => ex.parentNode?.removeChild(ex), 600);
},

applyUpgradePenalty: function() {
    if (!window.gameState) return;
    
    // ✅ Проверка на GAME_CORE
    if (window.GAME_CORE && window.GAME_CORE.getBonus && window.GAME_CORE.getBonus('isInvincible', false)) {
        console.log("🛡️ Неуязвимость активна. Штраф отменён!");
        return;
    }
    
    const ups = [
        { n:'Сила удара', g:()=>window.gameState.clickUpgradeLevel, s:v=>{window.gameState.clickUpgradeLevel=v;} },
        { n:'Шанс крита', g:()=>window.gameState.critChanceUpgradeLevel, s:v=>{window.gameState.critChanceUpgradeLevel=v; window.gameState.critChance=Math.max(0.001,0.001+v*0.001);} },
        { n:'Множитель крита', g:()=>window.gameState.critMultiplierUpgradeLevel, s:v=>{window.gameState.critMultiplierUpgradeLevel=v; window.gameState.critMultiplier=Math.max(2,2+v*0.2);} },
        { n:'Урон Bobo', g:()=>window.gameState.helperUpgradeLevel, s:v=>{window.gameState.helperUpgradeLevel=v;} }
    ];
    
    const u = ups[Math.floor(Math.random()*ups.length)];
    const pct = CFG.balanceConfig.penaltyMin + Math.random()*(CFG.balanceConfig.penaltyMax-CFG.balanceConfig.penaltyMin);
    const cur = u.g(); 
    if(cur <=0) return;
    
    u.s(Math.max(0, Math.floor(cur*(1-pct))));
    
    // ✅ Безопасный вызов calculateClickPower
    if (window.GAME_CORE && window.GAME_CORE.calculateClickPower) {
        window.gameState.clickPower = window.GAME_CORE.calculateClickPower();
    }
    
    const pan = document.getElementById('penaltyAnnounce');
    if(pan){ 
        pan.innerHTML=`<div style="font-size:1.5em;color:#ff6b6b;font-weight:bold;">⚠️ ШТРАФ!</div><div style="font-size:1.1em;color:#fff;margin:10px 0;">${u.n} -${Math.round(pct*100)}%</div>`; 
        pan.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,rgba(255,107,107,0.95),rgba(255,68,68,0.95));color:#fff;padding:30px 40px;border-radius:15px;z-index:2000;text-align:center;font-family:Orbitron,sans-serif;box-shadow:0 10px 40px rgba(255,107,107,0.5);border:3px solid #ff4444;'; 
        pan.style.opacity='1'; 
        pan.style.display='block'; 
        setTimeout(()=>{pan.style.opacity='0';setTimeout(()=>pan.style.display='none',500);},2500); 
    }
    
    // ✅ Безопасный вызов playSound
    if (window.GAME_CORE && window.GAME_CORE.playSound) {
        window.GAME_CORE.playSound('penaltySound');
    } else {
        const s = document.getElementById('penaltySound');
        if (s) { s.currentTime = 0; s.play().catch(()=>{}); }
    }
    
    if(window.telegramHaptic) window.telegramHaptic.error(); 
    else if(navigator.vibrate) navigator.vibrate([200,100,200]);
    
    UI.updateHUD(); 
    UI.updateUpgradeButtons(); 
    window.saveGame();
},

activateHelper: function() {
    if (!window.gameState) return;
    
    // ✅ Проверка на GAME_CORE
    if (!window.GAME_CORE) {
        console.error('❌ GAME_CORE не инициализирован!');
        return;
    }
    
    if (window.gameState.helperActive && window.GAME_CORE.helperInterval) clearInterval(window.GAME_CORE.helperInterval);
    if (window.gameState.helperActive && window.GAME_CORE.helperTimer) clearInterval(window.GAME_CORE.helperTimer);
    
    window.gameState.helperActive = true;
    window.gameState.helperTimeLeft = 60000;
    window.gameState.boboCoinBonus = 0.2;
    
    window.GAME_CORE.createHelperElement();
    
    window.GAME_CORE.helperInterval = setInterval(() => { 
        if (window.gameState?.helperActive && window.GAME_CORE.currentBlock && window.gameState.gameActive && !window.GAME_CORE.isGamePaused) {
            window.GAME_CORE.helperAttack(); 
        }
    }, 1500);
    
    window.GAME_CORE.helperTimer = setInterval(() => {
        if (!window.gameState || !window.gameState.helperActive) { 
            if(window.GAME_CORE.helperTimer) clearInterval(window.GAME_CORE.helperTimer); 
            window.GAME_CORE.helperTimer=null; 
            return; 
        }
        
        window.gameState.helperTimeLeft -= 1000;
        
        if (window.gameState.helperTimeLeft <= 0) {
            window.gameState.helperActive = false;
            
            if(window.GAME_CORE.helperInterval) { 
                clearInterval(window.GAME_CORE.helperInterval); 
                window.GAME_CORE.helperInterval=null; 
            }
            if(window.GAME_CORE.helperTimer) { 
                clearInterval(window.GAME_CORE.helperTimer); 
                window.GAME_CORE.helperTimer=null; 
            }
            
            window.gameState.boboCoinBonus = 0;
            
            if(window.GAME_CORE.helperElement) { 
                window.GAME_CORE.helperElement.style.opacity='0'; 
                setTimeout(()=>{
                    if(window.GAME_CORE.helperElement?.parentNode) document.body.removeChild(window.GAME_CORE.helperElement); 
                    window.GAME_CORE.helperElement=null;
                },300); 
            }
            
            UI.updateUpgradeButtons();
            
            if(window.showTooltip) { 
                window.showTooltip(window.translations[window.currentLanguage].tooltips.helperEnd); 
                setTimeout(window.hideTooltip,1500); 
            }
        }
    }, 1000);
    
    UI.updateUpgradeButtons(); 
    UI.updateHUD();
    
    if(window.showTooltip) { 
        window.showTooltip(window.translations[window.currentLanguage].tooltips.helperAvailable); 
        setTimeout(window.hideTooltip,2500); 
    }
    
    window.saveGame();
},

buyClickPower: function() {
    if (!window.gameState) {
        console.error('❌ gameState не инициализирован!');
        return;
    }
    
    // ✅ Проверка и инициализация
    if (window.gameState.clickUpgradeLevel === undefined) {
        window.gameState.clickUpgradeLevel = 0;
        console.log('⚠️ clickUpgradeLevel не был инициализирован, установлен 0');
    }
    
    const cost = Math.floor(CFG.costs.baseClickUpgradeCost * Math.pow(1.5, window.gameState.clickUpgradeLevel));
    
    console.log('💰 Покупка силы удара:', {
        cost: cost,
        coins: window.gameState.coins,
        level: window.gameState.clickUpgradeLevel,
        canAfford: window.gameState.coins >= cost
    });
    
    if (window.gameState.coins >= cost) {
        window.gameState.coins -= cost;
        window.gameState.clickUpgradeLevel++; 
        
        // ✅ Безопасный вызов calculateClickPower
        if (window.GAME_CORE && window.GAME_CORE.calculateClickPower) {
            const oldPower = window.gameState.clickPower;
            window.gameState.clickPower = window.GAME_CORE.calculateClickPower();
            
            console.log('✅ Сила удара увеличена:', {
                oldLevel: window.gameState.clickUpgradeLevel - 1,
                newLevel: window.gameState.clickUpgradeLevel,
                oldPower: oldPower,
                newPower: window.gameState.clickPower
            });
        } else {
            console.warn('⚠️ GAME_CORE.calculateClickPower недоступен');
        }
        
        window.gameMetrics.upgradesBought = (window.gameMetrics.upgradesBought || 0) + 1;
        if (window.achievementsSystem) window.achievementsSystem.incrementUpgrades(1); 
        
        UI.updateHUD(); 
        UI.updateUpgradeButtons(); 
        
        // ✅ Безопасный вызов playSound
        if (window.GAME_CORE && window.GAME_CORE.playSound) {
            window.GAME_CORE.playSound('upgradeSound');
        } else {
            const s = document.getElementById('upgradeSound');
            if (s) { s.currentTime = 0; s.play().catch(()=>{}); }
        }
        
        const btn = document.getElementById('upgradeClickBtn'); 
        if (btn) { 
            btn.style.transform='scale(1.1)'; 
            btn.style.boxShadow='0 0 20px #4CAF50'; 
            setTimeout(()=>{
                btn.style.transform='scale(1)';
                btn.style.boxShadow='';
            },300); 
        }
        
        if(window.showTooltip) { 
            window.showTooltip(window.formatString(window.translations[window.currentLanguage].tooltips.clickPowerUpgrade,{
                power: Math.round(window.gameState.clickPower)
            })); 
            setTimeout(window.hideTooltip,1500); 
        }
        
        window.saveGame();
    } else {
        console.warn('⚠️ Недостаточно кристаллов для покупки силы удара');
        const btn = document.getElementById('upgradeClickBtn');
        if (btn) {
            btn.style.animation = 'shake 0.5s';
            setTimeout(() => btn.style.animation = '', 500);
        }
    }
},

buyHelper: function() {
    if (!window.gameState) {
        console.error('❌ gameState не инициализирован!');
        return;
    }
    
    const baseCost = Math.floor(CFG.costs.baseHelperUpgradeCost * Math.pow(1.4, window.gameState.helperUpgradeLevel));
    const actBonus = Math.floor((window.gameState.helperActivations || 0) / 10);
    const cost = Math.floor(baseCost * (1 + actBonus * 0.2));
    
    if (window.gameState.coins >= cost) {
        window.gameState.coins -= cost;
        window.gameState.helperActivations = (window.gameState.helperActivations || 0) + 1;
        window.gameMetrics.helpersBought = (window.gameMetrics.helpersBought || 0) + 1;
        
        if (window.achievementsSystem) window.achievementsSystem.incrementHelpers(1);
        
        const btn = document.getElementById('upgradeHelperBtn'); 
        if (btn) { 
            btn.style.transform='scale(1.1)'; 
            btn.style.boxShadow='0 0 20px #4CAF50'; 
            setTimeout(()=>{
                btn.style.transform='scale(1)';
                btn.style.boxShadow='';
            },300); 
        }
        
        this.activateHelper(); 
        UI.updateHUD(); 
        UI.updateUpgradeButtons(); 
        window.saveGame();
    }
},

buyCritChance: function() {
    if (!window.gameState) return;
    
    const cost = Math.floor(CFG.costs.baseCritChanceCost * Math.pow(1.3, window.gameState.critChanceUpgradeLevel));
    
    if (window.gameState.coins >= cost) {
        window.gameState.coins -= cost;
        window.gameState.critChance = Math.min(1.0, window.gameState.critChance + 0.001);
        window.gameState.critChanceUpgradeLevel++;
        window.gameMetrics.upgradesBought = (window.gameMetrics.upgradesBought || 0) + 1;
        
        if (window.achievementsSystem) window.achievementsSystem.incrementUpgrades(1);
        
        UI.updateHUD(); 
        UI.updateUpgradeButtons(); 
        
        if (window.GAME_CORE && window.GAME_CORE.playSound) {
            window.GAME_CORE.playSound('upgradeSound');
        }
        
        const btn = document.getElementById('upgradeCritChanceBtn');
        if (btn) {  
            btn.style.transform='scale(1.1)'; 
            btn.style.boxShadow='0 0 20px #FFD700'; 
            setTimeout(()=>{
                btn.style.transform='scale(1)';
                btn.style.boxShadow='';
            },300); 
        }
        
        if(window.showTooltip) { 
            window.showTooltip(window.formatString(window.translations[window.currentLanguage].tooltips.critChanceUpgrade,{
                chance:(window.gameState.critChance*100).toFixed(1)
            })); 
            setTimeout(window.hideTooltip,1500); 
        }
        
        window.saveGame();
    }
},

buyCritMultiplier: function() {
    if (!window.gameState) return;
    
    const cost = Math.floor(CFG.costs.baseCritMultiplierCost * Math.pow(1.25, window.gameState.critMultiplierUpgradeLevel));
    
    if (window.gameState.coins >= cost) {
        window.gameState.coins -= cost;
        window.gameState.critMultiplier += 0.2;
        window.gameState.critMultiplierUpgradeLevel++;
        window.gameMetrics.upgradesBought = (window.gameMetrics.upgradesBought || 0) + 1;
        
        if (window.achievementsSystem) window.achievementsSystem.incrementUpgrades(1);
        
        UI.updateHUD(); 
        UI.updateUpgradeButtons(); 
        
        if (window.GAME_CORE && window.GAME_CORE.playSound) {
            window.GAME_CORE.playSound('upgradeSound');
        }
        
        const btn = document.getElementById('upgradeCritMultBtn');
        if (btn) { 
            btn.style.transform='scale(1.1)'; 
            btn.style.boxShadow='0 0 20px #FFD700'; 
            setTimeout(()=>{
                btn.style.transform='scale(1)';
                btn.style.boxShadow='';
            },300); 
        }
        
        if(window.showTooltip) { 
            window.showTooltip(window.formatString(window.translations[window.currentLanguage].tooltips.critMultUpgrade,{
                mult:window.gameState.critMultiplier.toFixed(1)
            })); 
            setTimeout(window.hideTooltip,1500); 
        }
        
        window.saveGame();
    }
},

buyHelperDamage: function() {
    if (!window.gameState) return;
    
    const cost = Math.floor(CFG.costs.baseHelperDmgCost * Math.pow(1.8, window.gameState.helperUpgradeLevel));
    
    if (window.gameState.coins >= cost) {
        window.gameState.coins -= cost;
        window.gameState.helperUpgradeLevel++;
        window.gameMetrics.upgradesBought = (window.gameMetrics.upgradesBought || 0) + 1;
        
        if (window.achievementsSystem) window.achievementsSystem.incrementUpgrades(1);
        
        UI.updateHUD(); 
        UI.updateUpgradeButtons(); 
        
        if (window.GAME_CORE && window.GAME_CORE.playSound) {
            window.GAME_CORE.playSound('upgradeSound');
        }
        
        const btn = document.getElementById('upgradeHelperDmgBtn');
        if (btn) { 
            btn.style.transform='scale(1.1)'; 
            btn.style.boxShadow='0 0 20px #4CAF50'; 
            setTimeout(()=>{
                btn.style.transform='scale(1)';
                btn.style.boxShadow='';
            },300); 
        }
        
        if(window.showTooltip) { 
            window.showTooltip(window.formatString(window.translations[window.currentLanguage].tooltips.helperDmgUpgrade,{
                level:window.gameState.helperUpgradeLevel
            })); 
            setTimeout(window.hideTooltip,1500); 
        }
        
        window.saveGame();
    }
}

};
})();