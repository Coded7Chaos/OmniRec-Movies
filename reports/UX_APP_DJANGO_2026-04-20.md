# UX — App Django (personas y paleta sólida)

**Fecha y hora:** 2026-04-20 · 14:40 (America/La_Paz)
**Iteración:** 4 — refinamiento de la experiencia de usuario de la app Django creada en la iter 3.
**Alcance:** corrección de los tres puntos solicitados: (1) eliminar IDs de la UI, (2) interfaz simple con colores sólidos y (3) onboarding claro desde el primer segundo.
**Referencia en el estado global:** [`Proyecto.md` §11](./Proyecto.md) — se actualizó la descripción de endpoints, carga de personas y verificación.

---

## 1. Problemas observados antes de esta iteración

| # | Problema | Impacto |
|---|---|---|
| 1 | El formulario de Top-N pedía `userId` (número 1-160000) sin ningún contexto. El usuario común no sabe qué ID corresponde a qué gustos. | Fricción: el tester tenía que adivinar números o leer documentación interna. |
| 2 | El formulario de Predicción pedía `movieId` numérico. Ni siquiera había catálogo al lado; había que ir a otra pantalla a buscar el ID. | Fricción severa: bloqueaba el flujo de comparación de modelos. |
| 3 | El logo y algunos elementos usaban un gradiente `from-indigo-500 to-fuchsia-500`. Los resultados mostraban `bg-white/60 backdrop-blur`. | Estética inconsistente con la guía del usuario (paleta sólida). |
| 4 | No había onboarding. El panel mostraba la tabla de métricas sin explicar el flujo. | El funcionamiento no era obvio desde el primer segundo. |
| 5 | Los géneros se mostraban como `Action|Sci-Fi|Thriller` o `ActionSci-FiThriller` (pipes eliminados sin separador). | Legibilidad pobre. |
| 6 | Las partials mostraban textualmente "user 29", "movieId 2571" al lado del título. | Ruido visual irrelevante para el usuario común. |

---

## 2. Decisiones de diseño

### 2.1 Personas en lugar de userId

Derivé una lista curada de **~42 personas** a partir de los datos ya disponibles:

- Fuente: `ratings_sample_5pct.parquet` (1.15 M ratings) ⨝ `movies_sample.parquet` (géneros) ⨝ `user_clusters.parquet` (cluster_id).
- Por usuario: cantidad de reseñas, rating medio, género primario más frecuente.
- Selección: top-7 por cluster × 6 clusters → 42 personas.
- Etiqueta: `Fan de {género en español} · {N} reseñas · Grupo {cluster}`.

Ejemplo real generado: `Fan de Acción · 1909 reseñas · Grupo 0`.

El userId subyacente existe, pero queda encapsulado dentro del `<option value="...">`. El usuario nunca lo ve.

### 2.2 Autocomplete de películas en lugar de movieId

Endpoint nuevo: `GET /movies/autocomplete/?q=<texto>` → devuelve un partial HTMX con hasta 8 películas.

Flujo del picker (en `/predict/`):

1. Usuario escribe en un `<input type="text">`.
2. HTMX dispara `hx-get` con delay de 250 ms → obtiene la partial `movie_picker_results.html`.
3. Cada resultado es un `<button>` que al hacer click llama a `window.__omnirec_pickMovie(movieId, title)` (JS vanilla inline en `predict.html`).
4. La función: (a) guarda el `movieId` en un input oculto de Django, (b) muestra un badge "Elegida: Matrix, The (1999)" con botón *Cambiar*, (c) limpia la lista de resultados.
5. El submit del formulario manda el `movieId` oculto; Django lo valida como `IntegerField`.

No hay cambios en el backend salvo el endpoint nuevo y la conversión de `PredictForm.movie_id` a `HiddenInput`.

### 2.3 Paleta de colores sólida

- **Eliminados** todos los usos de `bg-gradient-to-*`.
- Paleta:
  - Acción primaria: `bg-indigo-600` hover `bg-indigo-700`
  - Acento de éxito / resaltado: `bg-emerald-50` / `bg-emerald-600` (ganador en predicción)
  - Error: `bg-rose-50` / `text-rose-700`
  - Atención: `bg-amber-500` (estrellas) y `bg-amber-50` (sin resultados)
  - Superficies: `bg-white`, `bg-slate-50`
  - Bordes: `border-slate-200`
  - Texto: `text-slate-900` / `text-slate-600` / `text-slate-400`
- Cards: bordes sólidos `border-slate-200` + `rounded-xl`/`rounded-2xl`, sin blur ni transparencias.
- Header: fondo `bg-white` (antes `bg-white/70 backdrop-blur`).
- Navegación: chip activo con fondo sólido `bg-indigo-600 text-white` (antes `bg-indigo-50 text-indigo-700`).

### 2.4 Onboarding explícito en tres pasos

Nuevo bloque *"¿Cómo funciona?"* en `/`:

