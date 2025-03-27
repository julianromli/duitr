/**
 * Formats a number as currency for display
 * All currency values in the application MUST use this function
 * 
 * @param amount - The number to format
 * @returns Formatted currency string without currency symbol
 */
export function formatCurrency(amount: number): string {
  return 'Rp ' + new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Validate that a currency string is a valid format
 * 
 * @param value - The string to check
 * @returns boolean indicating if the string is a valid format
 */
export function isValidCurrency(value: string): boolean {
  // Check for numeric content with possible commas
  const numericPart = value.replace(/,/g, '');
  return !isNaN(Number(numericPart));
}

/**
 * Parse a currency string back to a number
 * 
 * @param value - The formatted string (e.g., "1,500,000")
 * @returns The numeric value of the string
 */
export function parseCurrency(value: string): number {
  if (!isValidCurrency(value)) {
    throw new Error('Invalid currency format. Expected format: 1,000,000');
  }
  
  // Remove commas, then convert to a number
  const numericPart = value.replace(/,/g, '');
  return Number(numericPart);
}

// For backward compatibility
export const formatIDR = formatCurrency;
export const isValidIDR = isValidCurrency;
export const parseIDR = parseCurrency; 