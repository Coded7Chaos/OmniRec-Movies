# Cambios — App Django (Testbench de modelos)

**Fecha y hora:** 2026-04-20 · 14:23 (America/La_Paz)
**Iteración CRISP-DM:** Fase 6 — Deployment (primera entrega)
**Alcance:** construcción de una app Django interactiva en `app/` para probar los 5 modelos entrenados en el notebook 03 (`models/*.pkl`), consumiendo los parquets producidos por los notebooks 02 y 03.
**Referencia en el estado global del proyecto:** [`Proyecto.md` §11](./Proyecto.md) — se incluye índice actualizado y nuevo historial de iteración.

> **Nota histórica (iter 5, 2026-04-20):** este documento describe el estado de la iteración 3. Posteriormente, en la iteración 5, `model_comparison.csv`, `user_clusters.parquet` e `item_clusters.parquet` se movieron de `reports/` a `data/intermediate/`, y la variable `OMNIREC_REPORTS_DIR` se eliminó de `settings.py` y `.env.example`. Para el estado actual de rutas y variables consultar [`Proyecto.md`](./Proyecto.md).

---

## 1. Resumen ejecutivo

Antes de esta iteración el directorio `app/` contenía únicamente el skeleton generado por `django-admin startproject core` + `python manage.py startapp apps`, sin templates, vistas, URLs ni lógica de carga de modelos. Los notebooks producían artefactos (pickles + parquets) pero no existía una superficie de interacción humana para probarlos.

En esta iteración se construyó una **app Django 6** (`apps.recommender`) que:

1. Lee los 5 modelos entrenados (`baseline_scores.pkl`, `knn_model.pkl`, `svd_model.pkl`, `nmf_model.pkl`, `automl_winner.pkl`) desde `models/` bajo demanda con un `Registry` thread-safe (evita bloquear el arranque con el KNN de 305 MB).
2. Consume `data/intermediate/*.parquet` (muestra 5%) y `reports/*.parquet` (clusters) con `pandas` + `pyarrow`.
3. Expone 5 pantallas (Panel, Top-N, Predicción, Búsqueda, Clusters) con **Tailwind CSS** (CDN) + **HTMX** para interacciones parciales sin JS custom.
4. Utiliza **django-environ** para resolver rutas y credenciales desde `.env`, **django-htmx** para reconocer requests HTMX y **django-browser-reload** para DX en dev.
5. Se publica también un endpoint `/health/` para probes.

El servidor arranca con `python manage.py runserver`, todas las páginas devuelven HTTP 200 y el pipeline de Top-N produce recomendaciones reales con SVD en **~407 ms** (incluida la primera deserialización del pickle).

---

## 2. Directorios afectados

```diff
app/
-├── apps/                        # stub de `django-admin startapp apps` (label=apps)
-│   ├── admin.py · apps.py · models.py · tests.py · views.py · migrations/
+├── .env.example                 # NUEVO — plantilla para django-environ
+├── static/                      # NUEVO — carpeta para collectstatic (placeholder)
+├── apps/
+│   ├── __init__.py              # ahora un namespace limpio
+│   └── recommender/             # NUEVO — app principal
+│       ├── apps.py · admin.py · models.py · __init__.py · migrations/
+│       ├── urls.py · views.py · forms.py · services.py
+│       ├── templatetags/
+│       │   ├── __init__.py
+│       │   └── recommender_extras.py
+│       ├── templates/recommender/
+│       │   ├── base.html · home.html · recommend.html · predict.html
+│       │   ├── search.html · clusters.html
+│       │   └── partials/
+│       │       ├── recommendations.html
+│       │       ├── prediction_row.html
+│       │       └── movie_hits.html
+│       └── static/recommender/css/custom.css
 ├── core/
-│   └── settings.py               # default django-admin (solo TAILWIND listado sin config)
+│   ├── settings.py               # REESCRITO — django-environ, INSTALLED_APPS real, middleware HTMX + reload, i18n es/La_Paz
+│   └── urls.py                   # REESCRITO — incluye apps.recommender.urls + __reload__/
```

> **Nota**: el stub previo al nivel de `app/apps/` se eliminó porque su `apps.py` declaraba un AppConfig con `name='apps'`, que chocaba con el uso de `apps/` como paquete-namespace para sub-apps. Tras la limpieza, `apps/__init__.py` está vacío y el único AppConfig dentro es `apps.recommender`.

