import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import WalletList from '@/components/wallets/WalletList';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/hooks/use-toast';

const Wallets: React.FC = () => {
  const { addWallet } = useFinance();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    balance: '',
    type: '',
    color: '#4263EB',
  });

  const walletTypes = [
    { value: 'bank', label: 'Bank Account' },
    { value: 'cash', label: 'Cash' },
    { value: 'credit', label: 'Credit Card' },
    { value: 'investment', label: 'Investment' },
  ];

  const colors = [
    { value: '#4263EB', label: 'Blue' },
    { value: '#0CA678', label: 'Green' },
    { value: '#F59F00', label: 'Yellow' },
    { value: '#FA5252', label: 'Red' },
    { value: '#9775FA', label: 'Purple' },
    { value: '#FD7E14', label: 'Orange' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.balance || !formData.type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Add wallet
    addWallet({
      name: formData.name,
      balance: parseFloat(formData.balance),
      type: formData.type as 'cash' | 'bank' | 'credit' | 'investment',
      color: formData.color,
    });
    
    // Reset form
    setFormData({
      name: '',
      balance: '',
      type: '',
      color: '#4263EB',
    });
    
    // Show success message
    toast({
      title: "Success",
      description: "Account added successfully",
    });
    
    // Close dialog
    setOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Accounts & Wallets</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <PlusCircle className="w-4 h-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Account</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Account Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g. Main Bank Account"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="balance">Starting Balance</Label>
                  <Input
                    id="balance"
                    name="balance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.balance}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Account Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      {walletTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="color">Account Color</Label>
                  <Select 
                    value={formData.color} 
                    onValueChange={(value) => setFormData({ ...formData, color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select color">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: formData.color }} 
                          />
                          <span>
                            {colors.find(c => c.value === formData.color)?.label || 'Select color'}
                          </span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
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
                
                <Button type="submit" className="w-full">Add Account</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <WalletList />
      </div>
    </div>
  );
};

export default Wallets;
