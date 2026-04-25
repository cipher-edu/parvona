# ─── Parvona Backend Makefile ─────────────────────────────────────────────────

.PHONY: install migrate seed run worker beat shell test lint

# O'rnatish
install:
	pip install -r requirements/development.txt

# Migratsiyalar
migrate:
	python manage.py makemigrations
	python manage.py migrate

# Test ma'lumotlar
seed:
	python manage.py seed_data

# Server
run:
	python manage.py runserver 0.0.0.0:8000

# Celery worker
worker:
	celery -A config worker -l info -c 4

# Celery beat
beat:
	celery -A config beat -l info

# Django shell
shell:
	python manage.py shell_plus

# Testlar
test:
	pytest --cov=apps --cov-report=term-missing -v

# Superuser yaratish
superuser:
	python manage.py createsuperuser

# Docker
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f api
