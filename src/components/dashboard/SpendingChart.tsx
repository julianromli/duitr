import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import DashboardCard from './DashboardCard';
import { BarChart3 } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';

const SpendingChart: React.FC = () => {
  const { monthlyData } = useTransactions();
  const { formatCurrency } = useFinance();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white dark:bg-black border shadow-lg rounded-lg">
          <p className="font-medium text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardCard 
      title="Monthly Spending by Category" 
      icon={<BarChart3 className="w-4 h-4" />}
    >
      <div className="h-[250px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={monthlyData} 
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis 
              tickFormatter={formatCurrency}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              fill="var(--color-primary)" 
              radius={[4, 4, 0, 0]}
              barSize={30}
              className="animated-bar"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
};

export default SpendingChart;
