import { useEffect } from 'react';

interface ResourceOptimizerProps {
  preloadImages?: string[];
  preconnectDomains?: string[];
  dnsPrefetchDomains?: string[];
}

const ResourceOptimizer: React.FC<ResourceOptimizerProps> = ({
  preloadImages = [],
  preconnectDomains = [],
  dnsPrefetchDomains = []
}) => {
  useEffect(() => {
    // Preload critical images
    preloadImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });

    // Preconnect to external domains
    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      document.head.appendChild(link);
    });

    // DNS prefetch for external domains
    dnsPrefetchDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });

    // Cleanup function
    return () => {
      // Remove preload links after they're no longer needed
      const preloadLinks = document.querySelectorAll('link[rel="preload"][as="image"]');
      preloadLinks.forEach(link => {
        if (preloadImages.includes((link as HTMLLinkElement).href)) {
          link.remove();
        }
      });
    };
  }, [preloadImages, preconnectDomains, dnsPrefetchDomains]);

  return null;
};

export default ResourceOptimizer;