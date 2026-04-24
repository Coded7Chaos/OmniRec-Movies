import React from 'react';
import { Stack, Typography, Chip, Box } from '@mui/material';

export default function PageHeader({ eyebrow, title, description, actions, align = 'start' }: any) {
  const isCentered = align === 'center';
  return (
    <Box
      sx={{
        mb: { xs: 4, md: 6 },
        textAlign: isCentered ? 'center' : 'left',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: isCentered ? 'column' : 'row' }}
        justifyContent={isCentered ? 'center' : 'space-between'}
        alignItems={isCentered ? 'center' : { xs: 'flex-start', md: 'flex-end' }}
        spacing={3}
      >
        <Box sx={{ maxWidth: isCentered ? 820 : 780, mx: isCentered ? 'auto' : 0 }}>
          {eyebrow && (
            <Chip
              label={eyebrow}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mb: 2, fontWeight: 700, letterSpacing: '0.04em' }}
            />
          )}
          <Typography variant="h3" sx={{ mb: 1.5 }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.05rem' }}>
              {description}
            </Typography>
          )}
        </Box>
        {actions && (
          <Stack
            direction="row"
            spacing={1.5}
            flexWrap="wrap"
            justifyContent={isCentered ? 'center' : 'flex-end'}
          >
            {actions}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
