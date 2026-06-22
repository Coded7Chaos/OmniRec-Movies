"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "./MovieCard";
import type { Movie } from "@/lib/types";

/** Fila horizontal estilo cartelera, con flechas de desplazamiento suave. */
export default function MovieRow({
  title,
  subtitle,
  movies,
  href,
}: {
  title: string;
  subtitle?: string | null;
  movies: Movie[];
  href?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateArrows = () => {
    const el = scroller.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  const scrollBy = (dir: 1 | -1) => {
    scroller.current?.scrollBy({
      left: dir * scroller.current.clientWidth * 0.85,
      behavior: "smooth",
    });
  };

  if (movies.length === 0) return null;

  return (
    <section className="group/row relative">
      <div className="mb-3 flex items-end justify-between px-4 sm:px-8">
        <div>
          <h2
            className="text-xl tracking-wide text-white sm:text-2xl"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}
          >
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-xs text-white/40">{subtitle}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="text-xs font-medium text-brand-300 transition-colors hover:text-brand-400"
          >
            Ver todo →
          </Link>
        )}
      </div>

      <div className="relative">
        {/* El padding vertical da aire a la elevación del hover (scale + y) y a la
            animación de entrada de las tarjetas: con overflow-x:auto el navegador
            fuerza overflow-y a auto, así que sin este margen la carátula se
            recortaría arriba y aparecería un scroll vertical fantasma. */}
        <div
          ref={scroller}
          onScroll={updateArrows}
          className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth px-4 pt-3 pb-5 sm:px-8"
        >
          {movies.map((m, i) => (
            <MovieCard key={m.movieId} movie={m} index={i} />
          ))}
        </div>

        {canLeft && (
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Anterior"
            className="absolute top-1/3 left-1 z-10 rounded-full bg-night-800/90 p-2 text-white opacity-0 shadow-xl ring-1 ring-white/15 backdrop-blur transition-all duration-200 group-hover/row:opacity-100 hover:bg-brand-600 hover:scale-110"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {canRight && movies.length > 5 && (
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Siguiente"
            className="absolute top-1/3 right-1 z-10 rounded-full bg-night-800/90 p-2 text-white opacity-0 shadow-xl ring-1 ring-white/15 backdrop-blur transition-all duration-200 group-hover/row:opacity-100 hover:bg-brand-600 hover:scale-110"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </section>
  );
}
