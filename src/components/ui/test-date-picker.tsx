"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";

export function TestDatePicker() {
  const [date, setDate] = useState<Date | undefined>(new Date(2025, 2, 27)); // March 27, 2025

  return (
    <div className="flex flex-col space-y-4 p-4 max-w-md mx-auto">
      <DatePicker date={date} setDate={setDate} />
      <Button 
        className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#B0E018] font-semibold py-6 rounded-full"
      >
        Add Transfer
      </Button>
    </div>
  );
} 