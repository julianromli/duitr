import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface TransferFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TransferForm: React.FC<TransferFormProps> = ({ open, onOpenChange }) => {
  const { wallets, addTransfer } = useFinance();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    amount: '',
    description: 'Transfer',
    date: new Date().toISOString().split('T')[0],
    fromWalletId: '',
    toWalletId: '',
    fee: '0.5', // Default admin fee
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.amount || !formData.date || !formData.fromWalletId || !formData.toWalletId) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.fromWalletId === formData.toWalletId) {
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
      fromWalletId: formData.fromWalletId,
      toWalletId: formData.toWalletId,
      fee: parseFloat(formData.fee) || 0,
    });
    
    // Reset form
    setFormData({
      amount: '',
      description: 'Transfer',
      date: new Date().toISOString().split('T')[0],
      fromWalletId: '',
      toWalletId: '',
      fee: '0.5',
    });
    
    // Show success message
    toast({
      title: 'Success',
      description: 'Transfer completed successfully',
    });
    
    // Close dialog
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Money</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="fromWalletId">From Account</Label>
            <Select
              value={formData.fromWalletId}
              onValueChange={(value) => setFormData({ ...formData, fromWalletId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source account" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem 
                    key={wallet.id} 
                    value={wallet.id}
                    disabled={wallet.id === formData.toWalletId}
                  >
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="toWalletId">To Account</Label>
            <Select
              value={formData.toWalletId}
              onValueChange={(value) => setFormData({ ...formData, toWalletId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination account" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem 
                    key={wallet.id} 
                    value={wallet.id}
                    disabled={wallet.id === formData.fromWalletId}
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
            <Label htmlFor="fee">Admin Fee</Label>
            <Input
              id="fee"
              name="fee"
              type="number"
              step="0.01"
              placeholder="0.50"
              value={formData.fee}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="Enter description"
              value={formData.description}
              onChange={handleChange}
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
            Complete Transfer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransferForm; 