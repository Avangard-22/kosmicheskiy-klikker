// js/music-system.js (v2.0 — рандомные треки для планет)
(function() {
'use strict';

// ==========================================
// 📋 МАППИНГ ЛОКАЦИЙ НА МАССИВЫ ТРЕКОВ
// ==========================================
const PLANET_TRACKS = {
    mercury: [
        'audio/mercury/mercury_01.mp3',
        'audio/mercury/mercury_02.mp3',
        'audio/mercury/mercury_03.mp3',
       
    ],
    venus: [
        'audio/venus/venus_01.mp3',
        'audio/venus/venus_02.mp3',
        'audio/venus/venus_03.mp3'
    ],
    earth: [
        'audio/earth/earth_01.mp3',
        'audio/earth/earth_02.mp3',
        'audio/earth/earth_03.mp3'
    ],
    mars: [
        'audio/mars/mars_01.mp3',
        'audio/mars/mars_02.mp3',
        'audio/mars/mars_03.mp3'
    ],
    jupiter: [
        'audio/jupiter/jupiter_01.mp3',
        'audio/jupiter/jupiter_02.mp3',
        'audio/jupiter/jupiter_03.mp3'
    ],
    saturn: [
        'audio/saturn/saturn_01.mp3',
        'audio/saturn/saturn_02.mp3',
        'audio/saturn/saturn_03.mp3'
    ],
    uranus: [
        'audio/uranus/uranus_01.mp3',
        'audio/uranus/uranus_02.mp3',
        'audio/uranus/uranus_03.mp3'
    ],
    neptune: [
        'audio/neptune/neptune_01.mp3',
        'audio/neptune/neptune_02.mp3',
        'audio/neptune/neptune_03.mp3'
    ],
    pluto: [
        'audio/pluto/pluto_01.mp3',
        'audio/pluto/pluto_02.mp3',
        'audio/pluto/pluto_03.mp3'
    ]
};

// ==========================================
// 🔧 КОНФИГУРАЦИЯ
// ==========================================
const MUSIC_CONFIG = {
    volume: 0.4,
    fadeDuration: 1.5
};

// ==========================================
//  СОСТОЯНИЕ
// ==========================================
let audioContext = null;
let currentBuffer = null;
let currentSource = null;
let currentPlanet = null;
let currentTrackIndex = -1;
let isMuted = false;
let isMusicStarted = false;
let gainNode = null;
const bufferCache = {};

// ==========================================
// 🎲 ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ РАНДОМНОГО ТРЕКА
// ==========================================
function getRandomTrack(planet) {
    const tracks = PLANET_TRACKS[planet];
    if (!tracks || tracks.length === 0) {
        console.warn(`⚠️ [MUSIC] Нет треков для планеты: ${planet}`);
        return null;
    }
    
    // Выбираем случайный трек, отличный от текущего
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * tracks.length);
    } while (tracks.length > 1 && randomIndex === currentTrackIndex && tracks.length > 1);
    
    currentTrackIndex = randomIndex;
    return tracks[randomIndex];
}

// ==========================================
// 🔊 AUDIO CONTEXT INIT
// ==========================================
function initAudioContext() {
    if (audioContext) return audioContext;
    
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            console.warn('[MUSIC] Web Audio API not supported');
            return null;
        }
        
        audioContext = new AudioCtx();
        gainNode = audioContext.createGain();
        gainNode.gain.value = isMuted ? 0 : MUSIC_CONFIG.volume;
        gainNode.connect(audioContext.destination);
        
        console.log('[MUSIC] AudioContext initialized');
        return audioContext;
    } catch (e) {
        console.warn('[MUSIC] AudioContext creation error:', e);
        return null;
    }
}

// ==========================================
// 📥 LOAD AUDIO BUFFER
// ==========================================
async function loadAudioBuffer(trackUrl) {
    if (bufferCache[trackUrl]) {
        console.log(`[MUSIC] Using cached: ${trackUrl}`);
        return bufferCache[trackUrl];
    }
    
    const ctx = initAudioContext();
    if (!ctx) return null;
    
    try {
        console.log('[MUSIC] Loading:', trackUrl);
        const response = await fetch(trackUrl);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        
        bufferCache[trackUrl] = audioBuffer;
        console.log(`[MUSIC] Loaded: ${trackUrl} (${audioBuffer.duration.toFixed(1)}s)`);
        
        return audioBuffer;
    } catch (e) {
        console.error('[MUSIC] Failed to load:', trackUrl, e);
        return null;
    }
}

