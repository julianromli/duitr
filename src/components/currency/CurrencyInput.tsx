import { useState, useEffect, useCallback } from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Loader2 } from 'lucide-react'
import { 
	SupportedCurrency, 
	formatCurrencyInput, 
	unformatCurrencyInput, 
	getSupportedCurrencies,
	getCurrencySymbol,
	parseCurrency,
	formatCurrency
} from '../../utils/currency'
import { useCurrencyConverter } from '../../hooks/useExchangeRate'
import { useCurrency } from '../../hooks/useCurrency'
import { cn } from '../../lib/utils'

interface CurrencyInputProps {
	value: number
	onChange: (value: number, currency: SupportedCurrency) => void
	currency?: SupportedCurrency
	onCurrencyChange?: (currency: SupportedCurrency) => void
	allowCurrencyChange?: boolean
	showConversion?: boolean
	convertTo?: SupportedCurrency
	label?: string
	placeholder?: string
	error?: string
	disabled?: boolean
	className?: string
	required?: boolean
}

export function CurrencyInput({
	value,
	onChange,
	currency: propCurrency,
	onCurrencyChange,
	allowCurrencyChange = false,
	showConversion = false,
	convertTo,
	label,
	placeholder,
	error,
	disabled = false,
	className,
	required = false
}: CurrencyInputProps) {
	const { currency: userCurrency } = useCurrency()
	const [inputValue, setInputValue] = useState('')
	const [currentCurrency, setCurrentCurrency] = useState<SupportedCurrency>(
		propCurrency || userCurrency
	)

	// Target currency for conversion display
	const targetCurrency = convertTo || (currentCurrency === 'IDR' ? 'USD' : 'IDR')
	const shouldShowConversion = showConversion && currentCurrency !== targetCurrency && value > 0

	// Currency converter for real-time conversion display
	const {
		convertedAmount,
		isLoading: isConverting,
		error: conversionError
	} = useCurrencyConverter(value, currentCurrency, targetCurrency)

	// Update input value when external value changes
	useEffect(() => {
		if (value === 0) {
			setInputValue('')
		} else {
			const formatted = formatCurrencyInput(value.toString(), currentCurrency)
			setInputValue(formatted)
		}
	}, [value, currentCurrency])

	// Update currency when prop changes
	useEffect(() => {
		if (propCurrency && propCurrency !== currentCurrency) {
			setCurrentCurrency(propCurrency)
		}
	}, [propCurrency, currentCurrency])

	const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const rawValue = e.target.value
		
		// Allow empty input
		if (rawValue === '') {
			setInputValue('')
			onChange(0, currentCurrency)
			return
		}

		// Format the input as user types
		const formatted = formatCurrencyInput(rawValue, currentCurrency)
		setInputValue(formatted)

		// Convert to number and call onChange
		try {
			const unformatted = unformatCurrencyInput(formatted, currentCurrency)
			const numericValue = Number(unformatted)
			
			if (!isNaN(numericValue) && numericValue >= 0) {
				onChange(numericValue, currentCurrency)
			}
		} catch (err) {
			console.error('Failed to parse currency input:', err)
		}
	}, [currentCurrency, onChange])

	const handleCurrencyChange = useCallback((newCurrency: SupportedCurrency) => {
		setCurrentCurrency(newCurrency)
		onCurrencyChange?.(newCurrency)
		
		// Update the input format for the new currency
		if (value > 0) {
			const formatted = formatCurrencyInput(value.toString(), newCurrency)
			setInputValue(formatted)
		}
		
		// Notify parent with the same value but new currency
		onChange(value, newCurrency)
	}, [value, onChange, onCurrencyChange])

	const supportedCurrencies = getSupportedCurrencies()

	return (
		<div className={cn('space-y-2', className)}>
			{label && (
				<Label className="text-sm font-medium">
					{label}
					{required && <span className="text-destructive ml-1">*</span>}
				</Label>
			)}
			
			<div className="relative">
				<div className="flex space-x-2">
					{/* Currency selector */}
					{allowCurrencyChange ? (
						<Select
							value={currentCurrency}
							onValueChange={handleCurrencyChange}
							disabled={disabled}
						>
							<SelectTrigger className="w-20">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{supportedCurrencies.map((curr) => (
									<SelectItem key={curr} value={curr}>
										<div className="flex items-center space-x-2">
											<span>{getCurrencySymbol(curr)}</span>
											<span className="text-xs text-muted-foreground">{curr}</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : (
						<div className="flex items-center justify-center w-20 px-3 py-2 border border-input bg-background rounded-md">
							<Badge variant="outline" className="text-xs">
								{currentCurrency}
							</Badge>
						</div>
					)}

					{/* Amount input */}
					<div className="flex-1 relative">
						<Input
							type="text"
							value={inputValue}
							onChange={handleInputChange}
							placeholder={placeholder || `Enter amount in ${currentCurrency}`}
							disabled={disabled}
							className={cn(
								'font-mono pl-8',
								error && 'border-destructive focus-visible:ring-destructive'
							)}
						/>
						{/* Currency symbol overlay */}
						<div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
							{getCurrencySymbol(currentCurrency)}
						</div>
					</div>
				</div>

				{/* Conversion display */}
				{shouldShowConversion && (
					<div className="flex items-center justify-between text-xs text-muted-foreground mt-2 px-1">
						<span>Equivalent:</span>
						<div className="flex items-center space-x-2">
							{isConverting ? (
								<div className="flex items-center space-x-1">
									<Loader2 className="h-3 w-3 animate-spin" />
									<span>Converting...</span>
								</div>
							) : conversionError ? (
								<span className="text-destructive">Conversion failed</span>
							) : convertedAmount !== null ? (
								<span className="font-mono">
									≈ {formatCurrency(convertedAmount, targetCurrency)}
								</span>
							) : null}
						</div>
					</div>
				)}
			</div>

			{/* Error message */}
			{error && (
				<p className="text-sm text-destructive">{error}</p>
			)}
		</div>
	)
}

export default CurrencyInput