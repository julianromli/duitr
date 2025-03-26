/**
 * Formats a number as IDR currency (Indonesian Rupiah)
 * All currency values in the application MUST use this function
 * 
 * @param amount - The number to format as IDR
 * @returns Formatted IDR string (e.g., "Rp1.500.000")
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    currencyDisplay: 'narrowSymbol'
  }).format(amount);
}

/**
 * Validate that a currency string is a valid IDR format
 * 
 * @param value - The string to check
 * @returns boolean indicating if the string is a valid IDR format
 */
export function isValidIDR(value: string): boolean {
  // Check that the string starts with Rp
  if (!value.startsWith('Rp')) {
    return false;
  }
  
  // Remove the Rp and any dots, then check if what remains is a number
  const numericPart = value.substring(2).replace(/\./g, '');
  return !isNaN(Number(numericPart));
}

/**
 * Parse an IDR string back to a number
 * 
 * @param value - The IDR formatted string (e.g., "Rp1.500.000")
 * @returns The numeric value of the IDR string
 */
export function parseIDR(value: string): number {
  if (!isValidIDR(value)) {
    throw new Error('Invalid IDR format. Expected format: Rp1.000.000');
  }
  
  // Remove the Rp and any dots, then convert to a number
  const numericPart = value.substring(2).replace(/\./g, '');
  return Number(numericPart);
}

/**
 * Block any attempt to format currency other than IDR
 * This is a utility function that always throws an error
 */
export function formatCurrency(amount: number, currency: string): never {
  throw new Error(
    'Currency formatting other than IDR is not allowed in this application. ' +
    'Use formatIDR() instead.'
  );
} 