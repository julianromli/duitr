import { useEffect, useCallback } from 'react';

interface WebVitalsMetrics {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  inp?: number;
}

interface WebVitalsConfig {
  reportCallback?: (metric: any) => void;
  debug?: boolean;
}

export const useWebVitals = (config: WebVitalsConfig = {}) => {
  const { reportCallback, debug = false } = config;

  const logMetric = useCallback((name: string, value: number, rating: string) => {
    if (debug) {
      console.log(`[Web Vitals] ${name}: ${value}ms (${rating})`);
    }
    reportCallback?.({ name, value, rating });
  }, [debug, reportCallback]);

  const measureFCP = useCallback(() => {
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    if (fcpEntry) {
      const fcp = fcpEntry.startTime;
      const rating = fcp < 1800 ? 'good' : fcp < 3000 ? 'needs-improvement' : 'poor';
      logMetric('FCP', fcp, rating);
      return fcp;
    }
    return null;
  }, [logMetric]);

  const measureLCP = useCallback(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        const lcp = lastEntry.startTime;
        const rating = lcp < 2500 ? 'good' : lcp < 4000 ? 'needs-improvement' : 'poor';
        logMetric('LCP', lcp, rating);
      }
    });
    
    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP not supported
    }
    
    return observer;
  }, [logMetric]);

  const measureCLS = useCallback(() => {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      const rating = clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor';
      logMetric('CLS', clsValue, rating);
    });
    
    try {
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS not supported
    }
    
    return observer;
  }, [logMetric]);

  const measureFID = useCallback(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = entry.processingStart - entry.startTime;
        const rating = fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor';
        logMetric('FID', fid, rating);
      }
    });
    
    try {
      observer.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // FID not supported
    }
    
    return observer;
  }, [logMetric]);

  const measureTTFB = useCallback(() => {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      const rating = ttfb < 800 ? 'good' : ttfb < 1800 ? 'needs-improvement' : 'poor';
      logMetric('TTFB', ttfb, rating);
      return ttfb;
    }
    return null;
  }, [logMetric]);

  const optimizeForWebVitals = useCallback(() => {
    // Optimize images for LCP
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.loading) {
        img.loading = 'lazy';
      }
      if (!img.decoding) {
        img.decoding = 'async';
      }
    });

    // Optimize fonts for CLS
    const fontLinks = document.querySelectorAll('link[rel="stylesheet"]');
    fontLinks.forEach(link => {
      if ((link as HTMLLinkElement).href.includes('fonts')) {
        (link as HTMLLinkElement).rel = 'preload';
        (link as HTMLLinkElement).setAttribute('as', 'style');
      }
    });

    // Add resource hints
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];

    preconnectDomains.forEach(domain => {
      if (!document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });
  }, []);

  useEffect(() => {
    // Wait for page load before measuring
    const measureMetrics = () => {
      measureFCP();
      measureTTFB();
      
      const lcpObserver = measureLCP();
      const clsObserver = measureCLS();
      const fidObserver = measureFID();
      
      // Run optimizations
      optimizeForWebVitals();
      
      return () => {
        lcpObserver?.disconnect();
        clsObserver?.disconnect();
        fidObserver?.disconnect();
      };
    };

    if (document.readyState === 'complete') {
      measureMetrics();
    } else {
      window.addEventListener('load', measureMetrics);
      return () => window.removeEventListener('load', measureMetrics);
    }
  }, [measureFCP, measureLCP, measureCLS, measureFID, measureTTFB, optimizeForWebVitals]);

  return {
    measureFCP,
    measureLCP,
    measureCLS,
    measureFID,
    measureTTFB,
    optimizeForWebVitals
  };
};