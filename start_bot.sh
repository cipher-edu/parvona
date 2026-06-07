#!/bin/bash
# Bot tokenini .env.prod da yangilagandan keyin ishga tushirish
cd /var/www/html/parvona
docker compose -f docker-compose.server.yml -f docker-compose.bot.yml up -d --build telegram_bot
echo "Bot ishga tushirildi"
docker compose -f docker-compose.server.yml -f docker-compose.bot.yml logs telegram_bot --tail=20
