"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import Hero from "@/components/Hero";
import MovieRow from "@/components/MovieRow";
import { HeroSkeleton, RowSkeleton } from "@/components/Skeletons";
import type { HomeResponse } from "@/lib/types";

const RETRY_DELAYS = [3000, 6000, 10000, 15000, 20000];

export default function HomePage() {
  const { ready, token, ratingEntries } = useStore();
  const [data, setData] = useState<HomeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    retryRef.current = 0;

    const load = () => {
      api
        .home(token, ratingEntries)
        .then((d) => {
          if (!cancelled) { setConnecting(false); setData(d); }
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          const isNetworkError = !e || typeof e !== "object" || !("status" in e);
          const attempt = retryRef.current;
          if (isNetworkError && attempt < RETRY_DELAYS.length) {
            retryRef.current += 1;
            setConnecting(true);
            timerRef.current = setTimeout(load, RETRY_DELAYS[attempt]);
          } else {
            setConnecting(false);
            setError("No se pudo conectar con el servidor de OmniCine.");
          }
        });
    };
    load();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // Se recarga al cambiar de sesión, no en cada rating, para no parpadear.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token]);

  if (error) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-4">
        <div className="text-center">
          <p className="text-lg text-white/70">{error}</p>
          <p className="mt-2 text-sm text-white/40">
            Verifica que el backend esté activo: <code className="text-brand-300">uvicorn main:app --port 8000</code>
          </p>
        </div>
      </div>
    );
  }

  if (connecting) {
    return (
      <div className="space-y-12 pb-16">
        <HeroSkeleton />
        <RowSkeleton />
        <RowSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-12 pb-16">
        <HeroSkeleton />
        <RowSkeleton />
        <RowSkeleton />
      </div>
    );
  }

  return (
    <div className="pb-8">
      <Hero movies={data.hero} />
      <div className="relative z-10 mt-12 space-y-12">
        {data.sections.map((section) => (
          <MovieRow
            key={section.key}
            title={section.title}
            subtitle={section.subtitle}
            movies={section.movies}
            href={
              section.key === "for-you"
                ? "/para-ti"
                : section.genre
                  ? `/cartelera?genre=${encodeURIComponent(section.genre)}`
                  : "/cartelera"
            }
          />
        ))}
      </div>
    </div>
  );
}