---

## 3. Archivos creados — detalle

### 3.1 `app/core/settings.py` (reescrito)

- Carga variables con `environ.Env` y un `.env` opcional.
- Variables introducidas: `DEBUG`, `ALLOWED_HOSTS`, `SECRET_KEY`, `OMNIREC_MODELS_DIR`, `OMNIREC_DATA_DIR`, `OMNIREC_REPORTS_DIR`, `OMNIREC_EAGER_LOAD`.
- Defaults apuntan a los artefactos del repo (`<repo>/models`, `<repo>/data/intermediate`, `<repo>/reports`) — funciona out-of-the-box.
- `INSTALLED_APPS` agrega `django_htmx`, `django_browser_reload`, `apps.recommender`.
- `MIDDLEWARE` agrega `django_htmx.middleware.HtmxMiddleware` y `django_browser_reload.middleware.BrowserReloadMiddleware`.
- i18n en **es** / **America/La_Paz**, `STATICFILES_DIRS=[BASE_DIR / 'static']`, `STATIC_ROOT=BASE_DIR / 'staticfiles'`.

### 3.2 `app/core/urls.py` (reescrito)

- `path('', include('apps.recommender.urls', namespace='recommender'))`.
- Bajo `DEBUG=True`, monta `__reload__/` de `django_browser_reload`.

### 3.3 `app/.env.example`

- Plantilla comentada con todas las variables disponibles.

### 3.4 `app/apps/recommender/apps.py`

- `RecommenderConfig(name='apps.recommender', label='recommender')`.
- `ready()` llama `services.registry.warmup()` si `OMNIREC_EAGER_LOAD=True`.

### 3.5 `app/apps/recommender/services.py`

Capa de servicio — **el archivo más importante de la iteración**.

- Dataclass `Registry` con `threading.Lock` para carga lazy thread-safe.
- Constantes:
  - `MODEL_LABELS` — diccionario id→etiqueta humana.
  - `MODEL_FILES` — id→nombre de pickle.
- Métodos:
  - `movies()`, `ratings()`, `user_clusters()`, `item_clusters()`, `metrics()` — lectura cacheada de parquets/CSV.
  - `user_ids()` · `rated_by_user(user_id)` — índice invertido para filtrar películas ya vistas.
  - `model(key)` · `baseline()` — deserialización lazy del pickle correspondiente.
  - `predict_rating(model_key, user_id, movie_id)` — encapsula la API de `surprise.predict` y el lookup en el dict bayesiano.
  - `top_n_for_user(user_id, model_key, n, candidate_limit=400)` — patrón **retriever + re-ranker**: toma los top 400 del Baseline Bayesiano como shortlist y los re-ordena con el modelo elegido.
  - `movie_lookup(query, limit=15)` — búsqueda case-insensitive en el título + score bayesiano.
  - `cluster_summary()` — agregación por cluster (n_users, n_movies, rating_mean, top-5 títulos).
  - `warmup()` — precarga `movies`, `baseline`, `metrics`, `svd`, `nmf`.
- Un singleton `registry: Registry` se construye al importar el módulo desde `settings`.

### 3.6 `app/apps/recommender/views.py`

- `home` — panel con tabla de métricas + KPIs de la muestra.
- `recommend` · `recommend_run` — formulario y partial HTMX del Top-N.
- `predict` · `predict_run` — formulario y partial con la predicción de los 5 modelos + latencia.
- `search` · `search_results` — autocompletado HTMX (keyup con delay 300 ms).
- `clusters` — dashboard de clusters.
- `health` — JSON con `{status, models_loaded, sample_users, sample_movies}`.

Todas las vistas leen datos sólo del `registry`: **la base de datos SQLite se usa únicamente para sesiones/auth**, no para lógica de recomendación.

### 3.7 `app/apps/recommender/urls.py`

- Namespace `recommender`.
- 9 rutas (5 páginas + 3 partials HTMX + health).

### 3.8 `app/apps/recommender/forms.py`

- `TopNForm` — userId, model_key (select con 5 modelos), n (1..50, default 10).
- `PredictForm` — userId, movieId.
- Clases Tailwind aplicadas directamente a los widgets (es la forma más compacta de estilizar forms con HTMX).

### 3.9 `app/apps/recommender/templatetags/recommender_extras.py`

