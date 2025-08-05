import React from 'react';
import { useFinance } from '@/context/FinanceContext';

interface BalanceDisplayProps {
  isHidden?: boolean;
  className?: string;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ 
  isHidden = false, 
  className = "" 
}) => {
  const { convertedTotalBalance, formatCurrency } = useFinance();

  if (isHidden) {
    return (
      <span className={`text-4xl font-bold text-[#0D0D0D] ${className}`}>
        *** ***
      </span>
    );
  }

  return (
    <span className={`text-4xl font-bold text-[#0D0D0D] ${className}`}>
      {formatCurrency(convertedTotalBalance)}
    </span>
  );
};

export default BalanceDisplay;