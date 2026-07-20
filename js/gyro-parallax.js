// js/gyro-parallax.js
// ═══════════════════════════════════════════════════
//  ГИРОСКОПИЧЕСКИЙ ПАРАЛЛАКС ФОНА
// ЧТО: Двигает ТОЛЬКО отдельный слой космоса, не затрагивая UI
// ЗАЧЕМ: Эффект "иллюминатора" — звёзды плывут, интерфейс статичен
// ВАЖНО: Создаёт собственный контейнер #gyroBackground поверх всего
// ══════════════════════════════════════════════════
(function() {
'use strict';

const GyroParallax = {
    // ── Настройки ──
    config: {
        maxTilt: 20,          // Максимальный угол наклона (градусы)
        maxShift: 25,         // Максимальный сдвиг фона (пиксели)
        smoothness: 0.06,     // Плавность (0.01 = очень плавно, 0.15 = резко)
        enabled: false,
        useGyro: false,
        // ✅ НОВОЕ: Фон будет больше экрана, чтобы при сдвиге не было видно краёв
        overflow: 1.15        // 115% от размера экрана
    },
    
    // ── Состояние ──
    currentX: 0,
    currentY: 0,
    targetX: 0,
    targetY: 0,
    animationId: null,
    isIOS: false,
    permissionGranted: false,
    
    // ── DOM элементы ──
    bgContainer: null,        // Наш собственный контейнер фона
    starsLayer: null,         // Слой со звёздами
    nebulaLayer: null,        // Слой с туманностями
    toggleBtn: null,
    
    // ═══════════════════════════════════════════════
    // 🔍 ИНИЦИАЛИЗАЦИЯ
    // ═══════════════════════════════════════════════
    init: function() {
        if (!this.isMobileDevice()) {
            console.log('🌌 [GYRO] Desktop — parallax disabled');
            return;
        }
        
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        // ✅ КЛЮЧЕВОЕ: Создаём СОБСТВЕННЫЙ контейнер фона
        this.createBackgroundContainer();
        
        // Создаём кнопку включения
        this.createToggleButton();
        
        // Запускаем цикл анимации
        this.startAnimationLoop();
        
        console.log('🌌 [GYRO] Initialized with dedicated background layer');
    },
    
    // ═══════════════════════════════════════════════
    // 🎨 СОЗДАНИЕ ОТДЕЛЬНОГО СЛОЯ ФОНА
    // ═══════════════════════════════════════════════
    createBackgroundContainer: function() {
        // Удаляем старый если есть
        if (this.bgContainer) {
            this.bgContainer.remove();
        }
        
        // ✅ Создаём контейнер, который будет ДВИГАТЬСЯ
        this.bgContainer = document.createElement('div');
        this.bgContainer.id = 'gyroBackground';
        this.bgContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${this.config.overflow * 100}vw;
            height: ${this.config.overflow * 100}vh;
            z-index: 0;
            pointer-events: none;
            overflow: hidden;
            will-change: transform;
        `;
        
        // ✅ Создаём слой со звёздами
        this.starsLayer = document.createElement('div');
        this.starsLayer.className = 'gyro-stars-layer';
        this.starsLayer.style.cssText = `
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
        `;
        
        // Генерируем звёзды
        this.generateStars(this.starsLayer, 200, 1, 0.3);
        this.generateStars(this.starsLayer, 100, 2, 0.6);
        this.generateStars(this.starsLayer, 40, 3, 1.0);
        
        // ✅ Создаём слой с туманностью (опционально)
        this.nebulaLayer = document.createElement('div');
        this.nebulaLayer.className = 'gyro-nebula-layer';
        this.nebulaLayer.style.cssText = `
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: radial-gradient(ellipse at center, 
                rgba(255, 140, 0, 0.15) 0%, 
                rgba(255, 100, 0, 0.08) 30%, 
                transparent 70%);
        `;
        
        this.bgContainer.appendChild(this.nebulaLayer);
        this.bgContainer.appendChild(this.starsLayer);
        
        // ✅ Вставляем ПЕРЕД игровым полем (чтобы быть под ним)
        const gameArea = document.getElementById('gameArea');
        if (gameArea && gameArea.parentNode) {
            gameArea.parentNode.insertBefore(this.bgContainer, gameArea);
        } else {
            document.body.appendChild(this.bgContainer);
        }
        
        // ✅ Поднимаем z-index у игрового поля и UI, чтобы они были выше фона
        this.elevateGameLayers();
        
        console.log(' [GYRO] Background container created');
    },
    
    // ═══════════════════════════════════════════════
    // ️ ПОДНЯТИЕ СЛОЁВ ИГРЫ НАД ФОНОМ
    // ═══════════════════════════════════════════════
    elevateGameLayers: function() {
        const layers = [
            '#gameArea',
            '#header',
            '#footer',
            '.hud',
            '.upgrade-panel',
            '#achievementsBtn',
            '#shopBtn',
            '#saveBtn',
            '.moving-block',
            '.damage-text',
            '.reward-text',
            '#dailyBonusIcon',
            '#randomEventsCanvas'
        ];
        
        layers.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) {
                const currentZ = parseInt(window.getComputedStyle(el).zIndex) || 0;
                if (currentZ < 10) {
                    el.style.zIndex = '10';
                }
            }
        });
        
        // Особые элементы с высокими z-index
        const highZ = [
            { sel: '#achievementsPanel', z: 2000 },
            { sel: '#shopPanel', z: 2000 },
            { sel: '.notification', z: 10000 },
            { sel: '#gyroToggleBtn', z: 1000 }
        ];
        
        highZ.forEach(({ sel, z }) => {
            const el = document.querySelector(sel);
            if (el) el.style.zIndex = z;
        });
    },
    
    // ═══════════════════════════════════════════════
    // ✨ ГЕНЕРАЦИЯ ЗВЁЗД
    // ═══════════════════════════════════════════════
    generateStars(container, count, size, brightness) {
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const opacity = (0.3 + Math.random() * 0.7) * brightness;
            const twinkle = Math.random() > 0.7;
            
            star.style.cssText = `
                position: absolute;
                left: ${x}%;
                top: ${y}%;
                width: ${size}px;
                height: ${size}px;
                background: #fff;
                border-radius: 50%;
                opacity: ${opacity};
                box-shadow: 0 0 ${size * 2}px rgba(255, 255, 255, ${opacity * 0.5});
                ${twinkle ? 'animation: twinkle ' + (2 + Math.random() * 3) + 's ease-in-out infinite;' : ''}
            `;
            container.appendChild(star);
        }
    },
    
    // ══════════════════════════════════════════════
    // 📱 ОПРЕДЕЛЕНИЕ МОБИЛЬНОГО УСТРОЙСТВА
    // ═══════════════════════════════════════════════
    isMobileDevice: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window && window.innerWidth < 1024);
    },
    
    // ═══════════════════════════════════════════════
    // 🔘 КНОПКА ВКЛЮЧЕНИЯ
    // ═══════════════════════════════════════════════
    createToggleButton: function() {
        if (this.toggleBtn) return;
        
        this.toggleBtn = document.createElement('button');
        this.toggleBtn.id = 'gyroToggleBtn';
        this.toggleBtn.innerHTML = '🌌';
        this.toggleBtn.title = 'Гироскоп: ВЫКЛ';
        this.toggleBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.6);
            border: 2px solid rgba(255, 215, 0, 0.4);
            color: #FFD700;
            font-size: 1.5em;
            cursor: pointer;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            backdrop-filter: blur(4px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
        `;
        
        this.toggleBtn.addEventListener('click', () => this.handleToggle());
        this.toggleBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleToggle();
        }, { passive: false });
        
        document.body.appendChild(this.toggleBtn);
    },
    
    // ═══════════════════════════════════════════════
    // 🔀 ОБРАБОТКА ПЕРЕКЛЮЧЕНИЯ
    // ═══════════════════════════════════════════════
    handleToggle: async function() {
        if (!this.config.enabled) {
            if (this.isIOS && !this.permissionGranted) {
                const granted = await this.requestIOSPermission();
                if (!granted) {
                    this.showNotification('⚠️ Доступ к гироскопу запрещён', '#f44336');
                    return;
                }
            }
            
            this.config.enabled = true;
            this.config.useGyro = true;
            this.toggleBtn.title = 'Гироскоп: ВКЛ';
            this.toggleBtn.style.borderColor = '#4CAF50';
            this.toggleBtn.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.6)';
            
            window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
            
            this.showNotification('🌌 Гироскоп включён!', '#4CAF50');
            console.log(' [GYRO] Enabled');
        } else {
            this.config.enabled = false;
            this.config.useGyro = false;
            this.targetX = 0;
            this.targetY = 0;
            this.toggleBtn.title = 'Гироскоп: ВЫКЛ';
            this.toggleBtn.style.borderColor = 'rgba(255, 215, 0, 0.4)';
            this.toggleBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.5)';
            
            window.removeEventListener('deviceorientation', this.handleOrientation.bind(this));
            
            this.showNotification(' Гироскоп выключен', '#FF9800');
            console.log(' [GYRO] Disabled');
        }
    },
    
    // ═══════════════════════════════════════════════
    // 🍎 ЗАПРОС РАЗРЕШЕНИЯ ДЛЯ iOS
    // ═══════════════════════════════════════════════
    requestIOSPermission: function() {
        return new Promise((resolve) => {
            if (typeof DeviceMotionEvent !== 'undefined' && 
                typeof DeviceMotionEvent.requestPermission === 'function') {
                DeviceMotionEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            this.permissionGranted = true;
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    })
                    .catch(() => resolve(false));
            } else {
                resolve(true);
            }
        });
    },
    
    // ══════════════════════════════════════════════
    // 📐 ОБРАБОТКА НАКЛОНА УСТРОЙСТВА
    // ═══════════════════════════════════════════════
    handleOrientation: function(event) {
        if (!this.config.enabled) return;
        
        const gamma = event.gamma || 0;  // -90..90 (влево-вправо)
        const beta = event.beta || 0;    // -180..180 (вперёд-назад)
        
        // Нормализуем и ограничиваем
        const normalizedGamma = Math.max(-this.config.maxTilt, Math.min(this.config.maxTilt, gamma));
        const normalizedBeta = Math.max(-this.config.maxTilt, Math.min(this.config.maxTilt, beta - 45));
        
        // Инвертируем для эффекта "окна"
        this.targetX = -(normalizedGamma / this.config.maxTilt) * this.config.maxShift;
        this.targetY = -(normalizedBeta / this.config.maxTilt) * this.config.maxShift;
    },
    
    // ═══════════════════════════════════════════════
    // 🎬 ЦИКЛ АНИМАЦИИ (плавность через lerp)
    // ═══════════════════════════════════════════════
    startAnimationLoop: function() {
        const animate = () => {
            this.currentX += (this.targetX - this.currentX) * this.config.smoothness;
            this.currentY += (this.targetY - this.currentY) * this.config.smoothness;
            
            const x = Math.round(this.currentX * 100) / 100;
            const y = Math.round(this.currentY * 100) / 100;
            
            // ✅ Двигаем ТОЛЬКО наш контейнер фона
            this.applyTransform(x, y);
            
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    },
    
    // ═══════════════════════════════════════════════
    // 🎨 ПРИМЕНЕНИЕ СДВИГА ТОЛЬКО К ФОНУ
    // ═══════════════════════════════════════════════
    applyTransform: function(x, y) {
        if (!this.bgContainer) return;
        
        // ✅ Двигаем только #gyroBackground, ничего больше!
        // translate(-50%, -50%) сохраняет центрирование
        this.bgContainer.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    },
    
    // ═══════════════════════════════════════════════
    // 🔔 УВЕДОМЛЕНИЕ
    // ═══════════════════════════════════════════════
    showNotification: function(text, color) {
        const notif = document.createElement('div');
        notif.textContent = text;
        notif.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${color || '#4CAF50'};
            color: #fff;
            padding: 10px 20px;
            border-radius: 10px;
            z-index: 10000;
            font-family: 'Orbitron', sans-serif;
            font-weight: bold;
            font-size: 0.9em;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
        `;
        document.body.appendChild(notif);
        setTimeout(() => { notif.style.opacity = '1'; }, 10);
        setTimeout(() => {
            notif.style.opacity = '0';
            setTimeout(() => { if (notif.parentNode) notif.parentNode.removeChild(notif); }, 300);
        }, 2000);
    },
    
    // ═══════════════════════════════════════════════
    // 🧹 ОЧИСТКА
    // ══════════════════════════════════════════════
    destroy: function() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.bgContainer) this.bgContainer.remove();
        if (this.toggleBtn?.parentNode) this.toggleBtn.parentNode.removeChild(this.toggleBtn);
        window.removeEventListener('deviceorientation', this.handleOrientation);
    }
};

// ── Экспорт ──
window.GyroParallax = GyroParallax;

// ── CSS анимация мерцания звёзд ──
const style = document.createElement('style');
style.textContent = `
    @keyframes twinkle {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
    }
`;
document.head.appendChild(style);

// ── Автозапуск ──
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => GyroParallax.init(), 500));
} else {
    setTimeout(() => GyroParallax.init(), 500);
}

})();
