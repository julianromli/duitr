// Component: ColorPicker
// Description: A reusable color picker component using react-color library
// Provides both predefined colors and custom color selection with preview

import React, { useState } from 'react';
import { CompactPicker, ColorResult } from 'react-color';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  presetColors?: Array<{ value: string; label: string }>;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  className,
  disabled = false,
  presetColors = [
    { value: '#1364FF', label: 'Blue' },
    { value: '#C6FE1E', label: 'Green' },
    { value: '#F59F00', label: 'Yellow' },
    { value: '#FA5252', label: 'Red' },
    { value: '#9775FA', label: 'Purple' },
    { value: '#FD7E14', label: 'Orange' },
    { value: '#20C997', label: 'Teal' },
    { value: '#E91E63', label: 'Pink' },
  ]
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Validate and normalize color value
  const normalizeColor = (color: string): string => {
    if (!color) return '#1364FF';
    if (color.startsWith('#')) return color;
    return `#${color}`;
  };

  const normalizedValue = normalizeColor(value);

  // Check if current color is in presets
  const isPresetColor = presetColors.some(color => color.value === normalizedValue);

  const handleColorChange = (color: ColorResult) => {
    onChange(color.hex);
  };

  const handlePresetColorSelect = (colorValue: string) => {
    onChange(colorValue);
    setIsOpen(false);
  };

  const toggleCustomPicker = () => {
    setShowCustomPicker(!showCustomPicker);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-[#868686] dark:text-gray-400">{label}</Label>
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="w-full justify-start bg-[#242425] border-0 text-white"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-500"
                style={{ backgroundColor: normalizedValue }}
              />
              <div className="flex flex-col">
                <span className="text-sm">{normalizedValue}</span>
                {!isPresetColor && (
                  <span className="text-xs text-[#868686] dark:text-gray-400">Custom Color</span>
                )}
              </div>
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent
          className="w-80 max-w-[90vw] bg-[#1A1A1A] border-none text-white dark:bg-gray-800 dark:text-gray-200"
          align="start"
          side="bottom"
          sideOffset={5}
        >
          <div className="space-y-4">
            {/* Preset Colors */}
            <div>
              <h4 className="text-sm font-medium mb-3">Preset Colors</h4>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handlePresetColorSelect(color.value)}
                    className={cn(
                      "relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 transition-all hover:scale-105 active:scale-95",
                      normalizedValue === color.value
                        ? "border-white dark:border-gray-200 shadow-lg"
                        : "border-transparent hover:border-gray-400 dark:hover:border-gray-500"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  >
                    {normalizedValue === color.value && (
                      <Check
                        className="absolute inset-0 m-auto w-3 h-3 sm:w-4 sm:h-4 text-white drop-shadow-lg"
                        style={{
                          filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))'
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Picker Toggle */}
            <div className="border-t border-gray-600 dark:border-gray-600 pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={toggleCustomPicker}
                className="w-full justify-start text-[#868686] hover:text-white hover:bg-[#333] dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
              >
                <Palette className="w-4 h-4 mr-2" />
                {showCustomPicker ? 'Hide Custom Colors' : 'Choose Custom Color'}
              </Button>
            </div>

            {/* Custom Color Picker */}
            {showCustomPicker && (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <CompactPicker
                    color={normalizedValue}
                    onChange={handleColorChange}
                    colors={[
                      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
                      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
                      '#F1948A', '#85C1E9', '#F4D03F', '#A569BD', '#5DADE2', '#58D68D',
                      '#EC7063', '#3498DB', '#E74C3C', '#9B59B6', '#1ABC9C', '#F39C12',
                      '#2ECC71', '#E67E22', '#34495E', '#95A5A6', '#16A085', '#27AE60',
                      '#2980B9', '#8E44AD', '#2C3E50', '#F1C40F', '#E74C3C', '#ECF0F1'
                    ]}
                  />
                </div>

                {/* Color Preview */}
                <div className="flex items-center gap-3 p-3 bg-[#242425] rounded-lg dark:bg-gray-700">
                  <div
                    className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-500 flex-shrink-0"
                    style={{ backgroundColor: normalizedValue }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Selected Color</p>
                    <p className="text-xs text-[#868686] dark:text-gray-400 truncate">{normalizedValue}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Apply Button */}
            <Button
              onClick={() => setIsOpen(false)}
              className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#B0E018] dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
            >
              Apply Color
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ColorPicker;
