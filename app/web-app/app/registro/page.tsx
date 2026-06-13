"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CloudUpload, Eye, EyeOff, Loader2, Ticket } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { useStore } from "@/lib/store";

export default function RegisterPage() {
  const router = useRouter();
  const { register, ratingEntries, user } = useStore();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const guestCount = user ? 0 : ratingEntries.length;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      router.push("/para-ti");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta");
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Tu butaca te espera"
      subtitle="Crea tu cuenta y lleva tus recomendaciones a todas partes"
    >
      {guestCount > 0 && (
        <p className="mb-4 flex items-start gap-2 rounded-xl bg-gold-500/10 px-4 py-3 text-xs text-gold-300 ring-1 ring-gold-500/30">
          <CloudUpload className="mt-0.5 h-4 w-4 shrink-0" />
          Tienes {guestCount} calificaciones guardadas en este dispositivo. Al crear tu
          cuenta se migrarán automáticamente a tu perfil.
        </p>
      )}

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
            Nombre de usuario
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_.\-]+"
            title="Letras, números, punto, guion y guion bajo"
            autoComplete="username"
            placeholder="cinefilo_01"
            className="w-full rounded-xl bg-night-800 px-4 py-3 text-sm text-white ring-1 ring-white/10 outline-none transition-all placeholder:text-white/25 focus:ring-2 focus:ring-brand-500/70"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold tracking-wide text-white/55 uppercase">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="tu@correo.com"
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
              minLength={6}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
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
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
          {loading ? "Creando cuenta…" : "Crear mi cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/45">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-brand-300 transition-colors hover:text-brand-400">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
