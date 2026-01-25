require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Разрешаем запросы с вашего сайта и из Telegram
app.use(cors({
  origin: [
    'https://avangard-22.github.io',
    'https://t.me',
    'https://web.telegram.org',
    'http://localhost:8080'
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));

// Для обработки JSON данных
app.use(express.json());

// Простое хранилище данных (в реальном проекте будет база данных)
let players = {};

// Проверка работоспособности сервера
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'Kosmicheskiy Klikker Server is running!' });
});

// Обновление статистики игрока
app.post('/api/update-stats', (req, res) => {
  try {
    const { userId, firstName, coins, totalDamage, currentLocation } = req.body;
    
    if (!userId || !firstName) {
      return res.status(400).json({ error: 'userId and firstName are required' });
    }
    
    players[userId] = {
      userId,
      firstName,
      coins: coins || 0,
      totalDamage: totalDamage || 0,
      currentLocation: currentLocation || 'mercury',
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`📈 Updated stats for ${firstName} (ID: ${userId})`);
    res.json({ success: true, message: 'Stats updated successfully' });
  } catch (error) {
    console.error('❌ Error updating stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение таблицы лидеров
app.get('/api/leaderboard', (req, res) => {
  try {
    // Преобразуем объект в массив и сортируем по урону
    const leaderboard = Object.values(players)
      .sort((a, b) => b.totalDamage - a.totalDamage)
      .slice(0, 10); // Берем топ-10
    
    console.log('🏆 Leaderboard requested');
    res.json(leaderboard);
  } catch (error) {
    console.error('❌ Error getting leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 API available at http://localhost:${PORT}/api`);
});