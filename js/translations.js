// js/translations.js
(function() {
'use strict';

// === СЛОВАРЬ ПЕРЕВОДОВ ===
const translations = {
    ru: {
        gameTitle: {
            mercury: "☿ Меркурий",
            venus: "♀ Венера",
            earth: "♁ Земля",
            mars: "♂ Марс",
            jupiter: "♃ Юпитер",
            saturn: "♄ Сатурн",
            uranus: "♅ Уран",
            neptune: "♆ Нептун",
            pluto: "♇ Плутон"
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
            helperAlreadyActive: "Bobo уже активен!"
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
            critMult: "Множ.крита",
            save: "Сохранить",
            shop: "Магазин",
            achievements: "Достижения",
            dailyBonus: "Ежедневный бонус"
        },
        achievements: {
            mercury: {
                description: "Исследование Меркурия",
                levels: {
                    m_first: "Первый камень Меркурия",
                    m_blocks_100: "Разрушитель кратеров",
                    m_blocks_500: "Покоритель поверхности",
                    m_crits_50: "Точный удар в жаре",
                    m_combo_15: "Ритм Меркурия",
                    m_rare_5: "Охотник за аномалиями",
                    m_complete: "☿ Меркурий покорён!"
                }
            },
            venus: {
                description: "Исследование Венеры",
                levels: {
                    v_first: "Сквозь облака Венеры",
                    v_blocks_250: "Борец с парниковым эффектом",
                    v_blocks_1000: "Кислотный разрушитель",
                    v_crits_100: "Точность в тумане",
                    v_combo_25: "Вихрь Венеры",
                    v_rare_10: "Искатель артефактов",
                    v_complete: "♀ Венера покорена!"
                }
            },
            earth: {
                description: "Защита Земли",
                levels: {
                    e_first: "Голубая планета",
                    e_blocks_500: "Защитник Земли",
                    e_blocks_2500: "Страж атмосферы",
                    e_crits_200: "Мастер гравитации",
                    e_combo_35: "Орбитальный ритм",
                    e_rare_20: "Коллекционер реликвий",
                    e_complete: "♁ Земля спасена!"
                }
            },
            mars: {
                description: "Колонизация Марса",
                levels: {
                    ma_first: "Красная пыль",
                    ma_blocks_1000: "Путник по каньонам",
                    ma_blocks_5000: "Покоритель Олимпа",
                    ma_crits_300: "Марсианский снайпер",
                    ma_combo_50: "Шторм в пустыне",
                    ma_rare_30: "Археолог Марса",
                    ma_complete: "♂ Марс колонизирован!"
                }
            },
            jupiter: {
                description: "Покорение Юпитера",
                levels: {
                    j_first: "Газовый гигант",
                    j_blocks_2500: "В буре Юпитера",
                    j_blocks_12000: "В сердце БКП",
                    j_crits_500: "Молния Юпитера",
                    j_combo_75: "Вихрь гиганта",
                    j_rare_50: "Охотник за спутниками",
                    j_complete: "♃ Юпитер покорён!"
                }
            },
            saturn: {
                description: "Исследование Сатурна",
                levels: {
                    s_first: "Властелин колец",
                    s_blocks_5000: "Скольжение по кольцам",
                    s_blocks_25000: "Разрушитель ледяных глыб",
                    s_crits_800: "Точность сквозь кольца",
                    s_combo_100: "Космический серфер",
                    s_rare_75: "Коллекционер Титана",
                    s_complete: "♄ Сатурн покорён!"
                }
            },
            uranus: {
                description: "Исследование Урана",
                levels: {
                    u_first: "Ледяной гигант",
                    u_blocks_10000: "Наклонный путь",
                    u_blocks_50000: "Холодная ярость",
                    u_crits_1200: "Замораживающий удар",
                    u_combo_150: "Метель Урана",
                    u_rare_100: "Ледяные кристаллы",
                    u_complete: "♅ Уран покорён!"
                }
            },
            neptune: {
                description: "Покорение Нептуна",
                levels: {
                    n_first: "Синяя бездна",
                    n_blocks_20000: "В ураганах Нептуна",
                    n_blocks_100000: "Повелитель ветров",
                    n_crits_2000: "Глубинный удар",
                    n_combo_200: "Шторм 2000 км/ч",
                    n_rare_150: "Сокровища Тритона",
                    n_complete: "♆ Нептун покорён!"
                }
            },
            pluto: {
                description: "Покорение Плутона",
                levels: {
                    p_first: "Граница системы",
                    p_blocks_50000: "Путник пояса Койпера",
                    p_blocks_250000: "Тень Харона",
                    p_crits_3500: "Ледяное сердце",
                    p_combo_300: "Вечная мерзлота",
                    p_rare_250: "Секреты Плутона",
                    p_complete: "♇ Плутон покорён!"
                }
            },
            combatMastery: {
                description: "Общий урон",
                levels: {
                    dmg_100k: "100K урона",
                    dmg_1m: "1M урона",
                    dmg_10m: "10M урона",
                    dmg_100m: "100M урона",
                    dmg_1b: "1B урона",
                    dmg_10b: "Разрушитель миров 💥"
                }
            },
            resourceCollector: {
                description: "Собрано кристаллов",
                levels: {
                    cry_10k: "10K кристаллов",
                    cry_100k: "100K кристаллов",
                    cry_1m: "1M кристаллов",
                    cry_10m: "10M кристаллов",
                    cry_100m: "Магнат космоса 💎"
                }
            },
            explorer: {
                description: "Посещено планет",
                levels: {
                    planets_1: "Первая планета",
                    planets_3: "Внутренние планеты",
                    planets_5: "Пояс астероидов",
                    planets_7: "Внешние планеты",
                    planets_9: "Покоритель СС 🌌"
                }
            },
            comboLegend: {
                description: "Максимальное комбо",
                levels: {
                    cmb_50: "50x комбо",
                    cmb_100: "100x комбо",
                    cmb_250: "250x комбо",
                    cmb_500: "500x комбо",
                    cmb_1000: "Легенда ритма 🔥"
                }
            },
            critMaster: {
                description: "Критических ударов",
                levels: {
                    crit_1k: "1K критов",
                    crit_10k: "10K критов",
                    crit_100k: "100K критов",
                    crit_1m: "Мастер точности ⚡"
                }
            },
            upgradeEnthusiast: {
                description: "Куплено улучшений",
                levels: {
                    up_10: "10 улучшений",
                    up_50: "50 улучшений",
                    up_100: "100 улучшений",
                    up_250: "Архитектор силы 🔧"
                }
            },
            helperCommander: {
                description: "Активировано помощников",
                levels: {
                    help_5: "5 помощников",
                    help_25: "25 помощников",
                    help_100: "Командир эскадры 🤖"
                }
            },
            boosterUser: {
                description: "Использовано бустов",
                levels: {
                    boost_1: "Первый буст",
                    boost_5: "5 бустов",
                    boost_15: "15 бустов",
                    boost_30: "30 бустов",
                    boost_50: "50 бустов",
                    boost_100: "100 бустов"
                }
            },
            timeInvestor: {
                description: "Время в игре",
                levels: {
                    t_1h: "1 час",
                    t_5h: "5 часов",
                    t_10h: "10 часов",
                    t_25h: "Преданный игрок ⏰"
                }
            },
            rareHunter: {
                description: "Разрушено редких блоков",
                levels: {
                    r_10: "10 редких блоков",
                    r_50: "50 редких блоков",
                    r_200: "200 редких блоков",
                    r_1000: "Легенда удачи ⭐"
                }
            },
            clickMaster: {
                description: "Совершено кликов",
                levels: {
                    cl_1k: "1K кликов",
                    cl_10k: "10K кликов",
                    cl_100k: "100K кликов",
                    cl_1m: "1M кликов",
                    cl_10m: "Легенда кликов 👆"
                }
            }
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
            rewards: {
                1: "100 Кристаллов", 2: "150 Кристаллов", 3: "200 Кристаллов",
                4: "Искажение времени", 5: "300 Кристаллов", 6: "Усилитель кристаллов",
                7: "Бонус недели: 500 💎", 8: "400 Кристаллов", 9: "Скачок силы",
                10: "500 Кристаллов", 11: "+2 уровня Силы", 12: "600 Кристаллов",
                13: "Усилитель кристаллов", 14: "Бонус 2 недели: 1K 💎",
                15: "800 Кристаллов", 16: "+3 уровня Крита", 17: "900 Кристаллов",
                18: "Скачок силы", 19: "1000 Кристаллов", 20: "+2 уровня Bobo",
                21: "Бонус 3 недели: 2K 💎", 22: "1500 Кристаллов", 23: "Искажение времени",
                24: "2000 Кристаллов", 25: "+3 уровня Множителя", 26: "2500 Кристаллов",
                27: "Усилитель кристаллов", 28: "3000 Кристаллов",
                29: "+5 ко всем улучшениям", 30: "ГРАНД ФИНАЛ: 10K 💎!"
            }
        },
        notifications: {
            achievement: "🏆 ДОСТИЖЕНИЕ!",
            reward: "+{amount} 💎",
            stage: "Стадия: {stage}",
            allLevelsComplete: "🏆 Все уровни пройдены! Итого: {total}"
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
            noSave: "❌ No save found",
            helperAlreadyActive: "Bobo is already active!"
        },
        locationProgress: {
            unlocked: "🪐 {location} unlocked!"
        },
        ui: {
            continue: "Continue", newGame: "New Game", crystals: "Crystals",
            power: "Power", crit: "Crit", critMult: "Crit Mult",
            save: "Save", shop: "Shop", achievements: "Achievements",
            dailyBonus: "Daily Bonus"
        },
        achievements: {
            mercury: {
                description: "Mercury Exploration",
                levels: {
                    m_first: "First Mercury Stone", m_blocks_100: "Crater Destroyer",
                    m_blocks_500: "Surface Conqueror", m_crits_50: "Precise Hit in Heat",
                    m_combo_15: "Mercury Rhythm", m_rare_5: "Anomaly Hunter",
                    m_complete: "☿ Mercury Conquered!"
                }
            },
            venus: {
                description: "Venus Exploration",
                levels: {
                    v_first: "Through Venus Clouds", v_blocks_250: "Greenhouse Fighter",
                    v_blocks_1000: "Acid Destroyer", v_crits_100: "Precision in Fog",
                    v_combo_25: "Venus Vortex", v_rare_10: "Artifact Seeker",
                    v_complete: "♀ Venus Conquered!"
                }
            },
            earth: {
                description: "Earth Defense",
                levels: {
                    e_first: "Blue Planet", e_blocks_500: "Earth Defender",
                    e_blocks_2500: "Atmosphere Guardian", e_crits_200: "Gravity Master",
                    e_combo_35: "Orbital Rhythm", e_rare_20: "Relic Collector",
                    e_complete: "♁ Earth Saved!"
                }
            },
            mars: {
                description: "Mars Colonization",
                levels: {
                    ma_first: "Red Dust", ma_blocks_1000: "Canyon Walker",
                    ma_blocks_5000: "Olympus Conqueror", ma_crits_300: "Martian Sniper",
                    ma_combo_50: "Desert Storm", ma_rare_30: "Mars Archaeologist",
                    ma_complete: "♂ Mars Colonized!"
                }
            },
            jupiter: {
                description: "Jupiter Conquest",
                levels: {
                    j_first: "Gas Giant", j_blocks_2500: "In Jupiter's Storm",
                    j_blocks_12000: "In the Heart of GRS", j_crits_500: "Jupiter's Lightning",
                    j_combo_75: "Giant's Vortex", j_rare_50: "Moon Hunter",
                    j_complete: "♃ Jupiter Conquered!"
                }
            },
            saturn: {
                description: "Saturn Exploration",
                levels: {
                    s_first: "Lord of the Rings", s_blocks_5000: "Ring Slider",
                    s_blocks_25000: "Ice Block Destroyer", s_crits_800: "Precision Through Rings",
                    s_combo_100: "Cosmic Surfer", s_rare_75: "Titan Collector",
                    s_complete: "♄ Saturn Conquered!"
                }
            },
            uranus: {
                description: "Uranus Exploration",
                levels: {
                    u_first: "Ice Giant", u_blocks_10000: "Tilted Path",
                    u_blocks_50000: "Cold Fury", u_crits_1200: "Freezing Strike",
                    u_combo_150: "Uranus Blizzard", u_rare_100: "Ice Crystals",
                    u_complete: "♅ Uranus Conquered!"
                }
            },
            neptune: {
                description: "Neptune Conquest",
                levels: {
                    n_first: "Blue Abyss", n_blocks_20000: "In Neptune's Hurricanes",
                    n_blocks_100000: "Wind Lord", n_crits_2000: "Deep Strike",
                    n_combo_200: "2000 km/h Storm", n_rare_150: "Triton's Treasures",
                    n_complete: "♆ Neptune Conquered!"
                }
            },
            pluto: {
                description: "Pluto Conquest",
                levels: {
                    p_first: "System's Edge", p_blocks_50000: "Kuiper Belt Walker",
                    p_blocks_250000: "Charon's Shadow", p_crits_3500: "Ice Heart",
                    p_combo_300: "Eternal Frost", p_rare_250: "Pluto's Secrets",
                    p_complete: "♇ Pluto Conquered!"
                }
            },
            combatMastery: {
                description: "Total Damage",
                levels: {
                    dmg_100k: "100K Damage", dmg_1m: "1M Damage",
                    dmg_10m: "10M Damage", dmg_100m: "100M Damage",
                    dmg_1b: "1B Damage", dmg_10b: "World Destroyer 💥"
                }
            },
            resourceCollector: {
                description: "Crystals Collected",
                levels: {
                    cry_10k: "10K Crystals", cry_100k: "100K Crystals",
                    cry_1m: "1M Crystals", cry_10m: "10M Crystals",
                    cry_100m: "Space Magnate 💎"
                }
            },
            explorer: {
                description: "Planets Visited",
                levels: {
                    planets_1: "First Planet", planets_3: "Inner Planets",
                    planets_5: "Asteroid Belt", planets_7: "Outer Planets",
                    planets_9: "Solar System Conqueror 🌌"
                }
            },
            comboLegend: {
                description: "Maximum Combo",
                levels: {
                    cmb_50: "50x Combo", cmb_100: "100x Combo",
                    cmb_250: "250x Combo", cmb_500: "500x Combo",
                    cmb_1000: "Rhythm Legend 🔥"
                }
            },
            critMaster: {
                description: "Critical Hits",
                levels: {
                    crit_1k: "1K Crits", crit_10k: "10K Crits",
                    crit_100k: "100K Crits", crit_1m: "Precision Master ⚡"
                }
            },
            upgradeEnthusiast: {
                description: "Upgrades Purchased",
                levels: {
                    up_10: "10 Upgrades", up_50: "50 Upgrades",
                    up_100: "100 Upgrades", up_250: "Power Architect 🔧"
                }
            },
            helperCommander: {
                description: "Helpers Activated",
                levels: {
                    help_5: "5 Helpers", help_25: "25 Helpers",
                    help_100: "Squad Commander 🤖"
                }
            },
            boosterUser: {
                description: "Boosters Used",
                levels: {
                    boost_1: "First Boost", boost_5: "5 Boosts",
                    boost_15: "15 Boosts", boost_30: "30 Boosts",
                    boost_50: "50 Boosts", boost_100: "100 Boosts"
                }
            },
            timeInvestor: {
                description: "Time Played",
                levels: {
                    t_1h: "1 Hour", t_5h: "5 Hours",
                    t_10h: "10 Hours", t_25h: "Dedicated Player ⏰"
                }
            },
            rareHunter: {
                description: "Rare Blocks Destroyed",
                levels: {
                    r_10: "10 Rare Blocks", r_50: "50 Rare Blocks",
                    r_200: "200 Rare Blocks", r_1000: "Luck Legend ⭐"
                }
            },
            clickMaster: {
                description: "Clicks Made",
                levels: {
                    cl_1k: "1K Clicks", cl_10k: "10K Clicks",
                    cl_100k: "100K Clicks", cl_1m: "1M Clicks",
                    cl_10m: "Click Legend 👆"
                }
            }
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
            rewards: {
                1: "100 Crystals", 2: "150 Crystals", 3: "200 Crystals",
                4: "Time Warp", 5: "300 Crystals", 6: "Crystal Boost",
                7: "Week Bonus: 500 💎", 8: "400 Crystals", 9: "Power Surge",
                10: "500 Crystals", 11: "+2 Power Levels", 12: "600 Crystals",
                13: "Crystal Boost", 14: "2 Week Bonus: 1K 💎",
                15: "800 Crystals", 16: "+3 Crit Levels", 17: "900 Crystals",
                18: "Power Surge", 19: "1000 Crystals", 20: "+2 Bobo Levels",
                21: "3 Week Bonus: 2K 💎", 22: "1500 Crystals", 23: "Time Warp",
                24: "2000 Crystals", 25: "+3 Multiplier Levels", 26: "2500 Crystals",
                27: "Crystal Boost", 28: "3000 Crystals",
                29: "+5 to All Upgrades", 30: "GRAND FINALE: 10K 💎!"
            }
        },
        notifications: {
            achievement: "🏆 ACHIEVEMENT!",
            reward: "+{amount} 💎",
            stage: "Stage: {stage}",
            allLevelsComplete: "🏆 All levels complete! Total: {total}"
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
            noSave: "❌ 未找到存档",
            helperAlreadyActive: "Bobo 已经激活!"
        },
        locationProgress: {
            unlocked: "🪐 {location} 已解锁!"
        },
        ui: {
            continue: "继续", newGame: "新游戏", crystals: "水晶",
            power: "力量", crit: "暴击", critMult: "暴击倍率",
            save: "保存", shop: "商店", achievements: "成就",
            dailyBonus: "每日奖励"
        },
        achievements: {
            mercury: {
                description: "水星探索",
                levels: {
                    m_first: "第一块水星石", m_blocks_100: "陨石坑破坏者",
                    m_blocks_500: "表面征服者", m_crits_50: "高温精准打击",
                    m_combo_15: "水星节奏", m_rare_5: "异常猎人",
                    m_complete: "☿ 水星已征服!"
                }
            },
            venus: {
                description: "金星探索",
                levels: {
                    v_first: "穿越金星云层", v_blocks_250: "温室效应战士",
                    v_blocks_1000: "酸性破坏者", v_crits_100: "雾中精准",
                    v_combo_25: "金星漩涡", v_rare_10: "神器寻找者",
                    v_complete: "♀ 金星已征服!"
                }
            },
            earth: {
                description: "地球防御",
                levels: {
                    e_first: "蓝色星球", e_blocks_500: "地球守护者",
                    e_blocks_2500: "大气层守卫", e_crits_200: "重力大师",
                    e_combo_35: "轨道节奏", e_rare_20: "遗物收藏家",
                    e_complete: "♁ 地球已拯救!"
                }
            },
            mars: {
                description: "火星殖民",
                levels: {
                    ma_first: "红色尘埃", ma_blocks_1000: "峡谷行者",
                    ma_blocks_5000: "奥林匹斯征服者", ma_crits_300: "火星狙击手",
                    ma_combo_50: "沙漠风暴", ma_rare_30: "火星考古学家",
                    ma_complete: "♂ 火星已殖民!"
                }
            },
            jupiter: {
                description: "木星征服",
                levels: {
                    j_first: "气态巨行星", j_blocks_2500: "木星风暴中",
                    j_blocks_12000: "大红斑中心", j_crits_500: "木星闪电",
                    j_combo_75: "巨行星漩涡", j_rare_50: "卫星猎人",
                    j_complete: "♃ 木星已征服!"
                }
            },
            saturn: {
                description: "土星探索",
                levels: {
                    s_first: "环之王", s_blocks_5000: "环上滑行",
                    s_blocks_25000: "冰块破坏者", s_crits_800: "环间精准",
                    s_combo_100: "宇宙冲浪者", s_rare_75: "泰坦收藏家",
                    s_complete: "♄ 土星已征服!"
                }
            },
            uranus: {
                description: "天王星探索",
                levels: {
                    u_first: "冰巨行星", u_blocks_10000: "倾斜之路",
                    u_blocks_50000: "寒冷之怒", u_crits_1200: "冰冻打击",
                    u_combo_150: "天王星暴风雪", u_rare_100: "冰晶",
                    u_complete: "♅ 天王星已征服!"
                }
            },
            neptune: {
                description: "海王星征服",
                levels: {
                    n_first: "蓝色深渊", n_blocks_20000: "海王星飓风中",
                    n_blocks_100000: "风之王", n_crits_2000: "深海打击",
                    n_combo_200: "2000公里/小时风暴", n_rare_150: "海卫一的宝藏",
                    n_complete: "♆ 海王星已征服!"
                }
            },
            pluto: {
                description: "冥王星征服",
                levels: {
                    p_first: "系统边缘", p_blocks_50000: "柯伊伯带行者",
                    p_blocks_250000: "卡戎之影", p_crits_3500: "冰之心",
                    p_combo_300: "永恒霜冻", p_rare_250: "冥王星的秘密",
                    p_complete: "♇ 冥王星已征服!"
                }
            },
            combatMastery: {
                description: "总伤害",
                levels: {
                    dmg_100k: "100K 伤害", dmg_1m: "1M 伤害",
                    dmg_10m: "10M 伤害", dmg_100m: "100M 伤害",
                    dmg_1b: "1B 伤害", dmg_10b: "世界破坏者 💥"
                }
            },
            resourceCollector: {
                description: "收集的水晶",
                levels: {
                    cry_10k: "10K 水晶", cry_100k: "100K 水晶",
                    cry_1m: "1M 水晶", cry_10m: "10M 水晶",
                    cry_100m: "太空大亨 💎"
                }
            },
            explorer: {
                description: "访问的行星",
                levels: {
                    planets_1: "第一颗行星", planets_3: "内行星",
                    planets_5: "小行星带", planets_7: "外行星",
                    planets_9: "太阳系征服者 🌌"
                }
            },
            comboLegend: {
                description: "最大连击",
                levels: {
                    cmb_50: "50x 连击", cmb_100: "100x 连击",
                    cmb_250: "250x 连击", cmb_500: "500x 连击",
                    cmb_1000: "节奏传奇 🔥"
                }
            },
            critMaster: {
                description: "暴击次数",
                levels: {
                    crit_1k: "1K 暴击", crit_10k: "10K 暴击",
                    crit_100k: "100K 暴击", crit_1m: "精准大师 ⚡"
                }
            },
            upgradeEnthusiast: {
                description: "购买的升级",
                levels: {
                    up_10: "10 次升级", up_50: "50 次升级",
                    up_100: "100 次升级", up_250: "力量架构师 🔧"
                }
            },
            helperCommander: {
                description: "激活的助手",
                levels: {
                    help_5: "5 个助手", help_25: "25 个助手",
                    help_100: "小队指挥官 🤖"
                }
            },
            boosterUser: {
                description: "使用的增益",
                levels: {
                    boost_1: "第一个增益", boost_5: "5 个增益",
                    boost_15: "15 个增益", boost_30: "30 个增益",
                    boost_50: "50 个增益", boost_100: "100 个增益"
                }
            },
            timeInvestor: {
                description: "游戏时间",
                levels: {
                    t_1h: "1 小时", t_5h: "5 小时",
                    t_10h: "10 小时", t_25h: "忠实玩家 ⏰"
                }
            },
            rareHunter: {
                description: "破坏的稀有方块",
                levels: {
                    r_10: "10 个稀有方块", r_50: "50 个稀有方块",
                    r_200: "200 个稀有方块", r_1000: "运气传奇 ⭐"
                }
            },
            clickMaster: {
                description: "点击次数",
                levels: {
                    cl_1k: "1K 点击", cl_10k: "10K 点击",
                    cl_100k: "100K 点击", cl_1m: "1M 点击",
                    cl_10m: "点击传奇 👆"
                }
            }
        },
        shop: {
            title: "🛒 增益商店",
            items: {
                timeWarp: { name: "⏳ 时间扭曲", desc: "方块移动速度降低 50%" },
                crystalBoost: { name: "💰 水晶增益", desc: "方块奖励 +100%" },
                powerSurge: { name: "⚡ 力量激增", desc: "点击力量 +200%" },
                luckyCharm: { name: "🍀 幸运符", desc: "稀有方块几率 +50%" },
                invincible: { name: "🛡️ 无敌", desc: "免受跳过惩罚" },
                autoClicker: { name: "🤖 自动点击器", desc: "每 0.5 秒自动点击" }
            }
        },
        dailyBonus: {
            title: "每日奖励",
            alreadyClaimed: "⏰ 今天已领取!",
            cycleComplete: "🎉 周期完成!",
            day: "第 {day} 天",
            rewards: {
                1: "100 水晶", 2: "150 水晶", 3: "200 水晶",
                4: "时间扭曲", 5: "300 水晶", 6: "水晶增益",
                7: "周奖励: 500 💎", 8: "400 水晶", 9: "力量激增",
                10: "500 水晶", 11: "+2 力量等级", 12: "600 水晶",
                13: "水晶增益", 14: "2 周奖励: 1K 💎",
                15: "800 水晶", 16: "+3 暴击等级", 17: "900 水晶",
                18: "力量激增", 19: "1000 水晶", 20: "+2 Bobo 等级",
                21: "3 周奖励: 2K 💎", 22: "1500 水晶", 23: "时间扭曲",
                24: "2000 水晶", 25: "+3 倍率等级", 26: "2500 水晶",
                27: "水晶增益", 28: "3000 水晶",
                29: "+5 所有升级", 30: "大结局: 10K 💎!"
            }
        },
        notifications: {
            achievement: "🏆 成就!",
            reward: "+{amount} 💎",
            stage: "阶段: {stage}",
            allLevelsComplete: "🏆 所有关卡完成! 总计: {total}"
        }
    }
};

// === КОНСТАНТЫ ===
const FLAGS = { ru: '🇷🇺', en: '🇬🇧', zh: '🇨🇳' };
const LANG_ORDER = ['ru', 'en', 'zh'];

// === ТЕКУЩИЙ ЯЗЫК ===
let currentLanguage;
try {
    currentLanguage = localStorage.getItem('cosmicLang') || 'ru';
    if (!translations[currentLanguage]) currentLanguage = 'ru';
} catch (e) {
    currentLanguage = 'ru';
}

window.currentLanguage = currentLanguage;
window.translations = translations;

// === ПОЛУЧЕНИЕ ПЕРЕВОДА ===
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

// === ФОРМАТИРОВАНИЕ СТРОК ===
window.formatString = function(template, vars) {
    if (!template || typeof template !== 'string') return '';
    return template.replace(/\{(\w+)\}/g, function(match, key) {
        return vars && vars[key] !== undefined ? vars[key] : match;
    });
};

// === ПРИМЕНЕНИЕ ПЕРЕВОДА К DOM ===
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
        if (textNode) {
            textNode.textContent = ' ' + finalText;
        } else {
            el.appendChild(document.createTextNode(' ' + finalText));
        }
    } else {
        el.textContent = finalText;
    }
};

