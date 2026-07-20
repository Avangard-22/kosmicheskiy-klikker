// js/gyro-parallax.js
// ═══════════════════════════════════════════════════
// 🌌 ГИРОСКОПИЧЕСКИЙ ПАРАЛЛАКС ФОНА
// ЧТО: Двигает ТОЛЬКО звёзды/туманности при наклоне телефона
// ЗАЧЕМ: Создаёт эффект 3D-погружения, как будто смотришь в иллюминатор
// ВАЖНО: Интерфейс (кнопки, HUD, заголовки) остаётся статичным!
// ══════════════════════════════════════════════════
(function() {
'use strict';

const GyroParallax = {
    // ─ Настройки ──
    config: {
        maxTilt: 25,          // Максимальный угол наклона (градусы)
        maxShift: 30,         // Максимальный сдвиг фона (пиксели)
        smoothness: 0.06,     // Плавность (0.01 = очень плавно, 0.15 = резко)
        enabled: false,       // Включено ли
        useGyro: false        // Использовать гироскоп
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
    bgLayers: [],             // Массив слоёв фона (звёзды, туманности)
    toggleBtn: null,
    
    // ═══════════════════════════════════════════════
    // 🔍 ИНИЦИАЛИЗАЦИЯ
    // ═══════════════════════════════════════════════
    init: function() {
        // Проверяем, мобильное ли устройство
        if (!this.isMobileDevice()) {
            console.log('🌌 [GYRO] Desktop detected — parallax disabled');
            return;
        }
        
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        // ✅ КЛЮЧЕВОЕ: Находим ТОЛЬКО слои фона, не весь интерфейс!
        this.findBackgroundLayers();
        
        if (this.bgLayers.length === 0) {
            console.warn('⚠️ [GYRO] Background layers not found!');
            return;
        }
        
        // Создаём кнопку включения
        this.createToggleButton();
        
        // Запускаем цикл анимации
        this.startAnimationLoop();
        
        console.log('🌌 [GYRO] Initialized with', this.bgLayers.length, 'layers');
    },
    
    // ═══════════════════════════════════════════════
    // 🔎 ПОИСК СЛОЁВ ФОНА
    // ═══════════════════════════════════════════════
    findBackgroundLayers: function() {
        this.bgLayers = [];
        
        // Ищем контейнер фона
        const bgContainer = document.getElementById('planetBackground') || 
                           document.querySelector('.planet-bg') ||
                           document.querySelector('#gameArea');
        
        if (!bgContainer) {
            console.warn('⚠️ [GYRO] Background container not found');
            return;
        }
        
        // ✅ Ищем слои внутри контейнера фона
        const layers = bgContainer.querySelectorAll('.stars-layer, .nebula-layer, .planet-layer, .bg-layer');
        
        if (layers.length > 0) {
            // Многослойный фон — отлично!
            layers.forEach((layer, idx) => {
                this.bgLayers.push({
                    element: layer,
                    depth: (idx + 1) * 0.4  // Глубина для параллакса
                });
            });
        } else {
            // Однослойный фон — двигаем весь контейнер
            this.bgLayers.push({
                element: bgContainer,
                depth: 1.0
            });
        }
        
        console.log(' [GYRO] Found', this.bgLayers.length, 'background layers');
    },
    
    // ═══════════════════════════════════════════════
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
            // ВКЛЮЧАЕМ
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
            
            // Подписываемся на датчики
            window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
            
            this.showNotification('🌌 Гироскоп включён!', '#4CAF50');
            console.log('🌌 [GYRO] Enabled');
        } else {
            // ВЫКЛЮЧАЕМ
            this.config.enabled = false;
            this.config.useGyro = false;
            this.targetX = 0;
            this.targetY = 0;
            this.toggleBtn.title = 'Гироскоп: ВЫКЛ';
            this.toggleBtn.style.borderColor = 'rgba(255, 215, 0, 0.4)';
            this.toggleBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.5)';
            
            // Отписываемся
            window.removeEventListener('deviceorientation', this.handleOrientation.bind(this));
            
            this.showNotification('🌌 Гироскоп выключен', '#FF9800');
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
    
    // ═══════════════════════════════════════════════
    // 📐 ОБРАБОТКА НАКЛОНА УСТРОЙСТВА
    // ═══════════════════════════════════════════════
    handleOrientation: function(event) {
        if (!this.config.enabled) return;
        
        // gamma: наклон влево-вправо (-90 до 90)
        // beta: наклон вперёд-назад (-180 до 180)
        const gamma = event.gamma || 0;
        const beta = event.beta || 0;
        
        // Нормализуем и ограничиваем
        const normalizedGamma = Math.max(-this.config.maxTilt, Math.min(this.config.maxTilt, gamma));
        const normalizedBeta = Math.max(-this.config.maxTilt, Math.min(this.config.maxTilt, beta - 45));
        
        // Вычисляем целевое смещение (инвертируем для эффекта "окна")
        this.targetX = -(normalizedGamma / this.config.maxTilt) * this.config.maxShift;
        this.targetY = -(normalizedBeta / this.config.maxTilt) * this.config.maxShift;
    },
    
    // ═══════════════════════════════════════════════
    // 🎬 ЦИКЛ АНИМАЦИИ (плавность через lerp)
    // ═══════════════════════════════════════════════
    startAnimationLoop: function() {
        const animate = () => {
            // Линейная интерполяция для плавности
            this.currentX += (this.targetX - this.currentX) * this.config.smoothness;
            this.currentY += (this.targetY - this.currentY) * this.config.smoothness;
            
            // Округляем до 2 знаков для производительности
            const x = Math.round(this.currentX * 100) / 100;
            const y = Math.round(this.currentY * 100) / 100;
            
            // ✅ Применяем ТОЛЬКО к слоям фона!
            this.applyTransform(x, y);
            
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    },
    
    // ═══════════════════════════════════════════════
    //  ПРИМЕНЕНИЕ СДВИГА К ФОНУ
    // ═══════════════════════════════════════════════
    applyTransform: function(x, y) {
        if (this.bgLayers.length === 0) return;
        
        // ✅ Двигаем каждый слой с разной скоростью (параллакс)
        this.bgLayers.forEach(layer => {
            const lx = x * layer.depth;
            const ly = y * layer.depth;
            layer.element.style.transform = `translate(${lx}px, ${ly}px)`;
        });
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
        if (this.toggleBtn?.parentNode) this.toggleBtn.parentNode.removeChild(this.toggleBtn);
        window.removeEventListener('deviceorientation', this.handleOrientation);
    }
};

// ── Экспорт ──
window.GyroParallax = GyroParallax;

// ── Автозапуск ──
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => GyroParallax.init(), 500));
} else {
    setTimeout(() => GyroParallax.init(), 500);
}

})();
