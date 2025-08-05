import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, ArrowUp, ArrowDown, Plus, ArrowLeftRight, Eye, EyeOff, Home, Clock, PieChart, User, Wallet } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { Link, useNavigate } from 'react-router-dom';
import ExpenseForm from '@/components/transactions/ExpenseForm';
import IncomeForm from '@/components/transactions/IncomeForm';
import TransferForm from '@/components/transactions/TransferForm';
import CategoryIcon from '@/components/shared/CategoryIcon';
import CurrencyDisplay from '@/components/currency/CurrencyDisplay';
import AppSettings from '@/components/shared/AppSettings';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/hooks/useCurrency';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import TransactionDetailOverlay from '@/components/transactions/TransactionDetailOverlay';

// Dashboard component displaying summary info and recent transactions.
// Updated recent transactions sorting to use 'created_at' for accuracy.
const Dashboard: React.FC = () => {
  const {
    t
  } = useTranslation();
  const {
    totalBalance,
    convertedTotalBalance,
    transactions,
    formatCurrency,
    monthlyExpense,
    monthlyIncome,
    getDisplayCategoryName
  } = useFinance();
  const navigate = useNavigate();
  const {
    user,
    isBalanceHidden,
    updateBalanceVisibility
  } = useAuth();
  const { currency } = useCurrency();

  // State for form dialogs
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isIncomeFormOpen, setIsIncomeFormOpen] = useState(false);
  const [isTransferFormOpen, setIsTransferFormOpen] = useState(false);

  // State for transaction detail overlay
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Get the first 5 transactions (already sorted by date descendingly from context)
  const recentTransactions = transactions.slice(0, 5);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString('default', {
      month: 'short'
    })} ${date.getFullYear()}`;
  };

  // Update to use overlay component
  const handleTransactionClick = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsDetailOpen(true);
  };
  const navigateToStatistics = () => {
    navigate('/statistics');
  };
  const navigateToTransactions = () => {
    navigate('/transactions');
  };
  const toggleBalanceVisibility = () => {
    updateBalanceVisibility(!isBalanceHidden);
  };

  // Display masked balance when hidden
  const displayBalance = () => {
    if (isBalanceHidden) {
      return "*** ***";
    }
    return (
      <CurrencyDisplay 
        amount={convertedTotalBalance}
        currency={currency}
        showConversion={false}
        className="inline"
      />
    );
  };

  // Open transaction form dialogs
  const openExpenseForm = () => setIsExpenseFormOpen(true);
  const openIncomeForm = () => setIsIncomeFormOpen(true);
  const openTransferForm = () => setIsTransferFormOpen(true);

  // Add Money Dialog
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);

  // Profile image and username state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      try {
        // Set username from metadata
        setUsername(user.user_metadata?.name || user.email?.split('@')[0] || '');

        // Try to load profile image using signed URL to avoid ORB errors
        const loadProfileImage = async (retryCount = 0) => {
          try {
            // Use signed URL instead of public URL to avoid CORS/ORB issues
            const { data, error } = await supabase.storage
              .from('avatars')
              .createSignedUrl(`${user.id}`, 3600); // 1 hour expiry

            if (error) {
              // Handle specific ORB/CORS errors immediately
              if (error.message.includes('not found') || error.message.includes('does not exist')) {
                console.log('Avatar not found, using fallback');
                setProfileImage(null);
                return;
              }
              throw error;
            }

            if (data?.signedUrl) {
              // Test if the signed URL is accessible
              const img = new Image();
              img.crossOrigin = 'anonymous'; // Handle CORS properly
              
              await new Promise((resolve, reject) => {
                img.onload = () => {
                  setProfileImage(data.signedUrl);
                  resolve(undefined);
                };
                img.onerror = (e) => {
                  console.log('Signed URL image failed to load:', e);
                  reject(new Error('Image load failed'));
                };
                img.src = data.signedUrl;
              });
            } else {
              setProfileImage(null);
            }
          } catch (error: any) {
            console.log('Error loading avatar image:', error);

            // Handle ORB errors immediately without retry
            if (error.message?.includes('ERR_BLOCKED_BY_ORB') || 
                error.message?.includes('CORS') ||
                error.name === 'NetworkError') {
              console.log('ORB/CORS error detected, using fallback avatar');
              setProfileImage(null);
              return;
            }

            // Retry only for other types of errors
            if (retryCount < 2) {
              const delay = 500 * Math.pow(2, retryCount);
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
  // Enhanced animation variants for better reveal effects
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const balanceCardVariants = {
    hidden: {
      y: 30,
      opacity: 0,
      scale: 0.95
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.6
      }
    }
  };

  const actionButtonsVariants = {
    hidden: {
      y: 20,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
        delay: 0.2
      }
    }
  };

  const transactionSectionVariants = {
    hidden: {
      y: 25,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 28,
        delay: 0.3,
        staggerChildren: 0.1,
        delayChildren: 0.4
      }
    }
  };

  const transactionItemVariants = {
    hidden: {
      x: -20,
      opacity: 0,
      scale: 0.95
    },
    visible: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };

  const buttonHoverVariants = {
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        type: "spring",
        stiffness: 600,
        damping: 15
      }
    }
  };
  return <>
      <motion.div className="max-w-md mx-auto bg-[#0D0D0D] min-h-screen pb-24 text-white px-2" initial="hidden" animate="visible" variants={containerVariants}>
        <div className="p-4 relative">

          
          {/* Balance Card */}
          <motion.div className="bg-[#C6FE1E] rounded-3xl p-5 mb-6 mt-8 dark:bg-[#C6FE1E] light:bg-[#C6FE1E]" variants={balanceCardVariants}>
            {/* Card Header with Profile */}
            <div className="flex justify-between items-center mb-3">
              <Link to="/profile" className="flex items-center gap-3 flex-grow group">
                <Avatar className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#0D0D0D] group-hover:opacity-80 transition-opacity">
                  {profileImage ? <AvatarImage src={profileImage} alt={username} className="aspect-square object-cover" /> : <AvatarFallback className="bg-[#242425] text-[#C6FE1E] flex items-center justify-center">
                      {username ? username.substring(0, 2).toUpperCase() : 'U'}
                    </AvatarFallback>}
                </Avatar>
                <div className="group-hover:opacity-80 transition-opacity">
                  <p className="text-[#0D0D0D] text-sm font-bold">{t('hello')} {username}!</p>
                  <p className="text-[#242425] text-xs">{t('welcomeBack')}</p>
                </div>
              </Link>
              {/* Settings in top-right corner */}
              <div className="absolute right-10 z-10"><AppSettings />
              </div>
            </div>
            
            {/* Your Balance Text */}
            <div className="mb-1">
              <p className="text-[#242425] text-sm">{t('yourBalance')}</p>
            </div>
            
            {/* Balance Amount with Hide Button */}
            <div className="flex items-center gap-2 mb-3">
              {isBalanceHidden ? (
                <h2 className="text-4xl font-bold text-[#0D0D0D]">{displayBalance()}</h2>
              ) : (
                <h2 className="text-4xl font-bold text-[#0D0D0D]">{displayBalance()}</h2>
              )}
              <button className="text-[#0D0D0D] hover:opacity-75 transition-opacity" onClick={toggleBalanceVisibility}>
                {isBalanceHidden ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            
            {/* Card Number Info - Only shown when balance is hidden */}
            {isBalanceHidden && <div className="mb-3">
            
              </div>}
          </motion.div>

          {/* Action Buttons - Horizontal layout */}
          <motion.div className="flex gap-3 mb-6" variants={actionButtonsVariants}>
            <motion.button variants={buttonHoverVariants} whileHover="hover" whileTap="tap" onClick={openTransferForm} className="flex-1 text-white py-4 px-4 rounded-full flex items-center justify-center gap-2 bg-[#1364ff]">
              <ArrowLeftRight className="text-white" size={18} />
              <span className="font-bold text-base">{t('transactions.transfer')}</span>
            </motion.button>
            
            <Dialog open={isAddMoneyOpen} onOpenChange={setIsAddMoneyOpen}>
              <DialogTrigger asChild>
                <motion.button className="flex-1 bg-[#1364FF] text-white py-4 px-4 rounded-full flex items-center justify-center gap-2" variants={buttonHoverVariants} whileHover="hover" whileTap="tap">
                  <Plus className="text-white" size={18} />
                  <span className="font-bold text-base">{t('transactions.add_money')}</span>
                </motion.button>
              </DialogTrigger>
              <DialogContent className="bg-[#1A1A1A] border-none text-white">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">{t('transactions.add_transaction')}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 pt-4">
                  <Button onClick={() => {
                  setIsAddMoneyOpen(false);
                  openExpenseForm();
                }} className="w-full bg-[#C6FE1E] hover:bg-[#B0E018] text-[#0D0D0D] py-6 rounded-xl flex items-center justify-center gap-3">
                    <ArrowDown size={20} />
                    <span className="font-medium">{t('transactions.add_expense')}</span>
                  </Button>
                  <Button onClick={() => {
                  setIsAddMoneyOpen(false);
                  openIncomeForm();
                }} className="w-full bg-[#C6FE1E] hover:bg-[#B0E018] text-[#0D0D0D] py-6 rounded-xl flex items-center justify-center gap-3">
                    <ArrowUp size={20} />
                    <span className="font-medium">{t('transactions.add_income')}</span>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Transactions Section */}
          <motion.div variants={transactionSectionVariants} className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-semibold">{t('transactions.title')}</h3>
              <button className="text-[#C6FE1E] text-sm" onClick={navigateToTransactions}>
                {t('dashboard.view_all')}
              </button>
            </div>
            
            <motion.div className="space-y-3 text-white" initial="hidden" animate="visible" variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.2
                }
              }
            }}>
              {recentTransactions.map(transaction => <motion.div key={transaction.id} className="flex items-center justify-between border bg-card p-4 rounded-xl cursor-pointer" onClick={() => handleTransactionClick(transaction)} variants={transactionItemVariants} whileHover={{
              scale: 1.02,
              transition: { type: "spring", stiffness: 400, damping: 10 }
            }} whileTap={{
              scale: 0.98,
              transition: { type: "spring", stiffness: 600, damping: 15 }
            }}>
                  <div className="flex items-center gap-4">
                    <CategoryIcon category={transaction.categoryId || transaction.category} size="md" />
                    <div>
                      <p className="font-medium">{getDisplayCategoryName(transaction)}</p>
                      <p className="text-xs text-[#868686]">
                          {transaction.description}
                        </p>
                    </div>
                  </div>
                  <div className={`font-medium ${transaction.type === 'income' ? 'text-[#C6FE1E]' : transaction.type === 'expense' ? 'text-red-500' : 'text-white'}`}>
                    <span>{transaction.type === 'expense' ? '-' : '+'}</span>
                    <CurrencyDisplay 
                      amount={transaction.amount}
                      currency={transaction.converted_currency || transaction.original_currency || 'IDR'}
                      showConversion={false}
                      className="inline"
                    />
                  </div>
                </motion.div>)}
              {recentTransactions.length === 0 && <motion.div className="text-center py-5 text-[#868686]" variants={transactionItemVariants}>
                  {t('transactions.no_transactions')}
                </motion.div>}
            </motion.div>
          </motion.div>
        </div>
        
        {/* Transaction Form Dialogs */}
        <ExpenseForm open={isExpenseFormOpen} onOpenChange={setIsExpenseFormOpen} />
        <IncomeForm open={isIncomeFormOpen} onOpenChange={setIsIncomeFormOpen} />
        <TransferForm open={isTransferFormOpen} onOpenChange={setIsTransferFormOpen} />
        
        {/* Transaction Detail Overlay */}
        {selectedTransaction && <TransactionDetailOverlay transaction={selectedTransaction} open={isDetailOpen} onOpenChange={setIsDetailOpen} />}
      </motion.div>
    </>;
};
export default Dashboard;