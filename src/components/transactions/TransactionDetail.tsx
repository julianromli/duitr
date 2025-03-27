import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, FileText, Tag, ArrowDown, ArrowUp, ArrowLeftRight } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import CategoryIcon from '@/components/shared/CategoryIcon';
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
  const { t } = useTranslation();
  const { transactions, formatCurrency } = useFinance();
  
  // Find the transaction
  const transaction = transactions.find(t => t.id === transactionId);
  
  if (!transaction) {
    return null;
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Get the appropriate icon based on transaction type
  const getTransactionIcon = () => {
    if (transaction.type === 'income') {
      return <ArrowUp className="text-[#C6FE1E]" size={24} />;
    } else if (transaction.type === 'expense') {
      return <ArrowDown className="text-white" size={24} />;
    } else {
      // For any other type including 'transfer'
      return <ArrowLeftRight className="text-[#1364FF]" size={24} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1A1A1A] border-none text-white">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-bold">
              Transaction Details
            </DialogTitle>
            <DialogClose className="rounded-full p-1 bg-[#242425] text-[#868686] hover:text-white" />
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Main transaction info */}
          <div className="flex flex-col items-center justify-center pt-2 pb-6">
            <div className="mb-4 w-16 h-16 rounded-full bg-[#242425] flex items-center justify-center">
              <CategoryIcon category={transaction.category} size="lg" />
            </div>
            
            <h2 className="text-xl font-bold">{transaction.category}</h2>
            <p className="text-sm text-[#868686]">{transaction.description}</p>
            
            <div className="mt-4 flex items-center">
              {getTransactionIcon()}
              <span className={`text-3xl font-bold ml-2 ${
                transaction.type === 'income' 
                  ? 'text-[#C6FE1E]' 
                  : transaction.type === 'expense' 
                    ? 'text-white' 
                    : 'text-[#1364FF]'
              }`}>
                {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
              </span>
            </div>
          </div>
          
          {/* Details list */}
          <div className="bg-[#242425] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#868686]">
                <Calendar size={16} />
                <span>Date</span>
              </div>
              <span className="text-white">{formatDate(transaction.date)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#868686]">
                <Tag size={16} />
                <span>Category</span>
              </div>
              <span className="text-white">{transaction.category}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#868686]">
                <FileText size={16} />
                <span>Description</span>
              </div>
              <span className="text-white">{transaction.description}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetail; 