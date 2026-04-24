# Migración — Frontend Inertia.js + React + MUI

**Fecha y hora:** 2026-04-23 · 18:21 (America/La_Paz)
**Iteración CRISP-DM:** Fase 6 — Deployment (iteración 6)
**Alcance:** migración completa del frontend de la app Django `apps.recommender` desde **Django templates + HTMX + Tailwind CDN** hacia **Django + Inertia.js + React 18 + MUI (Material UI) 6** compilado con **Vite**. Interfaz profesional, tipografía Inter, navegación SPA con Inertia, formularios reactivos con componentes MUI (Autocomplete asíncrono, DataGrid-style tables, Chips, Rating, LinearProgress).
**Referencia en el estado global:** [`Proyecto.md` §11](./Proyecto.md) — se actualizó el stack, la estructura del directorio, los endpoints y la verificación.

---

## 1. Resumen ejecutivo

Antes de esta iteración el frontend era un conjunto de plantillas Django (`base.html`, `home.html`, `recommend.html`, …) con **HTMX** para interacciones parciales y **Tailwind CSS vía CDN** para el estilo. Aunque funcional, presentaba tres limitaciones para una demo con pretensiones profesionales:

1. **Falta de un design system maduro.** Tailwind + utilidades inline no imponen componentes consistentes; cada template redefinía cards/botones/inputs con clases propias.
2. **Interacciones sin estado compartido.** HTMX devuelve fragmentos HTML y no tiene modelo de componentes; la lógica de formularios se duplicaba con JS vanilla (picker de películas, badges).
3. **Assets sin build pipeline.** Tailwind CDN no purga CSS, carga JIT en el cliente y no permite importar tipografías / íconos como módulos.

Esta iteración reemplaza toda la capa de presentación por:

- **Inertia.js 2.x** (`inertia-django` en backend + `@inertiajs/react` en frontend) — las vistas Django devuelven `inertia.render(request, 'ComponentName', props=...)` y el cliente maneja la navegación SPA sin una API REST separada para páginas.
- **React 18** con componentes funcionales + hooks.
- **MUI 6** (`@mui/material`, `@mui/icons-material`) con un `ThemeProvider` propio: paleta *indigo-600* (primary), *emerald-600* (success), radios `12 px`, tipografía Inter con pesos 400–800.
- **Vite 5** para el build (`npm run build` produce `app/frontend/dist/.vite/manifest.json`) y HMR en desarrollo.
- **django-vite 3.0** para inyectar los `<script>` / `<link>` correctos en el layout Django con el hash del manifest.

La app sigue escuchando en los mismos paths (`/`, `/recommend/`, `/predict/`, `/catalog/`, `/clusters/`, `/health/`), pero ahora **todas las páginas montan React** y las acciones interactivas consumen endpoints JSON (`/api/recommend/`, `/api/predict/`, `/api/movies/`).

---

## 2. Directorios afectados

```diff
app/
 ├── manage.py
 ├── .env.example                       # + DJANGO_VITE_DEV_MODE
 ├── db.sqlite3
+├── templates/
+│   └── layout.html                    # NUEVO — base para Inertia + django-vite
+├── frontend/                          # NUEVO — proyecto Vite + React
+│   ├── package.json
+│   ├── vite.config.js
+│   ├── .gitignore
+│   ├── src/
+│   │   ├── main.jsx                   # entry point — createInertiaApp
+│   │   ├── theme.js                   # ThemeProvider MUI
+│   │   ├── api.js                     # helpers fetch/JSON
+│   │   ├── components/
+│   │   │   ├── Layout.jsx             # AppBar + Drawer mobile + Container
+│   │   │   ├── PageHeader.jsx
+│   │   │   ├── StatCard.jsx
+│   │   │   ├── PersonaSelect.jsx      # MUI Autocomplete sobre personas
+│   │   │   └── MovieAutocomplete.jsx  # MUI Autocomplete async contra /api/movies/
+│   │   └── pages/
+│   │       ├── Home.jsx
+│   │       ├── Recommend.jsx
+│   │       ├── Predict.jsx
+│   │       ├── Catalog.jsx
+│   │       └── Clusters.jsx
+│   └── dist/                          # generado por `npm run build`
 ├── core/
 │   ├── settings.py                    # REESCRITO — inertia, django_vite, INERTIA_LAYOUT
 │   └── urls.py                        # SIMPLIFICADO — sin __reload__/
 └── apps/recommender/
     ├── apps.py                        # (sin cambios)
     ├── services.py                    # (sin cambios — contrato de datos intacto)
     ├── urls.py                        # REESCRITO — páginas Inertia + endpoints JSON
     ├── views.py                       # REESCRITO — inertia.render + api_*
-    ├── forms.py                       # ELIMINADO
-    ├── templatetags/                  # ELIMINADO
-    ├── templates/recommender/...      # ELIMINADOS (8 templates + 3 partials)
-    └── static/recommender/css/...     # ELIMINADO
```

