import React from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Button,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import MovieRoundedIcon from '@mui/icons-material/MovieRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

import PageHeader from '../components/PageHeader';

export default function Insights({ communities = [] }) {
  return (
    <>
      <PageHeader
        eyebrow="Comunidades"
        title="Audiencias con perfil propio"
        description="Los espectadores del dataset se agrupan en 6 comunidades de gustos similares (KMeans sobre embeddings SVD de 50 dimensiones). Cada comunidad tiene un nombre descriptivo, un género dominante y sus películas estrella."
      />

      <Grid container spacing={{ xs: 3, md: 4 }}>
        {communities.map((c) => (
          <Grid key={c.cluster} size={{ xs: 12, md: 6 }}>
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 3, md: 4 },
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 5,
                  bgcolor: c.color,
                }}
              />

              <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: c.color,
                    color: 'white',
                    width: 56,
                    height: 56,
                    fontWeight: 800,
                  }}
                >
                  <GroupsRoundedIcon />
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="overline"
                    sx={{ color: c.color, fontWeight: 700, display: 'block', lineHeight: 1.2 }}
                  >
                    {c.top_genre_es}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    {c.name}
                  </Typography>
                </Box>
              </Stack>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.65 }}>
                {c.tagline}
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
                <Chip
                  icon={<GroupsRoundedIcon sx={{ fontSize: 18 }} />}
                  label={`${c.n_users.toLocaleString('es-BO')} personas`}
                  variant="outlined"
                />
                <Chip
                  icon={<MovieRoundedIcon sx={{ fontSize: 18 }} />}
                  label={`${c.n_movies.toLocaleString('es-BO')} películas`}
                  variant="outlined"
                />
                <Chip
                  icon={<StarRoundedIcon sx={{ fontSize: 18 }} />}
                  label={`Promedio ${c.rating_mean.toFixed(2)}★`}
                  variant="outlined"
                />
                <Chip label={c.taste_label} sx={{ bgcolor: c.color, color: 'white', fontWeight: 600 }} />
              </Stack>

              <Divider sx={{ mb: 2 }} />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', mb: 1 }}
              >
                Películas estrella
              </Typography>
              <List dense disablePadding>
                {c.top_titles.slice(0, 5).map((title, i) => (
                  <ListItem key={title} disablePadding sx={{ py: 0.4 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2">
                          <Box component="span" sx={{ color: c.color, fontWeight: 700, mr: 1 }}>
                            {i + 1}.
                          </Box>
                          {title}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2.5, lineHeight: 1.6 }}>
                {c.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper
        variant="outlined"
        sx={{
          mt: 6,
          p: { xs: 3, md: 4 },
          bgcolor: 'background.paper',
          borderColor: 'divider',
          borderTop: '4px solid',
          borderTopColor: 'primary.main',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              ¿Querés probar cómo recomienda cada comunidad?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              En Descubrir podés filtrar perfiles por género favorito y ver el Top que les arma el
              recomendador.
            </Typography>
          </Box>
          <Button
            href="/discover/"
            variant="contained"
            size="large"
            endIcon={<ArrowForwardRoundedIcon />}
          >
            Ir a Descubrir
          </Button>
        </Stack>
      </Paper>
    </>
  );
}
