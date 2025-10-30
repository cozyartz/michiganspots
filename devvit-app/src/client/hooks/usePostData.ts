import { useEffect, useState } from 'react';
import type { InitResponse } from '../../shared/types/api';

interface PostDataState {
  postId: string | null;
  username: string | null;
  postType: string | null;
  postData: any;
  loading: boolean;
}

export const usePostData = () => {
  const [state, setState] = useState<PostDataState>({
    postId: null,
    username: null,
    postType: null,
    postData: null,
    loading: true,
  });

  useEffect(() => {
    const init = async () => {
      try {
        console.log('Fetching /api/init...');
        const res = await fetch('/api/init');
        console.log('Init response status:', res.status);
        
        if (!res.ok) {
          console.error('Init request failed:', res.status);
          // Set fallback data instead of failing
          setState({
            postId: 'fallback',
            username: 'anonymous',
            postType: 'arcade',
            postData: { postType: 'arcade', gameMode: 'splash' },
            loading: false,
          });
          return;
        }
        
        const data: InitResponse = await res.json();
        console.log('Init response data:', data);

        setState({
          postId: data.postId || 'fallback',
          username: data.username || 'anonymous',
          postType: data.postType || 'arcade',
          postData: data.postData || {},
          loading: false,
        });
        
        console.log('Post data loaded successfully');
      } catch (err) {
        console.error('Failed to init post data', err);
        // Set fallback data on any error
        setState({
          postId: 'fallback',
          username: 'anonymous',
          postType: 'arcade',
          postData: { postType: 'arcade', gameMode: 'splash' },
          loading: false,
        });
      }
    };
    void init();
  }, []);

  return state;
};
