import React from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography, Chip } from '@mui/material';
import { getJson } from '../api';

export default function MovieAutocomplete({
  value,
  onChange,
  label = 'Película',
  placeholder = 'Buscá por título (ej. Matrix, Amélie, El Padrino)',
}) {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [options, setOptions] = React.useState(value ? [value] : []);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!input || input.trim().length < 2) {
      setOptions(value ? [value] : []);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(() => {
      getJson(`/api/movies/?q=${encodeURIComponent(input)}&limit=10`)
        .then((data) => {
          if (cancelled) return;
          setOptions(data.hits || []);
        })
        .catch(() => {
          if (!cancelled) setOptions([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [input, value]);

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={value}
      onChange={(_, opt) => onChange(opt || null)}
      onInputChange={(_, newInput) => setInput(newInput)}
      options={options}
      loading={loading}
      fullWidth
      filterOptions={(x) => x}
      getOptionLabel={(opt) => opt?.title || ''}
      isOptionEqualToValue={(a, b) => a.movieId === b.movieId}
      noOptionsText={input.length < 2 ? 'Escribí al menos 2 letras' : 'Sin resultados'}
      renderOption={(props, option) => (
        <li {...props} key={option.movieId}>
          <Box sx={{ py: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {option.title}
            </Typography>
            {option.genres && (
              <Typography variant="caption" color="text.secondary">
                {option.genres}
              </Typography>
            )}
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading && <CircularProgress color="inherit" size={18} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
