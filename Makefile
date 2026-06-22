# Atajos para Docker. Si no tenés `make` (Windows), usá los `docker compose ...`
# equivalentes que están en cada receta y en el README.

.DEFAULT_GOAL := help
COMPOSE := docker compose

.PHONY: help up up-all down logs ps pipeline monitor mlflow jupyter rebuild clean

help: ## Muestra esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

up: ## Levanta backend + web (core)
	$(COMPOSE) up -d --build

up-all: ## Levanta todo (core + MLflow + Jupyter)
	$(COMPOSE) --profile tools --profile notebooks up -d --build

down: ## Detiene y elimina los contenedores
	$(COMPOSE) down

logs: ## Sigue los logs (Ctrl-C para salir)
	$(COMPOSE) logs -f

ps: ## Estado de los servicios
	$(COMPOSE) ps

pipeline: ## Corre el pipeline MLOps completo dentro del backend
	$(COMPOSE) exec backend python -m src.pipeline all

monitor: ## Genera un reporte de monitoreo
	$(COMPOSE) exec backend python -m src.pipeline monitor

mlflow: ## Levanta la UI de MLflow (http://localhost:5000)
	$(COMPOSE) --profile tools up -d --build mlflow

jupyter: ## Levanta Jupyter (http://localhost:8888)
	$(COMPOSE) --profile notebooks up -d --build jupyter

rebuild: ## Reconstruye las imágenes sin caché
	$(COMPOSE) build --no-cache

clean: ## Detiene y BORRA los volúmenes (artefactos, BD, mlruns)
	$(COMPOSE) down -v
