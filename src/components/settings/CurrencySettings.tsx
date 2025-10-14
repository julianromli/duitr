import { useState } from 'react';
import { useCurrencyOnboarding, Currency } from '@/hooks/useCurrencyOnboarding';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, DollarSign, Banknote, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedText from '@/components/ui/animated-text';

export function CurrencySettings() {
  const { getUserCurrency } = useCurrencyOnboarding();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const currentCurrency = getUserCurrency();
  
  const [showChangeDialog, setShowChangeDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [selectedNewCurrency, setSelectedNewCurrency] = useState<Currency | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  const handleChangeCurrency = async () => {
    if (confirmText !== 'DELETE' || !selectedNewCurrency || !user) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please type DELETE to confirm',
      });
      return;
    }
    
    setIsChanging(true);
    
    try {
      // 1. Delete all user data using the database function
      const { error: deleteError } = await supabase.rpc('delete_all_user_data', {
        p_user_id: user.id
      });
      
      if (deleteError) {
        console.error('Error deleting user data:', deleteError);
        throw new Error(`Failed to delete user data: ${deleteError.message}`);
      }
      
      // 2. Update currency preference
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          currency: selectedNewCurrency,
          currency_changed_at: new Date().toISOString()
        }
      });
      
      if (updateError) {
        console.error('Error updating currency:', updateError);
        throw new Error(`Failed to update currency: ${updateError.message}`);
      }
      
      // 3. Force refresh user session
      await supabase.auth.getUser();
      
      toast({
        title: 'Currency Changed Successfully',
        description: `Your currency has been changed to ${selectedNewCurrency}. All previous data has been deleted. You can now start fresh with ${selectedNewCurrency}.`,
        duration: 5000,
      });
      
      // 4. Close dialog and redirect
      setShowChangeDialog(false);
      setConfirmText('');
      setSelectedNewCurrency(null);
      
      // Redirect to home after a short delay
      setTimeout(() => {
        navigate('/');
        window.location.reload(); // Force full reload to clear any cached data
      }, 1000);
      
    } catch (error: any) {
      console.error('Error changing currency:', error);
      toast({
        variant: 'destructive',
        title: 'Error Changing Currency',
        description: error.message || 'Failed to change currency. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsChanging(false);
    }
  };

  const currencyInfo = {
    USD: {
      icon: DollarSign,
      symbol: '$',
      name: 'US Dollar',
      example: '$1,234.56',
      flag: '🇺🇸',
    },
    IDR: {
      icon: Banknote,
      symbol: 'Rp',
      name: 'Indonesian Rupiah',
      example: 'Rp 1.234.567',
      flag: '🇮🇩',
    },
  };

  const current = currencyInfo[currentCurrency];
  const CurrentIcon = current.icon;

  return (
    <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-white/10 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-[#C6FE1E]/10 rounded-full">
            <CurrentIcon className="h-5 w-5 text-[#C6FE1E]" />
          </div>
          <AnimatedText text="Currency Preference" />
        </CardTitle>
        <CardDescription className="text-gray-300">
          Your current currency is <strong className="text-white">{current.flag} {currentCurrency}</strong>. 
          All transactions are recorded in {currentCurrency} format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Currency Display */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300 mb-1">Display Format</p>
              <p className="text-2xl font-mono font-bold text-[#C6FE1E]">{current.example}</p>
            </div>
            <div className="text-4xl">{current.flag}</div>
          </div>
        </div>

        {/* Warning Box */}
        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-200">
              <p className="font-semibold mb-1 text-orange-300">Important Notice</p>
              <p>
                Changing currency will <strong className="text-orange-400">permanently delete all your data</strong> 
                (transactions, budgets, wallets, etc.). This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
        
        {/* Change Currency Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            variant="outline"
            onClick={() => setShowChangeDialog(true)}
            className="w-full h-12 border-2 border-red-500/50 hover:bg-red-500/10 hover:border-red-500 text-red-400 hover:text-red-300 rounded-xl transition-all duration-200"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            <AnimatedText text="Change Currency" />
          </Button>
        </motion.div>
      </CardContent>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={showChangeDialog} onOpenChange={setShowChangeDialog}>
        <AlertDialogContent className="max-w-lg bg-[#1A1A1A] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-red-500/10 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              Change Currency - Data Reset Required
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 text-gray-300">
              <p className="text-base">
                Changing your currency will <strong className="text-red-400">DELETE ALL YOUR DATA</strong>, including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm bg-white/5 p-4 rounded-lg border border-white/10">
                <li>All transactions (income, expenses, transfers)</li>
                <li>All budgets and spending limits</li>
                <li>All wallets and balances</li>
                <li>Want to buy items</li>
                <li>Loan/debt records</li>
              </ul>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-300 font-semibold text-sm">
                  ⚠️ This action is permanent and cannot be undone!
                </p>
              </div>
              
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-white mb-2 block">Select New Currency</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={selectedNewCurrency === 'USD' ? 'default' : 'outline'}
                      onClick={() => setSelectedNewCurrency('USD')}
                      disabled={currentCurrency === 'USD'}
                      className={`h-16 ${
                        selectedNewCurrency === 'USD' 
                          ? 'bg-[#C6FE1E] hover:bg-[#B0E018] text-black border-[#C6FE1E]' 
                          : 'bg-white/5 hover:bg-white/10 border-white/20 text-white'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl">🇺🇸</span>
                        <span className="font-semibold">USD</span>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant={selectedNewCurrency === 'IDR' ? 'default' : 'outline'}
                      onClick={() => setSelectedNewCurrency('IDR')}
                      disabled={currentCurrency === 'IDR'}
                      className={`h-16 ${
                        selectedNewCurrency === 'IDR' 
                          ? 'bg-[#C6FE1E] hover:bg-[#B0E018] text-black border-[#C6FE1E]' 
                          : 'bg-white/5 hover:bg-white/10 border-white/20 text-white'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl">🇮🇩</span>
                        <span className="font-semibold">IDR</span>
                      </div>
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="confirm-text" className="text-white mb-2 block">
                    Type <code className="bg-white/10 px-2 py-0.5 rounded text-[#C6FE1E] font-mono">DELETE</code> to confirm
                  </Label>
                  <Input
                    id="confirm-text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type DELETE in capital letters"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 h-12"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              onClick={() => {
                setConfirmText('');
                setSelectedNewCurrency(null);
              }}
              className="bg-white/5 hover:bg-white/10 border-white/20 text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChangeCurrency}
              disabled={confirmText !== 'DELETE' || !selectedNewCurrency || isChanging}
              className="bg-red-500 hover:bg-red-600 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChanging ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting Data...
                </>
              ) : (
                'Delete All Data & Change Currency'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
