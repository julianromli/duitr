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
  BookOpen,
  Car,
  Plane,
  Bus,
  Train,
  HeartPulse,
  GraduationCap,
  Scissors,
  ShoppingBag,
  Building,
  Receipt,
  Wallet,
  Bitcoin,
  Coins,
  BadgeDollarSign,
  Banknote,
  Pizza,
  Utensils,
  ShowerHead,
  Trophy
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
    // INCOME CATEGORIES
    if (categoryLower.includes('salary') || categoryLower === 'gaji') {
      return {
        icon: <Banknote className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'S'
      };
    } else if (categoryLower.includes('freelance') || categoryLower.includes('pekerja lepas')) {
      return {
        icon: <Briefcase className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'F'
      };
    } else if (categoryLower.includes('business') || categoryLower.includes('bisnis')) {
      return {
        icon: <Building className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'B'
      };
    } else if (categoryLower.includes('investment') || categoryLower.includes('investasi')) {
      return {
        icon: <Bitcoin className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'I'
      };
    } else if (categoryLower.includes('gift') || categoryLower.includes('hadiah') || categoryLower.includes('bonus')) {
      return {
        icon: <Gift className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'G'
      };
    } else if (categoryLower.includes('refund') || categoryLower.includes('pengembalian')) {
      return {
        icon: <Receipt className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'R'
      };
    } else if (categoryLower.includes('passive') || categoryLower.includes('pasif')) {
      return {
        icon: <Wifi className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'P'
      };
    } 
    // EXPENSE CATEGORIES
    else if (categoryLower.includes('groceries') || categoryLower.includes('kebutuhan rumah')) {
      return {
        icon: <ShoppingCart className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'G'
      };
    } else if (categoryLower.includes('dining') || categoryLower.includes('makan') || categoryLower.includes('food')) {
      return {
        icon: <Utensils className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'D'
      };
    } else if (categoryLower.includes('transportation') || categoryLower.includes('transportasi')) {
      return {
        icon: <Car className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'T'
      };
    } else if (categoryLower.includes('utilities') || categoryLower.includes('berlangganan') || categoryLower.includes('subscription')) {
      return {
        icon: <Zap className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'U'
      };
    } else if (categoryLower.includes('housing') || categoryLower.includes('perumahan') || categoryLower.includes('rent')) {
      return {
        icon: <HomeIcon className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'H'
      };
    } else if (categoryLower.includes('entertainment') || categoryLower.includes('hiburan')) {
      return {
        icon: <Film className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'E'
      };
    } else if (categoryLower.includes('shopping') || categoryLower.includes('belanja')) {
      return {
        icon: <ShoppingBag className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'S'
      };
    } else if (categoryLower.includes('healthcare') || categoryLower.includes('kesehatan')) {
      return {
        icon: <HeartPulse className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'H'
      };
    } else if (categoryLower.includes('education') || categoryLower.includes('pendidikan')) {
      return {
        icon: <GraduationCap className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'E'
      };
    } else if (categoryLower.includes('personal_care') || categoryLower.includes('personal care')) {
      return {
        icon: <ShowerHead className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'P'
      };
    } else if (categoryLower.includes('travel') || categoryLower.includes('perjalanan')) {
      return {
        icon: <Plane className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'T'
      };
    } else if (categoryLower.includes('gifts') || categoryLower.includes('hadiah')) {
      return {
        icon: <Gift className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'G'
      };
    } else if (categoryLower.includes('transfer')) {
      return {
        icon: <Wallet className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'T'
      };
    } else if (categoryLower.includes('youtube') || categoryLower.includes('subscription')) {
      return {
        icon: <Film className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: '▶️'
      };
    } else if (categoryLower.includes('ovo') || categoryLower.includes('e-wallet')) {
      return {
        icon: <Smartphone className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'O'
      };
    } else if (categoryLower.includes('coffee') || categoryLower.includes('kopi')) {
      return {
        icon: <Coffee className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'C'
      };
    } else if (categoryLower.includes('app') || categoryLower.includes('store')) {
      return {
        icon: <Smartphone className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'A'
      };
    } else if (categoryLower.includes('e-book') || categoryLower.includes('book')) {
      return {
        icon: <BookOpen className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: 'B'
      };
    } else if (categoryLower.includes('other') || categoryLower.includes('lainnya')) {
      return {
        icon: <DollarSign className="w-4 h-4 text-[#0D0D0D]" />,
        bgColor: 'bg-[#C6FE1E]',
        label: '$'
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