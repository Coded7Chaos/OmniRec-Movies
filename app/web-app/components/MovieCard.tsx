"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Bookmark, Sparkles, Star, Users } from "lucide-react";
import MoviePoster from "./MoviePoster";
import StarRating from "./StarRating";
import { useStore } from "@/lib/store";
import { genreLabel } from "@/lib/poster";
import type { Movie } from "@/lib/types";

export default function MovieCard({
  movie,
  index = 0,
  fluid = false,
}: {
  movie: Movie;
  index?: number;
  /** true: ocupa el ancho de su celda (grillas); false: ancho fijo (carruseles) */
  fluid?: boolean;
}) {
  const { ratings, watchlist, rateMovie, toggleWatchlist } = useStore();
  const userRating = ratings[movie.movieId];
  const inWatchlist = watchlist.includes(movie.movieId);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className={`group relative ${fluid ? "w-full" : "w-40 shrink-0 sm:w-44"}`}
    >
      <Link href={`/pelicula/${movie.movieId}`} className="block">
        <motion.div
          whileHover={{ y: -6, scale: 1.03 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className="relative aspect-2/3 overflow-hidden rounded-xl ring-1 ring-white/10 shadow-lg shadow-black/50 group-hover:ring-brand-500/60 transition-shadow duration-300"
        >
          <MoviePoster movie={movie} size="small" />

          {/* Predicción del modelo */}
          {movie.predictedRating != null && (
            <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-brand-500/95 px-2 py-0.5 text-[11px] font-bold text-white shadow-md">
              <Sparkles className="h-3 w-3" />
              {movie.predictedRating.toFixed(1)}
            </span>
          )}

          {/* Velo inferior con metadatos al hover */}
          <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-night-950/85 p-3 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="flex items-center gap-2 text-[11px] text-white/80">
              {movie.avgRating != null && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-gold-500" fill="currentColor" />
                  {movie.avgRating.toFixed(1)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {Intl.NumberFormat("es").format(movie.numRatings)}
              </span>
            </div>
          </div>
        </motion.div>
      </Link>

      <button
        type="button"
        onClick={() => toggleWatchlist(movie.movieId)}
        aria-label={inWatchlist ? "Quitar de mi lista" : "Guardar en mi lista"}
        className={`absolute top-2 left-2 rounded-full p-1.5 backdrop-blur-md transition-all duration-200 hover:scale-110 ${
          inWatchlist
            ? "bg-gold-500 text-night-950"
            : "bg-black/45 text-white/80 opacity-0 group-hover:opacity-100"
        }`}
      >
        <Bookmark className="h-3.5 w-3.5" fill={inWatchlist ? "currentColor" : "none"} />
      </button>

      <div className="mt-2 space-y-1 px-0.5">
        <Link href={`/pelicula/${movie.movieId}`}>
          <h3 className="line-clamp-1 text-sm font-semibold text-white/90 transition-colors hover:text-brand-300">
            {movie.title}
          </h3>
        </Link>
        <p className="line-clamp-1 text-[11px] text-white/40">
          {movie.year ?? "—"} · {movie.genres.slice(0, 2).map(genreLabel).join(" · ")}
        </p>
        <StarRating
          value={userRating}
          onRate={(r) => rateMovie(movie.movieId, r)}
          size={15}
        />
      </div>
    </motion.article>
  );
}
