import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { SupportedCurrency } from '../utils/currency'

export interface UseCurrencyReturn {
	currency: SupportedCurrency
	isLoading: boolean
	error: string | null
}

/**
 * Custom hook for reading user currency preferences (read-only)
 * For currency updates, use useCurrencyOnboarding during onboarding
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

	// Load currency on mount and when user changes
	useEffect(() => {
		loadCurrency()
	}, [loadCurrency])

	return {
		currency,
		isLoading,
		error
	}
}

export default useCurrency