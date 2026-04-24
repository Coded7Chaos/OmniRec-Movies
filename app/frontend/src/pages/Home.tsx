import React from 'react';
import { Link } from '@inertiajs/react';
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
    body: 'Elegí un perfil parecido al tuyo y te devolvemos películas que encajan con sus gustos.',
  },
  {
    icon: <ModelTrainingRoundedIcon />,
    title: '5 algoritmos comparables',
    body: 'Popularidad bayesiana, KNN, SVD, NMF y AutoML. Podés comparar resultados lado a lado.',
  },
  {
    icon: <BoltRoundedIcon />,
    title: 'Resultados al instante',
    body: 'Shortlist con el baseline + re-ranking con el modelo elegido. Inferencia rápida.',
  },
];

export default function Home({ featured = [], stats = {} as any, communities = [] }: any) {
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
              Encontrá tu próxima <Box component="span" sx={{ color: '#E50914' }}>película favorita</Box>
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
              OmniRec combina cinco modelos de recomendación entrenados sobre 25 millones de
              reseñas reales. Elegí un perfil que se parezca al tuyo y obtené un Top personalizado,
              o probá vos mism@ qué piensan los algoritmos sobre cualquier película del catálogo.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                component={Link}
                href="/discover/"
                size="large"
                variant="contained"
                color="primary"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{ fontWeight: 700 }}
              >
                Descubrir recomendaciones
              </Button>
              <Button
                component={Link}
                href="/lab/"
                size="large"
                variant="outlined"
                startIcon={<ScienceRoundedIcon />}
                sx={{
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': { borderColor: '#E50914', bgcolor: 'rgba(229, 9, 20, 0.05)' },
                }}
              >
                Entrar al laboratorio
              </Button>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={2}>
              {[
                { label: 'Películas en catálogo', value: fmt(stats.movies) },
                { label: 'Reseñas analizadas', value: fmt(stats.ratings) },
                { label: 'Perfiles curados', value: fmt(stats.personas) },
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
          description="Ordenadas por score bayesiano (popularidad ponderada por volumen de reseñas). Son el punto de partida del recomendador."
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
            <Grid key={m.movieId} size={{ xs: 6, sm: 4, md: 3 }}>
              <MovieCard movie={m} rank={i + 1} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ---------- CÓMO FUNCIONA ---------- */}
      <Box sx={{ mb: { xs: 6, md: 10 } }}>
        <SectionTitle
          overline="Cómo funciona"
          title="Tres formas de explorar OmniRec"
          description="Desde una experiencia de usuario final hasta el detrás de escena algorítmico."
        />
        <Grid container spacing={3}>
          {[
            {
              icon: <ExploreRoundedIcon />,
              title: 'Descubrí recomendaciones',
              body: 'Elegí un perfil que se parezca a vos, ajustá género o intensidad, y recibí un Top de películas sugeridas.',
              cta: 'Descubrir',
              href: '/discover/',
              color: 'primary',
            },
            {
              icon: <GroupsRoundedIcon />,
              title: 'Explorá comunidades',
              body: 'Los espectadores se agrupan en 6 comunidades con nombre propio: mirá qué los une y qué películas estrella tiene cada una.',
              cta: 'Ver comunidades',
              href: '/insights/',
              color: 'info',
            },
            {
              icon: <ScienceRoundedIcon />,
              title: 'Probá los modelos',
              body: 'Compará cómo cinco algoritmos distintos puntúan la misma película, o generá un Top con el que prefieras.',
              cta: 'Entrar al laboratorio',
              href: '/lab/',
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

      {/* ---------- COMUNIDADES DESTACADAS ---------- */}
      {communities.length > 0 && (
        <Box sx={{ mb: { xs: 6, md: 10 } }}>
          <SectionTitle
            overline="Comunidades de gustos"
            title="Audiencias con perfil propio"
            description="El dataset se segmenta en 6 comunidades según similitud de gustos (KMeans sobre embeddings SVD). Estas son 3 de ellas."
            actions={
              <Button
                component={Link}
                href="/insights/"
                variant="outlined"
                endIcon={<ArrowForwardRoundedIcon />}
              >
                Ver las 6 comunidades
              </Button>
            }
          />
          <Grid container spacing={3}>
            {communities.map((c) => (
              <Grid key={c.cluster} size={{ xs: 12, md: 4 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: { xs: 3, md: 4 },
                    height: '100%',
                    borderTopWidth: 4,
                    borderTopColor: c.color,
                    borderTopStyle: 'solid',
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{ color: c.color, fontWeight: 700, display: 'block', mb: 0.5 }}
                  >
                    Comunidad · {c.top_genre_es}
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
                    {c.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 56 }}>
                    {c.tagline}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    <Chip size="small" label={`${c.n_users} personas`} variant="outlined" />
                    <Chip size="small" label={`${c.n_movies} películas`} variant="outlined" />
                    <Chip size="small" label={`Promedio ${c.rating_mean.toFixed(1)}★`} variant="outlined" />
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* ---------- FEATURES ---------- */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 4, md: 6 },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderRadius: 2,
          borderColor: 'divider',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Typography
            variant="overline"
            sx={{ color: '#E50914', letterSpacing: '0.14em', mb: 1, display: 'block' }}
          >
            Qué tiene OmniRec
          </Typography>
          <Typography variant="h4" sx={{ mb: 4, color: 'text.primary' }}>
            Todo el pipeline de recomendación, en una misma experiencia.
          </Typography>
          <Grid container spacing={4}>
            {FEATURES.map((f) => (
              <Grid key={f.title} size={{ xs: 12, md: 4 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'rgba(229, 9, 20, 0.08)',
                    color: '#E50914',
                    display: 'grid',
                    placeItems: 'center',
                    mb: 2,
                  }}
                >
                  {f.icon}
                </Box>
                <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
                  {f.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {f.body}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
