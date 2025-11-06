import { Compass, MapPin, Trophy, Users, Github } from 'lucide-react';
import { cookieManager } from '../utils/cookieManager';
import { AffiliateDisclosure } from './AffiliateDisclosure';

export function Footer() {
  const handleCookieSettings = () => {
    cookieManager.openSettings();
  };

  return (
    <footer className="bg-parchment-dark treasure-border border-t-2 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Compass className="w-6 h-6 text-copper-orange" />
              <span className="font-decorative text-xl text-ink-primary">Michigan Spots</span>
            </div>
            <p className="text-ink-secondary text-sm mb-4">
              Discover Michigan's hidden gems through community-powered exploration and friendly competition.
            </p>

            {/* Social Media Links */}
            <div className="flex items-center space-x-3 mt-4">
              <a
                href="https://www.reddit.com/r/michiganspots/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-secondary hover:text-copper-orange transition-colors"
                aria-label="Join r/michiganspots on Reddit"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
              </a>
              <a
                href="https://github.com/cozyartz/michiganspots"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-secondary hover:text-copper-orange transition-colors"
                aria-label="View source code on GitHub"
              >
                <Github className="w-6 h-6" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-heading font-bold text-ink-primary mb-4">Explore</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-ink-secondary hover:text-copper-orange transition-colors text-sm">
                  Home
                </a>
              </li>
              <li>
                <a href="/about" className="text-ink-secondary hover:text-copper-orange transition-colors text-sm">
                  About the Game
                </a>
              </li>
              <li>
                <a href="/gear" className="text-ink-secondary hover:text-copper-orange transition-colors text-sm">
                  Gear & Resources
                </a>
              </li>
              <li>
                <a href="/community-guidelines" className="text-ink-secondary hover:text-copper-orange transition-colors text-sm">
                  Community Guidelines
                </a>
              </li>
              <li>
                <a href="/partnerships" className="text-ink-secondary hover:text-copper-orange transition-colors text-sm">
                  Chamber Partnerships
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-bold text-ink-primary mb-4">Features</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-ink-secondary text-sm">
                <MapPin className="w-4 h-4" />
                <span>Spot Discovery</span>
              </li>
              <li className="flex items-center space-x-2 text-ink-secondary text-sm">
                <Trophy className="w-4 h-4" />
                <span>Weekly Challenges</span>
              </li>
              <li className="flex items-center space-x-2 text-ink-secondary text-sm">
                <Users className="w-4 h-4" />
                <span>Team Competition</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-bold text-ink-primary mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="/terms" className="text-ink-secondary hover:text-copper-orange transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-ink-secondary hover:text-copper-orange transition-colors text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/cookies" className="text-ink-secondary hover:text-copper-orange transition-colors text-sm">
                  Cookie Policy
                </a>
              </li>
              <li>
                <button
                  onClick={handleCookieSettings}
                  className="text-ink-secondary hover:text-copper-orange transition-colors text-sm text-left"
                  type="button"
                >
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-ink-faded mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <p className="text-ink-secondary text-sm">
              &copy; {new Date().getFullYear()} Michigan Spots by Cozyartz Media Group. All rights reserved.
            </p>
            <p className="text-ink-faded text-xs">
              Part of Reddit Community Games 2025
            </p>
          </div>
          <div className="text-center">
            <AffiliateDisclosure variant="footer" />
          </div>
        </div>
      </div>
    </footer>
  );
}
