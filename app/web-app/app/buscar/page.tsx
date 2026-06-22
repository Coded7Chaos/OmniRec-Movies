"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Search, Sparkles, Wand2, X } from "lucide-react";
import { api } from "@/lib/api";
import SearchResultCard from "@/components/SearchResultCard";
import type { SemanticResponse } from "@/lib/types";

const EXAMPLES = [
  "thriller psicológico sobre la memoria y la identidad",
  "space opera épica con batallas espaciales",
  "animación familiar con mensaje ecológico",
  "neo-noir distópico con estética cyberpunk",
  "comedia romántica ligera ambientada en París",
  "documental de naturaleza sobre los océanos",
];

function SearchContent() {
  const router = useRouter();
  const params = useSearchParams();
  const query = params.get("q") ?? "";

  const [input, setInput] = useState(query);
  const [data, setData] = useState<SemanticResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [generate, setGenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setInput(query), [query]);

  const runSearch = useCallback(
    async (q: string, withAnswer: boolean) => {
      if (!q.trim()) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.semanticSearch(q.trim(), 12, withAnswer);
        setData(res);
      } catch {
        setError("No se pudo completar la búsqueda. ¿Está el backend en marcha?");
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Dispara la búsqueda cuando cambia la query de la URL.
  useEffect(() => {
    if (query) runSearch(query, generate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const submit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    router.replace(`/buscar?q=${encodeURIComponent(trimmed)}`, { scroll: false });
    runSearch(trimmed, generate);
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-24 pb-12 sm:px-8">
      {/* Encabezado */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-7"
      >
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-gold-500 uppercase">
          <Sparkles className="h-4 w-4" /> Búsqueda semántica
        </p>
        <h1
          className="mt-1 text-4xl text-white sm:text-5xl"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}
        >
          Describe lo que quieres ver
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-white/45">
          Busca por temas, atmósfera o trama —no solo por título—. Un modelo de
          embeddings multilingüe recupera películas afines por sus tags y géneros,
          y te muestra <span className="text-white/70">por qué</span> encaja cada una.
        </p>
      </motion.div>

      {/* Barra de búsqueda */}
      <form
        onSubmit={(e) => { e.preventDefault(); submit(input); }}
        className="mb-4 flex flex-wrap items-center gap-3"
      >
        <div className="relative min-w-60 flex-1">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="p. ej. un thriller de ciencia ficción sobre la conciencia…"
            className="w-full rounded-full bg-night-800 py-3 pr-10 pl-11 text-sm text-white ring-1 ring-white/10 outline-none transition-all placeholder:text-white/30 focus:ring-2 focus:ring-brand-500/70"
          />
          {input && (
            <button
              type="button"
              aria-label="Limpiar"
              onClick={() => { setInput(""); inputRef.current?.focus(); }}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-400 active:scale-95"
        >
          <Search className="h-4 w-4" /> Buscar
        </button>
        <button
          type="button"
          onClick={() => setGenerate((v) => !v)}
          aria-pressed={generate}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium ring-1 transition-all ${
            generate
              ? "bg-gold-500/15 text-gold-300 ring-gold-500/40"
              : "text-white/55 ring-white/15 hover:text-white hover:ring-white/35"
          }`}
          title="Genera una recomendación redactada citando los resultados"
        >
          <Wand2 className="h-4 w-4" /> Respuesta IA
        </button>
      </form>

      {/* Ejemplos */}
      <div className="mb-9 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => { setInput(ex); submit(ex); }}
            className="rounded-full bg-white/5 px-3.5 py-1.5 text-xs text-white/55 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Respuesta generada (RAG) */}
      <AnimatePresence>
        {data?.answer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500/10 to-gold-500/5 p-5 ring-1 ring-brand-500/25"
          >
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wider text-gold-400 uppercase">
              <Wand2 className="h-4 w-4" /> Recomendación del asistente
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-normal text-white/50">
                {data.mode === "llm" ? `LLM · ${data.model}` : "plantilla"}
              </span>
            </p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-white/85">
              {data.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resultados */}
      {loading ? (
        <div className="grid min-h-[40vh] place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        </div>
      ) : error ? (
        <div className="grid min-h-[30vh] place-items-center text-center">
          <p className="text-white/60">{error}</p>
        </div>
      ) : data && data.results.length > 0 ? (
        <>
          <p className="mb-4 text-xs text-white/40">
            {data.results.length} resultados · encoder{" "}
            <span className="font-mono text-white/55">{data.encoder.split("/").pop()}</span>
          </p>
          <div className="grid grid-cols-2 items-start gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {data.results.map((r, i) => (
              <SearchResultCard
                key={r.movieId}
                result={r}
                imdbId={r.imdbId}
                index={i}
              />
            ))}
          </div>
        </>
      ) : query ? (
        <div className="grid min-h-[30vh] place-items-center text-center">
          <p className="text-white/60">Sin resultados para «{query}».</p>
        </div>
      ) : (
        <div className="grid min-h-[24vh] place-items-center text-center">
          <p className="text-sm text-white/35">
            Escribe una descripción o prueba uno de los ejemplos de arriba.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-24 sm:px-8" />}>
      <SearchContent />
    </Suspense>
  );
}
