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
  Wallet,
  Music,
  Pill,
  Baby,
  BusFront,
  Shirt,
  ArrowUpDown,
  Coins,
  Building2,
  LineChart,
  Wallet as WalletIcon
} from 'lucide-react';

interface CategoryIconProps {
  category: string | number;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  category, 
  size = 'md',
  animate = true,
  className = ''
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

  // Determine if this is an income category (typically IDs 13-17)
  const isIncomeCategory = 
    (typeof category === 'number' && category >= 13 && category <= 17) || 
    (typeof category === 'string' && Number(category) >= 13 && Number(category) <= 17) ||
    (typeof category === 'string' && category.startsWith('income_')) ||
    categoryType === 'income';

  // Determine if this is an expense category
  const isExpenseCategory = 
    (typeof category === 'number' && category >= 1 && category <= 12) || 
    (typeof category === 'string' && Number(category) >= 1 && Number(category) <= 12) ||
    (typeof category === 'string' && category.startsWith('expense_')) ||
    categoryType === 'expense';

  // Default icon
  let Icon = HelpCircle;
  // Default icon color and background color
  let iconColor = 'text-white';
  let bgColor = '#1A1A1A'; // Default dark background
  
  // Set income category specific colors
  if (isIncomeCategory) {
    iconColor = 'text-black';
    bgColor = '#C6FE1E'; // Green background for income categories
  }
  // Ensure expense categories have consistent styling
  else if (isExpenseCategory) {
    iconColor = 'text-white';
    bgColor = '#1A1A1A'; // Dark background for expense categories
  }
  
  // Set icon based on category
  switch (categoryForIcon) {
    // Expense Categories
    case 'expense_food':
    case 'expense_dining':
    case '1':
    case '2':
      Icon = Utensils;
      break;
    case 'expense_entertainment':
    case '3':
      Icon = Music;
      break;
    case 'expense_transportation':
    case '4':
      Icon = Car;
      break;
    case 'expense_housing':
    case '5':
      Icon = Home;
      break;
    case 'expense_gift':
    case '6':
      Icon = GiftIcon;
      break;
    case 'expense_healthcare':
    case '7':
      Icon = Pill;
      break;
    case 'expense_children':
    case '8':
      Icon = Baby;
      break;
    case 'expense_utility':
    case '9':
      Icon = Zap;
      break;
    case 'expense_travel':
    case '10':
      Icon = BusFront;
      break;
    case 'expense_education':
    case '11':
      Icon = Briefcase;
      break;
    case 'expense_shopping':
    case '12':
      Icon = Shirt;
      break;
    
    // Income Categories
    case 'income_salary':
    case '13':
      Icon = Briefcase;
      break;
    case 'income_business':
    case '14':
      Icon = Building2;
      break;
    case 'income_investment':
    case '15':
      Icon = LineChart;
      break;
    case 'income_gift':
    case '16':
      Icon = GiftIcon;
      break;
    
    // Other Categories
    case 'transfer':
    case '18':
      Icon = ArrowUpDown;
      break;
    
    // Default & Other Category
    case 'expense_other':
    case 'income_other':
    case '17':
    case '19':
    default:
      Icon = isIncomeCategory ? Coins : HelpCircle;
      break;
  }

  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-full ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <Icon
        className="h-5 w-5"
        color={iconColor === 'text-white' ? 'white' : 'black'}
      />
    </div>
  );
};

export default CategoryIcon; 