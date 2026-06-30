// js/translations.js (v2.0) — дополнения в конец объектов
(function() {
'use strict';

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
            noSave: "❌ Сохранение не найдено",
            helperAlreadyActive: "Bobo уже активен!",
            // ✅ НОВОЕ
            darkMatter: "⚫ Тёмная материя: {amount}",
            convertDMInsufficient: "❌ Недостаточно кристаллов (нужно 100 000 за 1 ед.)",
            convertDMResult: "⚫ +{amount} Тёмной материи"
        },
        locationProgress: { unlocked: "🪐 {location} разблокирована!" },
        ui: {
            continue: "Продолжить", newGame: "Новая игра", crystals: "Кристаллы",
            power: "Сила", crit: "Крит", critMult: "Множ.крита",
            save: "Сохранить", shop: "Магазин", achievements: "Достижения",
            dailyBonus: "Ежедневный бонус",
            // ✅ НОВОЕ
            darkMatter: "Тёмная материя",
            proceed: "Продолжить",
            convertAll: "Обменять всё на Тёмную материю",
            resetNotice: "Параметры сброшены к базовым, достижения сохранены"
        },
        // ✅ НОВАЯ СЕКЦИЯ: перки
        perks: {
            crystal_interval:  "+300% к кристаллам на 20 мин каждые 3 ч",
            bobo_crystal_call: "Каждый 4-й вызов Bobo: +21-69% кристаллов",
            bobo_hit_reward:   "Каждый 3-й удар Bobo = +100% кристаллов",
            click_damage_pct:  "+25% к силе и шансу крита",
            block_hp_discount: "Здоровье блоков −15%",
            reward_mult:       "+50% ко всем наградам",
            helper_speed:      "Bobo атакует на 30% быстрее",
            start_bonus:       "+50 к силе на старте"
        },
        // ✅ НОВАЯ СЕКЦИЯ: переход между планетами
        transition: {
            title: "🌍 Переход на {planet}",
            description: "Параметры сброшены к базовым, достижения сохранены",
            perkTitle: "🌟 Постоянный бонус получен",
            darkMatterTitle: "⚫ Тёмная материя",
            darkMatterDesc: "Таинственная субстанция, необходимая для скачков в дальний космос. Пригодится для преодоления пространственных разломов за пределами Солнечной системы.",
            balance: "💎 Баланс: {amount}",
            convertBtn: "⚫ Обменять всё на Тёмную материю",
            proceedBtn: "Продолжить"
        },
        achievements: { /* ... существующий объект без изменений ... */
            mercury: { description: "Исследование Меркурия", levels: { m_first: "Первый камень Меркурия", m_blocks_100: "Разрушитель кратеров", m_blocks_500: "Покоритель поверхности", m_crits_50: "Точный удар в жаре", m_combo_15: "Ритм Меркурия", m_rare_5: "Охотник за аномалиями", m_complete: "☿ Меркурий покорён!" } },
            venus: { description: "Исследование Венеры", levels: { v_first: "Сквозь облака Венеры", v_blocks_250: "Борец с парниковым эффектом", v_blocks_1000: "Кислотный разрушитель", v_crits_100: "Точность в тумане", v_combo_25: "Вихрь Венеры", v_rare_10: "Искатель артефактов", v_complete: "♀ Венера покорена!" } },
            earth: { description: "Защита Земли", levels: { e_first: "Голубая планета", e_blocks_500: "Защитник Земли", e_blocks_2500: "Страж атмосферы", e_crits_200: "Мастер гравитации", e_combo_35: "Орбитальный ритм", e_rare_20: "Коллекционер реликвий", e_complete: "♁ Земля спасена!" } },
            mars: { description: "Колонизация Марса", levels: { ma_first: "Красная пыль", ma_blocks_1000: "Путник по каньонам", ma_blocks_5000: "Покоритель Олимпа", ma_crits_300: "Марсианский снайпер", ma_combo_50: "Шторм в пустыне", ma_rare_30: "Археолог Марса", ma_complete: "♂ Марс колонизирован!" } },
            jupiter: { description: "Покорение Юпитера", levels: { j_first: "Газовый гигант", j_blocks_2500: "В буре Юпитера", j_blocks_12000: "В сердце БКП", j_crits_500: "Молния Юпитера", j_combo_75: "Вихрь гиганта", j_rare_50: "Охотник за спутниками", j_complete: "♃ Юпитер покорён!" } },
            saturn: { description: "Исследование Сатурна", levels: { s_first: "Властелин колец", s_blocks_5000: "Скольжение по кольцам", s_blocks_25000: "Разрушитель ледяных глыб", s_crits_800: "Точность сквозь кольца", s_combo_100: "Космический серфер", s_rare_75: "Коллекционер Титана", s_complete: "♄ Сатурн покорён!" } },
            uranus: { description: "Исследование Урана", levels: { u_first: "Ледяной гигант", u_blocks_10000: "Наклонный путь", u_blocks_50000: "Холодная ярость", u_crits_1200: "Замораживающий удар", u_combo_150: "Метель Урана", u_rare_100: "Ледяные кристаллы", u_complete: "♅ Уран покорён!" } },
            neptune: { description: "Покорение Нептуна", levels: { n_first: "Синяя бездна", n_blocks_20000: "В ураганах Нептуна", n_blocks_100000: "Повелитель ветров", n_crits_2000: "Глубинный удар", n_combo_200: "Шторм 2000 км/ч", n_rare_150: "Сокровища Тритона", n_complete: "♆ Нептун покорён!" } },
            pluto: { description: "Покорение Плутона", levels: { p_first: "Граница системы", p_blocks_50000: "Путник пояса Койпера", p_blocks_250000: "Тень Харона", p_crits_3500: "Ледяное сердце", p_combo_300: "Вечная мерзлота", p_rare_250: "Секреты Плутона", p_complete: "♇ Плутон покорён!" } },
            combatMastery: { description: "Общий урон", levels: { dmg_100k: "100K урона", dmg_1m: "1M урона", dmg_10m: "10M урона", dmg_100m: "100M урона", dmg_1b: "1B урона", dmg_10b: "Разрушитель миров 💥" } },
            resourceCollector: { description: "Собрано кристаллов", levels: { cry_10k: "10K кристаллов", cry_100k: "100K кристаллов", cry_1m: "1M кристаллов", cry_10m: "10M кристаллов", cry_100m: "Магнат космоса 💎" } },
            explorer: { description: "Посещено планет", levels: { planets_1: "Первая планета", planets_3: "Внутренние планеты", planets_5: "Пояс астероидов", planets_7: "Внешние планеты", planets_9: "Покоритель СС 🌌" } },
            comboLegend: { description: "Максимальное комбо", levels: { cmb_50: "50x комбо", cmb_100: "100x комбо", cmb_250: "250x комбо", cmb_500: "500x комбо", cmb_1000: "Легенда ритма 🔥" } },
            critMaster: { description: "Критических ударов", levels: { crit_1k: "1K критов", crit_10k: "10K критов", crit_100k: "100K критов", crit_1m: "Мастер точности ⚡" } },
            upgradeEnthusiast: { description: "Куплено улучшений", levels: { up_10: "10 улучшений", up_50: "50 улучшений", up_100: "100 улучшений", up_250: "Архитектор силы 🔧" } },
            helperCommander: { description: "Активировано помощников", levels: { help_5: "5 помощников", help_25: "25 помощников", help_100: "Командир эскадры 🤖" } },
            boosterUser: { description: "Использовано бустов", levels: { boost_1: "Первый буст", boost_5: "5 бустов", boost_15: "15 бустов", boost_30: "30 бустов", boost_50: "50 бустов", boost_100: "100 бустов" } },
            timeInvestor: { description: "Время в игре", levels: { t_1h: "1 час", t_5h: "5 часов", t_10h: "10 часов", t_25h: "Преданный игрок ⏰" } },
            rareHunter: { description: "Разрушено редких блоков", levels: { r_10: "10 редких блоков", r_50: "50 редких блоков", r_200: "200 редких блоков", r_1000: "Легенда удачи ⭐" } },
            clickMaster: { description: "Совершено кликов", levels: { cl_1k: "1K кликов", cl_10k: "10K кликов", cl_100k: "100K кликов", cl_1m: "1M кликов", cl_10m: "Легенда кликов 👆" } }
        },
        shop: {
            title: "🛒 Магазин бонусов",
            items: {
                timeWarp: { name: "⏳ Искажение времени", desc: "Блоки движутся на 50% медленнее" },
                crystalBoost: { name: "💰 Усилитель кристаллов", desc: "+100% к наградам за блоки" },
                powerSurge: { name: "⚡ Скачок силы", desc: "+200% к силе клика" },
                luckyCharm: { name: "🍀 Талисман удачи", desc: "+50% шанс редких блоков" },
                invincible: { name: "🛡️ Неуязвимость", desc: "Защита от штрафов за пропуск блока" },
                autoClicker: { name: "🤖 Авто-кликер", desc: "Автоматический клик каждые 0.5 сек" }
            }
        },
        dailyBonus: {
            title: "Ежедневный бонус",
            alreadyClaimed: "⏰ Уже получено сегодня!",
            cycleComplete: "🎉 Цикл завершён!",
            day: "День {day}",
            rewards: { 1: "100 Кристаллов", 2: "150 Кристаллов", 3: "200 Кристаллов", 4: "Искажение времени", 5: "300 Кристаллов", 6: "Усилитель кристаллов", 7: "Бонус недели: 500 💎", 8: "400 Кристаллов", 9: "Скачок силы", 10: "500 Кристаллов", 11: "+2 уровня Силы", 12: "600 Кристаллов", 13: "Усилитель кристаллов", 14: "Бонус 2 недели: 1K 💎", 15: "800 Кристаллов", 16: "+3 уровня Крита", 17: "900 Кристаллов", 18: "Скачок силы", 19: "1000 Кристаллов", 20: "+2 уровня Bobo", 21: "Бонус 3 недели: 2K 💎", 22: "1500 Кристаллов", 23: "Искажение времени", 24: "2000 Кристаллов", 25: "+3 уровня Множителя", 26: "2500 Кристаллов", 27: "Усилитель кристаллов", 28: "3000 Кристаллов", 29: "+5 ко всем улучшениям", 30: "ГРАНД ФИНАЛ: 10K 💎!" }
        },
        notifications: {
            achievement: "🏆 ДОСТИЖЕНИЕ!",
            reward: "+{amount} 💎",
            stage: "Стадия: {stage}",
            allLevelsComplete: "🏆 Все уровни пройдены! Итого: {total}"
        }
    },
    en: {
        gameTitle: { mercury: "☿ Mercury", venus: "♀ Venus", earth: "♁ Earth", mars: "♂ Mars", jupiter: "♃ Jupiter", saturn: "♄ Saturn", uranus: "♅ Uranus", neptune: "♆ Neptune", pluto: "♇ Pluto" },
        progressText: "Progress: {current} / {target} AU ({percent}%)",
        tooltips: {
            upgradeClick: "Increase click power", upgradeHelper: "Activate Bobo",
            upgradeCritChance: "Increase crit chance", upgradeCritMult: "Increase crit multiplier",
            upgradeHelperDmg: "Increase Bobo damage", clickPowerUpgrade: "Click Power: {power}",
            critChanceUpgrade: "Crit Chance: {chance}%", critMultUpgrade: "Crit Multiplier: x{mult}",
            helperDmgUpgrade: "Bobo Level: {level}", combo: "COMBO x{count}! +{bonus}",
            reward: "+{reward} 💎", helperAvailable: "🤖 Bobo activated!",
            helperEnd: "⏰ Bobo finished work", noSave: "❌ No save found",
            helperAlreadyActive: "Bobo is already active!",
            darkMatter: "⚫ Dark matter: {amount}",
            convertDMInsufficient: "❌ Not enough crystals (need 100,000 per unit)",
            convertDMResult: "⚫ +{amount} Dark matter"
        },
        locationProgress: { unlocked: "🪐 {location} unlocked!" },
        ui: {
            continue: "Continue", newGame: "New Game", crystals: "Crystals",
            power: "Power", crit: "Crit", critMult: "Crit Mult",
            save: "Save", shop: "Shop", achievements: "Achievements", dailyBonus: "Daily Bonus",
            darkMatter: "Dark Matter", proceed: "Continue",
            convertAll: "Convert all to Dark Matter",
            resetNotice: "Parameters reset to base, achievements saved"
        },
        perks: {
            crystal_interval:  "+300% to crystals for 20 min every 3 hours",
            bobo_crystal_call: "Every 4th Bobo call: +21-69% crystals",
            bobo_hit_reward:   "Every 3rd Bobo hit = +100% crystals",
            click_damage_pct:  "+25% power and crit chance",
            block_hp_discount: "Block health −15%",
            reward_mult:       "+50% to all rewards",
            helper_speed:      "Bobo attacks 30% faster",
            start_bonus:       "+50 power on planet start"
        },
        transition: {
            title: "🌍 Transition to {planet}",
            description: "Parameters reset to base, achievements saved",
            perkTitle: "🌟 Permanent bonus unlocked",
            darkMatterTitle: "⚫ Dark Matter",
            darkMatterDesc: "Mysterious substance needed for jumps to deep space. Will be useful for overcoming spatial rifts beyond the Solar System.",
            balance: "💎 Balance: {amount}",
            convertBtn: "⚫ Convert all to Dark Matter",
            proceedBtn: "Continue"
        },
        achievements: {
            mercury: { description: "Mercury Exploration", levels: { m_first: "First Mercury Stone", m_blocks_100: "Crater Destroyer", m_blocks_500: "Surface Conqueror", m_crits_50: "Precise Hit in Heat", m_combo_15: "Mercury Rhythm", m_rare_5: "Anomaly Hunter", m_complete: "☿ Mercury Conquered!" } },
            venus: { description: "Venus Exploration", levels: { v_first: "Through Venus Clouds", v_blocks_250: "Greenhouse Fighter", v_blocks_1000: "Acid Destroyer", v_crits_100: "Precision in Fog", v_combo_25: "Venus Vortex", v_rare_10: "Artifact Seeker", v_complete: "♀ Venus Conquered!" } },
            earth: { description: "Earth Defense", levels: { e_first: "Blue Planet", e_blocks_500: "Earth Defender", e_blocks_2500: "Atmosphere Guardian", e_crits_200: "Gravity Master", e_combo_35: "Orbital Rhythm", e_rare_20: "Relic Collector", e_complete: "♁ Earth Saved!" } },
            mars: { description: "Mars Colonization", levels: { ma_first: "Red Dust", ma_blocks_1000: "Canyon Walker", ma_blocks_5000: "Olympus Conqueror", ma_crits_300: "Martian Sniper", ma_combo_50: "Desert Storm", ma_rare_30: "Mars Archaeologist", ma_complete: "♂ Mars Colonized!" } },
            jupiter: { description: "Jupiter Conquest", levels: { j_first: "Gas Giant", j_blocks_2500: "In Jupiter's Storm", j_blocks_12000: "In the Heart of GRS", j_crits_500: "Jupiter's Lightning", j_combo_75: "Giant's Vortex", j_rare_50: "Moon Hunter", j_complete: "♃ Jupiter Conquered!" } },
            saturn: { description: "Saturn Exploration", levels: { s_first: "Lord of the Rings", s_blocks_5000: "Ring Slider", s_blocks_25000: "Ice Block Destroyer", s_crits_800: "Precision Through Rings", s_combo_100: "Cosmic Surfer", s_rare_75: "Titan Collector", s_complete: "♄ Saturn Conquered!" } },
            uranus: { description: "Uranus Exploration", levels: { u_first: "Ice Giant", u_blocks_10000: "Tilted Path", u_blocks_50000: "Cold Fury", u_crits_1200: "Freezing Strike", u_combo_150: "Uranus Blizzard", u_rare_100: "Ice Crystals", u_complete: "♅ Uranus Conquered!" } },
            neptune: { description: "Neptune Conquest", levels: { n_first: "Blue Abyss", n_blocks_20000: "In Neptune's Hurricanes", n_blocks_100000: "Wind Lord", n_crits_2000: "Deep Strike", n_combo_200: "2000 km/h Storm", n_rare_150: "Triton's Treasures", n_complete: "♆ Neptune Conquered!" } },
            pluto: { description: "Pluto Conquest", levels: { p_first: "System's Edge", p_blocks_50000: "Kuiper Belt Walker", p_blocks_250000: "Charon's Shadow", p_crits_3500: "Ice Heart", p_combo_300: "Eternal Frost", p_rare_250: "Pluto's Secrets", p_complete: "♇ Pluto Conquered!" } },
            combatMastery: { description: "Total Damage", levels: { dmg_100k: "100K Damage", dmg_1m: "1M Damage", dmg_10m: "10M Damage", dmg_100m: "100M Damage", dmg_1b: "1B Damage", dmg_10b: "World Destroyer 💥" } },
            resourceCollector: { description: "Crystals Collected", levels: { cry_10k: "10K Crystals", cry_100k: "100K Crystals", cry_1m: "1M Crystals", cry_10m: "10M Crystals", cry_100m: "Space Magnate 💎" } },
            explorer: { description: "Planets Visited", levels: { planets_1: "First Planet", planets_3: "Inner Planets", planets_5: "Asteroid Belt", planets_7: "Outer Planets", planets_9: "Solar System Conqueror 🌌" } },
            comboLegend: { description: "Maximum Combo", levels: { cmb_50: "50x Combo", cmb_100: "100x Combo", cmb_250: "250x Combo", cmb_500: "500x Combo", cmb_1000: "Rhythm Legend 🔥" } },
            critMaster: { description: "Critical Hits", levels: { crit_1k: "1K Crits", crit_10k: "10K Crits", crit_100k: "100K Crits", crit_1m: "Precision Master ⚡" } },
            upgradeEnthusiast: { description: "Upgrades Purchased", levels: { up_10: "10 Upgrades", up_50: "50 Upgrades", up_100: "100 Upgrades", up_250: "Power Architect 🔧" } },
            helperCommander: { description: "Helpers Activated", levels: { help_5: "5 Helpers", help_25: "25 Helpers", help_100: "Squad Commander 🤖" } },
            boosterUser: { description: "Boosters Used", levels: { boost_1: "First Boost", boost_5: "5 Boosts", boost_15: "15 Boosts", boost_30: "30 Boosts", boost_50: "50 Boosts", boost_100: "100 Boosts" } },
            timeInvestor: { description: "Time Played", levels: { t_1h: "1 Hour", t_5h: "5 Hours", t_10h: "10 Hours", t_25h: "Dedicated Player ⏰" } },
            rareHunter: { description: "Rare Blocks Destroyed", levels: { r_10: "10 Rare Blocks", r_50: "50 Rare Blocks", r_200: "200 Rare Blocks", r_1000: "Luck Legend ⭐" } },
            clickMaster: { description: "Clicks Made", levels: { cl_1k: "1K Clicks", cl_10k: "10K Clicks", cl_100k: "100K Clicks", cl_1m: "1M Clicks", cl_10m: "Click Legend 👆" } }
        },
        shop: {
            title: "🛒 Bonus Shop",
            items: {
                timeWarp: { name: "⏳ Time Warp", desc: "Blocks move 50% slower" },
                crystalBoost: { name: "💰 Crystal Boost", desc: "+100% block rewards" },
                powerSurge: { name: "⚡ Power Surge", desc: "+200% click power" },
                luckyCharm: { name: "🍀 Lucky Charm", desc: "+50% rare block chance" },
                invincible: { name: "🛡️ Invincibility", desc: "Protection from skip penalties" },
                autoClicker: { name: "🤖 Auto-Clicker", desc: "Automatic click every 0.5 sec" }
            }
        },
        dailyBonus: {
            title: "Daily Bonus",
            alreadyClaimed: "⏰ Already claimed today!",
            cycleComplete: "🎉 Cycle complete!",
            day: "Day {day}",
            rewards: { 1: "100 Crystals", 2: "150 Crystals", 3: "200 Crystals", 4: "Time Warp", 5: "300 Crystals", 6: "Crystal Boost", 7: "Week Bonus: 500 💎", 8: "400 Crystals", 9: "Power Surge", 10: "500 Crystals", 11: "+2 Power Levels", 12: "600 Crystals", 13: "Crystal Boost", 14: "2 Week Bonus: 1K 💎", 15: "800 Crystals", 16: "+3 Crit Levels", 17: "900 Crystals", 18: "Power Surge", 19: "1000 Crystals", 20: "+2 Bobo Levels", 21: "3 Week Bonus: 2K 💎", 22: "1500 Crystals", 23: "Time Warp", 24: "2000 Crystals", 25: "+3 Multiplier Levels", 26: "2500 Crystals", 27: "Crystal Boost", 28: "3000 Crystals", 29: "+5 to All Upgrades", 30: "GRAND FINALE: 10K 💎!" }
        },
        notifications: {
            achievement: "🏆 ACHIEVEMENT!",
            reward: "+{amount} 💎",
            stage: "Stage: {stage}",
            allLevelsComplete: "🏆 All levels complete! Total: {total}"
        }
    },
    zh: { /* существующий объект без изменений — оставить как в вашем исходнике */ }
};

