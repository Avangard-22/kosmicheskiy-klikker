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
            noSave: "❌ Сохранение не найдено",
            helperAlreadyActive: "Bobo уже активен!"
        },
        locationProgress: {
            unlocked: "🪐 {location} разблокирована!"
        },
        ui: {
            continue: "Продолжить", newGame: "Новая игра", crystals: "Кристаллы",
            power: "Сила", crit: "Крит", critMult: "Множ.крита",
            save: "Сохранить", shop: "Магазин", achievements: "Достижения",
            dailyBonus: "Ежедневный бонус"
        },
        achievements: {
            mercury: { description: "Исследование Меркурия", levels: {} },
            venus: { description: "Исследование Венеры", levels: {} },
            earth: { description: "Защита Земли", levels: {} },
            mars: { description: "Колонизация Марса", levels: {} },
            jupiter: { description: "Покорение Юпитера", levels: {} },
            saturn: { description: "Исследование Сатурна", levels: {} },
            uranus: { description: "Исследование Урана", levels: {} },
            neptune: { description: "Покорение Нептуна", levels: {} },
            pluto: { description: "Покорение Плутона", levels: {} }
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
        locationProgress: { unlocked: "🪐 {location} unlocked!" },
        ui: {
            continue: "Continue", newGame: "New Game", crystals: "Crystals",
            power: "Power", crit: "Crit", critMult: "Crit Mult",
            save: "Save", shop: "Shop", achievements: "Achievements", dailyBonus: "Daily Bonus"
        },
        achievements: {
            mercury: { description: "Mercury Exploration", levels: {} },
            venus: { description: "Venus Exploration", levels: {} },
            earth: { description: "Earth Defense", levels: {} },
            mars: { description: "Mars Colonization", levels: {} },
            jupiter: { description: "Jupiter Conquest", levels: {} },
            saturn: { description: "Saturn Exploration", levels: {} },
            uranus: { description: "Uranus Exploration", levels: {} },
            neptune: { description: "Neptune Conquest", levels: {} },
            pluto: { description: "Pluto Conquest", levels: {} }
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
            achievement: "🏆 ACHIEVEMENT!", reward: "+{amount} 💎",
            stage: "Stage: {stage}", allLevelsComplete: "🏆 All levels complete! Total: {total}"
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
        locationProgress: { unlocked: "🪐 {location} 已解锁!" },
        ui: {
            continue: "继续", newGame: "新游戏", crystals: "水晶",
            power: "力量", crit: "暴击", critMult: "暴击倍率",
            save: "保存", shop: "商店", achievements: "成就", dailyBonus: "每日奖励"
        },
        achievements: {
            mercury: { description: "水星探索", levels: {} },
            venus: { description: "金星探索", levels: {} },
            earth: { description: "地球防御", levels: {} },
            mars: { description: "火星殖民", levels: {} },
            jupiter: { description: "木星征服", levels: {} },
            saturn: { description: "土星探索", levels: {} },
            uranus: { description: "天王星探索", levels: {} },
            neptune: { description: "海王星征服", levels: {} },
            pluto: { description: "冥王星征服", levels: {} }
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
            achievement: "🏆 成就!", reward: "+{amount} 💎",
            stage: "阶段: {stage}", allLevelsComplete: "🏆 所有关卡完成! 总计: {total}"
        }
    }
};

