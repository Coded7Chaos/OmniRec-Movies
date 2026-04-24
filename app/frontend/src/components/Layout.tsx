import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Stack,
  Button,
  Container,
  useMediaQuery,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Avatar,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useTheme } from '@mui/material/styles';
import MovieFilterRoundedIcon from '@mui/icons-material/MovieFilterRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import { router } from '@inertiajs/react';
import { MovieCardSkeleton, ProfileSkeleton } from './Skeletons';
import { Skeleton } from '@mui/material';

function Brand({ dense = false }) {
  return (
    <Stack
      component={Link}
      href="/"
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Box
        sx={{
          width: dense ? 38 : 44,
          borderRadius: 1,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'grid',
          placeItems: 'center',
          boxShadow: 'none',
          aspectRatio: '1/1',
        }}
      >
        <MovieFilterRoundedIcon fontSize={dense ? 'small' : 'medium'} />
      </Box>
      <Box>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 800, lineHeight: 1, letterSpacing: '-0.01em' }}
        >
          OmniRec
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.1 }}>
          Películas recomendadas con IA
        </Typography>
      </Box>
    </Stack>
  );
}

function GlobalSkeleton() {
  return (
    <Box>
      <Box sx={{ mb: 6 }}>
        <Skeleton variant="text" width="10%" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="40%" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="60%" height={30} />
      </Box>
      <Grid container spacing={3}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Grid key={i} size={{ xs: 6, sm: 4, md: 3 }}>
            <MovieCardSkeleton />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default function Layout({ children }) {
  const { props }: any = usePage();
  const navigation = (props.navigation as any[]) || [];
  const active = props.active;
  const auth = props.auth;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [targetPath, setTargetPath] = React.useState('');

  React.useEffect(() => {
    // router.on retorna una función de desuscripción
    const unbindStart = router.on('start', (event: any) => {
      // visit.url es un objeto URL, lo convertimos a string (pathname)
      const path = event.detail.visit.url.pathname || '';
      setTargetPath(path);
      setLoading(true);
    });

    const unbindFinish = router.on('finish', () => {
      setLoading(false);
      setTargetPath('');
    });

    return () => {
      unbindStart();
      unbindFinish();
    };
  }, []);

  const isProfileLoading = targetPath.includes('/profile');

  const navButtons = (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {navigation.map((item) => {
        const isActive = active === item.key;
        return (
          <Button
            key={item.key}
            component={Link}
            href={item.href}
            variant={isActive ? 'contained' : 'text'}
            color={isActive ? 'primary' : 'inherit'}
            sx={{
              color: isActive ? 'primary.contrastText' : 'text.primary',
              fontWeight: isActive ? 700 : 500,
            }}
          >
            {item.label}
          </Button>
        );
      })}
      
      <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1 }} />

      {auth?.user ? (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
            {auth.user.username[0].toUpperCase()}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 700, mr: 1 }}>
            {auth.user.username}
          </Typography>
          <IconButton component={Link} href="/logout/" size="small" title="Cerrar sesión">
             <LogoutRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      ) : (
        <Button
          component={Link}
          href="/login/"
          variant="outlined"
          size="small"
          startIcon={<LoginRoundedIcon />}
          sx={{ ml: 1, borderRadius: 2 }}
        >
          Entrar
        </Button>
      )}
    </Stack>
  );

  const drawer = (
    <Box sx={{ width: 280 }} role="presentation" onClick={() => setDrawerOpen(false)}>
      <Box sx={{ p: 3 }}>
        <Brand dense />
      </Box>
      <Divider />
      <List sx={{ px: 1.5, py: 1 }}>
        {navigation.map((item) => (
          <ListItem key={item.key} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              href={item.href}
              selected={active === item.key}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: 'primary.dark' },
                },
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        {auth?.user ? (
          <Button
            component={Link}
            href="/logout/"
            fullWidth
            variant="outlined"
            startIcon={<LogoutRoundedIcon />}
          >
            Cerrar sesión ({auth.user.username})
          </Button>
        ) : (
          <Button
            component={Link}
            href="/login/"
            fullWidth
            variant="contained"
            startIcon={<LoginRoundedIcon />}
          >
            Iniciar sesión
          </Button>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky">
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: 2, minHeight: { xs: 68, md: 80 } }}>
            <Brand />
            <Box sx={{ flexGrow: 1 }} />
            {isMobile ? (
              <IconButton onClick={() => setDrawerOpen(true)} color="inherit" size="large">
                <MenuRoundedIcon />
              </IconButton>
            ) : (
              navButtons
            )}
          </Toolbar>
        </Container>
      </AppBar>
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flex: 1, py: { xs: 4, md: 6 } }}>
        <Container maxWidth="xl">
          {loading ? (
             isProfileLoading ? <ProfileSkeleton /> : <GlobalSkeleton />
          ) : children}
        </Container>
      </Box>

      <Box
        component="footer"
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          py: { xs: 4, md: 5 },
          mt: 6,
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={{ xs: 3, md: 6 }} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 5 }}>
              <Brand dense />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 420 }}>
                Sistema de recomendación de películas construido sobre MovieLens 25M.
                5 algoritmos comparables, perfiles reales y explicaciones transparentes.
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="overline" color="text.secondary">
                Navegar
              </Typography>
              <Stack spacing={0.75} sx={{ mt: 1 }}>
                {navigation.map((item) => (
                  <Typography
                    key={item.key}
                    component={Link}
                    href={item.href}
                    variant="body2"
                    sx={{ color: 'text.primary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                  >
                    {item.label}
                  </Typography>
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <Typography variant="overline" color="text.secondary">
                Stack
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Django · Inertia.js · React · MUI. Recomendaciones con SVD, KNN, NMF y AutoML
                sobre la muestra MovieLens 25M (1.15M ratings).
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 4 }} />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={1}
          >
            <Typography variant="caption" color="text.secondary">
              Dataset: GroupLens MovieLens 25M · CRISP-DM Fase 6 Deployment.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} OmniRec Movies
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
