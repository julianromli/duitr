// Component: CategoryIcon
// Description: Displays category icons with proper mapping for all categories
// Fixed icon display for Personal (ID 11), Investment (ID 21), and Transfer (ID 18) categories
// Enhanced database icon loading with fallback to hardcoded mappings
// Fixed missing icons: Personal → User, Investment → LineChart, Transfer → ArrowLeftRight
// Enhanced numeric ID handling to support both string and number category types

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalizedCategoryName, DEFAULT_CATEGORIES } from '@/utils/categoryUtils';
import { getCategoryById } from '@/services/categoryService';
import { getIconComponent } from '@/components/shared/IconSelector';
import { motion } from 'framer-motion';
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
  Book,
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
  Coins,
  Building2,
  LineChart,
  Circle,
  BusFrontIcon
} from 'lucide-react';

interface CategoryIconProps {
  category: string | number;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
  delay?: number;
}

// Animation variants for smooth reveal effects
const iconVariants = {
  hidden: {
    scale: 0,
    opacity: 0,
    rotate: -180
  },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
      duration: 0.6
    }
  }
};

const hoverVariants = {
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      type: "spring",
      stiffness: 600,
      damping: 15
    }
  }
};

const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = 'md',
  className = '',
  animate = true,
  delay = 0
}) => {
  const [displayName, setDisplayName] = useState<string>('');
  const [categoryType, setCategoryType] = useState<string>('');
  const [categoryIcon, setCategoryIcon] = useState<string | null>(null);
  const { i18n, t } = useTranslation();
  
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

  // Helper function to normalize icon names for compatibility
  const normalizeIconName = (iconName: string): string => {
    if (!iconName) return 'circle';
    
    // Convert PascalCase to kebab-case
    const kebabCase = iconName
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
    
    return kebabCase || 'circle';
  };

  const getCategoryIconComponent = (iconName: string) => {
    return getIconComponent(normalizeIconName(iconName));
  };

  // Function to render dynamic icons
  const renderDynamicIcon = (iconName: string) => {
    // Ensure we have a valid iconName
    if (!iconName) return <Circle className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
    
    try {
      const IconComponent = getCategoryIconComponent(iconName);
      return <IconComponent className={iconInnerSizes[size]} stroke="black" fill="none" strokeWidth={2} />;
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
              // Also try to get the localized name
              const loadedName = getLocalizedCategoryName(category);
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
            // Use translation keys for category names
            const categoryKey = defaultCategory.name.toLowerCase().replace(/\s+/g, '_');
            let translationKey = '';
            
            if (categoryType === 'expense') {
              translationKey = `transactions.categories.${categoryKey}`;
            } else if (categoryType === 'income') {
              translationKey = `income.categories.${categoryKey}`;
            } else {
              translationKey = `transactions.${categoryKey}`;
            }
            
            // Use translation with fallback to original name
            const translatedName = t(translationKey, defaultCategory.name);
            setDisplayName(translatedName);
            
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
              10: 'expense_vehicle',
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
            typeof category === 'string' ? category : String(category)
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
    (typeof category === 'number' && (category >= 1 && category <= 12 || category === 19 || category === 20 || category === 21)) ||
    (typeof category === 'string' && !isNaN(Number(category)) && (Number(category) >= 1 && Number(category) <= 12 || Number(category) === 19 || Number(category) === 20 || Number(category) === 21)) ||
    (typeof category === 'string' && category.startsWith('expense_')) ||
    categoryType === 'expense';

  // Default icon
  let Icon = HelpCircle;
  
  // Set icon based on category
  switch (categoryForIcon) {
    // Expense Categories
    case 'expense_food':
    case 'expense_dining':
    case 'food':
    case 'dining':
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
      Icon = BusFrontIcon;
      break;
    case 'expense_housing':
    case 'housing':
    case '5':
      Icon = Home;
      break;
    case 'expense_gift':
    case 'gift':
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
    case 'expense_vehicle':
    case 'vehicle':
    case '10':
      Icon = Car;
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
    case 'expense_other':
    case '12':
      Icon = Package;
      break;
    case 'expense_baby_needs':
    case 'baby_needs':
    case 'baby':
      Icon = Baby;
      break;
    case 'expense_personal':
    case 'personal':
    case '11':
      Icon = User;
      break;
    case 'expense_investment':
    case '21':
      Icon = LineChart;
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
      Icon = LineChart;
      break;
    case 'income_gift':
    case '16':
      Icon = GiftIcon;
      break;
    
    // Other Categories
    case 'transfer':
    case 'system_transfer':
    case '18':
      Icon = ArrowLeftRight;
      break;
    
    case 'expense_donation':
    case '19':
      Icon = DollarSign;
      break;
    case 'income_other':
    case 'other':
    case '17':
      Icon = Coins;
      break;
    default:
      Icon = isIncomeCategory ? Coins : (isExpenseCategory ? Package : HelpCircle);
      break;
  }

  // Handle default icon for numeric categories in the picker
  if (category === "question" || category === "?") {
    return (
      <motion.div
        className={`flex items-center justify-center rounded-full bg-primary ${className}`}
        style={{ width: 34, height: 34 }}
        initial={animate ? "hidden" : "visible"}
        animate="visible"
        variants={animate ? iconVariants : {}}
        whileHover={animate ? "hover" : {}}
        whileTap={animate ? "tap" : {}}
        transition={animate ? { delay } : {}}
      >
        <motion.div variants={animate ? hoverVariants : {}}>
          <HelpCircle
            className={iconInnerSizes[size]}
            stroke="black"
            fill="none"
            strokeWidth={2}
          />
        </motion.div>
      </motion.div>
    );
  }

  // Handle special default case for numeric IDs from the category picker
  if ((typeof category === 'string' && !isNaN(Number(category))) || typeof category === 'number') {
    console.log("Numeric category ID:", category);

    // Hardcode icons based on common category IDs
    const numericId = typeof category === 'number' ? category : Number(category);
    let DefaultIcon = HelpCircle;

    // Expense categories (1-12, 19-21)
    if (numericId === 1) DefaultIcon = ShoppingCart; // Groceries
    else if (numericId === 2) DefaultIcon = Utensils; // Dining
    else if (numericId === 3) DefaultIcon = BusFrontIcon; // Transportation
    else if (numericId === 4) DefaultIcon = Zap; // Subscription
    else if (numericId === 5) DefaultIcon = Home; // Housing
    else if (numericId === 6) DefaultIcon = Music; // Entertainment
    else if (numericId === 7) DefaultIcon = ShoppingBag; // Shopping
    else if (numericId === 8) DefaultIcon = Pill; // Healthcare
    else if (numericId === 9) DefaultIcon = Book; // Education
    else if (numericId === 10) DefaultIcon = Car; // Vehicle
    else if (numericId === 11) DefaultIcon = User; // Personal
    else if (numericId === 12) DefaultIcon = Package; // Other expense
    else if (numericId === 19) DefaultIcon = DollarSign; // Donate
    else if (numericId === 20) DefaultIcon = Baby; // Baby Needs
    else if (numericId === 21) DefaultIcon = LineChart; // Investment (expense)

    // Income categories (13-17)
    else if (numericId === 13) DefaultIcon = Briefcase; // Salary
    else if (numericId === 14) DefaultIcon = Building2; // Business
    else if (numericId === 15) DefaultIcon = LineChart; // Investment (income)
    else if (numericId === 16) DefaultIcon = GiftIcon; // Gift
    else if (numericId === 17) DefaultIcon = Coins; // Other income

    // System categories
    else if (numericId === 18) DefaultIcon = ArrowLeftRight; // Transfer
    
    return (
      <motion.div
        className={`flex items-center justify-center rounded-full bg-primary ${className}`}
        style={{ width: 34, height: 34 }}
        initial={animate ? "hidden" : "visible"}
        animate="visible"
        variants={animate ? iconVariants : {}}
        whileHover={animate ? "hover" : {}}
        whileTap={animate ? "tap" : {}}
        transition={animate ? { delay } : {}}
      >
        <motion.div variants={animate ? hoverVariants : {}}>
          <DefaultIcon
            className={iconInnerSizes[size]}
            stroke="black"
            fill="none"
            strokeWidth={2}
          />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`flex items-center justify-center rounded-full bg-primary ${className}`}
      style={{ width: 34, height: 34 }}
      initial={animate ? "hidden" : "visible"}
      animate="visible"
      variants={animate ? iconVariants : {}}
      whileHover={animate ? "hover" : {}}
      whileTap={animate ? "tap" : {}}
      transition={animate ? { delay } : {}}
    >
      <motion.div variants={animate ? hoverVariants : {}}>
        <Icon
          className={iconInnerSizes[size]}
          stroke="black"
          fill="none"
          strokeWidth={2}
        />
      </motion.div>
    </motion.div>
  );
};

export default CategoryIcon;