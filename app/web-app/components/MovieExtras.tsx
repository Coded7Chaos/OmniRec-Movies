"use client";

import { motion } from "motion/react";
import {
  Award,
  CalendarDays,
  Clapperboard,
  Clock,
  Globe2,
  PenLine,
  Star,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  formatReleaseDate,
  formatRuntime,
  type MovieMeta,
} from "@/lib/cinemeta";

/**
 * Bloque de datos enriquecidos de Cinemeta: ficha técnica (rating IMDb,
 * duración, estreno, país), premios, reparto y equipo. Degrada con elegancia:
 * mientras carga muestra esqueletos; si la película no tiene ficha, no
 * renderiza nada (la página sigue funcionando con los datos base del modelo).
 */
export default function MovieExtras({
  meta,
  loading,
}: {
  meta: MovieMeta | null;
  loading: boolean;
}) {
  if (loading) return <ExtrasSkeleton />;
  if (!meta) return null;

  const facts = buildFacts(meta);
  const hasFacts = facts.length > 0;
  const hasCrew = meta.director.length > 0 || meta.writer.length > 0;

  if (!hasFacts && !meta.awards && meta.cast.length === 0 && !hasCrew) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mt-12 space-y-10"
    >
      {/* Ficha técnica */}
      {hasFacts && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {facts.map((f) => (
            <FactCard key={f.label} {...f} />
          ))}
        </div>
      )}

      {/* Premios */}
      {meta.awards && (
        <div className="flex items-start gap-3 rounded-2xl bg-gold-500/8 p-4 ring-1 ring-gold-500/25">
          <Award className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" />
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-gold-400 uppercase">
              Premios
            </p>
            <p className="mt-1 text-sm leading-relaxed text-white/75">{meta.awards}</p>
          </div>
        </div>
      )}

      {/* Reparto */}
      {meta.cast.length > 0 && (
        <div>
          <SectionTitle icon={Users} label="Reparto" />
          <div className="mt-4 flex flex-wrap gap-2">
            {meta.cast.map((person) => (
              <span
                key={person}
                className="rounded-full bg-white/6 px-3.5 py-1.5 text-sm text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white"
              >
                {person}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Equipo */}
      {hasCrew && (
        <div className="grid gap-6 sm:grid-cols-2">
          {meta.director.length > 0 && (
            <CrewBlock icon={Clapperboard} label="Dirección" people={meta.director} />
          )}
          {meta.writer.length > 0 && (
            <CrewBlock icon={PenLine} label="Guion" people={meta.writer} />
          )}
        </div>
      )}
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */

interface Fact {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: boolean;
}

function buildFacts(meta: MovieMeta): Fact[] {
  const facts: Fact[] = [];
  if (meta.imdbRating) {
    facts.push({
      icon: Star,
      label: "IMDb",
      value: `${meta.imdbRating} / 10`,
      accent: true,
    });
  }
  const runtime = formatRuntime(meta.runtimeMinutes);
  if (runtime) facts.push({ icon: Clock, label: "Duración", value: runtime });
  const released = formatReleaseDate(meta.released);
  if (released) facts.push({ icon: CalendarDays, label: "Estreno", value: released });
  if (meta.country) facts.push({ icon: Globe2, label: "País", value: meta.country });
  return facts;
}

function FactCard({ icon: Icon, label, value, accent }: Fact) {
  return (
    <div className="rounded-2xl bg-night-800/70 p-4 ring-1 ring-white/10">
      <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-white/45 uppercase">
        <Icon
          className={`h-3.5 w-3.5 ${accent ? "text-gold-400" : ""}`}
          fill={accent ? "currentColor" : "none"}
        />
        {label}
      </div>
      <p
        className={`mt-1.5 text-base font-semibold ${accent ? "text-gold-400" : "text-white/90"}`}
      >
        {value}
      </p>
    </div>
  );
}

function SectionTitle({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <h2
      className="flex items-center gap-2 text-xl text-white sm:text-2xl"
      style={{ fontFamily: "var(--font-display)", letterSpacing: "0.03em" }}
    >
      <Icon className="h-5 w-5 text-brand-400" /> {label}
    </h2>
  );
}

function CrewBlock({
  icon,
  label,
  people,
}: {
  icon: LucideIcon;
  label: string;
  people: string[];
}) {
  return (
    <div className="rounded-2xl bg-night-800/50 p-5 ring-1 ring-white/10">
      <SectionTitle icon={icon} label={label} />
      <p className="mt-3 text-sm leading-relaxed text-white/75">{people.join(" · ")}</p>
    </div>
  );
}

function ExtrasSkeleton() {
  return (
    <div className="mt-12 space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-3">
        <div className="skeleton h-6 w-40 rounded" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-28 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
