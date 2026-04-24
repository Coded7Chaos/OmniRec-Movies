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

export default function Register() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    router.post('/register/', { username, password }, {
      onError: (errors) => setError('El usuario ya existe o los datos son inválidos'),
    });
  };

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
      <Paper variant="outlined" sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Crear cuenta</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Únete a OmniRec para puntuar películas y recibir recomendaciones personalizadas.
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
              Registrarse
            </Button>
            <Typography variant="body2" align="center">
              ¿Ya tienes cuenta? <Link href="/login/" style={{ fontWeight: 700, color: '#4f46e5', textDecoration: 'none' }}>Inicia sesión</Link>
            </Typography>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
