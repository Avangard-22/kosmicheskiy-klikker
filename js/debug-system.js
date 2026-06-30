// js/debug-system.js — СИСТЕМА ОТЛАДКИ
(function() {
'use strict';

window.DEBUG = {
    enabled: true,
    counters: {},
    callStack: [],
    
    // Логирование вызовов
    log: function(category, message, data) {
        if (!this.enabled) return;
        const timestamp = new Date().toISOString().substr(11, 12);
        console.log(`[${timestamp}] [${category}] ${message}`, data || '');
    },
    
    // Счётчик вызовов
    count: function(name) {
        if (!this.counters[name]) this.counters[name] = 0;
        this.counters[name]++;
        console.log(`📊 [COUNTER] ${name}: ${this.counters[name]}`);
    },
    
    // Отчёт
    report: function() {
        console.group('📈 DEBUG REPORT');
        console.table(this.counters);
        console.groupEnd();
    },
    
    // Проверка дублирования
    trackCall: function(funcName, params) {
        const call = {
            func: funcName,
            time: Date.now(),
            params: params,
            stack: new Error().stack
        };
        this.callStack.push(call);
        
        // Проверяем дубли за последние 100мс
        const recent = this.callStack.filter(c => 
            c.func === funcName && 
            (Date.now() - c.time) < 100
        );
        
        if (recent.length > 1) {
            console.warn(`⚠️ [DUPLICATE] ${funcName} вызван ${recent.length} раз за 100мс!`);
            console.table(recent);
        }
    }
};

// === МОНИТОРИНГ achievementsSystem ===
if (window.achievementsSystem) {
    const orig = window.achievementsSystem;
    
    const wrap = (name) => {
        const original = orig[name];
        if (typeof original !== 'function') return;
        
        orig[name] = function(...args) {
            DEBUG.trackCall(name, args);
            DEBUG.count('achievements.' + name);
            DEBUG.log('ACHIEVEMENTS', `Called ${name}`, args);
            return original.apply(this, args);
        };
    };
    
    wrap('incrementTotalDamage');
    wrap('incrementTotalClicks');
    wrap('incrementCrits');
    wrap('incrementCoinsEarned');
    wrap('incrementPlanetBlocks');
    wrap('incrementPlanetCrits');
    wrap('updateCombo');
    wrap('updatePlanetCombo');
    wrap('updatePlanetProgress');
}

// === МОНИТОРИНГ gameMetrics ===
const originalMetrics = window.gameMetrics || {};
Object.defineProperty(window, 'gameMetrics', {
    get: function() {
        return originalMetrics;
    },
    set: function(val) {
        DEBUG.log('METRICS', 'gameMetrics assigned', val);
        originalMetrics = val;
    },
    configurable: true
});

// === МОНИТОРИНГ времени ===
setInterval(function() {
    if (!window.gameMetrics) return;
    
    const now = Date.now();
    const sessionTime = Math.floor((now - (window.gameMetrics.startTime || now)) / 1000);
    const totalTime = window.gameMetrics.totalTimePlayed || 0;
    
    DEBUG.log('TIME', 'Session time', {
        sessionSeconds: sessionTime,
        totalTimePlayed: totalTime,
        startTime: window.gameMetrics.startTime
    });
}, 10000);

// === АВТО-ОТЧЁТ каждые 30 сек ===
setInterval(function() {
    DEBUG.report();
}, 30000);

console.log(' Debug system initialized');
})();