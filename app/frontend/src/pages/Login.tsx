import React from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { router, Link } from '@inertiajs/react';

export default function Login() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    router.post('/login/', { username, password }, {
      onError: (errors) => setError('Credenciales inválidas'),
    });
  };

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
      <Paper variant="outlined" sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Iniciar sesión</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Ingresa tus credenciales para acceder a tus recomendaciones.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <TextField
              label="Usuario"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button
              variant="contained"
              size="large"
              fullWidth
              type="submit"
              sx={{ height: 50 }}
            >
              Entrar
            </Button>
            <Typography variant="body2" align="center">
              ¿No tienes cuenta? <Link href="/register/" style={{ fontWeight: 700, color: '#4f46e5', textDecoration: 'none' }}>Regístrate</Link>
            </Typography>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
