import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCurrencyOnboarding, Currency } from '@/hooks/useCurrencyOnboarding'
import { formatCurrency } from '@/utils/currency'
import { DollarSign, Banknote } from 'lucide-react'

interface CurrencyOnboardingDialogProps {
	open: boolean
}

/**
 * Mandatory currency selection dialog for new users
 * Blocks access to the app until currency is selected
 */
export function CurrencyOnboardingDialog({ open }: CurrencyOnboardingDialogProps) {
	const { saveCurrencySelection } = useCurrencyOnboarding()
	const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null)
	const [isLoading, setIsLoading] = useState(false)

	const handleCurrencySelect = (currency: Currency) => {
		setSelectedCurrency(currency)
	}

	const handleConfirm = async () => {
		if (!selectedCurrency) return

		setIsLoading(true)
		const success = await saveCurrencySelection(selectedCurrency)
		setIsLoading(false)

		if (!success) {
			setSelectedCurrency(null)
		}
	}

	const currencyOptions = [
		{
			code: 'USD' as Currency,
			name: 'US Dollar',
			symbol: '$',
			example: formatCurrency(1000, 'USD'),
			description: 'Perfect for international transactions',
			icon: DollarSign,
			color: 'bg-white/5 border-white/10 hover:bg-white/10',
			selectedColor: 'bg-lime-400/10 border-lime-400/30 ring-2 ring-lime-400/20',
		},
		{
			code: 'IDR' as Currency,
			name: 'Indonesian Rupiah',
			symbol: 'Rp',
			example: formatCurrency(1000000, 'IDR'),
			description: 'Ideal for local Indonesian transactions',
			icon: Banknote,
			color: 'bg-white/5 border-white/10 hover:bg-white/10',
			selectedColor: 'bg-lime-400/10 border-lime-400/30 ring-2 ring-lime-400/20',
		},
	]

	return (
		<Dialog open={open} onOpenChange={() => {}}>
			<DialogContent className="sm:max-w-lg bg-background border-white/10" hideCloseButton>
				<DialogHeader className="text-center">
					<DialogTitle className="text-2xl font-bold mb-2 text-white">
						Choose Your Currency
					</DialogTitle>
					<p className="text-gray-300">
						Select your preferred currency for all transactions.
						<br />
						<span className="text-sm font-medium text-orange-400">
							This cannot be changed later.
						</span>
					</p>
				</DialogHeader>
				
				<div className="space-y-4 mt-6">
					{currencyOptions.map((option) => {
						const isSelected = selectedCurrency === option.code
						const cardClass = isSelected ? option.selectedColor : option.color
						const IconComponent = option.icon
						
						return (
							<Card
								key={option.code}
								className={`cursor-pointer transition-all duration-200 ${cardClass} border-2`}
								onClick={() => handleCurrencySelect(option.code)}
							>
								<CardContent className="p-6">
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center gap-3">
										<IconComponent className={`w-8 h-8 ${isSelected ? 'text-lime-400' : 'text-white'}`} />
										<div>
											<h3 className="font-bold text-lg text-white">{option.name}</h3>
											<p className={`text-2xl font-mono font-bold ${isSelected ? 'text-lime-400' : 'text-white'}`}>
												{option.symbol}
											</p>
										</div>
									</div>
									<div className="text-right">
										<div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
											isSelected 
												? 'bg-lime-400 border-lime-400' 
												: 'border-white/30'
										}`}>
											{isSelected && (
												<div className="w-2 h-2 bg-black rounded-full" />
											)}
										</div>
									</div>
								</div>
								<p className="text-sm text-gray-300 mb-3">
									{option.description}
								</p>
								<div className="bg-white/5 border border-white/10 rounded-lg p-3">
									<p className="text-sm text-gray-300 mb-1">Example amount:</p>
									<p className="text-xl font-mono font-bold text-white">
										{option.example}
									</p>
								</div>
							</CardContent>
							</Card>
						)
					})}
				</div>
				
				<div className="mt-8">
					<Button
						onClick={handleConfirm}
						disabled={!selectedCurrency || isLoading}
						className="w-full h-12 text-lg font-semibold bg-lime-400 hover:bg-lime-400/90 text-black"
						size="lg"
					>
						{isLoading ? 'Saving Selection...' : 'Confirm & Continue'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}