// ═══════════════════════════════════════════════════
// 🏭 АВТОГЕНЕРАТОР ПЕРЕВОДОВ ДЛЯ ВСЕХ ПЛАНЕТ
// ═══════════════════════════════════════════════════
(function autoGeneratePlanetTranslations() {
    const planets = {
        mercury: { ru: 'Меркурий', en: 'Mercury', zh: '水星', emoji: '☿' },
        venus:   { ru: 'Венера',   en: 'Venus',   zh: '金星', emoji: '♀' },
        earth:   { ru: 'Земля',    en: 'Earth',   zh: '地球', emoji: '♁' },
        mars:    { ru: 'Марс',     en: 'Mars',    zh: '火星', emoji: '♂' },
        jupiter: { ru: 'Юпитер',   en: 'Jupiter', zh: '木星', emoji: '♃' },
        saturn:  { ru: 'Сатурн',   en: 'Saturn',  zh: '土星', emoji: '♄' },
        uranus:  { ru: 'Уран',     en: 'Uranus',  zh: '天王星', emoji: '♅' },
        neptune: { ru: 'Нептун',   en: 'Neptune', zh: '海王星', emoji: '♆' },
        pluto:   { ru: 'Плутон',   en: 'Pluto',   zh: '冥王星', emoji: '♇' }
    };
    
    const metricTemplates = {
        blocks:      { ru: 'Уничтожено блоков',     en: 'Blocks Destroyed',     zh: '摧毁的方块' },
        crits:       { ru: 'Критических ударов',    en: 'Critical Hits',        zh: '暴击次数' },
        combo:       { ru: 'Максимальное комбо',    en: 'Maximum Combo',        zh: '最大连击' },
        rare:        { ru: 'Редких блоков',         en: 'Rare Blocks',          zh: '稀有方块' },
        damage:      { ru: 'Нанесено урона',        en: 'Damage Dealt',         zh: '造成的伤害' },
        crystals:    { ru: 'Заработано кристаллов', en: 'Crystals Earned',      zh: '获得的水晶' },
        bobo:        { ru: 'Активаций Bobo',        en: 'Bobo Activations',     zh: 'Bobo 激活次数' },
        boboDmg:     { ru: 'Урона нанесено Bobo',   en: 'Bobo Damage',          zh: 'Bobo 造成的伤害' },
        boboCrystals:{ ru: 'Кристаллов от Bobo',    en: 'Bobo Crystals',        zh: 'Bobo 水晶' },
        upgrades:    { ru: 'Улучшений куплено',     en: 'Upgrades Purchased',   zh: '购买的升级' },
        time:        { ru: 'Секунд на планете',     en: 'Seconds on Planet',    zh: '在星球上的秒数' },
        speed:       { ru: 'Рекорд скорости (мс)',  en: 'Speed Record (ms)',    zh: '速度记录(毫秒)' },
        critStreak:  { ru: 'Серия критов подряд',   en: 'Crit Streak',          zh: '连续暴击' }
    };
    
    const masterTemplates = {
        ru: '{emoji} {planet} покорён!',
        en: '{emoji} {planet} Conquered!',
        zh: '{emoji} {planet} 已征服!'
    };
    
    for (const [planetId, planetData] of Object.entries(planets)) {
        ['ru', 'en', 'zh'].forEach(lang => {
            if (!translations[lang].achievements[planetId].metrics) {
                translations[lang].achievements[planetId].metrics = {};
            }
        });
        
        for (const [metricId, metricTranslations] of Object.entries(metricTemplates)) {
            translations.ru.achievements[planetId].metrics[metricId] = metricTranslations.ru;
            translations.en.achievements[planetId].metrics[metricId] = metricTranslations.en;
            translations.zh.achievements[planetId].metrics[metricId] = metricTranslations.zh;
        }
        
        translations.ru.achievements[planetId].master = masterTemplates.ru
            .replace('{emoji}', planetData.emoji).replace('{planet}', planetData.ru);
        translations.en.achievements[planetId].master = masterTemplates.en
            .replace('{emoji}', planetData.emoji).replace('{planet}', planetData.en);
        translations.zh.achievements[planetId].master = masterTemplates.zh
            .replace('{emoji}', planetData.emoji).replace('{planet}', planetData.zh);
    }
    
    console.log(`🌍 [TRANSLATIONS] Auto-generated metrics for ${Object.keys(planets).length} planets`);
})();

// ═══════════════════════════════════════════════════
// 🎖️ ПЕРЕВОДЫ РАНГОВ
// ═══════════════════════════════════════════════════
translations.ru.ranks = {
    spark: '✨ Искра', constellation: '🌟 Созвездие', galaxy: '🌌 Галактика',
    nebula: '🌫️ Туманность', supernova: '💥 Сверхновая', blackHole: '🕳️ Чёрная дыра',
    quark: '⚛️ Кварк', legend: '👑 Легенда {N}'
};
translations.en.ranks = {
    spark: '✨ Spark', constellation: '🌟 Constellation', galaxy: '🌌 Galaxy',
    nebula: '🌫️ Nebula', supernova: '💥 Supernova', blackHole: '🕳️ Black Hole',
    quark: '⚛️ Quark', legend: '👑 Legend {N}'
};
translations.zh.ranks = {
    spark: '✨ 火花', constellation: '🌟 星座', galaxy: '🌌 星系',
    nebula: '🌫️ 星云', supernova: '💥 超新星', blackHole: '🕳️ 黑洞',
    quark: '⚛️ 夸克', legend: '👑 传奇 {N}'
};

