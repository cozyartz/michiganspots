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
        const res = await fetch('/api/init');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: InitResponse = await res.json();
        if (data.type !== 'init') throw new Error('Unexpected response');

        setState({
          postId: data.postId,
          username: data.username,
          postType: data.postType || 'arcade',
          postData: data.postData || {},
          loading: false,
        });
      } catch (err) {
        console.error('Failed to init post data', err);
        setState((prev) => ({ ...prev, loading: false }));
      }
    };
    void init();
  }, []);

  return state;
};
