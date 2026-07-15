// js/device-detector.js
(function() {
'use strict';

const DeviceDetector = {
    deviceInfo: null,
    performanceTier: null,
    
    // 🔍 Определение устройства и характеристик
    detect: function() {
        const ua = navigator.userAgent || navigator.vendor || window.opera;
        
        // Определение модели устройства
        let deviceModel = 'unknown';
        let deviceBrand = 'unknown';
        
        // Realme
        if (/realme/i.test(ua)) {
            deviceBrand = 'Realme';
            const match = ua.match(/realme\s+([^\s;)]+)/i);
            deviceModel = match ? match[1] : 'unknown';
        }
        // Samsung
        else if (/samsung/i.test(ua)) {
            deviceBrand = 'Samsung';
            const match = ua.match(/SM-([^\s;)]+)/i);
            deviceModel = match ? match[1] : 'unknown';
        }
        // Xiaomi
        else if (/xiaomi|mi\s/i.test(ua)) {
            deviceBrand = 'Xiaomi';
            const match = ua.match(/MI\s+([^\s;)]+)/i);
            deviceModel = match ? match[1] : 'unknown';
        }
        // iPhone
        else if (/iphone/i.test(ua)) {
            deviceBrand = 'Apple';
            deviceModel = 'iPhone';
        }
        // Android общий
        else if (/android/i.test(ua)) {
            deviceBrand = 'Android';
            deviceModel = 'unknown';
        }
        
        // Аппаратные характеристики
        const cores = navigator.hardwareConcurrency || 4;
        const memory = navigator.deviceMemory || 4; // GB
        const isTouch = 'ontouchstart' in window;
        const pixelRatio = window.devicePixelRatio || 1;
        
        // GPU detection
        let gpu = 'unknown';
        let gpuTier = 'low';
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    // Определение уровня GPU
                    if (/adreno\s+6/i.test(gpu) || /mal[iu]-g/i.test(gpu)) {
                        gpuTier = 'high';
                    } else if (/adreno\s+[3-5]/i.test(gpu)) {
                        gpuTier = 'medium';
                    }
                }
            }
        } catch (e) {
            console.warn('[DEVICE] GPU detection failed:', e);
        }
        
        // Определение производительности (benchmark)
        const perfScore = this.runQuickBenchmark();
        
        // Определение tiers
        let tier = 'low';
        if (cores >= 8 && memory >= 6 && perfScore > 80) {
            tier = 'high';
        } else if (cores >= 6 && memory >= 4 && perfScore > 50) {
            tier = 'medium';
        }
        
        this.deviceInfo = {
            brand: deviceBrand,
            model: deviceModel,
            userAgent: ua,
            cores: cores,
            memory: memory,
            gpu: gpu,
            gpuTier: gpuTier,
            pixelRatio: pixelRatio,
            isTouch: isTouch,
            perfScore: perfScore,
            tier: tier
        };
        
        this.performanceTier = tier;
        
        console.log('📱 [DEVICE] Detected:', this.deviceInfo);
        console.log('🎯 [DEVICE] Performance tier:', tier.toUpperCase());
        
        return this.deviceInfo;
    },
    
    //  Быстрый бенчмарк производительности
    runQuickBenchmark: function() {
        const startTime = performance.now();
        let score = 100;
        
        // Тест 1: Создание DOM элементов
        const testDiv = document.createElement('div');
        for (let i = 0; i < 1000; i++) {
            const child = testDiv.cloneNode();
        }
        score -= (performance.now() - startTime) * 2;
        
        // Тест 2: Canvas операции
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 100;
        canvas.height = 100;
        for (let i = 0; i < 100; i++) {
            ctx.fillRect(0, 0, 100, 100);
        }
        score -= (performance.now() - startTime) * 3;
        
        // Тест 3: Math операции
        let x = 0;
        for (let i = 0; i < 10000; i++) {
            x += Math.sin(i) * Math.cos(i);
        }
        score -= (performance.now() - startTime);
        
        return Math.max(0, Math.min(100, score));
    },
    
    //  Получение настроек для игрового баланса
    getGameSettings: function() {
        if (!this.deviceInfo) this.detect();
        
        const settings = {
            // Базовые настройки для всех
    blockSpeed: CFG?.isMobile ? 25 : 12,  // Desktop: 12, Mobile: 25
    blockHealth: 1,
    particleDensity: 1,
    fpsTarget: 60
        };
        
        // 🔧 Адаптация под Realme 10 Pro 5G и подобные
        if (this.deviceInfo.brand === 'Realme' && this.deviceInfo.model.includes('10')) {
            console.log(' [DEVICE] Realme 10 Pro detected - applying optimizations');
            settings.blockSpeed = 35; // Увеличиваем скорость
            settings.blockHealth = 1.3; // Увеличиваем здоровье блоков
            settings.particleDensity = 0.7; // Уменьшаем частицы
            return settings;
        }
        
        // Адаптация по tiers
// ✅ Настройка скорости в зависимости от устройства и tier
const isMobile = window.GAME_CONFIG?.isMobile || 'ontouchstart' in window;

switch (this.performanceTier) {
    case 'high':
        settings.blockSpeed = isMobile ? 25 : 15;  // Desktop high: 15 (было 25)
        settings.blockHealth = 1.2;
        settings.particleDensity = 1;
        settings.fpsTarget = 60;
        break;
    case 'medium':
        settings.blockSpeed = isMobile ? 30 : 18;  // Desktop medium: 18 (было 30)
        settings.blockHealth = 1.1;
        settings.particleDensity = 0.8;
        settings.fpsTarget = 60;
        break;
    case 'low':
    default:
        settings.blockSpeed = isMobile ? 40 : 22;  // Desktop low: 22 (было 40)
        settings.blockHealth = 1.5;
        settings.particleDensity = 0.5;
        settings.fpsTarget = 30;
        break;
}
        
        return settings;
    },
    
    // 🎨 Получение настроек графики
    getGraphicsSettings: function() {
        if (!this.deviceInfo) this.detect();
        
        return {
            quality: this.performanceTier === 'high' ? 'high' : 
                     this.performanceTier === 'medium' ? 'medium' : 'low',
            shadows: this.performanceTier === 'high',
            particles: this.performanceTier !== 'low',
            smoothAnimations: this.performanceTier !== 'low',
            reduceMotion: false
        };
    }
};

// Экспорт
window.DeviceDetector = DeviceDetector;

// Автодетекция при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DeviceDetector.detect());
} else {
    DeviceDetector.detect();
}

})();
