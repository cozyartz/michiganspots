/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

import { useState, useEffect } from 'react';
import { Shuffle, ArrowRight, ExternalLink } from 'lucide-react';

interface RedditPost {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  author: string;
  ups: number;
  permalink: string;
  subreddit: string;
  created_utc: number;
}

export function Reddit404Meme() {
  const [currentMeme, setCurrentMeme] = useState<RedditPost | null>(null);
  const [memePool, setMemePool] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchRedditMemes = async () => {
    try {
      // Fetch from our server-side API (with caching)
      const response = await fetch('/api/reddit-memes');

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || 'API error');
      }

      const posts = data.posts || [];

      if (posts.length > 0) {
        setMemePool(posts);
        setCurrentMeme(posts[0]);
        setError(false);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error fetching Reddit memes:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedditMemes();
  }, []);

  const getNextMeme = () => {
    if (memePool.length === 0) return;

    // Get a random meme that's not the current one
    const availableMemes = memePool.filter(m => m.id !== currentMeme?.id);
    if (availableMemes.length === 0) {
      fetchRedditMemes(); // Refresh pool
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableMemes.length);
    setCurrentMeme(availableMemes[randomIndex]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-parchment-light to-white">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-lakes-blue border-r-transparent mb-4"></div>
          <p className="text-ink-secondary font-heading">Loading Michigan posts...</p>
        </div>
      </div>
    );
  }

  if (error || !currentMeme) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-parchment-light to-white px-4">
        <div className="max-w-2xl text-center">
          <h1 className="font-display text-8xl font-bold text-copper-orange mb-6">404</h1>
          <h2 className="font-heading text-4xl font-bold text-ink-primary mb-4">
            Oops! This Spot Doesn't Exist
          </h2>
          <p className="text-xl text-ink-secondary mb-8">
            We couldn't load posts from r/michiganspots right now. But you can still join the fun!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://www.reddit.com/r/michiganspots/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-lakes-blue text-white font-heading font-bold rounded-xl hover:bg-lakes-light transition-all hover:scale-105"
            >
              Visit r/MichiganSpots
              <ExternalLink className="w-5 h-5" />
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-lakes-blue text-lakes-blue font-heading font-bold rounded-xl hover:bg-lakes-blue hover:text-white transition-all"
            >
              Return Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-light via-white to-parchment-mid px-4 py-12">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-ink-primary mb-3">
            Well, This Spot Doesn't Exist...
          </h2>
          <p className="text-lg text-ink-secondary">
            But here's something fun from r/MichiganSpots while you're here!
          </p>
        </div>

        {/* Meme Display Card */}
        <div className="bg-white rounded-2xl shadow-2xl border-4 border-lakes-blue overflow-hidden mb-8">
          {/* Reddit Header */}
          <div className="bg-lakes-blue text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
              </svg>
              <div>
                <div className="font-bold text-lg">r/{currentMeme.subreddit}</div>
                <div className="text-sm opacity-90">Posted by u/{currentMeme.author}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xl font-bold">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4l-8 8 8 8v-6h8v-4h-8z" />
              </svg>
              {currentMeme.ups.toLocaleString()}
            </div>
          </div>

          {/* Meme Title */}
          <div className="px-6 py-4 bg-parchment-light border-b-2 border-ink-faded/10">
            <h3 className="font-heading text-xl font-bold text-ink-primary line-clamp-2">
              {currentMeme.title}
            </h3>
          </div>

          {/* Meme Image */}
          <div className="relative bg-ink-primary/5">
            <img
              src={currentMeme.url}
              alt={currentMeme.title}
              className="w-full max-h-[600px] object-contain mx-auto"
              onError={(e) => {
                e.currentTarget.src = currentMeme.thumbnail;
              }}
            />
          </div>

          {/* Actions */}
          <div className="px-6 py-5 bg-parchment-light flex flex-col sm:flex-row gap-4 justify-between items-center">
            <a
              href={`https://reddit.com${currentMeme.permalink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-lakes-blue font-heading font-semibold hover:text-lakes-light transition-colors"
            >
              View on Reddit
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={getNextMeme}
              className="inline-flex items-center gap-2 px-6 py-3 bg-copper-orange text-white font-heading font-bold rounded-xl hover:bg-copper-orange/90 transition-all hover:scale-105"
            >
              <Shuffle className="w-5 h-5" />
              Next Post
            </button>
          </div>
        </div>

        {/* Community CTA */}
        <div className="bg-gradient-to-r from-lakes-blue to-copper-orange rounded-2xl p-8 text-white text-center mb-8">
          <h3 className="font-heading text-3xl font-bold mb-4">
            Got Your Own Michigan Post?
          </h3>
          <p className="text-xl mb-6 opacity-95">
            Share it with the community and get featured right here on our 404 page!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://www.reddit.com/r/michiganspots/submit"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-lakes-blue font-heading font-bold rounded-xl hover:bg-parchment-light transition-all hover:scale-105"
            >
              Share Your Post
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="https://www.reddit.com/r/michiganspots/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white font-heading font-bold rounded-xl hover:bg-white/10 transition-all"
            >
              Join r/MichiganSpots
            </a>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-lakes-blue text-white font-heading font-bold rounded-xl hover:bg-lakes-light transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Return Home
          </a>
          <a
            href="/directory"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-lakes-blue text-lakes-blue font-heading font-bold rounded-xl hover:bg-lakes-blue hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Browse Michigan Businesses
          </a>
        </div>
      </div>
    </div>
  );
}
