import { context, reddit } from '@devvit/web/server';

export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  try {
    return await reddit.submitCustomPost({
      splash: {
        // Splash Screen Configuration - Treasure Map Theme
        appDisplayName: 'Michigan Treasure Hunt',
        backgroundUri: 'michigan-arcade-bg.png',
        buttonLabel: '⚓ Start Adventure',
        description: 'Discover Michigan treasures through interactive games!',
        entryUri: 'default', // Must match devvit.json entrypoint key
        heading: '🏴‍☠️ Welcome to the Treasure Hunt!',
        appIconUri: 'michigan-icon.png',
        height: 'tall',
      },
      postData: {
        postType: 'arcade',
        gameMode: 'splash',
        score: 0,
        gamesPlayed: 0,
      },
      subredditName: subredditName,
      title: '🏴‍☠️ Michigan Treasure Hunt - Interactive Adventure!',
    });
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};
