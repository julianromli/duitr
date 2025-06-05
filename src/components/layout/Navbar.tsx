
// Fixed issue with navbar not showing properly on all pages
// Added AI Evaluation page to navigation

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CreditCard, Wallet, PieChart, User, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navItems = [
    { path: '/', icon: Home, label: t('nav.home') },
    { path: '/transactions', icon: CreditCard, label: t('nav.transactions') },
    { path: '/ai', icon: Sparkles, label: 'AI' },
    { path: '/budget', icon: PieChart, label: t('nav.budget') },
    { path: '/profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0D0D0D] border-t border-gray-800 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-center py-2 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px] ${
                  isActive 
                    ? 'text-[#C6FE1E] bg-gray-800/50' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
