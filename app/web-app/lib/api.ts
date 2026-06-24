import type {
  AuthResponse,
  BrowseResponse,
  HomeResponse,
  Movie,
  ProfileResponse,
  RatingEntry,
  RecommendationsResponse,
  SemanticResponse,
  User,
} from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail = `Error ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      /* cuerpo no-JSON */
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // -------- auth
  register: (username: string, email: string, password: string) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),
  login: (identifier: string, password: string) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }),
  me: (token: string) => request<User>("/api/auth/me", { token }),

  // -------- catálogo
  browse: (params: {
    search?: string;
    genre?: string;
    decade?: number;
    sort?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.genre) q.set("genre", params.genre);
    if (params.decade) q.set("decade", String(params.decade));
    if (params.sort) q.set("sort", params.sort);
    if (params.page) q.set("page", String(params.page));
    if (params.pageSize) q.set("page_size", String(params.pageSize));
    return request<BrowseResponse>(`/api/movies?${q.toString()}`);
  },
  genres: () => request<{ genres: string[] }>("/api/movies/genres"),
  movie: (id: number) => request<Movie>(`/api/movies/${id}`),
  similar: (id: number, limit = 12, method: "dl" | "svd" = "dl") =>
    request<{ results: Movie[]; method: "dl" | "svd" }>(
      `/api/movies/${id}/similar?limit=${limit}&method=${method}`,
    ),

  // -------- recomendaciones
  home: (token: string | null, guestRatings: RatingEntry[]) =>
    token
      ? request<HomeResponse>("/api/recommendations/home", { token })
      : request<HomeResponse>("/api/recommendations/home/guest", {
          method: "POST",
          body: JSON.stringify({ ratings: guestRatings }),
        }),
  recommendations: (
    token: string | null,
    guestRatings: RatingEntry[],
    limit = 24,
    genre?: string,
  ) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (genre) q.set("genre", genre);
    return token
      ? request<RecommendationsResponse>(`/api/recommendations?${q}`, { token })
      : request<RecommendationsResponse>(`/api/recommendations/guest?${q}`, {
          method: "POST",
          body: JSON.stringify({ ratings: guestRatings }),
        });
  },
  affinity: (movieId: number, token: string | null, guestRatings: RatingEntry[]) =>
    token
      ? request<{ predictedRating: number | null }>(
          `/api/recommendations/affinity/${movieId}`,
          { token },
        )
      : request<{ predictedRating: number | null }>(
          `/api/recommendations/affinity/${movieId}`,
          { method: "POST", body: JSON.stringify({ ratings: guestRatings }) },
        ),

  // -------- ratings
  myRatings: (token: string) =>
    request<{ total: number; results: Movie[] }>("/api/ratings", { token }),
  rate: (token: string, movieId: number, rating: number) =>
    request("/api/ratings", {
      method: "POST",
      token,
      body: JSON.stringify({ movieId, rating }),
    }),
  deleteRating: (token: string, movieId: number) =>
    request(`/api/ratings/${movieId}`, { method: "DELETE", token }),
  syncRatings: (token: string, ratings: RatingEntry[]) =>
    request<{ imported: number }>("/api/ratings/sync", {
      method: "POST",
      token,
      body: JSON.stringify({ ratings }),
    }),

  // -------- watchlist
  myWatchlist: (token: string) =>
    request<{ total: number; results: Movie[] }>("/api/watchlist", { token }),
  addWatchlist: (token: string, movieId: number) =>
    request("/api/watchlist", {
      method: "POST",
      token,
      body: JSON.stringify({ movieId }),
    }),
  removeWatchlist: (token: string, movieId: number) =>
    request(`/api/watchlist/${movieId}`, { method: "DELETE", token }),

  // -------- perfil / meta
  profile: (token: string | null, guestRatings: RatingEntry[]) =>
    token
      ? request<ProfileResponse>("/api/profile", { token })
      : request<ProfileResponse>("/api/profile/guest", {
          method: "POST",
          body: JSON.stringify({ ratings: guestRatings }),
        }),
  modelComparison: () =>
    request<{ models: Record<string, string | number>[] }>("/api/meta/models"),
  stats: () => request<Record<string, unknown>>("/api/meta/stats"),

  // -------- búsqueda semántica / RAG (Fase 4)
  semanticSearch: (q: string, k = 12, generate = false) => {
    const params = new URLSearchParams({ q, k: String(k) });
    if (generate) params.set("generate", "true");
    return request<SemanticResponse>(`/api/search/semantic?${params.toString()}`);
  },
};
