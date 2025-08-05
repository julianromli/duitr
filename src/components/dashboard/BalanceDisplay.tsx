import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useExchangeRate } from '@/hooks/useExchangeRate';

interface BalanceDisplayProps {
  isHidden?: boolean;
  className?: string;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ 
  isHidden = false, 
  className = "" 
}) => {
  const { totalBalance } = useFinance();
  const { currency: userCurrency } = useCurrency();
  const { convertCurrency } = useExchangeRate();
  const [displayAmount, setDisplayAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const convertBalance = async () => {
      if (!totalBalance || totalBalance === 0) {
        setDisplayAmount(0);
        return;
      }

      // If user currency is IDR, no conversion needed
      if (userCurrency === 'IDR') {
        setDisplayAmount(totalBalance);
        return;
      }

      setIsLoading(true);
      try {
        const converted = await convertCurrency(totalBalance, 'IDR', userCurrency);
        setDisplayAmount(converted || totalBalance);
      } catch (error) {
        console.error('Currency conversion failed:', error);
        setDisplayAmount(totalBalance); // Fallback to original amount
      } finally {
        setIsLoading(false);
      }
    };

    convertBalance();
  }, [totalBalance, userCurrency, convertCurrency]);

  const formatCurrency = (amount: number, currency: string): string => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      amount = 0;
    }

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      // Fallback formatting if currency is not supported
      const currencySymbols: { [key: string]: string } = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'IDR': 'Rp',
      };
      const symbol = currencySymbols[currency] || currency;
      return `${symbol} ${amount.toLocaleString()}`;
    }
  };

  if (isHidden) {
    return (
      <span className={`text-4xl font-bold text-[#0D0D0D] ${className}`}>
        *** ***
      </span>
    );
  }

  if (isLoading) {
    return (
      <span className={`text-4xl font-bold text-[#0D0D0D] ${className}`}>
        {formatCurrency(totalBalance, 'IDR')}
      </span>
    );
  }

  return (
    <span className={`text-4xl font-bold text-[#0D0D0D] ${className}`}>
      {formatCurrency(displayAmount, userCurrency)}
    </span>
  );
};

export default BalanceDisplay;