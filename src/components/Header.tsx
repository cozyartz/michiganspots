import { Compass, Menu, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPartnershipsOpen, setIsPartnershipsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-parchment-mid/95 backdrop-blur-sm treasure-border border-b-2">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center space-x-3 group">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="compass-shadow"
            >
              <Compass className="w-8 h-8 text-copper-orange" />
            </motion.div>
            <span className="font-decorative text-2xl text-ink-primary">Michigan Spots</span>
          </a>

          <div className="hidden md:flex items-center space-x-8">
            <a href="/" className="font-heading text-ink-primary hover:text-copper-orange transition-colors">
              Home
            </a>
            <a href="/about" className="font-heading text-ink-primary hover:text-copper-orange transition-colors">
              About
            </a>
            <div
              className="relative"
              onMouseEnter={() => setIsPartnershipsOpen(true)}
              onMouseLeave={() => setIsPartnershipsOpen(false)}
            >
              <button
                className="font-heading text-ink-primary hover:text-copper-orange transition-colors flex items-center space-x-1"
                onClick={() => setIsPartnershipsOpen(!isPartnershipsOpen)}
              >
                <span>Partnerships</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", isPartnershipsOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {isPartnershipsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-parchment-light treasure-border border-2 shadow-lg"
                  >
                    <a
                      href="/partnerships"
                      className="block px-4 py-3 font-heading text-ink-primary hover:bg-copper-orange/10 hover:text-copper-orange transition-colors border-b border-ink-faded/20"
                    >
                      All Options
                    </a>
                    <a
                      href="/chamber-partnerships"
                      className="block px-4 py-3 font-heading text-ink-primary hover:bg-copper-orange/10 hover:text-copper-orange transition-colors border-b border-ink-faded/20"
                    >
                      For Chambers
                    </a>
                    <a
                      href="/business-partnerships"
                      className="block px-4 py-3 font-heading text-ink-primary hover:bg-copper-orange/10 hover:text-copper-orange transition-colors"
                    >
                      For Businesses
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <a
              href="#signup"
              className="px-6 py-2 bg-copper-orange text-parchment-light font-heading font-bold treasure-border hover:bg-sunset-red transition-colors"
            >
              Join the Hunt
            </a>
          </div>

          <button
            className="md:hidden text-ink-primary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 space-y-4"
            >
              <a href="/" className="block font-heading text-ink-primary hover:text-copper-orange transition-colors">
                Home
              </a>
              <a href="/about" className="block font-heading text-ink-primary hover:text-copper-orange transition-colors">
                About
              </a>
              <div>
                <button
                  onClick={() => setIsPartnershipsOpen(!isPartnershipsOpen)}
                  className="flex items-center justify-between w-full font-heading text-ink-primary hover:text-copper-orange transition-colors"
                >
                  <span>Partnerships</span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", isPartnershipsOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isPartnershipsOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 ml-4 space-y-2"
                    >
                      <a
                        href="/partnerships"
                        className="block text-sm font-heading text-ink-secondary hover:text-copper-orange transition-colors"
                      >
                        All Options
                      </a>
                      <a
                        href="/chamber-partnerships"
                        className="block text-sm font-heading text-ink-secondary hover:text-copper-orange transition-colors"
                      >
                        For Chambers
                      </a>
                      <a
                        href="/business-partnerships"
                        className="block text-sm font-heading text-ink-secondary hover:text-copper-orange transition-colors"
                      >
                        For Businesses
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <a
                href="#signup"
                className="block text-center px-6 py-2 bg-copper-orange text-parchment-light font-heading font-bold treasure-border hover:bg-sunset-red transition-colors"
              >
                Join the Hunt
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
