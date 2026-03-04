/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STRIPO_PLUGIN_ID?: string;
  readonly VITE_STRIPO_SECRET_KEY?: string;
  readonly VITE_STRIPO_USER_ID?: string;
  readonly VITE_STRIPO_TOKEN_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
