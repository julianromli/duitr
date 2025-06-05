
// Component: Navbar
// Description: Bottom navigation bar with 7 main navigation items
// Fixed missing Statistics page and updated to proper order:
// 1. Home, 2. Transactions, 3. Wallets, 4. Statistics, 5. Budget, 6. AI, 7. Profile

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CreditCard, Wallet, BarChart3, PieChart, User, Sparkles } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: Home },
    { path: '/transactions', icon: CreditCard },
    { path: '/wallets', icon: Wallet },
    { path: '/statistics', icon: BarChart3 },
    { path: '/budget', icon: PieChart },
    { path: '/ai', icon: Sparkles },
    { path: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0D0D0D] border-t border-gray-800 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-center py-3 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'text-[#C6FE1E] bg-gray-800/50' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon size={24} />
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
