"use client";

/**
 * Estado global de la aplicación: sesión, calificaciones y mi lista.
 *
 * Modo dual de feedback:
 * - Con sesión: las calificaciones y la lista viven en el servidor (FastAPI).
 * - Invitado: se persisten en localStorage y se usan para personalizar las
 *   recomendaciones vía los endpoints `/guest`. Al iniciar sesión se migran
 *   automáticamente al servidor (`/api/ratings/sync`).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import type { RatingEntry, User } from "./types";

const LS_TOKEN = "omnicine.token";
const LS_USER = "omnicine.user";
const LS_GUEST_RATINGS = "omnicine.guestRatings";
const LS_GUEST_WATCHLIST = "omnicine.guestWatchlist";

interface StoreValue {
  ready: boolean;
  user: User | null;
  token: string | null;
  ratings: Record<number, number>;
  watchlist: number[];
  ratingEntries: RatingEntry[];
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  rateMovie: (movieId: number, rating: number) => Promise<void>;
  removeRating: (movieId: number) => Promise<void>;
  toggleWatchlist: (movieId: number) => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [watchlist, setWatchlist] = useState<number[]>([]);

  // Hidratación inicial desde localStorage + validación de sesión
  useEffect(() => {
    const storedToken = window.localStorage.getItem(LS_TOKEN);
    const storedUser = readJSON<User | null>(LS_USER, null);

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      Promise.all([api.myRatings(storedToken), api.myWatchlist(storedToken)])
        .then(([r, w]) => {
          setRatings(
            Object.fromEntries(r.results.map((m) => [m.movieId, m.userRating ?? 0])),
          );
          setWatchlist(w.results.map((m) => m.movieId));
        })
        .catch(() => {
          // token expirado o backend reiniciado: volver a modo invitado
          window.localStorage.removeItem(LS_TOKEN);
          window.localStorage.removeItem(LS_USER);
          setToken(null);
          setUser(null);
          setRatings(
            Object.fromEntries(
              readJSON<RatingEntry[]>(LS_GUEST_RATINGS, []).map((e) => [e.movieId, e.rating]),
            ),
          );
          setWatchlist(readJSON<number[]>(LS_GUEST_WATCHLIST, []));
        })
        .finally(() => setReady(true));
    } else {
      setRatings(
        Object.fromEntries(
          readJSON<RatingEntry[]>(LS_GUEST_RATINGS, []).map((e) => [e.movieId, e.rating]),
        ),
      );
      setWatchlist(readJSON<number[]>(LS_GUEST_WATCHLIST, []));
      setReady(true);
    }
  }, []);

  const ratingEntries = useMemo<RatingEntry[]>(
    () => Object.entries(ratings).map(([id, r]) => ({ movieId: Number(id), rating: r })),
    [ratings],
  );

  const adoptSession = useCallback(
    async (newToken: string, newUser: User) => {
      // Migrar el feedback de invitado al servidor antes de cambiar de modo
      const guestRatings = readJSON<RatingEntry[]>(LS_GUEST_RATINGS, []);
      if (guestRatings.length > 0) {
        await api.syncRatings(newToken, guestRatings).catch(() => {});
        window.localStorage.removeItem(LS_GUEST_RATINGS);
      }
      const guestWatchlist = readJSON<number[]>(LS_GUEST_WATCHLIST, []);
      if (guestWatchlist.length > 0) {
        await Promise.all(
          guestWatchlist.map((id) => api.addWatchlist(newToken, id).catch(() => {})),
        );
        window.localStorage.removeItem(LS_GUEST_WATCHLIST);
      }

      window.localStorage.setItem(LS_TOKEN, newToken);
      writeJSON(LS_USER, newUser);
      setToken(newToken);
      setUser(newUser);

      const [r, w] = await Promise.all([
        api.myRatings(newToken),
        api.myWatchlist(newToken),
      ]);
      setRatings(
        Object.fromEntries(r.results.map((m) => [m.movieId, m.userRating ?? 0])),
      );
      setWatchlist(w.results.map((m) => m.movieId));
    },
    [],
  );

  const login = useCallback(
    async (identifier: string, password: string) => {
      const res = await api.login(identifier, password);
      await adoptSession(res.token, res.user);
    },
    [adoptSession],
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const res = await api.register(username, email, password);
      await adoptSession(res.token, res.user);
    },
    [adoptSession],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(LS_TOKEN);
    window.localStorage.removeItem(LS_USER);
    setToken(null);
    setUser(null);
    setRatings(
      Object.fromEntries(
        readJSON<RatingEntry[]>(LS_GUEST_RATINGS, []).map((e) => [e.movieId, e.rating]),
      ),
    );
    setWatchlist(readJSON<number[]>(LS_GUEST_WATCHLIST, []));
  }, []);

  const rateMovie = useCallback(
    async (movieId: number, rating: number) => {
      setRatings((prev) => {
        const next = { ...prev, [movieId]: rating };
        if (!token) {
          writeJSON(
            LS_GUEST_RATINGS,
            Object.entries(next).map(([id, r]) => ({ movieId: Number(id), rating: r })),
          );
        }
        return next;
      });
      if (token) await api.rate(token, movieId, rating);
    },
    [token],
  );

  const removeRating = useCallback(
    async (movieId: number) => {
      setRatings((prev) => {
        const next = { ...prev };
        delete next[movieId];
        if (!token) {
          writeJSON(
            LS_GUEST_RATINGS,
            Object.entries(next).map(([id, r]) => ({ movieId: Number(id), rating: r })),
          );
        }
        return next;
      });
      if (token) await api.deleteRating(token, movieId);
    },
    [token],
  );

  const toggleWatchlist = useCallback(
    async (movieId: number) => {
      const inList = watchlist.includes(movieId);
      const next = inList
        ? watchlist.filter((id) => id !== movieId)
        : [...watchlist, movieId];
      setWatchlist(next);
      if (token) {
        if (inList) await api.removeWatchlist(token, movieId);
        else await api.addWatchlist(token, movieId);
      } else {
        writeJSON(LS_GUEST_WATCHLIST, next);
      }
    },
    [token, watchlist],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      user,
      token,
      ratings,
      watchlist,
      ratingEntries,
      login,
      register,
      logout,
      rateMovie,
      removeRating,
      toggleWatchlist,
    }),
    [ready, user, token, ratings, watchlist, ratingEntries,
     login, register, logout, rateMovie, removeRating, toggleWatchlist],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return ctx;
}