const FLAGS = { ru: '🇷🇺', en: '🇬🇧', zh: '🇨🇳' };
const LANG_ORDER = ['ru', 'en', 'zh'];

let currentLanguage;
try {
    currentLanguage = localStorage.getItem('cosmicLang') || 'ru';
    if (!translations[currentLanguage]) currentLanguage = 'ru';
} catch (e) {
    currentLanguage = 'ru';
}

window.currentLanguage = currentLanguage;
window.translations = translations;

window.getTranslation = function(key, lang) {
    lang = lang || currentLanguage;
    const keys = key.split('.');
    let result = translations[lang];
    for (const k of keys) {
        if (result && typeof result === 'object') result = result[k];
        else return key;
    }
    return result || key;
};

window.formatString = function(template, vars) {
    if (!template || typeof template !== 'string') return '';
    return template.replace(/{(\w+)}/g, function(match, key) {
        return vars && vars[key] !== undefined ? vars[key] : match;
    });
};

window.applyTranslation = function(el, key, vars) {
    if (!el) return;
    const text = window.getTranslation(key);
    const finalText = vars ? window.formatString(text, vars) : text;
    if (el.children.length > 0) {
        let textNode = null;
        for (let i = el.childNodes.length - 1; i >= 0; i--) {
            if (el.childNodes[i].nodeType === Node.TEXT_NODE && el.childNodes[i].textContent.trim()) {
                textNode = el.childNodes[i];
                break;
            }
        }
        if (textNode) textNode.textContent = ' ' + finalText;
        else el.appendChild(document.createTextNode(' ' + finalText));
    } else {
        el.textContent = finalText;
    }
};

