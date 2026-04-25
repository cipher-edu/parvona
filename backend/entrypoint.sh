#!/bin/sh
set -e

# Celery worker/beat da migratsiya va seed kerak emas
if [ "${SKIP_SETUP}" = "true" ]; then
  exec "$@"
fi

echo "⏳ PostgreSQL kutilmoqda..."
until python -c "
import psycopg
import os
conn = psycopg.connect(
    dbname=os.environ['DB_NAME'],
    user=os.environ['DB_USER'],
    password=os.environ['DB_PASSWORD'],
    host=os.environ.get('DB_HOST','db'),
    port=os.environ.get('DB_PORT','5432'),
)
conn.close()
" 2>/dev/null; do
  sleep 1
done
echo "✓ PostgreSQL tayyor"

echo "⏳ Migratsiyalar bajarilmoqda..."
python manage.py migrate --noinput
echo "✓ Migratsiyalar bajarildi"

echo "⏳ Demo ma'lumotlar tekshirilmoqda..."
python manage.py seed_data
echo "✓ Demo ma'lumotlar tayyor"

echo "✓ Server ishga tushmoqda..."
exec "$@"
