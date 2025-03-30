import React, { useState } from 'react';
import { Wallet, CreditCard, Landmark, TrendingUp, ArrowUpRight, ArrowDownRight, Edit, Trash, MoreVertical } from 'lucide-react';
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

const WalletList: React.FC = () => {
  const { wallets, walletStats } = useWallets();
  const { updateWallet, deleteWallet, formatCurrency } = useFinance();
  const { toast } = useToast();
  const [editWallet, setEditWallet] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
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
  };

  const handleEditWallet = (wallet: any) => {
    setEditWallet({
      ...wallet,
      balance: wallet.balance.toString(),
    });
    setIsEditOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditWallet({ ...editWallet, [name]: value });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!editWallet.name || !editWallet.balance || !editWallet.type) {
      toast({
        title: t('common.error'),
        description: t('wallets.fillAllFields'),
        variant: "destructive",
      });
      return;
    }
    
    // Update wallet
    updateWallet({
      ...editWallet,
      balance: parseFloat(editWallet.balance),
    });
    
    // Show success message
    toast({
      title: t('common.success'),
      description: t('wallets.accountAdded'),
    });
    
    // Close dialog
    setIsEditOpen(false);
  };

  const handleDeleteWallet = (id: string) => {
    deleteWallet(id);
    toast({
      title: t('common.success'),
      description: t('wallets.delete'),
    });
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
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
        variants={itemVariants}
      >
        <p className="text-sm opacity-80 mb-1">{t('dashboard.total_balance')}</p>
        <h3 className="text-2xl font-bold">{formatCurrency(walletStats.totalBalance)}</h3>
        <p className="text-xs mt-2 opacity-70">{t('wallets.balance_across_all_accounts')}</p>
      </motion.div>
      
      {/* Wallets */}
      <div className="space-y-3">
        {wallets.map((wallet) => (
          <motion.div 
            key={wallet.id} 
            className="bg-[#242425] rounded-xl overflow-hidden"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center" 
                    style={{ backgroundColor: wallet.color }}
                  >
                    {getWalletIcon(wallet.type)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{wallet.name}</p>
                    <p className="text-xs text-[#868686] capitalize">{wallet.type}</p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none">
                    <MoreVertical size={18} className="text-[#868686]" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#1A1A1A] border-none text-white">
                    <DropdownMenuLabel>{t('common.options')}</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[#333]" />
                    <DropdownMenuItem 
                      className="focus:bg-[#333] cursor-pointer"
                      onClick={() => handleEditWallet(wallet)}
                    >
                      <Edit className="mr-2 h-4 w-4" /> {t('wallets.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-400 focus:bg-[#333] focus:text-red-400 cursor-pointer"
                      onClick={() => handleDeleteWallet(wallet.id)}
                    >
                      <Trash className="mr-2 h-4 w-4" /> {t('wallets.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(wallet.balance)}
                </p>
                
                <div className="flex mt-3 gap-6">
                  <div className="space-y-0.5">
                    <div className="flex items-center text-xs text-[#C6FE1E]">
                      <ArrowUpRight className="w-3 h-3 mr-1" /> {t('transactions.income')}
                    </div>
                    <p className="text-sm font-medium text-white">
                      {formatCurrency(
                        walletStats.walletTransactions
                          .find(w => w.id === wallet.id)?.income || 0
                      )}
                    </p>
                  </div>
                  
                  <div className="space-y-0.5">
                    <div className="flex items-center text-xs text-red-400">
                      <ArrowDownRight className="w-3 h-3 mr-1" /> {t('transactions.expense')}
                    </div>
                    <p className="text-sm font-medium text-white">
                      {formatCurrency(
                        walletStats.walletTransactions
                          .find(w => w.id === wallet.id)?.expense || 0
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* Empty State */}
        {wallets.length === 0 && (
          <motion.div 
            className="bg-[#242425] rounded-xl p-6 text-center"
            variants={itemVariants}
          >
            <div className="mx-auto w-12 h-12 mb-3 bg-[#333] rounded-full flex items-center justify-center">
              <Wallet size={24} className="text-[#868686]" />
            </div>
            <p className="text-[#868686]">{t('wallets.no_wallets')}</p>
            <p className="text-xs text-[#868686] mt-1">{t('wallets.use_plus_button')}</p>
          </motion.div>
        )}
      </div>

      {/* Edit Wallet Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#1A1A1A] border-none text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">{t('wallets.edit')}</DialogTitle>
          </DialogHeader>
          {editWallet && (
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#868686]">{t('wallets.accountName')}</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder={t('wallets.accountNamePlaceholder')}
                  value={editWallet.name}
                  onChange={handleEditChange}
                  required
                  className="bg-[#242425] border-none text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="balance" className="text-[#868686]">{t('wallets.balance')}</Label>
                <Input
                  id="balance"
                  name="balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editWallet.balance}
                  onChange={handleEditChange}
                  required
                  className="bg-[#242425] border-none text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type" className="text-[#868686]">{t('wallets.accountType')}</Label>
                <Select 
                  value={editWallet.type} 
                  onValueChange={(value) => setEditWallet({ ...editWallet, type: value })}
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
              
              <div className="space-y-2">
                <Label htmlFor="color" className="text-[#868686]">{t('wallets.accountColor')}</Label>
                <Select 
                  value={editWallet.color} 
                  onValueChange={(value) => setEditWallet({ ...editWallet, color: value })}
                >
                  <SelectTrigger className="bg-[#242425] border-none text-white">
                    <SelectValue placeholder={t('wallets.selectColor')}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: editWallet.color }} 
                        />
                        <span>
                          {colors.find(c => c.value === editWallet.color)?.label || t('wallets.selectColor')}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#242425] border-none text-white">
                    {colors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: color.value }} 
                          />
                          <span>{color.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-[#C6FE1E] hover:bg-[#B0E018] text-[#0D0D0D] mt-4 font-medium"
              >
                {t('common.save')}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default WalletList;
