import { useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
}

export const usePerformanceOptimization = () => {
  const measurePerformance = useCallback(() => {
    const metrics: PerformanceMetrics = {};

    // Measure First Contentful Paint (FCP)
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry;
    if (fcpEntry) {
      metrics.fcp = fcpEntry.startTime;
    }

    // Measure Time to First Byte (TTFB)
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
    }

    return metrics;
  }, []);

  const optimizeImages = useCallback(() => {
    // Add loading="lazy" to images that don't have it
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => {
      (img as HTMLImageElement).loading = 'lazy';
    });
  }, []);

  const preloadCriticalResources = useCallback(() => {
    // Preload critical CSS
    const criticalCSS = document.querySelector('link[rel="stylesheet"]');
    if (criticalCSS && !criticalCSS.hasAttribute('data-preloaded')) {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.as = 'style';
      preloadLink.href = (criticalCSS as HTMLLinkElement).href;
      preloadLink.setAttribute('data-preloaded', 'true');
      document.head.insertBefore(preloadLink, criticalCSS);
    }
  }, []);

  const optimizeThirdPartyScripts = useCallback(() => {
    // Add loading="defer" to non-critical scripts
    const scripts = document.querySelectorAll('script[src]:not([async]):not([defer])');
    scripts.forEach(script => {
      if (!(script as HTMLScriptElement).src.includes('critical')) {
        (script as HTMLScriptElement).defer = true;
      }
    });
  }, []);

  const enableResourceHints = useCallback(() => {
    // Add resource hints for external domains
    const externalDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://trae-api-sg.mchost.guru'
    ];

    externalDomains.forEach(domain => {
      if (!document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });
  }, []);

  const optimizeLayoutShift = useCallback(() => {
    // Add explicit dimensions to images without them
    const images = document.querySelectorAll('img:not([width]):not([height])');
    images.forEach(img => {
      const imgElement = img as HTMLImageElement;
      if (imgElement.naturalWidth && imgElement.naturalHeight) {
        imgElement.width = imgElement.naturalWidth;
        imgElement.height = imgElement.naturalHeight;
      }
    });
  }, []);

  useEffect(() => {
    // Run optimizations after component mount
    const timeoutId = setTimeout(() => {
      optimizeImages();
      preloadCriticalResources();
      optimizeThirdPartyScripts();
      enableResourceHints();
      optimizeLayoutShift();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [optimizeImages, preloadCriticalResources, optimizeThirdPartyScripts, enableResourceHints, optimizeLayoutShift]);

  return {
    measurePerformance,
    optimizeImages,
    preloadCriticalResources,
    optimizeThirdPartyScripts,
    enableResourceHints,
    optimizeLayoutShift
  };
};