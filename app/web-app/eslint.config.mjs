import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // La app consume una API externa (FastAPI) con fetch en efectos; el
      // estado de carga se setea al inicio del efecto a propósito.
      "react-hooks/set-state-in-effect": "off",
      // Falso positivo: `const Icon = genreIcon(...)` referencia iconos
      // estables de lucide-react, no crea componentes nuevos por render.
      "react-hooks/static-components": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
