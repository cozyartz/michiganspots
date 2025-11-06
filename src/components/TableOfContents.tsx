import { useState, useEffect } from 'react';
import { List, ChevronRight } from 'lucide-react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -66%',
        threshold: 0,
      }
    );

    // Observe all headings
    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsOpen(false);
    }
  };

  if (headings.length === 0) return null;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-20 right-4 z-40 p-4 bg-copper-orange text-parchment-light rounded-full shadow-2xl hover:bg-sunset-red transition-all duration-300 transform hover:scale-110"
        aria-label="Toggle table of contents"
      >
        <List className="w-6 h-6" />
      </button>

      {/* Table of contents */}
      <aside
        className={`
          fixed top-32 right-8 w-72 max-h-[60vh] overflow-y-auto
          bg-parchment-light dark:bg-ink-secondary
          border-2 border-parchment-dark dark:border-ink-faded
          rounded-2xl shadow-lg p-6
          transition-all duration-300 z-30
          ${isOpen ? 'translate-x-0' : 'translate-x-[120%] lg:translate-x-0'}
        `}
      >
        <h3 className="font-heading font-bold text-lg text-ink-primary dark:text-parchment-light mb-4 flex items-center gap-2">
          <List className="w-5 h-5" />
          On This Page
        </h3>

        <nav>
          <ul className="space-y-2">
            {headings.map(({ id, text, level }) => (
              <li key={id} style={{ paddingLeft: `${(level - 2) * 12}px` }}>
                <button
                  onClick={() => handleClick(id)}
                  className={`
                    w-full text-left text-sm py-2 px-3 rounded-lg
                    transition-all duration-200
                    flex items-center gap-2 group
                    ${
                      activeId === id
                        ? 'bg-copper-orange/20 text-copper-orange dark:bg-copper-orange/30 dark:text-gold-treasure font-semibold'
                        : 'text-ink-secondary dark:text-parchment-light/70 hover:bg-parchment-mid dark:hover:bg-ink-primary hover:text-ink-primary dark:hover:text-parchment-light'
                    }
                  `}
                >
                  <ChevronRight
                    className={`
                      w-3 h-3 transition-transform duration-200
                      ${activeId === id ? 'rotate-90 text-copper-orange dark:text-gold-treasure' : 'opacity-0 group-hover:opacity-100'}
                    `}
                  />
                  <span className="line-clamp-2">{text}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Progress indicator */}
        <div className="mt-4 pt-4 border-t border-parchment-dark dark:border-ink-faded">
          <div className="text-xs text-ink-faded dark:text-parchment-light/50 mb-2">
            Reading Progress
          </div>
          <div className="w-full h-2 bg-parchment-dark dark:bg-ink-faded rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-copper-orange to-gold-treasure transition-all duration-300"
              style={{
                width: `${
                  headings.length > 0
                    ? ((headings.findIndex((h) => h.id === activeId) + 1) /
                        headings.length) *
                      100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-ink-primary/50 z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
