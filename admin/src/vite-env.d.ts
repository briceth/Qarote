/// <reference types="vite/client" />

// Declare global environment variable types
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
