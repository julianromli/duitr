import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="text-center space-y-6">
        {/* Use a relevant icon or image (optional) */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-24 w-24 mx-auto text-primary" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          strokeWidth={1}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-xl font-semibold text-foreground">
          Oops! Page not found.
        </p>
        <p className="text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Button asChild>
          <Link to="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
