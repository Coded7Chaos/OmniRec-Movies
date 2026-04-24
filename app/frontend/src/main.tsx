import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';

import theme from './theme';
import Layout from './components/Layout';
import Home from './pages/Home';
import Discover from './pages/Discover';
import Catalog from './pages/Catalog';
import Lab from './pages/Lab';
import Insights from './pages/Insights';

const PAGES = {
  Home,
  Discover,
  Catalog,
  Lab,
  Insights,
};

createInertiaApp({
  resolve: (name) => {
    const Page = PAGES[name];
    if (!Page) throw new Error(`Unknown Inertia page: ${name}`);
    Page.layout = Page.layout || ((page) => <Layout>{page}</Layout>);
    return Page;
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App {...props} />
      </ThemeProvider>,
    );
  },
});
