/**
 * Bundle optimization utilities
 */
import React from 'react';

// Lazy load components with better error handling
export const createLazyComponent = <T extends React.ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(async () => {
    try {
      const module = await importFn();
      return module;
    } catch (error) {
      console.error('Failed to load component:', error);
      // Return fallback component or empty component
      return {
        default: fallback || (() => React.createElement('div', { children: 'Failed to load component' }))
      };
    }
  });
  
  return LazyComponent;
};

// Preload components for better UX
export const preloadComponent = (importFn: () => Promise<any>) => {
  const componentImport = importFn();
  componentImport.catch(error => {
    console.warn('Failed to preload component:', error);
  });
  return componentImport;
};

// Dynamic import with retry logic
export const dynamicImportWithRetry = async <T>(
  importFn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
};

// Tree shaking helper for lodash-like utilities
export const createTreeShakableUtils = () => {
  // Only include utilities that are actually used
  const debounce = <T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number,
    immediate?: boolean
  ): T => {
    let timeout: NodeJS.Timeout | null = null;
    return ((...args: Parameters<T>) => {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    }) as T;
  };

  const throttle = <T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean;
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    }) as T;
  };

  const memoize = <T extends (...args: unknown[]) => unknown>(fn: T): T => {
    const cache = new Map();
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  };

  return { debounce, throttle, memoize };
};

// Bundle analyzer helper
export const analyzeBundleSize = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const jsResources = resources.filter(resource => 
      resource.name.includes('.js') && !resource.name.includes('hot-update')
    );
    
    const cssResources = resources.filter(resource => 
      resource.name.includes('.css')
    );
    
    const totalJSSize = jsResources.reduce((total, resource) => 
      total + (resource.transferSize || 0), 0
    );
    
    const totalCSSSize = cssResources.reduce((total, resource) => 
      total + (resource.transferSize || 0), 0
    );
    
    return {
      totalSize: totalJSSize + totalCSSSize,
      jsSize: totalJSSize,
      cssSize: totalCSSSize,
      resourceCount: resources.length,
      loadTime: navigation.loadEventEnd - navigation.navigationStart
    };
  }
  
  return null;
};

// Critical resource prioritization
export const prioritizeResources = () => {
  // Preload critical resources
  const criticalResources = [
    '/fonts.css',
    // Add other critical resources
  ];
  
  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    link.as = resource.endsWith('.css') ? 'style' : 'script';
    document.head.appendChild(link);
  });
  
  // Prefetch non-critical resources
  const nonCriticalResources = [
    // Add non-critical resources that might be needed later
  ];
  
  // Use requestIdleCallback for non-critical prefetching
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      nonCriticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = resource;
        document.head.appendChild(link);
      });
    });
  }
};

// Service Worker optimization
export const optimizeServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    // Skip waiting for faster updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
    
    // Handle service worker updates
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
        navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  }
};

export const utils = createTreeShakableUtils();