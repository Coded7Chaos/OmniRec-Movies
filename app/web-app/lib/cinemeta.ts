/**
 * Cinemeta — metadatos enriquecidos de cada película (sinopsis, reparto,
 * dirección, tráiler, duración, premios…). Es el addon de catálogo de Stremio:
 * API pública, gratuita, sin API key, indexada por ID de IMDb (el mismo que
 * MovieLens ya provee en links.csv y que usamos para los pósters de Metahub).
 *
 *   GET https://v3-cinemeta.strem.io/meta/movie/tt0114709.json
 *
 * Si una película no tiene ficha (o la red falla), devolvemos `null` y la UI
 * cae con elegancia a los datos base del modelo. Cacheamos en memoria para no
 * repetir la petición al navegar entre películas (las fichas casi no cambian).
 */

import { imdbTag } from "./poster";

export interface MovieMeta {
  name: string | null;
  description: string | null;
  imdbRating: string | null;
  runtimeMinutes: number | null;
  released: string | null; // ISO date
  country: string | null;
  awards: string | null;
  cast: string[];
  director: string[];
  writer: string[];
  genres: string[];
  trailerYouTubeId: string | null;
  logo: string | null;
  background: string | null;
}

/* ---- crudo tal cual lo entrega Cinemeta (campos opcionales/heterogéneos) ---- */
interface RawTrailer {
  source?: string;
  type?: string;
}
interface RawTrailerStream {
  ytId?: string;
  title?: string;
}
interface RawMeta {
  name?: string;
  description?: string;
  imdbRating?: string;
  runtime?: string; // "81 min"
  released?: string;
  country?: string;
  awards?: string;
  cast?: string[];
  director?: string[];
  writer?: string[];
  genre?: string[];
  genres?: string[];
  trailers?: RawTrailer[];
  trailerStreams?: RawTrailerStream[];
  logo?: string;
  background?: string;
}

const BASE = "https://v3-cinemeta.strem.io/meta/movie";
const cache = new Map<string, MovieMeta | null>();

function toArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

function parseRuntime(runtime: string | undefined): number | null {
  if (!runtime) return null;
  const match = runtime.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function normalize(raw: RawMeta): MovieMeta {
  const trailerYouTubeId =
    raw.trailerStreams?.find((t) => t.ytId)?.ytId ??
    raw.trailers?.find((t) => t.source)?.source ??
    null;

  return {
    name: raw.name ?? null,
    description: raw.description?.trim() || null,
    imdbRating: raw.imdbRating ?? null,
    runtimeMinutes: parseRuntime(raw.runtime),
    released: raw.released ?? null,
    country: raw.country ?? null,
    awards: raw.awards?.trim() || null,
    cast: toArray(raw.cast),
    director: toArray(raw.director),
    writer: toArray(raw.writer),
    genres: toArray(raw.genres ?? raw.genre),
    trailerYouTubeId,
    logo: raw.logo ?? null,
    background: raw.background ?? null,
  };
}

/**
 * Obtiene la ficha enriquecida de Cinemeta para un id de IMDb. Resiliente:
 * cualquier fallo (404/red/JSON inválido) resuelve a `null`, nunca lanza
 * (salvo aborto de la petición, que se propaga para que el caller lo ignore).
 */
export async function fetchMovieMeta(
  imdbId: number | null | undefined,
  signal?: AbortSignal,
): Promise<MovieMeta | null> {
  const tag = imdbTag(imdbId);
  if (!tag) return null;
  if (cache.has(tag)) return cache.get(tag) ?? null;

  try {
    const res = await fetch(`${BASE}/${tag}.json`, { signal });
    if (!res.ok) {
      cache.set(tag, null);
      return null;
    }
    const data = (await res.json()) as { meta?: RawMeta };
    if (!data?.meta) {
      cache.set(tag, null);
      return null;
    }
    const meta = normalize(data.meta);
    cache.set(tag, meta);
    return meta;
  } catch (err) {
    // El aborto al desmontar/cambiar de película no es un error real.
    if (signal?.aborted) throw err;
    cache.set(tag, null);
    return null;
  }
}

/* --------------------------- helpers de presentación --------------------------- */

/** "1995-11-22T00:00:00.000Z" → "22 nov 1995" */
export function formatReleaseDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** 142 → "2 h 22 min" */
export function formatRuntime(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function youTubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
