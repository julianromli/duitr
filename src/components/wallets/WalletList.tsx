import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, Landmark, TrendingUp, ArrowUpRight, ArrowDownRight, Edit, Trash, MoreVertical, MoreHorizontal, Plus, Wallet as WalletIcon, Trash2, CreditCard as CreditCardIcon, Smartphone, Briefcase, DollarSign, Banknote, PiggyBank, Key } from 'lucide-react';
import { useWallets } from '@/hooks/useWallets';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/currency';
import { FormattedInput } from '@/components/ui/formatted-input';
import ColorPicker from '@/components/ui/color-picker';

const WalletList: React.FC = () => {
  const { wallets, walletStats } = useWallets();
  const { updateWallet, deleteWallet, formatCurrency } = useFinance();
  const { toast } = useToast();
  const [editWallet, setEditWallet] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  
  const walletTypes = [
    { value: 'bank', label: t('wallets.types.bank'), icon: Landmark },
    { value: 'cash', label: t('wallets.types.cash'), icon: Wallet },
    { value: 'e-wallet', label: t('wallets.eWallet'), icon: CreditCard },
    { value: 'investment', label: t('wallets.types.investment'), icon: TrendingUp },
  ];

  const colors = [
    { value: '#1364FF', label: 'Blue' },
    { value: '#C6FE1E', label: 'Green' },
    { value: '#F59F00', label: 'Yellow' },
    { value: '#FA5252', label: 'Red' },
    { value: '#9775FA', label: 'Purple' },
    { value: '#FD7E14', label: 'Orange' },
  ];
  
  const getWalletIcon = (type: string) => {
    try {
      switch (type) {
        case 'bank':
          return <Landmark className="w-5 h-5" />;
        case 'e-wallet':
          return <CreditCard className="w-5 h-5" />;
        case 'cash':
          return <Wallet className="w-5 h-5" />;
        case 'investment':
          return <TrendingUp className="w-5 h-5" />;
        default:
          return <Wallet className="w-5 h-5" />;
      }
    } catch (err) {
      console.error('Error rendering wallet icon:', err);
      return <Wallet className="w-5 h-5" />;
    }
  };

  const handleEditWallet = (wallet: any) => {
    try {
      setEditWallet({
        ...wallet,
        balance: wallet.balance.toString(),
      });
      setIsEditOpen(true);
    } catch (err) {
      console.error('Error opening edit wallet dialog:', err);
      toast({
        title: t('common.error'),
        description: t('wallets.editError'),
        variant: "destructive",
      });
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditWallet({ ...editWallet, [name]: value });
  };

  const handleBalanceChange = (value: string) => {
    setEditWallet({ ...editWallet, balance: value });
  };

  const handleBalanceValueChange = (numericValue: number) => {
    setEditWallet({ ...editWallet, balance: numericValue });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Validation
      if (!editWallet.name || !editWallet.balance || !editWallet.type) {
        toast({
          title: t('common.error'),
          description: t('wallets.fillAllFields'),
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Update wallet
      await updateWallet({
        ...editWallet,
        balance: parseFloat(editWallet.balance),
      });
      
      // Close dialog
      setIsEditOpen(false);
    } catch (err) {
      console.error('Error updating wallet:', err);
      setError('Gagal mengubah wallet. Silakan coba lagi.');
      toast({
        title: t('common.error'),
        description: t('wallets.updateError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWallet = async (id: string) => {
    try {
      await deleteWallet(id);
      toast({
        title: t('common.success'),
        description: t('wallets.delete'),
      });
    } catch (err) {
      console.error('Error deleting wallet:', err);
      toast({
        title: t('common.error'),
        description: t('wallets.deleteError'),
        variant: "destructive",
      });
    }
  };
  
  // Enhanced Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.15,
        delayChildren: 0.2,
        duration: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { 
      y: 40, 
      opacity: 0,
      scale: 0.9
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        mass: 1
      }
    }
  };

  const totalBalanceVariants = {
    hidden: { 
      y: -30, 
      opacity: 0,
      scale: 0.8
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        mass: 0.8
      }
    }
  };

  const walletCardVariants = {
    hidden: { 
      y: 30, 
      opacity: 0,
      scale: 0.9
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        mass: 1
      }
    },
    hover: {
      scale: 1.02,
      y: -2,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    },
    tap: {
      scale: 0.98
    }
  };

  const statsVariants = {
    hidden: { 
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.3,
        duration: 0.3
      }
    }
  };

  const statItemVariants = {
    hidden: { 
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2
      }
    }
  };

  // Safely calculate total balance
  const getTotalBalance = () => {
    try {
      return walletStats?.totalBalance || 0;
    } catch (err) {
      console.error('Error calculating total balance:', err);
      return 0;
    }
  };

  // If there's an error, show a fallback UI
  if (error) {
    return (
      <div className="bg-[#242425] rounded-xl p-6 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Button 
          onClick={() => setError(null)} 
          className="bg-[#C6FE1E] text-[#0D0D0D]"
        >
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Total Balance Card */}
      <motion.div 
        className="bg-[#1364FF] rounded-xl p-5 text-white"
        variants={totalBalanceVariants}
        whileHover={{ scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 25 } }}
        whileTap={{ scale: 0.98 }}
      >
        <p className="text-sm opacity-80 mb-1">{t('dashboard.total_balance')}</p>
        <h3 className="text-2xl font-bold">{formatCurrency(getTotalBalance())}</h3>
        <p className="text-xs mt-2 opacity-70">{t('wallets.balance_across_all_accounts')}</p>
      </motion.div>
      
      {/* Wallets */}
      <motion.div 
        className="space-y-3"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.3
            }
          }
        }}
      >
        {Array.isArray(wallets) && wallets.length > 0 ? (
          wallets.map((wallet, index) => (
            <motion.div 
              key={wallet.id} 
              className="border bg-card rounded-xl overflow-hidden"
              variants={itemVariants}
              whileHover={{
                scale: 1.02,
                y: -2,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center" 
                      style={{ backgroundColor: wallet.color }}
                    >
                      {getWalletIcon(wallet.type || 'cash')}
                    </div>
                    <div>
                      <p className="font-medium text-white dark:text-gray-100">{wallet.name}</p>
                      <p className="text-xs text-[#868686] capitalize dark:text-gray-400">
                        {wallet.type && walletTypes.find(t => t.value === wallet.type)?.label || wallet.type || 'Cash'}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none">
                      <MoreVertical size={18} className="text-[#868686] dark:text-gray-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#1A1A1A] border text-white dark:bg-card dark:text-gray-200">
                      <DropdownMenuLabel>{t('common.options')}</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-[#333] dark:bg-gray-600" />
                      <DropdownMenuItem 
                        className="focus:bg-[#333] cursor-pointer dark:focus:bg-gray-600"
                        onClick={() => handleEditWallet(wallet)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> {t('wallets.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-400 focus:bg-[#333] focus:text-red-400 cursor-pointer dark:focus:bg-gray-600 dark:focus:text-red-400"
                        onClick={() => handleDeleteWallet(wallet.id)}
                      >
                        <Trash className="mr-2 h-4 w-4" /> {t('wallets.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div>
                  <p className="text-2xl font-bold text-white dark:text-gray-100">
                    {formatCurrency(wallet.balance)}
                  </p>
                  
                  <motion.div 
                    className="flex mt-3 gap-6"
                    variants={statsVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div className="space-y-0.5" variants={statItemVariants}>
                      <div className="flex items-center text-xs text-[#C6FE1E] dark:text-green-400">
                        <ArrowUpRight className="w-3 h-3 mr-1" /> {t('transactions.income')}
                      </div>
                      <p className="text-sm font-medium text-white dark:text-gray-200">
                        {formatCurrency(
                          walletStats?.walletTransactions
                            ?.find(w => w.id === wallet.id)?.income || 0
                        )}
                      </p>
                    </motion.div>
                    
                    <motion.div className="space-y-0.5" variants={statItemVariants}>
                      <div className="flex items-center text-xs text-red-400 dark:text-red-400">
                        <ArrowDownRight className="w-3 h-3 mr-1" /> {t('transactions.expense')}
                      </div>
                      <p className="text-sm font-medium text-white dark:text-gray-200">
                        {formatCurrency(
                          walletStats?.walletTransactions
                            ?.find(w => w.id === wallet.id)?.expense || 0
                        )}
                      </p>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div 
            className="bg-[#242425] rounded-xl p-6 text-center"
            variants={itemVariants}
          >
            <div className="mx-auto w-12 h-12 mb-3 bg-[#333] rounded-full flex items-center justify-center">
              <Wallet size={24} className="text-[#868686]" />
            </div>
            <p className="text-[#868686]">{t('wallets.no_wallets')}</p>
            <p className="text-xs text-[#868686] mt-1">{t('wallets.addAccount')}</p>
          </motion.div>
        )}
      </motion.div>

      {/* Edit Wallet Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-[#1A1A1A] border-none text-white dark:text-gray-200">
          <DialogHeader>
            <DialogTitle>{t('wallets.edit')}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#868686] dark:text-gray-400">{t('wallets.accountName')}</Label>
              <Input
                id="name"
                name="name"
                placeholder={t('wallets.accountNamePlaceholder')}
                value={editWallet?.name || ''}
                onChange={handleEditChange}
                required
                className="bg-[#242425] border-0 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="balance" className="text-[#868686] dark:text-gray-400">{t('wallets.balance')}</Label>
              <FormattedInput
                id="balance"
                name="balance"
                placeholder="0"
                value={editWallet?.balance?.toString() || ''}
                onChange={handleBalanceChange}
                onValueChange={handleBalanceValueChange}
                required
                className="bg-[#242425] border-0 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type" className="text-[#868686] dark:text-gray-400">{t('wallets.accountType')}</Label>
              <Select 
                value={editWallet?.type || ''} 
                onValueChange={(value) => setEditWallet({ ...editWallet, type: value })}
              >
                <SelectTrigger className="bg-[#242425] border-0 text-white">
                  <SelectValue placeholder={t('wallets.selectAccountType')} />
                </SelectTrigger>
                <SelectContent className="bg-[#242425] border-0 text-white">
                  {walletTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="hover:bg-[#333] focus:bg-[#333] dark:hover:bg-gray-600 dark:focus:bg-gray-600">
                      <div className="flex items-center gap-2">
                        <type.icon size={16} className="text-[#868686] dark:text-gray-400" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <ColorPicker
              value={editWallet?.color || '#1364FF'}
              onChange={(color) => setEditWallet({ ...editWallet, color })}
              label={t('wallets.accountColor')}
              presetColors={colors}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#B0E018] font-semibold border-0"
              disabled={isLoading}
            >
              {isLoading ? t('common.loading') : t('common.save')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default WalletList;
