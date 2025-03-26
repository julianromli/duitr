
import React from 'react';
import Header from '@/components/layout/Header';
import WalletList from '@/components/wallets/WalletList';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Wallets: React.FC = () => {
  return (
    <div className="flex flex-col h-full animate-in">
      <Header />
      <div className="flex-1 p-6 pb-24 md:pb-6 space-y-6 overflow-auto fade-mask">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Accounts & Wallets</h2>
          <Button className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Add Account
          </Button>
        </div>
        
        <WalletList />
      </div>
    </div>
  );
};

export default Wallets;
