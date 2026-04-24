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
  Rating,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PageHeader from '../components/PageHeader';

export default function Profile({ profile, recentRatings = [], allCommunities = [] }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <PageHeader
        eyebrow="Mi Perfil"
        title="Tu Identidad Cinematográfica"
        description="Analizamos tus gustos para encontrarte una comunidad de personas con preferencias similares."
      />

      <Grid container spacing={4} alignItems="flex-start">
        {/* Columna Izquierda: Identidad */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              textAlign: 'center',
              borderTop: '6px solid',
              borderColor: profile.has_profile ? profile.color : 'divider',
            }}
          >
            {profile.has_profile ? (
              <Stack spacing={3} alignItems="center">
                <Typography variant="h1" sx={{ fontSize: '4rem' }}>
                  {profile.emoji}
                </Typography>
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                    Tu Comunidad es:
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                    <Typography variant="h4" sx={{ fontWeight: 900, color: profile.color }}>
                      {profile.name}
                    </Typography>
                    <IconButton size="small" onClick={() => setOpen(true)} title="Ver todas las comunidades">
                        <HelpOutlineRoundedIcon fontSize="small" color="action" />
                    </IconButton>
                  </Stack>
                </Box>
                <Chip 
                    label={profile.tagline} 
                    sx={{ bgcolor: profile.color, color: 'white', fontWeight: 700, py: 2 }} 
                />
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {profile.description}
                </Typography>
                
                <Divider sx={{ width: '100%' }} />
                
                <Stack direction="row" spacing={4} justifyContent="center">
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>{profile.n_ratings}</Typography>
                    <Typography variant="caption" color="text.secondary">Votos dados</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>{profile.stats.avg_rating}★</Typography>
                    <Typography variant="caption" color="text.secondary">Promedio</Typography>
                  </Box>
                </Stack>
              </Stack>
            ) : (
              <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
                <AccountCircleRoundedIcon sx={{ fontSize: 80, color: 'text.disabled' }} />
                <Typography variant="h6">Perfil en formación</Typography>
                <Alert severity="info" sx={{ textAlign: 'left' }}>
                  {profile.message}
                </Alert>
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Columna Derecha: Actividad Reciente */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper variant="outlined" sx={{ p: 4 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <HistoryRoundedIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Actividad Reciente</Typography>
            </Stack>
            
            {recentRatings.length === 0 ? (
              <Typography color="text.secondary">Aún no has puntuado ninguna película.</Typography>
            ) : (
              <List disablePadding>
                {recentRatings.map((r, i) => (
                  <React.Fragment key={i}>
                    <ListItem sx={{ px: 0, py: 2 }}>
                      <ListItemText
                        primary={r.movie__title}
                        secondary={new Date(r.created_at).toLocaleDateString()}
                        primaryTypographyProps={{ fontWeight: 700 }}
                      />
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{r.rating}</Typography>
                        <Rating value={r.rating} readOnly size="small" precision={0.5} />
                      </Stack>
                    </ListItem>
                    {i < recentRatings.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Modal de Todas las Comunidades */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Explora todas las Comunidades
          <IconButton onClick={() => setOpen(false)} size="small"><CloseRoundedIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {allCommunities.map((c) => (
              <Box key={c.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', borderLeft: '4px solid', borderColor: c.color }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="h5">{c.emoji}</Typography>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: c.color }}>
                      {c.name}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8 }}>
                        {c.tagline}
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                    {c.description}
                </Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} variant="contained" fullWidth>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
