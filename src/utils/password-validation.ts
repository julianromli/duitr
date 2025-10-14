/**
 * Password Validation Utilities
 * Consistent password validation rules across all authentication flows
 */

export const PASSWORD_CONFIG = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: true,
} as const;

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
  score: number; // 0-100
}

export interface PasswordStrengthCriteria {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  noCommonPatterns: boolean;
}

/**
 * Common weak passwords to check against
 */
const COMMON_WEAK_PASSWORDS = [
  'password', 'Password1', '12345678', 'qwerty123', 'abc123456',
  'password123', 'admin123', 'letmein', 'welcome', 'monkey123'
];

/**
 * Validate password against all security criteria
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const criteria = getPasswordStrengthCriteria(password);
  
  // Check minimum length
  if (!criteria.hasMinLength) {
    errors.push(`Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters long`);
  }
  
  // Check maximum length
  if (password.length > PASSWORD_CONFIG.MAX_LENGTH) {
    errors.push(`Password must not exceed ${PASSWORD_CONFIG.MAX_LENGTH} characters`);
  }
  
  // Check uppercase requirement
  if (PASSWORD_CONFIG.REQUIRE_UPPERCASE && !criteria.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }
  
  // Check lowercase requirement
  if (PASSWORD_CONFIG.REQUIRE_LOWERCASE && !criteria.hasLowercase) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }
  
  // Check number requirement
  if (PASSWORD_CONFIG.REQUIRE_NUMBER && !criteria.hasNumber) {
    errors.push('Password must contain at least one number (0-9)');
  }
  
  // Check special character requirement
  if (PASSWORD_CONFIG.REQUIRE_SPECIAL_CHAR && !criteria.hasSpecialChar) {
    errors.push('Password must contain at least one special character (@$!%*?&#)');
  }
  
  // Check for common weak passwords
  if (!criteria.noCommonPatterns) {
    errors.push('Password is too common. Please choose a stronger password');
  }
  
  // Calculate strength and score
  const strength = calculatePasswordStrength(criteria, password.length);
  const score = calculatePasswordScore(criteria, password.length);
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score
  };
}

/**
 * Get detailed criteria check for password strength indicator
 */
export function getPasswordStrengthCriteria(password: string): PasswordStrengthCriteria {
  return {
    hasMinLength: password.length >= PASSWORD_CONFIG.MIN_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[@$!%*?&#]/.test(password),
    noCommonPatterns: !COMMON_WEAK_PASSWORDS.some(weak => 
      password.toLowerCase().includes(weak.toLowerCase())
    )
  };
}

/**
 * Calculate password strength rating
 */
function calculatePasswordStrength(
  criteria: PasswordStrengthCriteria,
  length: number
): 'weak' | 'fair' | 'good' | 'strong' {
  const score = calculatePasswordScore(criteria, length);
  
  if (score >= 80) return 'strong';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'weak';
}

/**
 * Calculate password score (0-100)
 */
function calculatePasswordScore(
  criteria: PasswordStrengthCriteria,
  length: number
): number {
  let score = 0;
  
  // Length scoring (up to 30 points)
  if (length >= PASSWORD_CONFIG.MIN_LENGTH) {
    score += 20;
    // Bonus for longer passwords
    const extraLength = Math.min(length - PASSWORD_CONFIG.MIN_LENGTH, 12);
    score += extraLength * 0.83; // Up to 10 more points
  }
  
  // Criteria scoring (14 points each = 70 points total)
  if (criteria.hasUppercase) score += 14;
  if (criteria.hasLowercase) score += 14;
  if (criteria.hasNumber) score += 14;
  if (criteria.hasSpecialChar) score += 14;
  if (criteria.noCommonPatterns) score += 14;
  
  return Math.min(Math.round(score), 100);
}

/**
 * Get user-friendly password requirements text
 */
export function getPasswordRequirementsText(): string[] {
  const requirements: string[] = [];
  
  requirements.push(`At least ${PASSWORD_CONFIG.MIN_LENGTH} characters long`);
  
  if (PASSWORD_CONFIG.REQUIRE_UPPERCASE) {
    requirements.push('One uppercase letter');
  }
  
  if (PASSWORD_CONFIG.REQUIRE_LOWERCASE) {
    requirements.push('One lowercase letter');
  }
  
  if (PASSWORD_CONFIG.REQUIRE_NUMBER) {
    requirements.push('One number');
  }
  
  if (PASSWORD_CONFIG.REQUIRE_SPECIAL_CHAR) {
    requirements.push('One special character (@$!%*?&#)');
  }
  
  return requirements;
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const sanitized = sanitizeEmail(email);
  
  if (!sanitized) {
    return { isValid: false, error: 'Email is required' };
  }
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
}
