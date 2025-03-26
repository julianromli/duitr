import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Header: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return t('navbar.dashboard');
      case '/transactions':
        return t('navbar.transactions');
      case '/budgets':
        return t('navbar.budgets');
      case '/wallets':
        return t('navbar.wallets');
      case '/settings':
        return t('navbar.settings');
      default:
        return t('navbar.dashboard');
    }
  };

  return (
    <header className="px-6 py-4 flex items-center justify-between border-b animate-fade-in">
      <h1 className="text-2xl font-semibold tracking-tight md:block">
        {getPageTitle()}
      </h1>
    </header>
  );
};

export default Header;
