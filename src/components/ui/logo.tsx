import React, { useEffect, useState } from 'react';

interface LogoProps {
  size?: number | string;
  className?: string;
  variant?: 'default' | 'square' | 'circle' | 'text-only';
  color?: string;
  bgColor?: string;
}

/**
 * Logo komponen yang konsisten untuk digunakan di seluruh aplikasi
 * Menggunakan file SVG utama dari /duitr-logo.svg
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
  variant = 'default',
  color,
  bgColor
}: LogoProps) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  
  useEffect(() => {
    // Coba dapatkan logo dari window.duitrLogo jika tersedia
    if (window.duitrLogo && window.duitrLogo.load) {
      window.duitrLogo.load().then(setSvgContent);
    } else {
      // Fallback: load langsung dari file
      fetch('/duitr-logo.svg')
        .then(response => response.text())
        .then(svg => setSvgContent(svg))
        .catch(error => {
          console.error('Error loading logo:', error);
          // Fallback to inline SVG
          setSvgContent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <rect width="100" height="100" rx="28" fill="${bgColor || '#C6FE1E'}" />
            <text x="50" y="68" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="60" fill="${color || '#000000'}">D</text>
          </svg>`);
        });
    }
  }, [bgColor, color]);
  
  // Styling berdasarkan variant
  const getContainerStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: typeof size === 'number' ? `${size}px` : size,
      height: typeof size === 'number' ? `${size}px` : size,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
    
    if (variant === 'square') {
      return {
        ...baseStyle,
        borderRadius: '8px',
        overflow: 'hidden',
      };
    }
    
    if (variant === 'circle') {
      return {
        ...baseStyle,
        borderRadius: '50%',
        overflow: 'hidden',
      };
    }
    
    return baseStyle;
  };
  
  const containerStyle = getContainerStyle();
  
  // Jika belum ada SVG, tampilkan placeholder
  if (!svgContent) {
    return (
      <div 
        className={`duitr-logo ${className}`}
        style={containerStyle}
      >
        <div style={{ 
          width: '100%', 
          height: '100%', 
          backgroundColor: bgColor || '#C6FE1E',
          borderRadius: variant === 'default' ? '28%' : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: typeof size === 'number' ? `${size * 0.6}px` : '24px',
          fontWeight: 'bold',
          color: color || '#000000'
        }}>
          D
        </div>
      </div>
    );
  }
  
  // Untuk variant text-only, hanya tampilkan teks D
  if (variant === 'text-only') {
    return (
      <div 
        className={`duitr-logo duitr-logo-text ${className}`}
        style={{
          display: 'inline-flex',
          fontSize: typeof size === 'number' ? `${size}px` : size,
          fontWeight: 'bold',
          color: color || '#000'
        }}
      >
        D
      </div>
    );
  }
  
  // Untuk variant lainnya, gunakan SVG
  return (
    <div 
      className={`duitr-logo ${className}`} 
      style={containerStyle}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
});

// Tambahkan type declaration untuk window.duitrLogo
declare global {
  interface Window {
    duitrLogo?: {
      load: () => Promise<string>;
      inject: (svgString: string) => void;
    };
  }
}

export default Logo; 