import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightImageZoom from 'starlight-image-zoom';
import starlightLinksValidator from 'starlight-links-validator';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightImageZoom(),
        starlightLinksValidator(),
      ],
      title: 'Michigan Spots Player Guide',
      description: 'Your complete guide to playing Michigan Spots - the treasure hunt game',
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
      },
      social: [
        { icon: 'reddit', label: 'Reddit', href: 'https://reddit.com/r/michiganspots' },
        { icon: 'external', label: 'Play Now', href: 'https://michiganspots.com' },
      ],
      expressiveCode: {
        themes: ['dracula', 'github-light'],
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'How to Play', link: '/getting-started/how-to-play/' },
            { label: 'Creating Your Account', link: '/getting-started/account-setup/' },
            { label: 'Your First Spot', link: '/getting-started/first-spot/' },
            { label: 'Understanding Challenges', link: '/getting-started/challenges/' },
          ],
        },
        {
          label: 'Gameplay',
          items: [
            { label: 'Finding Spots', link: '/gameplay/finding-spots/' },
            { label: 'Submitting Photos', link: '/gameplay/photo-submission/' },
            { label: 'Points System', link: '/gameplay/points-system/' },
            { label: 'Badges & Achievements', link: '/gameplay/badges/' },
            { label: 'Leaderboards', link: '/gameplay/leaderboards/' },
            { label: 'Team Play', link: '/gameplay/teams/' },
          ],
        },
        {
          label: 'AI Assistant',
          items: [
            { label: 'Overview', link: '/ai-help/overview/' },
            { label: 'Getting Hints', link: '/ai-help/hints/' },
            { label: 'Recommendations', link: '/ai-help/recommendations/' },
            { label: 'Challenge Help', link: '/ai-help/challenge-assistance/' },
            { label: 'Commands', link: '/ai-help/commands/' },
          ],
        },
        {
          label: 'Challenges',
          items: [
            { label: 'Weekly Challenges', link: '/challenges/weekly/' },
            { label: 'Seasonal Events', link: '/challenges/seasonal/' },
            { label: 'City Battles', link: '/challenges/city-battles/' },
            { label: 'Special Themes', link: '/challenges/themes/' },
          ],
        },
        {
          label: 'Community',
          items: [
            { label: 'Reddit', link: '/community/reddit/' },
            { label: 'Sharing', link: '/community/sharing/' },
            { label: 'Following Players', link: '/community/following/' },
            { label: 'Guidelines', link: '/community/guidelines/' },
          ],
        },
        {
          label: 'Staff',
          items: [
            { label: 'Dashboard', link: '/staff/dashboard/' },
            { label: 'Managing Challenges', link: '/staff/challenge-management/' },
            { label: 'AI Tools', link: '/staff/ai-tools/' },
            { label: 'Analytics', link: '/staff/analytics/' },
            { label: 'Partner Resources', link: '/staff/partner-resources/' },
          ],
        },
        {
          label: 'Support',
          items: [
            { label: 'FAQ', link: '/support/faq/' },
            { label: 'Troubleshooting', link: '/support/troubleshooting/' },
            { label: 'Contact', link: '/support/contact/' },
            { label: 'Report Issues', link: '/support/reporting/' },
          ],
        },
      ],
      customCss: [
        './src/styles/custom.css',
      ],
    }),
  ],
});