// src/telegram.js
const { Player } = require('./database');
const { TELEGRAM_BOT_TOKEN } = require('../config');

// Функция для отправки сообщения пользователю через Telegram Bot API
async function sendTelegramMessage(userId, message) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN не установлен. Сообщение не отправлено.');
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: userId,
        text: message,
        parse_mode: 'HTML'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Ошибка отправки сообщения пользователю ${userId}:`, errorData);
    } else {
      console.log(`✅ Сообщение отправлено пользователю ${userId}`);
    }
  } catch (error) {
    console.error(`❌ Ошибка сети при отправке сообщения:`, error);
  }
}

// Функция для отправки уведомления о достижении нового уровня
async function notifyNewLocation(userId, location) {
  const locationNames = {
    'mercury': '☿ Меркурий',
    'venus': '♀ Венера',
    'earth': '♁ Земля',
    'mars': '♂ Марс',
    'jupiter': '♃ Юпитер',
    'saturn': '♄ Сатурн',
    'uranus': '♅ Уран',
    'neptune': '♆ Нептун',
    'pluto': '♇ Плутон'
  };

  const message = `🎉 Поздравляем! Вы достигли новой планеты: ${locationNames[location] || location}! Продолжайте исследовать космос! 🌌`;
  await sendTelegramMessage(userId, message);
}

// Функция для отправки уведомления о входе в топ-10 таблицы лидеров
async function notifyTopLeader(userId, rank, statValue, statName) {
  const statNames = {
    'totalDamage': 'урона',
    'coins': 'кристаллов',
    'blocksDestroyed': 'разрушенных блоков'
  };

  const message = `🏆 Отличная работа! Вы вошли в топ-10 по ${statNames[statName] || statName} и занимаете ${rank}-е место с результатом ${statValue}! Продолжайте в том же духе!`;
  await sendTelegramMessage(userId, message);
}

module.exports = {
  notifyNewLocation,
  notifyTopLeader
};