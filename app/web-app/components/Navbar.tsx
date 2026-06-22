"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Clapperboard,
  Film,
  Home,
  LogOut,
  Menu,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";

const NAV_LINKS = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/cartelera", label: "Cartelera", icon: Film },
  { href: "/buscar", label: "Buscar", icon: Search },
  { href: "/para-ti", label: "Para ti", icon: Sparkles },
];

export default function Navbar() {
  const { user, logout } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenu(false);
  }, [pathname]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/buscar?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-night-950/95 backdrop-blur-xl"
          : "bg-night-950/70 backdrop-blur-sm"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-8">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 transition-transform duration-300 group-hover:rotate-[-8deg]">
            <Clapperboard className="h-5 w-5 text-white" />
          </span>
          <span
            className="text-2xl tracking-wider text-white"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.08em" }}
          >
            OMNI<span className="text-brand-400">CINE</span>
          </span>
        </Link>

        {/* Links desktop */}
        <div className="ml-6 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
                  active ? "text-white" : "text-white/55 hover:text-white"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-white/10 ring-1 ring-white/15"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Búsqueda */}
          <AnimatePresence mode="wait">
            {searchOpen ? (
              <motion.form
                key="search"
                initial={{ width: 40, opacity: 0 }}
                animate={{ width: 240, opacity: 1 }}
                exit={{ width: 40, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onSubmit={submitSearch}
                className="flex items-center gap-2 rounded-full bg-night-700/80 px-3 py-1.5 ring-1 ring-white/15"
              >
                <Search className="h-4 w-4 shrink-0 text-white/50" />
                <input
                  ref={searchRef}
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onBlur={() => !query && setSearchOpen(false)}
                  placeholder="Buscar películas…"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                />
                <button
                  type="button"
                  aria-label="Cerrar búsqueda"
                  onClick={() => { setSearchOpen(false); setQuery(""); }}
                >
                  <X className="h-4 w-4 text-white/50 hover:text-white" />
                </button>
              </motion.form>
            ) : (
              <motion.button
                key="search-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                type="button"
                aria-label="Buscar"
                onClick={() => setSearchOpen(true)}
                className="rounded-full p-2 text-white/65 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Search className="h-5 w-5" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Sesión */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenu((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-night-700/80 py-1 pr-3 pl-1 ring-1 ring-white/15 transition-colors hover:ring-brand-500/60"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {user.username.slice(0, 2).toUpperCase()}
                </span>
                <span className="hidden text-sm font-medium text-white/85 sm:block">
                  {user.username}
                </span>
              </button>
              <AnimatePresence>
                {userMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl bg-night-800 shadow-2xl ring-1 ring-white/15"
                  >
                    <Link
                      href="/perfil"
                      className="flex items-center gap-2 px-4 py-3 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <User className="h-4 w-4" /> Mi perfil
                    </Link>
                    <button
                      type="button"
                      onClick={() => { logout(); router.push("/"); }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-brand-300 transition-colors hover:bg-brand-500/10"
                    >
                      <LogOut className="h-4 w-4" /> Cerrar sesión
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="rounded-full px-4 py-1.5 text-sm font-medium text-white/75 transition-colors hover:text-white"
              >
                Entrar
              </Link>
              <Link
                href="/registro"
                className="rounded-full bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-400"
              >
                Crear cuenta
              </Link>
            </div>
          )}

          {/* Menú móvil */}
          <button
            type="button"
            aria-label="Menú"
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-full p-2 text-white/70 hover:bg-white/10 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Drawer móvil */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/10 bg-night-900/95 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    pathname === href ? "bg-white/10 text-white" : "text-white/60"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              ))}
              {!user && (
                <div className="flex gap-2 pt-2">
                  <Link
                    href="/login"
                    className="flex-1 rounded-lg bg-white/10 px-3 py-2.5 text-center text-sm font-medium text-white"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/registro"
                    className="flex-1 rounded-lg bg-brand-500 px-3 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Crear cuenta
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
