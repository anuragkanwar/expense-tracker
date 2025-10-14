/// <reference types="vite/client" />

// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
interface ViteTypeOptions { }

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_API_URL: string;
  readonly VITE_APP_AUTH_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
