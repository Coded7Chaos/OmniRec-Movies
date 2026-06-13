"use client";

import { motion } from "motion/react";
import {
  Award,
  Ghost,
  Heart,
  Laugh,
  Moon,
  Rocket,
  Sparkles,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { genreLabel } from "@/lib/poster";
import type { Persona } from "@/lib/types";

const PERSONA_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  zap: Zap,
  moon: Moon,
  heart: Heart,
  ghost: Ghost,
  rocket: Rocket,
  award: Award,
  laugh: Laugh,
};

/** Tarjeta de la comunidad de gustos asignada por el clustering del SVD. */
export default function PersonaCard({
  persona,
  compact = false,
}: {
  persona: Persona;
  compact?: boolean;
}) {
  const Icon = PERSONA_ICONS[persona.icon] ?? Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl bg-night-800 p-6 ring-1 ring-white/10"
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1"
        style={{ background: persona.color }}
      />
      <div className="relative flex items-start gap-4">
        <span
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl shadow-lg"
          style={{ background: `${persona.color}22`, color: persona.color }}
        >
          <Icon className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase">
            Tu comunidad cinéfila
          </p>
          <h3
            className="mt-0.5 text-2xl text-white"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}
          >
            {persona.name}
          </h3>
          {!compact && (
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              {persona.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {persona.top_genres.slice(0, 3).map((g) => (
              <span
                key={g}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1"
                style={{
                  color: persona.color,
                  borderColor: persona.color,
                  background: `${persona.color}14`,
                  // ring via boxShadow para color dinámico
                  boxShadow: `inset 0 0 0 1px ${persona.color}55`,
                }}
              >
                {genreLabel(g)}
              </span>
            ))}
            <span className="flex items-center gap-1 text-[11px] text-white/35">
              <Users className="h-3 w-3" />
              {Intl.NumberFormat("es").format(persona.n_users)} miembros en el dataset
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
