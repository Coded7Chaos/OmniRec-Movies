"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Info, Star, Ticket, Users } from "lucide-react";
import { backdropImageUrl, genreIcon, genreLabel, posterColor } from "@/lib/poster";
import type { Movie } from "@/lib/types";

const ROTATE_MS = 8000;

/* eslint-disable @next/next/no-img-element --
   Fondos del CDN externo ya optimizados; no proxyear por Next. */

/** Fondo fotográfico de la destacada; si no existe, queda el color plano. */
function Backdrop({ movie }: { movie: Movie }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = backdropImageUrl(movie.imdbId, "large");
  if (!src || failed) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
        loaded ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

/** Marquesina principal: rota las películas destacadas con un crossfade plano. */
export default function Hero({ movies }: { movies: Movie[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (movies.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % movies.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [movies.length]);

  if (movies.length === 0) return null;
  const movie = movies[index];
  const Icon = genreIcon(movie.genres);

  return (
    <section className="relative h-[72vh] min-h-[460px] w-full overflow-hidden border-b border-white/10">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={movie.movieId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="absolute inset-0"
          style={{ background: posterColor(movie.movieId, movie.genres) }}
        >
          <Icon
            className="absolute top-1/2 right-[8%] hidden h-[380px] w-[380px] -translate-y-1/2 text-white/[0.05] lg:block"
            strokeWidth={0.6}
          />
          <Backdrop movie={movie} />
        </motion.div>
      </AnimatePresence>

      {/* Velo plano para legibilidad del texto */}
      <div className="absolute inset-0 bg-night-950/60" />

      <div className="relative mx-auto flex h-full max-w-[1600px] flex-col justify-end px-4 pb-16 sm:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={movie.movieId}
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-gold-400 uppercase">
              <Ticket className="h-4 w-4" /> Destacada de la semana
            </p>
            <h1
              className="text-4xl leading-none text-white sm:text-6xl lg:text-7xl"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "0.03em" }}
            >
              {movie.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/75">
              {movie.year && <span className="font-semibold text-white/95">{movie.year}</span>}
              {movie.avgRating != null && (
                <span className="flex items-center gap-1 rounded-md bg-night-950/60 px-2.5 py-0.5 font-semibold text-gold-400 ring-1 ring-white/15">
                  <Star className="h-3.5 w-3.5" fill="currentColor" /> {movie.avgRating.toFixed(1)}
                </span>
              )}
              <span className="flex items-center gap-1 text-white/60">
                <Users className="h-3.5 w-3.5" />
                {Intl.NumberFormat("es").format(movie.numRatings)} votos
              </span>
              <span className="text-white/60">
                {movie.genres.slice(0, 3).map(genreLabel).join(" · ")}
              </span>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/pelicula/${movie.movieId}`}
                className="flex items-center gap-2 rounded-lg bg-brand-500 px-7 py-3 text-sm font-bold text-white transition-colors duration-200 hover:bg-brand-400 active:scale-[0.98]"
              >
                <Ticket className="h-4 w-4" />
                Ver detalles
              </Link>
              <Link
                href="/cartelera"
                className="flex items-center gap-2 rounded-lg bg-night-950/55 px-7 py-3 text-sm font-semibold text-white ring-1 ring-white/25 transition-colors duration-200 hover:bg-night-950/80 active:scale-[0.98]"
              >
                <Info className="h-4 w-4" />
                Explorar cartelera
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Indicadores */}
        <div className="mt-8 flex gap-2">
          {movies.map((m, i) => (
            <button
              key={m.movieId}
              type="button"
              aria-label={`Destacada ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-8 bg-white" : "w-3 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
