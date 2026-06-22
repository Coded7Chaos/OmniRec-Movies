"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Sparkles, Tag } from "lucide-react";
import MoviePoster from "./MoviePoster";
import { genreLabel } from "@/lib/poster";
import type { Movie, SemanticResult } from "@/lib/types";

/**
 * Tarjeta de resultado de búsqueda semántica (Fase 4). Muestra el póster real
 * (cuando ya se resolvió el imdbId de la película) con los badges de ranking y
 * afinidad superpuestos, y debajo la *evidencia de pertinencia*: los tags
 * genome que explican por qué encaja con la consulta.
 */
export default function SearchResultCard({
  result,
  imdbId,
  index = 0,
}: {
  result: SemanticResult;
  imdbId?: number | null;
  index?: number;
}) {
  const affinity = Math.round(result.similarity * 100);

  // MoviePoster espera un Movie; construimos uno mínimo a partir del resultado
  // semántico + el imdbId resuelto (si aún no llegó, cae al arte procedural).
  const movieForPoster: Movie = {
    movieId: result.movieId,
    title: result.title,
    originalTitle: result.title,
    year: result.year,
    genres: result.genres,
    avgRating: null,
    numRatings: result.numRatings,
    bayesianScore: 0,
    tmdbId: null,
    imdbId: imdbId ?? null,
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5), ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col"
    >
      <Link href={`/pelicula/${result.movieId}`} className="block">
        <div className="relative aspect-2/3 overflow-hidden rounded-xl ring-1 ring-white/10 transition-all duration-300 group-hover:ring-brand-500/60 group-hover:ring-2">
          <MoviePoster movie={movieForPoster} size="medium" />

          {/* Posición en el ranking */}
          <span className="absolute top-2.5 left-2.5 grid h-7 w-7 place-items-center rounded-full bg-night-950/70 text-xs font-bold text-white ring-1 ring-white/15 backdrop-blur">
            {index + 1}
          </span>

          {/* Afinidad coseno */}
          <span className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-brand-500/95 px-2 py-0.5 text-[11px] font-bold text-white shadow-lg shadow-black/30">
            <Sparkles className="h-3 w-3" />
            {affinity}%
          </span>
        </div>
      </Link>

      {/* Título + año */}
      <Link href={`/pelicula/${result.movieId}`} className="mt-2.5 block">
        <h3 className="line-clamp-2 text-sm font-semibold text-white transition-colors group-hover:text-brand-300">
          {result.title}
          {result.year && <span className="font-normal text-white/55"> ({result.year})</span>}
        </h3>
      </Link>

      {/* Géneros */}
      <div className="mt-2 flex flex-wrap gap-1">
        {result.genres.slice(0, 3).map((g) => (
          <span
            key={g}
            className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/55 ring-1 ring-white/10"
          >
            {genreLabel(g)}
          </span>
        ))}
      </div>

      {/* Evidencia de pertinencia */}
      {result.evidence.length > 0 ? (
        <div className="mt-2.5">
          <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold tracking-wider text-gold-500 uppercase">
            <Tag className="h-3 w-3" /> Por qué encaja
          </p>
          <div className="flex flex-wrap gap-1">
            {result.evidence.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-brand-500/15 px-2 py-0.5 text-[11px] font-medium text-brand-200 ring-1 ring-brand-500/25"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-2.5 text-[11px] text-white/35">
          Sin tags temáticos (película fuera del subconjunto genome).
        </p>
      )}
    </motion.article>
  );
}