// === ПЕРЕКЛЮЧЕНИЕ ЯЗЫКА ===
window.switchLanguage = function() {
    const idx = LANG_ORDER.indexOf(currentLanguage);
    currentLanguage = LANG_ORDER[(idx + 1) % LANG_ORDER.length];
    window.currentLanguage = currentLanguage;
    
    try {
        localStorage.setItem('cosmicLang', currentLanguage);
    } catch (e) {}
    
    window.updateLanguageFlag();
    window.updateAllUITexts();
    
    console.log('🌍 Язык переключён:', currentLanguage);
};

// === ФЛАГ ЯЗЫКА ===
window.updateLanguageFlag = function() {
    const btn = document.getElementById('langBtn-welcome');
    if (btn) btn.textContent = FLAGS[currentLanguage] || '🌍';
};

// === КНОПКА ПРОДОЛЖИТЬ ===
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

// === ОБНОВЛЕНИЕ ВСЕХ ТЕКСТОВ ===
window.updateAllUITexts = function() {
    if (window.gameState && window.gameState.currentLocation) {
        const titleEl = document.getElementById('gameTitle');
        if (titleEl) window.applyTranslation(titleEl, 'gameTitle.' + window.gameState.currentLocation);
    }
    
    if (window.GAME_UI && window.GAME_UI.updateProgressBar) {
        window.GAME_UI.updateProgressBar();
    }
    
    window.updateContinueButton();
    
    if (window.achievementsSystem && window.achievementsSystem.updateAchievementsDisplay) {
        window.achievementsSystem.updateAchievementsDisplay();
    }
    
    if (window.shopSystem && window.shopSystem.updateShopDisplay) {
        window.shopSystem.updateShopDisplay();
    }
};

console.log('🌍 Translations initialized. Language:', currentLanguage);
})();