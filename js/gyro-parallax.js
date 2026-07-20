// js/gyro-parallax.js
// ═══════════════════════════════════════════════════
// 🌌 ГИРОСКОПИЧЕСКИЙ ПАРАЛЛАКС ФОНА
// ЧТО: Двигает звёзды/планеты при наклоне телефона
// ЗАЧЕМ: Создаёт эффект 3D-погружения в космос
// ИНТЕГРАЦИЯ: Работает параллельно с planet-background.js
// ══════════════════════════════════════════════════
(function() {
'use strict';

const GyroParallax = {
    // ── Настройки ──
    config: {
        maxTilt: 30,          // Максимальный угол наклона (градусы) для полного сдвига
        maxShift: 40,         // Максимальный сдвиг фона (пиксели)
        smoothness: 0.08,     // Плавность (0.01 = очень плавно, 0.2 = резко)
        enabled: false,       // Включено ли по умолчанию
        useGyro: false        // Использовать гироскоп (true) или мышь (false, для теста)
    },
    
    // ── Состояние ─
    currentX: 0,              // Текущее смещение X (с плавностью)
    currentY: 0,              // Текущее смещение Y
    targetX: 0,               // Целевое смещение X (от датчика)
    targetY: 0,               // Целевое смещение Y
    animationId: null,
    isIOS: false,
    permissionGranted: false,
    
    // ── DOM элементы ─
    bgContainer: null,        // Контейнер фона (звёзды, планеты)
    toggleBtn: null,          // Кнопка вкл/выкл
    
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
        
        // Находим контейнер фона
        this.bgContainer = document.getElementById('planetBackground') || 
                          document.querySelector('.planet-bg') ||
                          document.body;
        
        // Создаём кнопку включения
        this.createToggleButton();
        
        // Запускаем цикл анимации (для плавности)
        this.startAnimationLoop();
        
        console.log(' [GYRO] GyroParallax initialized (iOS:', this.isIOS, ')');
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
                // iOS требует запроса разрешения
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
            console.log('🌌 [GYRO] Disabled');
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
                // Не iOS или старая версия — разрешение не нужно
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
        const gamma = event.gamma || 0;  // -90..90
        const beta = event.beta || 0;    // -180..180
        
        // Нормализуем и ограничиваем
        const normalizedGamma = Math.max(-this.config.maxTilt, Math.min(this.config.maxTilt, gamma));
        const normalizedBeta = Math.max(-this.config.maxTilt, Math.min(this.config.maxTilt, beta - 45)); // -45 для комфортного угла держания
        
        // Вычисляем целевое смещение (инвертируем для эффекта "окна")
        this.targetX = -(normalizedGamma / this.config.maxTilt) * this.config.maxShift;
        this.targetY = -(normalizedBeta / this.config.maxTilt) * this.config.maxShift;
    },
    
    // ═══════════════════════════════════════════════
    // 🎬 ЦИКЛ АНИМАЦИИ (плавность через lerp)
    // ═══════════════════════════════════════════════
    startAnimationLoop: function() {
        const animate = () => {
            // Линейная интерполяция (lerp) для плавности
            this.currentX += (this.targetX - this.currentX) * this.config.smoothness;
            this.currentY += (this.targetY - this.currentY) * this.config.smoothness;
            
            // Округляем до 2 знаков для производительности
            const x = Math.round(this.currentX * 100) / 100;
            const y = Math.round(this.currentY * 100) / 100;
            
            // Применяем к фону
            this.applyTransform(x, y);
            
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    },
    
    // ═══════════════════════════════════════════════
    // 🎨 ПРИМЕНЕНИЕ СДВИГА К ФОНУ
    // ═══════════════════════════════════════════════
    applyTransform: function(x, y) {
        if (!this.bgContainer) return;
        
        // Сдвигаем все слои фона с разной скоростью (параллакс)
        const layers = this.bgContainer.querySelectorAll('.stars-layer, .planet-layer, .nebula-layer');
        
        if (layers.length > 0) {
            // Многослойный параллакс
            layers.forEach((layer, idx) => {
                const depth = (idx + 1) * 0.5; // Глубина слоя
                const lx = x * depth;
                const ly = y * depth;
                layer.style.transform = `translate(${lx}px, ${ly}px)`;
            });
        } else {
            // Однслойный фон (fallback)
            this.bgContainer.style.transform = `translate(${x}px, ${y}px)`;
        }
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
    // ═══════════════════════════════════════════════
    destroy: function() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.toggleBtn?.parentNode) this.toggleBtn.parentNode.removeChild(this.toggleBtn);
        window.removeEventListener('deviceorientation', this.handleOrientation);
    }
};

// ── Экспорт ─
window.GyroParallax = GyroParallax;

// ── Автозапуск ──
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => GyroParallax.init(), 500));
} else {
    setTimeout(() => GyroParallax.init(), 500);
}

})();