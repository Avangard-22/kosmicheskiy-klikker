// js/perk-system.js (v2.0) — постоянные бонусы за планеты
(function() {
'use strict';

// Пул перков — по одному на каждую планету, начиная с Венеры (idx=1)
const PERK_POOL = [
    { id: 'crystal_interval',
      name: '+300% к кристаллам на 20 мин каждые 3 ч',
      desc: 'Каждые 3 часа на 20 минут награда за блоки увеличивается в 4 раза' },
    { id: 'bobo_crystal_call',
      name: 'Каждый 4-й вызов Bobo: +21–69% кристаллов',
      desc: 'Каждый 4-й вызов Bobo дополнительно приносит от 21% до 69% от стоимости текущего блока' },
    { id: 'bobo_hit_reward',
      name: 'Каждый 3-й удар Bobo: +кристаллы',
      desc: 'Каждый 3-й удар Bobo по блоку дополнительно приносит количество кристаллов, равное нанесённому урону' },
    { id: 'click_damage_pct',
      name: '+25% к силе и шансу крита',
      desc: 'Сила удара и шанс критической атаки увеличены на 25% навсегда' },
    { id: 'block_hp_discount',
      name: 'Здоровье блоков −15%',
      desc: 'Все блоки имеют на 15% меньше здоровья' },
    { id: 'reward_mult',
      name: '+50% ко всем наградам',
      desc: 'Постоянный множитель +50% к кристаллам за блоки' },
    { id: 'helper_speed',
      name: 'Bobo атакует на 30% быстрее',
      desc: 'Интервал атак Bobo сокращён с 1.5с до 1.05с' },
    { id: 'start_bonus',
      name: '+50 к силе на старте планеты',
      desc: 'При переходе на новую планету начинаете с +50 к силе удара (до первого убийства блока)' }
];

window.PerkSystem = {
    /**
     * Вернуть данные перка для планеты (детерминированно по индексу)
     */
    getPerkForPlanet: function(planetIdx) {
        if (planetIdx < 1 || planetIdx > PERK_POOL.length) return null;
        return PERK_POOL[planetIdx - 1];
    },

    /**
     * Активировать перк (запись в gameState.permanentBonuses)
     */
    activatePerk: function(planetIdx) {
        if (!window.gameState || planetIdx < 1) return false;

        const perk = this.getPerkForPlanet(planetIdx);
        if (!perk) return false;

        if (!window.gameState.permanentBonuses) {
            window.gameState.permanentBonuses = {};
        }

        if (window.gameState.permanentBonuses[perk.id]) return false;

        window.gameState.permanentBonuses[perk.id] = true;
        console.log('🌟 [PERK] Активирован:', perk.name);

        this.applyAllPerks();
        return true;
    },

    /**
     * Применить все активные перки к текущему состоянию (вызывается после загрузки/перехода)
     */
    applyAllPerks: function() {
        if (!window.gameState?.permanentBonuses) return;

        const pb = window.gameState.permanentBonuses;

        if (window.GAME_CORE) {
            window.GAME_CORE.permanentClickMult      = pb.click_damage_pct    ? 1.25 : 1;
            window.GAME_CORE.permanentBlockHpMult    = pb.block_hp_discount   ? 0.85 : 1;
            window.GAME_CORE.permanentRewardMult     = pb.reward_mult         ? 1.5  : 1;
            window.GAME_CORE.permanentHelperInterval = pb.helper_speed        ? 1050 : 1500;
            window.GAME_CORE.permanentStartBonus     = pb.start_bonus         ? 50   : 0;
            window.GAME_CORE._intervalMultActive     = !!pb.crystal_interval;

            if (window.GAME_CORE.calculateClickPower) {
                window.gameState.clickPower = window.GAME_CORE.calculateClickPower();
            }
        }

        if (window.GAME_UI) {
            window.GAME_UI.updateHUD();
            window.GAME_UI.updateUpgradeButtons();
        }
    },

    /**
     * Хук: вызывается при активации Bobo (каждый 4-й вызов)
     */
    onBoboCall: function() {
        if (!window.gameState?.permanentBonuses?.bobo_crystal_call) return;

        if (!window.gameState._boboCallCounter) window.gameState._boboCallCounter = 0;
        window.gameState._boboCallCounter++;

        if (window.gameState._boboCallCounter % 4 === 0) {
            const bonus = 0.21 + Math.random() * 0.48;
            const blockHP = window.GAME_CORE?.currentBlockHealth || 100;
            const additional = Math.floor(blockHP * bonus);
            window.gameState.coins += additional;

            if (window.GAME_UI) window.GAME_UI.updateHUD();
            if (window.showTooltip) {
                window.showTooltip(`🤖 Bobo: +${additional.toLocaleString()} 💎`);
                setTimeout(window.hideTooltip, 1800);
            }
        }
    },

    /**
     * Хук: вызывается при каждом ударе Bobo (каждый 3-й удар)
     */
    onBoboHit: function() {
        if (!window.gameState?.permanentBonuses?.bobo_hit_reward) return;

        if (!window.gameState._boboHitCounter) window.gameState._boboHitCounter = 0;
        window.gameState._boboHitCounter++;

        if (window.gameState._boboHitCounter % 3 === 0) {
            const blockHP = window.GAME_CORE?.currentBlockHealth || 0;
            if (blockHP <= 0) return;

            const reward = Math.floor(blockHP);
            window.gameState.coins += reward;

            if (window.GAME_UI) window.GAME_UI.updateHUD();
            if (window.showTooltip) {
                window.showTooltip(`🤖 Бонус Bobo: +${reward.toLocaleString()} 💎`);
                setTimeout(window.hideTooltip, 1800);
            }
        }
    },

    /**
     * Проверка интервального бонуса (каждые 3 часа на 20 минут)
     */
    checkCrystalInterval: function() {
        if (!window.gameState?.permanentBonuses?.crystal_interval) return;

        const now = Date.now();

        if (!window.gameState._crystalIntervalStart) {
            window.gameState._crystalIntervalStart = now;
            window.gameState._crystalIntervalActive = false;
        }

        const elapsed = now - window.gameState._crystalIntervalStart;
        const cycle = 3 * 60 * 60 * 1000;        // 3 часа
        const activeWindow = 20 * 60 * 1000;      // 20 минут

        const phase = elapsed % cycle;
        const wasActive = window.gameState._crystalIntervalActive;
        window.gameState._crystalIntervalActive = phase < activeWindow;

        if (window.GAME_CORE) {
            window.GAME_CORE._intervalMultActive = window.gameState._crystalIntervalActive;
        }

        // Уведомление при старте окна
        if (window.gameState._crystalIntervalActive && !wasActive) {
            if (window.showTooltip) {
                window.showTooltip('⚡ +300% к наградам на 20 минут!');
                setTimeout(window.hideTooltip, 3000);
            }
        }
    }
};

// Авто-запуск
function init() {
    if (window.gameState) window.PerkSystem.applyAllPerks();
    // ✅ ИСПРАВЛЕНО: проверка по событиям, а не setInterval (троттлинг в фоне)
    // setInterval убран — проверка теперь вызывается из CombatSystem.applyHit и GAME_CORE.startGame
    console.log('🌟 PerkSystem v2.0 initialized');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
})();