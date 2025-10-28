import { defineConfig, loadEnv } from 'vite';
import { builtinModules } from 'node:module';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  // Load env file from project root (two levels up from src/server)
  const envDir = path.resolve(__dirname, '../..');
  const env = loadEnv(mode, envDir, '');

  return {
    ssr: {
      noExternal: true,
    },
    define: {
      // Inject environment variables at build time
      'process.env.CLOUDFLARE_ACCOUNT_ID': JSON.stringify(env.CLOUDFLARE_ACCOUNT_ID || ''),
      'process.env.CLOUDFLARE_AI_API_KEY': JSON.stringify(env.CLOUDFLARE_AI_API_KEY || ''),
      'process.env.DEVVIT_API_KEY': JSON.stringify(env.DEVVIT_API_KEY || ''),
    },
    build: {
      emptyOutDir: false,
      ssr: 'index.ts',
      outDir: '../../dist/server',
      target: 'node22',
      sourcemap: true,
      rollupOptions: {
        external: [...builtinModules],

        output: {
          format: 'cjs',
          entryFileNames: 'index.cjs',
          inlineDynamicImports: true,
        },
      },
    },
  };
});
