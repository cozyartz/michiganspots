import { usePostData } from './hooks/usePostData';
import { useSystemTheme } from './hooks/useSystemTheme';
import { InteractiveGameHub } from '../components/InteractiveGameHub';
import { Leaderboard } from '../components/Leaderboard';
import { AIModTools } from '../components/AIModTools';

export const App = () => {
  const { postId, username, postType, loading } = usePostData();
  const isDark = useSystemTheme();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading Michigan Spots...</p>
        </div>
      </div>
    );
  }

  if (!postId || !username) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700">Failed to load post data. Please try again.</p>
        </div>
      </div>
    );
  }

  // Route to the appropriate component based on postType
  if (postType === 'leaderboard') {
    return <Leaderboard username={username} postId={postId} />;
  }

  if (postType === 'ai-mod-tools') {
    return <AIModTools username={username} postId={postId} />;
  }

  // Default to arcade games
  return <InteractiveGameHub username={username} postId={postId} isDark={isDark} />;
};
