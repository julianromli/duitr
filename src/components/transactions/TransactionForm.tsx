import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const TransactionForm: React.FC = () => {
  const { wallets, addTransaction, addTransfer } = useFinance();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'income' | 'expense' | 'transfer',
    walletId: '',
    destinationWalletId: '',
    fee: '0',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Common validation
    if (!formData.amount || !formData.date) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.type === 'transfer') {
      // Transfer validation
      if (!formData.walletId || !formData.destinationWalletId) {
        toast({
          title: 'Error',
          description: 'Please select both origin and destination accounts',
          variant: 'destructive',
        });
        return;
      }
      
      if (formData.walletId === formData.destinationWalletId) {
        toast({
          title: 'Error',
          description: 'Origin and destination accounts cannot be the same',
          variant: 'destructive',
        });
        return;
      }
      
      // Add transfer
      addTransfer({
        amount: parseFloat(formData.amount),
        description: formData.description || 'Transfer',
        date: formData.date,
        fromWalletId: formData.walletId,
        toWalletId: formData.destinationWalletId,
        fee: parseFloat(formData.fee) || 0,
      });
    } else {
      // Income/Expense validation
      if (!formData.category || !formData.description || !formData.walletId) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }
      
      // Add transaction
      addTransaction({
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        date: formData.date,
        type: formData.type === 'transfer' ? 'expense' : formData.type,
        walletId: formData.walletId,
      });
    }
    
    // Reset form
    setFormData({
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      walletId: '',
      destinationWalletId: '',
      fee: '0',
    });
    
    // Show success message
    toast({
      title: 'Success',
      description: `${formData.type === 'transfer' ? 'Transfer' : 'Transaction'} added successfully`,
    });
    
    // Close dialog
    setOpen(false);
  };
  
  const categories = [
    'Groceries',
    'Dining',
    'Transportation',
    'Utilities',
    'Rent',
    'Entertainment',
    'Shopping',
    'Healthcare',
    'Salary',
    'Freelance',
    'Investment',
    'Gift',
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button 
          className="p-2 bg-[#1364FF] rounded-full flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      </DialogTrigger>
      <DialogContent className="bg-[#1A1A1A] border-0 text-white">
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle className="text-xl font-bold">
            {formData.type === 'transfer' ? 'Add Transfer' : 'Add Transaction'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="type" className="text-[#C6FE1E] mb-2 block">Transaction Type</Label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                type="button"
                className={`py-2 px-4 rounded-full text-center ${formData.type === 'income' ? 'bg-[#C6FE1E] text-[#0D0D0D] font-medium' : 'bg-[#242425] text-white'}`}
                onClick={() => setFormData({ ...formData, type: 'income' })}
              >
                Income
              </button>
              <button 
                type="button"
                className={`py-2 px-4 rounded-full text-center ${formData.type === 'expense' ? 'bg-[#C6FE1E] text-[#0D0D0D] font-medium' : 'bg-[#242425] text-white'}`}
                onClick={() => setFormData({ ...formData, type: 'expense' })}
              >
                Expense
              </button>
              <button 
                type="button"
                className={`py-2 px-4 rounded-full text-center ${formData.type === 'transfer' ? 'bg-[#C6FE1E] text-[#0D0D0D] font-medium' : 'bg-[#242425] text-white'}`}
                onClick={() => setFormData({ ...formData, type: 'transfer', category: '' })}
              >
                Transfer
              </button>
            </div>
          </div>
          
          {formData.type === 'transfer' ? (
            // Transfer form fields
            <>
              <div className="space-y-2">
                <Label htmlFor="walletId" className="text-[#868686]">Origin Account</Label>
                <Select
                  value={formData.walletId}
                  onValueChange={(value) => setFormData({ ...formData, walletId: value })}
                >
                  <SelectTrigger className="bg-[#242425] border-0 text-white">
                    <SelectValue placeholder="Select origin account" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242425] border-0 text-white">
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id} className="hover:bg-[#333] focus:bg-[#333]">
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="destinationWalletId" className="text-[#868686]">Destination Account</Label>
                <Select
                  value={formData.destinationWalletId}
                  onValueChange={(value) => setFormData({ ...formData, destinationWalletId: value })}
                >
                  <SelectTrigger className="bg-[#242425] border-0 text-white">
                    <SelectValue placeholder="Select destination account" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242425] border-0 text-white">
                    {wallets.map((wallet) => (
                      <SelectItem 
                        key={wallet.id} 
                        value={wallet.id}
                        disabled={wallet.id === formData.walletId}
                        className="hover:bg-[#333] focus:bg-[#333]"
                      >
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-[#868686]">Transfer Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  className="bg-[#242425] border-0 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fee" className="text-[#868686]">Admin Fee (if any)</Label>
                <Input
                  id="fee"
                  name="fee"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.fee}
                  onChange={handleChange}
                  className="bg-[#242425] border-0 text-white"
                />
              </div>
            </>
          ) : (
            // Regular transaction fields
            <>
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-[#868686]">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  className="bg-[#242425] border-0 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category" className="text-[#868686]">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="bg-[#242425] border-0 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242425] border-0 text-white">
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="hover:bg-[#333] focus:bg-[#333]">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="walletId" className="text-[#868686]">Account</Label>
                <Select
                  value={formData.walletId}
                  onValueChange={(value) => setFormData({ ...formData, walletId: value })}
                >
                  <SelectTrigger className="bg-[#242425] border-0 text-white">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242425] border-0 text-white">
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id} className="hover:bg-[#333] focus:bg-[#333]">
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[#868686]">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Enter description"
              value={formData.description}
              onChange={handleChange}
              required={formData.type !== 'transfer'}
              className="bg-[#242425] border-0 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date" className="text-[#868686]">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="bg-[#242425] border-0 text-white"
            />
          </div>
          
          <Button type="submit" className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#A6DD00] font-semibold border-0">
            {formData.type === 'transfer' ? 'Add Transfer' : 'Add Transaction'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;
