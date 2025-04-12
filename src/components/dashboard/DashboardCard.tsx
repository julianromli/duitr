import React, { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  className?: string;
  contentClassName?: string;
  icon?: ReactNode;
  actionButton?: ReactNode;
  children: ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  className,
  contentClassName,
  icon,
  actionButton,
  children,
}) => {
  return (
    <Card className={cn("overflow-hidden border shadow-sm hover:shadow-md transition-all duration-300 animate-scale-in", className)}>
      <CardHeader className="p-4 pb-0 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {actionButton}
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent className={cn("p-4", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
