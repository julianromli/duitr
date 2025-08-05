import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Loader2, DollarSign, Banknote } from 'lucide-react'
import { SupportedCurrency, formatCurrency, getCurrencySymbol } from '../../utils/currency'
import { useCurrency } from '../../hooks/useCurrency'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

interface CurrencySelectionProps {
	onComplete?: () => void
	showSkip?: boolean
	title?: string
	description?: string
}

const CURRENCY_OPTIONS = [
	{
		code: 'IDR' as SupportedCurrency,
		symbol: 'Rp',
		example: '1.500.000',
		icon: Banknote
	},
	{
		code: 'USD' as SupportedCurrency,
		symbol: '$',
		example: '1,500.00',
		icon: DollarSign
	}
]

export function CurrencySelection({
	onComplete,
	showSkip = false,
	title,
	description
}: CurrencySelectionProps) {
	const { t } = useTranslation()
	const { currency: currentCurrency, setCurrency, isLoading } = useCurrency()
	const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(currentCurrency)
	const [isSaving, setIsSaving] = useState(false)

	const handleSave = async () => {
		if (selectedCurrency === currentCurrency) {
			onComplete?.()
			return
		}

		try {
			setIsSaving(true)
			await setCurrency(selectedCurrency)
			toast.success(t('currencySelection.messages.currencyUpdated', { symbol: getCurrencySymbol(selectedCurrency) }))
			onComplete?.()
		} catch (error) {
			console.error('Failed to save currency:', error)
			toast.error(t('currencySelection.messages.failedToSave'))
		} finally {
			setIsSaving(false)
		}
	}

	const handleSkip = () => {
		onComplete?.()
	}

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl font-bold">
					{title || t('currencySelection.title')}
				</CardTitle>
				<CardDescription className="text-muted-foreground">
					{description || t('currencySelection.description')}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<RadioGroup
					value={selectedCurrency}
					onValueChange={(value) => setSelectedCurrency(value as SupportedCurrency)}
					className="space-y-4"
				>
					{CURRENCY_OPTIONS.map((option) => {
					const Icon = option.icon
					const isSelected = selectedCurrency === option.code
					const exampleAmount = option.code === 'IDR' ? 1500000 : 1500

					return (
						<div key={option.code} className="relative">
							<RadioGroupItem
								value={option.code}
								id={option.code}
								className="peer sr-only"
							/>
							<Label
								htmlFor={option.code}
								className={`
									flex items-center space-x-4 p-4 rounded-lg border-2 cursor-pointer
									transition-all duration-200 hover:bg-accent
									${isSelected 
										? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
										: 'border-border hover:border-primary/50'
									}
								`}
							>
								<div className="flex-shrink-0">
									<div className={`
										p-2 rounded-full
										${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}
									`}>
										<Icon className="h-5 w-5" />
									</div>
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center space-x-2">
										<h3 className="font-semibold text-sm">
											{t(`currencySelection.currencies.${option.code}.name`)}
										</h3>
										<Badge variant="secondary" className="text-xs">
											{option.code}
										</Badge>
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										{t(`currencySelection.currencies.${option.code}.description`)}
									</p>
									<p className="text-sm font-mono mt-2">
										{t('currencySelection.example')}: {formatCurrency(exampleAmount, option.code)}
									</p>
								</div>
							</Label>
						</div>
					)
				})}
				</RadioGroup>

				<div className="flex flex-col space-y-2">
					<Button
						onClick={handleSave}
						disabled={isLoading || isSaving}
						className="w-full"
					>
						{(isLoading || isSaving) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{selectedCurrency === currentCurrency 
							? t('currencySelection.buttons.continue') 
							: t('currencySelection.buttons.saveAndContinue')
						}
					</Button>

					{showSkip && (
						<Button
							variant="ghost"
							onClick={handleSkip}
							disabled={isLoading || isSaving}
							className="w-full"
						>
							{t('currencySelection.buttons.skipForNow')}
						</Button>
					)}
				</div>

				<div className="text-xs text-muted-foreground text-center">
					{t('currencySelection.settingsNote')}
				</div>
			</CardContent>
		</Card>
	)
}

export default CurrencySelection