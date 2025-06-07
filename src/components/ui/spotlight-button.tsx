
import React, { useState } from 'react';
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

export const SpotlightNavbar = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const navItems = [
    { icon: Home, label: 'Home' },
    { icon: CreditCard, label: 'Transactions' },
    { icon: Wallet, label: 'Wallets' },
    { icon: BarChart3, label: 'Statistics' },
    { icon: PieChart, label: 'Budget' },
    { icon: Sparkles, label: 'AI' },
    { icon: User, label: 'Profile' },
  ];

  return (
    <nav className="relative flex items-center justify-center px-2 py-3 bg-[#0D0D0D]/90 backdrop-blur-sm rounded-md shadow-lg border border-white/10">
      <div 
        className="absolute top-0 h-[2px] bg-[#C6FE1E] transition-all duration-400 ease-in-out"
        style={{
          left: `${activeIndex * 56 + 12}px`,
          width: '48px',
          transform: 'translateY(-1px)',
        }}
      />
      {navItems.map((item, index) => (
        <NavItem
          key={item.label}
          icon={item.icon}
          isActive={activeIndex === index}
          onClick={() => setActiveIndex(index)}
          indicatorPosition={activeIndex}
          position={index}
        />
      ))}
    </nav>
  );
};

export const Component = SpotlightNavbar;
