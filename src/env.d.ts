/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PLATFORM_API_URL: string;
  readonly PARTNER_WEBHOOK_SECRET: string;
  readonly ADMIN_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}