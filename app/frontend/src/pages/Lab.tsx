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
  Tabs,
  Tab,
  Divider,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';

import PageHeader from '../components/PageHeader';
import PersonaPicker from '../components/PersonaPicker';
import MovieAutocomplete from '../components/MovieAutocomplete';
import MovieCard from '../components/MovieCard';
import { postJson } from '../api';

const METRIC_COLS = [
  { key: 'RMSE', label: 'Error (RMSE)', digits: 4, lowerIsBetter: true },
  { key: 'MAE', label: 'Error (MAE)', digits: 4, lowerIsBetter: true },
  { key: 'P@10', label: 'Precisión @10', digits: 3 },
  { key: 'R@10', label: 'Cobertura @10', digits: 3 },
  { key: 'NDCG@10', label: 'Calidad de orden', digits: 3 },
  { key: 'Tiempo (s)', label: 'Entreno (s)', digits: 1 },
];

function SelectedPersonaSummary({ persona }) {
  if (!persona) return null;
  return (
    <Paper
      sx={{
        p: 2.5,
        mb: 3,
        bgcolor: 'background.paper',
        borderLeft: '4px solid',
        borderColor: 'primary.main',
      }}
      elevation={0}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          sx={{ bgcolor: persona.color, color: 'white', fontWeight: 800, width: 48, height: 48 }}
        >
          {persona.displayName.split(' ').map((w) => w[0]).join('').slice(0, 2)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
            {persona.displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {persona.description}
          </Typography>
        </Box>
        <Chip
          size="small"
          label={persona.genreEs}
          sx={{ bgcolor: persona.color, color: 'white', fontWeight: 700 }}
        />
      </Stack>
    </Paper>
  );
}

function TopNTab({ personas, models }) {
  const [selectedId, setSelectedId] = React.useState(null);
  const [modelKey, setModelKey] = React.useState('svd');
  const [n, setN] = React.useState(10);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState(null);

  const persona = personas.find((p) => p.userId === selectedId) || null;
  const currentModel = models.find((m) => m.key === modelKey);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await postJson('/api/recommend/', {
        user_id: selectedId,
        model_key: modelKey,
        n,
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Typography variant="h6" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            1. SELECCIONAR PERFIL
          </Typography>
          <Paper variant="outlined" sx={{ p: 3, mb: 4, height: 'auto', bgcolor: 'background.paper' }}>
            <PersonaPicker
              personas={personas}
              selectedId={selectedId}
              onSelect={setSelectedId}
              title="PERFIL DE ESPECTADOR"
              description="Filtrá y elegí un perfil para generar recomendaciones personalizadas."
              dense
            />
          </Paper>

          {persona && (
            <>
              <Typography variant="h6" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                2. CONFIGURAR MOTOR
              </Typography>
              <Paper variant="outlined" sx={{ p: 3, mb: 4, bgcolor: 'background.paper' }}>
                <SelectedPersonaSummary persona={persona} />
                <Stack spacing={3}>
                  <TextField
                    select
                    fullWidth
                    label="Algoritmo"
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
                  
                  <TextField
                    fullWidth
                    type="number"
                    label="Cantidad a recomendar"
                    value={n}
                    onChange={(e) => setN(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                    inputProps={{ min: 1, max: 30 }}
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    color="primary"
                    startIcon={<PlayArrowRoundedIcon />}
                    onClick={run}
                    disabled={loading}
                    sx={{ height: 56, fontWeight: 800 }}
                  >
                    {loading ? 'Calculando...' : 'Generar Cartelera'}
                  </Button>
                </Stack>

                {loading && <LinearProgress color="primary" sx={{ mt: 3 }} />}
                {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
              </Paper>
            </>
          )}
        </Grid>
        
        <Grid size={{ xs: 12, lg: 7 }}>
          <Typography variant="h6" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            CARTELERA GENERADA
          </Typography>
          {!result && !loading && (
            <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed', borderColor: '#27272a', bgcolor: 'transparent' }}>
              <ScienceRoundedIcon sx={{ fontSize: 64, color: '#3f3f46', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" textTransform="uppercase">
                Sin resultados
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configurá el perfil y el motor para ver las recomendaciones.
              </Typography>
            </Paper>
          )}
          
          {result && (
            <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, bgcolor: 'background.paper' }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ sm: 'center' }}
                spacing={2}
                sx={{ mb: 3 }}
              >
                <Box>
                  <Typography variant="h5" sx={{ textTransform: 'uppercase', fontWeight: 900 }}>
                    TOP {result.n}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Para: <strong style={{ color: 'white' }}>{result.persona.displayName}</strong> | Motor: <strong style={{ color: 'white' }}>{result.model_label}</strong>
                  </Typography>
                </Box>
                <Chip variant="outlined" label={`${result.elapsed_ms} ms`} color="primary" />
              </Stack>
              <Grid container spacing={{ xs: 2, md: 2.5 }}>
                {result.recs.map((m, i) => (
                  <Grid key={m.movieId} size={{ xs: 6, sm: 4, md: 4 }}>
                    <MovieCard movie={m} rank={i + 1} compact />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

function PredictTab({ personas }) {
  const [selectedId, setSelectedId] = React.useState(null);
  const [movie, setMovie] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState(null);

  const persona = personas.find((p) => p.userId === selectedId) || null;

  const run = async () => {
    if (!persona || !movie) {
      setError('Seleccioná un perfil y una película.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await postJson('/api/predict/', {
        user_id: selectedId,
        movie_id: movie.movieId,
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            1. Perfil y Película
          </Typography>
          <Paper variant="outlined" sx={{ p: 3, mb: 4, bgcolor: 'background.paper' }}>
            <Box sx={{ mb: 4 }}>
              <PersonaPicker
                personas={personas}
                selectedId={selectedId}
                onSelect={setSelectedId}
                title="Espectador"
                description="Perfil de usuario para la predicción."
                dense
              />
            </Box>
            
            {persona && (
              <Box>
                <MovieAutocomplete value={movie} onChange={setMovie} />
                {movie && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', border: '1px solid #27272a', borderRadius: 1 }}>
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                      Película Seleccionada
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 0.5 }}>
                      {movie.title}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              size="large"
              color="primary"
              startIcon={<CompareArrowsRoundedIcon />}
              onClick={run}
              disabled={loading || !movie || !persona}
              sx={{ mt: 4, height: 56, fontWeight: 800 }}
            >
              {loading ? 'Evaluando...' : 'Evaluar Motores'}
            </Button>
            {loading && <LinearProgress color="primary" sx={{ mt: 2 }} />}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Typography variant="h6" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            RESULTADO DEL CÁLCULO
          </Typography>
          {!result && !loading && (
            <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed', borderColor: '#27272a', bgcolor: 'transparent' }}>
              <CompareArrowsRoundedIcon sx={{ fontSize: 64, color: '#3f3f46', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" textTransform="uppercase">
                Esperando configuración
              </Typography>
            </Paper>
          )}

          {result && (
            <Paper variant="outlined" sx={{ overflow: 'hidden', bgcolor: 'background.paper' }}>
              <Box sx={{ p: 3, borderBottom: '1px solid #27272a', bgcolor: 'background.paper' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between">
                  <Box>
                    <Typography variant="overline" color="primary">Película Evaluada</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
                      {result.movie?.title}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: { sm: 'right' }, mt: { xs: 2, sm: 0 } }}>
                    <Typography variant="overline" color="primary">Espectador</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
                      {result.persona.displayName}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Motor</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell align="right">Estimación (1-5)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.rows.map((row) => {
                      const isBest = row.key === result.best_key && row.score != null;
                      return (
                        <TableRow key={row.key} sx={isBest ? { bgcolor: 'rgba(229, 9, 20, 0.08)' } : {}}>
                          <TableCell sx={{ minWidth: 180 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: isBest ? 800 : 600, color: isBest ? 'primary.main' : 'inherit' }}>
                              {row.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {row.elapsed_ms} ms
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {row.hint}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {row.error ? (
                              <Typography variant="caption" color="error">{row.error}</Typography>
                            ) : (
                              <Typography variant="h5" sx={{ fontWeight: 900, color: isBest ? 'primary.main' : 'inherit' }}>
                                {row.score?.toFixed(2) ?? '—'}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default function Lab({ personas = [], models = [], metrics = [] }) {
  const [tab, setTab] = React.useState(0);

  return (
    <>
      <PageHeader
        eyebrow="LABORATORIO OMNIREC"
        title="CENTRO DE MOTORES"
        description="Analizá y compará la precisión de nuestros algoritmos cinematográficos."
      />

      {/* METRICS DASHBOARD */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h6" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          DESEMPEÑO DE MOTORES
        </Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'background.paper' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Motor Evaluado</TableCell>
                {METRIC_COLS.map((c) => (
                  <TableCell key={c.key} align="right">{c.label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {metrics.map((row) => (
                <TableRow key={row.Modelo}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {row.Modelo}
                    </Typography>
                  </TableCell>
                  {METRIC_COLS.map((c) => {
                    const v = row[c.key];
                    return (
                      <TableCell key={c.key} align="right">
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {typeof v === 'number' ? v.toFixed(c.digits) : '—'}
                        </Typography>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* TABS */}
      <Paper variant="outlined" sx={{ bgcolor: 'background.paper', border: 'none' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="primary"
          indicatorColor="primary"
          sx={{ borderBottom: '2px solid #27272a', mb: 4 }}
        >
          <Tab label="Cartelera (Top-N)" sx={{ fontSize: '1rem' }} />
          <Tab label="Estimación Individual" sx={{ fontSize: '1rem' }} />
        </Tabs>
        <Box>
          {tab === 0 && <TopNTab personas={personas} models={models} />}
          {tab === 1 && <PredictTab personas={personas} />}
        </Box>
      </Paper>
    </>
  );
}
