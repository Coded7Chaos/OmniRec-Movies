import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#E50914', // Cinematic red
      dark: '#B80710',
      light: '#FF333E',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f1f5f9',
      contrastText: '#0f172a',
    },
    success: {
      main: '#059669',
      light: '#10B981',
      dark: '#047857',
    },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    info: { main: '#3b82f6' },
    background: {
      default: '#f8fafc', // Light grey background
      paper: '#ffffff',   // White for cards/surfaces
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
    divider: '#e2e8f0',
  },
  shape: { borderRadius: 8 }, // Sharper corners for a more cinematic/formal look
  spacing: 8,
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: { fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1.1 },
    h2: { fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.015em', lineHeight: 1.15 },
    h3: { fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.2 },
    h4: { fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.25 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontWeight: 600, letterSpacing: '0.01em' },
    body1: { lineHeight: 1.65 },
    body2: { lineHeight: 1.6 },
    button: { fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
    overline: { fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.75rem' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#f8fafc' },
        '*::-webkit-scrollbar': { width: 10, height: 10 },
        '*::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 0 },
        '*::-webkit-scrollbar-track': { background: '#f8fafc' },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'inherit' },
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 4, paddingInline: 24, paddingBlock: 12 },
        sizeLarge: { paddingInline: 32, paddingBlock: 14, fontSize: '0.95rem' },
        sizeSmall: { paddingInline: 16, paddingBlock: 8 },
        containedPrimary: {
          backgroundColor: '#E50914',
          '&:hover': { backgroundColor: '#B80710' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' }, // Ensure no gradients
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          backgroundColor: '#ffffff',
          transition: 'border-color 160ms, transform 160ms',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 4 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: '#0f172a',
          backgroundColor: '#f1f5f9',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontSize: '0.75rem',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'uppercase',
          fontWeight: 700,
          fontSize: '0.9rem',
          minHeight: 48,
        },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 4 } },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 4 },
      },
    },
  },
});

export default theme;