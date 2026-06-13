"use client";

import { useState } from "react";
import { Star } from "lucide-react";

/**
 * Selector de 5 estrellas con medios puntos (escala MovieLens 0.5–5.0).
 * Modo lectura si no se pasa `onRate`.
 */
export default function StarRating({
  value,
  onRate,
  size = 20,
  className = "",
}: {
  value: number | null | undefined;
  onRate?: (rating: number) => void;
  size?: number;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value ?? 0;
  const interactive = Boolean(onRate);

  const starValue = (index: number, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isHalf = e.clientX - rect.left < rect.width / 2;
    return index + (isHalf ? 0.5 : 1);
  };

  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      onMouseLeave={() => setHover(null)}
      role={interactive ? "radiogroup" : undefined}
      aria-label="Calificación"
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(Math.max(display - i, 0), 1); // 0 | 0.5 | 1
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onMouseMove={(e) => interactive && setHover(starValue(i, e))}
            onClick={(e) => onRate?.(starValue(i, e))}
            className={`relative transition-transform duration-150 ${
              interactive ? "cursor-pointer hover:scale-125 active:scale-95" : "cursor-default"
            }`}
            aria-label={`${i + 1} estrellas`}
          >
            <Star size={size} className="text-night-500" fill="currentColor" strokeWidth={0} />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star
                size={size}
                className={hover !== null ? "text-gold-300" : "text-gold-500"}
                fill="currentColor"
                strokeWidth={0}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