1. **Elegí una persona** — cada persona describe su género favorito y cantidad de reseñas.
2. **Elegí un modelo** — 5 algoritmos con diferentes fortalezas.
3. **Mirá los resultados** — ranking ordenado por afinidad predicha.

Cada paso es una card con su número en un círculo `bg-indigo-600` sólido.

Además:
- El hero del panel tiene dos CTAs explícitos: *"Empezar a recomendar →"* (primario, sólido) y *"Comparar modelos en una película"* (secundario, outlined).
- Los formularios tienen **empty states** en el contenedor de resultados: un icono circular + "Acá van a aparecer las películas recomendadas" + instrucción breve.
- La lista de modelos debajo del select incluye una **descripción por modelo** (`MODEL_HINTS`):
  - Popularidad ponderada → *"Rápido — ignora al usuario, ordena por score bayesiano global."*
  - Vecinos cercanos (KNN) → *"Preciso pero lento — la primera llamada carga ~305 MB."*
  - Factorización SVD → *"Recomendado — equilibrio entre calidad y velocidad."*
  - etc.

### 2.5 Copy en español natural

- Nav: *Inicio · Recomendar · Comparar · Catálogo · Grupos* (antes *Panel · Top-N · Predicción · Películas · Clusters*).
- Labels: *Persona · Algoritmo · Cuántas películas querés · Película* (antes *User ID · Modelo · Top-N · Movie ID*).
- Géneros en español: `Action|Sci-Fi` → `Acción · Ciencia Ficción` (filtro nuevo `format_genres` + diccionario `GENRE_ES` en `services.py`).
- Métricas de la tabla traducidas: *Error (RMSE) · Error (MAE) · Precisión Top-10 · Cobertura Top-10 · Calidad de orden · Entrenamiento (s)* (antes los headers crudos RMSE / MAE / P@10 / R@10 / NDCG@10).
- Resaltados de la tabla: *"Más preciso: KNN-Baseline …"* y *"Mejor orden: KNN-Baseline …"* (antes *"Mejor RMSE" / "Mejor NDCG@10"*).

---

## 3. Archivos modificados / creados

| Archivo | Tipo | Qué cambió |
|---|---|---|
| `app/apps/recommender/services.py` | **Modificado** | `MODEL_LABELS` reescrito con etiquetas humanas. Nuevo dict `MODEL_HINTS`. Nuevo dict `GENRE_ES` con 20 géneros. Nueva función `format_genres()`. Nuevos métodos `personas()`, `persona(user_id)`, `movie_by_id(movie_id)`. `top_n_for_user()` y `movie_lookup()` ahora devuelven `genres` formateados. `warmup()` precarga personas. |
| `app/apps/recommender/forms.py` | **Modificado** | `TopNForm.user_id` → `TypedChoiceField` poblado en `__init__` con `_persona_choices()`. `PredictForm.user_id` = idem. `PredictForm.movie_id` = `HiddenInput`. Clases Tailwind consolidadas en constantes `INPUT_CLS` / `SELECT_CLS`. |
| `app/apps/recommender/urls.py` | **Modificado** | `/search/` → `/catalog/`. Añadida ruta `/movies/autocomplete/`. |
| `app/apps/recommender/views.py` | **Modificado** | `recommend_run` y `predict_run` usan `registry.persona()` y `registry.movie_by_id()`. `predict_run` resalta la predicción más alta con `is_best=True`. Nueva view `movie_autocomplete`. `health` incluye `personas`. |
| `app/apps/recommender/templates/recommender/base.html` | **Modificado** | Sin gradientes. Logo sólido `bg-indigo-600`. Nav items activos en sólido. Header sin blur. |
| `app/apps/recommender/templates/recommender/home.html` | **Modificado** | Hero con CTAs explícitos. Sección *Cómo funciona* en 3 pasos. Tabla con headers traducidos. KPI de "Personas disponibles". |
| `app/apps/recommender/templates/recommender/recommend.html` | **Modificado** | Select de personas, select de algoritmo con hints, input de cantidad, empty state visual. Se añadió `{% load recommender_extras %}` para usar `|get:`. |
| `app/apps/recommender/templates/recommender/predict.html` | **Modificado** | Select de personas + buscador de películas con autocomplete HTMX + input oculto + JS vanilla para pick/clear + badge de película elegida + empty state. |
| `app/apps/recommender/templates/recommender/search.html` | **Modificado** | Renombrado a *Catálogo*. Explicación breve arriba. |
| `app/apps/recommender/templates/recommender/clusters.html` | **Modificado** | Copy en lenguaje natural ("Grupos de gustos similares", "Películas estrella del grupo"). Sin gradientes. |
| `app/apps/recommender/templates/recommender/partials/recommendations.html` | **Modificado** | Encabezado con la etiqueta de la persona + rating medio de esa persona; sin `movieId` en las tarjetas; géneros en español. |
| `app/apps/recommender/templates/recommender/partials/prediction_row.html` | **Modificado** | Encabezado con título + géneros + label de persona (sin IDs). Cada fila de algoritmo incluye su hint descriptivo. Fila del ganador con badge verde *Más alta*. |
| `app/apps/recommender/templates/recommender/partials/movie_hits.html` | **Modificado** | Sin mostrar `movieId`. Géneros en español. |
| `app/apps/recommender/templates/recommender/partials/movie_picker_results.html` | **Nuevo** | Lista de resultados del autocomplete del picker en `/predict/`. Cada resultado es un `<button type="button">` que llama `window.__omnirec_pickMovie(id, title)`. |
| `reports/Proyecto.md` | **Modificado** | Cabecera con iter 4. Historial con fila nueva. §11.3 (endpoints renombrados y nuevos), §11.4 (sección nueva sobre personas), §11.6 (verificación reejecutada). |
| `reports/UX_APP_DJANGO_2026-04-20.md` | **Nuevo** | Este documento. |

