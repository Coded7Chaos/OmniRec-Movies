import Link from "next/link";
import { Clapperboard, GitBranch, Popcorn, Star } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-night-900/60">
      <div className="mx-auto grid max-w-[1600px] gap-8 px-4 py-12 sm:grid-cols-3 sm:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500">
              <Clapperboard className="h-4 w-4 text-white" />
            </span>
            <span
              className="text-xl tracking-wider text-white"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "0.08em" }}
            >
              OMNI<span className="text-brand-400">CINE</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/40">
            Tu cine inteligente. Recomendaciones personalizadas impulsadas por
            modelos de factorización matricial entrenados con MovieLens 25M.
          </p>
        </div>

        <div className="text-sm">
          <h4 className="mb-3 font-semibold text-white/80">Explorar</h4>
          <ul className="space-y-2 text-white/45">
            <li><Link href="/cartelera" className="transition-colors hover:text-brand-300">Cartelera completa</Link></li>
            <li><Link href="/para-ti" className="transition-colors hover:text-brand-300">Recomendaciones para ti</Link></li>
            <li><Link href="/perfil" className="transition-colors hover:text-brand-300">Mi perfil cinéfilo</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <h4 className="mb-3 font-semibold text-white/80">El proyecto</h4>
          <ul className="space-y-2 text-white/45">
            <li className="flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-gold-500" />
              Modelo SVD · RMSE 0.865
            </li>
            <li className="flex items-center gap-2">
              <Popcorn className="h-3.5 w-3.5 text-brand-400" />
              55,113 películas en catálogo
            </li>
            <li className="flex items-center gap-2">
              <GitBranch className="h-3.5 w-3.5" />
              OmniRec-Movies · CRISP-DM
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-white/30">
        OmniCine — Proyecto académico de Machine Learning · UCB · {new Date().getFullYear()}
      </div>
    </footer>
  );
}
