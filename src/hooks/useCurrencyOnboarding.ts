import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

export type Currency = 'USD' | 'IDR'

interface CurrencyOnboardingState {
	isRequired: boolean
	isLoading: boolean
	selectedCurrency: Currency | null
}

/**
 * Hook for managing currency onboarding flow
 * Handles detection of new users and currency selection persistence
 */
export function useCurrencyOnboarding() {
	const { user } = useAuth()
	const [state, setState] = useState<CurrencyOnboardingState>({
		isRequired: false,
		isLoading: true,
		selectedCurrency: null,
	})

	// 🔧 Optimized useEffect with debouncing and proper dependencies
	useEffect(() => {
		if (!user) {
			setState(prev => ({ ...prev, isLoading: false, isRequired: false }))
			return
		}

		// 🔧 Debounce the currency check to prevent rapid state updates
		const timer = setTimeout(() => {
			checkCurrencySelection()
		}, 500)

		return () => clearTimeout(timer)
	}, [user?.id]) // 🔧 Only depend on user.id, not the entire user object

	/**
	 * Check if user has already selected a currency
	 */
	const checkCurrencySelection = async () => {
		try {
			const currency = user?.user_metadata?.currency as Currency
			
			setState({
				isRequired: !currency,
				isLoading: false,
				selectedCurrency: currency || null,
			})
		} catch (error) {
			console.error('Error checking currency selection:', error)
			setState(prev => ({ ...prev, isLoading: false }))
		}
	}

	/**
	 * Save user's currency selection to Supabase user metadata
	 */
	const saveCurrencySelection = async (currency: Currency): Promise<boolean> => {
		if (!user) return false

		try {
			const { error } = await supabase.auth.updateUser({
				data: {
					currency,
					currency_selected_at: new Date().toISOString(),
				}
			})

			if (error) throw error

			setState(prev => ({
				...prev,
				isRequired: false,
				selectedCurrency: currency,
			}))

			toast({
				title: 'Currency Selected',
				description: `Your currency has been set to ${currency}`,
			})

			return true
		} catch (error) {
			console.error('Error saving currency selection:', error)
			toast({
				title: 'Error',
				description: 'Failed to save currency selection',
				variant: 'destructive',
			})
			return false
		}
	}

	/**
	 * Get user's current currency preference
	 */
	const getUserCurrency = (): Currency => {
		return (user?.user_metadata?.currency as Currency) || 'IDR'
	}

	return {
		...state,
		saveCurrencySelection,
		refreshStatus: checkCurrencySelection,
		getUserCurrency,
	}
}