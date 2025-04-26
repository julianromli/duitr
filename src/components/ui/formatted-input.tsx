import React, { useState, useEffect, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { formatCurrency, parseCurrency, isValidCurrency } from '@/utils/currency';

interface FormattedInputProps extends Omit<React.ComponentProps<"input">, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onValueChange?: (numericValue: number) => void;
}

const FormattedInput: React.FC<FormattedInputProps> = ({
  value,
  onChange,
  onValueChange,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState<string>('');
  
  // Format the value when it changes from outside
  useEffect(() => {
    if (value === '') {
      setDisplayValue('');
      return;
    }
    
    try {
      // If value is already a number, format it
      if (!isNaN(Number(value))) {
        const formatted = formatNumberWithDots(Number(value));
        setDisplayValue(formatted);
      } else {
        // Assume value is already formatted, just set it
        setDisplayValue(value);
      }
    } catch (e) {
      // If any error, just set the raw value
      setDisplayValue(value);
    }
  }, [value]);
  
  // Format a number with dots as thousand separators
  const formatNumberWithDots = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Allow empty value
    if (!rawValue) {
      setDisplayValue('');
      onChange('');
      onValueChange && onValueChange(0);
      return;
    }
    
    // Remove any non-digit characters except dots
    const digitsOnly = rawValue.replace(/[^\d.]/g, '');
    
    // Remove all dots to get the numeric value
    const numericValue = digitsOnly.replace(/\./g, '');
    
    // Make sure it's a valid number
    if (!numericValue || isNaN(Number(numericValue))) {
      return;
    }
    
    // Format with dots as thousand separators
    const formattedValue = formatNumberWithDots(Number(numericValue));
    setDisplayValue(formattedValue);
    
    // Notify parent component of the change
    onChange(formattedValue);
    onValueChange && onValueChange(Number(numericValue));
  };
  
  return (
    <Input
      {...props}
      value={displayValue}
      onChange={handleChange}
    />
  );
};

export { FormattedInput }; 