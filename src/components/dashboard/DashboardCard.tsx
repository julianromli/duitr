import React, { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface DashboardCardProps {
  title: string;
  className?: string;
  contentClassName?: string;
  icon?: ReactNode;
  actionButton?: ReactNode;
  children: ReactNode;
}

// Animation variants for smooth reveal effects
const cardVariants = {
  hidden: {
    y: 20,
    opacity: 0,
    scale: 0.95
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      duration: 0.6
    }
  }
};

const headerVariants = {
  hidden: {
    y: 10,
    opacity: 0
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
      delay: 0.1
    }
  }
};

const contentVariants = {
  hidden: {
    y: 15,
    opacity: 0
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 28,
      delay: 0.2
    }
  }
};

const hoverVariants = {
  hover: {
    scale: 1.02,
    y: -2,
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      type: "spring",
      stiffness: 600,
      damping: 15
    }
  }
};

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  className,
  contentClassName,
  icon,
  actionButton,
  children,
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover="hover"
      whileTap="tap"
      className={cn("cursor-pointer", className)}
    >
      <motion.div variants={hoverVariants}>
        <Card className="overflow-hidden border shadow-sm transition-all duration-300">
          <motion.div variants={headerVariants}>
            <CardHeader className="p-4 pb-0 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
              <div className="flex items-center gap-2">
                {actionButton}
                {icon && <div className="text-muted-foreground">{icon}</div>}
              </div>
            </CardHeader>
          </motion.div>
          <motion.div variants={contentVariants}>
            <CardContent className={cn("p-4", contentClassName)}>
              {children}
            </CardContent>
          </motion.div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default DashboardCard;
