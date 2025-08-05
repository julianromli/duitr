import { Badge } from '../ui/badge'
import { SupportedCurrency, formatCurrency } from '../../utils/currency'
import { useCurrencyOnboarding } from '../../hooks/useCurrencyOnboarding'
import { cn } from '../../lib/utils'

interface CurrencyDisplayProps {
	amount: number
	className?: string
	showCurrencyCode?: boolean
	size?: 'sm' | 'md' | 'lg'
}

export function CurrencyDisplay({
	amount,
	className,
	showCurrencyCode = true,
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

	const badgeSize = {
		sm: 'text-xs',
		md: 'text-xs',
		lg: 'text-sm'
	}

	return (
		<div className={cn('flex items-center space-x-2', className)}>
			<span className={cn('font-mono', sizeClasses[size])}>
				{formatCurrency(displayAmount, userCurrency)}
			</span>

			{showCurrencyCode && (
				<Badge variant="outline" className={badgeSize[size]}>
					{userCurrency}
				</Badge>
			)}
		</div>
	)
}

export default CurrencyDisplay