
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import DashboardCard from './DashboardCard';
import { ChartIcon } from 'lucide-react';

const SpendingChart: React.FC = () => {
  const { monthlyData } = useTransactions();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
      title="Monthly Overview" 
      icon={<ChartIcon className="w-4 h-4" />}
    >
      <div className="mt-2 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyData}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={formatCurrency}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="income" 
              name="Income" 
              fill="hsl(var(--finance-income))" 
              radius={[4, 4, 0, 0]} 
              barSize={12}
            />
            <Bar 
              dataKey="expense" 
              name="Expense" 
              fill="hsl(var(--finance-expense))" 
              radius={[4, 4, 0, 0]} 
              barSize={12}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
};

export default SpendingChart;
