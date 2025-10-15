import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [
    react(),
    tailwind(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      customPages: [
        'https://michiganspots.com',
        'https://michiganspots.com/about',
        'https://michiganspots.com/partnerships',
        'https://michiganspots.com/chamber-partnerships',
        'https://michiganspots.com/business-partnerships',
        'https://michiganspots.com/chamber-intake',
        'https://michiganspots.com/business-intake',
        'https://michiganspots.com/community-intake',
        'https://michiganspots.com/terms',
        'https://michiganspots.com/privacy',
        'https://michiganspots.com/cookies',
      ],
      serialize(item) {
        // Set higher priority for key pages
        if (item.url.endsWith('/') || item.url.endsWith('/about')) {
          item.priority = 1.0;
          item.changefreq = 'daily';
        }
        if (item.url.includes('partnership')) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        }
        if (item.url.includes('terms') || item.url.includes('privacy') || item.url.includes('cookies')) {
          item.priority = 0.5;
          item.changefreq = 'monthly';
        }
        return item;
      },
    })
  ],
  output: 'static',
  site: 'https://michiganspots.com',
});
