
import React from 'react';
import { useLocation } from 'react-router-dom';
import { BellIcon, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const location = useLocation();
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/transactions':
        return 'Transactions';
      case '/budgets':
        return 'Budgets';
      case '/wallets':
        return 'Wallets';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="px-6 py-4 flex items-center justify-between border-b animate-fade-in">
      <h1 className="text-2xl font-semibold tracking-tight">
        {getPageTitle()}
      </h1>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:flex">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search..."
            className="w-64 rounded-full bg-secondary/50 pl-8 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
