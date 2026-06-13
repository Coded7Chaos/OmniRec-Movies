"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Bookmark,
  ExternalLink,
  Popcorn,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import MoviePoster from "@/components/MoviePoster";
import StarRating from "@/components/StarRating";
import MovieRow from "@/components/MovieRow";
import { RowSkeleton } from "@/components/Skeletons";
import { genreLabel, posterColor } from "@/lib/poster";
import type { Movie } from "@/lib/types";

export default function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const movieId = Number(id);
  const { ready, token, ratings, ratingEntries, watchlist, rateMovie, removeRating, toggleWatchlist } =
    useStore();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [similar, setSimilar] = useState<Movie[] | null>(null);
  const [affinity, setAffinity] = useState<number | null>(null);
  const [notFound, setNotFound] = useState(false);

  const userRating = ratings[movieId];
  const inWatchlist = watchlist.includes(movieId);

  useEffect(() => {
    let cancelled = false;
    setMovie(null);
    setSimilar(null);
    api
      .movie(movieId)
      .then((m) => !cancelled && setMovie(m))
      .catch(() => !cancelled && setNotFound(true));
    api
      .similar(movieId, 14)
      .then((s) => !cancelled && setSimilar(s.results))
      .catch(() => !cancelled && setSimilar([]));
    return () => {
      cancelled = true;
    };
  }, [movieId]);

  // Afinidad estimada por el SVD (solo si hay historial y aún no la calificó)
  useEffect(() => {
    if (!ready || userRating != null || ratingEntries.length === 0) {
      setAffinity(null);
      return;
    }
    let cancelled = false;
    api
      .affinity(movieId, token, ratingEntries)
      .then((r) => !cancelled && setAffinity(r.predictedRating))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, movieId, token, userRating == null, ratingEntries.length]);

  if (notFound) {
    return (
      <div className="grid min-h-[70vh] place-items-center text-center">
        <div>
          <Popcorn className="mx-auto h-12 w-12 text-white/15" />
          <p className="mt-4 text-white/60">Esta película no está en nuestro catálogo.</p>
          <Link href="/cartelera" className="mt-2 inline-block text-sm text-brand-300 hover:text-brand-400">
            Volver a la cartelera
          </Link>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-10 px-4 pt-24 sm:px-8">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="skeleton aspect-2/3 w-64 shrink-0 rounded-2xl" />
          <div className="flex-1 space-y-4 pt-4">
            <div className="skeleton h-12 w-2/3 rounded-lg" />
            <div className="skeleton h-4 w-1/3 rounded" />
            <div className="skeleton h-24 w-full max-w-xl rounded-lg" />
          </div>
        </div>
        <RowSkeleton />
      </div>
    );
  }

  return (
    <div className="relative pb-8">
      {/* Banda superior plana con el color del género */}
      <div
        className="absolute inset-x-0 top-0 h-72 border-b border-white/10 opacity-60"
        style={{ background: posterColor(movie.movieId, movie.genres) }}
      />

      <div className="relative mx-auto max-w-[1600px] px-4 pt-24 sm:px-8">
        <Link
          href="/cartelera"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Cartelera
        </Link>

        <div className="flex flex-col gap-10 md:flex-row">
          {/* Póster */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-56 shrink-0 sm:w-64"
          >
            <div className="aspect-2/3 overflow-hidden rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-white/15">
              <MoviePoster movie={movie} size="big" />
            </div>
          </motion.div>

          {/* Ficha */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0 flex-1"
          >
            <h1
              className="text-4xl leading-tight text-white sm:text-6xl"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "0.03em" }}
            >
              {movie.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/60">
              {movie.year && <span className="font-semibold text-white/90">{movie.year}</span>}
              {movie.avgRating != null && (
                <span className="flex items-center gap-1 rounded-full bg-gold-500/15 px-2.5 py-0.5 font-semibold text-gold-400 ring-1 ring-gold-500/30">
                  <Star className="h-3.5 w-3.5" fill="currentColor" />
                  {movie.avgRating.toFixed(2)} / 5
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {Intl.NumberFormat("es").format(movie.numRatings)} calificaciones
              </span>
              {movie.imdbId && (
                <a
                  href={`https://www.imdb.com/title/tt${String(movie.imdbId).padStart(7, "0")}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-white/45 transition-colors hover:text-gold-400"
                >
                  IMDb <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {movie.genres.map((g) => (
                <Link
                  key={g}
                  href={`/cartelera?genre=${encodeURIComponent(g)}`}
                  className="rounded-full bg-white/8 px-3 py-1 text-xs font-medium text-white/70 ring-1 ring-white/15 transition-all hover:bg-brand-500/20 hover:text-brand-300 hover:ring-brand-500/50"
                >
                  {genreLabel(g)}
                </Link>
              ))}
            </div>

            {/* Afinidad estimada por el modelo */}
            {affinity != null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-brand-500/10 px-5 py-3 ring-1 ring-brand-500/40"
              >
                <Sparkles className="h-6 w-6 text-brand-400" />
                <div>
                  <p className="text-lg font-bold text-white">
                    {affinity.toFixed(1)} <span className="text-sm font-normal text-white/50">/ 5</span>
                  </p>
                  <p className="text-xs text-white/50">
                    Afinidad estimada por el modelo SVD según tus gustos
                  </p>
                </div>
              </motion.div>
            )}

            {/* Calificar */}
            <div className="mt-8 rounded-2xl bg-night-800/80 p-5 ring-1 ring-white/10 backdrop-blur">
              <p className="text-sm font-semibold text-white/85">
                {userRating != null ? "Tu calificación" : "¿Ya la viste? Califícala"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <StarRating
                  value={userRating}
                  onRate={(r) => rateMovie(movie.movieId, r)}
                  size={30}
                />
                {userRating != null && (
                  <>
                    <span className="text-sm font-bold text-gold-400">{userRating.toFixed(1)}</span>
                    <button
                      type="button"
                      onClick={() => removeRating(movie.movieId)}
                      className="text-xs text-white/40 underline-offset-2 transition-colors hover:text-brand-300 hover:underline"
                    >
                      Quitar
                    </button>
                  </>
                )}
              </div>
              <p className="mt-3 text-[11px] text-white/35">
                {token
                  ? "Tus calificaciones alimentan tus recomendaciones personalizadas."
                  : "Sin sesión, tu feedback se guarda en este dispositivo y personaliza igual tus recomendaciones."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleWatchlist(movie.movieId)}
              className={`mt-4 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                inWatchlist
                  ? "bg-gold-500 text-night-950 hover:bg-gold-400"
                  : "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
              }`}
            >
              <Bookmark className="h-4 w-4" fill={inWatchlist ? "currentColor" : "none"} />
              {inWatchlist ? "En mi lista" : "Guardar en mi lista"}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Similares */}
      <div className="mt-16">
        {similar === null ? (
          <RowSkeleton />
        ) : (
          <MovieRow
            title="Si te gustó esta, mira…"
            subtitle="Vecinas en el espacio latente del modelo SVD"
            movies={similar}
          />
        )}
      </div>
    </div>
  );
}
