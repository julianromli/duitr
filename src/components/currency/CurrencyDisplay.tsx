import { SupportedCurrency, formatCurrency } from '../../utils/currency'
import { useCurrencyOnboarding } from '../../hooks/useCurrencyOnboarding'
import { cn } from '../../lib/utils'

interface CurrencyDisplayProps {
	amount: number
	className?: string
	size?: 'sm' | 'md' | 'lg'
}

export function CurrencyDisplay({
	amount,
	className,
	size = 'md'
}: CurrencyDisplayProps) {
	const { getUserCurrency } = useCurrencyOnboarding()
	const userCurrency = getUserCurrency()

	// Ensure displayAmount is always a valid number
	let displayAmount = amount
	if (typeof displayAmount !== 'number' || isNaN(displayAmount)) {
		displayAmount = 0
	}

	// Size classes
	const sizeClasses = {
		sm: 'text-sm',
		md: 'text-base',
		lg: 'text-lg font-semibold'
	}

	return (
		<span className={cn('font-mono', sizeClasses[size], className)}>
			{formatCurrency(displayAmount, userCurrency)}
		</span>
	)
}

export default CurrencyDisplay