# Implementación de la Plataforma Web — FastAPI + Next.js (OmniCine)

**Fecha:** 2026-06-12
**Autor:** Claude Code
**Estado:** Finalizado y verificado de punta a punta

## 1. Resumen

Se reemplazó la app Django (retirada del repositorio) por una arquitectura
desacoplada en `app/`:

- **`app/backend/`** — API REST en **FastAPI** que sirve los modelos
  entrenados en los notebooks, con autenticación JWT y persistencia SQLite.
- **`app/web-app/`** — Aplicación **Next.js 16** con identidad de cine
  comercial (**OmniCine**): diseño plano y sobrio (sin gradientes ni colores
  saturados), tema oscuro neutro con rojo institucional y ámbar apagado,
  iconografía lucide-react y animaciones con `motion`.

El sistema completo fue verificado con pruebas E2E reales (registro, ratings,
recomendaciones personalizadas, migración de feedback de invitado).

## 2. Recuperación de artefactos del modelo

Los pickles `svd_model.pkl`, `knn_model.pkl` y `nmf_model.pkl` del notebook 03
no se conservaban en `models/` (solo `baseline_scores.pkl`), y el parquet
`ratings_prepared_60pct.parquet` tampoco está en el repositorio. Se creó
**`app/backend/scripts/train_models.py`**, que:

1. Reproduce los hiperparámetros exactos del notebook 03
   (SVD: `n_factors=50, n_epochs=20, lr_all=0.005, reg_all=0.02, seed=42`).
2. Entrena sobre el mejor dataset disponible (`ratings_prepared_60pct.parquet`
   si existe; fallback documentado a `ratings_knn_10pct.parquet`, 2.47 M
   ratings).
3. Recalcula los clústeres KMeans (k=6) sobre los embeddings de usuarios e
   ítems, y perfila cada clúster por **lift de género** (preferencia relativa
   frente a la población — los géneros masivos como Drama/Comedy dominan en
   volumen en todos los clústeres, por lo que el lift es lo que los distingue).
4. Guarda un **artefacto compacto de inferencia** (`models/svd_model.pkl`,
   ~6 MB): factores y sesgos de ítems en float32, media global, centroides de
   clústeres y perfiles de género. No se serializa el objeto Surprise completo
   (evita acoplarse a la versión de la librería y reduce 50× el tamaño).

## 3. Backend (`app/backend/`)

### 3.1 Motor de inferencia (`ml/engine.py`)

- **Catálogo en memoria:** merge de `movies_prepared_60pct.parquet` +
  `item_clusters.parquet` (popularidad, rating medio) + `links.csv`
  (IMDb/TMDb). Limpieza de títulos (`"Matrix, The (1999)" → "The Matrix"`) y
  extracción de año.
- **Cold start:** ranking bayesiano del baseline del notebook 03.
- **Personalización (*folding-in*):** para usuarios externos al trainset se
  estima el vector latente resolviendo un ridge sobre los factores de los
  ítems calificados (`(QᵀQ + λnI)p = Qᵀ(r − μ − bᵢ − bᵤ)`), con sesgo de
  usuario encogido bayesianamente. Luego se re-rankea un pool de ~2,500
  candidatos populares con la predicción SVD completa.
- **Similares:** coseno entre embeddings de ítems (verificado: los vecinos de
  *The Matrix* son *The Dark Knight*, *Terminator 2*, *Aliens*, *Fight Club*).
- **Comunidades:** el vector del usuario se asigna al centroide KMeans más
  cercano; `ml/personas.py` nombra los 6 clústeres con arquetipos en español
  según su perfil de lift (*Exploradores de Mundos*, *Detectives de
  Medianoche*, *Corazones Románticos*, etc.).

### 3.2 API

`auth` (register/login/me con JWT + bcrypt) · `movies` (búsqueda, género,
década, orden, paginación; detalle; similares) · `recommendations` (top-N
usuario/invitado, portada por secciones, afinidad por película) · `ratings`
(CRUD + `sync` para migrar feedback local) · `watchlist` · `profile`
(estadísticas + persona) · `meta` (tabla `model_comparison.csv`, stats).

Los endpoints `POST .../guest` reciben el historial guardado en el navegador
y aplican la misma lógica de inferencia, cumpliendo el requisito de feedback
local para usuarios sin cuenta.

### 3.3 Persistencia

SQLite (`omnirec.db`, gitignorado) vía SQLAlchemy: `users`, `ratings`
(unique por usuario+película), `watchlist`.

## 4. Frontend (`app/web-app/`)

- **Páginas:** portada con marquesina rotativa y filas por género; cartelera
  con búsqueda debounced, chips de género y "cargar más"; ficha de película
  con calificación por estrellas (medios puntos), afinidad estimada y
  similares; "Para ti" con persona y predicciones; perfil con métricas,
  calificadas y mi lista; login/registro.
- **Imágenes reales con fallback procedural:** los pósters y fondos se
  cargan del CDN público de Metahub (Stremio) por `imdbId` (presente en
  `links.csv`), sin API key — IMDb no ofrece API pública gratuita y su
  scraping está prohibido por sus términos. Si la imagen no existe, la UI cae
  con un fundido al arte plano determinista (color apagado por género +
  variación de tono por `movieId`, icono y tipografía).
- **Estado global (`lib/store.tsx`):** modo dual de feedback. Invitado →
  `localStorage`; con sesión → servidor. Al registrarse/iniciar sesión, los
  ratings y la lista local se migran automáticamente y se limpian del
  navegador.
- **Stack:** Next.js 16 (App Router, Turbopack), Tailwind CSS v4 (tokens
  `@theme`), lucide-react, `motion`, tipografías Bebas Neue + Outfit.

## 5. Verificación realizada

1. **API:** registro → 6 ratings → `strategy: svd_fold_in` con predicciones
   coherentes (usuario fan de sci-fi recibe *Blade Runner*, *Alien*, *The
   Fifth Element*); persona asignada; afinidad puntual; tabla de modelos.
2. **E2E con navegador real (headless Chrome):** calificación como invitado
   persiste en `localStorage` → `/para-ti` personaliza ("Re-ranking SVD sobre
   3 calificaciones") → registro migra el feedback (localStorage queda vacío,
   ratings visibles en el perfil) → persona *Exploradores de Mundos* mostrada.
3. **Build de producción** (`next build`) y **ESLint** limpios; typecheck sin
   errores.

## 6. Cómo ejecutar

```bash
# Modelo (si falta models/svd_model.pkl)
./venv/bin/python app/backend/scripts/train_models.py

# Backend
cd app/backend && ../../venv/bin/uvicorn main:app --reload --port 8000

# Frontend
cd app/web-app && npm install && npm run dev   # http://localhost:3000
```
