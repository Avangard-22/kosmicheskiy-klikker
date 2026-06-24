// js/music-system.js
(function() {
'use strict';

// === НАСТРОЙКИ ===
const MUSIC_CONFIG = {
    volume: 0.7,
    fadeDuration: 1.5
};

// === СОСТОЯНИЕ ===
let audioContext = null;
let gainNode = null;
let currentBuffer = null;
let currentSource = null;
let currentPlanet = null;
let isMuted = false;
let isMusicStarted = false;
let fadeTimeout = null;
let html5Audio = null;  // ✅ Fallback на HTML5 Audio

// === КЭШ БУФЕРОВ ===
const bufferCache = {};

// === ПЛАНЕТЫ ===
const PLANETS = [
    'mercury', 'venus', 'earth', 'mars',
    'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'
];

// ==========================================
// 🎵 ИНИЦИАЛИЗАЦИЯ AUDIO CONTEXT
// ==========================================

function initAudioContext() {
    if (audioContext) return audioContext;
    
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            console.warn('⚠️ [MUSIC] Web Audio API не поддерживается, используем HTML5 Audio');
            return null;
        }
        
        audioContext = new AudioCtx();
        gainNode = audioContext.createGain();
        gainNode.gain.value = isMuted ? 0 : MUSIC_CONFIG.volume;
        gainNode.connect(audioContext.destination);
        
        console.log('🎵 [MUSIC] AudioContext initialized');
        return audioContext;
    } catch (e) {
        console.warn('⚠️ [MUSIC] Ошибка создания AudioContext:', e);
        return null;
    }
}

// ==========================================
// 🎵 ЗАГРУЗКА АУДИО БУФЕРА (Web Audio API)
// ==========================================

async function loadAudioBuffer(planet) {
    if (bufferCache[planet]) return bufferCache[planet];
    
    const ctx = initAudioContext();
    if (!ctx) return null;
    
    try {
        console.log('🎵 [MUSIC] Loading:', `audio/${planet}.ogg`);
        const response = await fetch(`audio/${planet}.ogg`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        
        bufferCache[planet] = audioBuffer;
        console.log('✅ [MUSIC] Loaded:', planet, `(${audioBuffer.duration.toFixed(1)}s)`);
        return audioBuffer;
    } catch (e) {
        console.warn('⚠️ [MUSIC] Web Audio load failed:', planet, e.message);
        return null;
    }
}

// ==========================================
// 🔁 SEAMLESS LOOPING (Web Audio API)
// ==========================================

function startSeamlessLoop(buffer) {
    if (!audioContext || !buffer) return false;
    
    stopCurrentSource();
    currentBuffer = buffer;
    const duration = buffer.duration;
    
    scheduleLoop(buffer, audioContext.currentTime, duration);
    return true;
}

function scheduleLoop(buffer, startTime, duration) {
    if (!audioContext || !buffer || currentBuffer !== buffer) return;
    
    try {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = false;
        source.connect(gainNode);
        
        source.start(startTime);
        source.onended = () => {
            if (currentSource === source) {
                currentSource = null;
            }
        };
        
        currentSource = source;
        
        const nextStartTime = startTime + duration;
        const delay = (nextStartTime - audioContext.currentTime) * 1000;
        
        setTimeout(() => {
            if (currentBuffer === buffer) {
                scheduleLoop(buffer, nextStartTime, duration);
            }
        }, Math.max(0, delay - 200));
    } catch (e) {
        console.warn('⚠️ [MUSIC] scheduleLoop error:', e);
    }
}

function stopCurrentSource() {
    if (currentSource) {
        try {
            currentSource.onended = null;
            currentSource.stop();
        } catch (e) {}
        currentSource = null;
    }
}

// ==========================================
// 🎚️ FADE IN / FADE OUT
// ==========================================

function fadeIn(duration = MUSIC_CONFIG.fadeDuration) {
    if (gainNode && audioContext) {
        const now = audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(MUSIC_CONFIG.volume, now + duration);
    }
    if (html5Audio) {
        html5Audio.volume = MUSIC_CONFIG.volume;
    }
}

function fadeOut(duration = MUSIC_CONFIG.fadeDuration, callback) {
    if (gainNode && audioContext) {
        const now = audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);
    }
    if (html5Audio) {
        html5Audio.volume = 0;
    }
    if (callback) {
        setTimeout(callback, duration * 1000);
    }
}

// ==========================================
// 🎵 ПЕРЕКЛЮЧЕНИЕ ТРЕКОВ
// ==========================================

async function playPlanetMusic(planet) {
    if (!PLANETS.includes(planet)) {
        console.warn('⚠️ [MUSIC] Unknown planet:', planet);
        return;
    }
    
    if (currentPlanet === planet && (currentSource || (html5Audio && !html5Audio.paused))) {
        return;
    }
    
    currentPlanet = planet;
    
    // ✅ ПЫТАЕМСЯ Web Audio API (для seamless loop)
    const buffer = await loadAudioBuffer(planet);
    
    if (buffer) {
        // Останавливаем HTML5 Audio если он играл
        stopHtml5Audio();
        
        fadeOut(MUSIC_CONFIG.fadeDuration, () => {
            startSeamlessLoop(buffer);
            fadeIn(MUSIC_CONFIG.fadeDuration);
        });
        
        console.log('🎵 [MUSIC] Playing via Web Audio API:', planet);
    } else {
        // ✅ FALLBACK на HTML5 Audio (работает всегда)
        console.log('🎵 [MUSIC] Fallback to HTML5 Audio for:', planet);
        playHtml5Audio(planet);
    }
}

// ==========================================
// 🎵 HTML5 AUDIO FALLBACK
// ==========================================

function playHtml5Audio(planet) {
    stopHtml5Audio();
    
    html5Audio = new Audio(`audio/${planet}.ogg`);
    html5Audio.loop = true;
    html5Audio.volume = isMuted ? 0 : MUSIC_CONFIG.volume;
    
    html5Audio.addEventListener('error', (e) => {
        console.error('❌ [MUSIC] HTML5 Audio error:', e);
    });
    
    html5Audio.play().then(() => {
        console.log('🎵 [MUSIC] HTML5 Audio playing:', planet);
    }).catch(err => {
        console.warn('⚠️ [MUSIC] HTML5 Audio play failed:', err);
    });
}

function stopHtml5Audio() {
    if (html5Audio) {
        try {
            html5Audio.pause();
            html5Audio.currentTime = 0;
        } catch (e) {}
        html5Audio = null;
    }
}

// ==========================================
// 🔇 MUTE / UNMUTE
// ==========================================

function toggleMute() {
    isMuted = !isMuted;
    
    if (window.gameState) {
        window.gameState.musicMuted = isMuted;
    }
    try {
        localStorage.setItem('cosmicMusicMuted', isMuted.toString());
    } catch (e) {}
    
    if (gainNode && audioContext) {
        const now = audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(isMuted ? 0 : MUSIC_CONFIG.volume, now + 0.3);
    }
    
    if (html5Audio) {
        html5Audio.volume = isMuted ? 0 : MUSIC_CONFIG.volume;
    }
    
    updateMuteButton();
    console.log('🔇 [MUSIC] Mute:', isMuted);
}

// ==========================================
// 🎨 UI КНОПКА (✅ ДОБАВЛЕНО!)
// ==========================================

function createMuteButton() {
    // Удаляем старую кнопку если есть
    const existing = document.getElementById('musicMuteBtn');
    if (existing) existing.remove();
    
    const btn = document.createElement('button');
    btn.id = 'musicMuteBtn';
    btn.title = isMuted ? 'Включить музыку' : 'Выключить музыку';
    btn.innerHTML = isMuted ? '🔇' : '🎵';
    btn.style.cssText = `
        position: fixed;
        top: 10px;
        right: 60px;
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 8px;
        font-size: 1.2em;
        cursor: pointer;
        z-index: 30;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        transition: transform 0.1s, background 0.2s;
    `;
    
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMute();
    });
    
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMute();
    }, { passive: false });
    
    document.body.appendChild(btn);
    console.log('🎨 [MUSIC] Mute button created');
}

function updateMuteButton() {
    const btn = document.getElementById('musicMuteBtn');
    if (btn) {
        btn.innerHTML = isMuted ? '🔇' : '🎵';
        btn.title = isMuted ? 'Включить музыку' : 'Выключить музыку';
    }
}

// ==========================================
// 🚀 ИНИЦИАЛИЗАЦИЯ
// ==========================================

function init() {
    try {
        const savedMute = localStorage.getItem('cosmicMusicMuted');
        isMuted = savedMute === 'true';
    } catch (e) {
        isMuted = false;
    }
    
    // Подписываемся на смену планеты
    if (window.EventBus) {
        window.EventBus.on('game:planetChanged', function(planet) {
            if (isMusicStarted) {
                playPlanetMusic(planet);
            }
        });
    }
    
    createMuteButton();
    
    // Запуск после первого клика
    const startOnFirstInteraction = async () => {
        if (isMusicStarted) return;
        
        if (window.gameState && window.gameState.currentLocation) {
            const ctx = initAudioContext();
            if (ctx && ctx.state === 'suspended') {
                try { await ctx.resume(); } catch (e) {}
            }
            
            await playPlanetMusic(window.gameState.currentLocation);
            isMusicStarted = true;
            console.log('🎵 [MUSIC] Started for planet:', window.gameState.currentLocation);
        }
    };
    
    document.addEventListener('click', startOnFirstInteraction, { once: true });
    document.addEventListener('touchstart', startOnFirstInteraction, { once: true });
    document.addEventListener('keydown', startOnFirstInteraction, { once: true });
    
    console.log('🎵 Music System initialized (with HTML5 fallback)');
}

// ==========================================
// 🚀 ПУБЛИЧНЫЙ API
// ==========================================

window.MusicSystem = {
    init: init,
    playPlanetMusic: playPlanetMusic,
    toggleMute: toggleMute,
    isMuted: () => isMuted,
    getCurrentPlanet: () => currentPlanet
};

// Автозапуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
} else {
    setTimeout(init, 500);
}

})();
