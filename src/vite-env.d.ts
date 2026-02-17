/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HEYGEN_API_KEY: string;
  readonly VITE_ANTHROPIC_API_KEY: string;
  // Add any other custom env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}