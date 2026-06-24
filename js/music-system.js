// js/music-system.js
(function() {
'use strict';

// === НАСТРОЙКИ ===
const MUSIC_CONFIG = {
    volume: 0.4,
    fadeDuration: 1.5  // ✅ Увеличено с 0.1 до 1.5 сек
};

// === СОСТОЯНИЕ ===
let audioContext = null;
let currentBuffer = null;
let currentSource = null;
let currentPlanet = null;
let isMuted = false;
let isMusicStarted = false;
let gainNode = null;

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
    
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
        console.warn('⚠️ [MUSIC] Web Audio API не поддерживается');
        return null;
    }
    
    audioContext = new AudioCtx();
    gainNode = audioContext.createGain();
    gainNode.gain.value = isMuted ? 0 : MUSIC_CONFIG.volume;
    gainNode.connect(audioContext.destination);
    
    console.log('🎵 [MUSIC] AudioContext initialized');
    return audioContext;
}

// ==========================================
// 📥 ЗАГРУЗКА АУДИО БУФЕРА
// ==========================================

async function loadAudioBuffer(planet) {
    if (bufferCache[planet]) return bufferCache[planet];
    
    const ctx = initAudioContext();
    if (!ctx) return null;
    
    try {
        console.log('🎵 [MUSIC] Loading:', `audio/${planet}.mp3`);
        const response = await fetch(`audio/${planet}.mp3`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        
        bufferCache[planet] = audioBuffer;
        console.log('✅ [MUSIC] Loaded:', planet, `(${audioBuffer.duration.toFixed(1)}s)`);
        return audioBuffer;
    } catch (e) {
        console.error('❌ [MUSIC] Failed to load:', planet, e);
        return null;
    }
}

// ==========================================
// 🔁 ПРОСТОЕ ЗИКЛИВАНИЕ (без scheduling!)
// ==========================================

function startLoop(buffer) {
    if (!audioContext || !buffer) return;
    
    // Останавливаем предыдущий источник
    stopCurrentSource();
    
    currentBuffer = buffer;
    
    // ✅ Создаём новый источник с loop = true
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;  // ✅ Нативное зацикливание Web Audio API
    source.connect(gainNode);
    source.start(0);
    
    currentSource = source;
    
    console.log('🔁 [MUSIC] Loop started:', buffer.duration.toFixed(1), 's');
}

function stopCurrentSource() {
    if (currentSource) {
        try {
            currentSource.stop();
        } catch (e) {}
        currentSource = null;
    }
}

// ==========================================
// 🎚️ FADE IN / FADE OUT
// ==========================================

function fadeIn(duration = MUSIC_CONFIG.fadeDuration) {
    if (!gainNode || !audioContext) return;
    
    const now = audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(MUSIC_CONFIG.volume, now + duration);
}

function fadeOut(duration = MUSIC_CONFIG.fadeDuration, callback) {
    if (!gainNode || !audioContext) {
        if (callback) callback();
        return;
    }
    
    const now = audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
    
    if (callback) {
        setTimeout(callback, duration * 1000);
    }
}

// ==========================================
// 🎵 ПЕРЕКЛЮЧЕНИЕ ТРЕКОВ (CROSSFADE)
// ==========================================

async function playPlanetMusic(planet) {
    if (!PLANETS.includes(planet)) {
        console.warn('⚠️ [MUSIC] Unknown planet:', planet);
        return;
    }
    
    // Если планета не изменилась — ничего не делаем
    if (currentPlanet === planet && currentSource) {
        return;
    }
    
    currentPlanet = planet;
    
    const buffer = await loadAudioBuffer(planet);
    if (!buffer) return;
    
    // Если уже играет — делаем crossfade
    if (currentSource) {
        fadeOut(MUSIC_CONFIG.fadeDuration, () => {
            startLoop(buffer);
            fadeIn(MUSIC_CONFIG.fadeDuration);
        });
    } else {
        startLoop(buffer);
        fadeIn(MUSIC_CONFIG.fadeDuration);
    }
    
    console.log('🎵 [MUSIC] Playing:', planet);
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
    
    updateMuteButton();
    console.log('🔇 [MUSIC] Mute:', isMuted);
}

// ==========================================
// 🎨 UI КНОПКА
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
    // Загружаем состояние mute
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
    
    // Возобновление AudioContext после user gesture (требование браузеров)
    const resumeOnGesture = () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // Запускаем музыку при первом взаимодействии
        if (!isMusicStarted && window.gameState && window.gameState.currentLocation) {
            initAudioContext();
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
            playPlanetMusic(window.gameState.currentLocation);
            isMusicStarted = true;
            console.log('🎵 [MUSIC] Started for planet:', window.gameState.currentLocation);
        }
    };
    
    document.addEventListener('click', resumeOnGesture, { once: true });
    document.addEventListener('touchstart', resumeOnGesture, { once: true });
    document.addEventListener('keydown', resumeOnGesture, { once: true });
    
    console.log('🎵 Music System initialized');
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
