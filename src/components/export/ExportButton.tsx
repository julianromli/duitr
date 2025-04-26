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
            <Download size={18} className="text-primary" />
            <span className="text-sm font-medium text-foreground">
              {t('export.export_to_excel')}
            </span>
          </button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {t('export.title')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('export.date_range')}</Label>
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="bg-secondary border-0 text-foreground">
                  <SelectValue placeholder={t('export.date_range')} />
                </SelectTrigger>
                <SelectContent className="bg-secondary border-0 text-foreground">
                  <SelectItem value="all" className="hover:bg-secondary/80 focus:bg-secondary/80">{t('export.all_time')}</SelectItem>
                  <SelectItem value="30days" className="hover:bg-secondary/80 focus:bg-secondary/80">{t('export.last_30_days')}</SelectItem>
                  <SelectItem value="90days" className="hover:bg-secondary/80 focus:bg-secondary/80">{t('export.last_90_days')}</SelectItem>
                  <SelectItem value="thisYear" className="hover:bg-secondary/80 focus:bg-secondary/80">{t('export.this_year')}</SelectItem>
                  <SelectItem value="custom" className="hover:bg-secondary/80 focus:bg-secondary/80">{t('export.custom_range')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">{t('export.start_date')}</Label>
                  <Popover open={calendarOpen === 'start'} onOpenChange={(open) => open ? setCalendarOpen('start') : setCalendarOpen(null)}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-medium bg-secondary border-0 text-foreground hover:bg-secondary/80">
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'PP') : t('export.pick_date')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-secondary border-0">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                          setCalendarOpen(null);
                        }}
                        initialFocus
                        className="bg-secondary text-foreground"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">{t('export.end_date')}</Label>
                  <Popover open={calendarOpen === 'end'} onOpenChange={(open) => open ? setCalendarOpen('end') : setCalendarOpen(null)}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-medium bg-secondary border-0 text-foreground hover:bg-secondary/80">
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'PP') : t('export.pick_date')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-secondary border-0">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date);
                          setCalendarOpen(null);
                        }}
                        initialFocus
                        className="bg-secondary text-foreground"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
            
            <div>
              <Label className="text-muted-foreground">{t('export.data_to_include')}</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="transactions" 
                    checked={options.includeTransactions} 
                    onCheckedChange={(checked) => setOptions({...options, includeTransactions: !!checked})}
                    className="bg-secondary border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <Label htmlFor="transactions" className="cursor-pointer text-foreground">{t('export.transaction_history')}</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="summary" 
                    checked={options.includeSummary} 
                    onCheckedChange={(checked) => setOptions({...options, includeSummary: !!checked})}
                    className="bg-secondary border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <Label htmlFor="summary" className="cursor-pointer text-foreground">{t('export.summary_statistics')}</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="budgets" 
                    checked={options.includeBudgets} 
                    onCheckedChange={(checked) => setOptions({...options, includeBudgets: !!checked})}
                    className="bg-secondary border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <Label htmlFor="budgets" className="cursor-pointer text-foreground">{t('export.budget_progress')}</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="wallets" 
                    checked={options.includeWallets} 
                    onCheckedChange={(checked) => setOptions({...options, includeWallets: !!checked})}
                    className="bg-secondary border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <Label htmlFor="wallets" className="cursor-pointer text-foreground">{t('export.wallet_balances')}</Label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setOpen(false)} 
              className="bg-secondary text-foreground hover:bg-secondary/80 border-0"
            >
              {t('export.cancel')}
            </Button>
            <Button 
              onClick={handleExport} 
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold border-0 gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {t('export.export')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExportButton; 