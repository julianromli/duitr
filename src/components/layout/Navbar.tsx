
// Component: Navbar
// Description: Bottom navigation bar with spotlight effect and 7 main navigation items
// Updated to use spotlight design with green accent color

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CreditCard, Wallet, BarChart3, PieChart, User, Sparkles } from 'lucide-react';

interface NavItemProps {
  icon: React.ElementType;
  isActive?: boolean;
  onClick?: () => void;
  indicatorPosition: number;
  position: number;
}

const NavItem: React.FC<NavItemProps> = ({ 
  icon: Icon, 
  isActive = false, 
  onClick,
  indicatorPosition,
  position
}) => {
  const distance = Math.abs(indicatorPosition - position);
  const spotlightOpacity = isActive ? 1 : Math.max(0, 1 - distance * 0.6);

  return (
    <button
      className="relative flex items-center justify-center w-12 h-12 mx-1 transition-all duration-400"
      onClick={onClick}
    >
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-24 bg-gradient-to-b from-[#C6FE1E]/40 to-transparent blur-lg rounded-full transition-opacity duration-400"
        style={{
          opacity: spotlightOpacity,
          transitionDelay: isActive ? '0.1s' : '0s',
        }}
      />
      <Icon
        className={`w-6 h-6 transition-colors duration-200 ${
          isActive ? 'text-[#C6FE1E]' : 'text-gray-400 hover:text-gray-300'
        }`}
        strokeWidth={isActive ? 2.5 : 2}
      />
    </button>
  );
};

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

  const activeIndex = navItems.findIndex(item => item.path === location.pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0D0D0D] border-t border-gray-800 z-50">
      <div className="max-w-md mx-auto">
        <div className="relative flex items-center justify-center px-2 py-3 bg-[#0D0D0D]/90 backdrop-blur-sm">
          <div 
            className="absolute top-0 h-[2px] bg-[#C6FE1E] transition-all duration-400 ease-in-out"
            style={{
              left: `${activeIndex >= 0 ? activeIndex * 56 + 12 : 0}px`,
              width: '48px',
              transform: 'translateY(-1px)',
              opacity: activeIndex >= 0 ? 1 : 0,
            }}
          />
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <NavItem
                key={item.path}
                icon={Icon}
                isActive={isActive}
                onClick={() => navigate(item.path)}
                indicatorPosition={activeIndex >= 0 ? activeIndex : 0}
                position={index}
              />
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
