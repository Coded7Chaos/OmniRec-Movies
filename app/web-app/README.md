# OmniCine — Frontend (Next.js 16)

Aplicación web de cine comercial para el sistema de recomendación
**OmniRec-Movies**. Consume el backend FastAPI de `app/backend/`.

## Puesta en marcha

```bash
npm install
npm run dev      # http://localhost:3000
```

Requiere el backend corriendo (por defecto en `http://localhost:8000`); si usa
otra URL, define `NEXT_PUBLIC_API_URL` en `.env.local`.

## Páginas

| Ruta | Qué hace |
|---|---|
| `/` | Portada: marquesina rotativa + filas (Para ti, Los más aclamados, por género). |
| `/cartelera` | Catálogo completo con búsqueda (debounce), chips de género, orden y "cargar más". |
| `/pelicula/[id]` | Ficha: calificación con estrellas, afinidad estimada por el SVD, similares por embeddings. |
| `/para-ti` | Top-N personalizado (re-ranking SVD) + comunidad de gustos asignada por clustering. |
| `/perfil` | Estadísticas, persona, películas calificadas y "mi lista". |
| `/login` · `/registro` | Autenticación JWT contra el backend. |

## Decisiones de diseño

- **Tema sobrio de cine**: diseño plano sin gradientes ni colores saturados —
  neutros oscuros, rojo institucional (`brand`), ámbar apagado (`gold`),
  tipografías Bebas Neue (display) + Outfit (UI). Tokens definidos con
  `@theme` de Tailwind CSS v4 en `app/globals.css`.
- **Imágenes reales** (`components/MoviePoster.tsx`): IMDb no ofrece API
  pública gratuita y su scraping está prohibido por sus términos, así que los
  pósters y fondos se cargan del CDN público de Metahub (Stremio) usando el
  `imdbId` que MovieLens trae en `links.csv` — sin API key. Si una imagen no
  existe (404), la tarjeta cae con un fundido al **póster procedural**
  (`components/PosterArt.tsx`): arte plano determinista por género/movieId.
  Alternativa con key gratuita: la API de TMDB (`links.csv` también trae
  `tmdbId`).
- **Animaciones** con `motion` (Framer Motion): transiciones de la marquesina,
  aparición escalonada de tarjetas, pill animada del nav, micro-interacciones.
- **Feedback dual** (`lib/store.tsx`): con sesión todo va al servidor; como
  invitado las calificaciones y la lista se guardan en `localStorage` y los
  endpoints `/guest` del backend las usan para personalizar igual. Al crear
  cuenta o iniciar sesión, el feedback local se migra automáticamente
  (`POST /api/ratings/sync`).

## Estructura

```
app/            # rutas (App Router; páginas client que consumen el API)
components/     # Navbar, Hero, MovieRow, MovieCard, PosterArt, StarRating, …
lib/            # api.ts (cliente tipado), store.tsx (estado global), poster.ts, types.ts
```
