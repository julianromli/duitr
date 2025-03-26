import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, ArrowUp, ArrowDown, DollarSign, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { useNavigate } from 'react-router-dom';
import TransactionDetail from '@/components/transactions/TransactionDetail';
import ExpenseForm from '@/components/transactions/ExpenseForm';
import IncomeForm from '@/components/transactions/IncomeForm';
import TransferForm from '@/components/transactions/TransferForm';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { totalBalance, transactions, formatCurrency } = useFinance();
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
  
  const toggleBalanceVisibility = () => {
    setIsBalanceHidden(!isBalanceHidden);
  };
  
  // Display masked balance when hidden
  const displayBalance = () => {
    if (isBalanceHidden) {
      return "Rp ******";
    }
    return formatCurrency(totalBalance);
  };

  // Open transaction form dialogs
  const openExpenseForm = () => setIsExpenseFormOpen(true);
  const openIncomeForm = () => setIsIncomeFormOpen(true);
  const openTransferForm = () => setIsTransferFormOpen(true);

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
        className="max-w-md mx-auto bg-gray-50 min-h-screen pb-24"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="bg-[#2D1B69] p-6 rounded-b-[30px]">
          {/* Header */}
          <motion.div 
            className="flex justify-between items-center mb-6"
            variants={itemVariants}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-gray-200">
                {profileImage ? (
                  <AvatarImage src={profileImage} alt={username} />
                ) : (
                  <AvatarFallback className="bg-[#E6DDFF] text-[#7B61FF]">
                    {username ? username.substring(0, 2).toUpperCase() : 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="text-white text-lg font-semibold">Hello {username || 'User'}!</p>
                <p className="text-gray-300 text-sm">Welcome back</p>
              </div>
            </div>
            <div className="relative">
              <Bell className="text-white" size={24} />
              {userData.notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {userData.notifications}
                </span>
              )}
            </div>
          </motion.div>

          {/* Balance Card */}
          <motion.div 
            className="bg-white rounded-2xl p-6 mb-4"
            variants={itemVariants}
          >
            <div className="flex justify-between items-center mb-2">
              <p className="text-gray-500 text-sm">YOUR BALANCE</p>
              <motion.button 
                onClick={toggleBalanceVisibility}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-gray-400 hover:text-gray-600"
              >
                {isBalanceHidden ? <EyeOff size={16} /> : <Eye size={16} />}
              </motion.button>
            </div>
            <h2 className="text-3xl font-bold mb-6">{displayBalance()}</h2>
            <div className="flex justify-between">
              <motion.button 
                className="flex flex-col items-center gap-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openExpenseForm}
              >
                <div className="w-12 h-12 rounded-full bg-[#7B61FF] flex items-center justify-center">
                  <ArrowDown className="text-white" size={20} />
                </div>
                <span className="text-sm">Expense</span>
              </motion.button>
              <motion.button 
                className="flex flex-col items-center gap-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openIncomeForm}
              >
                <div className="w-12 h-12 rounded-full bg-[#7B61FF] flex items-center justify-center">
                  <ArrowUp className="text-white" size={20} />
                </div>
                <span className="text-sm">Income</span>
              </motion.button>
              <motion.button 
                className="flex flex-col items-center gap-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openTransferForm}
              >
                <div className="w-12 h-12 rounded-full bg-[#7B61FF] flex items-center justify-center">
                  <DollarSign className="text-white" size={20} />
                </div>
                <span className="text-sm">Transfer</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Financial Insight Banner */}
          <motion.div 
            className="bg-[#F5F1FF] rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-[#EFE9FF] transition-colors"
            onClick={navigateToStatistics}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#7B61FF] flex items-center justify-center">
                <DollarSign className="text-white" size={24} />
              </div>
              <p className="text-sm">
                Let's check your Financial<br />
                Insight for the month of {new Date().toLocaleString('default', { month: 'long' })}!
              </p>
            </div>
            <ArrowRight className="text-[#7B61FF]" size={20} />
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div 
          className="p-6"
          variants={itemVariants}
        >
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-4">
            {recentTransactions.map((transaction, index) => (
              <motion.div 
                key={transaction.id} 
                className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-3 rounded-lg transition shadow-sm"
                onClick={() => handleTransactionClick(transaction.id)}
                variants={itemVariants}
                whileHover={{ scale: 1.02, backgroundColor: "#f5f5f5" }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center gap-3">
                  <CategoryIcon category={transaction.category} />
                  <div>
                    <p className="font-medium">{transaction.category}</p>
                    <p className="text-sm text-gray-500">{transaction.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${transaction.type === 'income' ? 'text-green-500' : ''}`}>
                    {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

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
