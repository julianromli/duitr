import { useEffect } from 'react';

interface CriticalCSSProps {
  inlineCSS?: string;
  preloadCSS?: string[];
}

const CriticalCSS: React.FC<CriticalCSSProps> = ({ inlineCSS, preloadCSS = [] }) => {
  useEffect(() => {
    // Preload non-critical CSS
    preloadCSS.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;
      link.onload = () => {
        link.rel = 'stylesheet';
      };
      document.head.appendChild(link);
    });

    // Add critical CSS inline if provided
    if (inlineCSS) {
      const style = document.createElement('style');
      style.textContent = inlineCSS;
      document.head.appendChild(style);
    }

    // Optimize font loading
    const fontOptimizations = `
      /* Font display optimization */
      @font-face {
        font-family: 'Space Grotesk';
        font-display: swap;
      }
      
      /* Prevent layout shift */
      img {
        height: auto;
        max-width: 100%;
      }
      
      /* Optimize animations */
      * {
        will-change: auto;
      }
      
      .animate-spin {
        will-change: transform;
      }
      
      .transition-all {
        will-change: transform, opacity;
      }
    `;

    const optimizationStyle = document.createElement('style');
    optimizationStyle.textContent = fontOptimizations;
    document.head.appendChild(optimizationStyle);

    return () => {
      // Cleanup
      const preloadLinks = document.querySelectorAll('link[rel="preload"][as="style"]');
      preloadLinks.forEach(link => {
        if (preloadCSS.includes((link as HTMLLinkElement).href)) {
          link.remove();
        }
      });
    };
  }, [inlineCSS, preloadCSS]);

  return null;
};

export default CriticalCSS;