---

## 3. Backend — detalle de cambios

### 3.1 `core/settings.py`

- `INSTALLED_APPS`: fuera `django_htmx` y `django_browser_reload`; dentro `inertia`, `django_vite`.
- `MIDDLEWARE`: fuera middlewares HTMX y BrowserReload; dentro `inertia.middleware.InertiaMiddleware` (detecta `X-Inertia`, maneja redirects 303, inyecta `X-Inertia-Version`).
- Nuevos ajustes:
  ```python
  INERTIA_LAYOUT = 'layout.html'
  INERTIA_VERSION = '1.0'
  DJANGO_VITE = {
      'default': {
          'dev_mode': env('DJANGO_VITE_DEV_MODE'),
          'dev_server_port': 5173,
          'manifest_path': BASE_DIR / 'frontend' / 'dist' / '.vite' / 'manifest.json',
          'static_url_prefix': '',
      }
  }
  ```
- `STATICFILES_DIRS` incluye `BASE_DIR / 'frontend' / 'dist'` para que Django sirva los assets compilados por Vite en modo producción (`DEBUG=True`, `DJANGO_VITE_DEV_MODE=False`).
- `TEMPLATES[0]['DIRS']` ahora incluye `app/templates/` para resolver `layout.html`.

### 3.2 `core/urls.py`

Simplificado a:

```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('apps.recommender.urls', namespace='recommender')),
]
```

Se eliminó el `__reload__/` de `django_browser_reload`.

### 3.3 `apps/recommender/views.py`

Dividido en dos grupos:

**Páginas Inertia** — cada una retorna `inertia.render(request, 'ComponentName', props={...})`:

| Path | Componente React | Props |
|---|---|---|
| `/` | `Home` | `stats`, `metrics`, `bestByRmse`, `bestByNdcg`, `models`, `navigation`, `active` |
| `/recommend/` | `Recommend` | `personas`, `models`, `navigation`, `active` |
| `/predict/` | `Predict` | `personas`, `models`, `navigation`, `active` |
| `/catalog/` | `Catalog` | `navigation`, `active` |
| `/clusters/` | `Clusters` | `clusters`, `navigation`, `active` |

**Endpoints JSON** — consumidos con `fetch` desde React:

| Método | Path | Cuerpo / query | Respuesta |
|---|---|---|---|
| POST | `/api/recommend/` | JSON `{user_id, model_key, n}` | `{recs, persona, model_label, elapsed_ms, n}` |
| POST | `/api/predict/` | JSON `{user_id, movie_id}` | `{persona, movie, rows, best_key}` |
| GET | `/api/movies/?q=&limit=` | Query string | `{query, hits: [{movieId, title, genres, bayesian}]}` |
| GET | `/health/` | — | `{status, models_loaded, sample_users, sample_movies, personas}` |

Los endpoints JSON están decorados con `@csrf_exempt` porque el frontend los consume con `fetch` sin tokens (la sesión Django sigue funcionando para admin/auth). Se eliminaron `recommend_run`, `predict_run`, `search_results`, `movie_autocomplete` y `search`, que devolvían partials HTML.

### 3.4 `apps/recommender/urls.py`

Reducido de 10 rutas (páginas + partials HTMX + health) a 9 rutas simétricas: 5 páginas + 3 APIs JSON + health.

### 3.5 Archivos eliminados

- `apps/recommender/forms.py` — la validación se hace en el backend con `int()` defensivo en los endpoints JSON.
- `apps/recommender/templatetags/` — los filtros `|get:` y `|star_rating` eran necesarios para Django templates; con React, la lógica vive en los componentes.
- `apps/recommender/templates/recommender/` — 8 templates.
- `apps/recommender/static/recommender/css/` — custom CSS para el indicador HTMX.

### 3.6 `services.py`

