import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend en http://localhost:5173 (el backend permite ese origen por CORS).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