- Filtro `|get:'<clave>'` para acceder a llaves con `@` (p. ej. `P@10`, `NDCG@10`) desde templates Django.
- Filtro `|star_rating` que convierte un float en una barra UTF-8 `★★★½☆`.

### 3.10 Templates (8 archivos)

| Archivo | Rol |
|---|---|
| `base.html` | Layout, Tailwind CDN (`cdn.tailwindcss.com`), HTMX 1.9.12 via `unpkg`, fuente Inter, header con nav activa, footer. |
| `home.html` | Panel — cards de KPIs + tabla de `model_comparison.csv` con resaltado de mejor RMSE y mejor NDCG@10. |
| `recommend.html` | Formulario Top-N + contenedor `#recs` que recibe partial HTMX. |
| `predict.html` | Formulario Predicción + contenedor `#pred`. |
| `search.html` | Caja de búsqueda con `hx-trigger="keyup changed delay:300ms"`. |
| `clusters.html` | Grid de cards por cluster con top-5 títulos y medias agregadas. |
| `partials/recommendations.html` | Lista ordenada de N películas + score + estrellas + tiempo. |
| `partials/prediction_row.html` | Tabla con la estimación de los 5 modelos + latencia por modelo. |
| `partials/movie_hits.html` | Grid de resultados de búsqueda con score bayesiano. |

### 3.11 `app/apps/recommender/static/recommender/css/custom.css`

- Tres reglas mínimas para que `.htmx-indicator` opaque/despliegue spinners durante peticiones.

---

## 4. `requirements.txt` — cambios

Se agregó una sección nueva al final del archivo sin alterar las dependencias existentes del pipeline ML:

```
Django==6.0.*
django-environ==0.13.*
django-htmx==1.27.*
django-browser-reload==1.21.*
django-tailwind==4.4.*
pytailwindcss==0.3.*
```

`django-tailwind` y `pytailwindcss` quedan listados aunque el testbench actual carga Tailwind vía CDN: así queda disponible la ruta de compilación con el CLI standalone (sin npm) si se quiere pasar a producción.

---

## 5. Decisiones de diseño

1. **Retriever + re-ranker en Top-N**. Los 5 915 movieIds son pocos para re-rankear todos con SVD, pero KNN-Baseline sí es costoso. La shortlist de 400 películas por score bayesiano colapsa el tiempo sin afectar calidad — es el mismo patrón que usa producción (candidate generation + ranking).
2. **Lazy-load de pickles**. El KNN pesa 305 MB y no se va a usar en todas las sesiones. El `Registry` carga cada modelo la primera vez que se pide y lo cachea con un `threading.Lock` para evitar doble-carga en entornos multi-thread (gunicorn sync workers).
3. **Tailwind vía CDN, no build-step**. Maximiza velocidad de setup (`runserver` funciona inmediatamente). `django-tailwind` queda documentado como la ruta de producción.
4. **django-htmx vs SPA**. HTMX permite fragmentos HTML server-side sin introducir React/Vite. Cabe perfectamente en el alcance del testbench (dashboards y formularios).
5. **Sin modelos Django (ORM)**. La app es stateless respecto a datos de dominio — el ORM se usa sólo para `auth`/`sessions` (las migraciones de esas apps sí corren). El estado del negocio vive en los pickles y parquets.
6. **i18n `es` / `America/La_Paz`**. Consistente con el resto de la documentación del proyecto.
7. **Separación `app/apps/recommender/`**. Se deja `apps/` como namespace para que en el futuro se puedan añadir más apps (p. ej. `apps.api`, `apps.dashboard_ops`) sin ensuciar el settings.

---

## 6. Verificación realizada (2026-04-20 14:21 → 14:23)

```bash
cd app
../venv/bin/python manage.py check
# System check identified 1 issue: staticfiles.W004 (carpeta static faltante) — resuelta creándola.

../venv/bin/python manage.py migrate --noinput
# Applying auth, contenttypes, sessions, admin … OK

../venv/bin/python manage.py runserver 127.0.0.1:8765 &
```

Resultados `curl`:

