import { supabase } from '../lib/supabase'

export interface ExchangeRate {
	id: string
	base_currency: string
	target_currency: string
	rate: number
	rate_date: string
	source: string
	created_at: string
	updated_at: string
}

export interface ExchangeRateResponse {
	result: string
	base_code: string
	conversion_rates: Record<string, number>
}

class ExchangeRateService {
	private readonly API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY
	private readonly BASE_URL = 'https://v6.exchangerate-api.com/v6'
	private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
	private readonly SUPPORTED_CURRENCIES = ['IDR', 'USD']

	/**
	 * Get exchange rate from cache or API
	 */
	async getExchangeRate(baseCurrency: string, targetCurrency: string): Promise<number> {
		if (baseCurrency === targetCurrency) {
			return 1
		}

		// Validate currencies
		if (!this.SUPPORTED_CURRENCIES.includes(baseCurrency) || !this.SUPPORTED_CURRENCIES.includes(targetCurrency)) {
			throw new Error(`Unsupported currency pair: ${baseCurrency}/${targetCurrency}`)
		}

		// Try to get from cache first
		const cachedRate = await this.getCachedRate(baseCurrency, targetCurrency)
		if (cachedRate) {
			return cachedRate.rate
		}

		// Fetch from API if not in cache
		return await this.fetchAndCacheRate(baseCurrency, targetCurrency)
	}

	/**
	 * Convert amount from one currency to another
	 */
	async convertCurrency(
		amount: number,
		fromCurrency: string,
		toCurrency: string
	): Promise<{ convertedAmount: number; rate: number; timestamp: string }> {
		const rate = await this.getExchangeRate(fromCurrency, toCurrency)
		const convertedAmount = amount * rate

		return {
			convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
			rate,
			timestamp: new Date().toISOString()
		}
	}

	/**
	 * Get cached exchange rate from database
	 */
	private async getCachedRate(baseCurrency: string, targetCurrency: string): Promise<ExchangeRate | null> {
		const today = new Date().toISOString().split('T')[0]

		const { data, error } = await supabase
			.from('exchange_rates')
			.select('*')
			.eq('base_currency', baseCurrency)
			.eq('target_currency', targetCurrency)
			.eq('rate_date', today)
			.single()

		if (error || !data) {
			return null
		}

		// Check if rate is still fresh (within cache duration)
		const rateAge = Date.now() - new Date(data.created_at).getTime()
		if (rateAge > this.CACHE_DURATION) {
			return null
		}

		return data
	}

	/**
	 * Fetch exchange rate from API and cache it
	 */
	private async fetchAndCacheRate(baseCurrency: string, targetCurrency: string): Promise<number> {
		try {
			// Use fallback rates if API key is not available
			if (!this.API_KEY) {
				console.warn('Exchange rate API key not found, using fallback rates')
				return this.getFallbackRate(baseCurrency, targetCurrency)
			}

			const response = await fetch(`${this.BASE_URL}/${this.API_KEY}/latest/${baseCurrency}`)

			if (!response.ok) {
				throw new Error(`API request failed: ${response.status}`)
			}

			const data: ExchangeRateResponse = await response.json()

			if (data.result !== 'success') {
				throw new Error('API returned error result')
			}

			const rate = data.conversion_rates[targetCurrency]
			if (!rate) {
				throw new Error(`Rate not found for ${targetCurrency}`)
			}

			// Cache the rate
			await this.cacheRate(baseCurrency, targetCurrency, rate)

			return rate
		} catch (error) {
			console.error('Failed to fetch exchange rate:', error)
			// Return fallback rate on error
			return this.getFallbackRate(baseCurrency, targetCurrency)
		}
	}

	/**
	 * Cache exchange rate in database
	 */
	private async cacheRate(baseCurrency: string, targetCurrency: string, rate: number): Promise<void> {
		const today = new Date().toISOString().split('T')[0]

		const { error } = await supabase
			.from('exchange_rates')
			.upsert({
				base_currency: baseCurrency,
				target_currency: targetCurrency,
				rate,
				rate_date: today,
				source: 'exchangerate-api',
				updated_at: new Date().toISOString()
			}, {
				onConflict: 'base_currency,target_currency,rate_date'
			})

		if (error) {
			console.error('Failed to cache exchange rate:', error)
		}
	}

	/**
	 * Get fallback exchange rates when API is unavailable
	 */
	private getFallbackRate(baseCurrency: string, targetCurrency: string): number {
		const fallbackRates: Record<string, Record<string, number>> = {
			USD: {
				IDR: 15750.00
			},
			IDR: {
				USD: 0.0000635
			}
		}

		const rate = fallbackRates[baseCurrency]?.[targetCurrency]
		if (!rate) {
			throw new Error(`No fallback rate available for ${baseCurrency}/${targetCurrency}`)
		}

		return rate
	}

	/**
	 * Get all supported currencies
	 */
	getSupportedCurrencies(): string[] {
		return [...this.SUPPORTED_CURRENCIES]
	}

	/**
	 * Refresh all exchange rates
	 */
	async refreshAllRates(): Promise<void> {
		const currencies = this.getSupportedCurrencies()

		for (const baseCurrency of currencies) {
			for (const targetCurrency of currencies) {
				if (baseCurrency !== targetCurrency) {
					try {
						await this.fetchAndCacheRate(baseCurrency, targetCurrency)
						await new Promise(resolve => setTimeout(resolve, 100)) // Rate limiting
					} catch (error) {
						console.error(`Failed to refresh rate ${baseCurrency}/${targetCurrency}:`, error)
					}
				}
			}
		}
	}

	/**
	 * Get historical rates for a specific date range
	 */
	async getHistoricalRates(
		baseCurrency: string,
		targetCurrency: string,
		startDate: string,
		endDate: string
	): Promise<ExchangeRate[]> {
		const { data, error } = await supabase
			.from('exchange_rates')
			.select('*')
			.eq('base_currency', baseCurrency)
			.eq('target_currency', targetCurrency)
			.gte('rate_date', startDate)
			.lte('rate_date', endDate)
			.order('rate_date', { ascending: false })

		if (error) {
			throw new Error(`Failed to fetch historical rates: ${error.message}`)
		}

		return data || []
	}
}

export const exchangeRateService = new ExchangeRateService()
export default exchangeRateService