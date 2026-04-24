import React from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Chip,
  MenuItem,
  TextField,
  Alert,
  LinearProgress,
  Divider,
  Avatar,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import PageHeader from '../components/PageHeader';
import PersonaPicker from '../components/PersonaPicker';
import MovieCard from '../components/MovieCard';
import SectionTitle from '../components/SectionTitle';
import { postJson } from '../api';

const STEPS = ['Elegí un perfil', 'Ajustá los detalles', 'Mirá tus recomendaciones'];

export default function Discover({ personas = [], models = [] }) {
  const [selectedId, setSelectedId] = React.useState(null);
  const [modelKey, setModelKey] = React.useState('svd');
  const [n, setN] = React.useState(12);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState(null);

  const selectedPersona = personas.find((p) => p.userId === selectedId) || null;
  const activeStep = !selectedPersona ? 0 : !result ? 1 : 2;
  const currentModel = models.find((m) => m.key === modelKey);

  const resultsRef = React.useRef(null);

  const run = async () => {
    if (!selectedId) {
      setError('Seleccioná un perfil para continuar.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await postJson('/api/recommend/', {
        user_id: selectedId,
        model_key: modelKey,
        n,
      });
      setResult(data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedId(null);
    setResult(null);
    setError(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Recomendaciones personalizadas"
        title="Descubrí tu próxima película"
        description="Elegí un perfil que se parezca a vos, ajustá cuántas películas querés ver y qué algoritmo preferís. En segundos te devolvemos un Top curado."
      />

      <Paper
        variant="outlined"
        sx={{ p: { xs: 3, md: 4 }, mb: 4, bgcolor: 'background.paper' }}
      >
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel sx={{ '& .MuiStepLabel-label': { fontWeight: 600 } }}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Paso 1: elegir perfil */}
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
        <PersonaPicker
          personas={personas}
          selectedId={selectedId}
          onSelect={setSelectedId}
          title="1. ¿Con qué perfil te identificás más?"
          description="Cada persona es un espectador real del dataset. Su nombre es ficticio, pero sus gustos y cantidad de películas vistas son reales."
        />
      </Paper>

      {/* Paso 2: ajustes */}
      {selectedPersona && (
        <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            alignItems={{ md: 'center' }}
            justifyContent="space-between"
            sx={{ mb: 3 }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <TuneRoundedIcon color="primary" />
              <Box>
                <Typography variant="h6">2. Ajustá los detalles</Typography>
                <Typography variant="body2" color="text.secondary">
                  Elegí cuántas películas querés recibir y qué algoritmo usar para ordenarlas.
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="text"
              size="small"
              startIcon={<RefreshRoundedIcon />}
              onClick={reset}
            >
              Cambiar perfil
            </Button>
          </Stack>

          {/* Resumen del perfil elegido */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              bgcolor: '#18181b',
              borderLeft: '4px solid',
              borderColor: 'primary.main',
            }}
            elevation={0}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ sm: 'center' }}>
              <Avatar
                sx={{
                  bgcolor: selectedPersona.color,
                  color: 'white',
                  fontWeight: 800,
                  width: 56,
                  height: 56,
                  fontSize: '1.1rem',
                }}
              >
                {selectedPersona.displayName.split(' ').map((w) => w[0]).join('').slice(0, 2)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ color: 'white', textTransform: 'uppercase', fontWeight: 800 }}>
                  Recomendando para: {selectedPersona.displayName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {selectedPersona.description}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                <Chip label={selectedPersona.genreEs} sx={{ bgcolor: selectedPersona.color, color: 'white', fontWeight: 700 }} />
                <Chip variant="outlined" label={`Comunidad: ${selectedPersona.community}`} />
              </Stack>
            </Stack>
          </Paper>

          <Grid container spacing={3} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                select
                fullWidth
                label="Algoritmo de recomendación"
                value={modelKey}
                onChange={(e) => setModelKey(e.target.value)}
                helperText={currentModel?.hint}
              >
                {models.map((m) => (
                  <MenuItem key={m.key} value={m.key}>
                    {m.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Cantidad de películas"
                value={n}
                onChange={(e) => setN(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                inputProps={{ min: 1, max: 30 }}
                helperText="Entre 1 y 30 películas"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<PlayArrowRoundedIcon />}
                onClick={run}
                disabled={loading}
                sx={{ height: 56 }}
              >
                {loading ? 'Buscando…' : 'Ver mis recomendaciones'}
              </Button>
            </Grid>
          </Grid>
          {loading && <LinearProgress sx={{ mt: 2 }} />}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Paper>
      )}

      {/* Paso 3: resultados */}
      <Box ref={resultsRef}>
        {result && (
          <Box>
            <SectionTitle
              overline="3. Tus recomendaciones"
              title={`${result.n} películas para ${result.persona.displayName}`}
              description={`Generadas con ${result.model_label} en ${result.elapsed_ms} ms. Ordenadas por afinidad predicha.`}
              actions={
                <Button variant="outlined" onClick={reset} startIcon={<RefreshRoundedIcon />}>
                  Empezar de nuevo
                </Button>
              }
            />
            {result.recs.length === 0 ? (
              <Alert severity="info">El modelo no devolvió candidatos.</Alert>
            ) : (
              <Grid container spacing={{ xs: 2, md: 3 }}>
                {result.recs.map((movie, i) => (
                  <Grid key={movie.movieId} size={{ xs: 6, sm: 4, md: 3 }}>
                    <MovieCard movie={movie} rank={i + 1} />
                  </Grid>
                ))}
              </Grid>
            )}
            <Divider sx={{ my: 6 }} />
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 3, md: 4 },
                bgcolor: 'background.paper',
                borderColor: '#27272a',
                borderTop: '4px solid',
                borderTopColor: 'primary.main',
              }}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
                <Box>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    ¿Querés ver cómo piensan otros algoritmos?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    En el Laboratorio podés comparar los 5 modelos lado a lado sobre una misma película.
                  </Typography>
                </Box>
                <Button href="/lab/" variant="contained" size="large">
                  Ir al laboratorio
                </Button>
              </Stack>
            </Paper>
          </Box>
        )}
      </Box>
    </>
  );
}
