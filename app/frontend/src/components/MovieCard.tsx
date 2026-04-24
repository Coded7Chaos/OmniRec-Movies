import React from 'react';
import { Card, CardActionArea, Box, Stack, Typography, Chip, Rating } from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import LocalMoviesRoundedIcon from '@mui/icons-material/LocalMoviesRounded';

const POSTER_COLORS = [
  '#4f46e5',
  '#0891b2',
  '#059669',
  '#d97706',
  '#db2777',
  '#dc2626',
  '#0ea5e9',
  '#9333ea',
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

export default function MovieCard({ movie, rank, onClick, compact = false }: any) {
  const year = extractYear(movie.title);
  const clean = cleanTitle(movie.title);
  const genres = movie.genresList || (movie.genres ? movie.genres.split(' · ') : []);
  const primaryScore = movie.score ?? movie.bayesian;

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          height: compact ? 120 : 160,
          background: posterFor(movie.movieId),
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          color: 'white',
        }}
      >
        <LocalMoviesRoundedIcon sx={{ fontSize: compact ? 36 : 48, opacity: 0.75 }} />
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
              fontSize: '0.8rem',
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
              '& .MuiChip-icon': { color: '#fbbf24' },
            }}
          />
        )}
      </Box>
      <Box sx={{ p: { xs: 2, md: 2.25 }, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 0.5,
            minHeight: 44,
          }}
        >
          {clean}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          {year && (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {year}
            </Typography>
          )}
          {primaryScore != null && (
            <>
              <Box sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>•</Box>
              <Rating
                value={Math.max(0, Math.min(5, primaryScore))}
                precision={0.1}
                readOnly
                size="small"
              />
            </>
          )}
        </Stack>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} sx={{ mt: 'auto' }}>
          {genres.slice(0, 3).map((g) => (
            <Chip
              key={g}
              label={g}
              size="small"
              variant="outlined"
              sx={{ borderRadius: 1.5, fontSize: '0.72rem' }}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );

  return (
    <Card
      sx={{
        height: '100%',
        overflow: 'hidden',
        '&:hover': onClick ? { borderColor: 'primary.main', transform: 'translateY(-2px)' } : {},
      }}
    >
      {onClick ? (
        <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
}
