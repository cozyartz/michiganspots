import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'hybrid',
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  }),
  integrations: [
    react(),
    tailwind(),
    sitemap({
      filter: (page) => !page.includes('/partnership-acceptance'),
      serialize(item) {
        // Remove trailing slash for consistency
        const url = item.url.replace(/\/$/, '');

        // Homepage
        if (url === 'https://michiganspots.com') {
          return {
            ...item,
            url,
            priority: 1.0,
            changefreq: 'daily'
          };
        }

        // Key pages
        if (url.endsWith('/about')) {
          return { ...item, url, priority: 1.0, changefreq: 'daily' };
        }

        // Partnership pages
        if (url.includes('partnership')) {
          return { ...item, url, priority: 0.9, changefreq: 'weekly' };
        }

        // Intake forms
        if (url.includes('-intake')) {
          return { ...item, url, priority: 0.8, changefreq: 'weekly' };
        }

        // Legal pages
        if (url.match(/\/(terms|privacy|cookies)$/)) {
          return { ...item, url, priority: 0.5, changefreq: 'monthly' };
        }

        // Default
        return { ...item, url, priority: 0.7, changefreq: 'weekly' };
      },
    })
  ],
  site: 'https://michiganspots.com',
  trailingSlash: 'never',
});