// ═══════════════════════════════════════════════════
// 📉 ПЕРЕВОДЫ ОТКАТА (rollback card)
// ═══════════════════════════════════════════════════
translations.ru.rollback = {
    title: 'ОТКАТ НАЗАД!',
    reason: 'Пропущено слишком много блоков',
    lost: 'Потеряно',
    auUnit: 'а.е.',
    damageUnit: 'урона',
    rollbackCount: 'Откат {current} из {max}'
};
translations.en.rollback = {
    title: 'ROLLBACK!',
    reason: 'Too many blocks skipped',
    lost: 'Lost',
    auUnit: 'AU',
    damageUnit: 'damage',
    rollbackCount: 'Rollback {current} of {max}'
};
translations.zh.rollback = {
    title: '回滚!',
    reason: '跳过的方块太多',
    lost: '损失',
    auUnit: '天文单位',
    damageUnit: '伤害',
    rollbackCount: '回滚 {current} / {max}'
};

// ═══════════════════════════════════════════════════
// 🌠 ПЕРЕВОДЫ СЛУЧАЙНЫХ СОБЫТИЙ
// ═══════════════════════════════════════════════════
translations.ru.events = {
    asteroidCollected: '🪨 Астероид собран!',
    cometCaught: '🎯 Поймана!',
    cometEscaped: '💨 Ускользнула...',
    damageBoost: '⚡ Усиление урона',
    crystalRain: '💰 Кристальный дождь',
    boboActivated: '🤖 Bobo активен!',
    boboCrystalBoost: '💰 Bobo +{percent}%!'
};
translations.en.events = {
    asteroidCollected: '🪨 Asteroid collected!',
    cometCaught: '🎯 Caught!',
    cometEscaped: '💨 Escaped...',
    damageBoost: '⚡ Damage Boost',
    crystalRain: '💰 Crystal Rain',
    boboActivated: '🤖 Bobo active!',
    boboCrystalBoost: '💰 Bobo +{percent}%!'
};
translations.zh.events = {
    asteroidCollected: '🪨 小行星已收集!',
    cometCaught: '🎯 已捕获!',
    cometEscaped: '💨 逃走了...',
    damageBoost: '⚡ 伤害增强',
    crystalRain: '💰 水晶雨',
    boboActivated: '🤖 Bobo 激活!',
    boboCrystalBoost: '💰 Bobo +{percent}%!'
};

// ═══════════════════════════════════════════════════
// 🚀 ПЕРЕВОДЫ WELCOME SCREEN
// ═══════════════════════════════════════════════════
translations.ru.welcome = {
    title: '🚀 КОСМИЧЕСКИЙ КЛИКЕР',
    subtitle: 'Разрушайте восходящие блоки и собирайте космические Кристаллы!',
    description: 'Каждый блок требует определённого количества ударов для разрушения.',
    progressionTitle: 'Реалистичная система прогресса:',
    features: [
        '🌌 Астрономические единицы — перемещайтесь по Солнечной системе',
        '🪐 9 реальных планет — от Меркурия до Плутона',
        '🚀 Улучшения — увеличивайте силу, криты и активируйте помощника',
        '✨ Редкие блоки — дают бонусы и огромные награды!'
    ],
    continueBtn: 'Продолжить',
    newGameBtn: 'Новая игра'
};
translations.en.welcome = {
    title: '🚀 COSMIC CLICKER',
    subtitle: 'Destroy rising blocks and collect cosmic Crystals!',
    description: 'Each block requires a certain number of hits to destroy.',
    progressionTitle: 'Realistic progression system:',
    features: [
        '🌌 Astronomical Units — travel through the Solar System',
        '🪐 9 real planets — from Mercury to Pluto',
        '🚀 Upgrades — increase power, crits and activate helper',
        '✨ Rare blocks — give bonuses and huge rewards!'
    ],
    continueBtn: 'Continue',
    newGameBtn: 'New Game'
};
translations.zh.welcome = {
    title: '🚀 宇宙点击器',
    subtitle: '破坏上升的方块并收集宇宙水晶!',
    description: '每个方块需要一定数量的点击才能破坏。',
    progressionTitle: '真实的进度系统:',
    features: [
        '🌌 天文单位 - 穿越太阳系',
        '🪐 9个真实行星 - 从水星到冥王星',
        '🚀 升级 - 增加力量、暴击并激活助手',
        '✨ 稀有方块 - 提供奖励和巨大回报!'
    ],
    continueBtn: '继续',
    newGameBtn: '新游戏'
};

