import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { SupportedCurrency } from '../utils/currency'

export interface UseCurrencyReturn {
	currency: SupportedCurrency
	setCurrency: (currency: SupportedCurrency) => Promise<void>
	isLoading: boolean
	error: string | null
}

/**
 * Custom hook for managing user currency preferences
 */
export function useCurrency(): UseCurrencyReturn {
	const { user } = useAuth()
	const [currency, setCurrencyState] = useState<SupportedCurrency>('IDR')
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Load user's currency preference
	const loadCurrency = useCallback(async () => {
		if (!user) {
			setCurrencyState('IDR')
			setIsLoading(false)
			return
		}

		try {
			setIsLoading(true)
			setError(null)

			// Get user metadata from auth.users
			const { data: userData, error: userError } = await supabase.auth.getUser()

			if (userError) {
				throw userError
			}

			const preferredCurrency = userData.user?.user_metadata?.preferred_currency as SupportedCurrency
			setCurrencyState(preferredCurrency || 'IDR')
		} catch (err) {
			console.error('Failed to load currency preference:', err)
			setError('Failed to load currency preference')
			setCurrencyState('IDR') // Fallback to IDR
		} finally {
			setIsLoading(false)
		}
	}, [user])

	// Update user's currency preference
	const setCurrency = useCallback(async (newCurrency: SupportedCurrency) => {
		if (!user) {
			throw new Error('User must be logged in to set currency preference')
		}

		try {
			setIsLoading(true)
			setError(null)

			// Update user metadata
			const { error: updateError } = await supabase.auth.updateUser({
				data: {
					preferred_currency: newCurrency
				}
			})

			if (updateError) {
				throw updateError
			}

			setCurrencyState(newCurrency)
		} catch (err) {
			console.error('Failed to update currency preference:', err)
			setError('Failed to update currency preference')
			throw err
		} finally {
			setIsLoading(false)
		}
	}, [user])

	// Load currency on mount and when user changes
	useEffect(() => {
		loadCurrency()
	}, [loadCurrency])

	return {
		currency,
		setCurrency,
		isLoading,
		error
	}
}

export default useCurrency