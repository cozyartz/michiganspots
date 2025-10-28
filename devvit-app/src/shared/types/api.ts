export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
  postType?: string;
  postData?: any;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

export type GameScore = {
  username: string;
  score: number;
  game: string;
  timestamp: number;
};

export type LeaderboardResponse = {
  topScores: GameScore[];
  userScore?: GameScore;
};
