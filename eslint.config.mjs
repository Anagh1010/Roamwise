import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([".next/**", "node_modules/**", "prisma/generated/**"]),
  {
    rules: {
      // Existing client components intentionally hydrate local/session state in effects.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