// ═══════════════════════════════════════════════════
// 🛒 ПЕРЕВОДЫ МАГАЗИНА (6 бустов)
// ═══════════════════════════════════════════════════
translations.ru.shop = {
    title: '🛒 Магазин бонусов',
    balance: '💎 Баланс:',
    items: {
        timeWarp: { name: '⏳ Искажение времени', desc: 'Блоки движутся на 50% медленнее' },
        crystalBoost: { name: '💰 Усилитель кристаллов', desc: '+100% к наградам за блоки' },
        powerSurge: { name: '⚡ Скачок силы', desc: '+200% к силе клика' },
        luckyCharm: { name: '🍀 Талисман удачи', desc: '+50% шанс редких блоков' },
        invincible: { name: '🛡️ Неуязвимость', desc: 'Защита от штрафов за пропуск блока' },
        autoClicker: { name: '🤖 Авто-кликер', desc: 'Автоматический клик каждые 0.5 сек' }
    },
    states: { active: 'Активно', confirm: '✅ Покупаем?' },
    notifications: {
        alreadyActive: '⚠️ Бонус уже активен!',
        notEnough: '❌ Недостаточно кристаллов!',
        activated: '✅ {name} активирован!',
        expired: '⏰ {name} завершился'
    }
};
translations.en.shop = {
    title: '🛒 Bonus Shop',
    balance: '💎 Balance:',
    items: {
        timeWarp: { name: '⏳ Time Warp', desc: 'Blocks move 50% slower' },
        crystalBoost: { name: '💰 Crystal Boost', desc: '+100% block rewards' },
        powerSurge: { name: '⚡ Power Surge', desc: '+200% click power' },
        luckyCharm: { name: '🍀 Lucky Charm', desc: '+50% rare block chance' },
        invincible: { name: '🛡️ Invincibility', desc: 'Protection from skip penalties' },
        autoClicker: { name: '🤖 Auto-Clicker', desc: 'Automatic click every 0.5 sec' }
    },
    states: { active: 'Active', confirm: '✅ Buy?' },
    notifications: {
        alreadyActive: '⚠️ Boost already active!',
        notEnough: '❌ Not enough crystals!',
        activated: '✅ {name} activated!',
        expired: '⏰ {name} expired'
    }
};
translations.zh.shop = {
    title: '🛒 增益商店',
    balance: '💎 余额:',
    items: {
        timeWarp: { name: '⏳ 时间扭曲', desc: '方块移动速度降低 50%' },
        crystalBoost: { name: '💰 水晶增益', desc: '方块奖励 +100%' },
        powerSurge: { name: '⚡ 力量激增', desc: '点击力量 +200%' },
        luckyCharm: { name: '🍀 幸运符', desc: '稀有方块几率 +50%' },
        invincible: { name: '🛡️ 无敌', desc: '免受跳过惩罚' },
        autoClicker: { name: '🤖 自动点击器', desc: '每 0.5 秒自动点击' }
    },
    states: { active: '激活中', confirm: '✅ 购买?' },
    notifications: {
        alreadyActive: '⚠️ 增益已激活!',
        notEnough: '❌ 水晶不足!',
        activated: '✅ {name} 已激活!',
        expired: '⏰ {name} 已结束'
    }
};

// ═══════════════════════════════════════════════════
// 🎮 ПЕРЕВОДЫ HUD (рабочее пространство)
// ═══════════════════════════════════════════════════
translations.ru.hud = {
    crystals: 'Кристаллы:', power: 'Сила:', crit: 'Крит:',
    critMult: 'Множ.крита:', progress: 'Прогресс:'
};
translations.en.hud = {
    crystals: 'Crystals:', power: 'Power:', crit: 'Crit:',
    critMult: 'Crit Mult:', progress: 'Progress:'
};
translations.zh.hud = {
    crystals: '水晶:', power: '力量:', crit: '暴击:',
    critMult: '暴击倍率:', progress: '进度:'
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

// === ПОЛУЧЕНИЕ ПЕРЕВОДА (с умным fallback) ===
function getNestedTranslation(obj, key) {
    const keys = key.split('.');
    let result = obj;
    for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
            result = result[k];
        } else {
            return null;
        }
    }
    return result;
}

