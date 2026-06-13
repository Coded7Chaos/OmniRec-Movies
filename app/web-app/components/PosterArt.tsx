"use client";

import { genreIcon, genreLabel, posterColor } from "@/lib/poster";
import type { Movie } from "@/lib/types";

/**
 * Póster plano generado (el dataset no trae imágenes): color sólido apagado
 * según el género principal + icono + tipografía. Determinista por movieId.
 */
export default function PosterArt({
  movie,
  className = "",
  showTitle = true,
}: {
  movie: Movie;
  className?: string;
  showTitle?: boolean;
}) {
  const Icon = genreIcon(movie.genres);

  return (
    <div
      className={`relative flex h-full w-full flex-col justify-between overflow-hidden p-3 ${className}`}
      style={{ background: posterColor(movie.movieId, movie.genres) }}
    >
      <div className="flex items-center justify-between text-white/45">
        <Icon className="h-6 w-6" strokeWidth={1.5} />
        {movie.year && (
          <span className="font-mono text-[10px] tracking-widest">{movie.year}</span>
        )}
      </div>

      <Icon
        className="pointer-events-none absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 text-white/[0.06]"
        strokeWidth={1}
      />

      {showTitle && (
        <div className="relative">
          <p
            className="line-clamp-4 text-[13px] leading-tight font-semibold tracking-wide text-white/95 uppercase"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.06em" }}
          >
            {movie.title}
          </p>
          {movie.genres[0] && (
            <p className="mt-1 text-[9px] font-medium tracking-[0.18em] text-white/40 uppercase">
              {genreLabel(movie.genres[0])}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