**Sin cambios.** `Registry` sigue siendo la única fuente de verdad para personas, modelos, métricas y clusters. Esto fue deliberado: la capa de servicio queda aislada del cambio de UI.

---

## 4. Frontend — detalle de cambios

### 4.1 `frontend/package.json`

Dependencias runtime:
- `react@18.3`, `react-dom@18.3`
- `@inertiajs/react@2.0` — cliente Inertia para React
- `@mui/material@6.1`, `@mui/icons-material@6.1` — design system
- `@emotion/react@11.13`, `@emotion/styled@11.13` — MUI style engine
- `@fontsource/inter@5.1` — tipografía Inter empaquetada como módulo (sin CDN)

Dev:
- `vite@5.4`, `@vitejs/plugin-react@4.3`

### 4.2 `frontend/vite.config.js`

- `base: '/static/'` — Vite hashea assets bajo este prefijo, que coincide con el `STATIC_URL` de Django.
- `build.manifest: true` — genera `dist/.vite/manifest.json` para django-vite.
- Entry point: `src/main.jsx`.
- `server.port: 5173` con `strictPort` para HMR local.

### 4.3 `frontend/src/main.jsx`

```jsx
createInertiaApp({
  resolve: (name) => {
    const Page = PAGES[name];
    Page.layout = Page.layout || ((page) => <Layout>{page}</Layout>);
    return Page;
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <ThemeProvider theme={theme}><CssBaseline /><App {...props} /></ThemeProvider>
    );
  },
});
```

El `PAGES` mapping es explícito (no hay `import.meta.glob`) para que Vite haga tree-shaking determinista.

### 4.4 `frontend/src/theme.js`

`createTheme` MUI con:
- Paleta indigo/emerald/rose coherente con la iteración 4 (sólido, sin gradientes).
- `typography.fontFamily: 'Inter'` con pesos 400–800.
- `shape.borderRadius: 12` (redondeos suaves pero no excesivos).
- Overrides de `MuiAppBar`, `MuiButton`, `MuiCard`, `MuiTableCell` para unificar look.

### 4.5 Componentes reutilizables

- **`Layout.jsx`** — `AppBar sticky` + logo + navegación. En mobile colapsa a `IconButton` + `Drawer` (hamburger responsive).
- **`PageHeader.jsx`** — eyebrow + title + descripción + acciones; formato consistente en todas las páginas.
- **`StatCard.jsx`** — card de métrica con icono coloreado + label + valor + hint.
- **`PersonaSelect.jsx`** — `MUI Autocomplete` sobre las 42 personas (selección rápida con teclado).
- **`MovieAutocomplete.jsx`** — `MUI Autocomplete` asíncrono que consulta `/api/movies/` con debounce de 250 ms; muestra géneros como línea secundaria y spinner mientras carga.

### 4.6 Páginas

| Página | Componentes MUI clave |
|---|---|
| `Home.jsx` | `Grid`, `Paper`, `Chip`, `Button`, `Table` con headers en español, KPIs con `StatCard`, sección *Cómo funciona* con círculos numerados. |
| `Recommend.jsx` | Form con `PersonaSelect` + `TextField select` (algoritmo, con `helperText` del hint) + `TextField number` (n). Resultados: `List` con `ListItemAvatar` (ranking), `Rating` MUI (estrellas del score), `Chip` con latencia. Empty state + `LinearProgress` durante la request. |
| `Predict.jsx` | Form con `PersonaSelect` + `MovieAutocomplete`. Tabla comparativa de los 5 modelos con `Chip` verde "Más alta" en el ganador, latencia por modelo, descripción del modelo en la misma fila. |
| `Catalog.jsx` | `TextField` con `InputAdornment` (icono de búsqueda) + grid responsive de cards con `bayesian` score. |
| `Clusters.jsx` | Grid 2-col responsivo; cada cluster con avatar numerado, chips con cantidad de personas y películas, lista top-5. 6 colores rotando por `PALETTE`. |

### 4.7 Helpers

`frontend/src/api.js` expone:

```js
postJson(url, body)   // POST + JSON, throw Error(error) si !ok
getJson(url)          // GET, throw Error(...) si !ok
```

---

## 5. `requirements.txt` — cambios

Eliminados:
- `django-htmx==1.27.*`
- `django-browser-reload==1.21.*`
- `django-tailwind==4.4.*`
- `pytailwindcss==0.3.*`

