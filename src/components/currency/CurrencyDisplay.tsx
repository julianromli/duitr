import { useState, useEffect } from 'react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { ArrowRightLeft, Loader2 } from 'lucide-react'
import { SupportedCurrency, formatCurrency } from '../../utils/currency'
import { useCurrencyConverter } from '../../hooks/useExchangeRate'
import { useCurrency } from '../../hooks/useCurrency'
import { cn } from '../../lib/utils'

interface CurrencyDisplayProps {
	amount: number
	currency: SupportedCurrency
	showConversion?: boolean
	convertTo?: SupportedCurrency
	className?: string
	showCurrencyCode?: boolean
	allowToggle?: boolean
	size?: 'sm' | 'md' | 'lg'
}

export function CurrencyDisplay({
	amount,
	currency,
	showConversion = false,
	convertTo,
	className,
	showCurrencyCode = true,
	allowToggle = false,
	size = 'md'
}: CurrencyDisplayProps) {
	const { currency: userCurrency } = useCurrency()
	const [displayCurrency, setDisplayCurrency] = useState(userCurrency)
	const [showConverted, setShowConverted] = useState(false)

	// Determine target currency for conversion - always convert to user's currency
	const targetCurrency = userCurrency
	const shouldShowConversion = showConversion && currency !== targetCurrency

	// Use currency converter hook for real-time conversion to user's currency
	const {
		convertedAmount,
		rate,
		isLoading: isConverting,
		error: conversionError
	} = useCurrencyConverter(
		amount,
		currency,
		targetCurrency
	)

	// Update display currency when user currency changes
	useEffect(() => {
		if (allowToggle && showConverted) {
			setDisplayCurrency(targetCurrency)
		} else {
			setDisplayCurrency(currency)
		}
	}, [currency, targetCurrency, allowToggle, showConverted])

	const handleToggle = () => {
		if (!allowToggle || !shouldShowConversion) return
		setShowConverted(!showConverted)
	}

	// Get the amount and currency to display - default to user's currency
	// Ensure displayAmount is always a valid number
	let displayAmount = currency === userCurrency ? amount : (convertedAmount !== null ? convertedAmount : amount)
	if (typeof displayAmount !== 'number' || isNaN(displayAmount)) {
		displayAmount = 0
	}
	const currentDisplayCurrency = currency === userCurrency ? userCurrency : (showConverted ? targetCurrency : userCurrency)

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
				{formatCurrency(displayAmount, currentDisplayCurrency)}
			</span>

			{showCurrencyCode && (
				<Badge variant="outline" className={badgeSize[size]}>
					{currentDisplayCurrency}
				</Badge>
			)}

			{shouldShowConversion && (
				<div className="flex items-center space-x-1">
					{allowToggle ? (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										onClick={handleToggle}
										disabled={isConverting || !!conversionError}
										className="h-6 w-6 p-0"
									>
										{isConverting ? (
											<Loader2 className="h-3 w-3 animate-spin" />
										) : (
											<ArrowRightLeft className="h-3 w-3" />
										)}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>
										{showConverted 
											? `Show in ${currency}` 
											: `Convert to ${targetCurrency}`
										}
									</p>
									{rate && (
										<p className="text-xs text-muted-foreground">
											Rate: 1 {currency} = {rate.toFixed(6)} {targetCurrency}
										</p>
									)}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					) : (
						<div className="text-xs text-muted-foreground">
							{isConverting ? (
								<div className="flex items-center space-x-1">
									<Loader2 className="h-3 w-3 animate-spin" />
									<span>Converting...</span>
								</div>
							) : conversionError ? (
								<span className="text-destructive">Conversion failed</span>
							) : convertedAmount !== null ? (
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="cursor-help">
												≈ {formatCurrency(convertedAmount, targetCurrency)}
											</span>
										</TooltipTrigger>
										<TooltipContent>
											<p>Exchange rate: 1 {currency} = {rate?.toFixed(6)} {targetCurrency}</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							) : null}
						</div>
					)}
				</div>
			)}
		</div>
	)
}

export default CurrencyDisplay