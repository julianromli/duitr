/**
 * UIStateContext
 * 
 * Specialized context for UI state and display preferences.
 * Handles currency formatting, display settings, and other UI-related state.
 * 
 * Features:
 * - Currency preference management
 * - Currency formatting utilities
 * - Display settings
 * - Theme preferences (if needed)
 * 
 * Performance Optimizations:
 * - Lightweight state (minimal re-renders)
 * - Memoized formatting functions
 * - Independent from data contexts
 */

import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { formatCurrency as utilsFormatCurrency } from '@/utils/currency';
import { useCurrencyOnboarding } from '@/hooks/useCurrencyOnboarding';

interface UIStateContextType {
  currency: string;
  currencySymbol: string;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  updateCurrency: () => void;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

interface UIStateProviderProps {
  children: ReactNode;
}

export const UIStateProvider: React.FC<UIStateProviderProps> = ({ children }) => {
  const { getUserCurrency } = useCurrencyOnboarding();
  const userCurrency = getUserCurrency();
  
  // For now, currency is always IDR (display-only, no conversion)
  const currency = 'IDR';
  const currencySymbol = 'Rp';

  /**
   * Format currency amount
   * Uses the user's preferred currency for display
   */
  const formatCurrency = useCallback((amount: number, currencyCode?: string): string => {
    const targetCurrency = currencyCode || userCurrency;
    return utilsFormatCurrency(amount, targetCurrency);
  }, [userCurrency]);

  /**
   * Update currency (placeholder for future multi-currency support)
   */
  const updateCurrency = useCallback(() => {
    // Currency is always IDR for now, no need to update
    console.log('Currency update requested (currently display-only)');
  }, []);

  const value = useMemo(() => ({
    currency,
    currencySymbol,
    formatCurrency,
    updateCurrency,
  }), [currency, currencySymbol, formatCurrency, updateCurrency]);

  return (
    <UIStateContext.Provider value={value}>
      {children}
    </UIStateContext.Provider>
  );
};

/**
 * Custom hook to use UI state context
 */
export const useUIState = (): UIStateContextType => {
  const context = useContext(UIStateContext);
  if (context === undefined) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
};
