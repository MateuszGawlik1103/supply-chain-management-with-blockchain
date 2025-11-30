/**
 * Configuration file for Vite in a TypeScript + React project.
 */

import { defineConfig } from "vite"; // Vite configuration function
import react from "@vitejs/plugin-react"; // Plugin for React support (JSX, React Fast Refresh)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true, // Used for enabling HMR (Hot Module Replacement)
    },
    port: 3000, // The development server will run on port 3000
    host: true, // Makes the dev server accessible from any network
  },
  preview: {
    port: 4000, // The preview server will run on port 4000
    host: true, // Makes the preview server accessible from any network
  },
});
