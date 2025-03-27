import React, { useState } from 'react';
import { ChevronLeft, PlusCircle, CreditCard, Wallet, Landmark, TrendingUp } from 'lucide-react';
import WalletList from '@/components/wallets/WalletList';
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Wallets: React.FC = () => {
  const { addWallet } = useFinance();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    balance: '',
    type: '',
    color: '#1364FF',
  });

  const walletTypes = [
    { value: 'bank', label: 'Bank Account', icon: Landmark },
    { value: 'cash', label: 'Cash', icon: Wallet },
    { value: 'e-wallet', label: 'E-Wallet', icon: CreditCard },
    { value: 'investment', label: 'Investment', icon: TrendingUp },
  ];

  const colors = [
    { value: '#1364FF', label: 'Blue' },
    { value: '#C6FE1E', label: 'Green' },
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
      type: formData.type as 'cash' | 'bank' | 'e-wallet' | 'investment',
      color: formData.color,
    });
    
    // Reset form
    setFormData({
      name: '',
      balance: '',
      type: '',
      color: '#1364FF',
    });
    
    // Show success message
    toast({
      title: "Success",
      description: "Account added successfully",
    });
    
    // Close dialog
    setOpen(false);
  };

  // Animation variants
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
    <motion.div 
      className="max-w-md mx-auto bg-[#0D0D0D] min-h-screen pb-24 text-white"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="p-6 pt-12">
        {/* Header with back button */}
        <motion.div 
          className="flex items-center justify-between mb-6"
          variants={itemVariants}
        >
          <div className="flex items-center">
            <button onClick={() => navigate('/')} className="mr-4">
              <ChevronLeft size={24} className="text-white" />
            </button>
            <h1 className="text-xl font-bold">Accounts & Wallets</h1>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#C6FE1E] hover:bg-[#B0E018] text-[#0D0D0D] rounded-full h-10 w-10 p-0 flex items-center justify-center">
                <PlusCircle size={20} />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#1A1A1A] border-none text-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white">Add Account</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#868686]">Account Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g. Main Bank Account"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="bg-[#242425] border-none text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="balance" className="text-[#868686]">Starting Balance</Label>
                  <Input
                    id="balance"
                    name="balance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.balance}
                    onChange={handleChange}
                    required
                    className="bg-[#242425] border-none text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-[#868686]">Account Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger className="bg-[#242425] border-none text-white">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#242425] border-none text-white">
                      {walletTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="flex items-center">
                          <div className="flex items-center gap-2">
                            <type.icon size={16} className="text-[#868686]" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="color" className="text-[#868686]">Account Color</Label>
                  <Select 
                    value={formData.color} 
                    onValueChange={(value) => setFormData({ ...formData, color: value })}
                  >
                    <SelectTrigger className="bg-[#242425] border-none text-white">
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
                    <SelectContent className="bg-[#242425] border-none text-white">
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
                
                <Button 
                  type="submit" 
                  className="w-full bg-[#C6FE1E] hover:bg-[#B0E018] text-[#0D0D0D] mt-4 font-medium rounded-xl"
                >
                  Add Account
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>
        
        <WalletList />
      </div>
    </motion.div>
  );
};

export default Wallets;
