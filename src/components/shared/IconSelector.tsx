// Component: IconSelector
// Description: Reusable icon selector component for category management
// Provides consistent icon selection UI across the application

import React from 'react';
import { 
  Circle, Square, Triangle, Star, Heart, Diamond, Home, Car, Plane, 
  ShoppingCart, Coffee, Utensils, Gamepad, Music, Book, Briefcase, 
  GraduationCap, Stethoscope, Dumbbell, Gift, Camera, Smartphone, 
  Laptop, Tv, DollarSign, Package, Film, CreditCard, Zap, User, 
  Pill, Baby, BusFront, Shirt, Coins, Building2, LineChart, Wallet,
  ArrowLeftRight, ShoppingBag, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Available icons for categories
export const availableIcons = [
  { name: 'circle', icon: Circle },
  { name: 'square', icon: Square },
  { name: 'triangle', icon: Triangle },
  { name: 'star', icon: Star },
  { name: 'heart', icon: Heart },
  { name: 'diamond', icon: Diamond },
  { name: 'home', icon: Home },
  { name: 'car', icon: Car },
  { name: 'plane', icon: Plane },
  { name: 'shopping-cart', icon: ShoppingCart },
  { name: 'coffee', icon: Coffee },
  { name: 'utensils', icon: Utensils },
  { name: 'gamepad', icon: Gamepad },
  { name: 'music', icon: Music },
  { name: 'book', icon: Book },
  { name: 'briefcase', icon: Briefcase },
  { name: 'graduation-cap', icon: GraduationCap },
  { name: 'stethoscope', icon: Stethoscope },
  { name: 'dumbbell', icon: Dumbbell },
  { name: 'gift', icon: Gift },
  { name: 'camera', icon: Camera },
  { name: 'smartphone', icon: Smartphone },
  { name: 'laptop', icon: Laptop },
  { name: 'tv', icon: Tv },
  { name: 'dollar-sign', icon: DollarSign },
  { name: 'package', icon: Package },
  { name: 'film', icon: Film },
  { name: 'credit-card', icon: CreditCard },
  { name: 'zap', icon: Zap },
  { name: 'user', icon: User },
  { name: 'pill', icon: Pill },
  { name: 'baby', icon: Baby },
  { name: 'bus-front', icon: BusFront },
  { name: 'shirt', icon: Shirt },
  { name: 'coins', icon: Coins },
  { name: 'building2', icon: Building2 },
  { name: 'line-chart', icon: LineChart },
  { name: 'wallet', icon: Wallet },
  { name: 'arrow-left-right', icon: ArrowLeftRight },
  { name: 'shopping-bag', icon: ShoppingBag },
  { name: 'help-circle', icon: HelpCircle },
];

// Icon name mapping for compatibility with existing data
export const iconNameMap: Record<string, string> = {
  'Circle': 'circle',
  'Square': 'square',
  'Triangle': 'triangle',
  'Star': 'star',
  'Heart': 'heart',
  'Diamond': 'diamond',
  'Home': 'home',
  'Car': 'car',
  'Plane': 'plane',
  'ShoppingCart': 'shopping-cart',
  'Coffee': 'coffee',
  'Utensils': 'utensils',
  'Gamepad': 'gamepad',
  'Music': 'music',
  'Book': 'book',
  'Briefcase': 'briefcase',
  'GraduationCap': 'graduation-cap',
  'Stethoscope': 'stethoscope',
  'Dumbbell': 'dumbbell',
  'Gift': 'gift',
  'Camera': 'camera',
  'Smartphone': 'smartphone',
  'Laptop': 'laptop',
  'Tv': 'tv',
  'DollarSign': 'dollar-sign',
  'Package': 'package',
  'Film': 'film',
  'CreditCard': 'credit-card',
  'Zap': 'zap',
  'User': 'user',
  'Pill': 'pill',
  'Baby': 'baby',
  'BusFront': 'bus-front',
  'Shirt': 'shirt',
  'Coins': 'coins',
  'Building2': 'building2',
  'LineChart': 'line-chart',
  'Wallet': 'wallet',
  'ArrowLeftRight': 'arrow-left-right',
  'ShoppingBag': 'shopping-bag',
  'HelpCircle': 'help-circle',
};

// Reverse mapping for getting component names from kebab-case
export const reverseIconNameMap: Record<string, string> = Object.fromEntries(
  Object.entries(iconNameMap).map(([key, value]) => [value, key])
);

interface IconSelectorProps {
  selectedIcon: string;
  onIconChange: (iconName: string) => void;
  variant?: 'grid' | 'dropdown';
  className?: string;
  label?: string;
}

export const getIconComponent = (iconName: string) => {
  // Handle both kebab-case and PascalCase icon names
  const normalizedName = iconNameMap[iconName] || iconName;
  const iconData = availableIcons.find(icon => icon.name === normalizedName);
  return iconData ? iconData.icon : Circle;
};

const IconSelector: React.FC<IconSelectorProps> = ({
  selectedIcon,
  onIconChange,
  variant = 'grid',
  className = '',
  label = 'Icon'
}) => {
  const renderIcon = (iconName: string) => {
    const IconComponent = getIconComponent(iconName);
    return <IconComponent className="h-4 w-4" />;
  };

  if (variant === 'dropdown') {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label htmlFor="icon">{label}</Label>
        <Select
          value={selectedIcon}
          onValueChange={onIconChange}
        >
          <SelectTrigger className="bg-[#2A3435] border-[#2A3435] text-white">
            <SelectValue placeholder="Select icon">
              <div className="flex items-center">
                {renderIcon(selectedIcon)}
                <span className="ml-2">{selectedIcon}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-[#2A3435] border-[#2A3435] text-white max-h-[300px] overflow-y-auto">
            {availableIcons.map(({ name, icon: IconComponent }) => (
              <SelectItem key={name} value={name} className="text-white">
                <div className="flex items-center">
                  <IconComponent className="h-4 w-4" />
                  <span className="ml-2">{name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="pt-2">
          <div className="bg-[#C6FE1E] w-10 h-10 flex items-center justify-center rounded-full">
            {renderIcon(selectedIcon)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-foreground">{label}</Label>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {availableIcons.map(({ name, icon: IconComponent }) => (
          <Button
            key={name}
            type="button"
            variant={selectedIcon === name ? "default" : "outline"}
            size="sm"
            className={`h-10 w-10 p-0 ${
              selectedIcon === name 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card text-card-foreground hover:bg-primary hover:text-primary-foreground'
            } border-border`}
            onClick={() => onIconChange(name)}
          >
            <IconComponent className="h-4 w-4" />
          </Button>
        ))}
      </div>
    </div>
  );
};

export default IconSelector;