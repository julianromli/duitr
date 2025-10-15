"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker, useNavigation } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  ...props
}: CalendarProps) {
  const defaultClassNames = {
    months: "relative flex flex-col sm:flex-row gap-4",
    month: "w-full",
    month_caption: "flex h-9 justify-center px-1",
    caption_label: "hidden",
    nav: "absolute top-0 flex w-full justify-between z-10",
    button_previous: cn(
      buttonVariants({ variant: "ghost" }),
      "size-9 text-muted-foreground/80 hover:text-foreground p-0",
    ),
    button_next: cn(
      buttonVariants({ variant: "ghost" }),
      "size-9 text-muted-foreground/80 hover:text-foreground p-0",
    ),
    weekday: "size-9 p-0 text-xs font-medium text-muted-foreground/80",
    day_button:
      "relative flex size-9 items-center justify-center whitespace-nowrap rounded-lg p-0 text-foreground outline-offset-2 group-[[data-selected]:not(.range-middle)]:[transition-property:color,background-color,border-radius,box-shadow] group-[[data-selected]:not(.range-middle)]:duration-150 focus:outline-none group-data-[disabled]:pointer-events-none focus-visible:z-10 hover:bg-accent group-data-[selected]:bg-primary hover:text-foreground group-data-[selected]:text-primary-foreground group-data-[disabled]:text-foreground/30 group-data-[disabled]:line-through group-data-[outside]:text-foreground/30 group-data-[outside]:group-data-[selected]:text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 group-[.range-start:not(.range-end)]:rounded-e-none group-[.range-end:not(.range-start)]:rounded-s-none group-[.range-middle]:rounded-none group-data-[selected]:group-[.range-middle]:bg-accent group-data-[selected]:group-[.range-middle]:text-foreground",
    day: "group size-9 px-0 text-sm",
    range_start: "range-start",
    range_end: "range-end",
    range_middle: "range-middle",
    today:
      "*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-10 *:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-primary [&[data-selected]:not(.range-middle)>*]:after:bg-background [&[data-disabled]>*]:after:bg-foreground/30 *:after:transition-colors",
    outside: "text-muted-foreground data-selected:bg-accent/50 data-selected:text-muted-foreground",
    hidden: "invisible",
    week_number: "size-9 p-0 text-xs font-medium text-muted-foreground/80",
  };

  const mergedClassNames: typeof defaultClassNames = Object.keys(defaultClassNames).reduce(
    (acc, key) => ({
      ...acc,
      [key]: classNames?.[key as keyof typeof classNames]
        ? cn(
            defaultClassNames[key as keyof typeof defaultClassNames],
            classNames[key as keyof typeof classNames],
          )
        : defaultClassNames[key as keyof typeof defaultClassNames],
    }),
    {} as typeof defaultClassNames,
  );

  const defaultComponents = {
    Chevron: (props: any) => {
      if (props.orientation === "left") {
        return <ChevronLeft size={16} strokeWidth={2} {...props} aria-hidden="true" />;
      }
      return <ChevronRight size={16} strokeWidth={2} {...props} aria-hidden="true" />;
    },
  };

  const mergedComponents = {
    ...defaultComponents,
    ...userComponents,
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-fit", className)}
      classNames={mergedClassNames}
      components={{
        ...mergedComponents,
        Caption: ({ displayMonth }) => <CustomCaption displayMonth={displayMonth} />
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

// Custom caption component with month and year selectors
function CustomCaption({ displayMonth }: { displayMonth: Date }) {
  const { goToMonth, nextMonth, previousMonth } = useNavigation();
  
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const currentYear = new Date().getFullYear();
  const yearRange = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  
  const month = displayMonth.getMonth();
  const year = displayMonth.getFullYear();
  
  const handleMonthChange = (monthValue: string) => {
    const newMonth = parseInt(monthValue);
    const newDate = new Date(displayMonth);
    newDate.setMonth(newMonth);
    goToMonth(newDate);
  };
  
  const handleYearChange = (yearValue: string) => {
    const newYear = parseInt(yearValue);
    const newDate = new Date(displayMonth);
    newDate.setFullYear(newYear);
    goToMonth(newDate);
  };
  
  return (
    <div className="flex justify-center items-center gap-1 px-2">
      <Select
        value={month.toString()}
        onValueChange={handleMonthChange}
      >
        <SelectTrigger className="h-8 w-[110px] border-0 bg-[#242425] text-white text-xs px-2 py-0">
          <SelectValue>{months[month]}</SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-[#0D0D0D] border-[#333] text-white max-h-[200px] z-[9999]">
          {months.map((monthName, index) => (
            <SelectItem key={monthName} value={index.toString()} className="text-sm hover:bg-[#242425] cursor-pointer">
              {monthName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select
        value={year.toString()}
        onValueChange={handleYearChange}
      >
        <SelectTrigger className="h-8 w-[80px] border-0 bg-[#242425] text-white text-xs px-2 py-0">
          <SelectValue>{year}</SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-[#0D0D0D] border-[#333] text-white max-h-[200px] z-[9999]">
          {yearRange.map((yearValue) => (
            <SelectItem key={yearValue} value={yearValue.toString()} className="text-sm hover:bg-[#242425] cursor-pointer">
              {yearValue}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { Calendar };