window.switchLanguage = function() {
    const idx = LANG_ORDER.indexOf(currentLanguage);
    currentLanguage = LANG_ORDER[(idx + 1) % LANG_ORDER.length];
    window.currentLanguage = currentLanguage;
    try { localStorage.setItem('cosmicLang', currentLanguage); } catch (e) {}
    window.updateLanguageFlag();
    window.updateAllUITexts();
    console.log('🌍 Язык переключён:', currentLanguage);
};

window.updateLanguageFlag = function() {
    const btn = document.getElementById('langBtn-welcome');
    if (btn) btn.textContent = FLAGS[currentLanguage] || '🌍';
};

window.updateContinueButton = function() {
    const btn = document.getElementById('continueBtn');
    if (!btn) return;
    let hasSaveData = false;
    try {
        hasSaveData = typeof window.hasSave === 'function'
            ? window.hasSave()
            : localStorage.getItem('cosmicClickerSave') !== null;
    } catch (e) {}

    if (hasSaveData) {
        btn.classList.add('save-available');
        btn.classList.remove('no-save');
        window.applyTranslation(btn, 'ui.continue');
    } else {
        btn.classList.remove('save-available');
        btn.classList.add('no-save');
        window.applyTranslation(btn, 'ui.newGame');
    }
};

window.updateAllUITexts = function() {
    if (window.gameState && window.gameState.currentLocation) {
        const titleEl = document.getElementById('gameTitle');
        if (titleEl) window.applyTranslation(titleEl, 'gameTitle.' + window.gameState.currentLocation);
    }
    if (window.GAME_UI && window.GAME_UI.updateProgressBar) window.GAME_UI.updateProgressBar();
    window.updateContinueButton();
    if (window.achievementsSystem?.updateAchievementsDisplay) window.achievementsSystem.updateAchievementsDisplay();
    if (window.shopSystem?.updateShopDisplay) window.shopSystem.updateShopDisplay();
};

console.log('🌍 Translations v2.0 initialized. Language:', currentLanguage);
})();