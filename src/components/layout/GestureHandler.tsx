
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface GestureHandlerProps {
  children: React.ReactNode;
}

const GestureHandler: React.FC<GestureHandlerProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Order of routes for navigation
  const routes = ['/', '/transactions', '/budgets', '/wallets', '/settings'];
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = () => {
    if (isTransitioning) return;
    
    const minSwipeDistance = 100; // Min distance required for a swipe
    const swipeDistance = touchEndX.current - touchStartX.current;
    
    if (Math.abs(swipeDistance) < minSwipeDistance) return;
    
    const currentRouteIndex = routes.indexOf(location.pathname);
    if (currentRouteIndex === -1) return; // Not on a main route
    
    // Determine next route based on swipe direction
    let nextRouteIndex;
    if (swipeDistance > 0) {
      // Swipe right (go to previous route)
      nextRouteIndex = Math.max(0, currentRouteIndex - 1);
    } else {
      // Swipe left (go to next route)
      nextRouteIndex = Math.min(routes.length - 1, currentRouteIndex + 1);
    }
    
    if (nextRouteIndex !== currentRouteIndex) {
      setIsTransitioning(true);
      navigate(routes[nextRouteIndex]);
      
      // Reset transition flag after animation time
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }
  };
  
  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="h-full w-full"
    >
      {children}
    </div>
  );
};

export default GestureHandler;
