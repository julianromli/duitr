import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';

interface TransferFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TransferForm: React.FC<TransferFormProps> = ({ open, onOpenChange }) => {
  const { wallets, addTransfer } = useFinance();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    fromWalletId: '',
    toWalletId: '',
    fee: '0',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      toast({
        title: 'Error',
        description: 'Please select a date',
        variant: 'destructive',
      });
      return;
    }
    
    // Validation
    if (!formData.amount || !formData.fromWalletId || !formData.toWalletId) {
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
        description: 'Source and destination accounts cannot be the same',
        variant: 'destructive',
      });
      return;
    }
    
    // Format date to ISO string
    const dateString = selectedDate.toISOString().split('T')[0];
    
    // Add transfer
    addTransfer({
      amount: parseFloat(formData.amount),
      description: formData.description || 'Transfer',
      date: dateString,
      fromWalletId: formData.fromWalletId,
      toWalletId: formData.toWalletId,
      fee: parseFloat(formData.fee) || 0,
    });
    
    // Reset form
    setFormData({
      amount: '',
      description: '',
      fromWalletId: '',
      toWalletId: '',
      fee: '0',
    });
    setSelectedDate(new Date());
    
    // Show success message
    toast({
      title: 'Success',
      description: 'Transfer added successfully',
    });
    
    // Close dialog
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1A1A] border-0 text-white">
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle className="text-xl font-bold">Add Transfer</DialogTitle>
          <DialogClose className="rounded-full hover:bg-[#333] text-[#868686] hover:text-white">
            <X size={16} />
          </DialogClose>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="fromWalletId" className="text-[#868686]">From Account</Label>
            <Select
              value={formData.fromWalletId}
              onValueChange={(value) => setFormData({ ...formData, fromWalletId: value })}
            >
              <SelectTrigger className="bg-[#242425] border-0 text-white">
                <SelectValue placeholder="Select source account" />
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
            <Label htmlFor="toWalletId" className="text-[#868686]">To Account</Label>
            <Select
              value={formData.toWalletId}
              onValueChange={(value) => setFormData({ ...formData, toWalletId: value })}
            >
              <SelectTrigger className="bg-[#242425] border-0 text-white">
                <SelectValue placeholder="Select destination account" />
              </SelectTrigger>
              <SelectContent className="bg-[#242425] border-0 text-white">
                {wallets.map((wallet) => (
                  <SelectItem 
                    key={wallet.id} 
                    value={wallet.id}
                    disabled={wallet.id === formData.fromWalletId}
                    className="hover:bg-[#333] focus:bg-[#333]"
                  >
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
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
            <Label htmlFor="fee" className="text-[#868686]">Fee (if any)</Label>
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
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[#868686]">Description (optional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="Enter description"
              value={formData.description}
              onChange={handleChange}
              className="bg-[#242425] border-0 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-[#868686]">Date</Label>
            <DatePicker 
              date={selectedDate}
              setDate={setSelectedDate}
            />
          </div>
          
          <Button type="submit" className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#B0E018] font-semibold border-0">
            Add Transfer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransferForm; 