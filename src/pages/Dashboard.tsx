import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, ArrowUp, ArrowDown, Plus, ArrowLeftRight, Eye, EyeOff, Home, Clock, PieChart, User, Wallet } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { useNavigate } from 'react-router-dom';
import TransactionDetail from '@/components/transactions/TransactionDetail';
import ExpenseForm from '@/components/transactions/ExpenseForm';
import IncomeForm from '@/components/transactions/IncomeForm';
import TransferForm from '@/components/transactions/TransferForm';
import CategoryIcon from '@/components/shared/CategoryIcon';
import AppSettings from '@/components/shared/AppSettings';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { totalBalance, transactions, formatCurrency, monthlyExpense, monthlyIncome } = useFinance();
  const navigate = useNavigate();
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  
  // State for form dialogs
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isIncomeFormOpen, setIsIncomeFormOpen] = useState(false);
  const [isTransferFormOpen, setIsTransferFormOpen] = useState(false);
  
  // Sort transactions by date (newest first)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
  };

  const handleTransactionClick = (id: string) => {
    setSelectedTransactionId(id);
    setIsDetailOpen(true);
  };
  
  const navigateToStatistics = () => {
    navigate('/statistics');
  };
  
  const navigateToTransactions = () => {
    navigate('/transactions');
  };
  
  const toggleBalanceVisibility = () => {
    setIsBalanceHidden(!isBalanceHidden);
  };
  
  // Display masked balance when hidden
  const displayBalance = () => {
    if (isBalanceHidden) {
      return "Rp ***";
    }
    return formatCurrency(totalBalance);
  };

  // Open transaction form dialogs
  const openExpenseForm = () => setIsExpenseFormOpen(true);
  const openIncomeForm = () => setIsIncomeFormOpen(true);
  const openTransferForm = () => setIsTransferFormOpen(true);

  // Add Money Dialog
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);

  // Sample user data
  const userData = {
    name: 'Faiz',
    notifications: 2,
  };

  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        // Set username from metadata
        setUsername(user.user_metadata?.name || user.email?.split('@')[0] || '');
        
        // Try to load profile image from public URL with retry logic
        const loadProfileImage = async (retryCount = 0) => {
          try {
            // Get public URL with timestamp to prevent caching
            const timestamp = new Date().getTime();
            const { data } = await supabase
              .storage
              .from('avatars')
              .getPublicUrl(`${user.id}`);
              
            if (data?.publicUrl) {
              // Add timestamp to prevent caching
              const imageUrl = `${data.publicUrl}?t=${timestamp}`;
              
              // Check if image exists by loading it
              const img = new Image();
              
              // Create a promise that resolves when the image loads or rejects on error
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imageUrl;
              });
              
              // If we get here, the image loaded successfully
              setProfileImage(imageUrl);
            }
          } catch (error) {
            console.log('Error loading avatar image:', error);
            
            // Retry up to 2 times with increasing delay if we get network errors
            if (retryCount < 2) {
              const delay = 500 * Math.pow(2, retryCount); // Exponential backoff: 500ms, 1000ms
              console.log(`Retrying avatar load after ${delay}ms...`);
              setTimeout(() => loadProfileImage(retryCount + 1), delay);
            } else {
              console.log('Max retries reached, showing fallback avatar');
              setProfileImage(null);
            }
          }
        };
        
        // Start the loading process
        loadProfileImage();
      } catch (error) {
        console.error('Error loading profile data:', error);
        setProfileImage(null);
      }
    };
    
    loadUserProfile();
    
    // Add event listener for profile image updates
    const handleProfileImageUpdate = () => {
      loadUserProfile();
    };
    
    window.addEventListener('profileImageUpdated', handleProfileImageUpdate);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate);
    };
  }, [user]);

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

  return (
    <>
      <motion.div 
        className="max-w-md mx-auto bg-[#0D0D0D] min-h-screen pb-24 text-white"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="p-6 relative">

          
          {/* Balance Card */}
          <motion.div 
            className="bg-[#C6FE1E] rounded-3xl p-5 mb-6 mt-8 dark:bg-[#C6FE1E] light:bg-[#C6FE1E]"
            variants={itemVariants}
          >
            {/* Card Header with Profile */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#0D0D0D]">
                  {profileImage ? (
                    <AvatarImage src={profileImage} alt={username} className="aspect-square object-cover" />
                  ) : (
                    <AvatarFallback className="bg-[#242425] text-[#C6FE1E] flex items-center justify-center">
                      {username ? username.substring(0, 2).toUpperCase() : 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="text-[#0D0D0D] text-sm font-bold">{t('hello')} {username}!</p>
                  <p className="text-[#242425] text-xs">{t('welcomeBack')}</p>
                </div>
                {/* Settings in top-right corner */}
                <div className="absolute right-10 z-10"><AppSettings/>
                </div>
              </div>
            </div>
            
            {/* Your Balance Text */}
            <div className="mb-1">
              <p className="text-[#242425] text-sm">{t('yourBalance')}</p>
            </div>
            
            {/* Balance Amount with Hide Button */}
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-4xl font-bold text-[#0D0D0D]">{displayBalance()}</h2>
              <button 
                className="text-[#0D0D0D] hover:opacity-75 transition-opacity"
                onClick={toggleBalanceVisibility}
              >
                {isBalanceHidden ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            
            {/* Card Number Info - Only shown when balance is hidden */}
            {isBalanceHidden && (
              <div className="mb-3">
            
              </div>
            )}
          </motion.div>

          {/* Action Buttons - Moved outside the card */}
          <motion.div 
            className="flex justify-between gap-4 mb-6"
            variants={itemVariants}
          >
            <motion.button 
              className="w-1/2 bg-[#242425] text-white py-3 px-5 rounded-full flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openTransferForm}
            >
              <ArrowLeftRight className="text-white" size={18} />
              <span className="font-medium">{t('transactions.transfer')}</span>
            </motion.button>
            
            <Dialog open={isAddMoneyOpen} onOpenChange={setIsAddMoneyOpen}>
              <DialogTrigger asChild>
                <motion.button 
                  className="w-1/2 bg-[#1364FF] text-white py-3 px-5 rounded-full flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="text-white" size={18} />
                  <span className="font-medium">{t('transactions.add_money')}</span>
                </motion.button>
              </DialogTrigger>
              <DialogContent className="bg-[#1A1A1A] border-none text-white">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">{t('transactions.add_transaction')}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 pt-4">
                  <Button 
                    onClick={() => {
                      setIsAddMoneyOpen(false);
                      openExpenseForm();
                    }}
                    className="w-full bg-[#C6FE1E] hover:bg-[#B0E018] text-[#0D0D0D] py-6 rounded-xl flex items-center justify-center gap-3"
                  >
                    <ArrowDown size={20} />
                    <span className="font-medium">{t('transactions.add_expense')}</span>
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsAddMoneyOpen(false);
                      openIncomeForm();
                    }}
                    className="w-full bg-[#C6FE1E] hover:bg-[#B0E018] text-[#0D0D0D] py-6 rounded-xl flex items-center justify-center gap-3"
                  >
                    <ArrowUp size={20} />
                    <span className="font-medium">{t('transactions.add_income')}</span>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Transactions Section */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-semibold">{t('transactions.title')}</h3>
              <button 
                className="text-[#C6FE1E] text-sm"
                onClick={navigateToTransactions}
              >
                {t('dashboard.view_all')}
              </button>
            </div>
            
            <div className="space-y-3 text-white">
              {recentTransactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  className="flex items-center justify-between bg-[#242425] p-4 rounded-xl cursor-pointer"
                  onClick={() => handleTransactionClick(transaction.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                      <CategoryIcon category={transaction.category} />
                    </div>
                    <div>
                      <p className="font-medium">{transaction.category}</p>
                      <p className="text-xs text-[#868686]">{t(`transactions.${transaction.type.toLowerCase()}`)}</p>
                    </div>
                  </div>
                  <p className={`font-medium ${transaction.type === 'income' ? 'text-[#C6FE1E]' : 'text-white'}`}>
                    {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Transaction Detail Dialog */}
        <TransactionDetail 
          transactionId={selectedTransactionId} 
          open={isDetailOpen} 
          onOpenChange={setIsDetailOpen} 
        />
        
        {/* Transaction Form Dialogs */}
        <ExpenseForm open={isExpenseFormOpen} onOpenChange={setIsExpenseFormOpen} />
        <IncomeForm open={isIncomeFormOpen} onOpenChange={setIsIncomeFormOpen} />
        <TransferForm open={isTransferFormOpen} onOpenChange={setIsTransferFormOpen} />
      </motion.div>
    </>
  );
};

export default Dashboard;
