/// <reference types="vite/client" />

// Tipa import.meta.env.VITE_API_URL (ver frontend/.env.example).
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
