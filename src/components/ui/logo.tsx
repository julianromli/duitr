import React from 'react';

interface LogoProps {
  size?: number | string;
  className?: string;
  variant?: 'default' | 'square' | 'circle' | 'text-only';
  color?: string;
  bgColor?: string;
}

/**
 * Logo komponen yang konsisten untuk digunakan di seluruh aplikasi
 * Sekarang menggunakan file PNG dari /public/pwa-icons/new/
 * 
 * Komponen ini adalah bagian dasar dari sistem branding Duitr
 * Untuk mengubah tampilan logo di seluruh aplikasi, cukup edit file:
 * 1. /public/duitr-logo.svg - Logo utama dalam format SVG
 * 2. Kemudian gunakan /public/logo-generator.html untuk menghasilkan semua aset logo
 */
// eslint-disable-next-line react/display-name
export const Logo = React.memo(({ 
  size = 40, 
  className = '', 
}: LogoProps) => {
  // Styling dasar untuk container img
  const containerStyle: React.CSSProperties = {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    display: 'inline-block',
  };

  // Langsung render tag img
  return (
    <img 
      src="/pwa-icons/new/192.png"
      alt="Duitr Logo" 
      style={containerStyle} 
      className={className}
    />
  );
});

export default Logo; 