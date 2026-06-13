"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Bookmark,
  CalendarDays,
  CloudOff,
  Popcorn,
  Star,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import MovieCard from "@/components/MovieCard";
import PersonaCard from "@/components/PersonaCard";
import { GridSkeleton } from "@/components/Skeletons";
import { genreLabel } from "@/lib/poster";
import type { Movie, ProfileResponse } from "@/lib/types";

export default function ProfilePage() {
  const { ready, token, user, ratings, ratingEntries, watchlist } = useStore();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [ratedMovies, setRatedMovies] = useState<Movie[] | null>(null);
  const [watchlistMovies, setWatchlistMovies] = useState<Movie[] | null>(null);
  const [tab, setTab] = useState<"ratings" | "watchlist">("ratings");

  const ratedCount = ratingEntries.length;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    api
      .profile(token, ratingEntries)
      .then((p) => !cancelled && setProfile(p))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token, ratedCount]);

  // Películas calificadas y mi lista (con sesión: del servidor; invitado: por id local)
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const loadMovies = async () => {
      if (token) {
        const [r, w] = await Promise.all([api.myRatings(token), api.myWatchlist(token)]);
        if (cancelled) return;
        setRatedMovies(r.results);
        setWatchlistMovies(w.results);
      } else {
        const ratedIds = ratingEntries.map((e) => e.movieId);
        const [rated, listed] = await Promise.all([
          Promise.all(ratedIds.map((id) => api.movie(id).catch(() => null))),
          Promise.all(watchlist.map((id) => api.movie(id).catch(() => null))),
        ]);
        if (cancelled) return;
        setRatedMovies(rated.filter((m): m is Movie => m !== null));
        setWatchlistMovies(listed.filter((m): m is Movie => m !== null));
      }
    };
    loadMovies().catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token, ratedCount, watchlist.length]);

  const stats = profile?.stats;
  const shown = tab === "ratings" ? ratedMovies : watchlistMovies;

  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-24 pb-12 sm:px-8">
      {/* Cabecera */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-center gap-5"
      >
        <span className="grid h-20 w-20 place-items-center rounded-2xl bg-brand-600 text-3xl font-bold text-white ring-1 ring-white/10">
          {user ? user.username.slice(0, 2).toUpperCase() : <UserRound className="h-9 w-9" />}
        </span>
        <div>
          <h1
            className="text-4xl text-white"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}
          >
            {user ? user.username : "Invitado"}
          </h1>
          {user ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/45">
              <CalendarDays className="h-3.5 w-3.5" />
              {user.email}
              {profile?.user?.memberSince &&
                ` · miembro desde ${new Date(profile.user.memberSince).toLocaleDateString("es")}`}
            </p>
          ) : (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-gold-400/90">
              <CloudOff className="h-3.5 w-3.5" />
              Tu actividad se guarda solo en este dispositivo.{" "}
              <Link href="/registro" className="text-brand-300 underline-offset-2 hover:underline">
                Crea una cuenta
              </Link>{" "}
              para conservarla.
            </p>
          )}
        </div>
      </motion.div>

      {/* Métricas */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Popcorn,
            label: "Películas calificadas",
            value: stats ? String(stats.totalRatings) : "—",
            color: "#b3262e",
          },
          {
            icon: Star,
            label: "Tu promedio de estrellas",
            value: stats?.avgRating != null ? stats.avgRating.toFixed(1) : "—",
            color: "#c9a03f",
          },
          {
            icon: TrendingUp,
            label: "Género favorito",
            value: stats?.topGenres[0] ? genreLabel(stats.topGenres[0].genre) : "—",
            color: "#5b89a6",
          },
        ].map(({ icon: Icon, label, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 * i }}
            className="flex items-center gap-4 rounded-2xl bg-night-800 p-5 ring-1 ring-white/10"
          >
            <span
              className="grid h-11 w-11 place-items-center rounded-xl"
              style={{ background: `${color}1d`, color }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-white/40">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Persona */}
      {profile?.persona && (
        <div className="mt-6 max-w-2xl">
          <PersonaCard persona={profile.persona} />
        </div>
      )}

      {/* Pestañas */}
      <div className="mt-12">
        <div className="mb-6 flex gap-2">
          {(
            [
              { key: "ratings", label: `Calificadas (${ratedCount})`, icon: Star },
              { key: "watchlist", label: `Mi lista (${watchlist.length})`, icon: Bookmark },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                tab === key
                  ? "bg-brand-500 text-white"
                  : "bg-night-800 text-white/55 ring-1 ring-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {shown === null ? (
          <GridSkeleton count={12} />
        ) : shown.length === 0 ? (
          <div className="grid min-h-[30vh] place-items-center rounded-2xl bg-night-900/60 text-center ring-1 ring-white/5">
            <div>
              <Popcorn className="mx-auto h-10 w-10 text-white/15" />
              <p className="mt-3 text-white/55">
                {tab === "ratings" ? "Todavía no calificaste películas." : "Tu lista está vacía."}
              </p>
              <Link
                href="/cartelera"
                className="mt-1 inline-block text-sm text-brand-300 underline-offset-2 hover:underline"
              >
                Ir a la cartelera
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {shown.map((m, i) => (
              <MovieCard
                key={m.movieId}
                movie={{ ...m, userRating: ratings[m.movieId] }}
                index={i}
                fluid
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
