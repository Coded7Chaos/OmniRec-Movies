"use client";

/* eslint-disable @next/next/no-img-element --
   Los pósters vienen de un CDN externo ya optimizado (webp por tamaño);
   proxyearlos por el optimizador de Next solo añadiría latencia. */

import { useState } from "react";
import PosterArt from "./PosterArt";
import { posterImageUrl, type PosterSize } from "@/lib/poster";
import type { Movie } from "@/lib/types";

/**
 * Póster real de la película (CDN de Metahub vía imdbId) con degradado
 * elegante: debajo siempre está el arte procedural, y la foto aparece con
 * un fundido cuando carga. Si no existe imagen (404), queda el arte plano.
 */
export default function MoviePoster({
  movie,
  size = "medium",
  className = "",
}: {
  movie: Movie;
  size?: PosterSize;
  className?: string;
}) {
  const src = posterImageUrl(movie.imdbId, size);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <PosterArt movie={movie} />
      {src && !failed && (
        <img
          src={src}
          alt={`Póster de ${movie.title}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
