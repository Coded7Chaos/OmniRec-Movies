import React from 'react';
import { Card, CardActionArea, Box, Stack, Typography, Chip, Avatar } from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';

export default function PersonaCard({ persona, selected, onClick, dense = false }) {
  const initials = persona.displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

  return (
    <Card
      sx={{
        height: '100%',
        borderColor: selected ? 'primary.main' : 'divider',
        borderWidth: selected ? 2 : 1,
        bgcolor: selected ? 'primary.light' : 'background.paper',
        transition: 'all 160ms ease',
        '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)' },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ height: '100%', p: 0 }}>
        <Box sx={{ p: dense ? 2 : 2.5 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: persona.color,
                color: 'white',
                fontWeight: 800,
                width: dense ? 40 : 48,
                height: dense ? 40 : 48,
                fontSize: dense ? '0.9rem' : '1rem',
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                {persona.displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
                {persona.headline}
              </Typography>
            </Box>
            {selected && (
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <PlayArrowRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
            )}
          </Stack>

          {!dense && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1.5,
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                minHeight: 40,
              }}
            >
              {persona.description}
            </Typography>
          )}

          <Stack direction="row" spacing={0.75} flexWrap="wrap" gap={0.5}>
            <Chip
              size="small"
              label={persona.genreEs}
              sx={{ bgcolor: persona.color, color: 'white', fontWeight: 600 }}
            />
            <Chip
              size="small"
              variant="outlined"
              label={`${persona.nRatings.toLocaleString('es-BO')} vistas`}
            />
            {!dense && (
              <Chip
                size="small"
                variant="outlined"
                label={persona.intensityLabel}
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Stack>
        </Box>
      </CardActionArea>
    </Card>
  );
}