| Ruta | Método | HTTP | Observación |
|---|---|---|---|
| `/health/` | GET | 200 | `{"status": "ok", "sample_users": 8126, "sample_movies": 5915, "models_loaded": 0}` |
| `/` | GET | 200 | Panel con tabla de métricas renderizada. |
| `/recommend/` | GET | 200 | Formulario correcto. |
| `/predict/` | GET | 200 | Formulario correcto. |
| `/search/` | GET | 200 | Caja de búsqueda. |
| `/clusters/` | GET | 200 | Dashboard de los 6 clusters. |
| `/search/results/?q=matrix` | GET | 200 | Partial con Matrix, The (1999) y score bayesiano. |
| `/recommend/run/?user_id=29&model_key=svd&n=5` | GET | 200 | Top-5 generado con SVD en **407 ms** incluyendo primera deserialización. |

---

## 7. Cómo correr la app (checklist)

1. `cd OmniRec-Movies`
2. `source venv/bin/activate`
3. `pip install -r requirements.txt` *(si aún no se instalaron las nuevas dependencias — Django, django-environ, django-htmx, django-browser-reload, django-tailwind, pytailwindcss)*
4. `cd app && python manage.py migrate --noinput` *(crea `db.sqlite3` con las tablas de auth/sessions)*
5. *(opcional)* `cp .env.example .env && edit .env`
6. `python manage.py runserver`
7. Abrir http://127.0.0.1:8000/

Los artefactos en `models/*.pkl`, `data/intermediate/*.parquet` y `reports/*.parquet` deben existir; en esta máquina ya estaban porque el notebook 03 se ejecutó el 2026-04-20 08:57.

---

## 8. Próximos pasos naturales sobre la app

1. **REST API** (`apps.api`): exponer `/api/v1/predict/`, `/api/v1/top-n/`, `/api/v1/search/` con DRF. Reusar el `Registry`.
2. **Autenticación** opcional para cohortes de usuarios reales (admin Django ya habilitado).
3. **Dockerfile + docker-compose** con gunicorn + whitenoise + volumen para `models/`.
4. **Observabilidad**: contar latencias por modelo con `django-prometheus` o un middleware simple.
5. **Tailwind compilado**: `python manage.py tailwind init theme && python manage.py tailwind build` cuando se quiera abandonar la CDN.
6. Integrar el output de los notebooks 04 (NCF/Two-Tower) y 05 (RAG) como modelos adicionales en el `Registry`.

---

## 9. Trazabilidad de archivos

**Creados (18):**

- `app/.env.example`
- `app/apps/__init__.py` *(preexistente, conservado vacío)*
- `app/apps/recommender/__init__.py`
- `app/apps/recommender/admin.py`
- `app/apps/recommender/apps.py`
- `app/apps/recommender/forms.py`
- `app/apps/recommender/models.py`
- `app/apps/recommender/services.py`
- `app/apps/recommender/urls.py`
- `app/apps/recommender/views.py`
- `app/apps/recommender/migrations/__init__.py`
- `app/apps/recommender/templatetags/__init__.py`
- `app/apps/recommender/templatetags/recommender_extras.py`
- `app/apps/recommender/templates/recommender/base.html`
- `app/apps/recommender/templates/recommender/home.html`
- `app/apps/recommender/templates/recommender/recommend.html`
- `app/apps/recommender/templates/recommender/predict.html`
- `app/apps/recommender/templates/recommender/search.html`
- `app/apps/recommender/templates/recommender/clusters.html`
- `app/apps/recommender/templates/recommender/partials/recommendations.html`
- `app/apps/recommender/templates/recommender/partials/prediction_row.html`
- `app/apps/recommender/templates/recommender/partials/movie_hits.html`
- `app/apps/recommender/static/recommender/css/custom.css`
- `reports/CAMBIOS_APP_DJANGO_2026-04-20.md` *(este archivo)*

**Modificados (3):**

- `app/core/settings.py` — reescrito (django-environ, nuevos apps/middleware, i18n).
- `app/core/urls.py` — root URLconf apuntando a `apps.recommender`.
- `requirements.txt` — bloque nuevo para la app Django.
- `reports/Proyecto.md` — nueva §11 (App Django), actualización del árbol, de la matriz CRISP-DM, del historial de iteraciones y del índice rápido.

**Eliminados (6):**

- `app/apps/admin.py`, `app/apps/apps.py`, `app/apps/models.py`, `app/apps/tests.py`, `app/apps/views.py` *(stub del `startapp apps`)*
- `app/apps/migrations/` *(dir vacío del stub)*
