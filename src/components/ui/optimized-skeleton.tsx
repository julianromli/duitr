import React from 'react';
import { cn } from '@/lib/utils';

interface OptimizedSkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  lines?: number;
}

const OptimizedSkeleton: React.FC<OptimizedSkeletonProps> = ({
  className,
  width,
  height,
  variant = 'rectangular',
  animation = 'pulse',
  lines = 1
}) => {
  const baseClasses = 'bg-muted';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-md'
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[wave_1.5s_ease-in-out_infinite]',
    none: ''
  };
  
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    // Prevent layout shift by setting explicit dimensions
    minHeight: variant === 'text' ? '1rem' : undefined
  };
  
  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              variantClasses[variant],
              animationClasses[animation]
            )}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : '100%' // Last line is shorter
            }}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
      role="status"
      aria-label="Loading..."
    />
  );
};

// Predefined skeleton components for common use cases
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-4 space-y-3', className)}>
    <OptimizedSkeleton variant="rounded" height={200} />
    <OptimizedSkeleton variant="text" lines={2} />
    <div className="flex space-x-2">
      <OptimizedSkeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <OptimizedSkeleton variant="text" width="60%" />
        <OptimizedSkeleton variant="text" width="40%" className="mt-1" />
      </div>
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ items?: number; className?: string }> = ({ 
  items = 3, 
  className 
}) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3">
        <OptimizedSkeleton variant="circular" width={48} height={48} />
        <div className="flex-1">
          <OptimizedSkeleton variant="text" width="80%" />
          <OptimizedSkeleton variant="text" width="60%" className="mt-1" />
        </div>
      </div>
    ))}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number; className?: string }> = ({ 
  rows = 5, 
  cols = 4, 
  className 
}) => (
  <div className={cn('space-y-2', className)}>
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, index) => (
        <OptimizedSkeleton key={index} variant="text" height={20} />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, colIndex) => (
          <OptimizedSkeleton key={colIndex} variant="text" height={16} />
        ))}
      </div>
    ))}
  </div>
);

export default OptimizedSkeleton;