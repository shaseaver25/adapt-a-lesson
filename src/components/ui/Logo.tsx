import { useEffect, useState, useRef } from 'react';
import logoMain from '@/assets/logo-main.png';
import logoDarkBg from '@/assets/logo-dark-bg.png';

export type LogoSize = 'small' | 'medium' | 'large' | 'xlarge';

interface LogoProps {
  /** Size variant: small (32px), medium (40px), large (64px), xlarge (96px) */
  size?: LogoSize;
  /** Force a specific variant regardless of background detection */
  variant?: 'light' | 'dark';
  /** Additional CSS classes */
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
}

const sizeClasses: Record<LogoSize, string> = {
  small: 'h-8 md:h-10',
  medium: 'h-10 md:h-12',
  large: 'h-16 md:h-20',
  xlarge: 'h-20 md:h-24',
};

/**
 * Centralized Logo component with automatic background detection.
 * 
 * - On light backgrounds: Shows the green main logo
 * - On dark backgrounds: Shows the white/light logo variant
 * 
 * Supports size variants and manual override via the `variant` prop.
 */
export function Logo({ 
  size = 'medium', 
  variant,
  className = '',
  alt = 'RealPath Learning'
}: LogoProps) {
  const [isDarkBackground, setIsDarkBackground] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If variant is explicitly set, don't auto-detect
    if (variant) return;

    const detectBackground = () => {
      if (!containerRef.current) return;

      // Walk up the DOM tree to find the effective background
      let element: HTMLElement | null = containerRef.current;
      
      while (element) {
        const styles = window.getComputedStyle(element);
        const bgColor = styles.backgroundColor;
        
        // Parse RGB values
        const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbMatch) {
          const [, r, g, b] = rgbMatch.map(Number);
          // Check if color is not transparent (alpha > 0 or no alpha)
          const alphaMatch = bgColor.match(/rgba\([^)]+,\s*([\d.]+)\)/);
          const alpha = alphaMatch ? parseFloat(alphaMatch[1]) : 1;
          
          if (alpha > 0.1) {
            // Calculate relative luminance
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            setIsDarkBackground(luminance < 0.5);
            return;
          }
        }
        
        element = element.parentElement;
      }
      
      // Default to checking if dark mode is active
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDarkBackground(isDarkMode);
    };

    // Initial detection
    detectBackground();

    // Re-detect on class changes (dark mode toggle) and resize
    const observer = new MutationObserver(detectBackground);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    // Also listen for window resize as layout may change
    window.addEventListener('resize', detectBackground);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', detectBackground);
    };
  }, [variant]);

  // Determine which logo to show
  const showDarkBgLogo = variant === 'dark' || (!variant && isDarkBackground);
  const logoSrc = showDarkBgLogo ? logoDarkBg : logoMain;

  return (
    <div ref={containerRef} className="inline-flex items-center">
      <img
        src={logoSrc}
        alt={alt}
        className={`w-auto object-contain transition-opacity duration-200 ${sizeClasses[size]} ${className}`}
      />
    </div>
  );
}

export default Logo;
