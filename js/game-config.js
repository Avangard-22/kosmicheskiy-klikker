/* ==========================================================================
   ⚙️ COSMIC CLICKER - CONFIGURATION, SECURITY & DATA MANAGEMENT (PRODUCTION)
   ========================================================================== */

(function() {
'use strict';

// Секретная соль для предотвращения ручного изменения localStorage текстовыми редакторами
const DATA_SALT = "CosmicClickerSecretSalt2026_##X";

window.GAME_CONFIG = {
    // --- 🪐 Баланс солнечной системы (Удаленность от Солнца в А.Е.) ---
    astronomicalUnits: {
        mercury: 0.39, venus: 0.72, earth: 1.00, mars: 1.52,
        jupiter: 5.20, saturn: 9.58, uranus: 19.22, neptune: 30.05
    },

    // --- Порядок прохождения локаций ---
    planetOrder: ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'],

    // --- Настройки планет: Цвета, Требования по урону и Темы ---
    locations: {
        mercury: { name: 'Меркурий', color: '#888888', borderColor: '#aaaaaa', requiredTotalDamage: 0, blockColors: ['#555555', '#666666', '#777777'] },
        venus: { name: 'Венера', color: '#e3bb87', borderColor: '#df9c3d', requiredTotalDamage: 1500, blockColors: ['#e6b800', '#cc9900', '#b38600'] },
        earth: { name: 'Земля', color: '#2d78cd', borderColor: '#4caf50', requiredTotalDamage: 10000, blockColors: ['#0066cc', '#33cc33', '#1f7a1f'] },
        mars: { name: 'Марс', color: '#c1440e', borderColor: '#e64a19', requiredTotalDamage: 75000, blockColors: ['#993300', '#cc3300', '#ff5500'] },
        jupiter: { name: 'Юпитер', color: '#d8ca9d', borderColor: '#b08d57', requiredTotalDamage: 500000, blockColors: ['#b37400', '#cc8800', '#e69d24'] },
        saturn: { name: 'Сатурн', color: '#ead6b2', borderColor: '#ceb180', requiredTotalDamage: 4000000, blockColors: ['#99804d', '#b3965b', '#ccab66'] },
        uranus: { name: 'Уран', color: '#4b70dd', borderColor: '#00bcd4', requiredTotalDamage: 30000000, blockColors: ['#00838f', '#0097a7', '#00bcd4'] },
        neptune: { name: 'Нептун', color: '#274687', borderColor: '#3f51b5', requiredTotalDamage: 250000000, blockColors: ['#0d47a1', '#1565c0', '#1e88e5'] }
    },

    // --- Мультипликаторы редких блоков (Астероидов) ---
    rareBlocks: {
        gold: { name: 'Золотой', className: 'block-gold', chance: 0.05, healthMultiplier: 1.5, multiplier: 5 },
        quantum: { name: 'Квантовый', className: 'block-quantum', chance: 0.01, healthMultiplier: 3.0, multiplier: 25 }
    },

    // --- Коэффициенты прогрессии цен в магазине ---
    upgradePrices: {
        clickPower: { base: 10, multiplier: 1.14 },
        helper: { base: 50, multiplier: 1.18 },
        critChance: { base: 150, multiplier: 1.35 },
        critMultiplier: { base: 250, multiplier: 1.40 },
        helperDamage: { base: 200, multiplier: 1.25 }
    },

    // --- Глобальные константы игрового баланса ---
    balanceConfig: {
        baseHealth: 12,
        targetClicks: 8,       // Астероид должен уничтожаться в среднем за 8 кликов
        rewardMultiplier: 1.2,
        penaltyMultiplier: 0.5,
        comboMultiplier: 0.02, // +2% к награде за каждый шаг комбо
        damageProgression: { baseMultiplier: 0.65, diminishingReturns: 0.98, maxLevelEffect: 120 },
        healthRandomRange: { min: 0.85, max: 1.20 },
        randomBonusRange: { min: 0.90, max: 1.15 }
    }
};

// --- Глобальная система локализации (Мультиязычность EN/RU) ---
window.currentLanguage = localStorage.getItem('cosmic_lang') || 'ru';
window.translations = {
    ru: {
        'gameTitle.mercury': 'Орбита Меркурия', 'gameTitle.venus': 'Облака Венеры', 'gameTitle.earth': 'Защита Земли',
        'gameTitle.mars': 'Пустоши Марса', 'gameTitle.jupiter': 'Бури Юпитера', 'gameTitle.saturn': 'Кольца Сатурна',
        'gameTitle.uranus': 'Штормы Урана', 'gameTitle.neptune': 'Бездна Нептуна',
        'hud.progressPattern': 'Система: {current}/{total}',
        'tooltips.insufficientCoins': 'Недостаточно кристаллов для апгрейда!',
        'tooltips.upgradeClick': 'Повышает чистый урон от каждого твоего тапа.',
        'tooltips.upgradeHelper': 'Активирует дроида Bobo, атакующего автоматически.',
        'tooltips.upgradeCritChance': 'Повышает шанс нанести критический урон (Макс. 50%).',
        'tooltips.upgradeCritMult': 'Увеличивает разрушительность критических ударов.',
        'tooltips.upgradeHelperDmg': 'Модернизирует лазерные пушки дроида Bobo.'
    },
    en: {
        'gameTitle.mercury': 'Mercury Orbit', 'gameTitle.venus': 'Venus Clouds', 'gameTitle.earth': 'Earth Defense',
        'gameTitle.mars': 'Mars Wastelands', 'gameTitle.jupiter': 'Jupiter Storms', 'gameTitle.saturn': 'Saturn Rings',
        'gameTitle.uranus': 'Uranus Gales', 'gameTitle.neptune': 'Neptune Abyss',
        'hud.progressPattern': 'System: {current}/{total}',
        'tooltips.insufficientCoins': 'Not enough crystals for upgrade!',
        'tooltips.upgradeClick': 'Increases pure damage dealt by each tap.',
        'tooltips.upgradeHelper': 'Activates Bobo droid to attack automatically.',
        'tooltips.upgradeCritChance': 'Increases chance to deal critical damage (Max 50%).',
        'tooltips.upgradeCritMult': 'Multiplies the destructiveness of critical hits.',
        'tooltips.upgradeHelperDmg': 'Upgrades Bobo droid\'s laser cannons.'
    }
};

/* ==========================================================================
   2. ЗАЩИТА ДАННЫХ И КРИПТОГРАФИЧЕСКИЙ СКРИНИНГ
   ========================================================================== */

/**
 * Простейший отказоустойчивый генератор контрольной суммы (хэша) строки состояния.
 * Защищает от редактирования сохранений через DevTools.
 */
function generateChecksum(stringData) {
    let hash = 0;
    const saltedString = stringData + DATA_SALT;
    for (let i = 0; i < saltedString.length; i++) {
        const char = saltedString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Преобразование в 32-битное целое число
    }
    return hash.toString(16);
}

/**
 * Фабричный метод валидации схемы данных (Hydration / Скрининг).
 * Исключает падение игры, если структура сохранения устарела или повреждена.
 */
function validateAndHydrateState(rawState) {
    const defaultState = {
        coins: 0, clickPower: 1, critChance: 0.001, critMultiplier: 2.0,
        currentLocation: 'mercury', totalDamageDealt: 0, clickUpgradeLevel: 0,
        critChanceUpgradeLevel: 0, critMultiplierUpgradeLevel: 0, helperUpgradeLevel: 0,
        helperDamageUpgradeLevel: 0, helperActive: false, helperDamageBonus: 0,
        unlockedLocations: ['mercury'], gameActive: false
    };

    if (!rawState || typeof rawState !== 'object') return defaultState;

    // Безопасное слияние структур (Заполнение отсутствующих полей дефолтными значениями)
    Object.keys(defaultState).forEach(key => {
        if (rawState[key] === undefined) {
            rawState[key] = defaultState[key];
        }
    });

    // Валидация типов данных во избежание инъекций String-значений вместо Number
    if (typeof rawState.coins !== 'number' || isNaN(rawState.coins)) rawState.coins = 0;
    if (!window.GAME_CONFIG.planetOrder.includes(rawState.currentLocation)) rawState.currentLocation = 'mercury';

    return rawState;
}

/* ==========================================================================
   3. УМНОЕ ОТЛОЖЕННОЕ СОХРАНЕНИЕ (DEBOUNCE MANAGER)
   ========================================================================== */

let saveTimeoutId = null;

/**
 * Глобальная функция сохранения игры с функцией дебаунса (сжатия потока вызовов).
 * Накапливает триггеры и делает один физический цикл записи раз в 2 секунды.
 */
window.saveGame = function() {
    if (!window.gameState) return;

    // Если запрос пришел раньше лимита — сбрасываем старый таймер и заводим новый
    if (saveTimeoutId) clearTimeout(saveTimeoutId);

    saveTimeoutId = setTimeout(() => {
        try {
            const serializedState = JSON.stringify(window.gameState);
            const token = generateChecksum(serializedState);

            // Сохраняем и данные, и цифровую подпись (хэш) к ним
            localStorage.setItem('cosmic_clicker_save', serializedState);
            localStorage.setItem('cosmic_clicker_auth', token);

            // Резервный мост для Telegram Cloud Storage, если запущен внутри Telegram WebApp
            if (window.Telegram?.WebApp?.CloudStorage) {
                window.Telegram.WebApp.CloudStorage.setItem('cc_state', serializedState, (err, success) => {
                    if (success) console.log('☁️ Синхронизация с Telegram Cloud успешна');
                });
            }
            console.log('💾 Игра успешно сохранена локально. Валидация: OK');
        } catch (e) {
            console.error('Ошибка записи сохранения:', e);
        }
    }, 2000); // Задержка дебаунса — 2 секунды от последнего изменения
};

/**
 * Инициализация / Загрузка профиля при старте или продолжении игры.
 */
window.cloudInit = async function() {
    console.log('📂 Попытка извлечения профиля...');
    let localSave = localStorage.getItem('cosmic_clicker_save');
    let localAuth = localStorage.getItem('cosmic_clicker_auth');

    if (localSave) {
        const computedToken = generateChecksum(localSave);
        
        // Проверка целостности: если токены не совпали, обнуляем баланс читера
        if (computedToken !== localAuth) {
            console.warn('⚠️ Обнаружено несанкционированное изменение файла сохранения! Сброс данных.');
            localSave = null;
        }
    }

    if (localSave) {
        try {
            const parsed = JSON.parse(localSave);
            window.gameState = validateAndHydrateState(parsed);
            return;
        } catch (e) {
            console.error('Ошибка парсинга сейва, откат до дефолта', e);
        }
    }

    // Если локального сохранения нет или оно заблокировано за читерство — создаем чистый профиль
    window.gameState = validateAndHydrateState(null);
};

window.resetGame = function() {
    localStorage.removeItem('cosmic_clicker_save');
    localStorage.removeItem('cosmic_clicker_auth');
    window.gameState = validateAndHydrateState(null);
    window.saveGame();
};

/* ==========================================================================
   4. ВСПОМОГАТЕЛЬНЫЕ СИСТЕМНЫЕ МЕТОДЫ (ЯЗЫК / ТЕКСТ)
   ========================================================================== */

window.switchLanguage = function() {
    window.currentLanguage = (window.currentLanguage === 'ru') ? 'en' : 'ru';
    localStorage.setItem('cosmic_lang', window.currentLanguage);
    
    // Принудительное обновление интерфейса
    if (window.GAME_CORE && window.GAME_CORE.currentLocation) {
        window.GAME_CORE.setLocation(window.gameState.currentLocation);
    }
    if (window.GAME_UI && typeof window.GAME_UI.updateProgressBar === 'function') {
        window.GAME_UI.updateProgressBar();
    }
    if (window.updateLanguageFlag) window.updateLanguageFlag();
};

window.formatString = function(pattern, placeholders) {
    let str = pattern;
    Object.entries(placeholders).forEach(([key, val]) => {
        str = str.replace(new RegExp(`{${key}}`, 'g'), val);
    });
    return str;
};

window.applyTranslation = function(element, translationKey) {
    if (!element || !window.translations || !window.currentLanguage) return;
    const dict = window.translations[window.currentLanguage];
    if (dict && dict[translationKey]) {
        element.textContent = dict[translationKey];
    }
};

})();
