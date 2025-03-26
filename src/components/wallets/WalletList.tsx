import React, { useState } from 'react';
import { Wallet, CreditCard, DollarSign, ArrowUpRight, ArrowDownRight, Edit, Trash } from 'lucide-react';
import { useWallets } from '@/hooks/useWallets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const WalletList: React.FC = () => {
  const { wallets, walletStats } = useWallets();
  const { updateWallet, deleteWallet, formatCurrency } = useFinance();
  const { toast } = useToast();
  const [editWallet, setEditWallet] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
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
  
  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <DollarSign className="w-5 h-5" />;
      case 'credit':
        return <CreditCard className="w-5 h-5" />;
      case 'cash':
        return <DollarSign className="w-5 h-5" />;
      case 'investment':
        return <ArrowUpRight className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  const handleEditWallet = (wallet: any) => {
    setEditWallet({
      ...wallet,
      balance: wallet.balance.toString(),
    });
    setIsEditOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditWallet({ ...editWallet, [name]: value });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!editWallet.name || !editWallet.balance || !editWallet.type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Update wallet
    updateWallet({
      ...editWallet,
      balance: parseFloat(editWallet.balance),
    });
    
    // Show success message
    toast({
      title: "Success",
      description: "Account updated successfully",
    });
    
    // Close dialog
    setIsEditOpen(false);
  };

  const handleDeleteWallet = (id: string) => {
    deleteWallet(id);
    toast({
      title: "Success",
      description: "Account deleted successfully",
    });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-card rounded-xl p-4 shadow-sm border">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Total Balance</h2>
        </div>
        <p className="text-3xl font-bold">{formatCurrency(walletStats.totalBalance)}</p>
        <p className="text-sm text-muted-foreground mt-1">Across all accounts</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {wallets.map((wallet) => (
          <Card key={wallet.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center" 
                    style={{ backgroundColor: `${wallet.color}20`, color: wallet.color }}
                  >
                    {getWalletIcon(wallet.type)}
                  </div>
                  <CardTitle className="text-base">{wallet.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm px-2 py-1 rounded-full bg-muted">
                    {wallet.type.charAt(0).toUpperCase() + wallet.type.slice(1)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditWallet(wallet)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteWallet(wallet.id)}
                        className="text-destructive"
                      >
                        <Trash className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="pt-2">
                <p 
                  className={cn(
                    "text-2xl font-bold",
                    wallet.balance < 0 ? "text-finance-expense" : ""
                  )}
                >
                  {formatCurrency(wallet.balance)}
                </p>
                
                <div className="flex mt-4 gap-6">
                  <div className="space-y-0.5">
                    <div className="flex items-center text-xs text-finance-income">
                      <ArrowUpRight className="w-3 h-3 mr-1" /> Income
                    </div>
                    <p className="text-sm font-medium">
                      {formatCurrency(
                        walletStats.walletTransactions
                          .find(w => w.id === wallet.id)?.income || 0
                      )}
                    </p>
                  </div>
                  
                  <div className="space-y-0.5">
                    <div className="flex items-center text-xs text-finance-expense">
                      <ArrowDownRight className="w-3 h-3 mr-1" /> Expenses
                    </div>
                    <p className="text-sm font-medium">
                      {formatCurrency(
                        walletStats.walletTransactions
                          .find(w => w.id === wallet.id)?.expense || 0
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Wallet Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          {editWallet && (
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Account Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Main Bank Account"
                  value={editWallet.name}
                  onChange={handleEditChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="balance">Balance</Label>
                <Input
                  id="balance"
                  name="balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editWallet.balance}
                  onChange={handleEditChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Account Type</Label>
                <Select 
                  value={editWallet.type} 
                  onValueChange={(value) => setEditWallet({ ...editWallet, type: value })}
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
                  value={editWallet.color} 
                  onValueChange={(value) => setEditWallet({ ...editWallet, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: editWallet.color }} 
                        />
                        <span>
                          {colors.find(c => c.value === editWallet.color)?.label || 'Select color'}
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
              
              <Button type="submit" className="w-full">Update Account</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletList;
