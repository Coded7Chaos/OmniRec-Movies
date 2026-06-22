"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Award,
  CircleDashed,
  Ghost,
  Heart,
  Laugh,
  Moon,
  Rocket,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
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

/**
 * Insignia de comunidad en la barra de navegación.
 *
 * Reemplaza al antiguo botón de búsqueda. Es un círculo compacto cuyo contenido
 * depende de la sesión:
 * - Sin cuenta: no se renderiza nada.
 * - Con sesión y comunidad asignada (clúster del SVD): círculo con el icono del
 *   arquetipo y su color.
 * - Con sesión pero sin comunidad (aún no calificó películas conocidas): círculo
 *   neutro que invita a calificar para desbloquearla.
 *
 * Al hacer clic se despliega desde la insignia un popover que explica su
 * significado.
 */
export default function CommunityBadge() {
  const { ready, token, user, ratingEntries } = useStore();
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const ratedCount = ratingEntries.length;

  useEffect(() => {
    if (!ready || !token) {
      setPersona(null);
      setLoaded(false);
      return;
    }
    let cancelled = false;
    api
      .profile(token, [])
      .then((p) => {
        if (cancelled) return;
        setPersona(p.persona);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
    // ratedCount fuerza un refresco de la comunidad al calificar nuevas pelis
  }, [ready, token, ratedCount]);

  // Cerrar el popover al hacer clic fuera o pulsar Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Sin cuenta: no se muestra nada.
  if (!user) return null;

  // Perfil aún cargando: placeholder circular discreto.
  if (!loaded) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-white/5" />;
  }

  const hasPersona = persona !== null;
  const Icon = hasPersona
    ? PERSONA_ICONS[persona.icon] ?? Sparkles
    : CircleDashed;
  const color = hasPersona ? persona.color : "#8a8f99";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label={hasPersona ? `Comunidad: ${persona.name}` : "Sin comunidad"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-full transition-transform duration-200 hover:scale-105"
        style={{
          color,
          background: `${color}1f`,
          boxShadow: `inset 0 0 0 1px ${color}66`,
        }}
      >
        <Icon className="h-[18px] w-[18px]" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.9 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl bg-night-800 shadow-2xl ring-1 ring-white/15"
          >
            {/* Franja superior con el color de la comunidad */}
            <div className="h-1 w-full" style={{ background: color }} />

            <div className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                  style={{ background: `${color}26`, color }}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-white/40 uppercase">
                    Tu insignia
                  </p>
                  <h3 className="truncate text-base font-bold text-white">
                    {hasPersona ? persona.name : "Sin comunidad"}
                  </h3>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-white/60">
                {hasPersona
                  ? persona.description
                  : "Todavía no perteneces a una comunidad. Califica algunas películas y el sistema te asignará el grupo de gustos que mejor te representa."}
              </p>

              {hasPersona && persona.top_genres.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {persona.top_genres.slice(0, 3).map((g) => (
                    <span
                      key={g}
                      className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        color,
                        background: `${color}14`,
                        boxShadow: `inset 0 0 0 1px ${color}55`,
                      }}
                    >
                      {genreLabel(g)}
                    </span>
                  ))}
                </div>
              )}

              <Link
                href="/perfil"
                onClick={() => setOpen(false)}
                className="mt-4 block w-full rounded-lg bg-white/5 px-3 py-2 text-center text-sm font-semibold text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white"
              >
                {hasPersona ? "Ver mi comunidad" : "Empezar a calificar"}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