Añadidos:
- `inertia-django==1.2.*`
- `django-vite==3.0.*`

Django y django-environ se conservan.

---

## 6. Cómo correr la app (checklist)

**Primera vez:**

```bash
cd OmniRec-Movies
source venv/bin/activate
pip install -r requirements.txt      # instala inertia-django y django-vite

cd app/frontend
npm install                          # 169 paquetes, ~30 s
npm run build                        # compila a app/frontend/dist/

cd ..
python manage.py migrate --noinput
python manage.py runserver
# Abrir http://127.0.0.1:8000/
```

**Modo desarrollo con HMR** (opcional — recarga instantánea al editar JSX):

```bash
# Terminal 1 — Vite dev server
cd app/frontend
npm run dev                          # http://127.0.0.1:5173

# Terminal 2 — Django apuntando al dev server
cd app
DJANGO_VITE_DEV_MODE=True python manage.py runserver
```

El layout detecta `dev_mode: True` y emite `<script type="module" src="http://127.0.0.1:5173/@vite/client">` + `<script type="module" src="http://127.0.0.1:5173/src/main.jsx">` en vez de los assets del manifest.

---

## 7. Verificación (2026-04-23, 18:21 La Paz)

```bash
cd app
../venv/bin/python manage.py check
# System check identified no issues (0 silenced).

../venv/bin/python manage.py migrate --noinput
# No migrations to apply.

../venv/bin/python manage.py runserver 127.0.0.1:8765 &
```

Resultados:

| Ruta | Método | HTTP | Observación |
|---|---|---|---|
| `/health/` | GET | 200 | `{"status":"ok","models_loaded":0,"sample_users":8126,"sample_movies":5915,"personas":42}` |
| `/` | GET | 200 | HTML con `<div id="app" data-page="…">` + `<script src="/static/assets/main-*.js">`. |
| `/recommend/` | GET | 200 | Página Inertia, componente `Recommend`. |
| `/predict/` | GET | 200 | Página Inertia, componente `Predict`. |
| `/catalog/` | GET | 200 | Página Inertia, componente `Catalog`. |
| `/clusters/` | GET | 200 | Página Inertia, componente `Clusters`. |
| `/recommend/` con header `X-Inertia: true` | GET | 200 | Respuesta JSON Inertia (component + props + url + version). |
| `/api/movies/?q=matrix&limit=3` | GET | 200 | 3 hits incluyendo *Matrix, The (1999)* con score 4.157. |
| `/api/recommend/` (POST JSON, user 30024 · SVD · n=3) | POST | 200 | Top-3 devuelto en **388.7 ms**, persona *"Fan de Acción · 1909 reseñas · Grupo 0"*. |
| `/api/predict/` (POST JSON, user 30024 · movie 2571) | POST | 200 | 5 filas: `baseline 4.157`, `knn 3.848`, `svd 3.969`, `nmf —`, `automl —` (KNN cargó 305 MB en 264 ms la primera vez). |

Build Vite:

```
✓ built in 1.14s
dist/assets/main-ClYrwoPn.js    684.52 kB │ gzip: 216.44 kB
dist/assets/main-BXH4fDIt.css    12.15 kB │ gzip:   1.44 kB
```

---

## 8. Decisiones de diseño

1. **Inertia.js en vez de SPA + REST.** Inertia reemplaza Django templates por componentes React pero mantiene el router y el auth de Django. No hay `/api/v1/pages/*`; cada path sigue siendo una vista Django. Esto permite reutilizar `registry.persona()` / `registry.cluster_summary()` como *props* sin exponerlos como JSON separado.
2. **Endpoints JSON sólo para acciones.** Las tres operaciones costosas (Top-N, predicción, búsqueda por título) sí son JSON porque se disparan repetidas veces en una misma página sin navegación, y los consumimos con `fetch`.
3. **MUI 6 sobre otros design systems.** MUI ofrece `Autocomplete` async con debounce, `DataGrid`-style tables y un theme token de primera. La alternativa (Chakra, Radix + Tailwind) requería reescribir más utilidades. MUI 6 ya soporta React 18 y el nuevo sistema de Grid v2 (`size={{xs:12,md:4}}`).
4. **Fuente Inter como módulo (@fontsource).** Evita la dependencia de Google Fonts en runtime. El bundle sirve los `.woff2` locales con hash.
5. **Sin SSR de Inertia.** `INERTIA_SSR_ENABLED` queda en `False`. La app es una demo interactiva, el SEO no es un requisito y el SSR requiere correr un Node server paralelo.
6. **`@csrf_exempt` en endpoints JSON.** La app no tiene mutaciones sobre datos persistentes; los endpoints sólo leen del `Registry`. Para producción con auth real habría que reincorporar CSRF tokens o migrar a `Authorization: Bearer`.
7. **Vite `base: '/static/'`.** El manifest hashea los paths con prefijo `/static/`, lo que coincide con `STATIC_URL` de Django; django-vite inyecta las URLs correctas sin configuración adicional.
8. **Tema MUI coherente con la iter 4.** Se conservan los colores sólidos (indigo, emerald, rose, amber) y se eliminan gradientes; la tipografía Inter queda como identidad visual.

