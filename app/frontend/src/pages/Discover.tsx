import React from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  MenuItem,
  TextField,
  Alert,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { usePage, router } from '@inertiajs/react';

import PageHeader from '../components/PageHeader';
import MovieCard from '../components/MovieCard';
import SectionTitle from '../components/SectionTitle';
import { MovieCardSkeleton } from '../components/Skeletons';

export default function Discover({ recommendations = [], userRatings = [], models = [], currentModel = 'svd' }) {
  const { auth }: any = usePage().props;
  const [modelKey, setModelKey] = React.useState(currentModel);
  const [loading, setLoading] = React.useState(false);

  const handleModelChange = (key) => {
    setModelKey(key);
    setLoading(true);
    router.get('/discover/', { model: key }, { 
      preserveState: true,
      onFinish: () => setLoading(false)
    });
  };

  const getInitialRating = (movieId) => {
    const r = userRatings.find(r => r.movie_id === movieId);
    return r ? r.rating : 0;
  };

  return (
    <>
      <PageHeader
        eyebrow="Recomendaciones personalizadas"
        title={`¡Hola, ${auth.user.username}!`}
        description="Estas son tus películas recomendadas basadas en los puntajes que diste. Cuanto más puntúes, mejor te conocerá nuestro sistema."
      />

      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <TuneRoundedIcon color="primary" />
            <Box>
              <Typography variant="h6">Configuración del modelo</Typography>
              <Typography variant="body2" color="text.secondary">
                Cambia el algoritmo para ver cómo varían tus recomendaciones.
              </Typography>
            </Box>
          </Stack>
          
          <TextField
            select
            sx={{ minWidth: 250 }}
            label="Algoritmo"
            value={modelKey}
            onChange={(e) => handleModelChange(e.target.value)}
          >
            {models.map((m) => (
              <MenuItem key={m.key} value={m.key}>
                {m.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      <Box>
        <SectionTitle
          overline="Tu Top Personalizado"
          title="Películas que te podrían gustar"
          description={`Basado en el modelo ${models.find(m => m.key === modelKey)?.label}.`}
        />

        {loading ? (
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <MovieCardSkeleton />
              </Grid>
            ))}
          </Grid>
        ) : recommendations.length === 0 ? (
          <Alert severity="info" sx={{ py: 3 }}>
            Todavía no tenemos suficientes datos sobre tus gustos. 
            <Button href="/catalog/" variant="text" sx={{ ml: 1, fontWeight: 700 }}>
                ¡Ve al catálogo y puntúa algunas películas!
            </Button>
          </Alert>
        ) : (
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {recommendations.map((movie, i) => (
              <Grid key={movie.movieId} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <MovieCard 
                    movie={movie} 
                    rank={i + 1} 
                    isAuth={!!auth.user} 
                    initialRating={getInitialRating(movie.movieId)} 
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Divider sx={{ my: 6 }} />
      
      <Alert severity="warning" variant="outlined">
          Recuerda que las recomendaciones se actualizan al cambiar de modelo o recargar la página tras puntuar nuevas películas.
      </Alert>
    </>
  );
}
