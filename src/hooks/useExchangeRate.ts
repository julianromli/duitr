import { useState, useEffect, useCallback } from 'react'
import { exchangeRateService } from '../services/exchangeRateService'
import { SupportedCurrency } from '../utils/currency'

export interface UseExchangeRateReturn {
	getExchangeRate: (from: SupportedCurrency, to: SupportedCurrency) => Promise<number>
	convertCurrency: (amount: number, from: SupportedCurrency, to: SupportedCurrency) => Promise<{
		convertedAmount: number
		rate: number
		timestamp: string
	}>
	isLoading: boolean
	error: string | null
	refreshRates: () => Promise<void>
}

/**
 * Custom hook for handling exchange rates and currency conversions
 */
export function useExchangeRate(): UseExchangeRateReturn {
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Get exchange rate between two currencies
	const getExchangeRate = useCallback(async (from: SupportedCurrency, to: SupportedCurrency): Promise<number> => {
		try {
			setError(null)
			return await exchangeRateService.getExchangeRate(from, to)
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to get exchange rate'
			setError(errorMessage)
			throw err
		}
	}, [])

	// Convert currency amount
	const convertCurrency = useCallback(async (
		amount: number,
		from: SupportedCurrency,
		to: SupportedCurrency
	) => {
		try {
			setError(null)
			setIsLoading(true)
			return await exchangeRateService.convertCurrency(amount, from, to)
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to convert currency'
			setError(errorMessage)
			throw err
		} finally {
			setIsLoading(false)
		}
	}, [])

	// Refresh all exchange rates
	const refreshRates = useCallback(async () => {
		try {
			setError(null)
			setIsLoading(true)
			await exchangeRateService.refreshAllRates()
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to refresh exchange rates'
			setError(errorMessage)
			throw err
		} finally {
			setIsLoading(false)
		}
	}, [])

	return {
		getExchangeRate,
		convertCurrency,
		isLoading,
		error,
		refreshRates
	}
}

/**
 * Hook for real-time currency conversion display
 */
export function useCurrencyConverter(
	amount: number,
	fromCurrency: SupportedCurrency,
	toCurrency: SupportedCurrency
) {
	const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
	const [rate, setRate] = useState<number | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const convert = useCallback(async () => {
		if (amount <= 0 || fromCurrency === toCurrency) {
			setConvertedAmount(amount)
			setRate(1)
			return
		}

		try {
			setIsLoading(true)
			setError(null)

			const result = await exchangeRateService.convertCurrency(amount, fromCurrency, toCurrency)
			setConvertedAmount(result.convertedAmount)
			setRate(result.rate)
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Conversion failed'
			setError(errorMessage)
			setConvertedAmount(null)
			setRate(null)
		} finally {
			setIsLoading(false)
		}
	}, [amount, fromCurrency, toCurrency])

	useEffect(() => {
		convert()
	}, [convert])

	return {
		convertedAmount,
		rate,
		isLoading,
		error,
		refresh: convert
	}
}

export default useExchangeRate