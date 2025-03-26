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
  
  const iconClasses = `${iconSizes[size]} rounded-xl flex items-center justify-center`;

  // Define icon mapping
  const getIconDetails = () => {
    // Get icon and color based on category
    if (categoryLower.includes('salary')) {
      return {
        icon: <Briefcase className="w-4 h-4 text-white" />,
        bgColor: 'bg-blue-500',
        label: 'S'
      };
    } else if (categoryLower.includes('freelance')) {
      return {
        icon: <Briefcase className="w-4 h-4 text-white" />,
        bgColor: 'bg-purple-500',
        label: 'F'
      };
    } else if (categoryLower.includes('youtube') || categoryLower.includes('subscription')) {
      return {
        icon: <Film className="w-4 h-4 text-white" />,
        bgColor: 'bg-red-500',
        label: '▶️'
      };
    } else if (categoryLower.includes('ovo')) {
      return {
        icon: <Smartphone className="w-4 h-4 text-white" />,
        bgColor: 'bg-purple-600',
        label: 'O'
      };
    } else if (categoryLower.includes('google')) {
      return {
        icon: <Smartphone className="w-4 h-4 text-white" />,
        bgColor: 'bg-blue-400',
        label: '▶️'
      };
    } else if (categoryLower.includes('stripe')) {
      return {
        icon: <DollarSign className="w-4 h-4 text-white" />,
        bgColor: 'bg-indigo-500',
        label: 'S'
      };
    } else if (categoryLower.includes('groceries')) {
      return {
        icon: <ShoppingCart className="w-4 h-4 text-white" />,
        bgColor: 'bg-green-500',
        label: 'G'
      };
    } else if (categoryLower.includes('dining')) {
      return {
        icon: <Coffee className="w-4 h-4 text-white" />,
        bgColor: 'bg-yellow-600',
        label: 'D'
      };
    } else if (categoryLower.includes('rent')) {
      return {
        icon: <HomeIcon className="w-4 h-4 text-white" />,
        bgColor: 'bg-blue-600',
        label: 'R'
      };
    } else if (categoryLower.includes('utilities')) {
      return {
        icon: <Zap className="w-4 h-4 text-white" />,
        bgColor: 'bg-yellow-500',
        label: 'U'
      };
    } else if (categoryLower.includes('side business')) {
      return {
        icon: <Briefcase className="w-4 h-4 text-white" />,
        bgColor: 'bg-emerald-600',
        label: 'B'
      };
    } else if (categoryLower.includes('passive')) {
      return {
        icon: <Wifi className="w-4 h-4 text-white" />,
        bgColor: 'bg-pink-500',
        label: 'P'
      };
    } else if (categoryLower.includes('monthly')) {
      return {
        icon: <DollarSign className="w-4 h-4 text-white" />,
        bgColor: 'bg-blue-500',
        label: 'M'
      };
    } else if (categoryLower.includes('e-book') || categoryLower.includes('book')) {
      return {
        icon: <BookOpen className="w-4 h-4 text-white" />,
        bgColor: 'bg-green-600',
        label: 'B'
      };
    } else {
      // Default
      return {
        icon: <CreditCard className="w-4 h-4 text-white" />,
        bgColor: 'bg-gray-500',
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