import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { getLocalizedCategoryName } from '@/utils/categoryUtils';
import { getCategoryById } from '@/services/categoryService';
import {
  Home,
  Coffee,
  Car,
  ShoppingCart,
  Briefcase,
  DollarSign,
  Gift,
  Utensils,
  Package,
  Heart,
  Plane,
  Film,
  Settings,
  Book,
  Monitor,
  Smartphone,
  CreditCard,
  ArrowLeftRight,
  HelpCircle,
  ShoppingBag,
  Zap,
  User,
  Gift as GiftIcon,
  Wallet
} from 'lucide-react';

interface CategoryIconProps {
  category: string;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  category, 
  size = 'md',
  animate = true
}) => {
  const [displayName, setDisplayName] = useState<string>(category || 'Other');
  const { i18n } = useTranslation();
  
  useEffect(() => {
    const loadCategory = async () => {
      // Check if it's a UUID
      if (category && category.includes('-')) {
        try {
          // Get the category from the database
          const categoryData = await getCategoryById(category);
          if (categoryData) {
            setDisplayName(i18n.language === 'id' ? categoryData.id_name : categoryData.en_name);
            return;
          }
        } catch (err) {
          console.error('Error loading category:', err);
        }
      }
      
      // For legacy string ID categories or fallback
      const loadedName = await getLocalizedCategoryName(category, i18next);
      setDisplayName(loadedName);
    };
    
    loadCategory();
  }, [category, i18n.language]);

  // Convert category name to lowercase for consistent matching
  const categoryLower = displayName.toLowerCase();

  // For category IDs like "expense_groceries", extract the actual category name
  let categoryName = categoryLower;
  if (category && typeof category === 'string' && category.includes('_')) {
    const parts = category.split('_');
    if (parts.length > 1) {
      categoryName = parts[1].toLowerCase();
    }
  }

  // Define size classes
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  const iconClasses = `${iconSizes[size]} rounded-full flex items-center justify-center`;

  // Define icon mapping
  const getIconDetails = () => {
    // Check both categoryLower and extracted categoryName for better matching
    
    // Housing/Home
    if (categoryName.includes('housing') || categoryName.includes('rent') || categoryLower.includes('perumahan')) {
      return { 
        icon: <Home className="text-white" />,
        bgColor: 'bg-orange-500'
      };
    }
    // Dining/Food
    else if (categoryName.includes('dining') || categoryName.includes('food') || categoryLower.includes('makan')) {
      return { 
        icon: <Utensils className="text-white" />,
        bgColor: 'bg-red-500'
      };
    }
    // Transport
    else if (categoryName.includes('transport')) {
      return { 
        icon: <Car className="text-white" />,
        bgColor: 'bg-indigo-500'
      };
    }
    // Groceries/Household
    else if (categoryName.includes('groceries') || categoryLower.includes('kebutuhan rumah') || categoryLower.includes('rumah tangga')) {
      return { 
        icon: <Package className="text-white" />,
        bgColor: 'bg-yellow-500'
      };
    }
    // Subscription/Utilities
    else if (categoryName.includes('utilities') || categoryName.includes('subscription') || categoryLower.includes('berlangganan')) {
      return { 
        icon: <Zap className="text-white" />,
        bgColor: 'bg-yellow-300'
      };
    }
    // Entertainment
    else if (categoryName.includes('entertain') || categoryLower.includes('hiburan')) {
      return { 
        icon: <Film className="text-white" />,
        bgColor: 'bg-purple-500'
      };
    }
    // Shopping
    else if (categoryName.includes('shop') || categoryLower.includes('belanja')) {
      return { 
        icon: <ShoppingBag className="text-white" />,
        bgColor: 'bg-blue-400'
      };
    }
    // Health
    else if (categoryName.includes('health') || categoryLower.includes('kesehatan')) {
      return { 
        icon: <Heart className="text-white" />,
        bgColor: 'bg-pink-500'
      };
    }
    // Education
    else if (categoryName.includes('education') || categoryName.includes('edu') || categoryLower.includes('pendidikan')) {
      return { 
        icon: <Book className="text-white" />,
        bgColor: 'bg-green-500'
      };
    }
    // Personal
    else if (categoryName.includes('personal') || categoryLower.includes('pribadi')) {
      return { 
        icon: <User className="text-white" />,
        bgColor: 'bg-violet-600'
      };
    }
    // Travel
    else if (categoryName.includes('travel') || categoryLower.includes('perjalanan')) {
      return { 
        icon: <Plane className="text-white" />,
        bgColor: 'bg-blue-500'
      };
    }
    // Gifts
    else if (categoryName.includes('gift') || categoryLower.includes('hadiah')) {
      return { 
        icon: <GiftIcon className="text-white" />,
        bgColor: 'bg-red-400'
      };
    }
    // Salary/Income
    else if (categoryName.includes('salary') || categoryName.includes('income') || categoryLower.includes('gaji') || categoryLower.includes('pendapatan')) {
      return { 
        icon: <Briefcase className="text-white" />,
        bgColor: 'bg-green-600'
      };
    }
    // Business
    else if (categoryName.includes('business') || categoryLower.includes('bisnis')) {
      return { 
        icon: <DollarSign className="text-white" />,
        bgColor: 'bg-amber-600'
      };
    }
    // Transfer
    else if (categoryName.includes('transfer') || categoryLower.includes('transfer')) {
      return { 
        icon: <ArrowLeftRight className="text-white" />,
        bgColor: 'bg-slate-500'
      };
    }
    // Default fallback
    else {
      return { 
        icon: <HelpCircle className="text-white" />,
        bgColor: 'bg-gray-500'
      };
    }
  };

  const { icon, bgColor } = getIconDetails();

  return (
    <div className={`${iconClasses} ${bgColor} ${animate ? 'animate-fadeIn' : ''}`}>
      {icon}
    </div>
  );
};

export default CategoryIcon; 