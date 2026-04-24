import React from 'react';
import { Card, CardActionArea, Box, Stack, Typography, Chip, Rating, CircularProgress } from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import LocalMoviesRoundedIcon from '@mui/icons-material/LocalMoviesRounded';
import { postJson } from '../api';

const POSTER_COLORS = [
  '#4f46e5', '#0891b2', '#059669', '#d97706', '#db2777', '#dc2626', '#0ea5e9', '#9333ea',
];

function posterFor(id) {
  return POSTER_COLORS[id % POSTER_COLORS.length];
}

function extractYear(title) {
  const m = /\((\d{4})\)\s*$/.exec(title || '');
  return m ? m[1] : null;
}

function cleanTitle(title) {
  return (title || '').replace(/\s*\(\d{4}\)\s*$/, '').trim();
}

export default function MovieCard({ movie, rank, initialRating = 0, isAuth = false }: any) {
  const [userRating, setUserRating] = React.useState(initialRating);
  const [loading, setLoading] = React.useState(false);

  const year = extractYear(movie.title);
  const clean = cleanTitle(movie.title);
  const genres = movie.genresList || (movie.genres ? movie.genres.split(' · ') : []);
  const primaryScore = movie.score ?? movie.bayesian;

  const handleRate = async (newVal) => {
    if (!isAuth) {
        window.location.href = '/login/';
        return;
    }
    setLoading(true);
    try {
      await postJson('/api/rate/', { movie_id: movie.movieId, rating: newVal });
      setUserRating(newVal);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          height: 140,
          background: posterFor(movie.movieId),
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          color: 'white',
        }}
      >
        <LocalMoviesRoundedIcon sx={{ fontSize: 40, opacity: 0.75 }} />
        {rank != null && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              bgcolor: 'rgba(15, 23, 42, 0.85)',
              color: 'white',
              borderRadius: 1.5,
              px: 1,
              py: 0.25,
              fontWeight: 800,
              fontSize: '0.75rem',
            }}
          >
            #{rank}
          </Box>
        )}
        {primaryScore != null && (
          <Chip
            size="small"
            icon={<StarRoundedIcon sx={{ color: '#fbbf24 !important' }} />}
            label={Number(primaryScore).toFixed(2)}
            sx={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              bgcolor: 'rgba(15, 23, 42, 0.85)',
              color: 'white',
              fontWeight: 700,
            }}
          />
        )}
      </Box>

      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 800,
            lineHeight: 1.2,
            mb: 0.5,
            minHeight: 34,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {clean}
        </Typography>
        
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
          {year} • {genres.slice(0, 2).join(', ')}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 'auto', pt: 1, borderTop: '1px solid #27272a' }}>
           <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>TU VOTO:</Typography>
           {loading ? <CircularProgress size={16} /> : (
             <Rating
               value={userRating}
               onChange={(_, newVal) => handleRate(newVal)}
               size="small"
               precision={0.5}
             />
           )}
        </Stack>
      </Box>
    </Card>
  );
}
