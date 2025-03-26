import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Receipt, PieChart, Wallet, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  
  const navItems = [
    { name: t('navbar.dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('navbar.transactions'), path: '/transactions', icon: Receipt },
    { name: t('navbar.budgets'), path: '/budgets', icon: PieChart },
    { name: t('navbar.wallets'), path: '/wallets', icon: Wallet },
    { name: t('navbar.settings'), path: '/settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:relative md:h-screen md:w-64 border-r border-t md:border-t-0 bg-background/95 backdrop-blur-sm z-20 animate-fade-in">
      <div className="hidden md:flex h-16 lg:h-16 items-center px-6 border-b">
        <div className="flex items-center gap-2 mx-auto md:mx-0">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="font-semibold text-white">F</span>
          </div>
          <span className="font-semibold tracking-tight hidden md:inline-block">{t('common.app_name')}</span>
        </div>
      </div>
      
      <div className="flex md:flex-col md:h-[calc(100vh-4rem)] md:justify-between">
        <ul className="flex justify-around p-2 w-full md:flex-col md:space-y-1 md:p-4 md:pt-6">
          {navItems.map((item) => (
            <li key={item.name} className="md:w-full">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col md:flex-row items-center md:gap-3 p-2 md:py-2.5 rounded-md transition-colors duration-200",
                    "text-muted-foreground hover:text-foreground",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-secondary/50"
                  )
                }
                title={item.name}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1 hidden md:block md:text-sm md:mt-0">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        
        <div className="hidden md:block p-4 mt-auto">
          <div className="flex flex-col space-y-1">
            <button className="flex items-center gap-3 p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary/50 transition-colors duration-200">
              <Settings className="h-5 w-5" />
              <span className="text-sm">{t('navbar.settings')}</span>
            </button>
            <button className="flex items-center gap-3 p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary/50 transition-colors duration-200">
              <LogOut className="h-5 w-5" />
              <span className="text-sm">{t('navbar.logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
