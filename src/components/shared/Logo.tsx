import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/ui/logo';

interface AppLogoProps {
  withText?: boolean;
  size?: number | string;
  className?: string;
  linkTo?: string;
  textClassName?: string;
  variant?: 'default' | 'square' | 'circle' | 'text-only';
}

/**
 * Komponen AppLogo yang dapat dikonfigurasi
 * Digunakan di header, splash screen, dan tempat lain yang membutuhkan logo
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  withText = true,
  size = 32,
  className = '',
  linkTo = '/',
  textClassName = '',
  variant = 'default'
}) => {
  const logoComponent = (
    <div className={`flex items-center ${className}`}>
      <Logo size={size} variant={variant} />
      {withText && (
        <span className={`font-bold text-xl ml-2 ${textClassName}`}>
          Duitr
        </span>
      )}
    </div>
  );

  // Jika linkTo disediakan, bungkus dalam komponen Link
  if (linkTo) {
    return <Link to={linkTo}>{logoComponent}</Link>;
  }

  return logoComponent;
};

export default AppLogo; 