**No** se cambió `requirements.txt`, `manage.py`, `core/settings.py`, `core/urls.py`, `.env.example` — la iter 4 es puramente de UX sin nuevas dependencias.

---

## 4. Verificación (2026-04-20, 14:40)

```bash
cd app
../venv/bin/python manage.py check
# System check identified no issues (0 silenced).

../venv/bin/python manage.py runserver 127.0.0.1:8768 &
```

Resultados `curl`:

| Ruta | HTTP | Nota |
|---|---|---|
| `/` | 200 | Hero + *Cómo funciona* + 4 KPIs + tabla de métricas con headers en español. |
| `/recommend/` | 200 | Select con las 42 personas. Select de algoritmo con hints. Empty state centrado. |
| `/predict/` | 200 | Select de personas + buscador de películas con autocomplete. |
| `/catalog/` | 200 | Explorador del catálogo. |
| `/clusters/` | 200 | 6 grupos renderizados. |
| `/health/` | 200 | `{"status": "ok", "sample_users": 8126, "sample_movies": 5915, "models_loaded": 1, "personas": 42}` |
| `/movies/autocomplete/?q=matrix` | 200 | Partial con 8 películas, primera: *Matrix, The (1999)*, score 4.16. |
| `/recommend/run/?user_id=30024&model_key=svd&n=5` | 200 | Top-5 renderizado, cabecera *"Top 5 para Fan de Acción · 1909 reseñas · Grupo 0"*, rating medio de la persona mostrado. |
| `/predict/run/?user_id=30024&movie_id=2571` | 200 | Tabla de 5 modelos con *"Matrix, The (1999) · Acción · Ciencia Ficción · Suspenso"* y persona *"Fan de Acción · 1909 reseñas · Grupo 0"*. Fila ganadora resaltada en verde con badge *Más alta*. |

No aparecieron trazas de error en `/tmp/django4.log` tras las pruebas.

---

## 5. Decisiones de diseño descartadas

- **Nombres ficticios para personas** (p. ej. "Marta, cinéfila dramática"). Descartado: agrega un nivel de ficción que no aporta — la etiqueta funcional *"Fan de Drama · 312 reseñas · Grupo 3"* ya transmite el carácter de la persona.
- **Eliminar la página de catálogo** (antes `/search/`). Descartado: aporta contexto sobre los scores bayesianos que el algoritmo *Popularidad ponderada* usa como base. Se mantuvo pero renombrada a `/catalog/`.
- **Compilar Tailwind con `pytailwindcss`** para evitar la CDN. Descartado para esta iter: la CDN ya funciona en dev y mantiene el setup a cero pasos. Se documenta en `Proyecto.md` §11.1 como ruta para producción.
- **Autocomplete de personas**. Descartado: con 42 opciones un `<select>` es más directo que un combobox.

---

## 6. Cosas que quedaron fuera y podrían hacerse en una iter 5

1. Permitir que el usuario **marque películas que vio/le gustaron** y sintetizar una "persona ad-hoc" (actualmente las personas son 42 fijas).
2. Mostrar, en los resultados de Top-N, **por qué** se recomendó cada película (género dominante de la persona, afinidad con su cluster).
3. Añadir un **modo oscuro** con la misma paleta sólida.
4. Exportar el Top-N como CSV.
5. Internacionalización (i18n) real — hoy el copy en español está hardcodeado en los templates.

---

## 7. Cómo probar manualmente la iter 4

```bash
cd OmniRec-Movies
source venv/bin/activate
cd app
python manage.py migrate --noinput   # si no se corrió antes
python manage.py runserver
# Abrir http://127.0.0.1:8000/
# 1) Leer la sección "¿Cómo funciona?" — debería alcanzar para saber qué hacer.
# 2) Click "Empezar a recomendar" → elegir cualquier persona del menú → click "Recomendar ahora".
# 3) Ir a "Comparar" → elegir persona → escribir "matrix" en el buscador → click en "Matrix, The (1999)" → "Comparar los 5 modelos".
# 4) Verificar que en ninguna pantalla se vea un número de ID al usuario.
```
