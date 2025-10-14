import React from 'react';
import { 
  getPasswordStrengthCriteria, 
  validatePassword,
  type PasswordStrengthCriteria 
} from '@/utils/password-validation';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  showCriteria?: boolean;
}

export function PasswordStrengthIndicator({ 
  password, 
  showCriteria = true 
}: PasswordStrengthIndicatorProps) {
  const validation = validatePassword(password);
  const criteria = getPasswordStrengthCriteria(password);
  
  if (!password) {
    return null;
  }
  
  return (
    <div className="space-y-3 mt-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn(
            "font-medium",
            validation.strength === 'weak' && "text-red-500",
            validation.strength === 'fair' && "text-orange-500",
            validation.strength === 'good' && "text-yellow-500",
            validation.strength === 'strong' && "text-green-500"
          )}>
            {validation.strength.charAt(0).toUpperCase() + validation.strength.slice(1)}
          </span>
        </div>
        
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300 ease-in-out",
              validation.strength === 'weak' && "bg-red-500 w-1/4",
              validation.strength === 'fair' && "bg-orange-500 w-2/4",
              validation.strength === 'good' && "bg-yellow-500 w-3/4",
              validation.strength === 'strong' && "bg-green-500 w-full"
            )}
          />
        </div>
      </div>
      
      {/* Criteria Checklist */}
      {showCriteria && (
        <div className="space-y-1.5">
          <CriteriaItem 
            met={criteria.hasMinLength} 
            text="At least 8 characters" 
          />
          <CriteriaItem 
            met={criteria.hasUppercase} 
            text="One uppercase letter" 
          />
          <CriteriaItem 
            met={criteria.hasLowercase} 
            text="One lowercase letter" 
          />
          <CriteriaItem 
            met={criteria.hasNumber} 
            text="One number" 
          />
          <CriteriaItem 
            met={criteria.hasSpecialChar} 
            text="One special character (@$!%*?&#)" 
          />
        </div>
      )}
    </div>
  );
}

interface CriteriaItemProps {
  met: boolean;
  text: string;
}

function CriteriaItem({ met, text }: CriteriaItemProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
      ) : (
        <X className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      )}
      <span className={cn(
        "transition-colors",
        met ? "text-foreground" : "text-muted-foreground"
      )}>
        {text}
      </span>
    </div>
  );
}
