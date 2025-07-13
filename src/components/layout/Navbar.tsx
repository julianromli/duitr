
// Component: Navbar
// Description: Bottom navigation bar with limelight effect and 7 main navigation items
// Updated to use LimelightNav component with green accent color

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CreditCard, Wallet, BarChart3, PieChart, User } from 'lucide-react';
import { LimelightNav, NavItem } from '@/components/ui/limelight-nav';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { id: 'home', icon: <Home />, label: 'Home', onClick: () => navigate('/') },
    { id: 'transactions', icon: <CreditCard />, label: 'Transactions', onClick: () => navigate('/transactions') },
    { id: 'wallets', icon: <Wallet />, label: 'Wallets', onClick: () => navigate('/wallets') },
    { id: 'statistics', icon: <BarChart3 />, label: 'Statistics', onClick: () => navigate('/statistics') },
    { id: 'budget', icon: <PieChart />, label: 'Budget', onClick: () => navigate('/budget') },
    { id: 'profile', icon: <User />, label: 'Profile', onClick: () => navigate('/profile') },
  ];

  const pathToIndex = {
    '/': 0,
    '/transactions': 1,
    '/wallets': 2,
    '/statistics': 3,
    '/budget': 4,
    '/profile': 5,
  };

  const activeIndex = pathToIndex[location.pathname as keyof typeof pathToIndex] ?? 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0D0D0D] border-t border-gray-800 z-50">
      <div className="max-w-md mx-auto flex justify-center py-3">
        <LimelightNav
          key={location.pathname}
          items={navItems}
          defaultActiveIndex={activeIndex}
          className="bg-[#0D0D0D]/90 backdrop-blur-sm border-gray-800"
          limelightClassName="bg-green-500 shadow-[0_50px_15px_rgb(34_197_94)]"
          iconClassName="text-gray-400 hover:text-gray-300"
        />
      </div>
    </nav>
  );
};

export default Navbar;
