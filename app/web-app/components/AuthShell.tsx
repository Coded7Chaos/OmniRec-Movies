"use client";

import { motion } from "motion/react";
import { Clapperboard } from "lucide-react";
import type { ReactNode } from "react";

/** Marco compartido de las pantallas de acceso, con telón de cine. */
export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative grid min-h-screen place-items-center bg-night-950 px-4 py-24">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-2xl bg-night-900 p-8 ring-1 ring-white/10"
      >
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand-500">
            <Clapperboard className="h-6 w-6 text-white" />
          </span>
          <h1
            className="mt-4 text-3xl text-white"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}
          >
            {title}
          </h1>
          <p className="mt-1 text-sm text-white/45">{subtitle}</p>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
