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
          <button className="p-2 bg-[#242425] rounded-full hover:bg-[#333]">
            <Download size={20} className="text-[#C6FE1E]" />
          </button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[425px] bg-[#1A1A1A] border-[#2e2e2e] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Export Transactions
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-[#868686]">Date Range</Label>
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="bg-[#242425] border-0 text-white">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent className="bg-[#242425] border-0 text-white">
                  <SelectItem value="all" className="hover:bg-[#333] focus:bg-[#333]">All Time</SelectItem>
                  <SelectItem value="30days" className="hover:bg-[#333] focus:bg-[#333]">Last 30 Days</SelectItem>
                  <SelectItem value="90days" className="hover:bg-[#333] focus:bg-[#333]">Last 90 Days</SelectItem>
                  <SelectItem value="thisYear" className="hover:bg-[#333] focus:bg-[#333]">This Year</SelectItem>
                  <SelectItem value="custom" className="hover:bg-[#333] focus:bg-[#333]">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-[#868686]">Start Date</Label>
                  <Popover open={calendarOpen === 'start'} onOpenChange={(open) => open ? setCalendarOpen('start') : setCalendarOpen(null)}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-medium bg-[#242425] border-0 text-white hover:bg-[#333]">
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'PP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#242425] border-0">
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
                
                <div className="grid gap-2">
                  <Label className="text-[#868686]">End Date</Label>
                  <Popover open={calendarOpen === 'end'} onOpenChange={(open) => open ? setCalendarOpen('end') : setCalendarOpen(null)}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-medium bg-[#242425] border-0 text-white hover:bg-[#333]">
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'PP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#242425] border-0">
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
            
            <div className="grid gap-2">
              <Label className="text-[#868686]">Data to Include</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="transactions" 
                    checked={options.includeTransactions} 
                    onCheckedChange={(checked) => setOptions({...options, includeTransactions: !!checked})}
                    className="bg-[#242425] border-[#868686] data-[state=checked]:bg-[#C6FE1E] data-[state=checked]:text-[#0D0D0D]"
                  />
                  <Label htmlFor="transactions" className="cursor-pointer text-white">Transaction history</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="summary" 
                    checked={options.includeSummary} 
                    onCheckedChange={(checked) => setOptions({...options, includeSummary: !!checked})}
                    className="bg-[#242425] border-[#868686] data-[state=checked]:bg-[#C6FE1E] data-[state=checked]:text-[#0D0D0D]"
                  />
                  <Label htmlFor="summary" className="cursor-pointer text-white">Summary statistics</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="budgets" 
                    checked={options.includeBudgets} 
                    onCheckedChange={(checked) => setOptions({...options, includeBudgets: !!checked})}
                    className="bg-[#242425] border-[#868686] data-[state=checked]:bg-[#C6FE1E] data-[state=checked]:text-[#0D0D0D]"
                  />
                  <Label htmlFor="budgets" className="cursor-pointer text-white">Budget progress</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="wallets" 
                    checked={options.includeWallets} 
                    onCheckedChange={(checked) => setOptions({...options, includeWallets: !!checked})}
                    className="bg-[#242425] border-[#868686] data-[state=checked]:bg-[#C6FE1E] data-[state=checked]:text-[#0D0D0D]"
                  />
                  <Label htmlFor="wallets" className="cursor-pointer text-white">Wallet balances</Label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setOpen(false)} 
              className="bg-[#242425] text-white hover:bg-[#333] border-0"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              className="bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#B0E018] font-semibold border-0 gap-2"
            >
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