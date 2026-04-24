import React from 'react';
import {
  Box,
  Paper,
  TextField,
  Stack,
  InputAdornment,
  Chip,
  Alert,
  LinearProgress,
  Typography,
  MenuItem,
  Button,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';

import PageHeader from '../components/PageHeader';
import MovieCard from '../components/MovieCard';
import { getJson } from '../api';

const SORT_OPTIONS = [
  { value: 'score', label: 'Mejor puntuadas (score bayesiano)' },
  { value: 'alpha', label: 'Alfabético (A – Z)' },
];

export default function Catalog({ genres = [], featured = [] }) {
  const [query, setQuery] = React.useState('');
  const [genre, setGenre] = React.useState(null);
  const [sort, setSort] = React.useState('score');
  const [results, setResults] = React.useState(featured);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const hasFilters = query.trim().length >= 2 || genre || sort !== 'score';

  React.useEffect(() => {
    let cancelled = false;
    // Si no hay filtros activos, mostramos las destacadas iniciales
    if (!hasFilters) {
      setResults(featured);
      setError(null);
      return undefined;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim().length >= 2) params.set('q', query);
      if (genre) params.set('genre', genre);
      params.set('sort', sort);
      params.set('limit', '24');
      getJson(`/api/movies/?${params.toString()}`)
        .then((data) => {
          if (cancelled) return;
          setResults(data.hits || []);
          setError(null);
        })
        .catch((err) => {
          if (!cancelled) setError(err.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, genre, sort, featured, hasFilters]);

  const clearAll = () => {
    setQuery('');
    setGenre(null);
    setSort('score');
  };

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Explorá todas las películas"
        description="Filtrá por género, ordená por puntaje o buscá por título. El score bayesiano ajusta la popularidad por cantidad de reseñas."
      />

      <Paper variant="outlined" sx={{ p: { xs: 3, md: 3.5 }, mb: 4 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
          <TuneRoundedIcon color="action" fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Filtros
          </Typography>
          {hasFilters && (
            <Button
              size="small"
              startIcon={<ClearRoundedIcon />}
              onClick={clearAll}
              sx={{ ml: 'auto' }}
            >
              Limpiar filtros
            </Button>
          )}
        </Stack>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <TextField
              fullWidth
              placeholder="Buscar por título (ej. Matrix, Lord of the Rings)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              select
              fullWidth
              label="Ordenar"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, mb: 1, display: 'block' }}
          >
            Género
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            <Chip
              label="Todos"
              onClick={() => setGenre(null)}
              color={!genre ? 'primary' : 'default'}
              variant={!genre ? 'filled' : 'outlined'}
            />
            {genres.slice(0, 18).map((g) => (
              <Chip
                key={g.label}
                label={`${g.label} · ${g.count}`}
                onClick={() => setGenre(g.label === genre ? null : g.label)}
                color={genre === g.label ? 'primary' : 'default'}
                variant={genre === g.label ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>
        </Box>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 2.5 }}>
        <Typography variant="h6">
          {hasFilters ? `${results.length} resultados` : 'Películas destacadas'}
        </Typography>
        {genre && (
          <Chip label={`Filtrando: ${genre}`} onDelete={() => setGenre(null)} color="primary" />
        )}
      </Stack>

      {results.length === 0 && !loading ? (
        <Alert severity="info">
          Sin resultados con los filtros actuales. Probá otro género o limpiá la búsqueda.
        </Alert>
      ) : (
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {results.map((movie, i) => (
            <Grid key={movie.movieId} size={{ xs: 6, sm: 4, md: 3 }}>
              <MovieCard movie={movie} rank={!hasFilters && i < 8 ? i + 1 : undefined} />
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
}