window.getTranslation = function(key, lang) {
    lang = lang || currentLanguage;
    let result = getNestedTranslation(translations[lang], key);
    if (result === null || result === undefined || result === key) {
        result = getNestedTranslation(translations.ru, key);
    }
    return result !== null && result !== undefined ? result : key;
};

// === ФОРМАТИРОВАНИЕ СТРОК ===
window.formatString = function(template, vars) {
    if (!template || typeof template !== 'string') return '';
    return template.replace(/{(\w+)}/g, function(match, key) {
        return vars && vars[key] !== undefined ? vars[key] : match;
    });
};

// === ПРИМЕНЕНИЕ ПЕРЕВОДА К DOM ===
window.applyTranslation = function(el, key, vars) {
    if (!el) return;
    try {
        const text = window.getTranslation(key);
        if (!text || typeof text !== 'string') {
            return;
        }
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
    } catch (e) {
        console.error(`❌ [TRANSLATIONS] Error applying translation for ${key}:`, e);
    }
};

// === ПЕРЕКЛЮЧЕНИЕ ЯЗЫКА ===
window.switchLanguage = function() {
    const idx = LANG_ORDER.indexOf(currentLanguage);
    currentLanguage = LANG_ORDER[(idx + 1) % LANG_ORDER.length];
    window.currentLanguage = currentLanguage;
    try { localStorage.setItem('cosmicLang', currentLanguage); } catch (e) {}
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

// === ОБНОВЛЕНИЕ ВСЕХ ТЕКСТОВ (с универсальным обработчиком data-i18n) ===
window.updateAllUITexts = function() {
    // ✅ ИСПРАВЛЕНИЕ 1: Универсальный обработчик ВСЕХ элементов с data-i18n
    const i18nElements = document.querySelectorAll('[data-i18n]');
    i18nElements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const attrTarget = el.getAttribute('data-i18n-attr'); // Для атрибутов (title, placeholder)
        
        if (!key) return;
        
        // ✅ ИСПРАВЛЕНИЕ 2: Специальная обработка для массивов (welcome.features.0, .1, .2, .3)
        if (key.startsWith('welcome.features.')) {
            const idx = parseInt(key.split('.')[2]);
            if (!isNaN(idx) && translations[currentLanguage]?.welcome?.features?.[idx]) {
                el.textContent = translations[currentLanguage].welcome.features[idx];
            }
            return;
        }
        
        try {
            const translated = window.getTranslation(key);
            if (!translated || translated === key) return; // Нет перевода
            
            if (attrTarget) {
                // ✅ ИСПРАВЛЕНИЕ 3: Обновляем АТРИБУТ (title, placeholder, alt)
                el.setAttribute(attrTarget, translated);
            } else {
                // Обновляем ТЕКСТ элемента
                if (el.children.length > 0) {
                    // Если есть дочерние элементы — ищем текстовый узел
                    let textNode = null;
                    for (let i = el.childNodes.length - 1; i >= 0; i--) {
                        if (el.childNodes[i].nodeType === Node.TEXT_NODE && el.childNodes[i].textContent.trim()) {
                            textNode = el.childNodes[i];
                            break;
                        }
                    }
                    if (textNode) {
                        textNode.textContent = translated;
                    } else {
                        el.insertBefore(document.createTextNode(translated), el.firstChild);
                    }
                } else {
                    // Простой элемент без детей
                    el.textContent = translated;
                }
            }
        } catch (e) {
            // Игнорируем ошибки перевода
        }
    });
    
    // Специфичные обновления (уже существующие)
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

// ✅ ИСПРАВЛЕНИЕ 4: Первичный перевод при загрузке (особенно для Welcome Screen)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(window.updateAllUITexts, 100);
    });
} else {
    setTimeout(window.updateAllUITexts, 100);
}

console.log('🌍 Translations initialized. Language:', currentLanguage);
})();