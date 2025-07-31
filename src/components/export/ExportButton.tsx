import React, { useState, useRef } from 'react';
import { FileSpreadsheet, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useFinance } from '@/context/FinanceContext';
import { exportToExcel } from '@/services/exportService';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { ExportOptions } from '@/types/finance';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import AnimatedText from '@/components/ui/animated-text';

const ExportButton = () => {
  const { transactions } = useFinance();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | '30days' | '90days' | 'thisYear' | 'custom'>('30days');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState<'start' | 'end' | null>(null);
  const [options, setOptions] = useState<ExportOptions>({
    includeTransactions: true,
    includeSummary: true,
    includeBudgets: true,
    includeWallets: true,
  });

  const handleDateRangeChange = (value: string) => {
    const now = new Date();
    
    switch (value) {
      case 'all':
        setStartDate(undefined);
        setEndDate(undefined);
        break;
      case '30days':
        setStartDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30));
        setEndDate(now);
        break;
      case '90days':
        setStartDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90));
        setEndDate(now);
        break;
      case 'thisYear':
        setStartDate(new Date(now.getFullYear(), 0, 1));
        setEndDate(now);
        break;
      case 'custom':
        // Keep current dates for custom selection
        break;
    }
    
    setDateRange(value as any);
  };

  const handleExport = async () => {
    try {
      // Determine date range
      let exportStartDate = startDate;
      let exportEndDate = endDate;
      
      if (dateRange === 'all') {
        exportStartDate = undefined;
        exportEndDate = undefined;
      }
      
      // Export data - now with await since it's async
      await exportToExcel(transactions, {
        startDate: exportStartDate,
        endDate: exportEndDate,
        ...options
      });
      
      // Close dialog and show success message
      setOpen(false);
      toast({
        title: t('export.successful'),
        description: t('export.successful_description'),
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: t('export.failed'),
        description: t('export.failed_description'),
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg hover:bg-secondary/80 dark:hover:bg-secondary/70">
            <FileSpreadsheet className="h-4 w-4" />
            {t('export.export')}
          </button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-white/10 text-white backdrop-blur-xl shadow-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-[#C6FE1E]/10 rounded-full">
                <FileSpreadsheet className="h-6 w-6 text-[#C6FE1E]" />
              </div>
              <AnimatedText 
                text={t('export.title')}
                animationType="fade"
              />
            </DialogTitle>
          </DialogHeader>
          
          <form className="grid gap-6 py-0">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <div className="w-1 h-4 bg-[#C6FE1E] rounded-full"></div>
                <AnimatedText text={t('export.date_range')} />
              </Label>
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="bg-[#242425]/80 border border-white/10 text-white h-12 rounded-xl hover:bg-[#242425] transition-colors duration-200 focus:ring-2 focus:ring-[#C6FE1E]/50">
                  <SelectValue>
                    <AnimatedText 
                      text={dateRange === 'all' ? t('export.all_time') :
                        dateRange === '30days' ? t('export.last_30_days') :
                        dateRange === '90days' ? t('export.last_90_days') :
                        dateRange === 'thisYear' ? t('export.this_year') :
                        dateRange === 'custom' ? t('export.custom_range') :
                        t('export.date_range')
                      }
                    />
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#242425] border border-white/10 text-white backdrop-blur-xl">
                  <SelectItem value="all" className="hover:bg-[#333]/80 focus:bg-[#333]/80 transition-colors duration-200">
                    <AnimatedText text={t('export.all_time')} />
                  </SelectItem>
                  <SelectItem value="30days" className="hover:bg-[#333]/80 focus:bg-[#333]/80 transition-colors duration-200">
                    <AnimatedText text={t('export.last_30_days')} />
                  </SelectItem>
                  <SelectItem value="90days" className="hover:bg-[#333]/80 focus:bg-[#333]/80 transition-colors duration-200">
                    <AnimatedText text={t('export.last_90_days')} />
                  </SelectItem>
                  <SelectItem value="thisYear" className="hover:bg-[#333]/80 focus:bg-[#333]/80 transition-colors duration-200">
                    <AnimatedText text={t('export.this_year')} />
                  </SelectItem>
                  <SelectItem value="custom" className="hover:bg-[#333]/80 focus:bg-[#333]/80 transition-colors duration-200">
                    <AnimatedText text={t('export.custom_range')} />
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <div className="w-1 h-4 bg-[#C6FE1E] rounded-full"></div>
                    <AnimatedText text={t('export.start_date')} />
                  </Label>
                  <Popover open={calendarOpen === 'start'} onOpenChange={(open) => open ? setCalendarOpen('start') : setCalendarOpen(null)}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-medium bg-[#242425]/80 border border-white/10 text-white h-12 rounded-xl hover:bg-[#242425] transition-colors duration-200 focus:ring-2 focus:ring-[#C6FE1E]/50">
                        <Calendar className="mr-2 h-4 w-4" />
                        <AnimatedText text={startDate ? format(startDate, 'PP') : t('export.pick_date')} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#242425] border border-white/10 backdrop-blur-xl">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                          setCalendarOpen(null);
                        }}
                        initialFocus
                        className="bg-[#242425] text-white"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <div className="w-1 h-4 bg-[#C6FE1E] rounded-full"></div>
                    <AnimatedText text={t('export.end_date')} />
                  </Label>
                  <Popover open={calendarOpen === 'end'} onOpenChange={(open) => open ? setCalendarOpen('end') : setCalendarOpen(null)}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-medium bg-[#242425]/80 border border-white/10 text-white h-12 rounded-xl hover:bg-[#242425] transition-colors duration-200 focus:ring-2 focus:ring-[#C6FE1E]/50">
                        <Calendar className="mr-2 h-4 w-4" />
                        <AnimatedText text={endDate ? format(endDate, 'PP') : t('export.pick_date')} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#242425] border border-white/10 backdrop-blur-xl">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date);
                          setCalendarOpen(null);
                        }}
                        initialFocus
                        className="bg-[#242425] text-white"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <div className="w-1 h-4 bg-[#C6FE1E] rounded-full"></div>
                <AnimatedText text={t('export.data_to_include')} />
              </Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="transactions" 
                    checked={options.includeTransactions} 
                    onCheckedChange={(checked) => setOptions({...options, includeTransactions: !!checked})}
                    className="bg-[#242425]/80 border border-white/10 data-[state=checked]:bg-[#C6FE1E] data-[state=checked]:text-[#0D0D0D] data-[state=checked]:border-[#C6FE1E] h-5 w-5 rounded-md"
                  />
                  <Label htmlFor="transactions" className="cursor-pointer text-white font-medium">
                    <AnimatedText text={t('export.transaction_history')} />
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="summary" 
                    checked={options.includeSummary} 
                    onCheckedChange={(checked) => setOptions({...options, includeSummary: !!checked})}
                    className="bg-[#242425]/80 border border-white/10 data-[state=checked]:bg-[#C6FE1E] data-[state=checked]:text-[#0D0D0D] data-[state=checked]:border-[#C6FE1E] h-5 w-5 rounded-md"
                  />
                  <Label htmlFor="summary" className="cursor-pointer text-white font-medium">
                    <AnimatedText text={t('export.summary_statistics')} />
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="budgets" 
                    checked={options.includeBudgets} 
                    onCheckedChange={(checked) => setOptions({...options, includeBudgets: !!checked})}
                    className="bg-[#242425]/80 border border-white/10 data-[state=checked]:bg-[#C6FE1E] data-[state=checked]:text-[#0D0D0D] data-[state=checked]:border-[#C6FE1E] h-5 w-5 rounded-md"
                  />
                  <Label htmlFor="budgets" className="cursor-pointer text-white font-medium">
                    <AnimatedText text={t('export.budget_progress')} />
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="wallets" 
                    checked={options.includeWallets} 
                    onCheckedChange={(checked) => setOptions({...options, includeWallets: !!checked})}
                    className="bg-[#242425]/80 border border-white/10 data-[state=checked]:bg-[#C6FE1E] data-[state=checked]:text-[#0D0D0D] data-[state=checked]:border-[#C6FE1E] h-5 w-5 rounded-md"
                  />
                  <Label htmlFor="wallets" className="cursor-pointer text-white font-medium">
                    <AnimatedText text={t('export.wallet_balances')} />
                  </Label>
                </div>
              </div>
            </div>
          </form>
          
          <DialogFooter className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 pt-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full"
            >
              <Button 
                onClick={() => setOpen(false)} 
                className="w-full h-12 border border-white/20 hover:bg-white/5 text-white rounded-xl transition-all duration-200 font-medium"
                variant="outline"
              >
                <AnimatedText text={t('export.cancel')} />
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full"
            >
              <Button 
                onClick={handleExport} 
                className="w-full h-12 bg-gradient-to-r from-[#C6FE1E] to-[#A8E016] hover:from-[#B0E018] hover:to-[#98D014] text-[#0D0D0D] font-semibold border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <AnimatedText text={t('export.export')} />
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExportButton;