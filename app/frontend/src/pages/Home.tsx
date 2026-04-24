import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Chip,
  Container,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import MovieFilterRoundedIcon from '@mui/icons-material/MovieFilterRounded';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import ModelTrainingRoundedIcon from '@mui/icons-material/ModelTrainingRounded';

import MovieCard from '../components/MovieCard';
import SectionTitle from '../components/SectionTitle';

const fmt = (x) => (typeof x === 'number' ? x.toLocaleString('es-BO') : x);

const FEATURES = [
  {
    icon: <AutoAwesomeRoundedIcon />,
    title: 'Recomendaciones personalizadas',
    body: 'Regístrate, puntúa películas y recibe sugerencias basadas en tus propios gustos.',
  },
  {
    icon: <ModelTrainingRoundedIcon />,
    title: '5 algoritmos comparables',
    body: 'Popularidad bayesiana, KNN, SVD, NMF y AutoML. Puedes comparar resultados lado a lado.',
  },
  {
    icon: <BoltRoundedIcon />,
    title: 'Resultados al instante',
    body: 'Lista corta con el baseline + re-ranking con el modelo elegido. Inferencia rápida.',
  },
];

export default function Home({ featured = [], stats = {} as any, communities = [], userRatings = [] }) {
  const { auth }: any = usePage().props;

  const getInitialRating = (movieId) => {
    const r = userRatings.find(r => r.movie_id === movieId);
    return r ? r.rating : 0;
  };

  return (
    <Box>
      {/* ---------- HERO ---------- */}
      <Box
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
          mb: { xs: 6, md: 8 },
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          px: { xs: 4, md: 8 },
          py: { xs: 6, md: 10 },
        }}
      >
        <Grid container spacing={6} alignItems="center" sx={{ position: 'relative' }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Chip
              icon={<MovieFilterRoundedIcon />}
              label="Sistema de recomendación · MovieLens 25M"
              sx={{
                bgcolor: 'rgba(0,0,0,0.05)',
                color: 'text.primary',
                fontWeight: 700,
                mb: 3,
                borderRadius: 1,
                '& .MuiChip-icon': { color: 'text.primary' },
              }}
            />
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                textTransform: 'uppercase',
                mb: 2.5,
                fontSize: { xs: '2.2rem', md: '3.25rem' },
              }}
            >
              Encuentra tu próxima <Box component="span" sx={{ color: '#E50914' }}>película favorita</Box>
            </Typography>
            <Typography
              variant="body1"
              sx={{
                opacity: 0.88,
                fontSize: { xs: '1rem', md: '1.15rem' },
                mb: 4,
                maxWidth: 560,
                color: 'text.secondary'
              }}
            >
              OmniRec combina cinco modelos de recomendación entrenados sobre 15 millones de
              reseñas reales (muestra del 60% de MovieLens 25M). Regístrate para puntuar películas y obtener recomendaciones curadas para ti,
              o explora el catálogo y los algoritmos en nuestro laboratorio.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                component={Link}
                href={auth?.user ? "/discover/" : "/register/"}
                size="large"
                variant="contained"
                color="primary"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{ fontWeight: 700 }}
              >
                {auth?.user ? "Ver mis recomendaciones" : "Crear mi cuenta"}
              </Button>
              <Button
                component={Link}
                href="/catalog/"
                size="large"
                variant="outlined"
                startIcon={<ExploreRoundedIcon />}
                sx={{
                  borderColor: 'divider',
                  color: 'text.primary',
                }}
              >
                Explorar catálogo
              </Button>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={2}>
              {[
                { label: 'Películas en catálogo', value: fmt(stats.movies) },
                { label: 'Reseñas analizadas', value: fmt(stats.ratings) },
                { label: 'Comunidades de gustos', value: fmt(stats.communities) },
              ].map((s) => (
                <Stack
                  key={s.label}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    px: 2.5,
                    py: 1.5,
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {s.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {s.value}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* ---------- PELÍCULAS DESTACADAS ---------- */}
      <Box sx={{ mb: { xs: 6, md: 10 } }}>
        <SectionTitle
          overline="Destacadas"
          title="Lo mejor puntuado del catálogo"
          description="Ordenadas por score bayesiano (popularidad ponderada por volumen de reseñas)."
          actions={
            <Button
              component={Link}
              href="/catalog/"
              variant="outlined"
              endIcon={<ArrowForwardRoundedIcon />}
            >
              Ver todo el catálogo
            </Button>
          }
        />
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {featured.slice(0, 8).map((m, i) => (
            <Grid key={m.movieId} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <MovieCard 
                movie={m} 
                rank={i + 1} 
                isAuth={!!auth?.user} 
                initialRating={getInitialRating(m.movieId)} 
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ---------- CÓMO FUNCIONA ---------- */}
      <Box sx={{ mb: { xs: 6, md: 10 } }}>
        <SectionTitle
          overline="Cómo funciona"
          title="Tu experiencia en OmniRec"
          description="Desde que te registras hasta que recibes recomendaciones personalizadas."
        />
        <Grid container spacing={3}>
          {[
            {
              icon: <GroupsRoundedIcon />,
              title: '1. Regístrate',
              body: 'Crea tu cuenta en segundos para empezar a guardar tus propios puntajes.',
              cta: 'Empezar',
              href: '/register/',
              color: 'primary',
            },
            {
              icon: <ExploreRoundedIcon />,
              title: '2. Puntúa películas',
              body: 'Busca en el catálogo tus películas favoritas y dales una calificación de 1 a 5 estrellas.',
              cta: 'Ir al catálogo',
              href: '/catalog/',
              color: 'info',
            },
            {
              icon: <AutoAwesomeRoundedIcon />,
              title: '3. Recibe recomendaciones',
              body: 'Nuestro sistema usará tus votos para sugerirte nuevas películas usando algoritmos de IA.',
              cta: 'Ver recomendaciones',
              href: '/discover/',
              color: 'success',
            },
          ].map((card) => (
            <Grid key={card.title} size={{ xs: 12, md: 4 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 3, md: 4 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2.5,
                    bgcolor: (t) => t.palette[card.color].light,
                    color: (t) => t.palette[card.color].main,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.body}
                  </Typography>
                </Box>
                <Button
                  component={Link}
                  href={card.href}
                  endIcon={<ArrowForwardRoundedIcon />}
                  sx={{ alignSelf: 'flex-start', mt: 'auto' }}
                  color={card.color as any}
                >
                  {card.cta}
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
