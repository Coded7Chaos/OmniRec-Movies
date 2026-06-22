"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Sparkles, Tag } from "lucide-react";
import { genreIcon, genreLabel, posterColor } from "@/lib/poster";
import type { SemanticResult } from "@/lib/types";

/**
 * Tarjeta de resultado de búsqueda semántica (Fase 4). A diferencia de
 * MovieCard, destaca la *evidencia de pertinencia*: los tags genome que
 * explican por qué la película encaja con la consulta, más la afinidad coseno.
 */
export default function SearchResultCard({
  result,
  index = 0,
}: {
  result: SemanticResult;
  index?: number;
}) {
  const Icon = genreIcon(result.genres);
  const affinity = Math.round(result.similarity * 100);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5), ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <Link href={`/pelicula/${result.movieId}`} className="block">
        <div className="overflow-hidden rounded-xl bg-night-800 ring-1 ring-white/10 transition-shadow duration-300 group-hover:ring-brand-500/60">
          {/* Cabecera tipo póster plano */}
          <div
            className="relative flex aspect-video items-end p-3"
            style={{ background: posterColor(result.movieId, result.genres) }}
          >
            <span className="absolute top-2.5 left-2.5 grid h-7 w-7 place-items-center rounded-full bg-black/45 text-xs font-bold text-white">
              {index + 1}
            </span>
            <span className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-brand-500/95 px-2 py-0.5 text-[11px] font-bold text-white shadow">
              <Sparkles className="h-3 w-3" />
              {affinity}%
            </span>
            <Icon className="absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-white/35" strokeWidth={1.5} />
            <h3 className="relative line-clamp-2 text-sm font-semibold text-white drop-shadow">
              {result.title}
              {result.year && <span className="font-normal text-white/70"> ({result.year})</span>}
            </h3>
          </div>

          {/* Cuerpo: géneros + evidencia */}
          <div className="space-y-2.5 p-3">
            <div className="flex flex-wrap gap-1">
              {result.genres.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/55 ring-1 ring-white/10"
                >
                  {genreLabel(g)}
                </span>
              ))}
            </div>

            {result.evidence.length > 0 ? (
              <div>
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
              <p className="text-[11px] text-white/35">
                Sin tags temáticos (película fuera del subconjunto genome).
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
