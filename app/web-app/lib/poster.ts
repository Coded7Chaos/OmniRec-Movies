/**
 * Arte de póster generado: el dataset MovieLens no incluye imágenes, así que
 * cada película recibe un póster plano y determinista (color sólido apagado
 * según su género principal + icono + tipografía). Mismo id => mismo arte.
 */

import type { LucideIcon } from "lucide-react";
import {
  Clapperboard,
  Compass,
  Drama,
  Flame,
  Ghost,
  Heart,
  Landmark,
  Laugh,
  Music,
  Palette,
  Rocket,
  Search,
  Shield,
  Swords,
  Video,
  Wand2,
  Baby,
} from "lucide-react";

export const GENRE_ICONS: Record<string, LucideIcon> = {
  Action: Flame,
  Adventure: Compass,
  Animation: Palette,
  Children: Baby,
  Comedy: Laugh,
  Crime: Shield,
  Documentary: Video,
  Drama: Drama,
  Fantasy: Wand2,
  "Film-Noir": Search,
  Horror: Ghost,
  IMAX: Clapperboard,
  Musical: Music,
  Mystery: Search,
  Romance: Heart,
  "Sci-Fi": Rocket,
  Thriller: Swords,
  War: Landmark,
  Western: Landmark,
};

export const GENRE_LABELS_ES: Record<string, string> = {
  Action: "Acción",
  Adventure: "Aventura",
  Animation: "Animación",
  Children: "Infantil",
  Comedy: "Comedia",
  Crime: "Crimen",
  Documentary: "Documental",
  Drama: "Drama",
  Fantasy: "Fantasía",
  "Film-Noir": "Cine negro",
  Horror: "Terror",
  IMAX: "IMAX",
  Musical: "Musical",
  Mystery: "Misterio",
  Romance: "Romance",
  "Sci-Fi": "Ciencia ficción",
  Thriller: "Suspenso",
  War: "Bélica",
  Western: "Western",
};

/* Colores sólidos, oscuros y desaturados por género principal (sin neón). */
const GENRE_COLORS: Record<string, string> = {
  Action: "#43302b",
  Adventure: "#3d3a2c",
  Animation: "#2e3d3e",
  Children: "#3a3d2c",
  Comedy: "#42392a",
  Crime: "#33313b",
  Documentary: "#2f3a40",
  Drama: "#3b2f33",
  Fantasy: "#363043",
  "Film-Noir": "#2a2d33",
  Horror: "#2c3430",
  IMAX: "#2e3742",
  Musical: "#41323c",
  Mystery: "#2f3340",
  Romance: "#452f36",
  "Sci-Fi": "#2c3845",
  Thriller: "#363039",
  War: "#3a352c",
  Western: "#443a2d",
};

/* Fallback determinista para películas sin género reconocido. */
const FALLBACK_COLORS = ["#33343a", "#3a3236", "#30383a", "#393830"];

/** Variación sutil y determinista de tono por película, dentro de la misma
 *  familia de color del género (evita filas monótonas sin salir de la paleta
 *  sobria). */
function shiftTone(hex: string, movieId: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // -10, -5, 0, +6, +12 puntos de luminosidad según el id
  const delta = [-10, -5, 0, 6, 12][movieId % 5];
  const clamp = (v: number) => Math.max(18, Math.min(96, v + delta));
  const to2 = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

export function posterColor(movieId: number, genres: string[]): string {
  for (const g of genres) {
    const c = GENRE_COLORS[g];
    if (c) return shiftTone(c, movieId);
  }
  return shiftTone(FALLBACK_COLORS[movieId % FALLBACK_COLORS.length], movieId * 7);
}

/* ------------------------------------------------------------------ *
 * Imágenes reales de pósters.
 *
 * IMDb no ofrece una API pública gratuita y su scraping está prohibido por
 * sus términos de uso. Usamos el CDN público de Metahub (el servicio de
 * imágenes de Stremio), que sirve pósters y fondos por ID de IMDb sin API
 * key — y MovieLens ya trae el imdbId de cada película en links.csv.
 * Si la imagen no existe (404), la UI cae al póster procedural de abajo.
 * ------------------------------------------------------------------ */

export type PosterSize = "small" | "medium" | "big";

export function imdbTag(imdbId: number | null | undefined): string | null {
  if (!imdbId) return null;
  return `tt${String(imdbId).padStart(7, "0")}`;
}

export function posterImageUrl(
  imdbId: number | null | undefined,
  size: PosterSize = "medium",
): string | null {
  const tag = imdbTag(imdbId);
  return tag ? `https://images.metahub.space/poster/${size}/${tag}/img` : null;
}

export function backdropImageUrl(
  imdbId: number | null | undefined,
  size: "medium" | "large" = "large",
): string | null {
  const tag = imdbTag(imdbId);
  return tag ? `https://images.metahub.space/background/${size}/${tag}/img` : null;
}

export function genreIcon(genres: string[]): LucideIcon {
  for (const g of genres) {
    if (GENRE_ICONS[g]) return GENRE_ICONS[g];
  }
  return Clapperboard;
}

export function genreLabel(genre: string): string {
  return GENRE_LABELS_ES[genre] ?? genre;
}
