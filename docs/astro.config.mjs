import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'Michigan Spots Documentation',
      description: 'Complete documentation for the AI-powered treasure hunt platform',
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/michiganspots/platform' },
        { icon: 'discord', label: 'Discord', href: 'https://discord.gg/michiganspots' },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/getting-started/introduction/' },
            { label: 'Quick Start', link: '/getting-started/quick-start/' },
            { label: 'Installation', link: '/getting-started/installation/' },
            { label: 'Configuration', link: '/getting-started/configuration/' },
          ],
        },
        {
          label: 'AI System',
          items: [
            { label: 'AI Overview', link: '/ai-system/overview/' },
            { label: 'Master Orchestrator', link: '/ai-system/master-orchestrator/' },
            { label: 'Validation Service', link: '/ai-system/validation/' },
            { label: 'Challenge Generation', link: '/ai-system/challenge-generation/' },
            { label: 'Personalization', link: '/ai-system/personalization/' },
            { label: 'Community Management', link: '/ai-system/community-management/' },
            { label: 'Business Intelligence', link: '/ai-system/business-intelligence/' },
            { label: 'A/B Testing', link: '/ai-system/ab-testing/' },
          ],
        },
        {
          label: 'Platform Features',
          items: [
            { label: 'Challenge System', link: '/features/challenges/' },
            { label: 'User Profiles', link: '/features/user-profiles/' },
            { label: 'Leaderboards', link: '/features/leaderboards/' },
            { label: 'Social Integration', link: '/features/social-integration/' },
            { label: 'GPS & Location', link: '/features/gps-location/' },
            { label: 'Fraud Prevention', link: '/features/fraud-prevention/' },
          ],
        },
        {
          label: 'Multi-Subreddit',
          items: [
            { label: 'Expansion Strategy', link: '/multi-subreddit/strategy/' },
            { label: 'Content Generation', link: '/multi-subreddit/content-generation/' },
            { label: 'Cross-Posting', link: '/multi-subreddit/cross-posting/' },
            { label: 'Community Management', link: '/multi-subreddit/community-management/' },
          ],
        },
        {
          label: 'Development',
          items: [
            { label: 'Architecture', link: '/development/architecture/' },
            { label: 'API Reference', link: '/development/api-reference/' },
            { label: 'Testing', link: '/development/testing/' },
            { label: 'Performance', link: '/development/performance/' },
            { label: 'Security', link: '/development/security/' },
          ],
        },
        {
          label: 'Deployment',
          items: [
            { label: 'Production Setup', link: '/deployment/production-setup/' },
            { label: 'AI Deployment', link: '/deployment/ai-deployment/' },
            { label: 'Monitoring', link: '/deployment/monitoring/' },
            { label: 'Troubleshooting', link: '/deployment/troubleshooting/' },
          ],
        },
        {
          label: 'Business',
          items: [
            { label: 'Partner Onboarding', link: '/business/partner-onboarding/' },
            { label: 'Analytics Dashboard', link: '/business/analytics/' },
            { label: 'ROI Tracking', link: '/business/roi-tracking/' },
            { label: 'Success Stories', link: '/business/success-stories/' },
          ],
        },
        {
          label: 'Commands Reference',
          items: [
            { label: 'Development Commands', link: '/commands/development/' },
            { label: 'AI Commands', link: '/commands/ai/' },
            { label: 'Deployment Commands', link: '/commands/deployment/' },
            { label: 'Testing Commands', link: '/commands/testing/' },
          ],
        },
      ],
      customCss: [
        './src/styles/custom.css',
      ],
    }),
  ],
});