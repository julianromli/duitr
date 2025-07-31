import { useEffect } from 'react';

interface ImagePreloaderProps {
  images: string[];
  priority?: boolean;
}

export function ImagePreloader({ images, priority = false }: ImagePreloaderProps) {
  useEffect(() => {
    const preloadImages = () => {
      images.forEach((src) => {
        const img = new Image();
        img.src = src;
        if (priority) {
          img.loading = 'eager';
        }
      });
    };

    // Preload after a short delay to not block initial render
    const timer = setTimeout(preloadImages, priority ? 0 : 1000);
    
    return () => clearTimeout(timer);
  }, [images, priority]);

  return null;
}