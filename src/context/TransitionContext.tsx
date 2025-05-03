import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface TransitionContextType {
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextType>({
  isTransitioning: false,
});

export const useTransition = () => useContext(TransitionContext);

export const TransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 300); // Duration of the transition
    
    return () => clearTimeout(timer);
  }, [location.pathname]);
  
  return (
    <TransitionContext.Provider value={{ isTransitioning }}>
      {children}
    </TransitionContext.Provider>
  );
}; 