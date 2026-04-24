import React from 'react';
import { Stack, Typography, Box } from '@mui/material';

export default function SectionTitle({ overline, title, description, actions }: any) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
      spacing={2}
      sx={{ mb: { xs: 3, md: 4 } }}
    >
      <Box sx={{ maxWidth: 680 }}>
        {overline && (
          <Typography
            variant="overline"
            color="primary.main"
            sx={{ display: 'block', mb: 0.5 }}
          >
            {overline}
          </Typography>
        )}
        <Typography variant="h4" sx={{ mb: description ? 1 : 0 }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body1" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
      {actions && <Stack direction="row" spacing={1.5}>{actions}</Stack>}
    </Stack>
  );
}
