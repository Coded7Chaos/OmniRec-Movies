import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Salida 'standalone': empaqueta solo lo necesario para servir en producción
  // (server.js + node_modules mínimos) -> imagen Docker liviana (~150 MB).
  output: "standalone",
};

export default nextConfig;
