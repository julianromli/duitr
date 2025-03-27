import React from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  CreditCard, 
  ShoppingCart, 
  Coffee, 
  Briefcase, 
  Home as HomeIcon, 
  Smartphone,
  Gift,
  Film,
  Zap,
  Wifi,
  BookOpen
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
  // Convert category name to lowercase for consistent matching
  const categoryLower = category.toLowerCase();

  // Define size classes
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  const iconClasses = `${iconSizes[size]} rounded-full flex items-center justify-center`;

  // Define icon mapping
  const getIconDetails = () => {
    // Get icon and color based on category
    if (categoryLower.includes('salary')) {
      return {
        icon: <Briefcase className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'S'
      };
    } else if (categoryLower.includes('freelance')) {
      return {
        icon: <Briefcase className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'F'
      };
    } else if (categoryLower.includes('youtube') || categoryLower.includes('subscription')) {
      return {
        icon: <Film className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: '▶️'
      };
    } else if (categoryLower.includes('ovo')) {
      return {
        icon: <Smartphone className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'O'
      };
    } else if (categoryLower.includes('google')) {
      return {
        icon: <Smartphone className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: '▶️'
      };
    } else if (categoryLower.includes('stripe')) {
      return {
        icon: <DollarSign className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'S'
      };
    } else if (categoryLower.includes('groceries')) {
      return {
        icon: <ShoppingCart className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'G'
      };
    } else if (categoryLower.includes('dining') || categoryLower.includes('food')) {
      return {
        icon: <Coffee className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'D'
      };
    } else if (categoryLower.includes('rent')) {
      return {
        icon: <HomeIcon className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'R'
      };
    } else if (categoryLower.includes('utilities')) {
      return {
        icon: <Zap className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'U'
      };
    } else if (categoryLower.includes('side business')) {
      return {
        icon: <Briefcase className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'B'
      };
    } else if (categoryLower.includes('passive')) {
      return {
        icon: <Wifi className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'P'
      };
    } else if (categoryLower.includes('monthly')) {
      return {
        icon: <DollarSign className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'M'
      };
    } else if (categoryLower.includes('e-book') || categoryLower.includes('book')) {
      return {
        icon: <BookOpen className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'B'
      };
    } else if (categoryLower.includes('transfer')) {
      return {
        icon: <DollarSign className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#1364FF]',
        label: 'T'
      };
    } else if (categoryLower.includes('app') || categoryLower.includes('store')) {
      return {
        icon: <Smartphone className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'A'
      };
    } else {
      // Default
      return {
        icon: <CreditCard className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: '$'
      };
    }
  };

  const { icon, bgColor, label } = getIconDetails();

  const iconVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        duration: 0.3,
        type: "spring",
        stiffness: 300,
        damping: 20
      } 
    }
  };

  // Return animated or static icon
  return animate ? (
    <motion.div 
      className={`${bgColor} ${iconClasses}`}
      initial="hidden"
      animate="visible"
      variants={iconVariants}
      whileHover={{ scale: 1.05 }}
    >
      {icon}
    </motion.div>
  ) : (
    <div className={`${bgColor} ${iconClasses}`}>
      {icon}
    </div>
  );
};

export default CategoryIcon; 