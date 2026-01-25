// config.js
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  NODE_ENV: process.env.NODE_ENV || 'development'
};