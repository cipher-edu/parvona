#!/bin/bash
# parvona-static-sync.sh - collectstatic qilib, fayllarni /var/www/parvona-static/ ga ko'chiradi
set -e
cd /var/www/parvona
docker exec parvona-api-1 python manage.py collectstatic --noinput
sudo cp -r /var/lib/docker/volumes/parvona_static_files/_data/. /var/www/parvona-static/
sudo chmod -R 755 /var/www/parvona-static/
echo "Static fayllar yangilandi"