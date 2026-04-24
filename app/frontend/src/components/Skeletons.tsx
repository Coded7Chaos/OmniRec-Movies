import React from 'react';
import { Card, Box, Stack, Skeleton, Paper, Divider } from '@mui/material';
import Grid from '@mui/material/Grid2';

export function MovieCardSkeleton() {
  return (
    <Card sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Skeleton variant="rectangular" height={140} animation="wave" />
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Skeleton variant="text" height={24} width="80%" sx={{ mb: 0.5 }} />
        <Skeleton variant="text" height={24} width="60%" sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="40%" sx={{ mb: 1.5 }} />
        
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 'auto', pt: 1, borderTop: '1px solid #27272a' }}>
           <Skeleton variant="circular" width={16} height={16} />
           <Skeleton variant="rectangular" width="60%" height={16} />
        </Stack>
      </Box>
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Skeleton variant="rounded" width={44} height={44} />
      <Stack spacing={0.5}>
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" height={40} width="60%" />
        <Skeleton variant="text" width="80%" />
      </Stack>
    </Card>
  );
}

export function InsightsCardSkeleton() {
  return (
    <Card variant="outlined" sx={{ p: { xs: 3, md: 4 }, height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Skeleton variant="rectangular" height={5} sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
      <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mb: 2 }}>
        <Skeleton variant="circular" width={56} height={56} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Skeleton variant="text" width="30%" />
          <Skeleton variant="text" height={32} width="60%" />
        </Box>
      </Stack>
      <Skeleton variant="text" height={24} width="100%" sx={{ mb: 0.5 }} />
      <Skeleton variant="text" height={24} width="80%" sx={{ mb: 2.5 }} />
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Skeleton variant="rounded" width={100} height={32} />
        <Skeleton variant="rounded" width={100} height={32} />
        <Skeleton variant="rounded" width={100} height={32} />
      </Stack>
      <Skeleton variant="rectangular" height={1} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="40%" sx={{ mb: 1 }} />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} variant="text" width="90%" sx={{ mb: 0.5 }} />
      ))}
    </Card>
  );
}

export function ProfileSkeleton() {
  return (
    <Box>
      {/* Header Skeleton */}
      <Box sx={{ mb: 6 }}>
        <Skeleton variant="text" width="10%" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="35%" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="55%" height={30} />
      </Box>

      <Grid container spacing={4} alignItems="flex-start">
        {/* Columna Izquierda: Identidad */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderTop: '6px solid', borderColor: 'divider' }}>
            <Stack spacing={3} alignItems="center">
              <Skeleton variant="circular" width={80} height={80} />
              <Box sx={{ width: '100%' }}>
                <Skeleton variant="text" width="30%" sx={{ mx: 'auto' }} />
                <Skeleton variant="text" height={48} width="60%" sx={{ mx: 'auto' }} />
              </Box>
              <Skeleton variant="rounded" width={200} height={32} />
              <Box sx={{ width: '100%' }}>
                <Skeleton variant="text" />
                <Skeleton variant="text" />
                <Skeleton variant="text" width="80%" sx={{ mx: 'auto' }} />
              </Box>
              <Divider sx={{ width: '100%' }} />
              <Stack direction="row" spacing={4} justifyContent="center" sx={{ width: '100%' }}>
                <Box sx={{ width: 80 }}><Skeleton variant="text" height={40} /><Skeleton variant="text" /></Box>
                <Box sx={{ width: 80 }}><Skeleton variant="text" height={40} /><Skeleton variant="text" /></Box>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* Columna Derecha: Actividad */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper variant="outlined" sx={{ p: 4 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="text" width="40%" height={32} />
            </Stack>
            <Stack spacing={2}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Box key={i}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="70%" height={24} />
                      <Skeleton variant="text" width="30%" />
                    </Box>
                    <Skeleton variant="rectangular" width={100} height={20} />
                  </Stack>
                  {i < 4 && <Divider />}
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
