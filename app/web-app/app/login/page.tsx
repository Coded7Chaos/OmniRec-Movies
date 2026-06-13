"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useStore();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Bienvenido de vuelta"
      subtitle="Entra para sincronizar tus gustos en todos tus dispositivos"
    >
      <form onSubmit={submit} className="space-y-4">
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 rounded-xl bg-brand-500/10 px-4 py-3 text-sm text-brand-300 ring-1 ring-brand-500/40"
            >
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div>
          <label className="mb-1.5 block text-xs font-semibold tracking-wide text-white/55 uppercase">
            Usuario o correo
          </label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete="username"
            placeholder="tu_usuario"
            className="w-full rounded-xl bg-night-800 px-4 py-3 text-sm text-white ring-1 ring-white/10 outline-none transition-all placeholder:text-white/25 focus:ring-2 focus:ring-brand-500/70"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold tracking-wide text-white/55 uppercase">
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-xl bg-night-800 px-4 py-3 pr-11 text-sm text-white ring-1 ring-white/10 outline-none transition-all placeholder:text-white/25 focus:ring-2 focus:ring-brand-500/70"
            />
            <button
              type="button"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-white/35 transition-colors hover:text-white"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-brand-400 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {loading ? "Entrando…" : "Iniciar sesión"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/45">
        ¿Primera vez en OmniCine?{" "}
        <Link href="/registro" className="font-semibold text-brand-300 transition-colors hover:text-brand-400">
          Crea tu cuenta
        </Link>
      </p>
    </AuthShell>
  );
}
