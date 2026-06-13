"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowDownWideNarrow, Film, ListFilter, Loader2, Search, X } from "lucide-react";
import { api } from "@/lib/api";
import MovieCard from "@/components/MovieCard";
import { GridSkeleton } from "@/components/Skeletons";
import { genreLabel } from "@/lib/poster";
import type { Movie } from "@/lib/types";

const SORTS = [
  { value: "popular", label: "Populares" },
  { value: "rating", label: "Mejor calificadas" },
  { value: "recent", label: "Más recientes" },
  { value: "title", label: "A – Z" },
];

const PAGE_SIZE = 30;

function CatalogContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [genres, setGenres] = useState<string[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const search = params.get("q") ?? "";
  const genre = params.get("genre") ?? "";
  const sort = params.get("sort") ?? "popular";
  const [searchInput, setSearchInput] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.genres().then((g) => setGenres(g.genres)).catch(() => {});
  }, []);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`/cartelera?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  // Búsqueda con debounce para que escribir se sienta fluido
  const onSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam("q", value.trim() || null), 350);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);
    api
      .browse({ search, genre, sort, page: 1, pageSize: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setMovies(res.results);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .catch(() => !cancelled && setMovies([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [search, genre, sort]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await api.browse({ search, genre, sort, page: nextPage, pageSize: PAGE_SIZE });
      setMovies((prev) => [...prev, ...res.results]);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-24 pb-12 sm:px-8">
      {/* Encabezado */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-gold-500 uppercase">
          <Film className="h-4 w-4" /> Catálogo completo
        </p>
        <h1
          className="mt-1 text-4xl text-white sm:text-5xl"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}
        >
          Cartelera
        </h1>
        <p className="mt-1 text-sm text-white/45">
          {loading ? "Buscando…" : `${Intl.NumberFormat("es").format(total)} películas`}
          {genre && ` · ${genreLabel(genre)}`}
          {search && ` · “${search}”`}
        </p>
      </motion.div>

      {/* Controles */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-60 flex-1 sm:max-w-md">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por título…"
              className="w-full rounded-full bg-night-800 py-2.5 pr-10 pl-10 text-sm text-white ring-1 ring-white/10 outline-none transition-all placeholder:text-white/30 focus:ring-2 focus:ring-brand-500/70"
            />
            {searchInput && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => onSearchChange("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-white/40">
            <ArrowDownWideNarrow className="h-4 w-4" />
            <div className="flex rounded-full bg-night-800 p-1 ring-1 ring-white/10">
              {SORTS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setParam("sort", s.value === "popular" ? null : s.value)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                    sort === s.value
                      ? "bg-brand-500 text-white"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chips de género */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <ListFilter className="h-4 w-4 shrink-0 text-white/40" />
          <button
            type="button"
            onClick={() => setParam("genre", null)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 transition-all duration-200 ${
              !genre
                ? "bg-gold-500 text-night-950 ring-gold-500"
                : "text-white/55 ring-white/15 hover:text-white hover:ring-white/35"
            }`}
          >
            Todos
          </button>
          {genres.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setParam("genre", g === genre ? null : g)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 transition-all duration-200 ${
                genre === g
                  ? "bg-gold-500 text-night-950 ring-gold-500"
                  : "text-white/55 ring-white/15 hover:text-white hover:ring-white/35"
              }`}
            >
              {genreLabel(g)}
            </button>
          ))}
        </div>
      </div>

      {/* Grilla */}
      {loading ? (
        <GridSkeleton count={PAGE_SIZE} />
      ) : movies.length === 0 ? (
        <div className="grid min-h-[40vh] place-items-center text-center">
          <div>
            <Film className="mx-auto h-12 w-12 text-white/15" />
            <p className="mt-4 text-white/60">No encontramos funciones con esos filtros.</p>
            <p className="mt-1 text-sm text-white/35">Prueba con otro título o género.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {movies.map((m, i) => (
              <MovieCard key={m.movieId} movie={m} index={i % PAGE_SIZE} fluid />
            ))}
          </div>

          {page < totalPages && (
            <div className="mt-12 text-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-full bg-night-700 px-8 py-3 text-sm font-semibold text-white ring-1 ring-white/15 transition-all duration-200 hover:bg-brand-600 hover:ring-brand-500 active:scale-95 disabled:opacity-60"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                {loadingMore ? "Cargando…" : "Cargar más películas"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-24 sm:px-8"><GridSkeleton /></div>}>
      <CatalogContent />
    </Suspense>
  );
}
