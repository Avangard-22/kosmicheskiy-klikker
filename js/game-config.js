// game-config.js
window.GAME_CONFIG = {
    astronomicalUnits: {
        mercury: 0.38710, venus: 0.72333, earth: 1.00000, mars: 1.52366,
        jupiter: 5.20336, saturn: 9.53707, uranus: 19.19126, neptune: 30.06896, pluto: 39.48200
    },
    AU_TO_DAMAGE: 149597870.691,
    planetOrder: ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'],
    locations: {
        mercury: { name: "☿ Меркурий", color: "#bb86fc", coinColor: "#a0d2ff", borderColor: "#4a55e0", blockColors: ['#2962ff', '#4fc3f7', '#bb86fc', '#f8bbd0'] },
        venus: { name: "♀ Венера", color: "#ffab91", coinColor: "#a0d2ff", borderColor: "#ff5722", blockColors: ['#ff5722', '#ff9800', '#ff5722', '#e91e63'] },
        earth: { name: "♁ Земля", color: "#80deea", coinColor: "#a0d2ff", borderColor: "#0288d1", blockColors: ['#0288d1', '#29b6f6', '#00bcd4', '#00e5ff'] },
        mars: { name: "♂ Марс", color: "#a5d6a7", coinColor: "#a0d2ff", borderColor: "#388e3c", blockColors: ['#388e3c', '#66bb6a', '#9ccc65', '#d4e157'] },
        jupiter: { name: "♃ Юпитер", color: "#ce93d8", coinColor: "#a0d2ff", borderColor: "#7b1fa2", blockColors: ['#7b1fa2', '#9c27b0', '#ab47bc', '#e1bee7'] },
        saturn: { name: "♄ Сатурн", color: "#ce93d8", coinColor: "#a0d2ff", borderColor: "#7b1fa2", blockColors: ['#7b1fa2', '#9c27b0', '#ab47bc', '#e1bee7'] },
        uranus: { name: "♅ Уран", color: "#ce93d8", coinColor: "#a0d2ff", borderColor: "#7b1fa2", blockColors: ['#7b1fa2', '#9c27b0', '#ab47bc', '#e1bee7'] },
        neptune: { name: "♆ Нептун", color: "#ce93d8", coinColor: "#a0d2ff", borderColor: "#7b1fa2", blockColors: ['#7b1fa2', '#9c27b0', '#ab47bc', '#e1bee7'] },
        pluto: { name: "♇ Плутон", color: "#ce93d8", coinColor: "#a0d2ff", borderColor: "#7b1fa2", blockColors: ['#7b1fa2', '#9c27b0', '#ab47bc', '#e1bee7'] }
    },
    rareBlocks: {
        GOLD: { name: "Золотой", chance: 0.03, multiplier: 8, healthMultiplier: 1.8, className: "block-gold" },
        RAINBOW: { name: "Радужный", chance: 0.02, multiplier: 5, healthMultiplier: 1.5, className: "block-rainbow" },
        CRYSTAL: { name: "Кристальный", chance: 0.025, multiplier: 6, healthMultiplier: 1.6, className: "block-crystal" },
        MYSTERY: { name: "Загадочный", chance: 0.015, multiplier: 10, healthMultiplier: 2.0, className: "block-mystery" }
    },
    balanceConfig: {
        baseHealth: 80, targetClicks: 70, healthRandomRange: { min: 0.8, max: 1.3 },
        damageProgression: { baseMultiplier: 1.15, diminishingReturns: 0.96, maxLevelEffect: 60 },
        rewardMultiplier: 2.5, comboMultiplier: 0.25, randomBonusRange: { min: 0.8, max: 1.5 },
        penaltyMin: 0.05, penaltyMax: 0.45
    },
    costs: {
        baseClickUpgradeCost: 80,
        baseHelperUpgradeCost: 1500,
        baseCritChanceCost: 500,
        baseCritMultiplierCost: 800,
        baseHelperDmgCost: 1000
    }
};