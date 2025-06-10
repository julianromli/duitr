// Test component to verify date formatting changes
// Created to test the new MM/DD/YYYY, H:MM AM/PM format implementation

import React from 'react';
import { format, parseISO } from 'date-fns';

const DateFormatTest: React.FC = () => {
  // Test date strings (similar to what would come from the database)
  const testDates = [
    '2025-06-07T19:35:00.000Z', // ISO string with time
    '2025-06-07T07:35:00.000Z', // Morning time
    '2025-12-25T23:59:00.000Z', // End of day
    '2025-01-01T00:00:00.000Z', // Start of year
  ];

  // Format date function (same as in our components)
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = parseISO(dateString);
      // Format as MM/DD/YYYY, H:MM AM/PM
      return format(date, 'MM/dd/yyyy, h:mm a');
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return dateString;
    }
  };

  return (
    <div className="p-6 bg-card rounded-lg border">
      <h2 className="text-xl font-bold mb-4">Date Format Test</h2>
      <p className="text-muted-foreground mb-4">
        Testing the new MM/DD/YYYY, H:MM AM/PM format
      </p>
      
      <div className="space-y-3">
        {testDates.map((dateString, index) => (
          <div key={index} className="flex justify-between items-center p-3 bg-muted rounded">
            <span className="text-sm text-muted-foreground font-mono">
              {dateString}
            </span>
            <span className="font-medium">
              {formatDate(dateString)}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-primary/10 rounded border border-primary/20">
        <h3 className="font-semibold text-primary mb-2">Expected Format:</h3>
        <p className="text-sm">MM/DD/YYYY, H:MM AM/PM</p>
        <p className="text-sm text-muted-foreground mt-1">
          Example: 06/07/2025, 7:35 PM
        </p>
      </div>
    </div>
  );
};

export default DateFormatTest;
