import React from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Check, X } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { motion } from 'framer-motion';

interface TransactionDetailProps {
  transactionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TransactionDetail: React.FC<TransactionDetailProps> = ({ 
  transactionId, 
  open, 
  onOpenChange 
}) => {
  const { transactions, formatCurrency } = useFinance();
  
  // Find the transaction details
  const transaction = transactions.find(t => t.id === transactionId);
  
  if (!transaction) return null;
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
  };
  
  // Get real transaction time from the transaction date
  const formatTime = () => {
    const date = new Date(transaction.date);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  
  // Calculate admin fee based on transaction type (0 for non-transfers)
  const getAdminFee = () => {
    // Only transfers have admin fees
    if (transaction.description?.toLowerCase().includes('transfer') || 
        transaction.category === 'Transfer') {
      return 0.5; // Transfer fee
    }
    return 0; // No fee for other transactions
  };
  
  // Get the appropriate admin fee display text
  const getAdminFeeText = () => {
    const fee = getAdminFee();
    return fee > 0 ? `Rp${fee.toFixed(1)}` : 'Rp0';
  };
  
  // Mock recipient number (only for transfers or OVO)
  const recipientNumber = '+62 813 8164 3328';

  // Get transaction type display name
  const getTransactionTypeName = () => {
    if (transaction.type === 'expense') {
      return transaction.category === 'OVO' ? 'Top up e-money' : 'Payment';
    } else {
      return 'Income';
    }
  };

  // Determine title text
  const getTitleText = () => {
    if (transaction.category === 'OVO') {
      return 'OVO Top up Successful!';
    }
    return transaction.type === 'expense' 
      ? 'Payment Successful!' 
      : 'Income Received!';
  };

  // Determine subtitle text
  const getSubtitleText = () => {
    if (transaction.category === 'OVO') {
      return 'Successfully topped up $180 to Tanjiro';
    }
    return transaction.type === 'expense' 
      ? `Successfully paid to ${transaction.description}` 
      : `Successfully received from ${transaction.description}`;
  };

  // Calculate total amount including admin fee
  const getTotalAmount = () => {
    return transaction.amount + getAdminFee();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 bg-white rounded-2xl overflow-hidden">

        
        <div className="max-h-[85vh] overflow-y-auto">
          {/* Success Icon */}
          <motion.div 
            className="flex justify-center items-center my-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-16 h-16 bg-[#E6F7EF] rounded-full flex items-center justify-center relative">
              <div className="w-12 h-12 bg-[#3DD598] rounded-full flex items-center justify-center">
                <Check className="text-white w-6 h-6" />
              </div>
              <div className="absolute -top-2 -right-2">
                <div className="w-4 h-4 bg-purple-200 rounded-full"></div>
              </div>
              <div className="absolute -bottom-1 -left-2">
                <div className="w-3 h-3 bg-yellow-200 rounded-full"></div>
              </div>
              <div className="absolute top-0 -left-4">
                <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
              </div>
            </div>
          </motion.div>
          
          {/* Transaction Title */}
          <motion.div 
            className="text-center mb-6 px-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h3 className="text-lg font-bold">{getTitleText()}</h3>
            <p className="text-gray-500 text-sm mt-1">{getSubtitleText()}</p>
          </motion.div>
          
          {/* Transaction Details */}
          <motion.div 
            className="px-5 py-3 bg-gray-50 divide-y"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="py-2.5 flex justify-between items-center">
              <p className="text-gray-500 text-sm">Date</p>
              <p className="font-medium text-sm">{formatDate(transaction.date)}</p>
            </div>
            
            <div className="py-2.5 flex justify-between items-center">
              <p className="text-gray-500 text-sm">Time</p>
              <p className="font-medium text-sm">{formatTime()}</p>
            </div>
            
            <div className="py-2.5 flex justify-between items-center">
              <p className="text-gray-500 text-sm">Type of Transactions</p>
              <p className="font-medium text-sm">{getTransactionTypeName()}</p>
            </div>
            
            <div className="py-2.5 flex justify-between items-center">
              <p className="text-gray-500 text-sm">Nominal</p>
              <p className="font-medium text-sm">{formatCurrency(transaction.amount)}</p>
            </div>
            
            <div className="py-2.5 flex justify-between items-center">
              <p className="text-gray-500 text-sm">Admin</p>
              <p className="font-medium text-sm">{getAdminFeeText()}</p>
            </div>
            
            {(transaction.type === 'expense' || transaction.category === 'OVO' || 
              transaction.description?.toLowerCase().includes('transfer') || 
              transaction.category === 'Transfer') && (
              <div className="py-2.5 flex justify-between items-center">
                <p className="text-gray-500 text-sm">Recipient's number</p>
                <p className="font-medium text-sm">{recipientNumber}</p>
              </div>
            )}
            
            <div className="py-2.5 flex justify-between items-center">
              <p className="text-gray-500 text-sm">Status</p>
              <p className="flex items-center text-[#3DD598] font-medium text-sm">
                <Check className="w-3.5 h-3.5 mr-1 stroke-2" /> Success
              </p>
            </div>
            
            <div className="py-2.5 flex justify-between items-center">
              <p className="text-gray-500 text-sm">Total</p>
              <p className="font-bold">{formatCurrency(getTotalAmount())}</p>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetail; 