// ==========================================
// 🔄 SEAMLESS LOOPING
// ==========================================
function startSeamlessLoop(buffer) {
    if (!audioContext || !buffer) return;
    
    stopCurrentSource();
    currentBuffer = buffer;
    const duration = buffer.duration;
    
    scheduleLoop(buffer, audioContext.currentTime, duration);
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
        console.warn('[MUSIC] scheduleLoop error:', e);
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
function fadeIn(duration) {
    duration = duration || MUSIC_CONFIG.fadeDuration;
    
    if (!gainNode || !audioContext) return;
    
    const now = audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(MUSIC_CONFIG.volume, now + duration);
}

function fadeOut(duration, callback) {
    duration = duration || MUSIC_CONFIG.fadeDuration;
    
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
// 🎵 PLAY PLANET MUSIC (с рандомным треком)
// ==========================================
async function playPlanetMusic(planet) {
    if (!PLANET_TRACKS[planet]) {
        console.warn('[MUSIC] Unknown planet:', planet);
        return;
    }
    
    // Получаем случайный трек для планеты
    const trackUrl = getRandomTrack(planet);
    if (!trackUrl) return;
    
    // Если уже играет этот трек — не перезапускаем
    const currentTrack = Object.keys(bufferCache).find(key => bufferCache[key] === currentBuffer);
    if (currentTrack === trackUrl && currentSource) {
        console.log('[MUSIC] Already playing:', trackUrl);
        return;
    }
    
    currentPlanet = planet;
    
    const buffer = await loadAudioBuffer(trackUrl);
    if (!buffer) return;
    
    if (currentSource) {
        fadeOut(MUSIC_CONFIG.fadeDuration, () => {
            startSeamlessLoop(buffer);
            fadeIn(MUSIC_CONFIG.fadeDuration);
        });
    } else {
        startSeamlessLoop(buffer);
        fadeIn(MUSIC_CONFIG.fadeDuration);
    }
    
    console.log(`🎵 [MUSIC] Playing: ${trackUrl} (${planet})`);
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
    console.log('[MUSIC] Mute:', isMuted);
}

// ==========================================
// 🎛️ UI BUTTON
// ==========================================
function createMuteButton() {
    const existing = document.getElementById('musicMuteBtn');
    if (existing) existing.remove();
    
    const btn = document.createElement('button');
    btn.id = 'musicMuteBtn';
    btn.title = isMuted ? 'Enable music' : 'Disable music';
    btn.innerHTML = isMuted ? '🔇' : '🎵';
    btn.style.cssText = 'position:fixed;top:10px;right:60px;width:40px;height:40px;border:none;border-radius:8px;font-size:1.2em;cursor:pointer;z-index:30;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);color:white;transition:transform 0.1s,background 0.2s;';
    
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleMute();
    });
    
    btn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleMute();
    }, { passive: false });
    
    document.body.appendChild(btn);
    console.log('[MUSIC] Mute button created');
}

function updateMuteButton() {
    const btn = document.getElementById('musicMuteBtn');
    if (btn) {
        btn.innerHTML = isMuted ? '🔇' : '🎵';
        btn.title = isMuted ? 'Enable music' : 'Disable music';
    }
}

// ==========================================
// 🚀 INIT
// ==========================================
function init() {
    // Загружаем сохранённое состояние mute
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
    
    // Запускаем музыку при первом взаимодействии
    const startOnFirstInteraction = async function() {
        if (isMusicStarted) return;
        
        if (window.gameState && window.gameState.currentLocation) {
            const ctx = initAudioContext();
            if (ctx && ctx.state === 'suspended') {
                try { await ctx.resume(); } catch (e) {}
            }
            
            await playPlanetMusic(window.gameState.currentLocation);
            isMusicStarted = true;
            
            console.log('[MUSIC] Started for planet:', window.gameState.currentLocation);
        }
    };
    
    document.addEventListener('click', startOnFirstInteraction, { once: true });
    document.addEventListener('touchstart', startOnFirstInteraction, { once: true });
    document.addEventListener('keydown', startOnFirstInteraction, { once: true });
    
    console.log('[MUSIC] Music System v2.0 initialized (RANDOM TRACKS)');
    console.log('📋 Available planets:', Object.keys(PLANET_TRACKS));
}

// ==========================================
// 🌐 PUBLIC API
// ==========================================
window.MusicSystem = {
    init: init,
    playPlanetMusic: playPlanetMusic,
    toggleMute: toggleMute,
    isMuted: function() { return isMuted; },
    getCurrentPlanet: function() { return currentPlanet; },
    getCurrentTrack: function() {
        const tracks = PLANET_TRACKS[currentPlanet];
        return tracks ? tracks[currentTrackIndex] : null;
    }
};

// Экспортируем для внешнего использования
window.PLANET_TRACKS = PLANET_TRACKS;
window.getRandomTrack = getRandomTrack;

// Auto-start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 500); });
} else {
    setTimeout(init, 500);
}

})();