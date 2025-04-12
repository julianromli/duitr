import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { getLocalizedCategoryName, getCategoryStringIdFromUuid } from '@/utils/categoryUtils';
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
  category: string | number;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  category, 
  size = 'md',
  animate = true
}) => {
  const [displayName, setDisplayName] = useState<string>('');
  const [categoryType, setCategoryType] = useState<string>('');
  const { i18n } = useTranslation();
  
  useEffect(() => {
    const loadCategory = async () => {
      try {
        // Check if it's a UUID string
        if (typeof category === 'string' && category.includes('-')) {
          // Get the category from the database
          const categoryData = await getCategoryById(category);
          if (categoryData) {
            setDisplayName(i18n.language === 'id' ? categoryData.id_name : categoryData.en_name);
            // Store the category type to help with icon selection later
            setCategoryType(categoryData.type || '');
            return;
          }
        }
        
        // Check if it's a number (integer ID from database)
        if (typeof category === 'number' || (typeof category === 'string' && !isNaN(Number(category)))) {
          const categoryData = await getCategoryById(category);
          if (categoryData) {
            setDisplayName(i18n.language === 'id' ? categoryData.id_name : categoryData.en_name);
            setCategoryType(categoryData.type || '');
            // If we have a category_key, use that for better icon matching
            if (categoryData.category_key) {
              setCategoryType(categoryData.category_key);
            }
            return;
          }
        }
        
        // For string keys (like 'expense_groceries')
        if (typeof category === 'string' && category.includes('_')) {
          // For string category IDs, extract the type (expense/income) and name
          const parts = category.split('_');
          if (parts.length > 1) {
            setCategoryType(category); // Store the full ID for icon selection
            
            // Also try to get the localized name
            const loadedName = await getLocalizedCategoryName(category, i18next);
            setDisplayName(loadedName);
            return;
          }
        }
        
        // Fallback: for any other case, try to get localized name
        const loadedName = await getLocalizedCategoryName(
          typeof category === 'string' ? category : String(category), 
          i18next
        );
        setDisplayName(loadedName || 'Other');
      } catch (err) {
        console.error('Error loading category:', err);
        setDisplayName('Other');
      }
    };
    
    loadCategory();
  }, [category, i18n.language]);

  // Define size classes
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  const iconClasses = `${iconSizes[size]} rounded-full flex items-center justify-center`;

  // Get category name for icon matching
  let categoryForIcon = '';
  
  if (categoryType) {
    // If we've stored a category type/key, use that first
    categoryForIcon = categoryType.toLowerCase();
  } else if (typeof category === 'string' && category.includes('_')) {
    // Extract name from category ID strings like "expense_groceries"
    const parts = category.split('_');
    if (parts.length > 1) {
      categoryForIcon = parts[1].toLowerCase();
    }
  } else {
    // Default to the display name
    categoryForIcon = displayName.toLowerCase();
  }

  // Define icon mapping
  const getIconDetails = () => {
    // Housing/Home
    if (categoryForIcon.includes('housing') || categoryForIcon.includes('rent') || 
        categoryForIcon.includes('perumahan')) {
      return { 
        icon: <Home className="text-white" />,
        bgColor: 'bg-orange-500'
      };
    }
    // Dining/Food
    else if (categoryForIcon.includes('dining') || categoryForIcon.includes('food') || 
             categoryForIcon.includes('makan')) {
      return { 
        icon: <Utensils className="text-white" />,
        bgColor: 'bg-red-500'
      };
    }
    // Transport
    else if (categoryForIcon.includes('transport')) {
      return { 
        icon: <Car className="text-white" />,
        bgColor: 'bg-indigo-500'
      };
    }
    // Groceries/Household
    else if (categoryForIcon.includes('groceries') || categoryForIcon.includes('kebutuhan rumah') || 
             categoryForIcon.includes('rumah tangga')) {
      return { 
        icon: <Package className="text-white" />,
        bgColor: 'bg-yellow-500'
      };
    }
    // Subscription/Utilities
    else if (categoryForIcon.includes('utilities') || categoryForIcon.includes('subscription') || 
             categoryForIcon.includes('berlangganan')) {
      return { 
        icon: <Zap className="text-white" />,
        bgColor: 'bg-yellow-300'
      };
    }
    // Entertainment
    else if (categoryForIcon.includes('entertain') || categoryForIcon.includes('hiburan')) {
      return { 
        icon: <Film className="text-white" />,
        bgColor: 'bg-purple-500'
      };
    }
    // Shopping
    else if (categoryForIcon.includes('shop') || categoryForIcon.includes('belanja')) {
      return { 
        icon: <ShoppingBag className="text-white" />,
        bgColor: 'bg-blue-400'
      };
    }
    // Health
    else if (categoryForIcon.includes('health') || categoryForIcon.includes('kesehatan')) {
      return { 
        icon: <Heart className="text-white" />,
        bgColor: 'bg-pink-500'
      };
    }
    // Education
    else if (categoryForIcon.includes('education') || categoryForIcon.includes('edu') || 
             categoryForIcon.includes('pendidikan')) {
      return { 
        icon: <Book className="text-white" />,
        bgColor: 'bg-green-500'
      };
    }
    // Personal
    else if (categoryForIcon.includes('personal') || categoryForIcon.includes('pribadi')) {
      return { 
        icon: <User className="text-white" />,
        bgColor: 'bg-violet-600'
      };
    }
    // Travel
    else if (categoryForIcon.includes('travel') || categoryForIcon.includes('perjalanan')) {
      return { 
        icon: <Plane className="text-white" />,
        bgColor: 'bg-blue-500'
      };
    }
    // Gifts
    else if (categoryForIcon.includes('gift') || categoryForIcon.includes('hadiah')) {
      return { 
        icon: <GiftIcon className="text-white" />,
        bgColor: 'bg-red-400'
      };
    }
    // Salary/Income
    else if (categoryForIcon.includes('salary') || categoryForIcon.includes('income') || 
             categoryForIcon.includes('gaji') || categoryForIcon.includes('pendapatan')) {
      return { 
        icon: <Briefcase className="text-white" />,
        bgColor: 'bg-green-600'
      };
    }
    // Business
    else if (categoryForIcon.includes('business') || categoryForIcon.includes('bisnis')) {
      return { 
        icon: <DollarSign className="text-white" />,
        bgColor: 'bg-amber-600'
      };
    }
    // Transfer
    else if (categoryForIcon.includes('transfer') || categoryForIcon.includes('system')) {
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