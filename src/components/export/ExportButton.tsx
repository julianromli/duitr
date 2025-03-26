import React, { useState } from 'react';
import { FileSpreadsheet, Calendar, Check } from 'lucide-react';
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

const ExportButton = () => {
  const { transactions } = useFinance();
  const { toast } = useToast();
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

  const handleExport = () => {
    try {
      // Determine date range
      let exportStartDate = startDate;
      let exportEndDate = endDate;
      
      if (dateRange === 'all') {
        exportStartDate = undefined;
        exportEndDate = undefined;
      }
      
      // Export data
      exportToExcel(transactions, {
        startDate: exportStartDate,
        endDate: exportEndDate,
        ...options
      });
      
      // Close dialog and show success message
      setOpen(false);
      toast({
        title: 'Export Successful',
        description: 'Your financial data has been exported to Excel',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'An error occurred while exporting your data',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Export Financial Data</DialogTitle>
            <DialogDescription>
              Choose what data you want to export and the date range
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Start Date</Label>
                  <Popover open={calendarOpen === 'start'} onOpenChange={(open) => open ? setCalendarOpen('start') : setCalendarOpen(null)}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'PP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                          setCalendarOpen(null);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="grid gap-2">
                  <Label>End Date</Label>
                  <Popover open={calendarOpen === 'end'} onOpenChange={(open) => open ? setCalendarOpen('end') : setCalendarOpen(null)}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'PP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date);
                          setCalendarOpen(null);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label>Data to Include</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="transactions" 
                    checked={options.includeTransactions} 
                    onCheckedChange={(checked) => setOptions({...options, includeTransactions: !!checked})}
                  />
                  <Label htmlFor="transactions" className="cursor-pointer">Transaction history</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="summary" 
                    checked={options.includeSummary} 
                    onCheckedChange={(checked) => setOptions({...options, includeSummary: !!checked})}
                  />
                  <Label htmlFor="summary" className="cursor-pointer">Summary statistics</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="budgets" 
                    checked={options.includeBudgets} 
                    onCheckedChange={(checked) => setOptions({...options, includeBudgets: !!checked})}
                  />
                  <Label htmlFor="budgets" className="cursor-pointer">Budget progress</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="wallets" 
                    checked={options.includeWallets} 
                    onCheckedChange={(checked) => setOptions({...options, includeWallets: !!checked})}
                  />
                  <Label htmlFor="wallets" className="cursor-pointer">Wallet balances</Label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExportButton; 