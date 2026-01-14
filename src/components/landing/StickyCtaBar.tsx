import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface StickyCtaBarProps {
  onGetStarted: () => void;
}

export function StickyCtaBar({ onGetStarted }: StickyCtaBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero section (approximately 600px)
      setIsVisible(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/50 py-3 px-4 md:px-8 animate-fade-in shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
            R
          </div>
          <span className="hidden sm:block font-display text-sm font-semibold text-foreground">
            Let's Get <span className="text-accent">REAL</span>
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onGetStarted}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            className="px-5 py-2 bg-primary text-white rounded-full font-semibold text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Start Creating Free
          </button>
        </div>
      </div>
    </div>
  );
}
