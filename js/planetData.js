// === ДАННЫЕ О ПЛАНЕТАХ ===
const planetData = {
    mercury: {
        name: "🌌 Меркурий",
        maxLevel: 50,
        baseHealth: 8,
        healthMultiplier: 1.15,
        blockSpeed: 30,
        color: "#bb86fc",
        coinColor: "#d7ccc8",
        borderColor: "#4a55e0",
        blockColors: ['#2962ff', '#4fc3f7', '#bb86fc', '#f8bbd0']
    },
    venus: {
        name: "🌋 Венера",
        maxLevel: 60,
        baseHealth: 10,
        healthMultiplier: 1.17,
        blockSpeed: 32,
        color: "#ffab91",
        coinColor: "#d7ccc8",
        borderColor: "#ff5722",
        blockColors: ['#ff5722', '#ff9800', '#ff5722', '#e91e63']
    },
    earth: {
        name: "❄️ Земля",
        maxLevel: 70,
        baseHealth: 12,
        healthMultiplier: 1.20,
        blockSpeed: 34,
        color: "#80deea",
        coinColor: "#d7ccc8",
        borderColor: "#0288d1",
        blockColors: ['#0288d1', '#29b6f6', '#00bcd4', '#00e5ff']
    },
    mars: {
        name: "🧪 Марс",
        maxLevel: 80,
        baseHealth: 15,
        healthMultiplier: 1.22,
        blockSpeed: 36,
        color: "#a5d6a7",
        coinColor: "#d7ccc8",
        borderColor: "#388e3c",
        blockColors: ['#388e3c', '#66bb6a', '#9ccc65', '#d4e157']
    },
    jupiter: {
        name: "🪐 Юпитер",
        maxLevel: 90,
        baseHealth: 18,
        healthMultiplier: 1.23,
        blockSpeed: 37,
        color: "#ce93d8",
        coinColor: "#d7ccc8",
        borderColor: "#7b1fa2",
        blockColors: ['#7b1fa2', '#9c27b0', '#ab47bc', '#e1bee7']
    },
    saturn: {
        name: "🪐 Сатурн",
        maxLevel: 95,
        baseHealth: 20,
        healthMultiplier: 1.24,
        blockSpeed: 38,
        color: "#ce93d8",
        coinColor: "#d7ccc8",
        borderColor: "#7b1fa2",
        blockColors: ['#7b1fa2', '#9c27b0', '#ab47bc', '#e1bee7']
    },
    uranus: {
        name: "🪐 Уран",
        maxLevel: 97,
        baseHealth: 22,
        healthMultiplier: 1.245,
        blockSpeed: 39,
        color: "#ce93d8",
        coinColor: "#d7ccc8",
        borderColor: "#7b1fa2",
        blockColors: ['#7b1fa2', '#9c27b0', '#ab47bc', '#e1bee7']
    },
    neptune: {
        name: "🪐 Нептун",
        maxLevel: 99,
        baseHealth: 25,
        healthMultiplier: 1.25,
        blockSpeed: 39.5,
        color: "#ce93d8",
        coinColor: "#d7ccc8",
        borderColor: "#7b1fa2",
        blockColors: ['#7b1fa2', '#9c27b0', '#ab47bc', '#e1bee7']
    },
    pluto: {
        name: "🪐 Плутон",
        maxLevel: 100, // <-- Максимум в Солнечной системе (пока что)
        baseHealth: 30,
        healthMultiplier: 1.25,
        blockSpeed: 40,
        color: "#ce93d8",
        coinColor: "#d7ccc8",
        borderColor: "#7b1fa2",
        blockColors: ['#7b1fa2', '#9c27b0', '#ab47bc', '#e1bee7']
    }
    // ... и так далее, для галактик: 'alpha-centauri', 'andromeda-core' ...
};
