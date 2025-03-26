
import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

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
        <Button className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {formData.type === 'transfer' ? 'Add Transfer' : 'Add Transaction'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <RadioGroup
              id="type"
              value={formData.type}
              onValueChange={(value) => setFormData({ 
                ...formData, 
                type: value as 'income' | 'expense' | 'transfer',
                // Reset category for transfer
                category: value === 'transfer' ? '' : formData.category 
              })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="income" id="income" />
                <Label htmlFor="income" className="text-finance-income">Income</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expense" id="expense" />
                <Label htmlFor="expense" className="text-finance-expense">Expense</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="transfer" id="transfer" />
                <Label htmlFor="transfer">Transfer</Label>
              </div>
            </RadioGroup>
          </div>
          
          {formData.type === 'transfer' ? (
            // Transfer form fields
            <>
              <div className="space-y-2">
                <Label htmlFor="walletId">Origin Account</Label>
                <Select
                  value={formData.walletId}
                  onValueChange={(value) => setFormData({ ...formData, walletId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select origin account" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="destinationWalletId">Destination Account</Label>
                <Select
                  value={formData.destinationWalletId}
                  onValueChange={(value) => setFormData({ ...formData, destinationWalletId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination account" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem 
                        key={wallet.id} 
                        value={wallet.id}
                        disabled={wallet.id === formData.walletId}
                      >
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Transfer Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fee">Admin Fee (if any)</Label>
                <Input
                  id="fee"
                  name="fee"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.fee}
                  onChange={handleChange}
                />
              </div>
            </>
          ) : (
            // Regular transaction fields
            <>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="walletId">Account</Label>
                <Select
                  value={formData.walletId}
                  onValueChange={(value) => setFormData({ ...formData, walletId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Enter description"
              value={formData.description}
              onChange={handleChange}
              required={formData.type !== 'transfer'}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          
          <Button type="submit" className="w-full">
            {formData.type === 'transfer' ? 'Add Transfer' : 'Add Transaction'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;
