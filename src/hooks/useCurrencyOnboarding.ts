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

		// 🔧 Add longer delay for new users to allow session to fully establish
		// This helps prevent race conditions with OAuth logins
		const isNewUser = !user?.user_metadata?.currency
		const delay = isNewUser ? 1500 : 500 // 1.5s for new users, 500ms for existing

		const timer = setTimeout(() => {
			checkCurrencySelection()
		}, delay)

		return () => clearTimeout(timer)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.user_metadata?.currency]) // 🔧 Depend on currency to detect when it changes

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
	 * Implements retry logic to handle race conditions with new user sessions
	 */
	const saveCurrencySelection = async (currency: Currency): Promise<boolean> => {
		if (!user) return false

		const maxRetries = 3
		const baseDelay = 1000 // 1 second

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				// 🔧 Validate session exists before attempting update
				const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
				
				if (sessionError || !sessionData?.session) {
					console.warn(`Attempt ${attempt + 1}: No valid session found`)
					throw new Error('No valid session found. Please try again.')
				}

				// 🔧 Attempt to update user metadata
				const { error: updateError } = await supabase.auth.updateUser({
					data: {
						currency,
						currency_selected_at: new Date().toISOString(),
					}
				})

				// 🔧 Handle "User from sub claim in JWT does not exist" error with retry
				if (updateError) {
					const isRaceConditionError = 
						updateError.message.includes('User from sub claim in JWT does not exist') ||
						updateError.message.includes('does not exist')

					if (isRaceConditionError && attempt < maxRetries - 1) {
						// Wait with exponential backoff before retrying
						const delay = baseDelay * Math.pow(2, attempt)
						console.log(`Race condition detected. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`)
						await new Promise(resolve => setTimeout(resolve, delay))
						continue // Retry
					}
					
					throw updateError
				}

				// 🔧 Success! Force refresh user session to trigger USER_UPDATED event
				await supabase.auth.getUser()

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

			} catch (error: any) {
				console.error(`Error saving currency selection (attempt ${attempt + 1}/${maxRetries}):`, error)
				
				// If this is the last attempt, show error to user
				if (attempt === maxRetries - 1) {
					const errorMessage = error?.message || 'Failed to save currency selection'
					const isSessionError = errorMessage.includes('session') || errorMessage.includes('JWT')
					
					toast({
						title: 'Update Failed',
						description: isSessionError 
							? 'Your session is being set up. Please wait a moment and try again.'
							: errorMessage,
						variant: 'destructive',
					})
					return false
				}
				
				// Wait before next retry
				const delay = baseDelay * Math.pow(2, attempt)
				await new Promise(resolve => setTimeout(resolve, delay))
			}
		}

		return false
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