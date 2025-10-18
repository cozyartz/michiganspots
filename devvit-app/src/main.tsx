/**
 * Michigan Spots Treasure Hunt - Simplified Version for Initial Upload
 */

import { Devvit } from '@devvit/public-api';

// Configure the app
Devvit.configure({
  redditAPI: true,
  redis: true,
  http: true,
});

// App settings
Devvit.addSettings([
  {
    name: 'CLOUDFLARE_API_KEY',
    type: 'string',
    label: 'Cloudflare API Key',
    helpText: 'API key for Cloudflare Workers analytics integration',
    isSecret: true,
    scope: 'app',
  },
]);

// Simple app component using blocks object format (not JSX)
const App: Devvit.BlockComponent = () => {
  return {
    type: 'vstack',
    height: '100%',
    width: '100%',
    alignment: 'center middle',
    padding: 'large',
    gap: 'medium',
    children: [
      {
        type: 'text',
        size: 'xxlarge',
        weight: 'bold',
        color: '#D2691E',
        text: '🗺️ Michigan Spots',
      },
      {
        type: 'text',
        size: 'large',
        text: 'Treasure Hunt Game',
      },
      {
        type: 'spacer',
        size: 'medium',
      },
      {
        type: 'text',
        size: 'medium',
        color: '#6b7280',
        text: "Discover Michigan's Hidden Gems",
      },
      {
        type: 'spacer',
        size: 'large',
      },
      {
        type: 'text',
        size: 'small',
        alignment: 'center',
        text: 'Coming soon: GPS-verified challenges, points system, leaderboards, and more!',
      },
    ],
  };
};

// Register custom post type
Devvit.addCustomPostType({
  name: 'Michigan Spots Treasure Hunt',
  description: 'Interactive treasure hunt game for discovering local Michigan businesses',
  height: 'tall',
  render: App,
});

// Add menu item to create the game post
Devvit.addMenuItem({
  label: 'Create Michigan Spots Game',
  location: 'subreddit',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      title: '🗺️ Michigan Spots Treasure Hunt',
      subredditName: subreddit.name,
      preview: App(),
    });
    ui.showToast({ text: 'Game created!', appearance: 'success' });
    ui.navigateTo(post);
  },
});

export default Devvit;
