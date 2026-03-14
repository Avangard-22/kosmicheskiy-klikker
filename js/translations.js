// Глобальные переменные переводов
(function() {
    'use strict';
    
    window.translations = {
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
            hud: {
                coins: "Кристаллы:",
                clickPower: "Сила:",
                critChance: "Крит:",
                critMultiplier: "Множ:"
            },
            progressText: "Прогресс: {current} / {target} а.е. ({percent}%)",
            buttons: {
                save: "Сохранить игру",
                continue: "Продолжить",
                noSave: "Нет сохранения",
                start: "Новая игра",
                loadSave: "Продолжить сохраненную игру",
                newGame: "Начать новую игру",
                cancel: "Отмена",
                restart: "Новая добыча",
                share: "Поделиться",
                lang: "Сменить язык",
                dailyBonus: "🎁 Ежедневный бонус"
            },
            welcome: {
                title: "🚀 КОСМИЧЕСКИЙ КЛИКЕР",
                text1: "Разрушайте восходящие блоки и собирайте космические Кристаллы!",
                text2: "Каждый блок требует определённого количества ударов для разрушения.",
                text3: "Реалистичная система прогресса:",
                text4: "🌌 Астрономические единицы — перемещайтесь по Солнечной системе",
                text5: "🪐 9 реальных планет — от Меркурия до Плутона",
                text6: "🚀 Улучшения — увеличивайте силу, криты и активируйте помощника",
                text7: "✨ Редкие блоки — дают бонусы и огромные награды!",
                text8: "🎁 Ежедневные бонусы — заходите каждый день!"
            },
            saveScreen: {
                title: "СОХРАНЕНИЕ ИГРЫ",
                text: "Хотите продолжить с сохраненной игры или начать новую?"
            },
            gameOver: {
                title: "ДОБЫЧА ПРЕРВАНА!",
                score: "Всего урона: {damage}"
            },
            tooltips: {
                saveSuccess: "Игра сохранена!",
                upgradeClick: "Сила удара. Нелинейный рост урона",
                upgradeHelper: "Bobo. Авто-атака на 1 минуту. +30% урона, +20% к кристаллам",
                upgradeCritChance: "Шанс крита. +0.1% шанс крит. урона",
                upgradeCritMult: "Множитель крита. +0.2x крит. урона",
                upgradeHelperDmg: "Урон Bobo. +20% урона за апгрейд",
                combo: "Комбо x{count}! +{bonus}",
                reward: "+{reward} 💎",
                helperAvailable: "Bobo активирован на 1 минуту! Бонус к кристаллам: +20%",
                helperEnd: "Bobo закончил работу!",
                critChanceUpgrade: "Шанс крита +0.1%! Теперь: {chance}%",
                critMultUpgrade: "Множитель крита +0.2x! Теперь: x{mult}",
                helperDmgUpgrade: "Урон Bobo +20%! Уровень: {level}",
                clickPowerUpgrade: "Сила увеличена! Теперь: {power}",
                noSave: "Нет сохраненной игры!",
                shareSuccess: "+50 Кристаллов за распространение!",
                dailyBonusAvailable: "🎁 Ежедневный бонус доступен!",
                dailyBonusClaimed: "✅ Бонус уже получен сегодня!",
                dailyBonusCompleted: "🎉 Цикл бонусов завершён!"
            },
            rareBlocks: {
                gold: "Золотой",
                rainbow: "Радужный",
                crystal: "Кристальный",
                mystery: "Загадочный"
            },
            locationProgress: {
                unlocked: "Открыта локация: {location}!"
            },
            shop: {
                title: "🛒 Магазин",
                timeWarp: "Искажение времени (30сек)",
                crystalBoost: "Усилитель кристаллов (1мин)",
                powerSurge: "Скачок силы (45сек)",
                active: "АКТИВНО",
                buy: "Купить"
            },
            achievements: {
                title: "🏆 Достижения",
                novice: "Новичок: Разрушь 10 блоков",
                rich: "Богач: Собери 1000 кристаллов",
                critMaster: "Мастер крита: 50 критических ударов",
                unlocked: "РАЗБЛОКИРОВАНО",
                progress: "Прогресс"
            },
            dailyBonus: {
                title: "🎁 Ежедневный Бонус",
                streak: "Текущая серия: {streak} дней",
                totalClaimed: "Всего получено: {claimed}/30",
                claim: "🎁 Получить награду",
                claimed: "✅ Уже получено",
                completed: "🎉 Цикл завершён!",
                day: "День {day}",
                notification: "ЕЖЕДНЕВНЫЙ БОНУС!",
                reward: "Награда: {reward}"
            },
            penalty: {
                title: "⚠️ ШТРАФ!",
                description: "{upgrade} -{percent}%",
                lostLevels: "Потеряно уровней: {lost}"
            }
        },
        en: {
            gameTitle: {
                mercury: "☿ Mercury",
                venus: "♀ Venus",
                earth: "♁ Earth",
                mars: "♂ Mars",
                jupiter: "♃ Jupiter",
                saturn: "♄ Saturn",
                uranus: "♅ Uranus",
                neptune: "♆ Neptune",
                pluto: "♇ Pluto"
            },
            hud: {
                coins: "Crystals:",
                clickPower: "Power:",
                critChance: "Crit:",
                critMultiplier: "Mult:"
            },
            progressText: "Progress: {current} / {target} a.u. ({percent}%)",
            buttons: {
                save: "Save game",
                continue: "Continue",
                noSave: "No save",
                start: "New game",
                loadSave: "Continue saved game",
                newGame: "Start new game",
                cancel: "Cancel",
                restart: "New game",
                share: "Share",
                lang: "Change language",
                dailyBonus: "🎁 Daily Bonus"
            },
            welcome: {
                title: "🚀 SPACE CLICKER",
                text1: "Destroy rising blocks and collect cosmic Crystals!",
                text2: "Each block requires a specific number of hits to destroy.",
                text3: "Realistic progress system:",
                text4: "🌌 Astronomical units - travel through the Solar System",
                text5: "🪐 9 real planets - from Mercury to Pluto",
                text6: "🚀 Upgrades - increase power, crits and activate assistant",
                text7: "✨ Rare blocks - provide bonuses and huge rewards!",
                text8: "🎁 Daily bonuses - log in every day!"
            },
            saveScreen: {
                title: "GAME SAVE",
                text: "Do you want to continue with the saved game or start a new one?"
            },
            gameOver: {
                title: "MINING INTERRUPTED!",
                score: "Total damage: {damage}"
            },
            tooltips: {
                saveSuccess: "Game saved!",
                upgradeClick: "Click power. Non-linear damage growth",
                upgradeHelper: "Bobo. Auto-attack for 1 minute. +30% damage, +20% to crystals",
                upgradeCritChance: "Crit chance. +0.1% crit hit chance",
                upgradeCritMult: "Crit multiplier. +0.2x crit damage",
                upgradeHelperDmg: "Bobo damage. +20% damage per upgrade",
                combo: "Combo x{count}! +{bonus}",
                reward: "+{reward} 💎",
                helperAvailable: "Bobo activated for 1 minute! Crystals bonus: +20%",
                helperEnd: "Bobo has finished working!",
                critChanceUpgrade: "Crit chance +0.1%! Now: {chance}%",
                critMultUpgrade: "Crit multiplier +0.2x! Now: x{mult}",
                helperDmgUpgrade: "Bobo damage +20%! Level: {level}",
                clickPowerUpgrade: "Power increased! Now: {power}",
                noSave: "No saved game!",
                shareSuccess: "+50 Crystals for sharing!",
                dailyBonusAvailable: "🎁 Daily bonus available!",
                dailyBonusClaimed: "✅ Bonus already claimed today!",
                dailyBonusCompleted: "🎉 Bonus cycle completed!"
            },
            rareBlocks: {
                gold: "Gold",
                rainbow: "Rainbow",
                crystal: "Crystal",
                mystery: "Mystery"
            },
            locationProgress: {
                unlocked: "Unlocked location: {location}!"
            },
            shop: {
                title: "🛒 Shop",
                timeWarp: "Time Warp (30sec)",
                crystalBoost: "Crystal Boost (1min)",
                powerSurge: "Power Surge (45sec)",
                active: "ACTIVE",
                buy: "Buy"
            },
            achievements: {
                title: "🏆 Achievements",
                novice: "Novice: Destroy 10 blocks",
                rich: "Rich: Collect 1000 crystals",
                critMaster: "Crit Master: 50 critical hits",
                unlocked: "UNLOCKED",
                progress: "Progress"
            },
            dailyBonus: {
                title: "🎁 Daily Bonus",
                streak: "Current streak: {streak} days",
                totalClaimed: "Total claimed: {claimed}/30",
                claim: "🎁 Claim Reward",
                claimed: "✅ Already Claimed",
                completed: "🎉 Cycle Completed!",
                day: "Day {day}",
                notification: "DAILY BONUS!",
                reward: "Reward: {reward}"
            },
            penalty: {
                title: "⚠️ PENALTY!",
                description: "{upgrade} -{percent}%",
                lostLevels: "Levels lost: {lost}"
            }
        },
        zh: {
            gameTitle: {
                mercury: "☿ 水星",
                venus: "♀ 金星",
                earth: "♁ 地球",
                mars: "♂ 火星",
                jupiter: "♃ 木星",
                saturn: "♄ 土星",
                uranus: "♅ 天王星",
                neptune: "♆ 海王星",
                pluto: "♇ 冥王星"
            },
            hud: {
                coins: "水晶:",
                clickPower: "力量:",
                critChance: "暴击:",
                critMultiplier: "倍数:"
            },
            progressText: "进度：{current} / {target} 天文单位 ({percent}%)",
            buttons: {
                save: "保存游戏",
                continue: "继续",
                noSave: "没有保存",
                start: "新游戏",
                loadSave: "继续保存的游戏",
                newGame: "开始新游戏",
                cancel: "取消",
                restart: "新游戏",
                share: "分享",
                lang: "更改语言",
                dailyBonus: "🎁 每日奖励"
            },
            welcome: {
                title: "🚀 太空点击器",
                text1: "摧毁上升的方块并收集宇宙水晶!",
                text2: "每个方块需要特定次数的点击才能摧毁。",
                text3: "真实的进度系统:",
                text4: "🌌 天文单位 - 在太阳系中旅行",
                text5: "🪐 9 颗真实行星 - 从水星到冥王星",
                text6: "🚀 升级 - 增加力量，暴击和激活助手",
                text7: "✨ 稀有方块 - 提供奖励和巨大奖励!",
                text8: "🎁 每日奖励 - 每天登录!"
            },
            saveScreen: {
                title: "游戏保存",
                text: "您想继续保存的游戏还是开始新游戏？"
            },
            gameOver: {
                title: "开采中断!",
                score: "总伤害：{damage}"
            },
            tooltips: {
                saveSuccess: "游戏已保存!",
                upgradeClick: "点击力量。非线性伤害增长",
                upgradeHelper: "Bobo. 自动攻击 1 分钟。+30% 伤害，+20% 水晶",
                upgradeCritChance: "暴击几率。+0.1% 暴击命中几率",
                upgradeCritMult: "暴击倍数。+0.2x 暴击伤害",
                upgradeHelperDmg: "Bobo 伤害。+20% 每次升级伤害",
                combo: "连击 x{count}! +{bonus}",
                reward: "+{reward} 💎",
                helperAvailable: "Bobo 已激活 1 分钟！水晶奖励：+20%",
                helperEnd: "Bobo 已完成工作!",
                critChanceUpgrade: "暴击几率 +0.1%! 现在：{chance}%",
                critMultUpgrade: "暴击倍数 +0.2x! 现在：x{mult}",
                helperDmgUpgrade: "Bobo 伤害 +20%! 等级：{level}",
                clickPowerUpgrade: "力量增加！现在：{power}",
                noSave: "没有保存的游戏!",
                shareSuccess: "分享获得 +50 水晶!",
                dailyBonusAvailable: "🎁 每日奖励可用!",
                dailyBonusClaimed: "✅ 今日已领取!",
                dailyBonusCompleted: "🎉 奖励周期完成!"
            },
            rareBlocks: {
                gold: "金色",
                rainbow: "彩虹",
                crystal: "水晶",
                mystery: "神秘"
            },
            locationProgress: {
                unlocked: "解锁位置：{location}!"
            },
            shop: {
                title: "🛒 商店",
                timeWarp: "时间扭曲 (30 秒)",
                crystalBoost: "水晶增强 (1 分钟)",
                powerSurge: "力量激增 (45 秒)",
                active: "激活",
                buy: "购买"
            },
            achievements: {
                title: "🏆 成就",
                novice: "新手：摧毁 10 个方块",
                rich: "富人：收集 1000 个水晶",
                critMaster: "暴击大师：50 次暴击",
                unlocked: "已解锁",
                progress: "进度"
            },
            dailyBonus: {
                title: "🎁 每日奖励",
                streak: "当前连续：{streak} 天",
                totalClaimed: "总计领取：{claimed}/30",
                claim: "🎁 领取奖励",
                claimed: "✅ 已领取",
                completed: "🎉 周期完成!",
                day: "第 {day} 天",
                notification: "每日奖励!",
                reward: "奖励：{reward}"
            },
            penalty: {
                title: "⚠️ 惩罚!",
                description: "{upgrade} -{percent}%",
                lostLevels: "失去等级：{lost}"
            }
        }
    };
    
    // ✅ Текущий язык
    window.currentLanguage = localStorage.getItem('gameLanguage') || 'ru';
    
    // ✅ Функция для форматирования строк с параметрами
    window.formatString = function(template, params) {
        if (!template || typeof template !== 'string') {
            return '';
        }
        return template.replace(/{(\w+)}/g, function(match, key) {
            return params && params.hasOwnProperty(key) ? params[key] : match;
        });
    };
    
    // ✅ Функция для применения перевода к элементу
    window.applyTranslation = function(element, keyPath, params) {
        if (!element) return;
        
        params = params || {};
        
        const keys = keyPath.split('.');
        let translation = window.translations[window.currentLanguage];
        
        for (let i = 0; i < keys.length; i++) {
            if (translation && translation[keys[i]] !== undefined) {
                translation = translation[keys[i]];
            } else {
                translation = undefined;
                break;
            }
        }
        
        if (translation === undefined) {
            console.warn('Translation not found for ' + keyPath + ' in ' + window.currentLanguage);
            return;
        }
        
        if (typeof translation === 'string') {
            element.innerHTML = window.formatString(translation, params);
        } else if (typeof translation === 'object' && params.value) {
            element.innerHTML = translation + params.value;
        } else {
            element.innerHTML = translation;
        }
    };
    
    // ✅ Функция обновления флага языка
    window.updateLanguageFlag = function() {
        const flagElement = document.getElementById('currentLangFlag');
        if (flagElement) {
            const flags = {
                ru: '🇷🇺',
                en: '🇬🇧',
                zh: '🇨🇳'
            };
            flagElement.textContent = flags[window.currentLanguage] || '🌐';
        }
    };
    
    // ✅ Функция переключения языка
    window.switchLanguage = function() {
        const languages = ['ru', 'en', 'zh'];
        const currentIndex = languages.indexOf(window.currentLanguage);
        const nextIndex = (currentIndex + 1) % languages.length;
        window.currentLanguage = languages[nextIndex];
        
        localStorage.setItem('gameLanguage', window.currentLanguage);
        window.updateLanguageFlag();
        
        // ✅ Обновляем все переводы в игре
        if (window.updateAllTranslations) {
            window.updateAllTranslations();
        }
        
        // ✅ Обновляем магазин и достижения если они существуют
        if (window.shopSystem && window.shopSystem.updateTranslations) {
            window.shopSystem.updateTranslations();
        }
        if (window.achievementsSystem && window.achievementsSystem.updateTranslations) {
            window.achievementsSystem.updateTranslations();
        }
        if (window.dailyBonusSystem && window.dailyBonusSystem.updateTranslations) {
            window.dailyBonusSystem.updateTranslations();
        }
        
        // ✅ Сохраняем игру после смены языка
        if (window.saveGame) {
            window.saveGame();
        }
    };
    
    // ✅ Публичный API для системы переводов
    window.i18n = {
        get: function(keyPath, params) {
            params = params || {};
            const keys = keyPath.split('.');
            let translation = window.translations[window.currentLanguage];
            
            for (let i = 0; i < keys.length; i++) {
                if (translation && translation[keys[i]] !== undefined) {
                    translation = translation[keys[i]];
                } else {
                    return keyPath;
                }
            }
            
            if (typeof translation === 'string') {
                return window.formatString(translation, params);
            }
            return translation;
        },
        
        setLanguage: function(lang) {
            const languages = ['ru', 'en', 'zh'];
            if (languages.indexOf(lang) !== -1) {
                window.currentLanguage = lang;
                localStorage.setItem('gameLanguage', lang);
                window.updateLanguageFlag();
                if (window.updateAllTranslations) {
                    window.updateAllTranslations();
                }
                return true;
            }
            return false;
        },
        
        getCurrentLanguage: function() {
            return window.currentLanguage;
        },
        
        getSupportedLanguages: function() {
            return ['ru', 'en', 'zh'];
        }
    };
    
    console.log('✅ Translation System loaded (3 languages)');
})();