"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DropdownProps } from "react-day-picker";

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  className?: string;
}

export function DatePicker({ date, setDate, className }: DatePickerProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleCalendarChange = (
    _value: string | number,
    _e: React.ChangeEventHandler<HTMLSelectElement>,
  ) => {
    const _event = {
      target: {
        value: String(_value),
      },
    } as React.ChangeEvent<HTMLSelectElement>;
    _e(_event);
  };

  // Helper function to set date with timezone correction
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Create date with the same year, month and day values, but at noon
      // to avoid timezone issues shifting the day
      const correctedDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        12, 0, 0
      );
      setDate(correctedDate);
    } else {
      setDate(undefined);
    }
    setIsPopoverOpen(false);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal bg-[#242425] border-0 text-white hover:bg-[#333] hover:text-white",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "dd/MM/yyyy") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-[#0D0D0D] border border-[#333]" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            className="rounded-md border-0"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-[#868686] rounded-md w-9 font-medium text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-[#C6FE1E]",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-[#242425] rounded-md",
              day_selected: "bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#C6FE1E] hover:text-[#0D0D0D] font-bold",
              day_today: "bg-[#292929] text-[#C6FE1E]",
              day_outside: "text-[#575757] opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
          <div className="p-3 border-t border-[#242425] flex justify-between">
            <Button 
              variant="ghost" 
              className="text-[#C6FE1E] hover:text-[#C6FE1E] hover:bg-[#242425]"
              onClick={() => handleDateSelect(undefined)}
            >
              Clear
            </Button>
            <Button 
              variant="ghost" 
              className="text-[#C6FE1E] hover:text-[#C6FE1E] hover:bg-[#242425]"
              onClick={() => handleDateSelect(new Date())}
            >
              Today
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 