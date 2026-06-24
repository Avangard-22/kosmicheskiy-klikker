// js/music-system.js
(function() {
'use strict';

// === НАСТРОЙКИ ===
const MUSIC_CONFIG = {
    volume: 0.7,           // Громкость (0.0 - 1.0)
    fadeDuration: 100000,    // Длительность fade in/out (мс)
    loop: true             // Зацикливание
};

// === СОСТОЯНИЕ ===
let currentAudio = null;
let currentPlanet = null;
let isMuted = false;
let isMusicStarted = false;  // Флаг: музыка уже запущена
let fadeTimeout = null;

// === ПЛАНЕТЫ ===
const PLANETS = [
    'mercury', 'venus', 'earth', 'mars',
    'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'
];

// ==========================================
//  ОСНОВНЫЕ ФУНКЦИИ
// ==========================================

/**
 * Инициализация музыкальной системы
 */
function init() {
    // Загружаем состояние mute из localStorage
    const savedMute = localStorage.getItem('cosmicMusicMuted');
    isMuted = savedMute === 'true';

    // Подписываемся на смену планеты через EventBus
    if (window.EventBus) {
        window.EventBus.on('game:planetChanged', function(planet) {
            if (isMusicStarted) {
                playPlanetMusic(planet);
            }
        });
    }

    // Создаём кнопку mute в UI
    createMuteButton();

    // ✅ Запускаем музыку при первом клике пользователя (требование браузеров)
    const startOnFirstInteraction = function() {
        if (!isMusicStarted && window.gameState && window.gameState.currentLocation) {
            playPlanetMusic(window.gameState.currentLocation);
            isMusicStarted = true;
            console.log('🎵 Music started for planet:', window.gameState.currentLocation);
        }
        // Удаляем слушатели после первого запуска
        document.removeEventListener('click', startOnFirstInteraction);
        document.removeEventListener('touchstart', startOnFirstInteraction);
        document.removeEventListener('keydown', startOnFirstInteraction);
    };

    document.addEventListener('click', startOnFirstInteraction, { once: true });
    document.addEventListener('touchstart', startOnFirstInteraction, { once: true });
    document.addEventListener('keydown', startOnFirstInteraction, { once: true });

    console.log('🎵 Music System initialized. Waiting for first interaction...');
}

/**
 * Воспроизвести музыку для планеты
 * @param {string} planet - Название планеты (mercury, venus, ...)
 */
function playPlanetMusic(planet) {
    if (!PLANETS.includes(planet)) {
        console.warn('⚠️ [MUSIC] Unknown planet:', planet);
        return;
    }

    // Если планета не изменилась — ничего не делаем
    if (currentPlanet === planet && currentAudio && !currentAudio.paused) {
        return;
    }

    currentPlanet = planet;
    const trackPath = `audio/${planet}.mp3`;

    console.log('🎵 [MUSIC] Playing:', trackPath);

    // Fade out текущего трека
    if (currentAudio) {
        fadeOut(currentAudio, () => {
            currentAudio.pause();
            currentAudio = null;
            // Запускаем новый трек
            loadAndPlay(trackPath);
        });
    } else {
        loadAndPlay(trackPath);
    }
}

/**
 * Загрузить и воспроизвести трек
 */
function loadAndPlay(path) {
    const audio = new Audio(path);
    audio.loop = MUSIC_CONFIG.loop;
    audio.volume = isMuted ? 0 : MUSIC_CONFIG.volume;
    audio.preload = 'auto';

    // Обработка ошибок
    audio.addEventListener('error', (e) => {
        console.error('❌ [MUSIC] Error loading:', path, e);
    });

    // Воспроизведение после загрузки
    audio.addEventListener('canplaythrough', () => {
        audio.play().then(() => {
            if (!isMuted) {
                fadeIn(audio);
            }
            updateMuteButton();
            console.log('🎵 [MUSIC] Playing:', path);
        }).catch(err => {
            console.warn('⚠️ [MUSIC] Play failed:', err);
        });
    }, { once: true });

    currentAudio = audio;
}

/**
 * Fade in (плавное нарастание громкости)
 */
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
            audio.volume = MUSIC_CONFIG.volume;
            return;
        }
        audio.volume = currentVolume;
        fadeTimeout = setTimeout(fade, stepDuration);
    };

    fade();
}

/**
 * Fade out (плавное затухание громкости)
 */
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

/**
 * Переключить mute/unmute
 */
function toggleMute() {
    isMuted = !isMuted;

    // Сохраняем состояние
    localStorage.setItem('cosmicMusicMuted', isMuted.toString());

    // Применяем к текущему треку
    if (currentAudio) {
        if (isMuted) {
            fadeOut(currentAudio, () => {
                currentAudio.volume = 0;
            });
        } else {
            currentAudio.volume = 0;
            fadeIn(currentAudio);
        }
    }

    updateMuteButton();
    console.log('🎵 [MUSIC] Mute:', isMuted);
}

/**
 * Создать кнопку mute в UI
 */
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

/**
 * Обновить иконку кнопки mute
 */
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

window.MusicSystem = {
    init: init,
    playPlanetMusic: playPlanetMusic,
    toggleMute: toggleMute,
    isMuted: () => isMuted,
    getCurrentPlanet: () => currentPlanet
};

// ==========================================
//  АВТОЗАПУСК
// ==========================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
} else {
    setTimeout(init, 500);
}

})();
