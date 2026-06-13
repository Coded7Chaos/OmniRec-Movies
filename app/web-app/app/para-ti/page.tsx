"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { BrainCircuit, Info, Sparkles, Wand2 } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import MovieCard from "@/components/MovieCard";
import PersonaCard from "@/components/PersonaCard";
import { GridSkeleton } from "@/components/Skeletons";
import type { Persona, RecommendationsResponse } from "@/lib/types";

export default function ForYouPage() {
  const { ready, token, ratingEntries, user } = useStore();
  const [recs, setRecs] = useState<RecommendationsResponse | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);

  const ratedCount = ratingEntries.length;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.recommendations(token, ratingEntries, 30),
      api.profile(token, ratingEntries),
    ])
      .then(([r, p]) => {
        if (cancelled) return;
        setRecs(r);
        setPersona(p.persona);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // Recalcula al cambiar la cantidad de ratings (feedback inmediato)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token, ratedCount]);

  const personalized = recs?.strategy === "svd_fold_in";

  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-24 pb-12 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-gold-500 uppercase">
          <Sparkles className="h-4 w-4" /> Selección inteligente
        </p>
        <h1
          className="mt-1 text-4xl text-white sm:text-5xl"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}
        >
          Para ti{user ? `, ${user.username}` : ""}
        </h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-white/45">
          <BrainCircuit className="h-4 w-4 text-brand-400" />
          {personalized
            ? `Re-ranking SVD sobre ${ratedCount} calificaciones tuyas`
            : "Aún sin historial: mostramos el ranking bayesiano de popularidad"}
        </p>
      </motion.div>

      {/* Persona */}
      {persona && (
        <div className="mt-8 max-w-2xl">
          <PersonaCard persona={persona} />
        </div>
      )}

      {/* Aviso para arrancar */}
      {!loading && !personalized && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 flex items-start gap-3 rounded-2xl bg-gold-500/8 p-5 ring-1 ring-gold-500/25"
        >
          <Wand2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-500" />
          <div className="text-sm">
            <p className="font-semibold text-gold-300">
              Califica al menos una película para activar la magia
            </p>
            <p className="mt-1 text-white/50">
              El modelo SVD estima tu vector de gustos con cada estrella que asignas.{" "}
              <Link href="/cartelera" className="text-brand-300 underline-offset-2 hover:underline">
                Explora la cartelera
              </Link>{" "}
              y puntúa lo que ya viste.
            </p>
          </div>
        </motion.div>
      )}

      <div className="mt-10">
        {loading ? (
          <GridSkeleton count={18} />
        ) : (
          <>
            {personalized && (
              <p className="mb-4 flex items-center gap-1.5 text-xs text-white/35">
                <Info className="h-3.5 w-3.5" />
                La insignia roja de cada póster es la calificación que el modelo predice que le darías.
              </p>
            )}
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {recs?.results.map((m, i) => (
                <MovieCard key={m.movieId} movie={m} index={i} fluid />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
