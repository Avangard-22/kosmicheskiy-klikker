// js/music-system.js
(function() {
'use strict';

// === НАСТРОЙКИ ===
const MUSIC_CONFIG = {
    volume: 0.3,
    fadeDuration: 1.5,     // секунды
    preloadAll: false      // если true — грузит все треки сразу
};

// === СОСТОЯНИЕ ===
let audioContext = null;
let currentBuffer = null;
let currentSource = null;
let currentPlanet = null;
let isMuted = false;
let isMusicStarted = false;
let scheduledNextTime = 0;
let fadeTimeout = null;
let gainNode = null;
let nextSource = null;       // для seamless crossfade
let nextBuffer = null;

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
    
    // Возобновление после user gesture (требование браузеров)
    const resumeOnGesture = () => {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        document.removeEventListener('click', resumeOnGesture);
        document.removeEventListener('touchstart', resumeOnGesture);
        document.removeEventListener('keydown', resumeOnGesture);
    };
    
    document.addEventListener('click', resumeOnGesture);
    document.addEventListener('touchstart', resumeOnGesture);
    document.addEventListener('keydown', resumeOnGesture);
    
    console.log('🎵 [MUSIC] AudioContext initialized');
    return audioContext;
}

// ==========================================
//  ЗАГРУЗКА АУДИО БУФЕРА
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
        console.error(' [MUSIC] Failed to load:', planet, e);
        return null;
    }
}

// ==========================================
// 🔁 SEAMLESS LOOPING
// ==========================================

/**
 * Запускает зацикленное воспроизведение буфера
 * Использует scheduling для seamless loop без микропауз
 */
function startSeamlessLoop(buffer) {
    if (!audioContext || !buffer) return;
    
    // Останавливаем предыдущий источник
    stopCurrentSource();
    
    currentBuffer = buffer;
    const duration = buffer.duration;
    
    // Запускаем первый цикл
    scheduleLoop(buffer, audioContext.currentTime, duration);
}

/**
 * Планирует следующий цикл за 0.1 сек до конца текущего
 */
function scheduleLoop(buffer, startTime, duration) {
    if (!audioContext || !buffer) return;
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = false;  //  Отключаем нативный loop — используем scheduling
    source.connect(gainNode);
    
    source.start(startTime);
    
    // За 0.1 сек до конца — планируем следующий цикл
    const nextStartTime = startTime + duration - 0.1;
    
    source.onended = () => {
        // Если источник закончился, но мы уже запланировали следующий — ничего не делаем
        if (currentSource === source) {
            currentSource = null;
        }
    };
    
    currentSource = source;
    
    // Планируем следующий цикл
    const scheduleNext = () => {
        if (!audioContext || !currentBuffer) return;
        scheduleLoop(currentBuffer, nextStartTime, duration);
    };
    
    const delay = (nextStartTime - audioContext.currentTime) * 1000;
    setTimeout(scheduleNext, Math.max(0, delay - 100));
}

/**
 * Останавливает текущий источник
 */
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
    if (!gainNode || !audioContext) return;
    
    const now = audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(0, now);
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
        console.warn('️ [MUSIC] Unknown planet:', planet);
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
            startSeamlessLoop(buffer);
            fadeIn(MUSIC_CONFIG.fadeDuration);
        });
    } else {
        startSeamlessLoop(buffer);
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
    localStorage.setItem('cosmicMusicMuted', isMuted.toString());
    
    if (gainNode && audioContext) {
        const now = audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(isMuted ? 0 : MUSIC_CONFIG.volume, now + 0.3);
    }
    
    updateMuteButton();
    console.log(' [MUSIC] Mute:', isMuted);
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
    const savedMute = localStorage.getItem('cosmicMusicMuted');
    isMuted = savedMute === 'true';
    
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
        if (!isMusicStarted && window.gameState && window.gameState.currentLocation) {
            initAudioContext();
            await playPlanetMusic(window.gameState.currentLocation);
            isMusicStarted = true;
        }
        document.removeEventListener('click', startOnFirstInteraction);
        document.removeEventListener('touchstart', startOnFirstInteraction);
        document.removeEventListener('keydown', startOnFirstInteraction);
    };
    
    document.addEventListener('click', startOnFirstInteraction, { once: true });
    document.addEventListener('touchstart', startOnFirstInteraction, { once: true });
    document.addEventListener('keydown', startOnFirstInteraction, { once: true });
    
    console.log(' Music System initialized (Web Audio API)');
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
