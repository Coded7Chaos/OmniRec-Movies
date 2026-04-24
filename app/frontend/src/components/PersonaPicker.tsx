import React from 'react';
import {
  Box,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  TextField,
  InputAdornment,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

import PersonaCard from './PersonaCard';

const INTENSITY_OPTIONS = [
  { value: 'all', label: 'Todos los perfiles' },
  { value: 'casual', label: 'Espectadores casuales' },
  { value: 'regular', label: 'Cinéfilos habituales' },
  { value: 'experto', label: 'Expertos con muchas vistas' },
];

export default function PersonaPicker({
  personas,
  selectedId,
  onSelect,
  title = 'Elegí un perfil',
  description = 'Cada perfil describe a un espectador real con sus gustos y cantidad de películas vistas.',
  dense = false,
}) {
  const [intensity, setIntensity] = React.useState('all');
  const [genre, setGenre] = React.useState('all');
  const [query, setQuery] = React.useState('');

  const availableGenres = React.useMemo(() => {
    const set = new Map();
    personas.forEach((p) => {
      set.set(p.genreEs, (set.get(p.genreEs) || 0) + 1);
    });
    return Array.from(set.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));
  }, [personas]);

  const filtered = personas.filter((p) => {
    if (intensity !== 'all' && p.intensity !== intensity) return false;
    if (genre !== 'all' && p.genreEs !== genre) return false;
    if (query) {
      const q = query.toLowerCase();
      if (
        !p.displayName.toLowerCase().includes(q) &&
        !p.headline.toLowerCase().includes(q) &&
        !p.genreEs.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </Stack>

      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por nombre o género"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', mb: 1 }}
          >
            Intensidad de consumo
          </Typography>
          <ToggleButtonGroup
            value={intensity}
            exclusive
            onChange={(_, v) => v && setIntensity(v)}
            size="small"
            sx={{ flexWrap: 'wrap', gap: 1, '& .MuiToggleButtonGroup-grouped': { borderRadius: '999px !important', border: '1px solid', borderColor: 'divider', mx: '0 !important', px: 2 } }}
          >
            {INTENSITY_OPTIONS.map((o) => (
              <ToggleButton key={o.value} value={o.value}>
                {o.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', mb: 1 }}
          >
            Género favorito
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            <Chip
              label="Todos"
              onClick={() => setGenre('all')}
              color={genre === 'all' ? 'primary' : 'default'}
              variant={genre === 'all' ? 'filled' : 'outlined'}
            />
            {availableGenres.map(({ label, count }) => (
              <Chip
                key={label}
                label={`${label} · ${count}`}
                onClick={() => setGenre(label)}
                color={genre === label ? 'primary' : 'default'}
                variant={genre === label ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>
        </Box>
      </Stack>

      {filtered.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No hay perfiles que coincidan. Probá relajar los filtros.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((p) => (
            <Grid key={p.userId} size={{ xs: 12, sm: 6, md: dense ? 6 : 4, lg: dense ? 4 : 3 }}>
              <PersonaCard
                persona={p}
                selected={p.userId === selectedId}
                onClick={() => onSelect(p.userId)}
                dense={dense}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
