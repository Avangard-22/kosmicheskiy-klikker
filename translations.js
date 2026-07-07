// js/translations.js
(function() {
    'use strict';

    // === СЛОВАРЬ ПЕРЕВОДОВ ===
    const translations = {
        ru: {
            gameTitle: {
                mercury: "☿ Меркурий", venus: "♀ Венера", earth: "♁ Земля",
                mars: "♂ Марс", jupiter: "♃ Юпитер", saturn: "♄ Сатурн",
                uranus: "♅ Уран", neptune: "♆ Нептун", pluto: "♇ Плутон"
            },
            progressText: "Прогресс: {current} / {target} а.е. ({percent}%)",
            tooltips: {
                upgradeClick: "Увеличить силу удара",
                upgradeHelper: "Активировать Bobo",
                upgradeCritChance: "Увеличить шанс крита",
                upgradeCritMult: "Увеличить множитель крита",
                upgradeHelperDmg: "Увеличить урон Bobo",
                clickPowerUpgrade: "Сила удара: {power}",
                critChanceUpgrade: "Шанс крита: {chance}%",
                critMultUpgrade: "Множитель крита: x{mult}",
                helperDmgUpgrade: "Уровень Bobo: {level}",
                combo: "КОМБО x{count}! +{bonus}",
                reward: "+{reward} 💎",
                helperAvailable: "🤖 Bobo активирован!",
                helperEnd: "⏰ Bobo завершил работу",
                noSave: "❌ Сохранение не найдено"
            },
            locationProgress: {
                unlocked: "🪐 {location} разблокирована!"
            },
            ui: {
                continue: "Продолжить",
                newGame: "Новая игра",
                crystals: "Кристаллы",
                power: "Сила",
                crit: "Крит",
                critMult: "Множ.крита"
            }
        },
        en: {
            gameTitle: {
                mercury: "☿ Mercury", venus: "♀ Venus", earth: "♁ Earth",
                mars: "♂ Mars", jupiter: "♃ Jupiter", saturn: "♄ Saturn",
                uranus: "♅ Uranus", neptune: "♆ Neptune", pluto: "♇ Pluto"
            },
            progressText: "Progress: {current} / {target} AU ({percent}%)",
            tooltips: {
                upgradeClick: "Increase click power",
                upgradeHelper: "Activate Bobo",
                upgradeCritChance: "Increase crit chance",
                upgradeCritMult: "Increase crit multiplier",
                upgradeHelperDmg: "Increase Bobo damage",
                clickPowerUpgrade: "Click Power: {power}",
                critChanceUpgrade: "Crit Chance: {chance}%",
                critMultUpgrade: "Crit Multiplier: x{mult}",
                helperDmgUpgrade: "Bobo Level: {level}",
                combo: "COMBO x{count}! +{bonus}",
                reward: "+{reward} 💎",
                helperAvailable: "🤖 Bobo activated!",
                helperEnd: "⏰ Bobo finished work",
                noSave: "❌ No save found"
            },
            locationProgress: {
                unlocked: "🪐 {location} unlocked!"
            },
            ui: {
                continue: "Continue",
                newGame: "New Game",
                crystals: "Crystals",
                power: "Power",
                crit: "Crit",
                critMult: "Crit Mult"
            }
        },
        zh: {
            gameTitle: {
                mercury: "☿ 水星", venus: "♀ 金星", earth: "♁ 地球",
                mars: "♂ 火星", jupiter: "♃ 木星", saturn: "♄ 土星",
                uranus: "♅ 天王星", neptune: "♆ 海王星", pluto: "♇ 冥王星"
            },
            progressText: "进度: {current} / {target} AU ({percent}%)",
            tooltips: {
                upgradeClick: "增加点击力量",
                upgradeHelper: "激活 Bobo",
                upgradeCritChance: "增加暴击几率",
                upgradeCritMult: "增加暴击倍率",
                upgradeHelperDmg: "增加 Bobo 伤害",
                clickPowerUpgrade: "点击力量: {power}",
                critChanceUpgrade: "暴击几率: {chance}%",
                critMultUpgrade: "暴击倍率: x{mult}",
                helperDmgUpgrade: "Bobo 等级: {level}",
                combo: "连击 x{count}! +{bonus}",
                reward: "+{reward} 💎",
                helperAvailable: "🤖 Bobo 已激活!",
                helperEnd: "⏰ Bobo 工作结束",
                noSave: "❌ 未找到存档"
            },
            locationProgress: {
                unlocked: "🪐 {location} 已解锁!"
            },
            ui: {
                continue: "继续",
                newGame: "新游戏",
                crystals: "水晶",
                power: "力量",
                crit: "暴击",
                critMult: "暴击倍率"
            }
        }
    };

    // Флаги стран
    const FLAGS = { ru: '🇷🇺', en: '🇬🇧', zh: '🇨🇳' };
    const LANG_ORDER = ['ru', 'en', 'zh'];

    // Текущий язык (по умолчанию русский)
    window.currentLanguage = localStorage.getItem('cosmicLang') || 'ru';

    /**
     * Получить перевод по ключу
     */
    window.getTranslation = function(key, lang) {
        lang = lang || window.currentLanguage;
        const keys = key.split('.');
        let result = translations[lang];
        for (const k of keys) {
            if (result && typeof result === 'object') result = result[k];
            else return key; // Возвращаем ключ если перевод не найден
        }
        return result || key;
    };

    /**
     * Форматирование строки с подстановкой переменных
     * Пример: formatString("Прогресс: {current}%", { current: 50 }) => "Прогресс: 50%"
     */
    window.formatString = function(template, vars) {
        if (!template || typeof template !== 'string') return '';
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return vars && vars[key] !== undefined ? vars[key] : match;
        });
    };

    /**
     * Применить перевод к DOM-элементу
     * @param {HTMLElement} el - Элемент
     * @param {string} key - Ключ перевода
     * @param {Object} vars - Переменные для форматирования (опционально)
     */
    window.applyTranslation = function(el, key, vars) {
        if (!el) return;
        const text = window.getTranslation(key);
        el.textContent = vars ? window.formatString(text, vars) : text;
    };

    /**
     * Переключить язык
     */
    window.switchLanguage = function() {
        const idx = LANG_ORDER.indexOf(window.currentLanguage);
        window.currentLanguage = LANG_ORDER[(idx + 1) % LANG_ORDER.length];
        localStorage.setItem('cosmicLang', window.currentLanguage);
        
        updateLanguageFlag();
        updateAllUITexts();
        
        console.log('🌍 Язык переключён:', window.currentLanguage);
    };

    /**
     * Обновить флаг на кнопке языка
     */
    window.updateLanguageFlag = function() {
        const btn = document.getElementById('langBtn-welcome');
        if (btn) {
            btn.textContent = FLAGS[window.currentLanguage] || '🌍';
        }
    };

    /**
     * Обновить кнопку "Продолжить" в зависимости от наличия сохранения
     */
    window.updateContinueButton = function() {
        const btn = document.getElementById('continueBtn');
        if (!btn) return;
        
        const hasSaveData = typeof window.hasSave === 'function' 
            ? window.hasSave() 
            : localStorage.getItem('cosmicClickerSave') !== null;
        
        if (hasSaveData) {
            btn.classList.add('save-available');
            btn.classList.remove('no-save');
            applyTranslation(btn, 'ui.continue');
        } else {
            btn.classList.remove('save-available');
            btn.classList.add('no-save');
            applyTranslation(btn, 'ui.newGame');
        }
    };

    /**
     * Обновить все тексты в UI при смене языка
     */
    function updateAllUITexts() {
        // Заголовок планеты
        if (window.gameState && window.gameState.currentLocation) {
            const titleEl = document.getElementById('gameTitle');
            if (titleEl) applyTranslation(titleEl, `gameTitle.${window.gameState.currentLocation}`);
        }
        
        // Прогресс-бар
        if (window.GAME_UI && window.GAME_UI.updateProgressBar) {
            window.GAME_UI.updateProgressBar();
        }
        
        // HUD лейблы (если есть отдельные элементы для текста)
        // Кнопка продолжения
        updateContinueButton();
        
        // Тултипы обновятся автоматически при следующем наведении,
        // так как они читают translations[currentLanguage] динамически
        
        // Достижения — перерисовываем панель если открыта
        if (window.achievementsSystem && window.achievementsSystem.updateAchievementsDisplay) {
            window.achievementsSystem.updateAchievementsDisplay();
        }
    }

    // Глобальная ссылка на словарь (для прямого доступа из других модулей)
    window.translations = translations;

    console.log('🌍 Translations initialized. Language:', window.currentLanguage);
})();