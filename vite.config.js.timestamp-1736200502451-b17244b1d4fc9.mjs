import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Chemin original injecté
const __vite_injected_original_dirname = "c:\\Users\\Juste\\Desktop\\code\\ematik store";

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["@emotion/babel-plugin"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
    },
  },
  server: {
    port: parseInt(process.env.PORT) || 3004, // Utilise la variable d'environnement PORT ou par défaut 3004
    host: true,
  },
});
