// js/music-system.js
(function() {
'use strict';

// === НАСТРОЙКИ ===
const MUSIC_CONFIG = {
    fadeDuration: 1500,
    volume: 10.0,
    loop: true  // ✅ Зацикливание
};

// === СОСТОЯНИЕ ===
let currentTrack = null;
let currentPlanet = null;
let isMuted = false;
let isPlaying = false;
let fadeTimeout = null;
let musicStarted = false;  // ✅ Флаг первого запуска

// === ПЛАНЕТЫ ===
const PLANETS = [
    'mercury', 'venus', 'earth', 'mars',
    'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'
];

// ==========================================
// 🎵 ОСНОВНЫЕ ФУНКЦИИ
// ==========================================

function init() {
    // Загружаем состояние mute
    if (window.gameState && window.gameState.musicMuted !== undefined) {
        isMuted = window.gameState.musicMuted;
    } else {
        const saved = localStorage.getItem('cosmicMusicMuted');
        isMuted = saved === 'true';
    }

    // Подписываемся на смену планеты
    if (window.EventBus) {
        window.EventBus.on('game:planetChanged', function(planet) {
            if (musicStarted) {  // ✅ Только если музыка уже запущена
                playPlanetMusic(planet);
            }
        });
    }

    // Создаём кнопку mute
    createMuteButton();
    // ✅ Запускаем музыку после первого клика пользователя
    const startMusic = function() {
        if (!musicStarted && window.gameState && window.gameState.currentLocation) {
            playPlanetMusic(window.gameState.currentLocation);
            musicStarted = true;
            console.log('🎵 Music started for planet:', window.gameState.currentLocation);
        }
        // Удаляем слушатели
        document.removeEventListener('click', startMusic);
        document.removeEventListener('touchstart', startMusic);
        document.removeEventListener('keydown', startMusic);
    };

    document.addEventListener('click', startMusic, { once: true });
    document.addEventListener('touchstart', startMusic, { once: true });
    document.addEventListener('keydown', startMusic, { once: true });

    console.log(' Music System initialized. Waiting for user interaction...');
}

function playPlanetMusic(planet) {
    if (!PLANETS.includes(planet)) {
        console.warn('⚠️ [MUSIC] Unknown planet:', planet);
        return;
    }

    // Если планета не изменилась — ничего не делаем
    if (currentPlanet === planet && currentTrack && !currentTrack.paused) {
        return;
    }

    currentPlanet = planet;
    const trackPath = `audio/${planet}.mp3`;

    console.log('🎵 [MUSIC] Playing:', trackPath);

    // Fade out текущего трека
    if (currentTrack) {
        fadeOut(currentTrack, () => {
            currentTrack.pause();
            currentTrack = null;
            // Запускаем новый трек
            loadAndPlay(trackPath);
        });
    } else {
        loadAndPlay(trackPath);
    }
}

function loadAndPlay(path) {    const audio = new Audio(path);
    audio.loop = MUSIC_CONFIG.loop;  // ✅ Зацикливание
    audio.volume = isMuted ? 0 : MUSIC_CONFIG.volume;
    audio.preload = 'auto';

    // Обработка ошибок
    audio.addEventListener('error', (e) => {
        console.error(' [MUSIC] Error loading:', path, e);
    });

    // Воспроизведение после загрузки
    audio.addEventListener('canplaythrough', () => {
        audio.play().then(() => {
            isPlaying = true;
            if (!isMuted) {
                fadeIn(audio);
            }
            updateMuteButton();
            console.log(' [MUSIC] Playing:', path);
        }).catch(err => {
            console.warn('⚠️ [MUSIC] Play failed:', err);
            isPlaying = false;
        });
    }, { once: true });

    // ✅ Обработка окончания трека (на случай если loop не сработал)
    audio.addEventListener('ended', () => {
        console.log('🎵 [MUSIC] Track ended, restarting...');
        audio.currentTime = 0;
        audio.play().catch(err => {
            console.error('❌ [MUSIC] Restart failed:', err);
        });
    });

    currentTrack = audio;
}

function fadeIn(audio) {
    if (fadeTimeout) clearTimeout(fadeTimeout);
    
    audio.volume = 0;
    const steps = 20;
    const stepDuration = MUSIC_CONFIG.fadeDuration / steps;
    const volumeStep = MUSIC_CONFIG.volume / steps;
    let currentVolume = 0;

    const fade = () => {
        currentVolume += volumeStep;
        if (currentVolume >= MUSIC_CONFIG.volume) {
            audio.volume = MUSIC_CONFIG.volume;            return;
        }
        audio.volume = currentVolume;
        fadeTimeout = setTimeout(fade, stepDuration);
    };

    fade();
}

function fadeOut(audio, callback) {
    if (fadeTimeout) clearTimeout(fadeTimeout);
    
    const steps = 20;
    const stepDuration = MUSIC_CONFIG.fadeDuration / steps;
    const volumeStep = audio.volume / steps;

    const fade = () => {
        audio.volume -= volumeStep;
        if (audio.volume <= 0.01) {
            audio.volume = 0;
            if (callback) callback();
            return;
        }
        fadeTimeout = setTimeout(fade, stepDuration);
    };

    fade();
}

function toggleMute() {
    isMuted = !isMuted;

    // Сохраняем состояние
    if (window.gameState) {
        window.gameState.musicMuted = isMuted;
    }
    localStorage.setItem('cosmicMusicMuted', isMuted.toString());

    // Применяем к текущему треку
    if (currentTrack) {
        if (isMuted) {
            fadeOut(currentTrack, () => {
                currentTrack.volume = 0;
            });
        } else {
            currentTrack.volume = 0;
            fadeIn(currentTrack);
        }
    }
    updateMuteButton();
    console.log('🎵 [MUSIC] Mute:', isMuted);
}

function createMuteButton() {
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

    btn.addEventListener('click', toggleMute);
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
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
// 🚀 ПУБЛИЧНЫЙ API
// ==========================================

window.MusicSystem = {    init: init,
    playPlanetMusic: playPlanetMusic,
    toggleMute: toggleMute,
    isMuted: () => isMuted,
    isPlaying: () => isPlaying,
    getCurrentPlanet: () => currentPlanet
};

// ==========================================
// 🚀 АВТОЗАПУСК
// ==========================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
} else {
    setTimeout(init, 500);
}

})();
