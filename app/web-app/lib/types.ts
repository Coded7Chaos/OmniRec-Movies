export interface Movie {
  movieId: number;
  title: string;
  originalTitle: string;
  year: number | null;
  genres: string[];
  avgRating: number | null;
  numRatings: number;
  bayesianScore: number;
  tmdbId: number | null;
  imdbId: number | null;
  predictedRating?: number;
  userRating?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface BrowseResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  results: Movie[];
}

export interface HomeSection {
  key: string;
  title: string;
  subtitle: string | null;
  genre?: string;
  movies: Movie[];
}

export interface HomeResponse {
  hero: Movie[];
  sections: HomeSection[];
}

export interface RecommendationsResponse {
  strategy: "svd_fold_in" | "baseline_bayesian";
  basedOn?: number;
  results: Movie[];
}

export interface Persona {
  key: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  cluster: number;
  top_genres: string[];
  n_users: number;
  avg_rating: number;
  confidence?: number;
}

export interface ProfileResponse {
  user: { id: number; username: string; email: string; memberSince: string } | null;
  persona: Persona | null;
  stats: {
    totalRatings: number;
    avgRating: number | null;
    fiveStars: number;
    topGenres: { genre: string; count: number }[];
  };
  allPersonas: Persona[];
}

export interface RatingEntry {
  movieId: number;
  rating: number;
}
