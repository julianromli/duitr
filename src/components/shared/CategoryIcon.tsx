
// Component: CategoryIcon
// Fixed icon display for Investment (ID 15, 21) and Transfer (ID 18) categories
// Corrected function calls and enhanced category key mapping for proper icon display

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { getLocalizedCategoryName, getCategoryStringIdFromUuid, DEFAULT_CATEGORIES } from '@/utils/categoryUtils';
import { getCategoryById } from '@/services/categoryService';
import { useTheme } from '@/context/ThemeContext';
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
  Wallet as WalletIcon,
  Circle
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
  const [categoryIcon, setCategoryIcon] = useState<string | null>(null);
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  
  // Define size classes
  const iconSizes = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14'
  };
  
  // Define icon sizes based on container size
  const iconInnerSizes = {
    sm: 'h-5 w-5',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };
  
  const iconClasses = `${iconSizes[size]} rounded-full flex items-center justify-center`;

  // Function to render dynamic icons
  const renderDynamicIcon = (iconName: string) => {
    // Ensure we have a valid iconName
    if (!iconName) return <Circle className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
    
    try {
      // Try to find the icon in lucide-react
      switch (iconName) {
        case 'ShoppingCart':
          return <ShoppingCart className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Coffee':
          return <Coffee className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Car':
          return <Car className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Home':
          return <Home className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Briefcase':
          return <Briefcase className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'DollarSign':
          return <DollarSign className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Gift':
          return <Gift className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Utensils':
          return <Utensils className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Package':
          return <Package className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Heart':
          return <Heart className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Plane':
          return <Plane className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Film':
          return <Film className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Book':
          return <Book className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'ArrowLeftRight':
          return <ArrowLeftRight className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'LineChart':
          return <LineChart className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Circle':
          return <Circle className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Music':
          return <Music className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Smartphone':
          return <Smartphone className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'CreditCard':
          return <CreditCard className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'ShoppingBag':
          return <ShoppingBag className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Zap':
          return <Zap className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'User':
          return <User className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Pill':
          return <Pill className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Baby':
          return <Baby className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'BusFront':
          return <BusFront className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Coins':
          return <Coins className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Wallet':
          return <Wallet className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        case 'Building2':
          return <Building2 className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
        default:
          console.warn(`Icon not found: ${iconName}`);
          return <Circle className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
      }
    } catch (error) {
      console.error('Error rendering icon:', error);
      return <Circle className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
    }
  };

  useEffect(() => {
    const loadCategory = async () => {
      try {
        let categoryData = null;
        
        // Check if it's a UUID string
        if (typeof category === 'string' && category.includes('-')) {
          // Get the category from the database
          try {
            categoryData = await getCategoryById(category);
          } catch (error) {
            console.warn(`Error getting category by UUID ${category}:`, error);
            // Will continue to fallback mechanisms
          }
        }
        // Check if it's a number (integer ID from database)
        else if (typeof category === 'number' || (typeof category === 'string' && !isNaN(Number(category)))) {
          try {
            categoryData = await getCategoryById(category);
          } catch (error) {
            console.warn(`Error getting category by ID ${category}:`, error);
            // Will continue to fallback mechanisms
          }
        }
        
        if (categoryData) {
          setDisplayName(i18n.language === 'id' ? categoryData.id_name : categoryData.en_name);
          // Store the category type to help with icon selection later
          setCategoryType(categoryData.type || '');

          // If we have a category_key, use that for better icon matching
          if (categoryData.category_key) {
            setCategoryType(categoryData.category_key);
          }

          // Store icon if present - this should take priority
          if (categoryData.icon) {
            setCategoryIcon(categoryData.icon);
          }
          return;
        }
        
        // For string keys (like 'expense_groceries')
        if (typeof category === 'string' && category.includes('_')) {
          // For string category IDs, extract the type (expense/income) and name
          const parts = category.split('_');
          if (parts.length > 1) {
            setCategoryType(category); // Store the full ID for icon selection
            
            try {
              // Also try to get the localized name - fixed function call
              const loadedName = getLocalizedCategoryName(category, i18next);
              setDisplayName(loadedName);
            } catch (error) {
              console.warn(`Could not get localized name for ${category}:`, error);
              // Use the second part of the category ID as fallback name
              setDisplayName(parts[1].charAt(0).toUpperCase() + parts[1].slice(1));
            }
            return;
          }
        }
        
        // For numeric IDs, try to use DEFAULT_CATEGORIES lookup
        if (typeof category === 'number' || (typeof category === 'string' && !isNaN(Number(category)))) {
          const numericId = Number(category);
          
          // Determine category type based on ID range
          let categoryType: 'expense' | 'income' | 'system' = 'expense';
          if (numericId >= 13 && numericId <= 17) {
            categoryType = 'income';
          } else if (numericId === 18) {
            categoryType = 'system';
          }
          
          // Find the category in DEFAULT_CATEGORIES
          const defaultCategory = DEFAULT_CATEGORIES[categoryType].find(cat => cat.id === String(numericId));
          if (defaultCategory) {
            // Return localized name from default categories
            if (i18n.language === 'id') {
              const translations: Record<string, string> = {
                "Groceries": "Belanjaan",
                "Dining": "Makanan",
                "Transportation": "Transportasi",
                "Subscription": "Langganan", 
                "Housing": "Perumahan",
                "Entertainment": "Hiburan",
                "Shopping": "Belanja",
                "Health": "Kesehatan",
                "Education": "Pendidikan",
                "Travel": "Perjalanan",
                "Personal": "Pribadi",
                "Other": "Lainnya",
                "Donate": "Sedekah",
                "Salary": "Gaji",
                "Business": "Bisnis",
                "Investment": "Investasi",
                "Gift": "Hadiah", 
                "Transfer": "Transfer"
              };
              setDisplayName(translations[defaultCategory.name] || defaultCategory.name);
            } else {
              setDisplayName(defaultCategory.name);
            }
            
            // Set category type based on ID for icon matching
            const categoryKeyMap: Record<number, string> = {
              1: 'expense_groceries',
              2: 'expense_food',
              3: 'expense_transportation',
              4: 'expense_subscription',
              5: 'expense_housing',
              6: 'expense_entertainment',
              7: 'expense_shopping',
              8: 'expense_health',
              9: 'expense_education',
              10: 'expense_travel',
              11: 'expense_personal',
              12: 'expense_other',
              13: 'income_salary',
              14: 'income_business',
              15: 'income_investment',
              16: 'income_gift',
              17: 'income_other',
              18: 'system_transfer',
              19: 'expense_donation',
              20: 'expense_baby_needs',
              21: 'expense_investment'
            };
            
            setCategoryType(categoryKeyMap[numericId] || `${categoryType}_other`);
            return;
          }
        }
        
        // Fallback: for any other case, try to get localized name
        try {
          const loadedName = getLocalizedCategoryName(
            typeof category === 'string' ? category : String(category), 
            i18next
          );
          setDisplayName(loadedName || 'Other');
        } catch (error) {
          console.error('Error getting localized category name:', error);
          setDisplayName('Other');
        }
      } catch (err) {
        console.error('Error loading category:', err);
        setDisplayName('Other');
      }
    };
    
    loadCategory();
  }, [category, i18n.language]);

  // Get category name for icon matching
  let categoryForIcon = '';

  // If we have a direct icon name from database, use it first
  if (categoryIcon) {
    return (
      <div className={`${iconClasses} ${className} bg-primary`} style={{ width: 34, height: 34 }}>
        {renderDynamicIcon(categoryIcon)}
      </div>
    );
  }

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
    (typeof category === 'string' && !isNaN(Number(category)) && Number(category) >= 13 && Number(category) <= 17) ||
    (typeof category === 'string' && category.startsWith('income_')) ||
    categoryType === 'income';

  // Determine if this is an expense category
  const isExpenseCategory = 
    (typeof category === 'number' && category >= 1 && category <= 12 || category === 19 || category === 20 || category === 21) || 
    (typeof category === 'string' && !isNaN(Number(category)) && (Number(category) >= 1 && Number(category) <= 12 || Number(category) === 19 || Number(category) === 20 || Number(category) === 21)) ||
    (typeof category === 'string' && category.startsWith('expense_')) ||
    categoryType === 'expense';

  // Default icon
  let Icon = HelpCircle;
  
  // Set icon based on category - FIXED: Investment and Transfer icons
  switch (categoryForIcon) {
    // Expense Categories
    case 'expense_food':
    case 'expense_dining':
    case 'food':
    case 'dining':
    case '1':
    case '2':
      Icon = Utensils;
      break;
    case 'expense_entertainment':
    case 'entertainment':
    case '6':
      Icon = Music;
      break;
    case 'expense_transportation':
    case 'transportation':
    case '3':
      Icon = Car;
      break;
    case 'expense_housing':
    case 'housing':
    case '5':
      Icon = Home;
      break;
    case 'expense_gift':
    case 'gift':
    case '16':
      Icon = GiftIcon;
      break;
    case 'expense_healthcare':
    case 'expense_health':
    case 'health':
    case 'healthcare':
    case '8':
      Icon = Pill;
      break;
    case 'expense_children':
    case 'children':
    case 'expense_baby_needs':
    case 'baby_needs':
    case 'baby':
    case '20':
      Icon = Baby;
      break;
    case 'expense_utility':
    case 'expense_subscription':
    case 'utility':
    case 'subscription':
    case '4':
      Icon = Zap;
      break;
    case 'expense_travel':
    case 'travel':
    case '10':
      Icon = Plane;
      break;
    case 'expense_education':
    case 'education':
    case '9':
      Icon = Book;
      break;
    case 'expense_shopping':
    case 'shopping':
    case '7':
      Icon = ShoppingBag;
      break;
    case 'expense_groceries':
    case 'groceries':
    case '1':
      Icon = ShoppingCart;
      break;
    case 'expense_donation':
    case 'donation':
    case 'donate':
    case '19':
      Icon = DollarSign;
      break;
    case 'expense_investment':
    case '21':
      Icon = LineChart; // FIXED: Investment icon
      break;

    // Income Categories
    case 'income_salary':
    case 'salary':
    case '13':
      Icon = Briefcase;
      break;
    case 'income_business':
    case 'business':
    case '14':
      Icon = Building2;
      break;
    case 'income_investment':
    case 'investment':
    case '15':
      Icon = LineChart; // FIXED: Investment icon
      break;
    case 'income_gift':
    case '16':
      Icon = GiftIcon;
      break;
    
    // System Categories - FIXED: Transfer icon
    case 'transfer':
    case 'system_transfer':
    case '18':
      Icon = ArrowLeftRight; // FIXED: Transfer icon
      break;
    
    // Default & Other Category
    case 'expense_other':
    case 'income_other':
    case 'other':
    case '11':
    case '12':
    case '17':
    default:
      Icon = isIncomeCategory ? Coins : (isExpenseCategory ? Package : HelpCircle);
      break;
  }

  // Handle default icon for numeric categories in the picker
  if (category === "question" || category === "?") {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-primary ${className}`}
        style={{ width: 34, height: 34 }}
      >
        <HelpCircle
          className={iconInnerSizes[size]}
          stroke="black"
          fill="none"
          strokeWidth={2}
        />
      </div>
    );
  }

  // Handle special default case for numeric IDs from the category picker
  if (typeof category === 'string' && !isNaN(Number(category))) {
    console.log("Numeric category ID:", category);

    // Hardcode icons based on common category IDs
    const numericId = Number(category);
    let DefaultIcon = HelpCircle;

    // Expense categories (1-12, 19-21)
    if (numericId === 1) DefaultIcon = ShoppingCart; // Groceries
    else if (numericId === 2) DefaultIcon = Utensils; // Dining
    else if (numericId === 3) DefaultIcon = Car; // Transportation
    else if (numericId === 4) DefaultIcon = Zap; // Subscription
    else if (numericId === 5) DefaultIcon = Home; // Housing
    else if (numericId === 6) DefaultIcon = Music; // Entertainment
    else if (numericId === 7) DefaultIcon = ShoppingBag; // Shopping
    else if (numericId === 8) DefaultIcon = Pill; // Healthcare
    else if (numericId === 9) DefaultIcon = Book; // Education
    else if (numericId === 10) DefaultIcon = Plane; // Travel
    else if (numericId === 11) DefaultIcon = User; // Personal
    else if (numericId === 12) DefaultIcon = Package; // Other expense
    else if (numericId === 19) DefaultIcon = DollarSign; // Donate
    else if (numericId === 20) DefaultIcon = Baby; // Baby Needs
    else if (numericId === 21) DefaultIcon = LineChart; // Investment (expense) - FIXED

    // Income categories (13-17)
    else if (numericId === 13) DefaultIcon = Briefcase; // Salary
    else if (numericId === 14) DefaultIcon = Building2; // Business
    else if (numericId === 15) DefaultIcon = LineChart; // Investment (income) - FIXED
    else if (numericId === 16) DefaultIcon = GiftIcon; // Gift
    else if (numericId === 17) DefaultIcon = Coins; // Other income
    
    // System categories - FIXED
    else if (numericId === 18) DefaultIcon = ArrowLeftRight; // Transfer - FIXED
    
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-primary ${className}`}
        style={{ width: 34, height: 34 }}
      >
        <DefaultIcon
          className={iconInnerSizes[size]}
          stroke="black"
          fill="none"
          strokeWidth={2}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-primary ${className}`}
      style={{ width: 34, height: 34 }}
    >
      <Icon
        className={iconInnerSizes[size]}
        stroke="black"
        fill="none"
        strokeWidth={2}
      />
    </div>
  );
};

export default CategoryIcon;
