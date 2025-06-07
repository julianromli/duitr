import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, PlusCircle, CreditCard, Wallet, Landmark, TrendingUp } from 'lucide-react';
import WalletList from '@/components/wallets/WalletList';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FormattedInput } from '@/components/ui/formatted-input';
import ColorPicker from '@/components/ui/color-picker';

const Wallets: React.FC = () => {
  const { t } = useTranslation();
  const { addWallet, wallets } = useFinance();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    balance: '',
    type: '',
    color: '#1364FF',
  });

  const walletTypes = [
    { value: 'bank', label: t('wallets.bankAccount'), icon: Landmark },
    { value: 'cash', label: t('wallets.cash'), icon: Wallet },
    { value: 'e-wallet', label: t('wallets.eWallet'), icon: CreditCard },
    { value: 'investment', label: t('wallets.investment'), icon: TrendingUp },
  ];

  const colors = [
    { value: '#1364FF', label: t('colors.blue') },
    { value: '#C6FE1E', label: t('colors.green') },
    { value: '#F59F00', label: t('colors.yellow') },
    { value: '#FA5252', label: t('colors.red') },
    { value: '#9775FA', label: t('colors.purple') },
    { value: '#FD7E14', label: t('colors.orange') },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBalanceChange = (value: string) => {
    setFormData({ ...formData, balance: value });
  };

  const handleBalanceValueChange = (numericValue: number) => {
    setFormData({ ...formData, balance: String(numericValue) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    // Validation
    if (!formData.name || !formData.balance || !formData.type) {
      toast({
        title: t('common.error'),
        description: t('wallets.fillAllFields'),
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    try {
      // Add wallet
      await addWallet({
        name: formData.name,
        balance: parseFloat(formData.balance),
        type: formData.type as 'cash' | 'bank' | 'e-wallet' | 'investment',
        color: formData.color,
      });
      
      // Reset form only on success
      setFormData({
        name: '',
        balance: '',
        type: '',
        color: '#1364FF',
      });
      
      // Close dialog only on success
      setOpen(false);
    } catch (error) {
      console.error('Error adding wallet:', error);
      setError('Gagal menambahkan wallet. Silakan coba lagi.');
      // Toast error is already shown by addWallet function
      // Keep the form open to allow the user to try again
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  // Error fallback
  if (error) {
    return (
      <div className="max-w-md mx-auto bg-[#0D0D0D] min-h-screen pb-24 text-white p-6">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate('/')} className="mr-4">
            <ChevronLeft size={24} className="text-white" />
          </button>
          <h1 className="text-xl font-bold">{t('wallets.title')}</h1>
        </div>
        <div className="bg-[#242425] rounded-xl p-6 text-center mt-8">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => setError(null)} className="bg-[#C6FE1E] text-[#0D0D0D]">
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="max-w-md mx-auto bg-[#0D0D0D] min-h-screen pb-24 text-white"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="p-6 pt-12">
        {/* Header with back button */}
        <motion.div 
          className="flex items-center justify-between mb-6"
          variants={itemVariants}
        >
          <div className="flex items-center">
            <button onClick={() => navigate('/')} className="mr-4">
              <ChevronLeft size={24} className="text-white" />
            </button>
            <h1 className="text-xl font-bold">{t('wallets.title')}</h1>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#C6FE1E] hover:bg-[#B0E018] text-[#0D0D0D] rounded-full h-10 w-10 p-0 flex items-center justify-center">
                <PlusCircle size={20} />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#1A1A1A] border-none text-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{t('wallets.addAccount')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#868686]">{t('wallets.accountName')}</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder={t('wallets.accountNamePlaceholder')}
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="bg-[#242425] border-none text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="balance" className="text-[#868686]">{t('wallets.startingBalance')}</Label>
                  <FormattedInput
                    id="balance"
                    name="balance"
                    placeholder="0"
                    value={formData.balance}
                    onChange={handleBalanceChange}
                    onValueChange={handleBalanceValueChange}
                    required
                    className="bg-[#242425] border-none text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-[#868686]">{t('wallets.accountType')}</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger className="bg-[#242425] border-none text-white">
                      <SelectValue placeholder={t('wallets.selectAccountType')} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#242425] border-none text-white">
                      {walletTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="flex items-center">
                          <div className="flex items-center gap-2">
                            <type.icon size={16} className="text-[#868686]" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <ColorPicker
                  value={formData.color}
                  onChange={(color) => setFormData({ ...formData, color })}
                  label={t('wallets.accountColor')}
                  presetColors={colors}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-[#C6FE1E] hover:bg-[#B0E018] text-[#0D0D0D] mt-4 font-medium rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : t('wallets.addAccount')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>
        
        {/* Wrap WalletList in an error boundary */}
        <div className="wallet-list-container">
          {wallets.length > 0 ? (
            <WalletList />
          ) : (
            <motion.div 
              className="bg-[#242425] rounded-xl p-6 text-center mt-4"
              variants={itemVariants}
            >
              <div className="mx-auto w-12 h-12 mb-3 bg-[#333] rounded-full flex items-center justify-center">
                <Wallet size={24} className="text-[#868686]" />
              </div>
              <p className="text-[#868686]">{t('wallets.no_wallets')}</p>
              <p className="text-xs text-[#868686] mt-1">{t('wallets.addAccount')}</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Wallets;
