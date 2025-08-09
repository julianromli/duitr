import { useState, useEffect, useCallback } from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { 
	SupportedCurrency, 
	formatCurrencyInput, 
	unformatCurrencyInput, 
	getCurrencySymbol
} from '../../utils/currency'
import { useCurrencyOnboarding } from '../../hooks/useCurrencyOnboarding'
import { cn } from '../../lib/utils'

interface CurrencyInputProps {
	value: number
	onChange: (value: number, currency: SupportedCurrency) => void
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
	label,
	placeholder,
	error,
	disabled = false,
	className,
	required = false
}: CurrencyInputProps) {
	const { getUserCurrency } = useCurrencyOnboarding()
	const [inputValue, setInputValue] = useState('')
	const userCurrency = getUserCurrency()

	// Update input value when external value changes
	useEffect(() => {
		if (value === 0) {
			setInputValue('')
		} else {
			const formatted = formatCurrencyInput(value.toString(), userCurrency)
			setInputValue(formatted)
		}
	}, [value, userCurrency])

	const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const rawValue = e.target.value
		
		// Allow empty input
		if (rawValue === '') {
			setInputValue('')
			onChange(0, userCurrency)
			return
		}

		// Format the input as user types
		const formatted = formatCurrencyInput(rawValue, userCurrency)
		setInputValue(formatted)

		// Convert to number and call onChange
		try {
			const unformatted = unformatCurrencyInput(formatted, userCurrency)
			const numericValue = Number(unformatted)
			
			if (!isNaN(numericValue) && numericValue >= 0) {
				onChange(numericValue, userCurrency)
			}
		} catch (err) {
			console.error('Failed to parse currency input:', err)
		}
	}, [userCurrency, onChange])



	return (
		<div className={cn('space-y-2', className)}>
			{label && (
				<Label className="text-sm font-medium">
					{label}
					{required && <span className="text-destructive ml-1">*</span>}
				</Label>
			)}
			
			<div className="relative">
				<Input
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					placeholder={placeholder || `Enter amount in ${userCurrency}`}
					disabled={disabled}
					className={cn(
						'font-mono pl-8',
						error && 'border-destructive focus-visible:ring-destructive'
					)}
				/>
				{/* Currency symbol overlay */}
				<div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
					{getCurrencySymbol(userCurrency)}
				</div>
			</div>

			{/* Error message */}
			{error && (
				<p className="text-sm text-destructive">{error}</p>
			)}
		</div>
	)
}

export default CurrencyInput