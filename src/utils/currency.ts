export type SupportedCurrency = 'IDR' | 'USD'

export interface CurrencyConfig {
	symbol: string
	locale: string
	minimumFractionDigits: number
	maximumFractionDigits: number
}

const CURRENCY_CONFIGS: Record<SupportedCurrency, CurrencyConfig> = {
	IDR: {
		symbol: 'Rp',
		locale: 'id-ID',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	},
	USD: {
		symbol: '$',
		locale: 'en-US',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}
}

/**
 * Formats a number as currency for display
 * All currency values in the application MUST use this function
 * 
 * @param amount - The number to format
 * @param currency - The currency code (IDR or USD)
 * @returns Formatted currency string with currency symbol
 */
export function formatCurrency(amount: number, currency: SupportedCurrency = 'IDR'): string {
	const config = CURRENCY_CONFIGS[currency]
	if (!config) {
		throw new Error(`Unsupported currency: ${currency}`)
	}

	const formatted = new Intl.NumberFormat(config.locale, {
		style: 'decimal',
		minimumFractionDigits: config.minimumFractionDigits,
		maximumFractionDigits: config.maximumFractionDigits,
	}).format(amount)

	return `${config.symbol} ${formatted}`
}

/**
 * Validate that a currency string is a valid format
 * 
 * @param value - The string to check
 * @param currency - The currency code to validate against
 * @returns boolean indicating if the string is a valid format
 */
export function isValidCurrency(value: string, currency: SupportedCurrency = 'IDR'): boolean {
	const config = CURRENCY_CONFIGS[currency]
	if (!config) return false

	// Remove currency symbol and spaces
	let cleanValue = value.replace(config.symbol, '').trim()

	if (currency === 'IDR') {
		// IDR uses dots as thousand separators
		cleanValue = cleanValue.replace(/\./g, '')
		return !isNaN(Number(cleanValue)) && Number(cleanValue) >= 0
	} else if (currency === 'USD') {
		// USD uses commas as thousand separators and dots as decimal separators
		cleanValue = cleanValue.replace(/,/g, '')
		return !isNaN(Number(cleanValue)) && Number(cleanValue) >= 0
	}

	return false
}

/**
 * Parse a currency string back to a number
 * 
 * @param value - The formatted string (e.g., "Rp 1.500.000" or "$ 1,500.00")
 * @param currency - The currency code to parse
 * @returns The numeric value of the string
 */
export function parseCurrency(value: string, currency: SupportedCurrency = 'IDR'): number {
	if (!isValidCurrency(value, currency)) {
		throw new Error(`Invalid currency format for ${currency}. Expected format: ${getExpectedFormat(currency)}`)
	}

	const config = CURRENCY_CONFIGS[currency]
	// Remove currency symbol and spaces
	let cleanValue = value.replace(config.symbol, '').trim()

	if (currency === 'IDR') {
		// Remove dots (thousand separators) for IDR
		cleanValue = cleanValue.replace(/\./g, '')
	} else if (currency === 'USD') {
		// Remove commas (thousand separators) for USD
		cleanValue = cleanValue.replace(/,/g, '')
	}

	return Number(cleanValue)
}

/**
 * Get expected format example for a currency
 */
function getExpectedFormat(currency: SupportedCurrency): string {
	switch (currency) {
		case 'IDR':
			return 'Rp 1.500.000'
		case 'USD':
			return '$ 1,500.00'
		default:
			return 'Unknown format'
	}
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: SupportedCurrency): string {
	return CURRENCY_CONFIGS[currency]?.symbol || ''
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): SupportedCurrency[] {
	return Object.keys(CURRENCY_CONFIGS) as SupportedCurrency[]
}

/**
 * Check if a currency is supported
 */
export function isSupportedCurrency(currency: string): currency is SupportedCurrency {
        // Using the `in` operator here would return true for any property
        // on the object's prototype chain (e.g. `toString`), which means
        // invalid currency strings could be treated as supported. Use
        // `hasOwnProperty` to ensure only explicitly defined currencies are
        // considered valid.
        return Object.prototype.hasOwnProperty.call(CURRENCY_CONFIGS, currency)
}

/**
 * Format currency input as user types (for input fields)
 */
export function formatCurrencyInput(value: string, currency: SupportedCurrency = 'IDR'): string {
	const config = CURRENCY_CONFIGS[currency]
	if (!config) return value

	// Remove all non-numeric characters except decimal point for USD
	let cleanValue = value.replace(/[^\d.]/g, '')

	if (currency === 'IDR') {
		// For IDR, remove decimal points and format with dots as thousand separators
		cleanValue = cleanValue.replace(/\./g, '')
		if (cleanValue) {
			const formatted = new Intl.NumberFormat('id-ID').format(Number(cleanValue))
			return formatted
		}
	} else if (currency === 'USD') {
		// For USD, handle decimal point properly
		const parts = cleanValue.split('.')
		if (parts.length > 2) {
			// Only allow one decimal point
			cleanValue = parts[0] + '.' + parts.slice(1).join('')
		}
		if (parts[1] && parts[1].length > 2) {
			// Limit to 2 decimal places
			cleanValue = parts[0] + '.' + parts[1].substring(0, 2)
		}
		if (parts[0]) {
			const integerPart = new Intl.NumberFormat('en-US').format(Number(parts[0]))
			const decimalPart = parts[1] ? '.' + parts[1] : ''
			return integerPart + decimalPart
		}
	}

	return cleanValue
}

/**
 * Convert formatted input back to raw number string
 */
export function unformatCurrencyInput(value: string, currency: SupportedCurrency = 'IDR'): string {
	if (currency === 'IDR') {
		return value.replace(/\./g, '')
	} else if (currency === 'USD') {
		return value.replace(/,/g, '')
	}
	return value
}

// For backward compatibility
export const formatIDR = (amount: number) => formatCurrency(amount, 'IDR')
export const isValidIDR = (value: string) => isValidCurrency(value, 'IDR')
export const parseIDR = (value: string) => parseCurrency(value, 'IDR')