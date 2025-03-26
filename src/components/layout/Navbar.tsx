import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Receipt, PieChart, Wallet, Settings, User, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  
  const navItems = [
    { name: t('navbar.dashboard'), path: '/', icon: Home },
    { name: t('navbar.transactions'), path: '/transactions', icon: Receipt },
    { name: t('navbar.statistics'), path: '/statistics', icon: PieChart },
    { name: t('navbar.card'), path: '/wallets', icon: CreditCard },
    { name: t('navbar.profile'), path: '/settings', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-20 animate-fade-in">
      <div className="flex justify-around items-center p-2 max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center py-2 px-6 rounded-md transition-colors duration-200",
                isActive
                  ? "text-[#7B61FF]"
                  : "text-gray-400"
              )
            }
            title={item.name}
          >
            <item.icon className="h-6 w-6" />
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
