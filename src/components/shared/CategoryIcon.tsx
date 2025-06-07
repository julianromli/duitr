import React from 'react';
import { 
  ShoppingCart, 
  Utensils, 
  Car, 
  Home, 
  Briefcase, 
  DollarSign,
  Gift, 
  Package, 
  Heart, 
  Plane, 
  Music, 
  Book, 
  ArrowLeftRight,
  LineChart,
  ShoppingBag,
  Zap,
  User,
  Pill,
  Baby,
  Coins,
  Building2,
  Wallet,
  Circle,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Briefcase,
  DollarSign,
  Gift,
  Package,
  Heart,
  Plane,
  Music,
  Book,
  ArrowLeftRight,
  LineChart,
  ShoppingBag,
  Zap,
  User,
  Pill,
  Baby,
  Coins,
  Building2,
  Wallet,
  Circle,
  HelpCircle,
};

// Category icon mappings based on category IDs and names
const categoryIconMap: Record<string, keyof typeof iconMap> = {
  // By category ID (number as string)
  '1': 'Utensils',          // Food & Beverage
  '2': 'Car',               // Transportation
  '3': 'ShoppingCart',      // Shopping
  '4': 'Heart',             // Health & Fitness
  '5': 'Plane',             // Travel
  '6': 'Music',             // Entertainment
  '7': 'Gift',              // Gift & Donation
  '8': 'Book',              // Education
  '9': 'Briefcase',         // Business
  '10': 'Home',             // Bills & Utilities
  '11': 'Coins',            // Investment
  '12': 'Building2',        // Other
  '13': 'DollarSign',       // Salary
  '14': 'Briefcase',        // Freelance
  '15': 'LineChart',        // Investment Income
  '16': 'Gift',             // Bonus
  '17': 'Building2',        // Other Income
  
  // By category name (case-insensitive mapping)
  'food': 'Utensils',
  'beverage': 'Utensils',
  'transportation': 'Car',
  'shopping': 'ShoppingCart',
  'health': 'Heart',
  'fitness': 'Heart',
  'travel': 'Plane',
  'entertainment': 'Music',
  'gift': 'Gift',
  'donation': 'Gift',
  'education': 'Book',
  'business': 'Briefcase',
  'bills': 'Home',
  'utilities': 'Home',
  'investment': 'LineChart',
  'investasi': 'LineChart',
  'salary': 'DollarSign',
  'freelance': 'Briefcase',
  'bonus': 'Gift',
  'transfer': 'ArrowLeftRight',
  'other': 'Circle',
};

interface CategoryIconProps {
  category: string | number | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  category, 
  size = 'md', 
  className 
}) => {
  const getIconComponent = () => {
    if (!category) {
      return HelpCircle;
    }

    const categoryStr = String(category).toLowerCase();
    
    // Check by exact category ID first
    if (categoryIconMap[String(category)]) {
      return iconMap[categoryIconMap[String(category)]];
    }
    
    // Check by category name
    const iconName = categoryIconMap[categoryStr];
    if (iconName && iconMap[iconName]) {
      return iconMap[iconName];
    }
    
    // Special cases for common category patterns
    if (categoryStr.includes('food') || categoryStr.includes('makan')) {
      return Utensils;
    }
    if (categoryStr.includes('transport') || categoryStr.includes('travel')) {
      return Car;
    }
    if (categoryStr.includes('shop') || categoryStr.includes('belanja')) {
      return ShoppingCart;
    }
    if (categoryStr.includes('health') || categoryStr.includes('kesehatan')) {
      return Heart;
    }
    if (categoryStr.includes('invest') || categoryStr.includes('saham')) {
      return LineChart;
    }
    if (categoryStr.includes('transfer')) {
      return ArrowLeftRight;
    }
    if (categoryStr.includes('salary') || categoryStr.includes('gaji')) {
      return DollarSign;
    }
    if (categoryStr.includes('bonus') || categoryStr.includes('gift')) {
      return Gift;
    }
    
    // Default fallback
    return HelpCircle;
  };

  const IconComponent = getIconComponent();
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
  };

  return (
    <IconComponent 
      className={cn(
        sizeClasses[size],
        'text-current',
        className
      )}
    />
  );
};

export default CategoryIcon;
