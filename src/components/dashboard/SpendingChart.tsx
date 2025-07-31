import React, { useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import DashboardCard from './DashboardCard';
import { BarChart3 } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';

const SpendingChart: React.FC = () => {
  const { monthlyData } = useTransactions();
  const { formatCurrency } = useFinance();
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Find the maximum value for scaling
  const maxValue = Math.max(...monthlyData.map(item => item.value));

  return (
    <DashboardCard 
      title="Monthly Spending by Category" 
      icon={<BarChart3 className="w-4 h-4" />}
    >
      <div className="h-[250px] mt-4 flex flex-col">
        {/* Chart area */}
        <div className="flex-1 flex items-end justify-between gap-2 px-4 pb-8">
          {monthlyData.map((item, index) => {
            const height = (item.value / maxValue) * 100;
            return (
              <div 
                key={item.name}
                className="flex flex-col items-center flex-1 relative"
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Tooltip */}
                {hoveredBar === index && (
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 p-2 bg-white dark:bg-black border shadow-lg rounded-lg z-10 whitespace-nowrap">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-primary">{formatCurrency(item.value)}</p>
                  </div>
                )}
                
                {/* Bar */}
                <div 
                  className="w-full bg-primary rounded-t-md transition-all duration-300 hover:opacity-80 cursor-pointer"
                  style={{ 
                    height: `${height}%`,
                    minHeight: '4px',
                    maxWidth: '40px'
                  }}
                />
                
                {/* Label */}
                <span className="text-xs text-muted-foreground mt-2 text-center truncate w-full">
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Y-axis labels */}
        <div className="flex justify-between text-xs text-muted-foreground px-4">
          <span>{formatCurrency(0)}</span>
          <span>{formatCurrency(maxValue)}</span>
        </div>
      </div>
    </DashboardCard>
  );
};

export default SpendingChart;
