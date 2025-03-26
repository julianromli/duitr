
import React from 'react';
import { Wallet, CreditCard, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useWallets } from '@/hooks/useWallets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const WalletList: React.FC = () => {
  const { wallets, totalBalance } = useWallets();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
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

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-card rounded-xl p-4 shadow-sm border">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Total Balance</h2>
        </div>
        <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
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
                <div className="text-sm px-2 py-1 rounded-full bg-muted">
                  {wallet.type.charAt(0).toUpperCase() + wallet.type.slice(1)}
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
                        wallet.transactions
                          ?.filter(t => t.type === 'income')
                          .reduce((sum, t) => sum + t.amount, 0) || 0
                      )}
                    </p>
                  </div>
                  
                  <div className="space-y-0.5">
                    <div className="flex items-center text-xs text-finance-expense">
                      <ArrowDownRight className="w-3 h-3 mr-1" /> Expenses
                    </div>
                    <p className="text-sm font-medium">
                      {formatCurrency(
                        wallet.transactions
                          ?.filter(t => t.type === 'expense')
                          .reduce((sum, t) => sum + t.amount, 0) || 0
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WalletList;
