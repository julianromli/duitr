import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedWordRotateProps {
  words: string[];
  duration?: number;
  className?: string;
}

export function OptimizedWordRotate({
  words,
  duration = 3000,
  className,
}: OptimizedWordRotateProps) {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIndex((prevIndex) => (prevIndex + 1) % words.length);
        setIsVisible(true);
      }, 150);
    }, duration);

    return () => clearInterval(interval);
  }, [words, duration]);

  return (
    <span
      className={cn(
        'bg-gradient-to-r from-lime-400 to-green-400 bg-clip-text text-transparent transition-opacity duration-150',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      {words[index]}
    </span>
  );
}