#!/bin/bash
set -e
cd /var/www/html/parvona

echo "=== Parvona update ==="
git pull

# Frontend rebuild
export PATH=/home/rahim-ubuntu/.nvm/versions/node/v20.20.2/bin:$PATH
npm run build
chmod -R 755 dist/

# Backend restart
docker compose -f docker-compose.server.yml down
docker compose -f docker-compose.server.yml up -d --build

echo "=== Update tugadi ==="