---

## 9. Decisiones descartadas

- **Next.js o Remix.** Reemplazar Django por un framework JS romperia todo el `Registry` (pickles + parquets). Inertia permite mantener Django como backend y añadir React encima.
- **Tailwind + shadcn/ui.** Genera componentes por copia y es más liviano, pero requería portar cada card/botón a mano. MUI entrega la misma cantidad de componentes ready-to-use con menor esfuerzo.
- **`@mui/x-data-grid` para la tabla de métricas.** Se probó pero introduce un `~200 kB` extra para un caso de ≤5 filas; basta con `Table` básico con headers estilizados.
- **SSR.** Añadía complejidad operativa (proceso Node + coordinación con Django). La app es interna y la primera carga con bundle minificado ya es suficientemente rápida.
- **i18n runtime (react-intl).** El copy en español está hardcoded porque el alcance sigue siendo una demo académica en un único idioma.

---

## 10. Trazabilidad de archivos

**Creados (17):**

- `app/templates/layout.html`
- `app/frontend/package.json`
- `app/frontend/vite.config.js`
- `app/frontend/.gitignore`
- `app/frontend/src/main.jsx`
- `app/frontend/src/theme.js`
- `app/frontend/src/api.js`
- `app/frontend/src/components/Layout.jsx`
- `app/frontend/src/components/PageHeader.jsx`
- `app/frontend/src/components/StatCard.jsx`
- `app/frontend/src/components/PersonaSelect.jsx`
- `app/frontend/src/components/MovieAutocomplete.jsx`
- `app/frontend/src/pages/Home.jsx`
- `app/frontend/src/pages/Recommend.jsx`
- `app/frontend/src/pages/Predict.jsx`
- `app/frontend/src/pages/Catalog.jsx`
- `app/frontend/src/pages/Clusters.jsx`
- `reports/MIGRACION_INERTIA_REACT_MUI_2026-04-23.md` *(este archivo)*

**Modificados (6):**

- `app/core/settings.py` — inertia, django-vite, `INERTIA_LAYOUT`, `DJANGO_VITE`.
- `app/core/urls.py` — sin `__reload__/`.
- `app/apps/recommender/views.py` — `inertia.render(...)` + endpoints JSON.
- `app/apps/recommender/urls.py` — páginas + `/api/*`.
- `app/.env.example` — `DJANGO_VITE_DEV_MODE`.
- `requirements.txt` — bloque Django reemplazado.
- `reports/Proyecto.md` — cabecera con iter 6, historial y §11.

**Eliminados (12):**

- `app/apps/recommender/forms.py`
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
- `app/apps/recommender/templates/recommender/partials/movie_picker_results.html`
- `app/apps/recommender/static/recommender/css/custom.css`

---

## 11. Próximos pasos naturales

1. **Code-splitting.** El bundle actual pesa ~684 kB (gzip 216 kB). Aplicar `lazy(() => import(...))` en las páginas reduce el first paint.
2. **Tests E2E.** Playwright + pytest: abrir `/`, hacer click en *Empezar a recomendar*, verificar que el Top-5 renderiza.
3. **Modo oscuro.** Duplicar el theme MUI (`dark`) y conmutar con un `IconButton` en el `AppBar`.
4. **SSR de Inertia.** Sólo si se quiere mejorar el LCP sin depender del bundle cliente.
5. **Auth real** con `django.contrib.auth` + un form Inertia (`useForm` + POST).
6. **Deploy**: Dockerfile multi-stage (Node para compilar el front, Python para runtime) + gunicorn + whitenoise.

