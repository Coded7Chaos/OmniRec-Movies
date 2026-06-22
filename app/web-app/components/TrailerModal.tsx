"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

/**
 * Lightbox del tráiler: incrusta el vídeo de YouTube (modo sin cookies) a
 * pantalla completa con un velo oscuro. Se cierra con Esc, con la X o al hacer
 * clic fuera del reproductor, y bloquea el scroll del fondo mientras está
 * abierto.
 */
export default function TrailerModal({
  youTubeId,
  title,
  open,
  onClose,
}: {
  youTubeId: string | null;
  title: string;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && youTubeId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] grid place-items-center bg-night-950/85 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Tráiler de ${title}`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar tráiler"
              className="absolute -top-11 right-0 flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
            >
              Cerrar <X className="h-5 w-5" />
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/70 ring-1 ring-white/15">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${youTubeId}?autoplay=1&rel=0`}
                title={`Tráiler de ${title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
