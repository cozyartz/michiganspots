import { Compass, MapPin, Trophy, Users } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-parchment-dark treasure-border border-t-2 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Compass className="w-6 h-6 text-copper-orange" />
              <span className="font-decorative text-xl text-ink-primary">Michigan Spots</span>
            </div>
            <p className="text-ink-secondary text-sm">
              Discover Michigan's hidden gems through community-powered exploration and friendly competition.
            </p>
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
            <h3 className="font-heading font-bold text-ink-primary mb-4">Connect</h3>
            <p className="text-ink-secondary text-sm mb-2">
              Built by Cozyartz Media Group
            </p>
            <p className="text-ink-faded text-xs">
              Part of Reddit Community Games 2025
            </p>
          </div>
        </div>

        <div className="border-t border-ink-faded mt-8 pt-8 text-center">
          <p className="text-ink-secondary text-sm">
            &copy; {new Date().getFullYear()} Michigan Spots. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
