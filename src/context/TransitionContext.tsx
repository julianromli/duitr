import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouterState } from '@tanstack/react-router';

interface TransitionContextType {
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextType>({
  isTransitioning: false,
});

export const useTransition = () => useContext(TransitionContext);

export const TransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [pathname]);
  
  return (
    <TransitionContext.Provider value={{ isTransitioning }}>
      {children}
    </TransitionContext.Provider>
  );
}; 