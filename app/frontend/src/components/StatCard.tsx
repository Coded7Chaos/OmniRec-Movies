import React from 'react';
import { Paper, Stack, Typography, Box } from '@mui/material';

export default function StatCard({ icon, label, value, hint, accent = 'primary' }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2.5, md: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          bgcolor: (t) => t.palette[accent].light,
          color: (t) => t.palette[accent].main,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {icon}
      </Box>
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            {hint}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
