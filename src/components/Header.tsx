import { Compass, Menu, X, ChevronDown, LogIn, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface UserData {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  role: 'user' | 'partner' | 'super_admin';
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current user session
    fetch('/api/auth/user')
      .then(res => res.json())
      .then(data => {
        setUser(data.user || null);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

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
              <Compass className="w-8 h-8 text-cyan-primary" />
            </motion.div>
            <span className="font-decorative text-2xl text-ink-primary">Michigan Spots</span>
          </a>

          <div className="hidden md:flex items-center space-x-8">
            <a href="/" className="font-heading text-ink-primary hover:text-cyan-primary transition-colors">
              Home
            </a>
            <a href="/about" className="font-heading text-ink-primary hover:text-cyan-primary transition-colors">
              About
            </a>
            <a href="/blog" className="font-heading text-ink-primary hover:text-cyan-primary transition-colors">
              Blog
            </a>
            <a href="/directory" className="font-heading text-ink-primary hover:text-cyan-primary transition-colors">
              Business Directory
            </a>
            {!loading && (
              <>
                {user ? (
                  <div
                    className="relative"
                    onMouseEnter={() => setIsUserMenuOpen(true)}
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                  >
                    <button className="flex items-center space-x-2 font-heading text-ink-primary hover:text-cyan-primary transition-colors">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} className="w-8 h-8 rounded-full" />
                      ) : (
                        <User className="w-8 h-8" />
                      )}
                      <span>{user.username}</span>
                      <ChevronDown className={cn("w-4 h-4 transition-transform", isUserMenuOpen && "rotate-180")} />
                    </button>
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full right-0 mt-2 w-48 bg-parchment-light treasure-border border-2 shadow-lg"
                        >
                          {user.role === 'super_admin' && (
                            <>
                              <a
                                href="/admin/dashboard"
                                className="block px-4 py-3 font-heading text-ink-primary hover:bg-cyan-light/20 hover:text-cyan-primary transition-colors border-b border-ink-faded/20"
                              >
                                Admin Dashboard
                              </a>
                              <a
                                href="/admin/database"
                                className="block px-4 py-3 font-heading text-ink-primary hover:bg-cyan-light/20 hover:text-cyan-primary transition-colors border-b border-ink-faded/20"
                              >
                                Database Viewer
                              </a>
                            </>
                          )}
                          {(user.role === 'partner' || user.role === 'super_admin') && (
                            <a
                              href="/partner/dashboard"
                              className="block px-4 py-3 font-heading text-ink-primary hover:bg-cyan-light/20 hover:text-cyan-primary transition-colors border-b border-ink-faded/20"
                            >
                              Partner Dashboard
                            </a>
                          )}
                          <form action="/api/auth/logout" method="POST">
                            <button
                              type="submit"
                              className="w-full text-left px-4 py-3 font-heading text-ink-primary hover:bg-cyan-light/20 hover:text-cyan-primary transition-colors flex items-center space-x-2"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Logout</span>
                            </button>
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <a
                    href="/login"
                    className="px-6 py-2 bg-cyan-primary text-white font-heading font-bold treasure-border hover:bg-cyan-dark transition-colors flex items-center space-x-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </a>
                )}
              </>
            )}
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
              <a href="/" className="block font-heading text-ink-primary hover:text-cyan-primary transition-colors">
                Home
              </a>
              <a href="/about" className="block font-heading text-ink-primary hover:text-cyan-primary transition-colors">
                About
              </a>
              <a href="/blog" className="block font-heading text-ink-primary hover:text-cyan-primary transition-colors">
                Blog
              </a>
              <a href="/directory" className="block font-heading text-ink-primary hover:text-cyan-primary transition-colors">
                Business Directory
              </a>
              {!loading && (
                <>
                  {user ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 p-2 bg-parchment-light treasure-border">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} className="w-8 h-8 rounded-full" />
                        ) : (
                          <User className="w-8 h-8" />
                        )}
                        <span className="font-heading text-ink-primary">{user.username}</span>
                      </div>
                      {user.role === 'super_admin' && (
                        <>
                          <a
                            href="/admin/dashboard"
                            className="block font-heading text-ink-primary hover:text-cyan-primary transition-colors"
                          >
                            Admin Dashboard
                          </a>
                          <a
                            href="/admin/database"
                            className="block font-heading text-ink-primary hover:text-cyan-primary transition-colors"
                          >
                            Database Viewer
                          </a>
                        </>
                      )}
                      {(user.role === 'partner' || user.role === 'super_admin') && (
                        <a
                          href="/partner/dashboard"
                          className="block font-heading text-ink-primary hover:text-cyan-primary transition-colors"
                        >
                          Partner Dashboard
                        </a>
                      )}
                      <form action="/api/auth/logout" method="POST">
                        <button
                          type="submit"
                          className="flex items-center space-x-2 font-heading text-ink-primary hover:text-cyan-primary transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </form>
                    </div>
                  ) : (
                    <a
                      href="/login"
                      className="block text-center px-6 py-2 bg-cyan-primary text-white font-heading font-bold treasure-border hover:bg-cyan-dark transition-colors flex items-center justify-center space-x-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Login</span>
                    </a>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
